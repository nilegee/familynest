// util.js

export function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

export function formatDateLocal(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function timeAgo(dateStr) {
  const now = new Date();
  const past = new Date(dateStr);
  const diff = now - past;
  if (isNaN(past)) return dateStr;
  if (diff < 0) return 'in the future';

  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds} sec ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hr ago';
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;

  const years = Math.floor(months / 12);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

export function calculateAge(dateStr) {
  const birth = new Date(dateStr);
  if (isNaN(birth)) return '';
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();
  if (days < 0) {
    months--;
    const prevMonthDays = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    days += prevMonthDays;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return `${years}y ${months}m ${days}d`;
}

export function generateId() {
  return '_' + Math.random().toString(36).slice(2, 11);
}

export function showAlert(message) {
  alert(message);
}

export function normalizeBadgeArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return [];
    }
  } else if (raw && typeof raw === 'object') {
    return Object.values(raw);
  }
  return [];
}
