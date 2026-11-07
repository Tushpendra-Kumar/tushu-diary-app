import AsyncStorage from '@react-native-async-storage/async-storage';

const EVENTS_KEY = 'tushu_calendar_events_';

export const EVENT_CATEGORIES = [
  'Personal', 'Work', 'Health', 'Finance', 'Family', 'Travel', 'Education', 'Other'
];
export const REPEAT_OPTIONS = ['One Time', 'Daily', 'Weekly', 'Monthly', 'Yearly'];
export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

// ──────── Validation ────────
export const validateDate = (dateStr) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

export const validateTime = (timeStr) => {
  if (!timeStr) return true; // time is optional
  if (!/^\d{2}:\d{2}$/.test(timeStr)) return false;
  const [h, min] = timeStr.split(':').map(Number);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59;
};

// ──────── Storage ────────
export const getEvents = async (userId) => {
  try {
    const data = await AsyncStorage.getItem(EVENTS_KEY + userId);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return [];
};

const saveEvents = async (userId, events) => {
  await AsyncStorage.setItem(EVENTS_KEY + userId, JSON.stringify(events));
};

// ──────── Recurrence expansion ────────
export const expandRecurring = (event, monthYear) => {
  // Returns all dates in given {year, month} (1-indexed) for this event
  const { date, repeat } = event;
  const [ey, em, ed] = date.split('-').map(Number);
  const { year, month } = monthYear;
  const dates = [];

  if (repeat === 'One Time' || !repeat) {
    if (ey === year && em === month) dates.push(date);
    return dates;
  }

  const daysInMonth = new Date(year, month, 0).getDate();

  if (repeat === 'Daily') {
    const start = new Date(ey, em - 1, ed);
    for (let day = 1; day <= daysInMonth; day++) {
      const cur = new Date(year, month - 1, day);
      if (cur >= start) dates.push(toDateStr(year, month, day));
    }
  } else if (repeat === 'Weekly') {
    const startDow = new Date(ey, em - 1, ed).getDay();
    for (let day = 1; day <= daysInMonth; day++) {
      const cur = new Date(year, month - 1, day);
      if (cur >= new Date(ey, em - 1, ed) && cur.getDay() === startDow) {
        dates.push(toDateStr(year, month, day));
      }
    }
  } else if (repeat === 'Monthly') {
    if (new Date(year, month - 1, ed) >= new Date(ey, em - 1, ed) && ed <= daysInMonth) {
      dates.push(toDateStr(year, month, ed));
    }
  } else if (repeat === 'Yearly') {
    if (month === em && new Date(year, month - 1, ed) >= new Date(ey, em - 1, ed)) {
      dates.push(toDateStr(year, month, ed));
    }
  }
  return dates;
};

// ──────── CRUD ────────
export const addEvent = async (userId, data) => {
  const events = await getEvents(userId);
  const event = {
    id: 'evt_' + Date.now() + '_' + Math.floor(Math.random() * 9999),
    title: data.title.trim(),
    description: data.description || '',
    date: data.date,
    time: data.time || '',
    repeat: data.repeat || 'One Time',
    category: data.category || 'Personal',
    priority: data.priority || 'Medium',
    completed: false,
    completedAt: null,
    seriesId: data.repeat && data.repeat !== 'One Time'
      ? ('series_' + Date.now()) : null,
    createdAt: Date.now()
  };
  events.unshift(event);
  await saveEvents(userId, events);
  return event;
};

export const updateEvent = async (userId, id, updates, scope = 'this') => {
  // scope: 'this' | 'all'
  const events = await getEvents(userId);
  const idx = events.findIndex(e => e.id === id);
  if (idx === -1) throw new Error('Event not found');
  const target = events[idx];

  if (scope === 'all' && target.seriesId) {
    // update all in series
    events.forEach((e, i) => {
      if (e.seriesId === target.seriesId) {
        events[i] = { ...e, ...updates };
      }
    });
  } else {
    events[idx] = { ...target, ...updates };
  }
  await saveEvents(userId, events);
  return events[idx];
};

export const deleteEvent = async (userId, id, scope = 'this') => {
  const events = await getEvents(userId);
  const target = events.find(e => e.id === id);
  let filtered;
  if (scope === 'all' && target?.seriesId) {
    filtered = events.filter(e => e.seriesId !== target.seriesId);
  } else {
    filtered = events.filter(e => e.id !== id);
  }
  await saveEvents(userId, filtered);
};

export const completeEvent = async (userId, id) => {
  return updateEvent(userId, id, { completed: true, completedAt: Date.now() });
};

// ──────── Helpers ────────
export const toDateStr = (y, m, d) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const getEventStatus = (event) => {
  if (event.completed) return 'Completed';
  const now = new Date();
  const today = todayStr();
  const evDate = new Date(`${event.date}T${event.time || '23:59'}`);
  if (event.date === today) return 'Today';
  if (evDate < now) return 'Overdue';
  return 'Upcoming';
};

export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
};

export const formatDisplayTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, min] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
};

export const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
export const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
