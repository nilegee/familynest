// storage.js

import {
  tableAliases,
  defaultWallPosts,
  defaultQAList,
  defaultCalendarEvents,
  defaultProfilesData,
  defaultChores,
  defaultUserPoints,
  defaultBadges,
  defaultCompletedChores
} from './data.js';

import { generateId, showAlert } from './util.js';

export function resolveTable(name) {
  return tableAliases[name] || name;
}

// ========== Supabase Setup ==========
const supabaseUrl = window.SUPABASE_URL || '';
const supabaseKey = window.SUPABASE_KEY || '';

let supabaseEnabled = true;
let supabase;

if (!supabaseUrl || !supabaseKey) {
  alert('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_KEY in config.js');
  supabaseEnabled = false;
} else {
  supabase = window.supabase
    ? window.supabase.createClient(supabaseUrl, supabaseKey)
    : createClient(supabaseUrl, supabaseKey);
}

export function saveToLocal(table, data) {
  table = resolveTable(table);
  try {
    localStorage.setItem(`fn_${table}`, JSON.stringify(data));
  } catch (e) {
    console.warn('Local storage save failed:', e);
  }
}

export async function saveToSupabase(table, data, opts = {}) {
  table = resolveTable(table);
  const { replace = false, skipLocal = false } = opts;
  if (!supabaseEnabled) {
    if (!skipLocal) saveToLocal(table, data);
    return;
  }

  let payload;
  if (table === 'profiles') {
    payload = Object.entries(data).map(([name, value]) => ({
      name,
      birthdate: value.birthdate || null,
      favoriteColor: value.favoriteColor || null,
      favoriteFood: value.favoriteFood || null,
      dislikedFood: value.dislikedFood || null,
      favoriteWeekendActivity: value.favoriteWeekendActivity || null,
      favoriteGame: value.favoriteGame || null,
      favoriteMovie: value.favoriteMovie || null,
      favoriteHero: value.favoriteHero || null,
      professionTitle: (value.profession && value.profession.title) || null,
      professionDescription: (value.profession && value.profession.description) || null,
      funFact: value.funFact || null,
      avatar: value.avatar || null,
      dreamJob: value.dreamJob || null,
    }));
  } else {
    if (Array.isArray(data)) {
      payload = data;
    } else if (data && typeof data === 'object' && 'id' in data) {
      payload = [data];
    } else {
      payload = Object.entries(data).map(([name, value]) => ({ name, value }));
    }
  }

  if (replace && Array.isArray(data)) {
    try {
      const ids = data.map(d => `'${d.id}'`).join(',');
      await supabase.from(table).delete().not('id', 'in', `(${ids || 'null'})`);
    } catch (e) {
      console.warn('Replace mode cleanup failed:', e);
    }
  }

  const { error } = await supabase.from(table).upsert(payload);
  if (error) {
    if (error.code === 'PGRST205') {
      console.info(`Supabase table '${table}' not found - using localStorage.`);
      supabaseEnabled = false;
      if (!skipLocal) saveToLocal(table, data);
      return;
    }
    console.error('Supabase save error:', error);
    showAlert('Could not save data. Changes stored locally.');
    if (!skipLocal) saveToLocal(table, data);
  }
}

export async function deleteFromSupabase(table, id) {
  table = resolveTable(table);
  if (!supabaseEnabled) {
    const current = loadFromLocal(table, []);
    if (Array.isArray(current)) {
      const filtered = current.filter(item => item.id !== id);
      saveToLocal(table, filtered);
    }
    return;
  }
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    console.error('Supabase delete error:', error);
    showAlert('Could not delete data. Entry will be removed locally.');
    const current = loadFromLocal(table, []);
    if (Array.isArray(current)) {
      const filtered = current.filter(item => item.id !== id);
      saveToLocal(table, filtered);
    }
  }
}

export function loadFromLocal(table, defaultValue) {
  table = resolveTable(table);
  try {
    const stored = localStorage.getItem(`fn_${table}`);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn('Local storage load failed:', e);
  }
  return defaultValue;
}

export async function loadFromSupabase(table, defaultValue) {
  table = resolveTable(table);
  if (!supabaseEnabled) {
    return loadFromLocal(table, defaultValue);
  }
  const { data, error } = await supabase.from(table).select('*');
  if (error) {
    if (error.code === 'PGRST205') {
      console.info(`Supabase table '${table}' not found - switching to localStorage.`);
      supabaseEnabled = false;
      return loadFromLocal(table, defaultValue);
    }
    console.warn('Supabase load failed:', error);
    supabaseEnabled = false;
    return loadFromLocal(table, defaultValue);
  }
  if (table === 'profiles') {
    const obj = {};
    data.forEach(row => {
      obj[row.name] = {
        birthdate: row.birthdate,
        favoriteColor: row.favoriteColor,
        favoriteFood: row.favoriteFood,
        dislikedFood: row.dislikedFood,
        favoriteWeekendActivity: row.favoriteWeekendActivity,
        favoriteGame: row.favoriteGame,
        favoriteMovie: row.favoriteMovie,
        favoriteHero: row.favoriteHero,
        profession: {
          title: row.professionTitle,
          description: row.professionDescription
        },
        funFact: row.funFact,
        avatar: row.avatar,
        dreamJob: row.dreamJob
      };
    });
    return Object.keys(obj).length ? obj : defaultValue;
  }
  if (Array.isArray(defaultValue)) return data || defaultValue;
  const obj = {};
  data.forEach(row => {
    if (row.name !== undefined && 'value' in row) obj[row.name] = row.value;
  });
  return Object.keys(obj).length ? obj : defaultValue;
}

// Injects default "hardcoded" Q&A if they're not in the loaded list
export function injectDefaultQA(qaList, saveQA) {
  const defaults = [
    { q: 'I have a friend in class wearing a cross or praying to an elephant or praying to Jesus', a: 'People follow different religions. In Islam we believe in one God and we pray only to Him, but we respect others’ choices. The Qur’an teaches that Jesus said we should worship God alone.' },
    { q: 'Is Jesus God?', a: 'Muslims see Jesus (peace be upon him) as one of God’s greatest messengers. He called people to worship God alone and never claimed to be divine.' },
    { q: 'Why do people die?', a: 'Life in this world is temporary; death is the door to the next life. The Qur’an says every soul will taste death and that this life is but a test. Death lets us return to Allah and be rewarded for our good deeds.' },
    { q: 'Will Papa die? If Papa dies how will I see him?', a: 'Everyone, even prophets, passes away. Islam teaches that the soul continues; if we live righteously, we hope to reunite in Paradise. Good deeds and prayers for loved ones keep us connected.' },
    { q: 'Are we going to meet in Jannah?', a: 'That’s the goal! Paradise is for those who believe and do good. Families who love and help each other for Allah’s sake can be reunited there, so keep praying and doing good.' }
  ];
  let changed = false;
  defaults.forEach(item => {
    if (!qaList.some(q => q.q === item.q)) {
      qaList.push({ id: generateId(), q: item.q, a: item.a });
      changed = true;
    }
  });
  if (changed) saveQA('qa_table', qaList);
}

export async function loadAllData() {
  let wallPosts = await loadFromSupabase('wall_posts', defaultWallPosts);
  wallPosts.forEach(p => { if (!p.userReactions) p.userReactions = {}; });
  let qaList = await loadFromSupabase('qa_table', defaultQAList);
  injectDefaultQA(qaList, saveToSupabase);
  let calendarEvents = await loadFromSupabase('calendar_events', defaultCalendarEvents);
  let profilesData = await loadFromSupabase('profiles', defaultProfilesData);
  let chores = await loadFromSupabase('chores', defaultChores);
  chores.forEach(c => { if (typeof c.completed !== "boolean") c.completed = false; });
  let userPoints = await loadFromSupabase('user_points', defaultUserPoints);
  let badges = await loadFromSupabase('badges', defaultBadges);
  let completedChores = await loadFromSupabase('completed_chores', defaultCompletedChores);
  return { wallPosts, qaList, calendarEvents, profilesData, chores, userPoints, badges, completedChores };
}
