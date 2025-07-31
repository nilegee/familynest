// profileEditListeners.js

import { profilesData, currentEditingProfile, renderSingleProfile, computeProfileSimilarities } from './profile.js';
import { saveToSupabase } from './utils.js';

export function setupProfileEditListeners() {
  const editProfileBtn = document.getElementById('editProfileBtn');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const cancelProfileBtn = document.getElementById('cancelProfileBtn');
  const profileNameHeading = document.getElementById('profileName');
  const profileEditForm = document.getElementById('profileEditForm');
  
  // Enter edit mode
  editProfileBtn.addEventListener('click', () => {
    window.currentEditingProfile = profileNameHeading.dataset.name;
    renderSingleProfile(window.currentEditingProfile);
  });

  // Save profile
  saveProfileBtn.addEventListener('click', () => {
    const name = window.currentEditingProfile;
    if (!name) return;
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

    saveToSupabase('profiles', profilesData);
    computeProfileSimilarities(name);
    window.currentEditingProfile = null;
    renderSingleProfile(name);
  });

  // Cancel edit
  cancelProfileBtn.addEventListener('click', () => {
    window.currentEditingProfile = null;
    renderSingleProfile(profileNameHeading.dataset.name);
  });
}
