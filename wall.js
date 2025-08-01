// wall.js

import { saveToSupabase, deleteFromSupabase, saveToLocal } from './storage.js';
import { escapeHtml, formatDateLocal, timeAgo, generateId, showAlert } from './util.js';

// These should be injected by main.js/init, but we always lookup live DOM
let wallPosts = [];
let currentUserKey = 'familyCurrentUser';

export function setWallData({ wallPostsRef = [], userKey = 'familyCurrentUser' }) {
  wallPosts = wallPostsRef;
  currentUserKey = userKey;
}

// Helper to always get the DOM element fresh
function getWallPostsList() {
  return document.getElementById('wallPostsList');
}
function getContentSearch() {
  return document.getElementById('contentSearch');
}
function getNewWallPostInput() {
  return document.getElementById('newWallPost');
}
function getAddWallPostBtn() {
  return document.getElementById('addWallPostBtn');
}

// Main render
export function renderWallPosts(filterText = '') {
  const wallPostsList = getWallPostsList();
  if (!wallPostsList) return; // DOM not ready yet!
  wallPostsList.innerHTML = '';

  const posts = Array.isArray(wallPosts)
    ? [...wallPosts].sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];
  let filteredPosts = posts;
  if (filterText) {
    const f = filterText.toLowerCase();
    filteredPosts = posts.filter(p =>
      p.text.toLowerCase().includes(f) || p.member.toLowerCase().includes(f)
    );
  }
  filteredPosts.forEach(post => {
    const li = document.createElement('li');
    li.setAttribute('data-id', post.id);
    li.setAttribute('tabindex', '0');
    const safeText = escapeHtml(post.text);

    const repliesArr = Array.isArray(post.replies) ? post.replies : [];
    const replies = repliesArr.map(r => `
      <li data-id="${r.id}">
        <strong>${escapeHtml(r.member)}</strong>
        <span class="wall-post-date" title="${formatDateLocal(r.date)}">(${timeAgo(r.date)})</span>
        <div class="wall-post-text">${escapeHtml(r.text)}</div>
      </li>`).join('');

    li.innerHTML = `
      <strong>${escapeHtml(post.member)}</strong>
      <span class="wall-post-date" title="${formatDateLocal(post.date)}">(${timeAgo(post.date)})${post.edited ? ' (edited)' : ''}</span>
      <div class="wall-post-text">${safeText}</div>
      <div class="wall-post-actions" aria-label="Post actions">
        <button class="like-btn reaction-btn" aria-label="Like post" data-reaction="👍">Like ${post.reactions && post.reactions['👍'] ? post.reactions['👍'] : 0}</button>
        <button class="reply-btn" aria-label="Reply to post">Reply</button>
        <button class="reaction-btn" aria-label="Heart reaction" data-reaction="❤️">❤️ ${post.reactions && post.reactions['❤️'] ? post.reactions['❤️'] : 0}</button>
        <button class="reaction-btn" aria-label="Laugh reaction" data-reaction="😂">😂 ${post.reactions && post.reactions['😂'] ? post.reactions['😂'] : 0}</button>
        <button class="edit-btn" aria-label="Edit post"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="delete-btn" aria-label="Delete post"><i class="fa-solid fa-trash"></i></button>
      </div>
      ${replies ? `<ul class="reply-list">${replies}</ul>` : ''}
    `;
    wallPostsList.appendChild(li);
  });
}

// All events setup in one go, after DOMContentLoaded
export function setupWallListeners() {
  const wallPostsList = getWallPostsList();
  const addWallPostBtn = getAddWallPostBtn();
  const newWallPostInput = getNewWallPostInput();
  const contentSearch = getContentSearch();

  if (wallPostsList) {
    wallPostsList.addEventListener('click', async e => {
      const li = e.target.closest('li[data-id]');
      if (!li) return;
      const postId = li.getAttribute('data-id');
      const postIndex = wallPosts.findIndex(p => p.id === postId);
      if (postIndex === -1) return;

      const btn = e.target.closest('button');
      if (!btn) return;

      if (btn.classList.contains('reaction-btn')) {
        handleReaction(postIndex, btn.getAttribute('data-reaction'), contentSearch ? contentSearch.value : '');
      } else if (btn.classList.contains('reply-btn')) {
        handleReply(postIndex, contentSearch ? contentSearch.value : '');
      } else if (btn.classList.contains('edit-btn')) {
        enterWallPostEditMode(postId, contentSearch ? contentSearch.value : '');
      } else if (btn.classList.contains('delete-btn')) {
        if (confirm('Delete this post?')) {
          wallPosts.splice(postIndex, 1);
          await deleteFromSupabase('wall_posts', postId);
          saveToLocal('wall_posts', wallPosts);
          renderWallPosts(contentSearch ? contentSearch.value : '');
        }
      }
    });
  }

  if (addWallPostBtn) {
    addWallPostBtn.addEventListener('click', () => {
      const text = getNewWallPostInput().value.trim();
      if (!text) {
        showAlert('Please enter something to post.');
        return;
      }
      const currentUser = localStorage.getItem(currentUserKey);
      if (!currentUser) {
        showAlert('Please select your user first.');
        return;
      }
      const newPost = {
        id: generateId(),
        member: currentUser,
        text,
        date: new Date().toISOString(),
        reactions: {},
        edited: false,
        userReactions: {},
        replies: []
      };
      wallPosts.unshift(newPost);
      saveToSupabase('wall_posts', newPost);
      saveToLocal('wall_posts', wallPosts);
      getNewWallPostInput().value = '';
      renderWallPosts(getContentSearch() ? getContentSearch().value : '');
    });
  }

  // (Optional) Add instant search filtering
  if (contentSearch) {
    contentSearch.addEventListener('input', () => {
      renderWallPosts(contentSearch.value);
    });
  }
}

function handleReaction(postIndex, reaction, filterText) {
  const currentUser = localStorage.getItem(currentUserKey);
  if (!currentUser) {
    showAlert('Please select your user first.');
    return;
  }
  const post = wallPosts[postIndex];
  post.reactions = post.reactions || {};
  post.userReactions = post.userReactions || {};
  const userReacts = post.userReactions[currentUser] || [];
  const idx = userReacts.indexOf(reaction);
  if (idx !== -1) {
    userReacts.splice(idx, 1);
    post.reactions[reaction] = Math.max(0, (post.reactions[reaction] || 1) - 1);
  } else {
    userReacts.push(reaction);
    post.reactions[reaction] = (post.reactions[reaction] || 0) + 1;
  }
  post.userReactions[currentUser] = userReacts;
  saveToSupabase('wall_posts', post);
  saveToLocal('wall_posts', wallPosts);
  renderWallPosts(filterText);
}

function handleReply(postIndex, filterText) {
  const currentUser = localStorage.getItem(currentUserKey);
  if (!currentUser) {
    showAlert('Please select your user first.');
    return;
  }
  const replyText = prompt('Enter your reply:');
  if (!replyText) return;
  const post = wallPosts[postIndex];
  post.replies = post.replies || [];
  post.replies.push({
    id: generateId(),
    member: currentUser,
    text: replyText.trim(),
    date: new Date().toISOString()
  });
  saveToSupabase('wall_posts', post);
  saveToLocal('wall_posts', wallPosts);
  renderWallPosts(filterText);
}

function enterWallPostEditMode(postId, filterText) {
  const wallPostsList = getWallPostsList();
  const li = wallPostsList ? wallPostsList.querySelector(`li[data-id="${postId}"]`) : null;
  if (!li) return;
  const post = wallPosts.find(p => p.id === postId);
  if (!post) return;

  li.innerHTML = `
    <strong>${escapeHtml(post.member)}</strong>
    <span class="wall-post-date" title="${formatDateLocal(post.date)}">(Editing)</span>
    <textarea class="wall-post-edit-text" aria-label="Edit post text">${escapeHtml(post.text)}</textarea>
    <div class="wall-post-edit-area">
      <button class="save-edit-btn">Save</button>
      <button class="cancel-edit-btn">Cancel</button>
    </div>
  `;
  const textarea = li.querySelector('.wall-post-edit-text');
  const saveBtn = li.querySelector('.save-edit-btn');
  const cancelBtn = li.querySelector('.cancel-edit-btn');

  saveBtn.addEventListener('click', () => {
    const newText = textarea.value.trim();
    if (!newText) {
      showAlert('Post text cannot be empty.');
      return;
    }
    post.text = newText;
    post.edited = true;
    post.date = new Date().toISOString();
    saveToSupabase('wall_posts', post);
    saveToLocal('wall_posts', wallPosts);
    renderWallPosts(filterText);
  });

  cancelBtn.addEventListener('click', () => {
    renderWallPosts(filterText);
  });

  textarea.focus();
}
