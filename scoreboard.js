// scoreboard.js

import { saveToSupabase } from './storage.js';

let _userPoints = {};
let _badges = {};
let _completedChores = {};

export function setScoreboardData({ userPoints, badges, completedChores }) {
  _userPoints = userPoints;
  _badges = badges;
  _completedChores = completedChores;
}

export function renderScoreboard() {
  const scoreboardList = document.getElementById('scoreboardList');
  if (!scoreboardList) return;

  scoreboardList.innerHTML = '';
  Object.keys(_userPoints).forEach(name => {
    const badgeHtml = (_badges[name] || [])
      .map(b => `<span title="${b.name}">${b.icon}</span>`)
      .join('');
    const li = document.createElement('li');
    li.innerHTML = `<span>${name}</span>
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
}
