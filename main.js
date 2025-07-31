// main.js

import { loadAllData } from './dataLoader.js';
import { renderWallPosts } from './wall.js';
import { renderQA } from './qa.js';
import { renderCalendarTable, renderCalendarEventsList } from './calendar.js';
import { renderChores } from './chores.js';
import { renderScoreboard } from './scoreboard.js';
import { computeProfileSimilarities, renderSingleProfile } from './profile.js';
import { updateGreeting, updateAdminVisibility, loadTheme } from './ui.js';
import { setupTabListeners, setActiveTab } from './navigation.js';
import { setupProfileEditListeners } from './profileEditListeners.js';

let wallPosts, qaList, calendarEvents, profilesData, chores, userPoints, badges, completedChores;

function assignData(allData) {
  wallPosts = allData.wallPosts;
  qaList = allData.qaList;
  calendarEvents = allData.calendarEvents;
  profilesData = allData.profilesData;
  chores = allData.chores;
  userPoints = allData.userPoints;
  badges = allData.badges;
  completedChores = allData.completedChores;
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
  // Load all persisted or Supabase data
  const allData = await loadAllData();
  assignData(allData);

  // Initial user check & selection handled inside dataLoader (or here if you move it)
  // Set up tab navigation
  setupTabListeners();

  // Show the default (first) tab
  setActiveTab(0);

  // Render all main content sections
  renderWallPosts();
  renderQA();
  renderCalendarTable();
  renderCalendarEventsList();

  // Compute profile similarities
  Object.keys(profilesData).forEach(n => computeProfileSimilarities(n));

  // Greeting, admin features, theme
  updateGreeting();
  updateAdminVisibility();
  loadTheme();

  // Render chores and scoreboard
  renderChores('', false); // No filter, not just daily
  renderScoreboard();

  // Setup profile editing listeners
  setupProfileEditListeners();

  // You can add additional event listeners for service worker, theme, notifications, etc.
}

document.addEventListener('DOMContentLoaded', main);
