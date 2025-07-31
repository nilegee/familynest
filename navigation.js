// navigation.js

const sidebarTabs = Array.from(document.querySelectorAll('nav.sidebar li'));
const bottomTabs = Array.from(document.querySelectorAll('nav.bottom-nav button'));
const sections = Array.from(document.querySelectorAll('main.content > section'));
let activeTabIndex = 0;

export function setActiveTab(index) {
  activeTabIndex = index;
  sidebarTabs.forEach((tab, i) => {
    const isActive = i === index;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('tabindex', isActive ? '0' : '-1');
  });
  bottomTabs.forEach((tab, i) => {
    tab.classList.toggle('active', i === index);
  });
  sections.forEach(sec => sec.hidden = true);
  const tabName = sidebarTabs[index].textContent.trim();
  switch (tabName) {
    case 'Wall':
      document.getElementById('wall').hidden = false;
      break;
    case 'Q&A':
      document.getElementById('qa').hidden = false;
      break;
    case 'Calendar':
      document.getElementById('calendar').hidden = false;
      break;
    case 'Chores':
      document.getElementById('chores').hidden = false;
      break;
    case 'Scoreboard':
      document.getElementById('scoreboard').hidden = false;
      break;
    case 'Ghassan':
    case 'Mariem':
    case 'Yazid':
    case 'Yahya':
      document.getElementById('profileDetail').hidden = false;
      // renderSingleProfile(tabName); // leave this call in main.js
      break;
  }
  // updateSearchFilters(); // wire up in main if needed
  if (['Ghassan', 'Mariem', 'Yazid', 'Yahya'].includes(tabName)) {
    document.getElementById('profileDetail').hidden = false;
    // renderSingleProfile(tabName);
  } else {
    document.getElementById('profileDetail').hidden = true;
  }
}

export function setupTabListeners() {
  [sidebarTabs, bottomTabs].forEach(list => {
    list.forEach((tab, i) => {
      tab.addEventListener('click', () => setActiveTab(i));
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          const next = (i + 1) % sidebarTabs.length;
          list[next].focus();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const prev = (i - 1 + sidebarTabs.length) % sidebarTabs.length;
          list[prev].focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActiveTab(i);
        }
      });
    });
  });
}
