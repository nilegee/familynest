// ui.js

// Cached DOM elements
const currentUserDisplay = document.getElementById('currentUserDisplay');
const currentDateDisplay = document.getElementById('currentDateDisplay');
const adminAnswerSection = document.getElementById('adminAnswerSection');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeKey = 'familyTheme';
const currentUserKey = 'familyCurrentUser';

// You can configure admin users here if not imported
const adminUsers = ['Ghassan', 'Mariem'];
let qaList = window.qaList || []; // updated in main app

export function updateGreeting() {
  const user = localStorage.getItem(currentUserKey) || 'Guest';
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  currentDateDisplay.textContent = now.toLocaleDateString(undefined, options);
  currentUserDisplay.textContent = user;
}

export function updateAdminVisibility() {
  const user = localStorage.getItem(currentUserKey);
  const isAdmin = adminUsers.includes(user);
  const choreAdminPanel = document.getElementById('choreAdminPanel');
  if (choreAdminPanel) choreAdminPanel.hidden = !isAdmin;
  if (adminAnswerSection) {
    // If qaList not loaded yet, hide
    if (!Array.isArray(window.qaList)) {
      adminAnswerSection.hidden = true;
    } else {
      adminAnswerSection.hidden = !isAdmin || !window.qaList.some(item => !item.a);
    }
  }
}

export function loadTheme() {
  const theme = localStorage.getItem(themeKey) || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  if (themeToggleBtn) themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Optional: Theme toggle wiring
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', current);
    localStorage.setItem(themeKey, current);
    themeToggleBtn.textContent = current === 'dark' ? '☀️' : '🌙';
  });
}
