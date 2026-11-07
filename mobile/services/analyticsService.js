/**
 * analyticsService.js
 * Computes all analytics from existing module data.
 * No separate DB — reads from existing services directly.
 */
import {
  getTasks, getNotes, getExpenses, getShoppingLists, getKhataContacts,
  getGoals, getVehicles, getBills, getEmis, getFamilyEvents,
  getWebsiteLinks, getMusic, getWorkTasks, getBudget, getMoviesSeries
} from './personalDataService';
import { getReminders } from './reminderService';
import { getEvents }    from './calendarService';
import { getAttachments } from './attachmentService';

// ── Date range helpers ──────────────────────────────────────────────────────
export const RANGES = [
  'Today', 'This Week', 'This Month', 'Last Month', 'Last 3 Months', 'This Year', 'Custom'
];

export const getRangeBounds = (range, custom = {}) => {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case 'Today':
      return { start: today, end: new Date(today.getTime() + 86399999) };
    case 'This Week': {
      const dow = today.getDay();
      const s   = new Date(today); s.setDate(today.getDate() - dow);
      const e   = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23,59,59);
      return { start: s, end: e };
    }
    case 'This Month': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { start: s, end: e };
    }
    case 'Last Month': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start: s, end: e };
    }
    case 'Last 3 Months': {
      const s = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { start: s, end: e };
    }
    case 'This Year': {
      const s = new Date(now.getFullYear(), 0, 1);
      const e = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      return { start: s, end: e };
    }
    case 'Custom':
      return { start: custom.start ? new Date(custom.start) : today, end: custom.end ? new Date(custom.end + 'T23:59:59') : new Date(today.getTime() + 86399999) };
    default:
      return { start: today, end: new Date(today.getTime() + 86399999) };
  }
};

// previous-period bounds (same duration, shifted back)
const getPrevBounds = (start, end) => {
  const dur = end.getTime() - start.getTime();
  return { start: new Date(start.getTime() - dur - 1), end: new Date(start.getTime() - 1) };
};

const inRange = (dateVal, start, end) => {
  if (!dateVal) return false;
  const d = typeof dateVal === 'number' ? new Date(dateVal) : new Date(dateVal);
  return d >= start && d <= end;
};

// ── Formatters ──────────────────────────────────────────────────────────────
export const fmtCurrency = n => `₹${(n||0).toLocaleString('en-IN',{maximumFractionDigits:0})}`;
export const fmtPct = (a, b) => b === 0 ? null : Math.round(((a - b) / b) * 100);
export const monthLabel = idx => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][idx];

const safe = async (fn, fallback=[]) => { try { return await fn(); } catch { return fallback; } };

// ── Main compute function ────────────────────────────────────────────────────
export const computeAnalytics = async (userId, range, custom={}) => {
  const { start, end } = getRangeBounds(range, custom);
  const { start: ps, end: pe } = getPrevBounds(start, end);

  const [
    workTasks, tasks, notes, expenses, shoppingLists, goals,
    vehicles, bills, emis, familyEvents, websites, music,
    reminders, calEvents, attachments, budgetRaw, moviesSeriesRaw
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
    safe(() => getMoviesSeries(userId)),
  ]);

  const moviesSeries = moviesSeriesRaw || [];

  const allTasks = [...(workTasks||[]), ...(tasks||[])];
  const budget   = Array.isArray(budgetRaw) ? budgetRaw[0] : budgetRaw;

  // ── FINANCIAL ──────────────────────────────────────────────────────────────
  const rangeExpenses = expenses.filter(e => inRange(e.date, start, end));
  const prevExpenses  = expenses.filter(e => inRange(e.date, ps, pe));
  const totalSpend    = rangeExpenses.reduce((s,e) => s + (parseFloat(e.amount)||0), 0);
  const prevSpend     = prevExpenses.reduce((s,e) => s + (parseFloat(e.amount)||0), 0);
  const spendTrend    = fmtPct(totalSpend, prevSpend);
  const budgetAmt     = budget ? parseFloat(budget.amount||budget.total||0) : 0;

  // Category breakdown
  const catMap = {};
  rangeExpenses.forEach(e => {
    const c = e.category || 'Other';
    catMap[c] = (catMap[c]||0) + (parseFloat(e.amount)||0);
  });
  const categories = Object.entries(catMap)
    .sort((a,b) => b[1]-a[1])
    .map(([name, amount]) => ({ name, amount, pct: totalSpend > 0 ? Math.round((amount/totalSpend)*100) : 0 }));
  const topCategory = categories[0]?.name || null;

  // Monthly spending trend (last 6 months)
  const now = new Date();
  const monthlySpend = Array.from({length:6}, (_,i) => {
    const m = (now.getMonth() - 5 + i + 12) % 12;
    const y = now.getFullYear() + Math.floor((now.getMonth() - 5 + i) / 12);
    const total = expenses
      .filter(e => { const d = new Date(e.date); return d.getFullYear()===y && d.getMonth()===m; })
      .reduce((s,e) => s + (parseFloat(e.amount)||0), 0);
    return { label: monthLabel(m), value: total };
  });

  // Daily spend for range (up to 14 days)
  const dailyMap = {};
  rangeExpenses.forEach(e => {
    const day = (e.date||'').slice(0,10);
    if (day) dailyMap[day] = (dailyMap[day]||0) + (parseFloat(e.amount)||0);
  });
  const dailySpend = Object.entries(dailyMap).sort().slice(-14).map(([d,v]) => ({ label: d.slice(5), value: v }));

  // Pending bills/EMIs
  const today = new Date().toISOString().slice(0,10);
  const pendingBills   = bills.filter(b => !b.paid);
  const pendingBillAmt = pendingBills.reduce((s,b) => s + (parseFloat(b.amount)||0), 0);
  const upcomingEmis   = emis.filter(e => e.nextDueDate >= today);
  const nextEmiAmt     = upcomingEmis.reduce((s,e) => s + (parseFloat(e.amount)||0), 0);

  // Khata
  const khata = await safe(() => getKhataContacts(userId));
  const khataGiven = khata.reduce((s,c) => s + Math.max(parseFloat(c.totalGiven||c.balance||0),0), 0);
  const khataOwed  = khata.reduce((s,c) => s + Math.abs(Math.min(parseFloat(c.totalOwed||c.balance||0),0)), 0);

  // Goals
  const activeGoals   = goals.filter(g => !g.achieved && !g.completed);
  const totalTarget   = activeGoals.reduce((s,g) => s + (parseFloat(g.targetAmount||g.target||0)),0);
  const totalSaved    = activeGoals.reduce((s,g) => s + (parseFloat(g.currentAmount||g.saved||g.current||0)),0);
  const goalsPct      = totalTarget > 0 ? Math.min(Math.round((totalSaved/totalTarget)*100),100) : 0;

  // ── PRODUCTIVITY ────────────────────────────────────────────────────────────
  const rangeTasks     = allTasks.filter(t => inRange(t.createdAt, start, end));
  const completedTasks = rangeTasks.filter(t => t.completed || t.status === 'completed');
  const pendingTasks   = rangeTasks.filter(t => !t.completed && t.status !== 'completed');
  const overdueTasks   = pendingTasks.filter(t => t.dueDate && t.dueDate < today);
  const taskCpPct      = rangeTasks.length > 0 ? Math.round((completedTasks.length/rangeTasks.length)*100) : 0;
  const prevTasks      = allTasks.filter(t => inRange(t.createdAt, ps, pe));
  const prevCompleted  = prevTasks.filter(t => t.completed || t.status === 'completed').length;
  const taskTrend      = fmtPct(completedTasks.length, prevCompleted);

  // Reminders
  const rangeReminders   = reminders.filter(r => inRange(r.createdAt||r.date, start, end));
  const completedRemind  = reminders.filter(r => r.completed).length;
  const pendingRemind    = reminders.filter(r => !r.completed).length;
  const overdueRemind    = reminders.filter(r => !r.completed && r.date && r.date < today).length;

  // ── CALENDAR ────────────────────────────────────────────────────────────────
  const rangeEvents    = calEvents.filter(e => inRange(e.date, start, end));
  const completedEvts  = calEvents.filter(e => e.completed).length;
  const upcomingEvts   = calEvents.filter(e => !e.completed && e.date >= today).length;
  const pastEvts       = calEvents.filter(e => !e.completed && e.date < today).length;

  // Monthly event distribution (last 6 months)
  const monthlyEvents = Array.from({length:6}, (_,i) => {
    const m = (now.getMonth() - 5 + i + 12) % 12;
    const y = now.getFullYear() + Math.floor((now.getMonth() - 5 + i) / 12);
    const count = calEvents.filter(e => { const d = new Date(e.date); return d.getFullYear()===y && d.getMonth()===m; }).length;
    return { label: monthLabel(m), value: count };
  });

  // ── PERSONAL ────────────────────────────────────────────────────────────────
  const pendingShopItems = shoppingLists.reduce((s,l) => s + (l.items||[]).filter(i=>!i.checked&&!i.purchased).length, 0);

  // ── INSIGHTS ────────────────────────────────────────────────────────────────
  const insights = [];
  if (totalSpend > 0 && spendTrend !== null) {
    if (spendTrend > 0) insights.push(`Your spending increased by ${spendTrend}% compared to the previous period.`);
    else if (spendTrend < 0) insights.push(`Your spending decreased by ${Math.abs(spendTrend)}% compared to the previous period.`);
    else insights.push('Your spending is about the same as the previous period.');
  }
  if (topCategory) insights.push(`Your highest expense category is "${topCategory}".`);
  if (budgetAmt > 0 && totalSpend > budgetAmt) insights.push(`You are over budget by ${fmtCurrency(totalSpend - budgetAmt)} this period.`);
  else if (budgetAmt > 0 && totalSpend <= budgetAmt) insights.push(`You are within budget. ${fmtCurrency(budgetAmt - totalSpend)} remaining.`);
  if (taskCpPct >= 80) insights.push(`Great productivity! You completed ${taskCpPct}% of your tasks.`);
  else if (taskCpPct > 0) insights.push(`You completed ${taskCpPct}% of your tasks. Keep going!`);
  if (overdueRemind > 0) insights.push(`You have ${overdueRemind} overdue reminder${overdueRemind>1?'s':''} that need attention.`);
  if (overdueTasks.length > 0) insights.push(`${overdueTasks.length} task${overdueTasks.length>1?'s are':' is'} overdue.`);
  if (goalsPct >= 100) insights.push('You have reached your savings goals. Well done!');
  else if (goalsPct > 0) insights.push(`You are ${goalsPct}% towards your savings goals.`);

  return {
    range: { start, end, label: range },
    finance: { totalSpend, prevSpend, spendTrend, budgetAmt, categories, topCategory, monthlySpend, dailySpend, pendingBills, pendingBillAmt, upcomingEmis, nextEmiAmt, khataGiven, khataOwed, totalSaved, totalTarget, goalsPct, activeGoalsCount: activeGoals.length },
    productivity: { total: rangeTasks.length, completed: completedTasks.length, pending: pendingTasks.length, overdue: overdueTasks.length, taskCpPct, taskTrend, completedRemind, pendingRemind, overdueRemind },
    calendar: { total: calEvents.length, rangeCount: rangeEvents.length, completed: completedEvts, upcoming: upcomingEvts, past: pastEvts, monthlyEvents },
    personal: {
      totalNotes: notes.length, totalWebsites: websites.length, totalMusic: music.length,
      totalVehicles: vehicles.length, pendingShopItems, totalAttachments: attachments.length,
      totalMoviesSeries: moviesSeries.length,
      totalMovies: moviesSeries.filter(m => (m.type || 'Movie') === 'Movie').length,
      totalSeries: moviesSeries.filter(m => m.type === 'Series').length,
      watchingCount: moviesSeries.filter(m => m.status === 'Watching').length,
      watchedCount: moviesSeries.filter(m => m.status === 'Watched').length,
      wantToWatchCount: moviesSeries.filter(m => m.status === 'Want to Watch').length
    },
    insights,
    counts: { expenses: expenses.length, tasks: allTasks.length, reminders: reminders.length, events: calEvents.length, goals: goals.length, moviesSeries: moviesSeries.length },
  };
};
