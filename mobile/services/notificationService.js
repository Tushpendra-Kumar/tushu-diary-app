import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestNotificationPermission = async () => {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F0A500',
      });
    }
    return true;
  } catch (e) {
    console.warn('Notification permission error', e);
    return false;
  }
};

const cancelPrefix = async (prefix) => {
  if (Platform.OS === 'web') return;
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of all) {
      if (notif.identifier && notif.identifier.startsWith(prefix)) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (e) {
    console.warn('Error cancelling prefix notifications', prefix, e);
  }
};

const scheduleNotif = async (id, title, body, dateObj) => {
  if (Platform.OS === 'web' || !dateObj || isNaN(dateObj.getTime())) return;
  if (dateObj.getTime() <= Date.now()) return; // Past
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: { title, body, sound: true, priority: Notifications.AndroidNotificationPriority.HIGH },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dateObj },
    });
  } catch (e) { console.warn('Failed scheduling', id, e); }
};

export const cancelTaskReminders = (taskId) => cancelPrefix(`task_${taskId}_`);
export const cancelBirthdayReminders = (birthdayId) => cancelPrefix(`birthday_${birthdayId}_`);
export const cancelExpenseReminders = (expenseId) => cancelPrefix(`expense_${expenseId}_`);

export const scheduleTaskReminders = async (task) => {
  await cancelTaskReminders(task.id);
  if (task.status === 'done') return;
  
  // Try to parse dueDate or date
  const dateStr = task.dueDate || task.date;
  if (!dateStr) return;
  
  const due = new Date(dateStr);
  if (isNaN(due.getTime())) return;

  const title = "Task Reminder";
  const _7d = new Date(due.getTime() - 7 * 24 * 60 * 60 * 1000);
  const _24h = new Date(due.getTime() - 24 * 60 * 60 * 1000);
  const _1h = new Date(due.getTime() - 60 * 60 * 1000);

  await scheduleNotif(`task_${task.id}_7d`, title, `"${task.title}" is due in 7 days.`, _7d);
  await scheduleNotif(`task_${task.id}_24h`, title, `"${task.title}" is due in 24 hours.`, _24h);
  await scheduleNotif(`task_${task.id}_1h`, title, `"${task.title}" is due in 1 hour.`, _1h);
};

export const scheduleBirthdayReminders = async (birthday) => {
  await cancelBirthdayReminders(birthday.id);
  
  if (!birthday.date) return;
  const [day, month] = birthday.date.split('-');
  if (!day || !month) return;
  
  const today = new Date();
  let bdate = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day), 9, 0, 0); // default 9 AM
  if (bdate.getTime() < today.getTime()) {
    bdate.setFullYear(today.getFullYear() + 1);
  }

  const title = `Birthday Reminder 🎂`;
  const name = birthday.name;
  
  const _7d = new Date(bdate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const _24h = new Date(bdate.getTime() - 24 * 60 * 60 * 1000);
  const _1h = new Date(bdate.getTime() - 60 * 60 * 1000); // 8 AM on the day

  await scheduleNotif(`birthday_${birthday.id}_7d`, title, `${name}'s birthday is coming up in a week!`, _7d);
  await scheduleNotif(`birthday_${birthday.id}_24h`, title, `${name}'s birthday is tomorrow!`, _24h);
  await scheduleNotif(`birthday_${birthday.id}_1h`, title, `It's ${name}'s birthday today!`, _1h);
};

export const scheduleExpenseReminders = async (expense) => {
  await cancelExpenseReminders(expense.id);
  if (expense.isPaid || expense.status === 'paid' || expense.status === 'settled') return;
  
  const dateStr = expense.dueDate || expense.date;
  if (!dateStr) return;
  
  let due = new Date(dateStr);
  if (isNaN(due.getTime())) return;
  
  // If it's just a date without time, assume 10 AM
  if (dateStr.length <= 10) due.setHours(10, 0, 0, 0);

  const title = "Payment Reminder";
  const name = expense.name || expense.title || expense.category || "Expense";
  
  const _7d = new Date(due.getTime() - 7 * 24 * 60 * 60 * 1000);
  const _24h = new Date(due.getTime() - 24 * 60 * 60 * 1000);
  const _1h = new Date(due.getTime() - 60 * 60 * 1000);

  await scheduleNotif(`expense_${expense.id}_7d`, title, `${name} payment is due in 7 days.`, _7d);
  await scheduleNotif(`expense_${expense.id}_24h`, title, `${name} payment is due in 24 hours.`, _24h);
  await scheduleNotif(`expense_${expense.id}_1h`, title, `${name} payment is due in 1 hour.`, _1h);
};


export const cancelKhataReminders = (contactId) => {
  if (!contactId) return;
  return cancelPrefix(`khata_${contactId}_`);
};

export const scheduleKhataReminders = async (contact) => {
  try {
    if (!contact || !contact.id) return;
    await cancelKhataReminders(contact.id);
    if (!Array.isArray(contact.entries) || contact.entries.length === 0) return;
    
    // Calculate balance
    let balance = 0;
    for (const e of contact.entries) {
      if (!e) continue;
      const amt = Number(e.amount) || 0;
      balance += e.type === 'gave' ? -amt : amt;
    }
    
    // If they owe us (balance < 0), schedule a reminder 30 days after the last transaction
    if (balance >= 0) return; 
    
    // Get latest transaction date
    const latestDateStr = contact.entries[0]?.date;
    if (!latestDateStr) return;
    
    let latestDate = new Date(latestDateStr);
    if (isNaN(latestDate.getTime())) return;
    
    // Set due date to 30 days after latest transaction
    const due = new Date(latestDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    due.setHours(10, 0, 0, 0);

    const title = "Khata Reminder";
    const name = contact.name || 'Contact';
    
    const _7d = new Date(due.getTime() - 7 * 24 * 60 * 60 * 1000);
    const _24h = new Date(due.getTime() - 24 * 60 * 60 * 1000);

    await scheduleNotif(`khata_${contact.id}_7d`, title, `Collect dues from ${name} in 7 days.`, _7d);
    await scheduleNotif(`khata_${contact.id}_24h`, title, `Collect dues from ${name} tomorrow.`, _24h);
  } catch (err) {
    console.warn('[notificationService] scheduleKhataReminders error:', err);
  }
};



export const triggerNewMemberNotification = async (userId, newMemberName) => {
  if (Platform.OS === 'web') return;
  const saved = await AsyncStorage.getItem(`tushu_${userId}_fam_notif_prefs`);
  const prefs = saved ? JSON.parse(saved) : { newMember: true, announcements: true, eventUpdates: false };
  if (!prefs.newMember) return;
  
  await Notifications.scheduleNotificationAsync({
    identifier: `new_member_${Date.now()}`,
    content: { title: "New Family Member!", body: `${newMemberName} has joined your family group.`, sound: true, priority: Notifications.AndroidNotificationPriority.HIGH },
    trigger: null, // trigger immediately
  });
};

export const triggerAnnouncementNotification = async (userId, title, body) => {
  if (Platform.OS === 'web') return;
  const saved = await AsyncStorage.getItem(`tushu_${userId}_fam_notif_prefs`);
  const prefs = saved ? JSON.parse(saved) : { newMember: true, announcements: true, eventUpdates: false };
  if (!prefs.announcements) return;
  
  await Notifications.scheduleNotificationAsync({
    identifier: `announcement_${Date.now()}`,
    content: { title: `Family Announcement: ${title}`, body, sound: true, priority: Notifications.AndroidNotificationPriority.HIGH },
    trigger: null,
  });
};

export const triggerEventUpdateNotification = async (userId, eventName, updateDetails) => {
  if (Platform.OS === 'web') return;
  const saved = await AsyncStorage.getItem(`tushu_${userId}_fam_notif_prefs`);
  const prefs = saved ? JSON.parse(saved) : { newMember: true, announcements: true, eventUpdates: false };
  if (!prefs.eventUpdates) return;
  
  await Notifications.scheduleNotificationAsync({
    identifier: `event_update_${Date.now()}`,
    content: { title: "Event Updated", body: `"${eventName}" has been updated: ${updateDetails}`, sound: true, priority: Notifications.AndroidNotificationPriority.HIGH },
    trigger: null,
  });
};

export const cancelFamilyEventReminders = (eventId) => cancelPrefix(`famevent_${eventId}_`);

export const scheduleFamilyEventReminders = async (event, settings) => {
  await cancelFamilyEventReminders(event.id);
  
  // If event has participants array and we have userId, we'd check it here.
  // Assuming all family members are participants for now.

  const dateStr = event.date;
  if (!dateStr) return;
  
  let eventDate = new Date(dateStr);
  if (isNaN(eventDate.getTime())) return;

  // Add time if available, otherwise assume 9:00 AM (default morning)
  if (event.time) {
    const timeParts = event.time.split(':');
    if (timeParts.length >= 2) {
      let hours = parseInt(timeParts[0]);
      let mins = parseInt(timeParts[1]);
      if (event.time.toLowerCase().includes('pm') && hours < 12) hours += 12;
      if (event.time.toLowerCase().includes('am') && hours === 12) hours = 0;
      eventDate.setHours(hours, mins, 0, 0);
    }
  } else {
    eventDate.setHours(9, 0, 0, 0);
  }

  // If event is in the past, do not schedule
  if (eventDate.getTime() <= Date.now()) return;

  const title = "Family Event Reminder";
  const name = event.title || "Upcoming Event";
  
  const _7d = new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const _1d = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
  const _morning = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 9, 0, 0);
  const _1h = new Date(eventDate.getTime() - 60 * 60 * 1000);

  if (settings.sevenDaysBefore && _7d.getTime() > Date.now()) {
    await scheduleNotif(`famevent_${event.id}_7d`, title, `"${name}" is happening in 7 days.`, _7d);
  }
  if (settings.oneDayBefore && _1d.getTime() > Date.now()) {
    await scheduleNotif(`famevent_${event.id}_1d`, title, `"${name}" is happening tomorrow!`, _1d);
  }
  if (settings.morningOfEvent && _morning.getTime() > Date.now()) {
    await scheduleNotif(`famevent_${event.id}_morning`, title, `Reminder: "${name}" is today.`, _morning);
  }
  if (settings.oneHourBefore && _1h.getTime() > Date.now()) {
    await scheduleNotif(`famevent_${event.id}_1h`, title, `"${name}" is starting in 1 hour!`, _1h);
  }
};

export const syncFamilyEventsNotifications = async (userId, newSettings = null) => {
  if (Platform.OS === 'web') return;
  
  let settings = newSettings;
  if (!settings) {
    const saved = await AsyncStorage.getItem(`tushu_${userId}_event_reminders`);
    settings = saved ? JSON.parse(saved) : { sevenDaysBefore: true, oneDayBefore: true, morningOfEvent: true, oneHourBefore: false };
  }
  
  try {
    const rawEvents = await AsyncStorage.getItem('tushu_shared_fam_events');
    const events = rawEvents ? JSON.parse(rawEvents) : [];
    
    for (const event of events) {
      await scheduleFamilyEventReminders(event, settings);
    }
  } catch (e) {
    console.log("Failed to sync family events", e);
  }
};

export const initializeNotifications = async (userId, dataService) => {
  if (Platform.OS === 'web') return;
  const hasPerm = await requestNotificationPermission();
  if (!hasPerm) return;

  const savedSettings = await AsyncStorage.getItem(`tushu_${userId}_notif_settings`);
  const settings = savedSettings ? JSON.parse(savedSettings) : { taskReminders: true, bdayReminders: true, expenseReminders: false, khataReminders: true };

  // Task Sync
  const allTasks = await dataService.getTasks(userId);
  if (settings.taskReminders) {
    allTasks.forEach(t => scheduleTaskReminders(t));
  } else {
    allTasks.forEach(t => cancelTaskReminders(t.id));
  }

  // Birthday Sync
  const allBdays = await dataService.getBirthdays();
  if (settings.bdayReminders) {
    allBdays.forEach(b => scheduleBirthdayReminders(b));
  } else {
    allBdays.forEach(b => cancelBirthdayReminders(b.id));
  }

  // Expense/Bill Sync
  const allBills = await dataService.getBills(userId);
  if (settings.expenseReminders) {
    allBills.forEach(b => scheduleExpenseReminders(b));
  } else {
    allBills.forEach(b => cancelExpenseReminders(b.id));
  }

  // Khata Sync
  const allKhata = await dataService.getKhataContacts(userId);
  if (settings.khataReminders) {
    allKhata.forEach(k => scheduleKhataReminders(k));
  } else {
    allKhata.forEach(k => cancelKhataReminders(k.id));
  }

  // Family Event Sync
  await syncFamilyEventsNotifications(userId);
};
