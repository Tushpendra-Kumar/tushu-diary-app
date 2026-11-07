import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDERS_KEY = 'tushu_advanced_reminders_';

export const REPEAT_OPTIONS = ['One Time', 'Daily', 'Weekly', 'Monthly', 'Yearly'];
export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];
export const FILTER_OPTIONS = ['All', 'Today', 'Upcoming', 'Overdue', 'Completed'];

export const getReminders = async (userId) => {
  try {
    const data = await AsyncStorage.getItem(REMINDERS_KEY + userId);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return [];
};

export const saveReminders = async (userId, reminders) => {
  try {
    await AsyncStorage.setItem(REMINDERS_KEY + userId, JSON.stringify(reminders));
    return true;
  } catch (e) {
    return false;
  }
};

export const addReminder = async (userId, reminderData) => {
  const reminders = await getReminders(userId);
  const newReminder = {
    id: 'rem_' + Date.now() + '_' + Math.floor(Math.random() * 9999),
    title: reminderData.title.trim(),
    description: reminderData.description || '',
    date: reminderData.date,   // 'YYYY-MM-DD'
    time: reminderData.time,   // 'HH:MM' 24h
    repeat: reminderData.repeat || 'One Time',
    priority: reminderData.priority || 'Medium',
    completed: false,
    createdAt: Date.now()
  };
  reminders.unshift(newReminder);
  await saveReminders(userId, reminders);
  return newReminder;
};

export const updateReminder = async (userId, id, updates) => {
  const reminders = await getReminders(userId);
  const idx = reminders.findIndex(r => r.id === id);
  if (idx === -1) throw new Error('Reminder not found');
  reminders[idx] = { ...reminders[idx], ...updates };
  await saveReminders(userId, reminders);
  return reminders[idx];
};

export const deleteReminder = async (userId, id) => {
  const reminders = await getReminders(userId);
  await saveReminders(userId, reminders.filter(r => r.id !== id));
};

export const completeReminder = async (userId, id) => {
  return updateReminder(userId, id, { completed: true, completedAt: Date.now() });
};

export const getReminderStatus = (reminder) => {
  if (reminder.completed) return 'Completed';
  const now = new Date();
  const rDate = new Date(`${reminder.date}T${reminder.time || '00:00'}`);
  const todayStr = now.toISOString().slice(0, 10);
  if (reminder.date === todayStr) return 'Today';
  if (rDate < now) return 'Overdue';
  return 'Upcoming';
};

export const validateReminderDate = (dateStr) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

export const validateReminderTime = (timeStr) => {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return false;
  const [h, min] = timeStr.split(':').map(Number);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59;
};

export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
};

export const formatDisplayTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, min] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
};

export const todayDateStr = () => new Date().toISOString().slice(0, 10);
