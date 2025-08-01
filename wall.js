// wall.js

import { saveToSupabase, deleteFromSupabase, saveToLocal } from './storage.js';
import { escapeHtml, formatDateLocal, timeAgo, generateId, showAlert } from './util.js';
import { notify } from './notifications.js';

// These should be injected by main.js/init, but we always lookup live DOM
let wallPosts = [];
let currentUserKey = 'familyCurrentUser';
// prevent attaching listeners multiple times when main() runs again
let wallListenersInitialized = false;

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
function getPostTypeSelect() {
  return document.getElementById('postTypeSelect');
}
function getPollFields() {
  return document.getElementById('pollFields');
}
function getPollOptionsContainer() {
  return document.getElementById('pollOptions');
}
function getAddPollOptionBtn() {
  return document.getElementById('addPollOptionBtn');
}
function getPollMultipleCheckbox() {
  return document.getElementById('pollMultiple');
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

    let mainHtml = `<div class="wall-post-text">${safeText}</div>`;
    if (post.poll) {
      const currentUser = localStorage.getItem(currentUserKey);
      const totalVotes = post.poll.options.reduce((s,o)=>s+((o.votes||[]).length),0);
      const userVoted = post.poll.options.some(o=>(o.votes||[]).includes(currentUser));
      const optionsHtml = post.poll.options.map((o,idx)=>{
        const votes = (o.votes||[]).length;
        const percent = totalVotes ? Math.round(votes*100/totalVotes) : 0;
        if (userVoted) {
          return `<li>${escapeHtml(o.text)} <div class="poll-bar"><span class="poll-bar-fill" style="width:${percent}%"></span></div> <span class="poll-count">${votes}</span>${(o.votes||[]).includes(currentUser)?' ✅':''}</li>`;
        }
        return `<li><button class="poll-vote-btn" data-idx="${idx}">${escapeHtml(o.text)}</button></li>`;
      }).join('');
      mainHtml = `<div class="poll-question">${safeText}</div><ul class="poll-options">${optionsHtml}</ul>`;
    }

    li.innerHTML = `
      <strong>${escapeHtml(post.member)}</strong>
      <span class="wall-post-date" title="${formatDateLocal(post.date)}">(${timeAgo(post.date)})${post.edited ? ' (edited)' : ''}</span>
      ${mainHtml}
      <div class="wall-post-actions" aria-label="Post actions">
        <button class="reaction-btn" aria-label="Thumbs up" data-reaction="👍">👍 ${post.reactions && post.reactions['👍'] ? post.reactions['👍'] : 0}</button>
        <button class="reaction-btn" aria-label="Heart" data-reaction="❤️">❤️ ${post.reactions && post.reactions['❤️'] ? post.reactions['❤️'] : 0}</button>
        <button class="reaction-btn" aria-label="Laugh" data-reaction="😂">😂 ${post.reactions && post.reactions['😂'] ? post.reactions['😂'] : 0}</button>
        <button class="reply-btn" aria-label="Reply to post">Reply</button>
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
  if (wallListenersInitialized) {
    return;
  }

  const wallPostsList = getWallPostsList();
  const addWallPostBtn = getAddWallPostBtn();
  const newWallPostInput = getNewWallPostInput();
  const postTypeSelect = getPostTypeSelect();
  const pollFields = getPollFields();
  const addPollOptionBtn = getAddPollOptionBtn();
  const pollOptionsContainer = getPollOptionsContainer();
  const contentSearch = getContentSearch();

  if (postTypeSelect && pollFields) {
    postTypeSelect.addEventListener('change', () => {
      const isPoll = postTypeSelect.value === 'poll';
      pollFields.hidden = !isPoll;
      newWallPostInput.placeholder = isPoll ? 'Poll question...' : 'Write something...';
    });
  }

  if (addPollOptionBtn && pollOptionsContainer) {
    addPollOptionBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'poll-option-input';
      input.placeholder = `Option ${pollOptionsContainer.children.length + 1}`;
      pollOptionsContainer.appendChild(input);
    });
  }

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
      } else if (btn.classList.contains('poll-vote-btn')) {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        handlePollVote(postIndex, idx, contentSearch ? contentSearch.value : '');
      } else if (btn.classList.contains('delete-btn')) {
        if (confirm('Delete this post?')) {
          wallPosts.splice(postIndex, 1);
          const ok = await deleteFromSupabase('wall_posts', postId);
          if (!ok) showAlert('Post could not be removed from server.');
          saveToLocal('wall_posts', wallPosts);
          renderWallPosts(contentSearch ? contentSearch.value : '');
        }
      }
    });
  }

  if (addWallPostBtn) {
    addWallPostBtn.addEventListener('click', () => {
      const text = getNewWallPostInput().value.trim();
      const postTypeSel = getPostTypeSelect();
      const type = postTypeSel ? postTypeSel.value : 'text';
      if (!text) {
        showAlert(type === 'poll' ? 'Please enter a poll question.' : 'Please enter something to post.');
        return;
      }
      const currentUser = localStorage.getItem(currentUserKey);
      if (!currentUser) {
        showAlert('Please select your user first.');
        return;
      }
      const base = {
        id: generateId(),
        member: currentUser,
        text,
        date: new Date().toISOString(),
        reactions: {},
        edited: false,
        userReactions: {},
        replies: []
      };
      if (type === 'poll') {
        const optsContainer = getPollOptionsContainer();
        const optionInputs = optsContainer ? Array.from(optsContainer.querySelectorAll('input')) : [];
        const options = optionInputs.map(i => i.value.trim()).filter(v => v);
        if (options.length < 2) {
          showAlert('Please provide at least two options.');
          return;
        }
        base.poll = {
          multiple: getPollMultipleCheckbox() ? getPollMultipleCheckbox().checked : false,
          options: options.map(t => ({ id: generateId(), text: t, votes: [] }))
        };
        optionInputs.forEach((inp, idx) => { if (idx > 1) inp.remove(); else inp.value = ''; });
      }
      wallPosts.unshift(base);
      saveToSupabase('wall_posts', base);
      saveToLocal('wall_posts', wallPosts);
      getNewWallPostInput().value = '';
      renderWallPosts(getContentSearch() ? getContentSearch().value : '');
      notify('wall', 'New wall post', `${currentUser}: ${text}`);
    });
  }

  // (Optional) Add instant search filtering
  if (contentSearch) {
    contentSearch.addEventListener('input', () => {
      renderWallPosts(contentSearch.value);
    });
  }

  wallListenersInitialized = true;
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

function handlePollVote(postIndex, optionIdx, filterText) {
  const currentUser = localStorage.getItem(currentUserKey);
  if (!currentUser) {
    showAlert('Please select your user first.');
    return;
  }
  const post = wallPosts[postIndex];
  if (!post || !post.poll) return;
  const poll = post.poll;
  poll.options.forEach((o, idx) => {
    o.votes = o.votes || [];
    if (!poll.multiple && idx !== optionIdx) {
      const i = o.votes.indexOf(currentUser);
      if (i !== -1) o.votes.splice(i, 1);
    }
  });
  const opt = poll.options[optionIdx];
  if (!opt) return;
  const existing = opt.votes.indexOf(currentUser);
  if (existing === -1) {
    opt.votes.push(currentUser);
  } else if (poll.multiple) {
    opt.votes.splice(existing, 1);
  }
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
