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

const profileMenuBtn = document.getElementById('profileMenuBtn');
const profileMenu = document.getElementById('profileMenu');
if (profileMenuBtn && profileMenu) {
  profileMenuBtn.addEventListener('click', () => {
    const isOpen = !profileMenu.hidden;
    profileMenu.hidden = isOpen;
    profileMenuBtn.setAttribute('aria-expanded', String(!isOpen));
  });
  document.addEventListener('click', (e) => {
    if (!profileMenu.contains(e.target) && e.target !== profileMenuBtn) {
      profileMenu.hidden = true;
      profileMenuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  const profileBtn = document.getElementById('profileMenuProfile');
  const signOutBtn = document.getElementById('signOutBtn');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      const user = localStorage.getItem(currentUserKey);
      const tabs = Array.from(document.querySelectorAll('nav.sidebar li'));
      const idx = tabs.findIndex(t => t.textContent.trim() === user);
      if (idx >= 0) {
        import('./navigation.js').then(m => m.setActiveTab(idx));
      }
      profileMenu.hidden = true;
    });
  }
  if (signOutBtn) {
    signOutBtn.classList.add('sign-out');
  }
}

export function updateUserAvatar() {
  const img = document.getElementById('avatarMenuImg');
  const user = localStorage.getItem(currentUserKey);
  const profiles = window.profilesData || {};
  if (img) {
    if (user && profiles[user] && profiles[user].avatar) {
      img.src = profiles[user].avatar;
      img.alt = `Avatar for ${user}`;
    } else {
      img.src = 'icons/default-avatar.svg';
      img.alt = 'User avatar';
    }
  }
}
