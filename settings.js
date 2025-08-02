import { cleanupPhotos } from './wall.js';
import { adminUsers } from './data.js';

export function setupSettings() {
  const currentUser = localStorage.getItem('familyCurrentUser');
  if (!adminUsers.includes(currentUser)) return;

  const weekBtn = document.getElementById('cleanupPhotosWeekBtn');
  const monthBtn = document.getElementById('cleanupPhotosMonthBtn');
  const allBtn = document.getElementById('cleanupPhotosAllBtn');
  const status = document.getElementById('photoCleanupStatus');

  async function handle(days) {
    let label = 'all photos';
    if (days === 7) label = 'photos older than 1 week';
    else if (days === 30) label = 'photos older than 1 month';
    if (!confirm(`Are you sure you want to remove ${label}?`)) return;
    if (status) status.textContent = 'Cleaning...';
    const removed = await cleanupPhotos(days);
    if (status) status.textContent = `Removed ${removed} photo${removed === 1 ? '' : 's'}.`;
  }

  if (weekBtn) weekBtn.addEventListener('click', () => handle(7));
  if (monthBtn) monthBtn.addEventListener('click', () => handle(30));
  if (allBtn) allBtn.addEventListener('click', () => handle(0));
}
