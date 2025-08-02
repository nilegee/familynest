// main.js

import { loadAllData, saveToSupabase } from './storage.js';
import { renderWallPosts, setWallData, setupWallListeners } from './wall.js';
import { setupQA, renderQA } from './qa.js';
import { setupCalendar, renderCalendarTable, renderCalendarEventsList } from './calendar.js';
import { renderChores, setChoresData, setupChoresUI } from './chores.js';
import { renderScoreboard, setScoreboardData, setupScoreboardListeners } from './scoreboard.js';
import { computeProfileSimilarities, renderSingleProfile, setProfileData } from './profile.js';
import { updateGreeting, updateAdminVisibility, loadTheme, updateUserAvatar } from './ui.js';
import { setupTabListeners, setActiveTab, setupSidebarToggle } from './navigation.js';
import { setupProfileEditListeners } from './profileEditListeners.js';
import { badgeTypes } from './data.js'; // if you use badgeTypes from your data.js
import { initNotifications, clearTabDot } from './notifications.js';
import { setupSettings } from './settings.js';

let wallPosts, qaList, calendarEvents, profilesData, chores, userPoints, badges, completedChores, pointLogs;

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
  pointLogs = allData.pointLogs;

  // If you want dev/legacy access
  window.wallPosts = wallPosts;
  window.qaList = qaList;
  window.calendarEvents = calendarEvents;
  window.profilesData = profilesData;
  window.chores = chores;
  window.userPoints = userPoints;
  window.badges = badges;
  window.completedChores = completedChores;
  window.pointLogs = pointLogs;
}

export async function main() {
  const allData = await loadAllData();
  assignData(allData);
  await initNotifications();

  // Wall data and interactions
  setWallData({ wallPostsRef: wallPosts, userKey: 'familyCurrentUser' });
  setupWallListeners();

  // Scoreboard & chores data (no globals)
  setScoreboardData({ userPoints, badges, completedChores });
  setChoresData({
    chores,
    badges,
    userPoints,
    completedChores,
    badgeTypes,
    pointLogs,
    onSave: (chores, completedChores, badges, userPoints) => {
      saveToSupabase('chores', chores, { replace: true });
      saveToSupabase('completed_chores', completedChores);
      saveToSupabase('badges', badges);
      saveToSupabase('user_points', userPoints);
    }
  });
  setProfileData(profilesData, badges, badgeTypes, userPoints, completedChores, pointLogs);

  // Q&A robust setup (NO undefined errors!)
  setupQA({
    qaListRef: qaList,
    qaListElRef: document.getElementById('qaList'),
    contentSearchRef: document.getElementById('contentSearch'),
    askBtnRef: document.getElementById('askBtn'),
    newQuestionInputRef: document.getElementById('newQuestion'),
    adminUsersRef: ['Ghassan', 'Mariem'],
    questionOnlyUsersRef: ['Yahya', 'Yazid'],
    currentUserKeyRef: 'familyCurrentUser',
    questionSelectRef: document.getElementById('questionSelect'),
    adminAnswerSectionRef: document.getElementById('adminAnswerSection'),
    answerInputRef: document.getElementById('answerInput'),
    saveAnswerBtnRef: document.getElementById('saveAnswerBtn')
  });

  setupCalendar({
    calendarEventsRef: calendarEvents,
    calendarBodyRef: document.getElementById('calendarBody'),
    eventListElRef: document.getElementById('eventList'),
    contentSearchRef: document.getElementById('contentSearch'),
    eventStartDateRef: document.getElementById('eventStartDate'),
    eventEndDateRef: document.getElementById('eventEndDate'),
    eventDescRef: document.getElementById('eventDesc'),
    addEventBtnRef: document.getElementById('addEventBtn')
  });

  setupChoresUI({
    addBtnRef: document.getElementById('addChoreBtn'),
    descInputRef: document.getElementById('choreDesc'),
    assignedToRef: document.getElementById('choreAssignedTo'),
    dueInputRef: document.getElementById('choreDue'),
    dailyCheckboxRef: document.getElementById('choreDaily'),
    showDailyOnlyRef: document.getElementById('showDailyOnly')
  });

  // Tab nav
  setupTabListeners();
  setActiveTab(0);
  setupSidebarToggle();

  // Render content (all null-checked in modules)
  renderWallPosts();
  renderQA();

  // Profile similarities
  Object.keys(profilesData).forEach(n => computeProfileSimilarities(n));

  // Greeting, admin, theme
  updateGreeting();
  updateUserAvatar();
  updateAdminVisibility();
  loadTheme();

  // Chores & scoreboard
  renderChores('', false);
  renderScoreboard();
  setupScoreboardListeners();
  setupSettings();

  // Profile editing
  setupProfileEditListeners();

}

