import { updateGreeting, updateAdminVisibility } from './ui.js';
import { adminUsers } from './data.js';
const adminPin = window.ADMIN_PIN || '';

export function initUserSwitching() {
  const modal = document.getElementById('userSelectModal');
  const select = document.getElementById('userSelect');
  const confirmBtn = document.getElementById('confirmUserBtn');
  const changeUserBtn = document.getElementById('changeUserBtn');
  const key = 'familyCurrentUser';

  function showModal() {
    if (!modal) return;
    modal.classList.remove('modal-hidden');
    select && select.focus();
  }

  function hideModal() {
    if (!modal) return;
    modal.classList.add('modal-hidden');
  }

  confirmBtn?.addEventListener('click', () => {
    const user = select?.value;
    if (!user) return;
    if (adminUsers.includes(user)) {
      const pin = prompt('Enter admin PIN:');
      if (pin !== adminPin) {
        alert('Incorrect PIN');
        return;
      }
    }
    localStorage.setItem(key, user);
    hideModal();
    updateGreeting();
    updateAdminVisibility();
  });

  changeUserBtn?.addEventListener('click', showModal);

  if (!localStorage.getItem(key)) {
    showModal();
  } else {
    updateGreeting();
    updateAdminVisibility();
  }
}
