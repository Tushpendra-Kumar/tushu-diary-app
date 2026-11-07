/**
 * dashboardService.js
 * Aggregates data from all existing modules into dashboard-ready summaries.
 * No duplicate data store — reads directly from existing service functions.
 */

import {
  getTasks, getNotes, getExpenses, getShoppingLists, getKhataContacts,
  getGoals, getVehicles, getBills, getEmis, getFamilyEvents,
  getWebsiteLinks, getMusic, getWorkTasks, getBudget, getSavings,
  getMoviesSeries
} from './personalDataService';
import { getReminders } from './reminderService';
import { getEvents } from './calendarService';
import { getAttachments } from './attachmentService';

const todayStr = () => new Date().toISOString().slice(0, 10);
const safe = async (fn, fallback = []) => { try { return await fn(); } catch { return fallback; } };

// ── Today's date helpers ──
const isToday = (dateStr) => dateStr && dateStr.slice(0, 10) === todayStr();
const isOverdue = (dateStr, timeStr) => {
  if (!dateStr) return false;
  const d = new Date(`${dateStr}T${timeStr || '23:59'}`);
  return d < new Date() && dateStr.slice(0, 10) < todayStr();
};
const isUpcoming = (dateStr) => dateStr && dateStr.slice(0, 10) > todayStr();

export const loadDashboard = async (userId) => {
  const [
    workTasks, tasks, notes, expenses, shoppingLists, goals,
    vehicles, bills, emis, familyEvents, websites, music,
    reminders, calEvents, attachments, budgetRaw, savings, moviesSeriesRaw
  ] = await Promise.all([
    safe(() => getWorkTasks(userId)),
    safe(() => getTasks(userId)),
    safe(() => getNotes(userId)),
    safe(() => getExpenses(userId)),
    safe(() => getShoppingLists(userId)),
    safe(() => getGoals(userId)),
    safe(() => getVehicles(userId)),
    safe(() => getBills(userId)),
    safe(() => getEmis(userId)),
    safe(() => getFamilyEvents(userId)),
    safe(() => getWebsiteLinks(userId)),
    safe(() => getMusic(userId)),
    safe(() => getReminders(userId)),
    safe(() => getEvents(userId)),
    safe(() => getAttachments(userId)),
    safe(() => getBudget(userId), null),
    safe(() => getSavings(userId)),
    safe(() => getMoviesSeries(userId)),
  ]);

  const moviesSeries = moviesSeriesRaw || [];

  const allTasks = [...(workTasks || []), ...(tasks || [])];
  const today = todayStr();

  // ── TODAY ──
  const todayTasks = allTasks.filter(t => !t.completed && (isToday(t.dueDate) || isToday(t.createdAt)));
  const todayReminders = reminders.filter(r => !r.completed && r.date && r.date.slice(0, 10) === today);
  const todayEvents = calEvents.filter(e => !e.completed && e.date === today);
  const overdueTasks = allTasks.filter(t => !t.completed && t.dueDate && isOverdue(t.dueDate));
  const overdueReminders = reminders.filter(r => !r.completed && isOverdue(r.date, r.time));
  const overdueBills = bills.filter(b => !b.paid && b.dueDate && isOverdue(b.dueDate));

  // ── QUICK STATS ──
  const pendingTasks = allTasks.filter(t => !t.completed).length;
  const upcomingReminders = reminders.filter(r => !r.completed && isUpcoming(r.date)).length;
  const upcomingEvents = calEvents.filter(e => !e.completed && isUpcoming(e.date)).length;
  const activeGoals = goals.filter(g => !g.completed && !g.achieved).length;
  const totalNotes = notes.length;
  const totalWebsites = websites.length;

  // ── FINANCIAL ──
  const now = new Date();
  const thisMonthExpenses = expenses
    .filter(e => { const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const pendingBills = bills.filter(b => !b.paid);
  const pendingBillsTotal = pendingBills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
  const upcomingEmis = emis.filter(e => e.nextDueDate && e.nextDueDate >= today).slice(0, 3);
  const budget = Array.isArray(budgetRaw) ? budgetRaw[0] : budgetRaw;
  const budgetAmount = budget ? parseFloat(budget.amount || budget.total || 0) : 0;

  // Khata summary
  const khataContacts = await safe(() => getKhataContacts(userId));
  const khataTotalGiven = khataContacts.reduce((s, c) => s + (parseFloat(c.totalGiven || c.balance || 0) > 0 ? parseFloat(c.totalGiven || c.balance || 0) : 0), 0);
  const khataTotalOwed = khataContacts.reduce((s, c) => s + (parseFloat(c.totalOwed || c.balance || 0) < 0 ? Math.abs(parseFloat(c.totalOwed || c.balance || 0)) : 0), 0);

  // Goals progress
  const goalsWithProgress = goals.slice(0, 4).map(g => ({
    id: g.id, title: g.title,
    target: parseFloat(g.targetAmount || g.target || 0),
    current: parseFloat(g.currentAmount || g.saved || g.current || 0),
    category: g.category
  }));

  // ── UPCOMING (combined, chronological) ──
  const upcomingItems = [
    ...reminders.filter(r => !r.completed && r.date >= today).map(r => ({
      id: r.id, type: 'Reminder', title: r.title,
      date: r.date, time: r.time, module: 'AdvancedReminders'
    })),
    ...calEvents.filter(e => !e.completed && e.date >= today).map(e => ({
      id: e.id, type: 'Event', title: e.title,
      date: e.date, time: e.time, module: 'AdvancedCalendar'
    })),
    ...bills.filter(b => !b.paid && b.dueDate >= today).map(b => ({
      id: b.id, type: 'Bill', title: b.title || b.category,
      date: b.dueDate, time: '', module: null
    })),
    ...emis.filter(e => e.nextDueDate && e.nextDueDate >= today).map(e => ({
      id: e.id, type: 'EMI', title: e.title || 'EMI',
      date: e.nextDueDate, time: '', module: null
    })),
  ].sort((a, b) => (a.date || '').localeCompare(b.date || '')).slice(0, 8);

  // ── RECENT ACTIVITY ──
  const recentActivity = [
    ...allTasks.map(t => ({ title: t.title, label: 'Task', ts: t.createdAt || 0 })),
    ...notes.map(n => ({ title: n.title || 'Note', label: 'Note', ts: n.createdAt || 0 })),
    ...expenses.map(e => ({ title: e.title || e.category, label: 'Expense', ts: new Date(e.date || 0).getTime() || 0 })),
    ...reminders.map(r => ({ title: r.title, label: 'Reminder', ts: r.createdAt || 0 })),
    ...calEvents.map(e => ({ title: e.title, label: 'Event', ts: e.createdAt || 0 })),
    ...websites.map(w => ({ title: w.name || w.url, label: 'Website', ts: w.createdAt || 0 })),
    ...moviesSeries.map(m => ({ title: m.title, label: m.type || 'Movie', ts: m.createdAt || 0 })),
  ].filter(a => a.ts).sort((a, b) => b.ts - a.ts).slice(0, 8);

  // ── SHOPPING ──
  const activeShoppingLists = shoppingLists.slice(0, 3);
  const pendingShoppingItems = shoppingLists.reduce((s, l) =>
    s + (l.items || []).filter(i => !i.checked && !i.purchased).length, 0);

  return {
    today: { todayTasks, todayReminders, todayEvents, overdueTasks, overdueReminders, overdueBills },
    stats: { pendingTasks, upcomingReminders, upcomingEvents, activeGoals, totalNotes, totalWebsites, totalExpenses: expenses.length, totalMoviesSeries: moviesSeries.length },
    finance: { thisMonthExpenses, pendingBills, pendingBillsTotal, upcomingEmis, budgetAmount, khataTotalGiven, khataTotalOwed, goalsWithProgress },
    tasks: { allTasks: allTasks.filter(t => !t.completed).slice(0, 5) },
    personal: {
      vehicles: vehicles.slice(0, 3), music: music.slice(0, 3), activeShoppingLists, pendingShoppingItems, familyEvents: familyEvents.slice(0, 3),
      moviesSeries: moviesSeries.slice(0, 3),
      moviesCount: moviesSeries.filter(m => (m.type || 'Movie') === 'Movie').length,
      seriesCount: moviesSeries.filter(m => m.type === 'Series').length,
      watchingCount: moviesSeries.filter(m => m.status === 'Watching').length,
    },
    upcoming: upcomingItems,
    recentActivity,
    raw: { reminders, calEvents, bills, emis, goals }
  };
};

export const formatCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.slice(0, 10).split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
};
export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, min] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(min).padStart(2, '0')} ${ampm}`;
};
export const relativeTime = (ts) => {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
