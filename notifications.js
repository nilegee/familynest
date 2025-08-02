export let permissionRequested = false;
let swReg = null;
const counts = { wall: 0, qa: 0, calendar: 0, answer: 0 };

export async function initNotifications() {
  if ('serviceWorker' in navigator) {
    try {
      swReg = await navigator.serviceWorker.register('./sw.js');
    } catch (e) {
      console.warn('SW registration failed', e);
    }
  }
  requestPermission();
}

export function requestPermission() {
  if (permissionRequested || !('Notification' in window)) return;
  permissionRequested = true;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function showNotification(title, body) {
  if (Notification.permission !== 'granted') return;
  if (swReg) {
    swReg.showNotification(title, { body });
  } else if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready.then(reg => reg.showNotification(title, { body }));
  }
}

export function notify(type, title, body) {
  requestPermission();
  const currentUser = localStorage.getItem('familyCurrentUser');
  const profiles = window.profilesData || {};
  const settings = profiles[currentUser]?.notifications || {};
  if (settings[type] === false) return;
  showNotification(title, body);
  counts[type] = (counts[type] || 0) + 1;
  updateBadge();
  updateTabDot(type);
}

function updateBadge() {
  const badge = document.getElementById('notificationBadge');
  if (!badge) return;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  badge.textContent = total > 0 ? total : '';
  badge.style.display = total > 0 ? 'block' : 'none';
}

export function clearTabDot(type) {
  counts[type] = 0;
  updateBadge();
  const dots = document.querySelectorAll(`[data-tab="${type}"] .tab-notify-dot`);
  dots.forEach(d => d.style.display = 'none');
}

function updateTabDot(type) {
  const dots = document.querySelectorAll(`[data-tab="${type}"] .tab-notify-dot`);
  dots.forEach(d => d.style.display = 'block');
}
