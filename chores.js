// chores.js

import { renderScoreboard } from './scoreboard.js';

let _chores = [];
let _badges = {};
let _userPoints = {};
let _completedChores = {};
let _badgeTypes = [];
let _onSave = () => {};

export function setChoresData({
  chores,
  badges,
  userPoints,
  completedChores,
  badgeTypes,
  onSave // callback: (updatedChores, updatedCompletedChores, updatedBadges, updatedUserPoints) => void
}) {
  _chores = chores;
  _badges = badges;
  _userPoints = userPoints;
  _completedChores = completedChores;
  _badgeTypes = badgeTypes || [];
  _onSave = typeof onSave === "function" ? onSave : () => {};
}

// ---- MAIN RENDERING ----

export function renderChores(filterText = '', dailyOnly = false) {
  const list = document.getElementById('choresList');
  if (!list) return;
  list.innerHTML = '';

  let filtered = Array.isArray(_chores) ? [..._chores] : [];
  if (dailyOnly) filtered = filtered.filter(item => item.daily);
  if (filterText) {
    const f = filterText.toLowerCase();
    filtered = filtered.filter(
      item =>
        item.desc.toLowerCase().includes(f) ||
        (item.assignedTo && item.assignedTo.toLowerCase().includes(f))
    );
  }

  filtered.forEach(item => {
    const li = document.createElement('li');
    li.setAttribute('data-id', item.id);
    li.classList.toggle('completed', !!item.completed);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!item.completed;
    checkbox.addEventListener('change', () => handleChoreCheck(item, checkbox, li));

    const desc = document.createElement('span');
    desc.className = 'chore-desc';
    desc.innerHTML = `${item.desc}${item.daily ? ' <span class="daily-label">(Daily)</span>' : ''}`;

    const assignee = document.createElement('span');
    assignee.className = 'chore-assignee';
    assignee.textContent = item.assignedTo;

    li.appendChild(checkbox);
    li.appendChild(desc);
    li.appendChild(assignee);

    if (!item.daily) {
      const dueSpan = document.createElement('span');
      dueSpan.className = 'chore-due';
      dueSpan.textContent = item.due || '';
      li.appendChild(dueSpan);
    }

    // Admin delete button (if you want)
    if (window.localStorage.getItem('familyCurrentUser') === 'Ghassan' /*or admin logic*/) {
      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑️';
      delBtn.title = 'Delete chore';
      delBtn.className = 'chore-delete-btn';
      delBtn.onclick = () => deleteChore(item.id);
      li.appendChild(delBtn);
    }

    list.appendChild(li);
  });
}

// ---- CHORE CHECK LOGIC ----

function handleChoreCheck(item, checkbox, li) {
  item.completed = checkbox.checked;
  li.classList.toggle('completed', item.completed);

  // Update completedChores count per user
  if (item.assignedTo && item.assignedTo !== 'All') {
    const delta = checkbox.checked ? 1 : -1;
    _completedChores[item.assignedTo] = (_completedChores[item.assignedTo] || 0) + delta;
    if (_completedChores[item.assignedTo] < 0) _completedChores[item.assignedTo] = 0;

    // Give point & badge if every 5 chores
    _userPoints[item.assignedTo] = (_userPoints[item.assignedTo] || 0) + (checkbox.checked ? 1 : -1);
    if (_userPoints[item.assignedTo] % 5 === 0 && checkbox.checked) {
      grantBadge(item.assignedTo, 'super-helper');
    }
  }

  // Persist changes (API, localStorage, Supabase, etc.)
  _onSave(_chores, _completedChores, _badges, _userPoints);
  renderScoreboard();
}

// ---- ADD/DELETE CHORE ----

export function addChore({ desc, assignedTo, due, daily }) {
  const id = '_' + Math.random().toString(36).slice(2, 11);
  const newChore = {
    id,
    desc,
    assignedTo,
    due: daily ? '' : due,
    daily: !!daily,
    completed: false
  };
  _chores.push(newChore);
  _onSave(_chores, _completedChores, _badges, _userPoints);
  renderChores();
}

export function deleteChore(id) {
  const idx = _chores.findIndex(ch => ch.id === id);
  if (idx !== -1) {
    _chores.splice(idx, 1);
    _onSave(_chores, _completedChores, _badges, _userPoints);
    renderChores();
  }
}

// ---- BADGE LOGIC ----

function grantBadge(user, badgeId) {
  const badge = _badgeTypes.find(b => b.id === badgeId);
  if (!badge) return;
  _badges[user] = _badges[user] || [];
  if (!_badges[user].some(b => b.id === badgeId)) {
    _badges[user].push(badge);
    _onSave(_chores, _completedChores, _badges, _userPoints);
  }
}

// ---- Utility: For main.js to get current chores state
export function getChoresData() {
  return {
    chores: _chores,
    badges: _badges,
    userPoints: _userPoints,
    completedChores: _completedChores
  };
}
