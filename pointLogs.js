// pointLogs.js

import { adminUsers } from './data.js';

let pointLogs = [];
let users = [];

export function setPointLogsData(logData = [], userNames = []) {
  pointLogs = logData;
  users = userNames;
  const userSelect = document.getElementById('pointLogFilterUser');
  if (userSelect) {
    userSelect.innerHTML = '<option value="">All</option>';
    userNames.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      userSelect.appendChild(opt);
    });
  }
}

export function renderPointLogs() {
  const container = document.getElementById('pointLogsContainer');
  if (!container) return;
  const currentUser = localStorage.getItem('familyCurrentUser');
  if (!adminUsers.includes(currentUser)) {
    container.textContent = 'Access denied.';
    return;
  }
  const userFilter = document.getElementById('pointLogFilterUser')?.value || '';
  const fromDate = document.getElementById('pointLogFilterFrom')?.value;
  const toDate = document.getElementById('pointLogFilterTo')?.value;
  const minPoints = document.getElementById('pointLogFilterPoints')?.value;
  let logs = pointLogs.slice();
  if (userFilter) logs = logs.filter(l => l.user_id === userFilter);
  if (fromDate) logs = logs.filter(l => new Date(l.timestamp) >= new Date(fromDate));
  if (toDate) logs = logs.filter(l => new Date(l.timestamp) <= new Date(toDate + 'T23:59:59'));
  if (minPoints) logs = logs.filter(l => Math.abs(l.points_changed) >= parseInt(minPoints, 10));
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  container.innerHTML = '';
  const ul = document.createElement('ul');
  if (!logs.length) {
    const li = document.createElement('li');
    li.textContent = 'No logs found.';
    ul.appendChild(li);
  } else {
    logs.forEach(log => {
      const li = document.createElement('li');
      const pts = log.points_changed > 0 ? `+${log.points_changed}` : log.points_changed;
      const date = new Date(log.timestamp).toLocaleString();
      li.textContent = `${date} - ${log.user_id}: ${pts} by ${log.admin_id} (${log.reason})`;
      ul.appendChild(li);
    });
  }
  container.appendChild(ul);
}

export function setupPointLogFilters() {
  const currentUser = localStorage.getItem('familyCurrentUser');
  if (!adminUsers.includes(currentUser)) return;
  ['pointLogFilterUser', 'pointLogFilterFrom', 'pointLogFilterTo', 'pointLogFilterPoints']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', renderPointLogs);
    });
}
