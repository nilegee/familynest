// data.js

export const adminUsers = ['Ghassan', 'Mariem'];

// Fixed catalog of badges available in the app
export const badgeTypes = [
  { id: 'star-helper', name: 'Star Helper', icon: '🌟' },
  { id: 'early-bird', name: 'Early Bird', icon: '🐦' },
  { id: 'quiz-master', name: 'Quiz Master', icon: '🧠' },
  { id: 'chef-of-week', name: 'Chef of the Week', icon: '🍳' },
  { id: 'kind-heart', name: 'Kind Heart', icon: '💖' },
  { id: 'bookworm', name: 'Bookworm', icon: '📚' },
  { id: 'super-organizer', name: 'Super Organizer', icon: '📅' },
  { id: 'clean-champ', name: 'Clean Champ', icon: '🧹' },
  { id: 'team-player', name: 'Team Player', icon: '🤝' },
  { id: 'birthday-boss', name: 'Birthday Boss', icon: '🎂' }
];

export const profileFieldLabels = {
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

export const tableAliases = { 'Q&A Table': 'qa_table' };

function generateId() {
  return '_' + Math.random().toString(36).slice(2, 11);
}

export const defaultWallPosts = [
  {
    id: generateId(),
    member: "Ghassan",
    text: "Just finished organizing the garden!",
    date: "2025-07-30T09:00:00",
    reactions: { "👍": 1, "❤️": 2 },
    edited: false,
    userReactions: {},
    replies: []
  },
  {
    id: generateId(),
    member: "Yazid",
    text: "I won the game last night!",
    date: "2025-07-29T20:45:00",
    reactions: { "😂": 3 },
    edited: false,
    userReactions: {},
    replies: []
  },
  {
    id: generateId(),
    member: "Mariem",
    text: "What's your favorite family activity?",
    date: "2025-07-28T18:00:00",
    reactions: {},
    edited: false,
    userReactions: {},
    replies: [],
    poll: {
      multiple: false,
      options: [
        { id: generateId(), text: "Game night", votes: [] },
        { id: generateId(), text: "Movie time", votes: [] },
        { id: generateId(), text: "Outdoor adventure", votes: [] }
      ]
    }
  }
];

export const defaultQAList = [
  {
    id: generateId(),
    q: "What's for dinner?",
    a: "We’re having Koshari!",
    qBy: 'Yahya',
    qDate: new Date().toISOString(),
    aBy: 'Mariem',
    aDate: new Date().toISOString()
  },
  {
    id: generateId(),
    q: "When is the next family trip?",
    a: "Next month, inshallah.",
    qBy: 'Yazid',
    qDate: new Date().toISOString(),
    aBy: 'Ghassan',
    aDate: new Date().toISOString()
  }
];

export const defaultCalendarEvents = [
  { id: generateId(), start: "2025-08-11", end: "2025-08-14", desc: "Hotel visit - Centara Mirage Beach Resort" },
  { id: generateId(), start: "2025-08-31", end: "2025-08-31", desc: "Ghassan Birthday" },
  { id: generateId(), start: "2025-10-23", end: "2025-10-23", desc: "Yahya Birthday" },
  { id: generateId(), start: "2025-01-30", end: "2025-01-30", desc: "Mariem Birthday" },
  { id: generateId(), start: "2025-03-28", end: "2025-03-28", desc: "Yazid Birthday" }
];

export const defaultProfilesData = {
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
    avatar: "",
    notifications: { wall: true, qa: true, calendar: true, answer: true }
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
    avatar: "",
    notifications: { wall: true, qa: true, calendar: true, answer: true }
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
    avatar: "",
    dreamJob: "Engineer 🛠️",
    notifications: { wall: true, qa: true, calendar: true, answer: true }
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
    avatar: "",
    dreamJob: "Engineer 🛠️",
    notifications: { wall: true, qa: true, calendar: true, answer: true }
  }
};

export const defaultChores = [
  { id: generateId(), desc: "Pray 5 times", assignedTo: "All", due: "", daily: true, completed: false },
  { id: generateId(), desc: "Make your bed", assignedTo: "All", due: "", daily: true, completed: false },
  { id: generateId(), desc: "Read stories", assignedTo: "Yahya", due: "", daily: false, completed: false }
];

export const defaultUserPoints = { Ghassan: 0, Mariem: 0, Yazid: 0, Yahya: 0 };
export const defaultBadges = { Ghassan: [], Mariem: [], Yazid: [], Yahya: [] };
export const defaultCompletedChores = { Ghassan: 0, Mariem: 0, Yazid: 0, Yahya: 0 };
export const defaultPointLogs = [];
