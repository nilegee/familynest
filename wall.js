// wall.js

import { saveToSupabase } from './storage.js';
import { escapeHtml, formatDateLocal, timeAgo, generateId, showAlert } from './util.js';

// These should be injected by main.js/init
let wallPosts = [];
let wallPostsList;
let contentSearch;
let newWallPostInput;
let addWallPostBtn;
let currentUserKey;

export function setupWall({
  wallPostsRef,
  wallPostsListRef,
  contentSearchRef,
  newWallPostInputRef,
  addWallPostBtnRef,
  currentUserKeyRef
}) {
  wallPosts = wallPostsRef;
  wallPostsList = wallPostsListRef;
  contentSearch = contentSearchRef;
  newWallPostInput = newWallPostInputRef;
  addWallPostBtn = addWallPostBtnRef;
  currentUserKey = currentUserKeyRef;
  // Set up events
  setupWallListeners();
  renderWallPosts();
}

export function renderWallPosts(filterText = '') {
  wallPostsList.innerHTML = '';
  const posts = Array.isArray(wallPosts) ? wallPosts : [];
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
        <button class="like-btn reaction-btn" aria-label="Like post" data-reaction="👍">Like ${post.reactions['👍'] || 0}</button>
        <button class="reply-btn" aria-label="Reply to post">Reply</button>
        <button class="reaction-btn" aria-label="Heart reaction" data-reaction="❤️">❤️ ${post.reactions['❤️'] || 0}</button>
        <button class="reaction-btn" aria-label="Laugh reaction" data-reaction="😂">😂 ${post.reactions['😂'] || 0}</button>
        <button class="edit-btn" aria-label="Edit post"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="delete-btn" aria-label="Delete post"><i class="fa-solid fa-trash"></i></button>
      </div>
      ${replies ? `<ul class="reply-list">${replies}</ul>` : ''}
    `;
    wallPostsList.appendChild(li);
  });
}

function setupWallListeners() {
  if (!wallPostsList || !addWallPostBtn) return;
  // Post actions
  wallPostsList.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    const postId = li.getAttribute('data-id');
    const postIndex = wallPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    if (e.target.classList.contains('reaction-btn')) {
      handleReaction(postIndex, e.target.getAttribute('data-reaction'));
    } else if (e.target.classList.contains('reply-btn')) {
      handleReply(postIndex);
    } else if (e.target.classList.contains('edit-btn')) {
      enterWallPostEditMode(postId);
    } else if (e.target.classList.contains('delete-btn')) {
      if (confirm('Delete this post?')) {
        wallPosts.splice(postIndex, 1);
        saveToSupabase('wall_posts', wallPosts);
        renderWallPosts(contentSearch.value);
      }
    }
  });

  addWallPostBtn.addEventListener('click', () => {
    const text = newWallPostInput.value.trim();
    if (!text) {
      showAlert('Please enter something to post.');
      return;
    }
    const currentUser = localStorage.getItem(currentUserKey);
    if (!currentUser) {
      showAlert('Please select your user first.');
      return;
    }
    wallPosts.unshift({
      id: generateId(),
      member: currentUser,
      text,
      date: new Date().toISOString(),
      reactions: {},
      edited: false,
      userReactions: {},
      replies: []
    });
    saveToSupabase('wall_posts', wallPosts);
    newWallPostInput.value = '';
    renderWallPosts(contentSearch.value);
  });
}

function handleReaction(postIndex, reaction) {
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
  saveToSupabase('wall_posts', wallPosts);
  renderWallPosts(contentSearch.value);
}

function handleReply(postIndex) {
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
  saveToSupabase('wall_posts', wallPosts);
  renderWallPosts(contentSearch.value);
}

function enterWallPostEditMode(postId) {
  const li = wallPostsList.querySelector(`li[data-id="${postId}"]`);
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
    saveToSupabase('wall_posts', wallPosts);
    renderWallPosts(contentSearch.value);
  });

  cancelBtn.addEventListener('click', () => {
    renderWallPosts(contentSearch.value);
  });

  textarea.focus();
}
