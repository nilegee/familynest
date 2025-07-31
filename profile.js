// profile.js

import { escapeHtml, calculateAge, saveToSupabase, generateId } from './util.js';
import { badges, badgeTypes, userPoints, grantBadge, incrementPoints, completedChores } from './chores.js';

export let profilesData = {};
export let currentEditingProfile = null;
export let profileSimilarities = {};

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
  const fields = {
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
    profileEditForm.querySelectorAll('label').forEach(label => {
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
  profileEditForm.querySelectorAll('.edit-icon').forEach(i => i.hidden = true);

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
  entries.forEach(item => {
    const div = document.createElement('div');
    div.className = 'profile-row';
    const safe = escapeHtml(item.value);
    div.innerHTML = `<strong>${item.label}:</strong> ${safe}${item.age ? ` <span class="age-text">(${item.age})</span>` : ''}`;
    profileContainer.appendChild(div);
  });

  // ----- Chore statistics -----
  const chores = window.chores || [];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0,0,0,0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  const assigned = chores.filter(c => c.assignedTo === name || c.assignedTo === 'All');
  const dueThisWeek = assigned.filter(c => !c.daily && c.due && new Date(c.due) >= startOfWeek && new Date(c.due) < endOfWeek).length;
  const dailyCount = assigned.filter(c => c.daily).length;
  const summaryDiv = document.createElement('div');
  summaryDiv.className = 'profile-summary';
  summaryDiv.textContent = `Chores assigned: ${assigned.length} (Daily: ${dailyCount}, Due this week: ${dueThisWeek})`;
  profileContainer.appendChild(summaryDiv);

  if (profile.dreamJob && profile.dreamJob.toLowerCase().includes('engineer')) {
    const iconDiv = document.createElement('div');
    iconDiv.className = 'engineer-animation-container';
    iconDiv.innerHTML = `
      <svg viewBox="0 0 64 32" class="engineer-car" aria-hidden="true">
        <rect x="8" y="12" width="48" height="10" fill="#6c757d" />
        <rect x="18" y="6" width="20" height="8" fill="#adb5bd" />
        <circle cx="24" cy="24" r="4" fill="#212529" />
        <circle cx="40" cy="24" r="4" fill="#212529" />
      </svg>`;
    profileContainer.appendChild(iconDiv);
  }

  const userBadges = badges[name] || [];
  const badgeContainer = document.createElement('div');
  badgeContainer.className = 'badge-container';
  badgeContainer.innerHTML = `<h3>Badges</h3>`;
  const badgeList = document.createElement('ul');
  badgeList.className = 'badge-list';
  if (userBadges.length) {
    userBadges.forEach(b => {
      const li = document.createElement('li');
      li.className = 'badge-item';
      li.textContent = `${b.icon} ${b.name}`;
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
    badgeTypes.forEach(b => {
      const option = document.createElement('option');
      option.value = b.id;
      option.textContent = `${b.icon} ${b.name}`;
      select.appendChild(option);
    });
    const btn = document.createElement('button');
    btn.textContent = 'Give Badge';
    btn.addEventListener('click', () => {
      grantBadge(name, select.value);
      renderSingleProfile(name);
    });
    awardDiv.appendChild(select);
    awardDiv.appendChild(btn);
    badgeContainer.appendChild(awardDiv);
  }
  profileContainer.appendChild(badgeContainer);

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
    pointsDiv.appendChild(addBtn);
  }
  profileContainer.appendChild(pointsDiv);

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
          saveToSupabase('profiles', profilesData);
          renderSingleProfile(name);
        };
        reader.readAsDataURL(file);
      }
    });
    profileContainer.appendChild(uploadBtn);
  }

  const sim = profileSimilarities[name];
  if (sim && Object.keys(sim).length) {
    const items = [];
    for (const key in sim) {
      const label = profileFieldLabels[key] || key;
      items.push(`${label} matches ${sim[key].join(', ')}`);
    }
    similarityInfoEl.innerHTML = `<h3>Things in Common</h3><ul>${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
    similarityInfoEl.hidden = false;
  } else {
    similarityInfoEl.hidden = true;
  }
}
