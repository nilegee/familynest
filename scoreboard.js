// scoreboard.js

import { escapeHtml } from './util.js'; // assuming you have this helper, otherwise inline below

// Expects these DOM elements to exist:
const scoreboardList = document.getElementById('scoreboardList');

// Data dependencies (must be set before calling renderScoreboard)
let userPoints = {};
let badges = {};
let completedChores = {};

// Called to update dependencies from main app:
export function setScoreboardData({ userPoints: up, badges: b, completedChores: cc }) {
  userPoints = up || {};
  badges = b || {};
  completedChores = cc || {};
}

// Core rendering function:
export function renderScoreboard() {
  if (!scoreboardList) return;
  if (!userPoints || typeof userPoints !== 'object') return;
  if (!badges || typeof badges !== 'object') return;
  if (!completedChores || typeof completedChores !== 'object') return;

  scoreboardList.innerHTML = '';
  Object.keys(userPoints).forEach(name => {
    const badgeHtml = (badges[name] || [])
      .map(b => `<span title="${escapeHtml(b.name)}">${b.icon}</span>`)
      .join('');
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${escapeHtml(name)}</span>
      <span>${userPoints[name] || 0} pts | ${completedChores[name] || 0} chores</span>
      <span class="scoreboard-badges">${badgeHtml}</span>
    `;
    scoreboardList.appendChild(li);
  });
}
