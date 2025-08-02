// profile.js

import { escapeHtml, calculateAge, generateId, normalizeBadgeArray } from './util.js';
import { saveToSupabase, saveToLocal } from './storage.js';
import { renderScoreboard } from './scoreboard.js';

// These will be set via setProfileData etc.
let profilesData = {};
let badgeTypes = [];
let badges = {};
let userPoints = {};
let completedChores = {};
let pointLogs = [];
export let currentEditingProfile = null;
export let profileSimilarities = {};

export function setCurrentEditingProfile(name) {
  currentEditingProfile = name;
}

// Optionally let main.js call this to inject/replace shared state.
export function setProfileData(
  data,
  badgeData = {},
  badgeTypeData = [],
  userPts = {},
  completed = {},
  pointLogsData = []
) {
  profilesData = data;
  badges = badgeData;
  badgeTypes = badgeTypeData;
  userPoints = userPts;
  completedChores = completed;
  pointLogs = pointLogsData;
}

// Grant badge and increment points should ideally be imported, but can be local here for now:
function grantBadge(user, badgeId, note = '') {
  const badge = badgeTypes.find((b) => b.id === badgeId);
  if (!badge) return;
  badges[user] = normalizeBadgeArray(badges[user]);
  const newBadge = {
    badgeId,
    name: badge.name,
    icon: badge.icon,
    dateGiven: new Date().toISOString(),
    note,
    id: generateId()
  };
  badges[user].unshift(newBadge);
  saveToSupabase('badges', badges);
  renderScoreboard();
}

function revokeBadge(user, badgeId) {
  if (!badges[user]) return;
  badges[user] = badges[user].filter((b) => b.id !== badgeId);
  saveToSupabase('badges', badges);
  renderScoreboard();
}

function incrementPoints(user, amount = 1) {
  const admin = localStorage.getItem('familyCurrentUser');
  if (!adminUsers.includes(admin)) return;
  userPoints[user] = (userPoints[user] || 0) + amount;
  saveToSupabase('user_points', userPoints);
  pointLogs.push({
    id: generateId(),
    user,
    admin,
    amount,
    timestamp: new Date().toISOString()
  });
  saveToSupabase('point_logs', pointLogs);
  renderScoreboard();
}

const adminUsers = ['Ghassan', 'Mariem'];
const profileFieldLabels = {
  favoriteColor: 'Favourite Colour',
  favoriteFood: 'Favourite Food',
  dislikedFood: 'Disliked Food',
  favoriteWeekendActivity: 'Favourite Weekend Activity',
  favoriteGame: 'Favourite Game',
  favoriteMovie: 'Favourite Movie',
  favoriteHero: 'Favourite Hero',
  professionTitle: 'Profession',
  funFact: 'Fun Fact'
};

export function computeProfileSimilarities(name) {
  const profile = profilesData[name];
  const fields = profileFieldLabels;
  const sims = {};
  for (const otherName in profilesData) {
    if (otherName === name) continue;
    const other = profilesData[otherName];
    if (!other) continue;
    for (const key in fields) {
      let a = null;
      let b = null;
      if (key === 'professionTitle') {
        a = profile.profession.title;
        b = other.profession.title;
      } else {
        a = profile[key];
        b = other[key];
      }
      if (a && b && a.toLowerCase() === b.toLowerCase()) {
        sims[key] = sims[key] || [];
        sims[key].push(otherName);
      }
    }
  }
  profileSimilarities[name] = sims;
}

export function renderSingleProfile(name) {
  if (!profilesData || typeof profilesData !== 'object') return;
  const profile = profilesData[name];
  const profileContainer = document.getElementById('profileContainer');
  const profileNameHeading = document.getElementById('profileName');
  const profileAvatar = document.getElementById('profileAvatar');
  const profileEditForm = document.getElementById('profileEditForm');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const similarityInfoEl = document.getElementById('similarityInfo');
  const currentUser = localStorage.getItem('familyCurrentUser');

  if (!profile) {
    profileContainer.innerHTML = '<p>Profile not found.</p>';
    profileNameHeading.dataset.name = name;
    profileNameHeading.childNodes[0].nodeValue = name;
    profileAvatar.src = 'icons/default-avatar.svg';
    profileAvatar.alt = 'Avatar for ' + name;
    profileAvatar.style.display = 'inline-block';
    return;
  }
  let headingText = name;
  if (profile.dreamJob) {
    const job = profile.dreamJob.replace('🛠️', '').trim();
    const emoji = profile.dreamJob.includes('🛠️') ? '🛠️ ' : '';
    headingText = `${emoji}${job} ${name}`;
  }
  profileNameHeading.dataset.name = name;
  profileNameHeading.childNodes[0].nodeValue = headingText;
  profileAvatar.src = profile.avatar ? profile.avatar : 'icons/default-avatar.svg';
  profileAvatar.alt = 'Avatar for ' + name;
  profileAvatar.style.display = 'inline-block';

  const canEdit = currentUser === name || adminUsers.includes(currentUser);

  if (currentEditingProfile === name) {
    editProfileBtn.hidden = true;
    profileContainer.style.display = 'none';
    similarityInfoEl.hidden = true;
    profileEditForm.hidden = false;
    document.getElementById('editBirthdate').value = profile.birthdate || '';
    document.getElementById('editFavoriteColor').value = profile.favoriteColor || '';
    document.getElementById('editFavoriteFood').value = profile.favoriteFood || '';
    document.getElementById('editDislikedFood').value = profile.dislikedFood || '';
    document.getElementById('editFavoriteWeekendActivity').value = profile.favoriteWeekendActivity || '';
    document.getElementById('editFavoriteGame').value = profile.favoriteGame || '';
    document.getElementById('editFavoriteMovie').value = profile.favoriteMovie || '';
    document.getElementById('editFavoriteHero').value = profile.favoriteHero || '';
    document.getElementById('editProfessionTitle').value = profile.profession.title || '';
    document.getElementById('editFunFact').value = profile.funFact || '';
    document.getElementById('notifyWall').checked = profile.notifications?.wall !== false;
    document.getElementById('notifyQa').checked = profile.notifications?.qa !== false;
    document.getElementById('notifyCalendar').checked = profile.notifications?.calendar !== false;
    document.getElementById('notifyAnswer').checked = profile.notifications?.answer !== false;
    profileEditForm.querySelectorAll('label').forEach((label) => {
      let icon = label.querySelector('.edit-icon');
      if (!icon) {
        icon = document.createElement('span');
        icon.className = 'edit-icon';
        icon.textContent = '✏️';
        label.appendChild(icon);
      }
      icon.hidden = false;
    });
    return;
  }

  profileEditForm.hidden = true;
  editProfileBtn.hidden = !canEdit;
  profileContainer.style.display = '';
  profileContainer.innerHTML = '';
  profileEditForm.querySelectorAll('.edit-icon').forEach((i) => (i.hidden = true));

  const age = calculateAge(profile.birthdate);
  const entries = [
    { label: 'Birthdate', value: profile.birthdate, age },
    { label: 'Favourite Colour', value: profile.favoriteColor },
    { label: 'Favourite Food', value: profile.favoriteFood },
    { label: 'Disliked Food', value: profile.dislikedFood },
    { label: 'Favourite Weekend Activity', value: profile.favoriteWeekendActivity },
    { label: 'Favourite Game', value: profile.favoriteGame },
    { label: 'Favourite Movie', value: profile.favoriteMovie },
    { label: 'Favourite Hero', value: profile.favoriteHero },
    { label: 'Profession', value: profile.profession.title },
    { label: 'Fun Fact', value: profile.funFact }
  ];
  entries.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'profile-row';
    const safe = escapeHtml(item.value);
    div.innerHTML = `<strong>${item.label}:</strong> ${safe}${item.age ? ` <span class="age-text">(${item.age})</span>` : ''}`;
    profileContainer.appendChild(div);
  });

  // Chore statistics
  const chores = window.chores || [];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  const assigned = chores.filter((c) => c.assignedTo === name || c.assignedTo === 'All');
  const dueThisWeek = assigned.filter(
    (c) => !c.daily && c.due && new Date(c.due) >= startOfWeek && new Date(c.due) < endOfWeek
  ).length;
  const dailyCount = assigned.filter((c) => c.daily).length;
  const summaryDiv = document.createElement('div');
  summaryDiv.className = 'profile-summary';
  summaryDiv.textContent = `Chores assigned: ${assigned.length} (Daily: ${dailyCount}, Due this week: ${dueThisWeek})`;
  profileContainer.appendChild(summaryDiv);

  // Badges
  let rawBadges = badges[name];
  let userBadges = [];
  if (Array.isArray(rawBadges)) {
    userBadges = rawBadges.slice();
  } else if (typeof rawBadges === 'string') {
    try {
      const parsed = JSON.parse(rawBadges);
      if (Array.isArray(parsed)) userBadges = parsed.slice();
    } catch (e) {
      userBadges = [];
    }
  } else if (rawBadges && typeof rawBadges === 'object') {
    userBadges = Object.values(rawBadges);
  }
  userBadges.sort((a, b) => {
    return new Date(b.dateGiven) - new Date(a.dateGiven);
  });
  const badgeContainer = document.createElement('div');
  badgeContainer.className = 'badge-container';
  badgeContainer.innerHTML = `<h3>Badges</h3>`;
  const badgeList = document.createElement('ul');
  badgeList.className = 'badge-list';
  if (userBadges.length) {
    userBadges.forEach((b) => {
      const li = document.createElement('li');
      li.className = 'badge-item';
      li.title = b.note ? b.note : '';
      li.textContent = `${b.icon} ${b.name}`;
      if (adminUsers.includes(currentUser)) {
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '✖';
        removeBtn.className = 'badge-remove';
        removeBtn.addEventListener('click', () => {
          revokeBadge(name, b.id);
          renderSingleProfile(name);
        });
        li.appendChild(removeBtn);
      }
      badgeList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'None yet';
    badgeList.appendChild(li);
  }
  badgeContainer.appendChild(badgeList);

  if (adminUsers.includes(currentUser)) {
    const awardDiv = document.createElement('div');
    awardDiv.className = 'badge-award';
    const select = document.createElement('select');
    badgeTypes.forEach((b) => {
      const option = document.createElement('option');
      option.value = b.id;
      option.textContent = `${b.icon} ${b.name}`;
      select.appendChild(option);
    });
    const noteInput = document.createElement('input');
    noteInput.type = 'text';
    noteInput.placeholder = 'Note (optional)';
    const btn = document.createElement('button');
    btn.textContent = 'Give Badge';
    btn.addEventListener('click', () => {
      grantBadge(name, select.value, noteInput.value.trim());
      renderSingleProfile(name);
    });
    awardDiv.appendChild(select);
    awardDiv.appendChild(noteInput);
    awardDiv.appendChild(btn);
    badgeContainer.appendChild(awardDiv);
  }
  profileContainer.appendChild(badgeContainer);

  // Points
  const pointsDiv = document.createElement('div');
  pointsDiv.className = 'points-display';
  pointsDiv.textContent = `Points: ${userPoints[name] || 0}`;
  if (adminUsers.includes(currentUser)) {
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-secondary';
    addBtn.textContent = '+1 Point';
    addBtn.addEventListener('click', () => {
      incrementPoints(name);
      renderSingleProfile(name);
    });
    const subBtn = document.createElement('button');
    subBtn.className = 'btn-secondary';
    subBtn.textContent = '-1 Point';
    subBtn.addEventListener('click', () => {
      incrementPoints(name, -1);
      renderSingleProfile(name);
    });
    pointsDiv.appendChild(addBtn);
    pointsDiv.appendChild(subBtn);
  }
  profileContainer.appendChild(pointsDiv);

  // Avatar upload
  if (canEdit) {
    const uploadBtn = document.createElement('input');
    uploadBtn.type = 'file';
    uploadBtn.accept = 'image/*';
    uploadBtn.className = 'avatar-upload-btn';
    uploadBtn.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          profile.avatar = reader.result;
          saveToLocal('profiles', profilesData);
          saveToSupabase('profiles', { [name]: profile }, { skipLocal: true });
          renderSingleProfile(name);
        };
        reader.readAsDataURL(file);
      }
    });
    profileContainer.appendChild(uploadBtn);
  }

  // Similarities
  const sim = profileSimilarities[name];
  if (sim && Object.keys(sim).length) {
    const items = [];
    for (const key in sim) {
      const label = profileFieldLabels[key] || key;
      items.push(`${label} matches ${sim[key].join(', ')}`);
    }
    similarityInfoEl.innerHTML = `<h3>Things in Common</h3><ul>${items
      .map((i) => `<li>${escapeHtml(i)}</li>`)
      .join('')}</ul>`;
    similarityInfoEl.hidden = false;
  } else {
    similarityInfoEl.hidden = true;
  }
}

// 👇👇👇 ADD THIS AT THE END TO ALLOW SAFE ACCESS TO profilesData
export function getProfilesData() {
  return profilesData;
}
