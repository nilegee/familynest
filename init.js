// init.js

import { loadAllData } from './storage.js';
import { computeProfileSimilarities } from './profile.js';
import { renderWallPosts } from './wall.js';
import { renderQA } from './qa.js';
import { renderCalendarTable, renderCalendarEventsList } from './calendar.js';
import { renderChores } from './chores.js';
import { renderScoreboard } from './scoreboard.js';
import { updateGreeting, updateAdminVisibility, loadTheme } from './ui.js';

// You might want to import global state objects if you modularized them, 
// e.g. import { wallPosts, qaList, ... } from './globals.js';
// but here, we assume they're imported or set globally as needed.

export function init(allData) {
  // Set the global state (assuming you defined these as exported variables in globals.js)
  window.wallPosts = allData.wallPosts;
  window.qaList = allData.qaList;
  window.calendarEvents = allData.calendarEvents;
  window.profilesData = allData.profilesData;
  window.chores = allData.chores;
  window.userPoints = allData.userPoints;
  window.badges = allData.badges;
  window.completedChores = allData.completedChores;

  // User selection and greeting
  window.checkUserSelection(); // From user.js
  window.setActiveTab(0); // From navigation.js

  // Initial rendering
  renderQA();
  renderCalendarTable();
  renderCalendarEventsList();
  Object.keys(window.profilesData).forEach(n => computeProfileSimilarities(n));
  updateGreeting();
  updateAdminVisibility();
  renderChores('', window.showDailyOnlyCheckbox && window.showDailyOnlyCheckbox.checked);
  renderScoreboard();
  loadTheme();
}
