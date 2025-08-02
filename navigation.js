// navigation.js

import { renderSingleProfile } from './profile.js';
import { clearTabDot } from './notifications.js';

const sidebarTabs = Array.from(document.querySelectorAll('nav.sidebar li'));
const bottomTabs = Array.from(document.querySelectorAll('nav.bottom-nav button'));
const sections = Array.from(document.querySelectorAll('main.content > section'));
let activeTabIndex = 0;

export function setActiveTab(index) {
  activeTabIndex = index;
  sidebarTabs.forEach((tab, i) => {
    const isActive = i === index;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('tabindex', isActive ? '0' : '-1');
  });
  bottomTabs.forEach((tab, i) => {
    tab.classList.toggle('active', i === index);
  });
  const tabKey = sidebarTabs[index].dataset.tab || sidebarTabs[index].textContent.trim();
  if (sidebarTabs[index].dataset.tab) clearTabDot(tabKey);
  sections.forEach(sec => sec.hidden = true);
  document.getElementById('profileDetail').hidden = true;
  switch (tabKey) {
    case 'wall':
      document.getElementById('wall').hidden = false;
      break;
    case 'qa':
      document.getElementById('qa').hidden = false;
      break;
    case 'calendar':
      document.getElementById('calendar').hidden = false;
      break;
    case 'chores':
      document.getElementById('chores').hidden = false;
      break;
    case 'scoreboard':
      document.getElementById('scoreboard').hidden = false;
      break;
    case 'settings':
      document.getElementById('settings').hidden = false;
      break;
    default:
      document.getElementById('profileDetail').hidden = false;
      renderSingleProfile(tabKey);
      break;
  }
  // updateSearchFilters(); // wire up in main if needed
}

export function setupTabListeners() {
  [sidebarTabs, bottomTabs].forEach(list => {
    list.forEach((tab, i) => {
      tab.addEventListener('click', () => setActiveTab(i));
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          const next = (i + 1) % list.length;
          list[next].focus();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const prev = (i - 1 + list.length) % list.length;
          list[prev].focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActiveTab(i);
        }
      });
    });
  });
}

export function setupSidebarToggle() {
  const sidebar = document.querySelector('nav.sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const floatBtn = document.getElementById('floatingMenuBtn');
  const hamburgerBtn = document.getElementById('hamburgerBtn');

  if (!sidebar || !overlay) return;

  function toggle() {
    const isOpen = sidebar.classList.toggle('open');
    overlay.classList.toggle('visible', isOpen);
    if (floatBtn) floatBtn.setAttribute('aria-expanded', isOpen);
    if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', isOpen);
  }

  [floatBtn, hamburgerBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', toggle);
  });
  overlay.addEventListener('click', toggle);
}
