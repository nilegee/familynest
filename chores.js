// chores.js

import { escapeHtml, generateId, showAlert } from './util.js';
import { saveToSupabase } from './storage.js';
import { badges, badgeTypes, userPoints, completedChores, chores, renderScoreboard } from './globals.js';

export function renderChores(filterText = '', dailyOnly = false) {
  const list = document.getElementById('choresList');
  list.innerHTML = '';
  let filtered = Array.isArray(chores) ? chores : [];
  if (dailyOnly) filtered = filtered.filter(item => item.daily);
  if (filterText) {
    const f = filterText.toLowerCase();
    filtered = filtered.filter(item =>
      item.desc.toLowerCase().includes(f) ||
      (item.assignedTo && item.assignedTo.toLowerCase().includes(f))
    );
  }
  filtered.forEach(item => {
    const li = document.createElement('li');
    li.setAttribute('data-id', item.id);
    li.classList.toggle('completed', item.completed);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.completed;
    checkbox.addEventListener('change', () => {
      item.completed = checkbox.checked;
      li.classList.toggle('completed', item.completed);
      saveToSupabase('chores', chores);
      if (item.assignedTo && item.assignedTo !== 'All') {
        const delta = checkbox.checked ? 1 : -1;
        completedChores[item.assignedTo] = (completedChores[item.assignedTo] || 0) + delta;
        if (completedChores[item.assignedTo] < 0) completedChores[item.assignedTo] = 0;
        saveToSupabase('completed_chores', completedChores);
        renderScoreboard();
      }
    });

    const desc = document.createElement('span');
    desc.className = 'chore-desc';
    desc.innerHTML = `${escapeHtml(item.desc)}${item.daily ? ' <span class="daily-label">(Daily)</span>' : ''}`;

    const assignee = document.createElement('span');
    assignee.className = 'chore-assignee';
    assignee.textContent = item.assignedTo;

    li.appendChild(checkbox);
    li.appendChild(desc);
    li.appendChild(assignee);

    if (!item.daily) {
      const dueSpan = document.createElement('span');
      dueSpan.className = 'chore-due';
      dueSpan.textContent = item.due;
      li.appendChild(dueSpan);
    }

    list.appendChild(li);
  });
}

export function incrementPoints(user, amount = 1) {
  userPoints[user] = (userPoints[user] || 0) + amount;
  saveToSupabase('user_points', userPoints);
  renderScoreboard();
}

export function grantBadge(user, badgeId) {
  const badge = badgeTypes.find(b => b.id === badgeId);
  if (!badge) return;
  badges[user] = badges[user] || [];
  if (!badges[user].some(b => b.id === badgeId)) {
    badges[user].push(badge);
    saveToSupabase('badges', badges);
    renderScoreboard();
  }
}

// Add chore logic (admin only, call this in your main.js setup)
export function setupAddChoreBtn() {
  const addChoreBtn = document.getElementById('addChoreBtn');
  addChoreBtn.addEventListener('click', () => {
    const desc = document.getElementById('choreDesc').value.trim();
    const assignedTo = document.getElementById('choreAssignedTo').value;
    const due = document.getElementById('choreDue').value;
    const daily = document.getElementById('choreDaily').checked;
    if (!desc || (!daily && !due)) {
      showAlert('Please enter a description' + (daily ? '' : ' and due date') + '.');
      return;
    }
    const id = generateId();
    chores.push({ id, desc, assignedTo, due: daily ? '' : due, daily, completed: false });
    saveToSupabase('chores', chores);
    renderChores(document.getElementById('contentSearch').value);
    if (assignedTo !== 'All') {
      incrementPoints(assignedTo);
      if ((userPoints[assignedTo] || 0) % 5 === 0) {
        grantBadge(assignedTo, 'super-helper');
      }
    }
    // incrementNotification(); // Optionally call from notification.js if needed
  });
}
