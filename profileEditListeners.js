// profileEditListeners.js

import {
  getProfilesData,
  setCurrentEditingProfile,
  renderSingleProfile,
  computeProfileSimilarities
} from './profile.js';
import { saveToSupabase, saveToLocal } from './storage.js';

export function setupProfileEditListeners() {
  const editProfileBtn = document.getElementById('editProfileBtn');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const cancelProfileBtn = document.getElementById('cancelProfileBtn');
  const profileNameHeading = document.getElementById('profileName');
  const profileEditForm = document.getElementById('profileEditForm');
  
  // Enter edit mode
  editProfileBtn.addEventListener('click', () => {
    const name = profileNameHeading.dataset.name;
    setCurrentEditingProfile(name);
    renderSingleProfile(name);
  });

  // Save profile
  saveProfileBtn.addEventListener('click', () => {
    const name = profileNameHeading.dataset.name;
    if (!name) return;
    const profilesData = getProfilesData(); // <-- Use the getter
    const p = profilesData[name];
    p.birthdate = document.getElementById('editBirthdate').value;
    p.favoriteColor = document.getElementById('editFavoriteColor').value.trim();
    p.favoriteFood = document.getElementById('editFavoriteFood').value.trim();
    p.dislikedFood = document.getElementById('editDislikedFood').value.trim();
    p.favoriteWeekendActivity = document.getElementById('editFavoriteWeekendActivity').value.trim();
    p.favoriteGame = document.getElementById('editFavoriteGame').value.trim();
    p.favoriteMovie = document.getElementById('editFavoriteMovie').value.trim();
    p.favoriteHero = document.getElementById('editFavoriteHero').value.trim();
    p.profession.title = document.getElementById('editProfessionTitle').value.trim();
    p.funFact = document.getElementById('editFunFact').value.trim();
    p.notifications = {
      wall: document.getElementById('notifyWall').checked,
      qa: document.getElementById('notifyQa').checked,
      calendar: document.getElementById('notifyCalendar').checked,
      answer: document.getElementById('notifyAnswer').checked
    };

    saveToLocal('profiles', profilesData);
    saveToSupabase('profiles', { [name]: p }, { skipLocal: true });
    computeProfileSimilarities(name);
    setCurrentEditingProfile(null);
    renderSingleProfile(name);
  });

  // Cancel edit
  cancelProfileBtn.addEventListener('click', () => {
    setCurrentEditingProfile(null);
    renderSingleProfile(profileNameHeading.dataset.name);
  });
}
