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
import { badgeTypes } from './data.js'; // badgeTypes comes from data.js

let wallPosts, qaList, calendarEvents, profilesData, chores, userPoints, badges, completedChores;

// Assign loaded state to locals, also inject into window if you want
function assignData(allData) {
  wallPosts = allData.wallPosts;
  qaList = allData.qaList;
  calendarEvents = allData.calendarEvents;
  profilesData = allData.profilesData;
  chores = allData.chores;
  userPoints = allData.userPoints;
  badges = allData.badges;
  completedChores = allData.completedChores;

  // If you want dev/legacy access
  window.wallPosts = wallPosts;
  window.qaList = qaList;
  window.calendarEvents = calendarEvents;
  window.profilesData = profilesData;
  window.chores = chores;
  window.userPoints = userPoints;
  window.badges = badges;
  window.completedChores = completedChores;
}

export async function main() {
  const allData = await loadAllData();
  assignData(allData);

  // Inject data/state into modules (NO globals, everything passed in)
  setScoreboardData({ userPoints, badges, completedChores });
  setChoresData({
    chores,
    badges,
    userPoints,
    completedChores,
    badgeTypes,
    onSave: (chores, completedChores, badges, userPoints) => {
      // Optional: Call your save logic here for Supabase/localStorage
      // Example: saveToSupabase('chores', chores)
    }
  });
  setProfileData(profilesData);

  // Tab nav
  setupTabListeners();
  setActiveTab(0);

  // Render content
  renderWallPosts();
  renderQA();
  renderCalendarTable();
  renderCalendarEventsList();

  // Profile similarities
  Object.keys(profilesData).forEach(n => computeProfileSimilarities(n));

  // Greeting, admin, theme
  updateGreeting();
  updateAdminVisibility();
  loadTheme();

  // Chores & scoreboard
  renderChores('', false); // No filter, not daily only
  renderScoreboard();

  // Profile editing
  setupProfileEditListeners();
}

// Fire it up!
document.addEventListener('DOMContentLoaded', main);
