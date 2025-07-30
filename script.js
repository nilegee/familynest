(() => {
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

  const profileDetailSection = document.getElementById('profileDetail');
  const profileContainer = document.getElementById('profileContainer');
  const profileNameHeading = document.getElementById('profileName');
  const profileAvatar = document.getElementById('profileAvatar');
  const addFamilyMemberBtn = document.getElementById('addFamilyMemberBtn');
  const removeFamilyMemberBtn = document.getElementById('removeFamilyMemberBtn');

  const currentDateDisplay = document.getElementById('currentDateDisplay');

  const notificationBtn = document.getElementById('notificationBtn');
  const notificationBadge = document.getElementById('notificationBadge');

  // --- Responsive Sidebar Hamburger Toggle ---
const sidebar = document.querySelector('nav.sidebar');
const overlay = document.getElementById('sidebarOverlay');
const hamburger = document.getElementById('hamburgerBtn');

// On mobile: hamburger toggles sidebar and overlay
if (hamburger && sidebar && overlay) {
  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
  // Optional: close sidebar when a tab is clicked (for mobile UX)
  sidebar.addEventListener('click', (e) => {
    if (window.innerWidth <= 700 && e.target.tagName === 'LI') {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    }
  });
}
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

  // Admin users and a simple PIN to restrict admin actions. In a real app
  // you would implement proper authentication. Kids cannot log in as
  // Ghassan/Mariem without entering this PIN.
  const adminUsers = ['Ghassan', 'Mariem'];
  const adminPin = '4321';

  // Removed duplicate badgeTypes declaration (see top for definition).

  // Badge definitions. Each badge has an id, name, description and an emoji/icon.
  const badgeTypes = [
    { id: 'super-helper', name: 'Super Helper', desc: 'Completed many chores', icon: '🏅' },
    { id: 'kind-heart', name: 'Kind Heart', desc: 'Always kind and helpful', icon: '💖' },
    { id: 'star-reader', name: 'Star Reader', desc: 'Reads lots of books', icon: '📚' },
    { id: 'tech-whiz', name: 'Tech Whiz', desc: 'Great with gadgets and games', icon: '🕹️' }
  ];

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

  function generateId() {
    return '_' + Math.random().toString(36).slice(2, 11);
  }

  function showAlert(message) {
    alert(message);
  }

  function saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Storage error:", e);
      showAlert("Could not save data. Storage might be full or restricted.");
    }
  }

  function loadFromStorage(key, defaultValue) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  }

  // ========== Data Declarations ==========
  let wallPosts = loadFromStorage(wallPostsKey, [
    {
      id: generateId(),
      member: "Ghassan",
      text: "Just finished organizing the garden!",
      date: "2025-07-30T09:00:00",
      reactions: { "👍": 1, "❤️": 2 },
      edited: false,
      userReactions: {}
    },
    {
      id: generateId(),
      member: "Yazid",
      text: "I won the game last night!",
      date: "2025-07-29T20:45:00",
      reactions: { "😂": 3 },
      edited: false,
      userReactions: {}
    }
  ]);

  // Ensure each loaded post has a userReactions object to track per-user interactions
  wallPosts.forEach(post => {
    if (!post.userReactions) post.userReactions = {};
  });

  // Q&A list. We load from storage and provide some default Q&A pairs.  In addition to
  // casual family questions, we include gentle answers to common faith and
  // life questions suitable for children.  These defaults are only added
  // once when the app first runs (if they are not already present).  The
  // answers are deliberately simplified summaries of Islamic teachings.
  let qaList = loadFromStorage(qaListKey, [
    { id: generateId(), q: "What's for dinner?", a: "We’re having Koshari!" },
    { id: generateId(), q: "When is the next family trip?", a: "Next month, inshallah." }
  ]);

  // Inject additional default Q&A entries about faith and life.  We avoid
  // duplicating questions by checking the question text.  These will only
  // appear once and are stored in localStorage like other Q&A entries.
  (function ensureDefaultQA() {
    const defaults = [
      {
        q: 'I have a friend in class wearing a cross or praying to an elephant or praying to Jesus',
        a: 'People follow different religions. In Islam we believe in one God and we pray only to Him, but we respect others’ choices. The Qur’an teaches that Jesus said we should worship God alone.'
      },
      {
        q: 'Is Jesus God?',
        a: 'Muslims see Jesus (peace be upon him) as one of God’s greatest messengers. He called people to worship God alone and never claimed to be divine.'
      },
      {
        q: 'Why do people die?',
        a: 'Life in this world is temporary; death is the door to the next life. The Qur’an says every soul will taste death and that this life is but a test. Death lets us return to Allah and be rewarded for our good deeds.'
      },
      {
        q: 'Will Papa die? If Papa dies how will I see him?',
        a: 'Everyone, even prophets, passes away. Islam teaches that the soul continues; if we live righteously, we hope to reunite in Paradise. Good deeds and prayers for loved ones keep us connected.'
      },
      {
        q: 'Are we going to meet in Jannah?',
        a: 'That’s the goal! Paradise is for those who believe and do good. Families who love and help each other for Allah’s sake can be reunited there, so keep praying and doing good.'
      }
    ];
    defaults.forEach(item => {
      if (!qaList.some(existing => existing.q === item.q)) {
        qaList.push({ id: generateId(), q: item.q, a: item.a });
      }
    });
    // Persist any newly injected defaults
    saveToStorage(qaListKey, qaList);
  })();

  let calendarEvents = loadFromStorage(calendarEventsKey, [
    { id: generateId(), start: "2025-08-11", end: "2025-08-14", desc: "Hotel visit - Centara Mirage Beach Resort" },
    { id: generateId(), start: "2025-08-31", end: "2025-08-31", desc: "Ghassan Birthday" },
    { id: generateId(), start: "2025-10-23", end: "2025-10-23", desc: "Yahya Birthday" },
    { id: generateId(), start: "2025-01-30", end: "2025-01-30", desc: "Mariem Birthday" },
    { id: generateId(), start: "2025-03-28", end: "2025-03-28", desc: "Yazid Birthday" }
  ]);

  let profilesData = loadFromStorage(profilesDataKey, {
    Ghassan: {
      birthdate: "1981-08-31",
      favoriteColor: "Purple",
      favoriteFood: "Koshari",
      dislikedFood: "Spicy food",
      favoriteWeekendActivity: "Reading",
      favoriteGame: "Strategy RPG",
      favoriteMovie: "The Godfather",
      favoriteHero: "Sherlock Holmes",
      profession: { title: "HR Business Partner", description: "Helps companies manage their people so everyone works better together." },
      funFact: "Loves Egyptian food and puzzles.",
      avatar: ""
    },
    Mariem: {
      birthdate: "1990-01-30",
      favoriteColor: "Teal",
      favoriteFood: "Grilled fish",
      dislikedFood: "Fast food",
      favoriteWeekendActivity: "Yoga",
      favoriteGame: "Puzzle games",
      favoriteMovie: "The Notebook",
      favoriteHero: "Wonder Woman",
      profession: { title: "Home Manager with Masters in Computer Science", description: "Takes care of home but also very smart with computers." },
      funFact: "Master chef in the kitchen.",
      avatar: ""
    },
    Yazid: {
      birthdate: "2014-03-28",
      favoriteColor: "Blue",
      favoriteFood: "Pizza",
      dislikedFood: "Vegetables",
      favoriteWeekendActivity: "Playing football",
      favoriteGame: "Roblox",
      favoriteMovie: "Avengers",
      favoriteHero: "Iron Man",
      profession: { title: "Student in Year 6", description: "Learning many things in school and loves sports." },
      funFact: "Fast runner in school races.",
      avatar: ""
    },
    Yahya: {
      birthdate: "2017-10-23",
      favoriteColor: "Green",
      favoriteFood: "Burgers",
      dislikedFood: "Seafood",
      favoriteWeekendActivity: "Drawing",
      favoriteGame: "Minecraft",
      favoriteMovie: "Toy Story",
      favoriteHero: "Batman",
      profession: { title: "Student in Year 3", description: "Enjoys school and learning new things every day." },
      funFact: "Can draw superheroes very well.",
      avatar: ""
    }
  });

  // ========== New Data for Chores, Points and Badges ==========
  let chores = loadFromStorage(choresKey, []);
  let userPoints = loadFromStorage(userPointsKey, {
    Ghassan: 0,
    Mariem: 0,
    Yazid: 0,
    Yahya: 0
  });
  let badges = loadFromStorage(badgesKey, {
    Ghassan: [],
    Mariem: [],
    Yazid: [],
    Yahya: []
  });

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
      showAlert("Please select your user.");
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
          <button class="reaction-btn" aria-label="Thumbs up reaction" data-reaction="👍">👍 ${post.reactions["👍"] || 0}</button>
          <button class="reaction-btn" aria-label="Heart reaction" data-reaction="❤️">❤️ ${post.reactions["❤️"] || 0}</button>
          <button class="reaction-btn" aria-label="Laugh reaction" data-reaction="😂">😂 ${post.reactions["😂"] || 0}</button>
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
        showAlert("Please select your user first.");
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
      if (confirm("Delete this post?")) {
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
        showAlert("Post text cannot be empty.");
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
      showAlert("Please enter something to post.");
      return;
    }
    const currentUser = localStorage.getItem(currentUserKey);
    if (!currentUser) {
      showAlert("Please select your user first.");
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
    const question = newQuestionInput.value.trim();
    if (!question) {
      showAlert("Please enter a question.");
      return;
    }
    qaList.unshift({ id: generateId(), q: question, a: '' });
    saveToStorage(qaListKey, qaList);
    newQuestionInput.value = '';
    renderQA(contentSearch.value);
    incrementNotification();
  });

  qaListEl.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const id = li.getAttribute('data-id');
    const index = qaList.findIndex(q => q.id === id);
    if (index === -1) return;

    if (e.target.classList.contains('edit-q-btn')) {
      enterEditQuestionMode(id);
    } else if (e.target.classList.contains('delete-q-btn')) {
      if (confirm("Delete this question?")) {
        qaList.splice(index, 1);
        saveToStorage(qaListKey, qaList);
        renderQA(contentSearch.value);
      }
    }
  });

  function enterEditQuestionMode(id) {
    const li = qaListEl.querySelector(`li[data-id="${id}"]`);
    if (!li) return;
    const question = qaList.find(q => q.id === id);
    if (!question) return;

    li.innerHTML = `
      <textarea class="edit-q-textarea" aria-label="Edit question">${question.q}</textarea>
      <div class="qa-actions">
        <button class="save-q-edit-btn">Save</button>
        <button class="cancel-q-edit-btn">Cancel</button>
      </div>
    `;

    const textarea = li.querySelector('.edit-q-textarea');
    const saveBtn = li.querySelector('.save-q-edit-btn');
    const cancelBtn = li.querySelector('.cancel-q-edit-btn');

    saveBtn.addEventListener('click', () => {
      const newQ = textarea.value.trim();
      if (!newQ) {
        showAlert("Question cannot be empty.");
        return;
      }
      question.q = newQ;
      saveToStorage(qaListKey, qaList);
      renderQA(contentSearch.value);
    });

    cancelBtn.addEventListener('click', () => {
      renderQA(contentSearch.value);
    });

    textarea.focus();
  }

  function renderAdminQuestionOptions() {
    const currentUser = localStorage.getItem(currentUserKey);
    const isAdmin = adminUsers.includes(currentUser);
    const unanswered = qaList.filter(q => !q.a);
    questionSelect.innerHTML = '';
    if (!isAdmin || unanswered.length === 0) {
      adminAnswerSection.hidden = true;
      return;
    }
    adminAnswerSection.hidden = false;
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '-- Select question --';
    placeholder.disabled = true;
    placeholder.selected = true;
    questionSelect.appendChild(placeholder);
    unanswered.forEach(q => {
      const option = document.createElement('option');
      option.value = q.id;
      option.textContent = q.q;
      questionSelect.appendChild(option);
    });
    answerInput.value = '';
  }

  saveAnswerBtn.addEventListener('click', () => {
    const qid = questionSelect.value;
    const answer = answerInput.value.trim();
    if (!qid) {
      showAlert("Please select a question.");
      return;
    }
    if (!answer) {
      showAlert("Answer cannot be empty.");
      return;
    }
    const question = qaList.find(q => q.id === qid);
    if (!question) return;
    question.a = answer;
    saveToStorage(qaListKey, qaList);
    renderQA(contentSearch.value);
  });

  // ========== Calendar Section ==========

  function getEventCategory(desc) {
    const lower = desc.toLowerCase();
    if (lower.includes('birthday')) return { emoji: '🎂', color: '#9c27b0' };
    if (lower.includes('hotel') || lower.includes('trip') || lower.includes('visit')) return { emoji: '🏨', color: '#2196f3' };
    return { emoji: '📅', color: '#4caf50' };
  }

  function renderCalendarEventsList() {
    eventListEl.innerHTML = '';
    // Sort events by start date to show them in chronological order
    calendarEvents.sort((a, b) => a.start.localeCompare(b.start));
    calendarEvents.forEach((ev, idx) => {
      const { emoji, color } = getEventCategory(ev.desc);
      const li = document.createElement('li');
      li.style.color = color;
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.style.userSelect = 'none';

      li.innerHTML = `
        <span>${emoji} <strong>${ev.start}${ev.start !== ev.end ? ' to ' + ev.end : ''}</strong> - ${escapeHtml(ev.desc)}</span>
        <div>
          <button class="edit-event-btn" aria-label="Edit event"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="delete-event-btn" aria-label="Delete event"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;

      li.querySelector('.delete-event-btn').onclick = () => {
        if (confirm(`Delete event: "${ev.desc}" (${ev.start} to ${ev.end})?`)) {
          calendarEvents.splice(idx, 1);
          saveToStorage(calendarEventsKey, calendarEvents);
          renderCalendarEventsList();
          renderCalendarTable();
        }
      };

      li.querySelector('.edit-event-btn').onclick = () => {
        eventStartDate.value = ev.start;
        eventEndDate.value = ev.end;
        eventDesc.value = ev.desc;
        addEventBtn.textContent = 'Update Event';
        addEventBtn.dataset.editingId = ev.id;
        const idx = tabs.findIndex(t => t.textContent === 'Calendar');
        setActiveTab(idx);
      };

      eventListEl.appendChild(li);
    });
  }

  function renderCalendarTable() {
    calendarBody.innerHTML = '';
    const now = new Date();
    const year = 2025;
    const month = 7; // August (0-based)

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    let day = 1;
    for (let week = 0; week < 6; week++) {
      if (day > daysInMonth) break;
      const tr = document.createElement('tr');

      for (let dow = 0; dow < 7; dow++) {
        const td = document.createElement('td');
        td.style.border = '1px solid #ddd';
        td.style.padding = '10px';
        td.style.textAlign = 'center';
        td.style.userSelect = 'none';
        td.setAttribute('role', 'gridcell');
        td.tabIndex = -1;

        if (week === 0 && dow < startDay) {
          td.innerHTML = '';
        } else if (day > daysInMonth) {
          td.innerHTML = '';
        } else {
          td.textContent = day;

          if (year === now.getFullYear() && month === now.getMonth() && day === now.getDate()) {
            td.style.border = '2px solid #f44336';
            td.style.fontWeight = '700';
          }

          const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          calendarEvents.forEach(ev => {
            if (currentDateStr >= ev.start && currentDateStr <= ev.end) {
              const { color } = getEventCategory(ev.desc);
              td.style.backgroundColor = color;
              td.style.color = 'white';
              td.style.borderRadius = '50%';
            }
          });

          day++;
        }
        tr.appendChild(td);
      }
      calendarBody.appendChild(tr);
    }
  }

  addEventBtn.addEventListener('click', () => {
    const start = eventStartDate.value;
    const end = eventEndDate.value || start;
    const desc = eventDesc.value.trim();
    if (!start || !desc) {
      showAlert("Start date and description are required.");
      return;
    }
    if (end < start) {
      showAlert("End date cannot be before start date.");
      return;
    }

    if (addEventBtn.dataset.editingId) {
      const editingId = addEventBtn.dataset.editingId;
      const idx = calendarEvents.findIndex(e => e.id === editingId);
      if (idx !== -1) {
        calendarEvents[idx] = { id: editingId, start, end, desc };
        saveToStorage(calendarEventsKey, calendarEvents);
        addEventBtn.textContent = 'Add Event';
        delete addEventBtn.dataset.editingId;
        eventStartDate.value = '';
        eventEndDate.value = '';
        eventDesc.value = '';
        renderCalendarTable();
        renderCalendarEventsList();
        return;
      }
    }

    calendarEvents.push({ id: generateId(), start, end, desc });
    saveToStorage(calendarEventsKey, calendarEvents);
    eventStartDate.value = '';
    eventEndDate.value = '';
    eventDesc.value = '';
    renderCalendarTable();
    renderCalendarEventsList();
  });

  // ========== Profiles Section ==========

  function calculateAge(birthdateStr) {
    const birthdate = new Date(birthdateStr);
    const now = new Date();

    let years = now.getFullYear() - birthdate.getFullYear();
    let months = now.getMonth() - birthdate.getMonth();
    let days = now.getDate() - birthdate.getDate();

    if (days < 0) {
      months--;
      days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years} year(s), ${months} month(s), and ${days} day(s)`;
  }

  function renderSingleProfile(name) {
    const profile = profilesData[name];
    if (!profile) {
      profileContainer.innerHTML = `<p>Profile for ${name} not found.</p>`;
      profileDetailSection.hidden = false;
      return;
    }

    profileNameHeading.textContent = name;
    profileNameHeading.appendChild(profileAvatar);
    profileAvatar.src = profile.avatar || defaultAvatarForName(name);
    profileAvatar.alt = `${name} avatar`;

    profileContainer.innerHTML = '';

    // Rearrange profile fields into a more logical order: birthday and age, profession
    // information, then favourites and fun fact, ending with avatar upload.
    const fields = [
      { key: 'birthdate', label: 'Birthdate', type: 'date', disabled: false },
      { key: 'age', label: 'Age Today', type: 'text', disabled: true },
      { key: 'profession.title', label: 'Profession', type: 'text' },
      { key: 'profession.description', label: 'Profession Description', type: 'textarea' },
      { key: 'favoriteColor', label: 'Favorite Color', type: 'text' },
      { key: 'favoriteFood', label: 'Favorite Food', type: 'text' },
      { key: 'dislikedFood', label: "Food I Don't Like", type: 'text' },
      { key: 'favoriteWeekendActivity', label: 'Favorite Weekend Activity', type: 'text' },
      { key: 'favoriteGame', label: 'Favorite Game', type: 'text' },
      { key: 'favoriteMovie', label: 'Favorite Movie', type: 'text' },
      { key: 'favoriteHero', label: 'Favorite Hero', type: 'text' },
      { key: 'funFact', label: 'Fun Fact', type: 'textarea' },
      { key: 'avatar', label: 'Upload Avatar', type: 'file' }
    ];

    fields.forEach(({ key, label, type, disabled }) => {
      const fieldDiv = document.createElement('div');
      fieldDiv.className = 'profile-field';

      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      labelEl.htmlFor = `${name}-${key.replace(/\./g,'-')}`;
      fieldDiv.appendChild(labelEl);

      let inputEl;
      if (type === 'textarea') {
        inputEl = document.createElement('textarea');
        inputEl.rows = 3;
      } else if (type === 'file') {
        inputEl = document.createElement('input');
        inputEl.type = 'file';
        inputEl.accept = 'image/*';
      } else {
        inputEl = document.createElement('input');
        inputEl.type = type || 'text';
        if (disabled) inputEl.disabled = true;
      }

      inputEl.id = `${name}-${key.replace(/\./g,'-')}`;
      inputEl.dataset.fieldKey = key;
      inputEl.style.fontFamily = "'Poppins', sans-serif";

      if (type !== 'file') {
        if (key === 'age') {
          inputEl.value = calculateAge(profile.birthdate);
        } else {
          const keys = key.split('.');
          let val = profile;
          keys.forEach(k => val = val ? val[k] : '');
          inputEl.value = val || '';
        }
      }

      fieldDiv.appendChild(inputEl);

      profileContainer.appendChild(fieldDiv);

      if (type === 'file') {
        inputEl.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;
          if (!file.type.startsWith('image/')) {
            showAlert("Please upload a valid image file.");
            inputEl.value = '';
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            profile.avatar = reader.result;
            profileAvatar.src = profile.avatar;
            saveProfiles();
          };
          reader.readAsDataURL(file);
        });
      }
    });

    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn btn-primary';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
      fields.forEach(({ key, type }) => {
        if (type === 'file' || key === 'age') return;
        const input = profileContainer.querySelector(`[data-field-key="${key}"]`);
        if (!input) return;

        if (key.includes('.')) {
          const [parentKey, childKey] = key.split('.');
          if (!profile[parentKey]) profile[parentKey] = {};
          profile[parentKey][childKey] = input.value.trim();
        } else {
          if (key === 'birthdate') {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(input.value.trim())) {
              showAlert("Invalid birthdate format. Use YYYY-MM-DD.");
              return;
            }
            profile.birthdate = input.value.trim();
          } else {
            profile[key] = input.value.trim();
          }
        }
      });
      saveProfiles();
      renderSingleProfile(name);
      showAlert(`${name}'s profile saved.`);
    });
    profileContainer.appendChild(saveBtn);

    profileDetailSection.hidden = false;
  }

  function saveProfiles() {
    saveToStorage(profilesDataKey, profilesData);
  }

  function defaultAvatarForName(name) {
    const colors = ['#6b42f5', '#2196f3', '#f44336', '#4caf50', '#ff9800', '#9c27b0'];
    const char = name.charAt(0).toUpperCase();
    const color = colors[name.length % colors.length];
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
        <rect width="32" height="32" fill="${color}" />
        <text x="16" y="22" font-size="20" fill="white" font-family="Poppins, sans-serif" text-anchor="middle">${char}</text>
      </svg>
    `.trim();
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  addFamilyMemberBtn.addEventListener('click', () => {
    const name = prompt("Enter new family member's name:");
    if (!name) return;
    if (profilesData[name]) {
      showAlert("This name already exists.");
      return;
    }
    profilesData[name] = {
      birthdate: '',
      favoriteColor: '',
      favoriteFood: '',
      dislikedFood: '',
      favoriteWeekendActivity: '',
      favoriteGame: '',
      favoriteMovie: '',
      favoriteHero: '',
      profession: { title: '', description: '' },
      funFact: '',
      avatar: ''
    };
    saveProfiles();
    const newTab = document.createElement('li');
    newTab.setAttribute('role', 'menuitem');
    newTab.setAttribute('tabindex', '-1');
    newTab.textContent = name;
    tabs[0].parentNode.appendChild(newTab);
    tabs.push(newTab);
    newTab.addEventListener('click', () => setActiveTab(tabs.indexOf(newTab)));
    newTab.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(newTab);
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
    showAlert(`Added new family member: ${name}`);
  });

  removeFamilyMemberBtn.addEventListener('click', () => {
    const name = prompt("Enter family member's name to remove:");
    if (!name || !profilesData[name]) {
      showAlert("Name not found.");
      return;
    }
    if (!confirm(`Are you sure you want to remove ${name}? This will delete all their data.`)) {
      return;
    }
    delete profilesData[name];
    saveProfiles();
    const idx = tabs.findIndex(t => t.textContent.trim() === name);
    if (idx !== -1) {
      tabs[idx].parentNode.removeChild(tabs[idx]);
      tabs.splice(idx, 1);
    }
    setActiveTab(0);
    showAlert(`${name} removed.`);
  });

  // ========== Greeting and Date ==========

  function updateGreeting() {
    const user = localStorage.getItem(currentUserKey);
    currentUserDisplay.textContent = user || 'Guest';
  }

  function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' };
    currentDateDisplay.textContent = now.toLocaleDateString(undefined, options);
  }
  updateCurrentDate();

  // ========== Search Filters ==========

  function updateSearchFilters() {
    const searchVal = sidebarSearch.value.trim().toLowerCase();
    tabs.forEach(tab => {
      const text = tab.textContent.toLowerCase();
      tab.style.display = text.includes(searchVal) ? 'flex' : 'none';
    });

    const contentSearchVal = contentSearch.value.trim().toLowerCase();
    if (tabs[activeTabIndex].textContent === 'Wall') {
      renderWallPosts(contentSearchVal);
    } else if (tabs[activeTabIndex].textContent === 'Q&A') {
      renderQA(contentSearchVal);
    }
  }

  sidebarSearch.addEventListener('input', updateSearchFilters);
  contentSearch.addEventListener('input', updateSearchFilters);

  // ========== Notifications ==========

  let notificationCount = 0;

  function incrementNotification() {
    notificationCount++;
    updateNotificationBadge();
  }

  function clearNotifications() {
    notificationCount = 0;
    updateNotificationBadge();
  }

  function updateNotificationBadge() {
    if (notificationCount > 0) {
      notificationBadge.style.display = 'inline-block';
      notificationBadge.textContent = notificationCount;
      notificationBtn.setAttribute('aria-label', `Notifications: ${notificationCount} new`);
    } else {
      notificationBadge.style.display = 'none';
      notificationBtn.setAttribute('aria-label', 'No new notifications');
    }
  }

  notificationBtn.addEventListener('click', () => {
    clearNotifications();
  });

  // ========== Initialize ==========

  checkUserSelection();
  renderWallPosts();
  renderQA();
  renderCalendarTable();
  renderCalendarEventsList();
  updateGreeting();

  // Register the service worker so the app can work offline
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(err => {
        console.error('Service worker registration failed:', err);
      });
    });
  }

  /*
   * ===================== Extended Features =====================
   * The following section implements chores, points, badges, admin
   * controls, and profile similarities. These features live near
   * the end of the IIFE so they can access previously defined
   * variables such as localStorage keys, DOM references and utility
   * functions. See README for details.
   */

  // ----- Admin visibility management -----
  const choresListEl = document.getElementById('choresList');
  const choreAdminPanel = document.getElementById('choreAdminPanel');
  const choreDescInput = document.getElementById('choreDesc');
  const choreAssignedToSelect = document.getElementById('choreAssignedTo');
  const choreDueInput = document.getElementById('choreDue');
  const addChoreBtn = document.getElementById('addChoreBtn');

  // Show/hide admin-only panels like chores admin and Q&A answer
  function updateAdminVisibility() {
    const currentUser = localStorage.getItem(currentUserKey);
    const isAdmin = adminUsers.includes(currentUser);
    // Show Q&A admin answer section only if unanswered questions exist
    if (isAdmin && qaList.some(q => !q.a)) {
      adminAnswerSection.hidden = false;
    } else {
      adminAnswerSection.hidden = true;
    }
    // Chores admin panel
    choreAdminPanel.hidden = !isAdmin;
  }

  // Render chores list
  function renderChores() {
    choresListEl.innerHTML = '';
    if (!chores || chores.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No chores right now!';
      choresListEl.appendChild(li);
      return;
    }
    const currentUser = localStorage.getItem(currentUserKey);
    chores.forEach((chore, index) => {
      const li = document.createElement('li');
      li.className = 'chore-item';
      li.dataset.id = chore.id;
      const dueTxt = chore.due ? ` (Due: ${chore.due})` : '';
      li.innerHTML = `<span class="chore-desc">${escapeHtml(chore.desc)}</span><small>${dueTxt}</small>`;
      const isAssignedToYou = chore.assignedTo === 'All' || chore.assignedTo === currentUser;
      if (isAssignedToYou) {
        const btn = document.createElement('button');
        btn.textContent = 'Mark Done';
        btn.className = 'complete-chore-btn';
        btn.addEventListener('click', () => {
          const pts = 5;
          userPoints[currentUser] = (userPoints[currentUser] || 0) + pts;
          chores.splice(index, 1);
          saveToStorage(userPointsKey, userPoints);
          saveToStorage(choresKey, chores);
          renderChores();
          showAlert(`Great job, ${currentUser}! You earned ${pts} points.`);
        });
        li.appendChild(btn);
      } else {
        const info = document.createElement('span');
        info.className = 'chore-assigned';
        info.textContent = `Assigned to: ${chore.assignedTo}`;
        li.appendChild(info);
      }
      choresListEl.appendChild(li);
    });
  }

  // Add chore handler
  addChoreBtn.addEventListener('click', () => {
    const currentUser = localStorage.getItem(currentUserKey);
    if (!adminUsers.includes(currentUser)) {
      showAlert('Only admins can add chores.');
      return;
    }
    const desc = choreDescInput.value.trim();
    const assignedTo = choreAssignedToSelect.value;
    const due = choreDueInput.value;
    if (!desc) {
      showAlert('Please enter a description.');
      return;
    }
    chores.push({ id: generateId(), desc, assignedTo, due });
    saveToStorage(choresKey, chores);
    choreDescInput.value = '';
    choreDueInput.value = '';
    choreAssignedToSelect.value = 'All';
    renderChores();
    showAlert('Chore added!');
  });

  // ----- Badges and profile enhancements -----

  function renderBadgesForProfile(name) {
    const badgeContainer = document.createElement('div');
    badgeContainer.className = 'badge-container';
    const title = document.createElement('h3');
    title.textContent = 'Badges';
    badgeContainer.appendChild(title);
    const list = document.createElement('ul');
    list.className = 'badge-list';
    const userBadges = badges[name] || [];
    if (userBadges.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No badges yet.';
      list.appendChild(li);
    } else {
      userBadges.forEach(id => {
        const type = badgeTypes.find(b => b.id === id) || { name: id, icon: '🏆' };
        const li = document.createElement('li');
        li.className = 'badge-item';
        li.innerHTML = `${type.icon} <strong>${escapeHtml(type.name)}</strong>`;
        list.appendChild(li);
      });
    }
    badgeContainer.appendChild(list);
    const currentUser = localStorage.getItem(currentUserKey);
    if (adminUsers.includes(currentUser)) {
      const awardDiv = document.createElement('div');
      awardDiv.className = 'badge-award';
      const select = document.createElement('select');
      badgeTypes.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = `${b.icon} ${b.name}`;
        select.appendChild(opt);
      });
      const btn = document.createElement('button');
      btn.textContent = 'Award Badge';
      btn.addEventListener('click', () => {
        const currentUser = localStorage.getItem(currentUserKey);
        // Extra guard: only allow admin users to award badges
        if (!adminUsers.includes(currentUser)) {
          showAlert('Only admins can award badges.');
          return;
        }
        const badgeId = select.value;
        if (!badgeId) return;
        const uBadges = badges[name] || [];
        if (uBadges.includes(badgeId)) {
          showAlert(`${name} already has this badge.`);
          return;
        }
        uBadges.push(badgeId);
        badges[name] = uBadges;
        saveToStorage(badgesKey, badges);
        // Re-render profile to show new badge
        renderSingleProfile(name);
        showAlert(`Badge awarded to ${name}!`);
      });
      awardDiv.appendChild(select);
      awardDiv.appendChild(btn);
      badgeContainer.appendChild(awardDiv);
    }
    profileContainer.appendChild(badgeContainer);
  }

  function findSimilarAnswers(name) {
    const results = [];
    const fields = ['favoriteColor','favoriteFood','dislikedFood','favoriteWeekendActivity','favoriteGame','favoriteMovie','favoriteHero'];
    const profile = profilesData[name];
    if (!profile) return results;
    Object.keys(profilesData).forEach(other => {
      if (other === name) return;
      const otherProfile = profilesData[other];
      fields.forEach(f => {
        const val = profile[f];
        const valOther = otherProfile[f];
        if (val && valOther && val.trim().toLowerCase() === valOther.trim().toLowerCase()) {
          results.push({ field: f, otherName: other, value: val });
        }
      });
    });
    return results;
  }

  function renderSimilarities(name) {
    const sims = findSimilarAnswers(name);
    if (sims.length === 0) return;
    const simDiv = document.createElement('div');
    simDiv.className = 'similarity-info';
    const title = document.createElement('h3');
    title.textContent = 'Shared Preferences';
    simDiv.appendChild(title);
    const ul = document.createElement('ul');
    sims.forEach(item => {
      const li = document.createElement('li');
      // Format field nicely
      const label = item.field.replace(/favorite/,'').replace(/([A-Z])/g, ' $1').trim();
      li.textContent = `${item.otherName} also likes ${item.value} (${label})`;
      ul.appendChild(li);
    });
    simDiv.appendChild(ul);
    profileContainer.appendChild(simDiv);
  }

  // Override renderSingleProfile to append badges, points and similarities
  const baseRenderSingleProfile = renderSingleProfile;
  renderSingleProfile = function(name) {
    baseRenderSingleProfile.call(this, name);
    // If the profile belongs to an aspiring engineer (Yazid or Yahya), show a simple
    // animated illustration to inspire them. The animation is a small car that
    // gently moves left and right. You could expand this with more SVG artwork.
    if (name === 'Yazid' || name === 'Yahya') {
      const animDiv = document.createElement('div');
      animDiv.className = 'engineer-animation-container';
      let svgHTML;
      if (name === 'Yazid') {
        // Car animation for Yazid
        svgHTML = `
          <svg viewBox="0 0 100 60" class="engineer-car" xmlns="http://www.w3.org/2000/svg">
            <!-- Car body -->
            <rect x="10" y="30" width="60" height="20" rx="4" ry="4" fill="#6b42f5" />
            <!-- Car roof -->
            <rect x="25" y="20" width="30" height="15" rx="3" ry="3" fill="#9575cd" />
            <!-- Wheels -->
            <circle cx="25" cy="55" r="5" fill="#333" />
            <circle cx="55" cy="55" r="5" fill="#333" />
          </svg>`;
      } else {
        // Plane animation for Yahya
        svgHTML = `
          <svg viewBox="0 0 100 60" class="engineer-plane" xmlns="http://www.w3.org/2000/svg">
            <!-- Simple plane shape: fuselage and wings -->
            <polygon points="10,30 60,25 60,35" fill="#6b42f5" />
            <rect x="40" y="27" width="20" height="6" fill="#9575cd" />
            <!-- Tail -->
            <polygon points="60,25 80,20 80,40 60,35" fill="#6b42f5" />
            <!-- Window -->
            <circle cx="55" cy="30" r="3" fill="#ffffff" />
          </svg>`;
      }
      animDiv.innerHTML = svgHTML;
      // Insert animation at the top of the profile container for visibility
      if (profileContainer.firstChild) {
        profileContainer.insertBefore(animDiv, profileContainer.firstChild);
      } else {
        profileContainer.appendChild(animDiv);
      }
    }
    // Append points display
    const pointsDiv = document.createElement('div');
    pointsDiv.className = 'points-display';
    pointsDiv.innerHTML = `<strong>Points:</strong> ${userPoints[name] || 0}`;
    profileContainer.appendChild(pointsDiv);
    // Append badges
    renderBadgesForProfile(name);
    // Append similarities
    renderSimilarities(name);
  };

  // Override setCurrentUser to update admin UI, chores and re-render the current
  // profile when switching.  Without re-rendering, admin-only controls like
  // badge awarding would not appear until the tab is clicked again.
  const baseSetCurrentUser = setCurrentUser;
  setCurrentUser = function(user) {
    baseSetCurrentUser.call(this, user);
    updateAdminVisibility();
    renderChores();
    // If the active tab corresponds to a family member, re-render their profile
    const activeName = tabs[activeTabIndex] && tabs[activeTabIndex].textContent.trim();
    if (['Ghassan','Mariem','Yazid','Yahya'].includes(activeName)) {
      renderSingleProfile(activeName);
    }
  };

  // Initial admin/chores rendering once user selected
  updateAdminVisibility();
  renderChores();

  // ===== Responsive sidebar toggling =====
  // Toggle the sidebar when hamburger button is clicked. This is used on small screens.
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebarEl = document.querySelector('nav.sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (hamburgerBtn && sidebarEl) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = sidebarEl.classList.toggle('open');
      if (sidebarOverlay) {
        sidebarOverlay.classList.toggle('visible', isOpen);
      }
    });
  }
  // Close sidebar when the overlay is clicked
  if (sidebarOverlay && sidebarEl) {
    sidebarOverlay.addEventListener('click', () => {
      sidebarEl.classList.remove('open');
      sidebarOverlay.classList.remove('visible');
    });
  }
  // Close sidebar when a menu item is selected on small screens
  tabs.forEach(li => {
    li.addEventListener('click', () => {
      if (window.innerWidth <= 700 && sidebarEl) {
        sidebarEl.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('visible');
      }
    });
  });

})();
