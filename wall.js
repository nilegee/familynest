// wall.js

import { saveToSupabase, deleteFromSupabase, saveToLocal, supabase, logAdminAction } from './storage.js';
import { escapeHtml, formatDateLocal, timeAgo, generateId, showAlert } from './util.js';
import { adminUsers } from './data.js';
import { notify } from './notifications.js';

// These should be injected by main.js/init, but we always lookup live DOM
let wallPosts = [];
let currentUserKey = 'familyCurrentUser';
// prevent attaching listeners multiple times when main() runs again
let wallListenersInitialized = false;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const POSTS_PER_PAGE = 10;
let currentPage = 1;
let currentFilterText = '';
let hasMorePosts = false;

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
function getCreatePollBtn() {
  return document.getElementById('togglePollBtn');
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
function getPollHideResultsCheckbox() {
  return document.getElementById('pollHideResults');
}
function getPhotoUploadBtn() {
  return document.getElementById('photoUploadBtn');
}
function getPhotoInput() {
  return document.getElementById('wallPhoto');
}
function getPhotoPreview() {
  return document.getElementById('wallPhotoPreview');
}

function autoResizeTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatPostText(text) {
  if (!text) return '';
  const escaped = escapeHtml(text);
  return escaped
    .replace(/(^|\s)@([a-zA-Z0-9_]+)/g, '$1<span class="mention">@$2</span>')
    .replace(/(^|\s)#([a-zA-Z0-9_]+)/g, '$1<span class="hashtag">#$2</span>');
}

// Main render
export function renderWallPosts(filterText = '', reset = true) {
  const wallPostsList = getWallPostsList();
  if (!wallPostsList) return; // DOM not ready yet!
  if (reset) {
    wallPostsList.innerHTML = '';
    currentPage = 1;
    currentFilterText = filterText;
  } else {
    filterText = currentFilterText;
  }

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

  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const end = currentPage * POSTS_PER_PAGE;
  const toRender = filteredPosts.slice(start, end);

  const currentUser = localStorage.getItem(currentUserKey);
  toRender.forEach(post => {
    const li = document.createElement('li');
    li.classList.add('wall-post');
    li.setAttribute('data-id', post.id);
    li.setAttribute('tabindex', '0');
    const safeText = formatPostText(post.text);

    const repliesArr = Array.isArray(post.replies) ? post.replies : [];
    const replies = repliesArr.map(r => {
      const rAvatar = (window.profilesData && window.profilesData[r.member] && window.profilesData[r.member].avatar) || 'icons/default-avatar.svg';
      return `
      <li data-id="${r.id}">
        <div class="wall-post-header">
          <img src="${rAvatar}" alt="${escapeHtml(r.member)} avatar" class="reply-avatar">
          <strong class="wall-post-user">${escapeHtml(r.member)}</strong>
          <span class="wall-post-date" title="${formatDateLocal(r.date)}">${timeAgo(r.date)}</span>
        </div>
        <div class="wall-post-text">${formatPostText(r.text)}</div>
      </li>`;
    }).join('');

    let mainHtml;
    if (post.poll) {
      const currentUser = localStorage.getItem(currentUserKey);
      const totalVotes = post.poll.options.reduce((s,o)=>s+((o.votes||[]).length),0);
      const userVoted = post.poll.options.some(o=>(o.votes||[]).includes(currentUser));
      const showResults = userVoted || !post.poll.hideResults;
      const optionsHtml = post.poll.options.map((o,idx)=>{
        const votes = (o.votes||[]).length;
        const percent = totalVotes ? Math.round(votes*100/totalVotes) : 0;
        const chosen = (o.votes||[]).includes(currentUser);
        let inner = `<span class="poll-option-text">${escapeHtml(o.text)}</span>`;
        if (showResults) {
          inner += ` <div class="poll-bar"><span class="poll-bar-fill" data-percent="${percent}"></span></div> <span class="poll-count">${votes}</span>`;
        }
        if (chosen) inner += ' ✅';
        return `<li><button class="poll-vote-btn" data-idx="${idx}">${inner}</button></li>`;
      }).join('');
      const typeText = post.poll.multiple ? 'Multiple choice' : 'Single choice';
      const totalVotesHtml = showResults ? `<div class="poll-total">${totalVotes} vote${totalVotes===1?'':'s'}</div>` : '';
      mainHtml = `<div class="poll-question">${safeText}</div><div class="poll-type">${typeText}</div><ul class="poll-options">${optionsHtml}</ul>${totalVotesHtml}`;
    } else {
      mainHtml = `<div class="wall-post-text">${safeText}</div>`;
    }
    if (post.photo) {
      mainHtml += `<img src="${post.photo}" alt="Attached photo" class="wall-post-image">`;
    }
    const avatar = (window.profilesData && window.profilesData[post.member] && window.profilesData[post.member].avatar) || 'icons/default-avatar.svg';
    const headerHtml = `
      <div class="wall-post-header">
        <img src="${avatar}" alt="${escapeHtml(post.member)} avatar" class="wall-post-avatar">
        <strong class="wall-post-user">${escapeHtml(post.member)}</strong>
        <span class="wall-post-date" title="${formatDateLocal(post.date)}">${timeAgo(post.date)}${post.edited ? ' (edited)' : ''}</span>
      </div>`;

    const reactionTypes = [
      { emoji: '👍', label: 'Thumbs up' },
      { emoji: '❤️', label: 'Heart' },
      { emoji: '😂', label: 'Laugh' }
    ];
    const reactionBtns = reactionTypes.map(r => {
      const count = post.reactions && post.reactions[r.emoji] ? post.reactions[r.emoji] : 0;
      const reactedUsers = Object.entries(post.userReactions || {})
        .filter(([, arr]) => Array.isArray(arr) && arr.includes(r.emoji))
        .map(([u]) => u);
      const title = reactedUsers.length ? reactedUsers.join(', ') : 'No reactions yet';
      const active = currentUser && reactedUsers.includes(currentUser);
      return `<button class="reaction-btn${active ? ' active' : ''}" aria-label="${r.label}" data-reaction="${r.emoji}" title="${escapeHtml(title)}">${r.emoji} ${count}</button>`;
    }).join('');

    const canModify = currentUser === post.member || adminUsers.includes(currentUser);
    const actionBtns = `
      <button class="reply-btn" aria-label="Reply to post" title="Reply"><i class="fa-solid fa-reply"></i></button>
      ${canModify ? `<button class="edit-btn" aria-label="Edit post" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
      <button class="delete-btn" aria-label="Delete post" title="Delete"><i class="fa-solid fa-trash"></i></button>` : ''}`;

    li.innerHTML = `
      ${headerHtml}
      ${mainHtml}
      <div class="wall-post-actions" aria-label="Post actions">
        <div class="reaction-group">${reactionBtns}</div>
        <div class="action-group">${actionBtns}</div>
      </div>
      ${replies ? `<ul class="reply-list">${replies}</ul>` : ''}
    `;
    wallPostsList.appendChild(li);
  });

  hasMorePosts = end < filteredPosts.length;

  requestAnimationFrame(() => {
    wallPostsList.querySelectorAll('.poll-bar-fill').forEach(el => {
      const pct = el.getAttribute('data-percent');
      if (pct !== null) el.style.width = pct + '%';
    });
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
  const pollFields = getPollFields();
  const addPollOptionBtn = getAddPollOptionBtn();
  const pollOptionsContainer = getPollOptionsContainer();
  const contentSearch = getContentSearch();
  const createPollBtn = getCreatePollBtn();
  const pollHideResults = getPollHideResultsCheckbox();
  const photoUploadBtn = getPhotoUploadBtn();
  const photoInput = getPhotoInput();
  const photoPreview = getPhotoPreview();

  function updatePostBtnState() {
    const text = newWallPostInput ? newWallPostInput.value.trim() : '';
    let valid = !!text;
    const isPoll = pollFields && !pollFields.hidden;
    if (isPoll) {
      const optionInputs = pollOptionsContainer ? Array.from(pollOptionsContainer.querySelectorAll('input')) : [];
      const options = optionInputs.map(i => i.value.trim()).filter(v => v);
      if (options.length < 2) valid = false;
    }
    if (photoInput && photoInput.files[0]) {
      const file = photoInput.files[0];
      if (!file.type.startsWith('image/') || file.size > MAX_IMAGE_SIZE) valid = false;
    }
    if (addWallPostBtn) addWallPostBtn.disabled = !valid;
  }

  if (createPollBtn && pollFields) {
    createPollBtn.addEventListener('click', () => {
      const active = !pollFields.hidden;
      pollFields.hidden = active;
      createPollBtn.textContent = active ? 'Create Poll' : 'Cancel Poll';
      newWallPostInput.placeholder = active ? 'Share your thoughts or create a poll…' : 'Poll question...';
      updatePostBtnState();
    });
  }

  if (addPollOptionBtn && pollOptionsContainer) {
    addPollOptionBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'poll-option-input';
      input.placeholder = `Option ${pollOptionsContainer.children.length + 1}`;
      input.addEventListener('input', updatePostBtnState);
      pollOptionsContainer.appendChild(input);
    });
    Array.from(pollOptionsContainer.querySelectorAll('input')).forEach(inp => inp.addEventListener('input', updatePostBtnState));
  }

  if (newWallPostInput) {
    newWallPostInput.addEventListener('input', () => {
      autoResizeTextarea(newWallPostInput);
      updatePostBtnState();
    });
    autoResizeTextarea(newWallPostInput);
  }

  if (photoUploadBtn && photoInput) {
    photoUploadBtn.addEventListener('click', () => photoInput.click());
  }

  if (photoInput && photoPreview) {
    photoInput.addEventListener('change', () => {
      const file = photoInput.files[0];
      if (!file) {
        photoPreview.hidden = true;
        updatePostBtnState();
        return;
      }
      if (!file.type.startsWith('image/')) {
        showAlert('Only image files are allowed.');
        photoInput.value = '';
        photoPreview.hidden = true;
        updatePostBtnState();
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        showAlert('Image must be smaller than 2 MB.');
        photoInput.value = '';
        photoPreview.hidden = true;
        updatePostBtnState();
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        photoPreview.src = e.target.result;
        photoPreview.hidden = false;
      };
      reader.readAsDataURL(file);
      updatePostBtnState();
    });
  }

  if (wallPostsList) {
    wallPostsList.addEventListener('click', async e => {
      const li = e.target.closest('li[data-id]');
      if (!li) return;
      const postId = li.getAttribute('data-id');
      const postIndex = wallPosts.findIndex(p => p.id === postId);
      if (postIndex === -1) return;
      const post = wallPosts[postIndex];

      const btn = e.target.closest('button');
      if (!btn) return;

      if (btn.classList.contains('reaction-btn')) {
        handleReaction(postIndex, btn.getAttribute('data-reaction'), contentSearch ? contentSearch.value : '');
      } else if (btn.classList.contains('reply-btn')) {
        handleReply(postIndex, contentSearch ? contentSearch.value : '');
      } else if (btn.classList.contains('edit-btn')) {
        const currentUser = localStorage.getItem(currentUserKey);
        if (post.member !== currentUser && !adminUsers.includes(currentUser)) return;
        enterWallPostEditMode(postId, contentSearch ? contentSearch.value : '');
      } else if (btn.classList.contains('poll-vote-btn')) {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        handlePollVote(postIndex, idx, contentSearch ? contentSearch.value : '');
      } else if (btn.classList.contains('delete-btn')) {
        const currentUser = localStorage.getItem(currentUserKey);
        if (post.member !== currentUser && !adminUsers.includes(currentUser)) return;
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
    addWallPostBtn.addEventListener('click', async () => {
      const text = getNewWallPostInput().value.trim();
      const isPoll = pollFields && !pollFields.hidden;
      if (!text) {
        showAlert(isPoll ? 'Please enter a poll question.' : 'Please enter something to post.');
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
      if (isPoll) {
        const optsContainer = getPollOptionsContainer();
        const optionInputs = optsContainer ? Array.from(optsContainer.querySelectorAll('input')) : [];
        const options = optionInputs.map(i => i.value.trim()).filter(v => v);
        if (options.length < 2) {
          showAlert('Please provide at least two options.');
          return;
        }
        base.poll = {
          multiple: getPollMultipleCheckbox() ? getPollMultipleCheckbox().checked : false,
          hideResults: pollHideResults ? pollHideResults.checked : false,
          options: options.map(t => ({ id: generateId(), text: t, votes: [] }))
        };
        optionInputs.forEach((inp, idx) => { if (idx > 1) inp.remove(); else inp.value = ''; });
      }
      if (photoInput && photoInput.files[0]) {
        base.photo = await readFileAsDataURL(photoInput.files[0]);
      }
      wallPosts.unshift(base);
      addWallPostBtn.disabled = true;
      const original = addWallPostBtn.innerHTML;
      addWallPostBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
      await saveToSupabase('wall_posts', base);
      saveToLocal('wall_posts', wallPosts);
      addWallPostBtn.innerHTML = original;
      addWallPostBtn.disabled = false;
      getNewWallPostInput().value = '';
      autoResizeTextarea(getNewWallPostInput());
      if (photoInput) photoInput.value = '';
      if (photoPreview) photoPreview.hidden = true;
      pollFields.hidden = true;
      if (createPollBtn) createPollBtn.textContent = 'Create Poll';
      if (getPollMultipleCheckbox()) getPollMultipleCheckbox().checked = false;
      if (pollHideResults) pollHideResults.checked = false;
      newWallPostInput.placeholder = 'Share your thoughts or create a poll…';
      renderWallPosts(getContentSearch() ? getContentSearch().value : '');
      notify('wall', 'New wall post', `${currentUser}: ${text}`);
      updatePostBtnState();
    });
  }

  // (Optional) Add instant search filtering
  if (contentSearch) {
    contentSearch.addEventListener('input', () => {
      renderWallPosts(contentSearch.value);
    });
  }

  window.addEventListener('scroll', () => {
    if (!hasMorePosts) return;
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
      currentPage++;
      renderWallPosts(undefined, false);
    }
  });

  updatePostBtnState();
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
  const avatar = (window.profilesData && window.profilesData[post.member] && window.profilesData[post.member].avatar) || 'icons/default-avatar.svg';
  li.innerHTML = `
    <div class="wall-post-header">
      <img src="${avatar}" alt="${escapeHtml(post.member)} avatar" class="wall-post-avatar">
      <strong class="wall-post-user">${escapeHtml(post.member)}</strong>
      <span class="wall-post-date" title="${formatDateLocal(post.date)}">Editing</span>
    </div>
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

// Remove photo file from Supabase storage if stored there
async function removePhotoFile(url) {
  if (!url || url.startsWith('data:')) return;
  try {
    const parts = url.split('/storage/v1/object/public/')[1];
    if (!parts) return;
    const slash = parts.indexOf('/');
    if (slash === -1) return;
    const bucket = parts.slice(0, slash);
    const path = parts.slice(slash + 1);
    if (supabase) {
      await supabase.storage.from(bucket).remove([path]);
    }
  } catch (e) {
    console.warn('Failed to remove photo file', e);
  }
}

// Cleanup photos older than given days (0 = all)
export async function cleanupPhotos(days) {
  const admin = localStorage.getItem(currentUserKey);
  if (!adminUsers.includes(admin)) return 0;
  const cutoff = days > 0 ? Date.now() - days * 86400000 : 0;
  let removed = 0;
  for (const post of wallPosts) {
    if (post.photo) {
      const postTime = new Date(post.date).getTime();
      if (!cutoff || postTime < cutoff) {
        await removePhotoFile(post.photo);
        delete post.photo;
        removed++;
      }
    }
  }
  await saveToSupabase('wall_posts', wallPosts, { replace: true });
  saveToLocal('wall_posts', wallPosts);
  renderWallPosts();
  await logAdminAction(`cleanup photos ${days ? `older than ${days} days` : 'all'}`);
  return removed;
}
