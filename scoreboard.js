// scoreboard.js

import { saveToSupabase } from './storage.js';

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
    const badgeHtml = (_badges[name] || [])
      .map(b => `<span title="${b.name}">${b.icon}</span>`)
      .join('');
    const li = document.createElement('li');
    if (idx < 3) li.classList.add(`top-${idx + 1}`);
    li.innerHTML = `<span>${idx < 3 ? medals[idx] : ''} ${name}</span>
      <span>${_userPoints[name] || 0} pts | ${_completedChores[name] || 0} chores</span>
      <span class="scoreboard-badges">${badgeHtml}</span>`;
    scoreboardList.appendChild(li);
  });
}

export function resetScoreboard() {
  _userPoints = {};
  _badges = {};
  _completedChores = {};
  saveToSupabase('user_points', _userPoints);
  saveToSupabase('badges', _badges);
  saveToSupabase('completed_chores', _completedChores);
  renderScoreboard();
}

export function setupScoreboardListeners() {
  const resetBtn = document.getElementById('resetScoreboardBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all scores and badges?')) {
        resetScoreboard();
      }
    });
  }

  const sortSelect = document.getElementById('scoreSortBy');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      _sortBy = sortSelect.value;
      renderScoreboard();
    });
  }
}
