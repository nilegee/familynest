// main.js

import { loadAllData } from './storage.js';
import { renderWallPosts } from './wall.js';
import { renderQA } from './qa.js';
import { renderCalendarTable, renderCalendarEventsList } from './calendar.js';
import { renderChores, setChoresData } from './chores.js';
import { renderScoreboard, setScoreboardData } from './scoreboard.js';
import { computeProfileSimilarities, renderSingleProfile, setProfileData } from './profile.js';
import { updateGreeting, updateAdminVisibility, loadTheme } from './ui.js';
import { setupTabListeners, setActiveTab } from './navigation.js';
import { setupProfileEditListeners } from './profileEditListeners.js';
import { badgeTypes } from './data.js'; // If you define badgeTypes here

let wallPosts, qaList, calendarEvents, profilesData, chores, userPoints, badges, completedChores;

// Single place to assign all loaded data to locals
function assignData(allData) {
  wallPosts = allData.wallPosts;
  qaList = allData.qaList;
  calendarEvents = allData.calendarEvents;
  profilesData = allData.profilesData;
  chores = allData.chores;
  userPoints = allData.userPoints;
  badges = allData.badges;
  completedChores = allData.completedChores;
}

// Main entrypoint
export async function main() {
  // 1. Load all data from storage (or Supabase)
  const allData = await loadAllData();
  assignData(allData);

  // 2. Pass state into each module (no globals used)
  setScoreboardData({ userPoints, badges, completedChores });
  setChoresData({
    chores,
    badges,
    userPoints,
    completedChores,
    badgeTypes,
    onSave: (chores, completedChores, badges, userPoints) => {
      // You can call your save logic here for Supabase/localStorage
      // E.g. saveToSupabase('chores', chores) etc.
    }
  });
  setProfileData(profilesData);

  // 3. Setup navigation/tabs
  setupTabListeners();
  setActiveTab(0);

  // 4. Render all primary content
  renderWallPosts();
  renderQA();
  renderCalendarTable();
  renderCalendarEventsList();

  // 5. Compute and render profile similarities
  Object.keys(profilesData).forEach(n => computeProfileSimilarities(n));

  // 6. Render greeting, theme, admin features
  updateGreeting();
  updateAdminVisibility();
  loadTheme();

  // 7. Render chores and scoreboard, and set up profile editing
  renderChores('', false);
  renderScoreboard();
  setupProfileEditListeners();
}

// Ensure main runs after DOM loaded
document.addEventListener('DOMContentLoaded', main);
