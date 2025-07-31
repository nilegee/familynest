(async () => {
  // A self‑invoking function to encapsulate all variables and avoid polluting the global scope. The code below is identical to the original script.js, with one key change: the service worker is registered using a relative path ('./sw.js') so that it registers correctly when the app is hosted in a subfolder (e.g., GitHub Pages).

  // ========== Cached DOM Elements ==========
  const userSelectModal = document.getElementById('userSelectModal');
  const userSelect = document.getElementById('userSelect');
  const confirmUserBtn = document.getElementById('confirmUserBtn');
  const currentUserDisplay = document.getElementById('currentUserDisplay');
  const changeUserBtn = document.getElementById('changeUserBtn');

  const tabs = Array.from(document.querySelectorAll('nav.sidebar li'));
  const sections = Array.from(document.querySelectorAll('main.content > section'));

  const sidebarSearch = document.getElementById('sidebarSearch');
  const contentSearch = document.getElementById('contentSearch');

  const wallPostsList = document.getElementById('wallPostsList');
  const addWallPostBtn = document.getElementById('addWallPostBtn');
  const newWallPostInput = document.getElementById('newWallPost');

  const qaListEl = document.getElementById('qaList');
  const askBtn = document.getElementById('askBtn');
  const newQuestionInput = document.getElementById('newQuestion');

  const adminAnswerSection = document.getElementById('adminAnswerSection');
  const questionSelect = document.getElementById('questionSelect');
  const answerInput = document.getElementById('answerInput');
  const saveAnswerBtn = document.getElementById('saveAnswerBtn');

  const calendarBody = document.getElementById('calendarBody');
  const eventListEl = document.getElementById('eventList');
  const eventStartDate = document.getElementById('eventStartDate');
  const eventEndDate = document.getElementById('eventEndDate');
  const eventDesc = document.getElementById('eventDesc');
  const addEventBtn = document.getElementById('addEventBtn');

  const showDailyOnlyCheckbox = document.getElementById('showDailyOnly');
  const scoreboardList = document.getElementById('scoreboardList');

  const profileDetailSection = document.getElementById('profileDetail');
  const profileContainer = document.getElementById('profileContainer');
  const profileNameHeading = document.getElementById('profileName');
  const profileAvatar = document.getElementById('profileAvatar');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const profileEditForm = document.getElementById('profileEditForm');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const cancelProfileBtn = document.getElementById('cancelProfileBtn');
  const similarityInfoEl = document.getElementById('similarityInfo');
  const editBirthdate = document.getElementById('editBirthdate');
  const editFavoriteColor = document.getElementById('editFavoriteColor');
  const editFavoriteFood = document.getElementById('editFavoriteFood');
  const editDislikedFood = document.getElementById('editDislikedFood');
  const editFavoriteWeekendActivity = document.getElementById('editFavoriteWeekendActivity');
  const editFavoriteGame = document.getElementById('editFavoriteGame');
  const editFavoriteMovie = document.getElementById('editFavoriteMovie');
  const editFavoriteHero = document.getElementById('editFavoriteHero');
  const editProfessionTitle = document.getElementById('editProfessionTitle');
  const editFunFact = document.getElementById('editFunFact');

  const currentDateDisplay = document.getElementById('currentDateDisplay');

  const notificationBtn = document.getElementById('notificationBtn');
  const notificationBadge = document.getElementById('notificationBadge');
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  // ========== Constants and Keys ==========
  const currentUserKey = 'familyCurrentUser';
  const wallPostsKey = 'familyWallPosts';
  const qaListKey = 'familyQAList';
  const calendarEventsKey = 'familyCalendarEvents';
  const profilesDataKey = 'familyProfilesData';

  // Keys for new features
  const choresKey = 'familyChores';
  const userPointsKey = 'familyUserPoints';
  const badgesKey = 'familyBadges';
  const themeKey = 'familyTheme';

  // Admin users and a simple PIN to restrict admin actions. In a real app
  // you would implement proper authentication. Kids cannot log in as
  const API_BASE = "http://localhost:3000/api";
  const endpointMap = {
    [wallPostsKey]: "/wallPosts",
    [calendarEventsKey]: "/calendarEvents",
    [choresKey]: "/chores",
    [profilesDataKey]: "/profiles"
  };
  // Ghassan/Mariem without entering this PIN.
  const adminUsers = ['Ghassan', 'Mariem'];
  const adminPin = '4321';

  // Badge definitions. Each badge has an id, name, description and an emoji/icon.
  const badgeTypes = [
    { id: 'super-helper', name: 'Super Helper', desc: 'Completed many chores', icon: '🏅' },
    { id: 'kind-heart', name: 'Kind Heart', desc: 'Always kind and helpful', icon: '💖' },
    { id: 'star-reader', name: 'Star Reader', desc: 'Reads lots of books', icon: '📚' },
    { id: 'tech-whiz', name: 'Tech Whiz', desc: 'Great with gadgets and games', icon: '🕹️' }
  ];

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


  const defaultWallPosts = [
    { id: generateId(), member: "Ghassan", text: "Just finished organizing the garden!", date: "2025-07-30T09:00:00", reactions: { "👍": 1, "❤️": 2 }, edited: false, userReactions: {} },
    { id: generateId(), member: "Yazid", text: "I won the game last night!", date: "2025-07-29T20:45:00", reactions: { "😂": 3 }, edited: false, userReactions: {} }
  ];

  const defaultQAList = [
    { id: generateId(), q: "What's for dinner?", a: "We’re having Koshari!" },
    { id: generateId(), q: "When is the next family trip?", a: "Next month, inshallah." }
  ];

  const defaultCalendarEvents = [
    { id: generateId(), start: "2025-08-11", end: "2025-08-14", desc: "Hotel visit - Centara Mirage Beach Resort" },
    { id: generateId(), start: "2025-08-31", end: "2025-08-31", desc: "Ghassan Birthday" },
    { id: generateId(), start: "2025-10-23", end: "2025-10-23", desc: "Yahya Birthday" },
    { id: generateId(), start: "2025-01-30", end: "2025-01-30", desc: "Mariem Birthday" },
    { id: generateId(), start: "2025-03-28", end: "2025-03-28", desc: "Yazid Birthday" }
  ];

  const defaultProfilesData = {
    Ghassan: { birthdate: "1981-08-31", favoriteColor: "Purple", favoriteFood: "Koshari", dislikedFood: "Spicy food", favoriteWeekendActivity: "Reading", favoriteGame: "Strategy RPG", favoriteMovie: "The Godfather", favoriteHero: "Sherlock Holmes", profession: { title: "HR Business Partner", description: "Helps companies manage their people so everyone works better together." }, funFact: "Loves Egyptian food and puzzles.", avatar: "" },
    Mariem: { birthdate: "1990-01-30", favoriteColor: "Teal", favoriteFood: "Grilled fish", dislikedFood: "Fast food", favoriteWeekendActivity: "Yoga", favoriteGame: "Puzzle games", favoriteMovie: "The Notebook", favoriteHero: "Wonder Woman", profession: { title: "Home Manager with Masters in Computer Science", description: "Takes care of home but also very smart with computers." }, funFact: "Master chef in the kitchen.", avatar: "" },
    Yazid: { birthdate: "2014-03-28", favoriteColor: "Blue", favoriteFood: "Pizza", dislikedFood: "Vegetables", favoriteWeekendActivity: "Playing football", favoriteGame: "Roblox", favoriteMovie: "Avengers", favoriteHero: "Iron Man", profession: { title: "Student in Year 6", description: "Learning many things in school and loves sports." }, funFact: "Fast runner in school races.", avatar: "", dreamJob: "Engineer 🛠️" },
    Yahya: { birthdate: "2017-10-23", favoriteColor: "Green", favoriteFood: "Burgers", dislikedFood: "Seafood", favoriteWeekendActivity: "Drawing", favoriteGame: "Minecraft", favoriteMovie: "Toy Story", favoriteHero: "Batman", profession: { title: "Student in Year 3", description: "Enjoys school and learning new things every day." }, funFact: "Can draw superheroes very well.", avatar: "", dreamJob: "Engineer 🛠️" }
  };

  const defaultChores = [
    { id: generateId(), desc: "Pray 5 times", assignedTo: "All", due: "", daily: true },
    { id: generateId(), desc: "Make your bed", assignedTo: "All", due: "", daily: true },
    { id: generateId(), desc: "Read stories", assignedTo: "Yahya", due: "", daily: false }
  ];
  const defaultUserPoints = { Ghassan: 0, Mariem: 0, Yazid: 0, Yahya: 0 };
  const defaultBadges = { Ghassan: [], Mariem: [], Yazid: [], Yahya: [] };
  // ========== Utility Functions ==========

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m]);
  }

  function formatDateLocal(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function timeAgo(dateStr) {
    const now = new Date();
    const past = new Date(dateStr);
    const diff = now - past;
    if (diff < 0) return 'in the future';
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }

  function calculateAge(dateStr) {
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

  function generateId() {
    return '_' + Math.random().toString(36).slice(2, 11);
  }

  function showAlert(message) {
    alert(message);
  }

  async function saveToStorage(key, data) {
    const endpoint = API_BASE + endpointMap[key];
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.warn('Server save failed:', e);
    }
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Storage error:', e);
      showAlert('Could not save data. Storage might be full or restricted.');
    }
  }

  async function loadFromStorage(key, defaultValue) {
    const endpoint = API_BASE + endpointMap[key];
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Bad response');
      const data = await res.json();
      localStorage.setItem(key, JSON.stringify(data));
      return data;
    } catch (e) {
      console.warn('Server load failed:', e);
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return defaultValue;
        return JSON.parse(raw);
      } catch {
        return defaultValue;
      }
    }
  }

  // ========== Data Declarations ==========
  let wallPosts;
  let qaList;
  let calendarEvents;
  let profilesData;
  let chores;
  let userPoints;
  let badges;
  // In-memory similarities and editing state

  function injectDefaultQA() {
    const defaults = [
      { q: 'I have a friend in class wearing a cross or praying to an elephant or praying to Jesus', a: 'People follow different religions. In Islam we believe in one God and we pray only to Him, but we respect others’ choices. The Qur’an teaches that Jesus said we should worship God alone.' },
      { q: 'Is Jesus God?', a: 'Muslims see Jesus (peace be upon him) as one of God’s greatest messengers. He called people to worship God alone and never claimed to be divine.' },
      { q: 'Why do people die?', a: 'Life in this world is temporary; death is the door to the next life. The Qur’an says every soul will taste death and that this life is but a test. Death lets us return to Allah and be rewarded for our good deeds.' },
      { q: 'Will Papa die? If Papa dies how will I see him?', a: 'Everyone, even prophets, passes away. Islam teaches that the soul continues; if we live righteously, we hope to reunite in Paradise. Good deeds and prayers for loved ones keep us connected.' },
      { q: 'Are we going to meet in Jannah?', a: 'That’s the goal! Paradise is for those who believe and do good. Families who love and help each other for Allah’s sake can be reunited there, so keep praying and doing good.' }
    ];
    defaults.forEach(item => {
      if (!qaList.some(q => q.q === item.q)) {
        qaList.push({ id: generateId(), q: item.q, a: item.a });
      }
    });
    saveToStorage(qaListKey, qaList);
  }

  async function loadAllData() {
    wallPosts = await loadFromStorage(wallPostsKey, defaultWallPosts);
    wallPosts.forEach(p => { if (!p.userReactions) p.userReactions = {}; });
    qaList = await loadFromStorage(qaListKey, defaultQAList);
    injectDefaultQA();
    calendarEvents = await loadFromStorage(calendarEventsKey, defaultCalendarEvents);
    profilesData = await loadFromStorage(profilesDataKey, defaultProfilesData);
    chores = await loadFromStorage(choresKey, defaultChores);
    userPoints = await loadFromStorage(userPointsKey, defaultUserPoints);
    badges = await loadFromStorage(badgesKey, defaultBadges);
  }
  let profileSimilarities = {};
  let currentEditingProfile = null;

  // ========== User Selection ==========

  function showUserModal() {
    userSelectModal.classList.remove('modal-hidden');
    userSelect.focus();
    trapFocus(userSelectModal);
  }

  function hideUserModal() {
    userSelectModal.classList.add('modal-hidden');
    releaseFocusTrap();
  }

  function checkUserSelection() {
    const user = localStorage.getItem(currentUserKey);
    if (!user) {
      showUserModal();
    } else {
      setCurrentUser(user);
    }
  }

  function setCurrentUser(user) {
    localStorage.setItem(currentUserKey, user);
    currentUserDisplay.textContent = user;
    updateGreeting();
  }

  // Override user confirmation to require a PIN for admin accounts
  confirmUserBtn.addEventListener('click', () => {
    const selectedUser = userSelect.value;
    if (!selectedUser) {
      showAlert('Please select your user.');
      return;
    }
    // If selected user is an admin, prompt for PIN
    if (adminUsers.includes(selectedUser)) {
      const entered = prompt('Enter admin PIN:');
      if (entered !== adminPin) {
        showAlert('Incorrect PIN.');
        return;
      }
    }
    setCurrentUser(selectedUser);
    hideUserModal();
  });

  changeUserBtn.addEventListener('click', () => {
    showUserModal();
  });

  // ========== Keyboard focus trap (accessibility) ==========

  let focusTrapElement = null;
  let lastFocusedElement = null;

  function trapFocus(element) {
    lastFocusedElement = document.activeElement;
    focusTrapElement = element;
    element.addEventListener('keydown', handleFocusTrap);
  }

  function releaseFocusTrap() {
    if (!focusTrapElement) return;
    focusTrapElement.removeEventListener('keydown', handleFocusTrap);
    focusTrapElement = null;
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function handleFocusTrap(e) {
    if (e.key !== 'Tab') return;
    const focusableElements = focusTrapElement.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    const focusable = Array.from(focusableElements);
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  }

  // ========== Tab & Section Navigation ==========

  let activeTabIndex = 0;

  function setActiveTab(index) {
    activeTabIndex = index;
    tabs.forEach((tab, i) => {
      const isActive = i === index;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
      if (sections[i]) sections[i].hidden = !isActive;
    });
    updateSearchFilters();
    // Render profile if it's a profile tab
    const name = tabs[index].textContent.trim();
    if (['Ghassan', 'Mariem', 'Yazid', 'Yahya'].includes(name)) {
      renderSingleProfile(name);
      profileDetailSection.hidden = false;
    } else {
      profileDetailSection.hidden = true;
    }
  }
  setActiveTab(0);

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => setActiveTab(i));
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const next = (i + 1) % tabs.length;
        tabs[next].focus();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = (i - 1 + tabs.length) % tabs.length;
        tabs[prev].focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActiveTab(i);
      }
    });
  });

  // ========== Wall Posts ==========

  function renderWallPosts(filterText = '') {
    wallPostsList.innerHTML = '';
    let filteredPosts = wallPosts;
    if (filterText) {
      const f = filterText.toLowerCase();
      filteredPosts = wallPosts.filter(p => p.text.toLowerCase().includes(f) || p.member.toLowerCase().includes(f));
    }
    filteredPosts.forEach(post => {
      const li = document.createElement('li');
      li.setAttribute('data-id', post.id);
      li.setAttribute('tabindex', '0');

      const safeText = escapeHtml(post.text);

      li.innerHTML = `
        <strong>${escapeHtml(post.member)}</strong>
        <span class="wall-post-date" title="${formatDateLocal(post.date)}">(${timeAgo(post.date)})${post.edited ? ' (edited)' : ''}</span>
        <div class="wall-post-text">${safeText}</div>
        <div class="wall-post-actions" aria-label="Post actions">
          <button class="reaction-btn" aria-label="Thumbs up reaction" data-reaction="👍">👍 ${post.reactions['👍'] || 0}</button>
          <button class="reaction-btn" aria-label="Heart reaction" data-reaction="❤️">❤️ ${post.reactions['❤️'] || 0}</button>
          <button class="reaction-btn" aria-label="Laugh reaction" data-reaction="😂">😂 ${post.reactions['😂'] || 0}</button>
          <button class="edit-btn" aria-label="Edit post"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="delete-btn" aria-label="Delete post"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;

      wallPostsList.appendChild(li);
    });
  }

  wallPostsList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const postId = li.getAttribute('data-id');
    const postIndex = wallPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    if (e.target.classList.contains('reaction-btn')) {
      // Handle reaction toggling per user
      const reaction = e.target.getAttribute('data-reaction');
      const currentUser = localStorage.getItem(currentUserKey);
      if (!currentUser) {
        showAlert('Please select your user first.');
        showUserModal();
        return;
      }
      const post = wallPosts[postIndex];
      // Ensure reaction count and userReactions objects exist
      post.reactions = post.reactions || {};
      post.userReactions = post.userReactions || {};
      const userReacts = post.userReactions[currentUser] || [];
      const idx = userReacts.indexOf(reaction);
      if (idx !== -1) {
        // User already reacted with this reaction, so remove it
        userReacts.splice(idx, 1);
        post.reactions[reaction] = Math.max(0, (post.reactions[reaction] || 1) - 1);
      } else {
        // Add reaction
        userReacts.push(reaction);
        post.reactions[reaction] = (post.reactions[reaction] || 0) + 1;
      }
      post.userReactions[currentUser] = userReacts;
      saveToStorage(wallPostsKey, wallPosts);
      renderWallPosts(contentSearch.value);
      incrementNotification();
    } else if (e.target.classList.contains('edit-btn')) {
      enterWallPostEditMode(postId);
    } else if (e.target.classList.contains('delete-btn')) {
      if (confirm('Delete this post?')) {
        wallPosts.splice(postIndex, 1);
        saveToStorage(wallPostsKey, wallPosts);
        renderWallPosts(contentSearch.value);
      }
    }
  });

  function enterWallPostEditMode(postId) {
    const li = wallPostsList.querySelector(`li[data-id="${postId}"]`);
    if (!li) return;

    const post = wallPosts.find(p => p.id === postId);
    if (!post) return;

    li.innerHTML = `
      <strong>${escapeHtml(post.member)}</strong>
      <span class="wall-post-date" title="${formatDateLocal(post.date)}">(Editing)</span>
      <textarea class="wall-post-edit-text" aria-label="Edit post text">${post.text}</textarea>
      <div class="wall-post-edit-area">
        <button class="save-edit-btn">Save</button>
        <button class="cancel-edit-btn">Cancel</button>
      </div>
    `;

    const textarea = li.querySelector('.wall-post-edit-text');
    const saveBtn = li.querySelector('.save-edit-btn');
    const cancelBtn = li.querySelector('.cancel-edit-btn');

    saveBtn.addEventListener('click', () => {
      const newText = textarea.value.trim();
      if (!newText) {
        showAlert('Post text cannot be empty.');
        return;
      }
      post.text = newText;
      post.edited = true;
      post.date = new Date().toISOString();
      saveToStorage(wallPostsKey, wallPosts);
      renderWallPosts(contentSearch.value);
    });

    cancelBtn.addEventListener('click', () => {
      renderWallPosts(contentSearch.value);
    });

    textarea.focus();
  }

  addWallPostBtn.addEventListener('click', () => {
    const text = newWallPostInput.value.trim();
    if (!text) {
      showAlert('Please enter something to post.');
      return;
    }
    const currentUser = localStorage.getItem(currentUserKey);
    if (!currentUser) {
      showAlert('Please select your user first.');
      showUserModal();
      return;
    }
    wallPosts.unshift({
      id: generateId(),
      member: currentUser,
      text,
      date: new Date().toISOString(),
      reactions: {},
      edited: false,
      userReactions: {}
    });
    saveToStorage(wallPostsKey, wallPosts);
    newWallPostInput.value = '';
    renderWallPosts(contentSearch.value);
    incrementNotification();
  });

  // ========== Q&A Section ==========

  function renderQA(filterText = '') {
    qaListEl.innerHTML = '';
    let filtered = qaList;
    if (filterText) {
      const f = filterText.toLowerCase();
      filtered = qaList.filter(item => item.q.toLowerCase().includes(f) || (item.a && item.a.toLowerCase().includes(f)));
    }
    filtered.forEach(item => {
      const li = document.createElement('li');
      li.setAttribute('data-id', item.id);
      li.setAttribute('tabindex', '0');
      li.innerHTML = `
        <div class="qa-question">Q: ${escapeHtml(item.q)}</div>
        <div class="qa-answer">${item.a ? `A: ${escapeHtml(item.a)}` : '<i>Waiting for answer...</i>'}</div>
        <div class="qa-actions">
          <button class="edit-q-btn" aria-label="Edit question"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="delete-q-btn" aria-label="Delete question"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;
      qaListEl.appendChild(li);
    });
    renderAdminQuestionOptions();
  }

  askBtn.addEventListener('click', () => {
    const q = newQuestionInput.value.trim();
    if (!q) {
      showAlert('Please enter your question.');
      return;
    }
    const id = generateId();
    qaList.unshift({ id, q, a: '' });
    saveToStorage(qaListKey, qaList);
    newQuestionInput.value = '';
    renderQA(contentSearch.value);
    incrementNotification();
  });

  qaListEl.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const id = li.getAttribute('data-id');
    const index = qaList.findIndex(item => item.id === id);
    if (index === -1) return;

    if (e.target.classList.contains('delete-q-btn')) {
      if (confirm('Delete this question?')) {
        qaList.splice(index, 1);
        saveToStorage(qaListKey, qaList);
        renderQA(contentSearch.value);
      }
    } else if (e.target.classList.contains('edit-q-btn')) {
      enterQAEditMode(id);
    }
  });

  function enterQAEditMode(id) {
    const li = qaListEl.querySelector(`li[data-id="${id}"]`);
    if (!li) return;
    const qaItem = qaList.find(item => item.id === id);
    li.innerHTML = `
      <textarea class="qa-edit-question" aria-label="Edit question">${qaItem.q}</textarea>
      <textarea class="qa-edit-answer" aria-label="Edit answer">${qaItem.a || ''}</textarea>
      <div class="qa-edit-actions">
        <button class="save-qa-btn">Save</button>
        <button class="cancel-qa-btn">Cancel</button>
      </div>
    `;
    const qEdit = li.querySelector('.qa-edit-question');
    const aEdit = li.querySelector('.qa-edit-answer');
    const saveBtn = li.querySelector('.save-qa-btn');
    const cancelBtn = li.querySelector('.cancel-qa-btn');
    saveBtn.addEventListener('click', () => {
      const newQ = qEdit.value.trim();
      const newA = aEdit.value.trim();
      if (!newQ) {
        showAlert('Question cannot be empty.');
        return;
      }
      qaItem.q = newQ;
      qaItem.a = newA;
      saveToStorage(qaListKey, qaList);
      renderQA(contentSearch.value);
    });
    cancelBtn.addEventListener('click', () => {
      renderQA(contentSearch.value);
    });
    qEdit.focus();
  }

  function renderAdminQuestionOptions() {
    // Populate the dropdown with unanswered questions for admin to answer
    questionSelect.innerHTML = '';
    qaList.filter(item => !item.a).forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.q;
      questionSelect.appendChild(option);
    });
    adminAnswerSection.hidden = questionSelect.options.length === 0;
  }

  saveAnswerBtn.addEventListener('click', () => {
    const selected = questionSelect.value;
    const answer = answerInput.value.trim();
    if (!selected || !answer) {
      showAlert('Select a question and type an answer.');
      return;
    }
    const qaItem = qaList.find(item => item.id === selected);
    qaItem.a = answer;
    saveToStorage(qaListKey, qaList);
    answerInput.value = '';
    renderQA(contentSearch.value);
  });

  // ========== Calendar ==========

  function renderCalendarTable() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    calendarBody.innerHTML = '';
    let day = 1;
    for (let r = 0; r < 6; r++) {
      const row = document.createElement('tr');
      for (let c = 0; c < 7; c++) {
        const cell = document.createElement('td');
        cell.style.padding = '6px';
        cell.style.border = '1px solid #ddd';
        cell.style.textAlign = 'center';
        if (r === 0 && c < startDay) {
          cell.textContent = '';
        } else if (day > daysInMonth) {
          cell.textContent = '';
        } else {
          cell.textContent = day;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          cell.setAttribute('data-date', dateStr);
          day++;
        }
        row.appendChild(cell);
      }
      calendarBody.appendChild(row);
    }
  }

  function renderCalendarEventsList(filterDesc = '') {
    eventListEl.innerHTML = '';
    let filtered = calendarEvents;
    if (filterDesc) {
      const f = filterDesc.toLowerCase();
      filtered = calendarEvents.filter(ev => ev.desc.toLowerCase().includes(f));
    }
    filtered.forEach(ev => {
      const li = document.createElement('li');
      li.setAttribute('data-id', ev.id);
      li.setAttribute('tabindex', '0');
      li.textContent = `${ev.start}${ev.end && ev.end !== ev.start ? '–' + ev.end : ''}: ${ev.desc}`;
      eventListEl.appendChild(li);
    });
  }

  addEventBtn.addEventListener('click', () => {
    const start = eventStartDate.value;
    const end = eventEndDate.value;
    const desc = eventDesc.value.trim();
    if (!start || !desc) {
      showAlert('Start date and description are required.');
      return;
    }
    if (end && new Date(end) < new Date(start)) {
      showAlert('End date cannot be before start date.');
      return;
    }
    calendarEvents.push({ id: generateId(), start, end: end || start, desc });
    saveToStorage(calendarEventsKey, calendarEvents);
    eventStartDate.value = '';
    eventEndDate.value = '';
    eventDesc.value = '';
    renderCalendarEventsList(contentSearch.value);
    renderCalendarTable();
    incrementNotification();
  });

  calendarTableClickHandler();

  function calendarTableClickHandler() {
    calendarBody.addEventListener('click', e => {
      const cell = e.target.closest('td[data-date]');
      if (!cell) return;
      const date = cell.getAttribute('data-date');
      const filtered = calendarEvents.filter(ev => ev.start <= date && ev.end >= date);
      if (filtered.length) {
        const msg = filtered.map(ev => `${ev.desc} (${ev.start}${ev.end && ev.end !== ev.start ? '–' + ev.end : ''})`).join('\n');
        alert(msg);
      }
    });
  }

  // ========== Chores ==========

  function renderChores(filterText = '', dailyOnly = false) {
    const list = document.getElementById('choresList');
    list.innerHTML = '';
    let filtered = chores;
    if (dailyOnly) {
      filtered = filtered.filter(item => item.daily);
    }
    if (filterText) {
      const f = filterText.toLowerCase();
      filtered = filtered.filter(item => item.desc.toLowerCase().includes(f) || (item.assignedTo && item.assignedTo.toLowerCase().includes(f)));
    }
    filtered.forEach(item => {
      const li = document.createElement('li');
      li.setAttribute('data-id', item.id);
      const dueHtml = item.daily ? '' : `<span class="chore-due">${item.due}</span>`;
      li.innerHTML = `
        <span class="chore-desc">${escapeHtml(item.desc)}${item.daily ? '<span class="daily-label">Daily</span>' : ''}</span>
        <span class="chore-assignee">${item.assignedTo}</span>
        ${dueHtml}
      `;
      list.appendChild(li);
    });
  }

  function incrementPoints(user, amount = 1) {
    userPoints[user] = (userPoints[user] || 0) + amount;
    saveToStorage(userPointsKey, userPoints);
    renderScoreboard();
  }

  function grantBadge(user, badgeId) {
    const badge = badgeTypes.find(b => b.id === badgeId);
    if (!badge) return;
    badges[user] = badges[user] || [];
    if (!badges[user].some(b => b.id === badgeId)) {
      badges[user].push(badge);
      saveToStorage(badgesKey, badges);
      renderScoreboard();
    }
  }

  function computeProfileSimilarities(name) {
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

  function renderScoreboard() {
    if (!scoreboardList) return;
    scoreboardList.innerHTML = '';
    Object.keys(userPoints).forEach(name => {
      const badgeHtml = (badges[name] || [])
        .map(b => `<span title="${escapeHtml(b.name)}">${b.icon}</span>`)
        .join('');
      const li = document.createElement('li');
      li.innerHTML = `<span>${escapeHtml(name)}</span>` +
        `<span>${userPoints[name] || 0} pts</span>` +
        `<span class="scoreboard-badges">${badgeHtml}</span>`;
      scoreboardList.appendChild(li);
    });
  }

  editProfileBtn.addEventListener('click', () => {
    currentEditingProfile = profileNameHeading.dataset.name;
    renderSingleProfile(currentEditingProfile);
  });

  saveProfileBtn.addEventListener('click', () => {
    if (!currentEditingProfile) return;
    const p = profilesData[currentEditingProfile];
    p.birthdate = editBirthdate.value;
    p.favoriteColor = editFavoriteColor.value.trim();
    p.favoriteFood = editFavoriteFood.value.trim();
    p.dislikedFood = editDislikedFood.value.trim();
    p.favoriteWeekendActivity = editFavoriteWeekendActivity.value.trim();
    p.favoriteGame = editFavoriteGame.value.trim();
    p.favoriteMovie = editFavoriteMovie.value.trim();
    p.favoriteHero = editFavoriteHero.value.trim();
    p.profession.title = editProfessionTitle.value.trim();
    p.funFact = editFunFact.value.trim();
    saveToStorage(profilesDataKey, profilesData);
    computeProfileSimilarities(currentEditingProfile);
    const name = currentEditingProfile;
    currentEditingProfile = null;
    renderSingleProfile(name);
  });

  cancelProfileBtn.addEventListener('click', () => {
    currentEditingProfile = null;
    renderSingleProfile(profileNameHeading.dataset.name);
  });

  function updateAdminVisibility() {
    const user = localStorage.getItem(currentUserKey);
    const isAdmin = adminUsers.includes(user);
    document.getElementById('choreAdminPanel').hidden = !isAdmin;
    adminAnswerSection.hidden = !isAdmin || !qaList.some(item => !item.a);
  }

  // Add chore logic
  const addChoreBtn = document.getElementById('addChoreBtn');
  addChoreBtn.addEventListener('click', () => {
    const desc = document.getElementById('choreDesc').value.trim();
    const assignedTo = document.getElementById('choreAssignedTo').value;
    const due = document.getElementById('choreDue').value;
    const daily = document.getElementById('choreDaily').checked;
    if (!desc || (!daily && !due)) {
      showAlert('Please enter a description' + (daily ? '' : ' and due date') + '.');
      return;
    }
    const id = generateId();
    chores.push({ id, desc, assignedTo, due: daily ? '' : due, daily });
    saveToStorage(choresKey, chores);
    renderChores(contentSearch.value);
    // Award points and badges for assigning chores
    if (assignedTo !== 'All') {
      incrementPoints(assignedTo);
      if ((userPoints[assignedTo] || 0) % 5 === 0) {
        grantBadge(assignedTo, 'super-helper');
      }
    }
    incrementNotification();
  });

  // ========== Notifications ==========

  function incrementNotification() {
    const count = Number(notificationBadge.textContent || 0) + 1;
    notificationBadge.textContent = count;
    notificationBadge.style.display = 'inline-block';
    notificationBtn.setAttribute('aria-label', `${count} new notifications`);
  }

  function clearNotifications() {
    notificationBadge.textContent = '';
    notificationBadge.style.display = 'none';
    notificationBtn.setAttribute('aria-label', 'Notifications');
  }

  notificationBtn.addEventListener('click', () => {
    clearNotifications();
  });

  // ========== Search Filtering ==========

  function updateSearchFilters() {
    const filter = contentSearch.value.trim().toLowerCase();
    const activeTab = tabs[activeTabIndex].textContent.trim();
    switch (activeTab) {
      case 'Wall':
        renderWallPosts(filter);
        break;
      case 'Q&A':
        renderQA(filter);
        break;
      case 'Calendar':
        renderCalendarEventsList(filter);
        break;
      case 'Chores':
        renderChores(filter, showDailyOnlyCheckbox.checked);
        break;
      case 'Scoreboard':
        renderScoreboard();
        break;
      case 'Ghassan':
      case 'Mariem':
      case 'Yazid':
      case 'Yahya':
        // Nothing to filter for profiles yet
        break;
    }
  }

  sidebarSearch.addEventListener('input', () => {
    const query = sidebarSearch.value.trim().toLowerCase();
    tabs.forEach(li => {
      li.style.display = li.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
  });

  contentSearch.addEventListener('input', () => {
    updateSearchFilters();
  });

  showDailyOnlyCheckbox.addEventListener('change', () => {
    const filter = contentSearch.value.trim().toLowerCase();
    renderChores(filter, showDailyOnlyCheckbox.checked);
  });

  // ========== Profile Logic ==========

  function renderSingleProfile(name) {
    const profile = profilesData[name];
    let headingText = name;
    if (profile.dreamJob) {
      const job = profile.dreamJob.replace('🛠️', '').trim();
      const emoji = profile.dreamJob.includes('🛠️') ? '🛠️ ' : '';
      headingText = `${emoji}${job} ${name}`;
    }
    profileNameHeading.dataset.name = name;
    profileNameHeading.childNodes[0].nodeValue = headingText;
    if (profile.avatar) {
      profileAvatar.src = profile.avatar;
    } else {
      profileAvatar.src = 'icons/default-avatar.svg';
    }
    profileAvatar.alt = 'Avatar for ' + name;
    profileAvatar.style.display = 'inline-block';
    const currentUser = localStorage.getItem(currentUserKey);
    const canEdit = currentUser === name || adminUsers.includes(currentUser);

    if (currentEditingProfile === name) {
      editProfileBtn.hidden = true;
      profileContainer.style.display = 'none';
      similarityInfoEl.hidden = true;
      profileEditForm.hidden = false;
      editBirthdate.value = profile.birthdate || '';
      editFavoriteColor.value = profile.favoriteColor || '';
      editFavoriteFood.value = profile.favoriteFood || '';
      editDislikedFood.value = profile.dislikedFood || '';
      editFavoriteWeekendActivity.value = profile.favoriteWeekendActivity || '';
      editFavoriteGame.value = profile.favoriteGame || '';
      editFavoriteMovie.value = profile.favoriteMovie || '';
      editFavoriteHero.value = profile.favoriteHero || '';
      editProfessionTitle.value = profile.profession.title || '';
      editFunFact.value = profile.funFact || '';
      return;
    }

    profileEditForm.hidden = true;
    editProfileBtn.hidden = !canEdit;
    profileContainer.style.display = '';
    profileContainer.innerHTML = '';

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
            saveToStorage(profilesDataKey, profilesData);
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


  // ========== Initialization ==========

  function init() {
    checkUserSelection();
    renderWallPosts();
    renderQA();
    renderCalendarTable();
    renderCalendarEventsList();
    Object.keys(profilesData).forEach(n => computeProfileSimilarities(n));
    updateGreeting();
    updateAdminVisibility();
    renderChores('', showDailyOnlyCheckbox.checked);
    renderScoreboard();
    loadTheme();
  }

  // Update the greeting line to include the current date and time for the user
  function updateGreeting() {
    const user = localStorage.getItem(currentUserKey) || 'Guest';
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateDisplay.textContent = now.toLocaleDateString(undefined, options);
    currentUserDisplay.textContent = user;
  }

  function loadTheme() {
    const theme = localStorage.getItem(themeKey) || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    if (themeToggleBtn) themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', current);
      localStorage.setItem(themeKey, current);
      themeToggleBtn.textContent = current === 'dark' ? '☀️' : '🌙';
    });
  }

  // ===== Responsive sidebar toggling =====
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebarEl = document.querySelector('nav.sidebar');
  const sidebarOverlayEl = document.getElementById('sidebarOverlay');
  if (hamburgerBtn && sidebarEl) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = sidebarEl.classList.toggle('open');
      if (sidebarOverlayEl) {
        sidebarOverlayEl.classList.toggle('visible', isOpen);
      }
    });
  }
  // Close sidebar when the overlay is clicked
  if (sidebarOverlayEl && sidebarEl) {
    sidebarOverlayEl.addEventListener('click', () => {
      sidebarEl.classList.remove('open');
      sidebarOverlayEl.classList.remove('visible');
    });
  }
  // Close sidebar when a menu item is selected on small screens
  tabs.forEach(li => {
    li.addEventListener('click', () => {
      if (window.innerWidth <= 700 && sidebarEl) {
        if (!window.matchMedia('(orientation: portrait)').matches) {
          sidebarEl.classList.remove('open');
          if (sidebarOverlayEl) sidebarOverlayEl.classList.remove('visible');
        } else {
          sidebarEl.classList.add('open');
          if (sidebarOverlayEl) sidebarOverlayEl.classList.add('visible');
        }
      }
    });
  });

  // Open sidebar automatically when in portrait mode on small screens
  function handleOrientation() {
    if (window.matchMedia('(orientation: portrait)').matches && window.innerWidth <= 700) {
      sidebarEl.classList.add('open');
      if (sidebarOverlayEl) sidebarOverlayEl.classList.add('visible');
    } else {
      sidebarEl.classList.remove('open');
      if (sidebarOverlayEl) sidebarOverlayEl.classList.remove('visible');
    }
  }
  handleOrientation();
  window.addEventListener('orientationchange', handleOrientation);

  // ========== Service Worker Registration ==========
  // Use a relative path when registering the service worker so that it works on GitHub Pages or when the app is served from a subdirectory.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.error('Service worker registration failed:', err);
      });
    });
  }

  // Kick off the initial rendering and setup
  loadAllData().then(init);

})();
