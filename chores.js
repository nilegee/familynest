// chores.js

import { showAlert, normalizeBadgeArray, generateId } from "./util.js";
import { renderScoreboard } from './scoreboard.js';
import { adminUsers } from './data.js';
import { saveToSupabase } from './storage.js';

let _chores = [];
let _badges = {};
let _userPoints = {};
let _completedChores = {};
let _badgeTypes = [];
let _onSave = () => {};
let _pointLogs = [];
let showDailyOnlyCheckbox;
let addChoreBtn;
let choreDescInput;
let choreAssignedTo;
let choreDueInput;
let choreDailyCheckbox;

export function setChoresData({
  chores,
  badges,
  userPoints,
  completedChores,
  badgeTypes,
  pointLogs = [],
  onSave // callback: (updatedChores, updatedCompletedChores, updatedBadges, updatedUserPoints) => void
}) {
  _chores = chores;
  _badges = badges;
  _userPoints = userPoints;
  _completedChores = completedChores;
  _badgeTypes = badgeTypes || [];
  _pointLogs = pointLogs;
  _onSave = typeof onSave === "function" ? onSave : () => {};
}

// ---- MAIN RENDERING ----

export function renderChores(filterText = '', dailyOnly = false) {
  const list = document.getElementById('choresList');
  if (!list) return;
  list.innerHTML = '';

  let filtered = Array.isArray(_chores) ? [..._chores] : [];
  if (dailyOnly) filtered = filtered.filter(item => item.daily);
  const currentUser = localStorage.getItem('familyCurrentUser');
  const isAdmin = adminUsers.includes(currentUser);
  if (!isAdmin) {
    filtered = filtered.filter(item => item.assignedTo === currentUser || item.assignedTo === 'All');
  }
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

    // Admin-only controls
    if (isAdmin) {
      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.title = 'Edit chore';
      editBtn.className = 'chore-edit-btn';
      editBtn.onclick = () => editChore(item.id);
      li.appendChild(editBtn);

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
    _userPoints[item.assignedTo] = (_userPoints[item.assignedTo] || 0) + delta;
    const admin = localStorage.getItem('familyCurrentUser');
    _pointLogs.push({
      id: generateId(),
      user_id: item.assignedTo,
      admin_id: admin,
      points_changed: delta,
      reason: `Chore: ${item.desc}`,
      timestamp: new Date().toISOString()
    });
    saveToSupabase('point_logs', _pointLogs);
    if (_userPoints[item.assignedTo] % 5 === 0 && checkbox.checked) {
      grantBadge(item.assignedTo, 'star-helper', 'Completed 5 chores');
    }
  }

  // Persist changes (API, localStorage, Supabase, etc.)
  _onSave(_chores, _completedChores, _badges, _userPoints);
  renderScoreboard();
}

// ---- ADD/DELETE CHORE ----

export function addChore({ desc, assignedTo, due, daily }) {
  if (!desc) {
    showAlert('Description required.');
    return;
  }
  if (!assignedTo) {
    showAlert('Please assign the chore.');
    return;
  }
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

export function editChore(id) {
  const chore = _chores.find(ch => ch.id === id);
  if (!chore) return;
  const newDesc = prompt('Edit description', chore.desc);
  if (newDesc === null) return;
  const newAssignee = prompt('Assign to', chore.assignedTo);
  if (newAssignee === null) return;
  let newDue = chore.due;
  if (!chore.daily) {
    const duePrompt = prompt('Due date', chore.due || '');
    if (duePrompt === null) return;
    newDue = duePrompt;
  }
  chore.desc = newDesc.trim() || chore.desc;
  chore.assignedTo = newAssignee.trim() || chore.assignedTo;
  if (!chore.daily) chore.due = newDue.trim();
  _onSave(_chores, _completedChores, _badges, _userPoints);
  renderChores();
}

export function setupChoresUI({
  addBtnRef,
  descInputRef,
  assignedToRef,
  dueInputRef,
  dailyCheckboxRef,
  showDailyOnlyRef
} = {}) {
  addChoreBtn = addBtnRef || document.getElementById('addChoreBtn');
  choreDescInput = descInputRef || document.getElementById('choreDesc');
  choreAssignedTo = assignedToRef || document.getElementById('choreAssignedTo');
  choreDueInput = dueInputRef || document.getElementById('choreDue');
  choreDailyCheckbox = dailyCheckboxRef || document.getElementById('choreDaily');
  showDailyOnlyCheckbox = showDailyOnlyRef || document.getElementById('showDailyOnly');

  addChoreBtn?.addEventListener('click', () => {
    const desc = choreDescInput?.value.trim();
    if (!desc) {
      showAlert('Please enter a chore description.');
      return;
    }
    addChore({
      desc,
      assignedTo: choreAssignedTo?.value || 'All',
      due: choreDueInput?.value || '',
      daily: !!choreDailyCheckbox?.checked
    });
    if (choreDescInput) choreDescInput.value = '';
    if (choreDueInput) choreDueInput.value = '';
    if (choreDailyCheckbox) choreDailyCheckbox.checked = false;
  });

  showDailyOnlyCheckbox?.addEventListener('change', () => {
    renderChores('', showDailyOnlyCheckbox.checked);
  });
}

// ---- BADGE LOGIC ----

function grantBadge(user, badgeId, note = '') {
  const badge = _badgeTypes.find(b => b.id === badgeId);
  if (!badge) return;
  _badges[user] = normalizeBadgeArray(_badges[user]);
  const newBadge = {
    badgeId,
    name: badge.name,
    icon: badge.icon,
    dateGiven: new Date().toISOString(),
    note,
    id: '_' + Math.random().toString(36).slice(2, 11)
  };
  _badges[user].unshift(newBadge);
  _onSave(_chores, _completedChores, _badges, _userPoints);
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
