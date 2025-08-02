// scoreboard.js

import { saveToSupabase, logAdminAction } from './storage.js';
import { adminUsers } from './data.js';
import { showAlert } from './util.js';

let _userPoints = {};
let _badges = {};
let _completedChores = {};
let _sortBy = 'points';

export function setScoreboardData({ userPoints, badges, completedChores }) {
  _userPoints = userPoints;
  _badges = badges;
  _completedChores = completedChores;
}

export function renderScoreboard() {
  const scoreboardList = document.getElementById('scoreboardList');
  if (!scoreboardList) return;

  scoreboardList.innerHTML = '';

  const names = Object.keys(_userPoints);
  names.sort((a, b) => {
    if (_sortBy === 'name') return a.localeCompare(b);
    if (_sortBy === 'chores') {
      return (_completedChores[b] || 0) - (_completedChores[a] || 0);
    }
    return (_userPoints[b] || 0) - (_userPoints[a] || 0);
  });

  const medals = ['🥇', '🥈', '🥉'];
  names.forEach((name, idx) => {
    let rawBadges = _badges[name];
    let allBadges = [];
    if (Array.isArray(rawBadges)) {
      allBadges = rawBadges.slice();
    } else if (typeof rawBadges === 'string') {
      try {
        const parsed = JSON.parse(rawBadges);
        if (Array.isArray(parsed)) allBadges = parsed.slice();
      } catch (e) {
        allBadges = [];
      }
    } else if (rawBadges && typeof rawBadges === 'object') {
      allBadges = Object.values(rawBadges);
    }
    allBadges.sort((a,b)=>{
      return new Date(b.dateGiven) - new Date(a.dateGiven);
    });
    const badgeHtml = allBadges.slice(0,3)
      .map(b => `<span title="${b.name}${b.note ? ' - ' + b.note : ''}">${b.icon}</span>`)
      .join('');
    const allTitles = allBadges.map(b => `${b.icon} ${b.name}${b.note ? ' - '+b.note : ''}`).join('\n');
    const li = document.createElement('li');
    if (idx < 3) li.classList.add(`top-${idx + 1}`);
    li.innerHTML = `<span>${idx < 3 ? medals[idx] : ''} ${name}</span>
      <span>${_userPoints[name] || 0} pts | ${_completedChores[name] || 0} chores</span>
      <span class="scoreboard-badges" title="${allTitles}">${badgeHtml}</span>`;
    scoreboardList.appendChild(li);
  });
}

export async function resetScoreboard() {
  const user = localStorage.getItem('familyCurrentUser');
  if (!adminUsers.includes(user)) {
    showAlert('Only admins can reset the scoreboard.');
    return { success: false };
  }

  const names = Object.keys(_userPoints);
  names.forEach(name => {
    _userPoints[name] = 0;
    _badges[name] = [];
    _completedChores[name] = 0;
  });

  await Promise.all([
    saveToSupabase('user_points', _userPoints),
    saveToSupabase('badges', _badges),
    saveToSupabase('completed_chores', _completedChores)
  ]);

  renderScoreboard();
  await logAdminAction('reset scoreboard');
  showAlert('Scoreboard reset.');
  return { success: true };
}

function handleResetClick() {
  if (confirm('Are you sure you want to reset the scoreboard?')) {
    resetScoreboard();
  }
}

function handleSortChange(e) {
  _sortBy = e.target.value;
  renderScoreboard();
}

export function setupScoreboardListeners() {
  const resetBtn = document.getElementById('resetScoreboardBtn');
  if (resetBtn && !resetBtn.dataset.bound) {
    resetBtn.addEventListener('click', handleResetClick);
    resetBtn.dataset.bound = 'true';
  }

  const sortSelect = document.getElementById('scoreSortBy');
  if (sortSelect && !sortSelect.dataset.bound) {
    sortSelect.addEventListener('change', handleSortChange);
    sortSelect.dataset.bound = 'true';
  }
}
