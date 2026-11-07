/**
 * insightsEngine.js
 * Generates structured, prioritized insight cards from actual user data.
 * Reuses same data sources as analyticsService — no separate database.
 *
 * Insight shape:
 * { id, category, priority, title, detail, value, route, routeLabel }
 *
 * Priority: 1=Critical, 2=ActionRequired, 3=Upcoming, 4=Informational, 5=PositiveProgress
 * Categories: Finance | Productivity | Reminders | Calendar | Goals | Personal | Important
 */

import {
  getTasks, getNotes, getExpenses, getShoppingLists, getKhataContacts,
  getGoals, getVehicles, getBills, getEmis, getFamilyEvents,
  getWebsiteLinks, getMusic, getWorkTasks, getBudget, getMoviesSeries
} from './personalDataService';
import { getReminders } from './reminderService';
import { getEvents }    from './calendarService';
import { getRangeBounds } from './analyticsService';

const safe = async (fn, fb=[]) => { try { return await fn(); } catch { return fb; } };

const todayStr = () => new Date().toISOString().slice(0,10);
const monthLabel = m => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m];
export const fmtCur = n => `₹${(n||0).toLocaleString('en-IN',{maximumFractionDigits:0})}`;
export const fmtDate = d => {
  if (!d) return '';
  const [y,m,dy] = d.slice(0,10).split('-');
  return `${parseInt(dy)} ${monthLabel(parseInt(m)-1)} ${y}`;
};

// Minimum data thresholds before generating certain insights
const MIN_EXPENSES_FOR_PATTERN = 3;
const MIN_TASKS_FOR_PRODUCTIVITY = 2;
const BUDGET_WARNING_PCT = 80;

let insightCounter = 0;
const insight = (category, priority, title, detail, value='', route=null, routeLabel='') => ({
  id: `ins_${++insightCounter}`, category, priority, title, detail, value, route, routeLabel
});

export const generateInsights = async (userId, range='This Month') => {
  insightCounter = 0;
  const { start, end } = getRangeBounds(range);
  const today = todayStr();
  const now   = new Date();

  const inRange = (d) => {
    if (!d) return false;
    const dt = new Date(typeof d === 'number' ? d : d);
    return dt >= start && dt <= end;
  };

  const [
    workTasks, tasks, notes, expenses, lists, goals,
    vehicles, bills, emis, familyEvents, websites, music,
    reminders, calEvents, budgetRaw, khataContacts, moviesSeries
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
    safe(() => getBudget(userId), null),
    safe(() => getKhataContacts(userId)),
    safe(() => getMoviesSeries(userId)),
  ]);

  const allTasks    = [...(workTasks||[]), ...(tasks||[])];
  const budget      = Array.isArray(budgetRaw) ? budgetRaw[0] : budgetRaw;
  const budgetAmt   = budget ? parseFloat(budget.amount||budget.total||0) : 0;

  const insights = [];

  // ── FINANCIAL INSIGHTS ────────────────────────────────────────────────────

  // Range expenses
  const rangeExp = expenses.filter(e => inRange(e.date));
  const totalSpend = rangeExp.reduce((s,e) => s+(parseFloat(e.amount)||0), 0);

  // Previous same-duration period
  const dur = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - dur - 1);
  const prevEnd   = new Date(start.getTime() - 1);
  const prevExp   = expenses.filter(e => { if(!e.date) return false; const d=new Date(e.date); return d>=prevStart&&d<=prevEnd; });
  const prevSpend = prevExp.reduce((s,e) => s+(parseFloat(e.amount)||0), 0);

  // Category breakdown
  const catMap = {};
  rangeExp.forEach(e => { const c=e.category||'Other'; catMap[c]=(catMap[c]||0)+(parseFloat(e.amount)||0); });
  const sortedCats = Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  const topCat = sortedCats[0];

  // Budget insights
  if (budgetAmt > 0 && totalSpend > 0) {
    const usedPct = (totalSpend / budgetAmt) * 100;
    if (usedPct >= 100) {
      insights.push(insight('Finance', 1, 'Budget Exceeded',
        `You have spent ${fmtCur(totalSpend - budgetAmt)} more than your ${range.toLowerCase()} budget.`,
        `${fmtCur(totalSpend)} / ${fmtCur(budgetAmt)}`, null, ''));
    } else if (usedPct >= BUDGET_WARNING_PCT) {
      insights.push(insight('Finance', 2, 'Budget Almost Full',
        `You have used ${Math.round(usedPct)}% of your budget. Only ${fmtCur(budgetAmt - totalSpend)} remaining.`,
        `${Math.round(usedPct)}% used`, null, ''));
    } else if (totalSpend > 0) {
      insights.push(insight('Finance', 5, 'Budget On Track',
        `You have used ${Math.round(usedPct)}% of your budget. ${fmtCur(budgetAmt - totalSpend)} remaining.`,
        `${Math.round(usedPct)}% used`, null, ''));
    }
  }

  // Spending trend
  if (rangeExp.length >= MIN_EXPENSES_FOR_PATTERN && prevExp.length >= 1 && prevSpend > 0) {
    const changePct = Math.round(((totalSpend - prevSpend) / prevSpend) * 100);
    if (changePct > 20) {
      insights.push(insight('Finance', 2, 'Spending Increased',
        `Your spending increased by ${changePct}% compared to the previous period.`,
        `${fmtCur(totalSpend)} vs ${fmtCur(prevSpend)}`, null, ''));
    } else if (changePct < -10) {
      insights.push(insight('Finance', 5, 'Spending Reduced',
        `Great! Your spending decreased by ${Math.abs(changePct)}% compared to the previous period.`,
        `${fmtCur(totalSpend)} vs ${fmtCur(prevSpend)}`, null, ''));
    }
  }

  // Top expense category
  if (topCat && rangeExp.length >= MIN_EXPENSES_FOR_PATTERN) {
    insights.push(insight('Finance', 4, 'Top Expense Category',
      `"${topCat[0]}" is your highest spending category this period.`,
      fmtCur(topCat[1]), null, ''));
  }

  // Pending bills — overdue
  const overdueBills = bills.filter(b => !b.paid && b.dueDate && b.dueDate < today);
  if (overdueBills.length > 0) {
    const amt = overdueBills.reduce((s,b)=>s+(parseFloat(b.amount)||0),0);
    insights.push(insight('Important', 1, 'Overdue Bills',
      `${overdueBills.length} bill${overdueBills.length>1?'s are':' is'} overdue totalling ${fmtCur(amt)}.`,
      fmtCur(amt), null, ''));
  }

  // Upcoming bills (next 7 days)
  const next7 = new Date(now.getTime()+7*86400000).toISOString().slice(0,10);
  const upcomingBills = bills.filter(b => !b.paid && b.dueDate && b.dueDate >= today && b.dueDate <= next7);
  if (upcomingBills.length > 0) {
    const amt = upcomingBills.reduce((s,b)=>s+(parseFloat(b.amount)||0),0);
    const nearestBill = upcomingBills.sort((a,b)=>a.dueDate.localeCompare(b.dueDate))[0];
    insights.push(insight('Important', 2, 'Upcoming Bills',
      `${upcomingBills.length} bill${upcomingBills.length>1?'s':''}  due within 7 days. Next: "${nearestBill.title||nearestBill.category}" on ${fmtDate(nearestBill.dueDate)}.`,
      fmtCur(amt), null, ''));
  }

  // Upcoming EMIs (next 15 days)
  const next15 = new Date(now.getTime()+15*86400000).toISOString().slice(0,10);
  const upcomingEmis = emis.filter(e => e.nextDueDate && e.nextDueDate >= today && e.nextDueDate <= next15);
  if (upcomingEmis.length > 0) {
    const nearest = upcomingEmis.sort((a,b)=>a.nextDueDate.localeCompare(b.nextDueDate))[0];
    insights.push(insight('Important', 2, 'EMI Due Soon',
      `"${nearest.title||'EMI'}" is due on ${fmtDate(nearest.nextDueDate)}.`,
      fmtCur(nearest.amount), null, ''));
  }

  // Khata
  const khataReceivable = khataContacts.reduce((s,c)=>s+Math.max(parseFloat(c.totalGiven||c.balance||0),0),0);
  if (khataReceivable > 0 && khataContacts.length > 0) {
    insights.push(insight('Finance', 3, 'Khata Receivable',
      `You have ${fmtCur(khataReceivable)} to receive across ${khataContacts.length} contact${khataContacts.length>1?'s':''}.`,
      fmtCur(khataReceivable), 'KhataBookScreen', 'View Khata'));
  }

  // ── GOALS & SAVINGS ───────────────────────────────────────────────────────
  const activeGoals = goals.filter(g => !g.achieved && !g.completed);
  activeGoals.slice(0,4).forEach(g => {
    const target = parseFloat(g.targetAmount||g.target||0);
    const saved  = parseFloat(g.currentAmount||g.saved||g.current||0);
    if (target <= 0) return;
    const pct = Math.min(Math.round((saved/target)*100),100);
    if (pct >= 100) {
      insights.push(insight('Goals', 5, 'Goal Achieved!',
        `Congratulations! You have reached your goal "${g.title}".`,
        `${fmtCur(saved)} / ${fmtCur(target)}`, null, ''));
    } else if (pct >= 75) {
      insights.push(insight('Goals', 5, 'Almost There',
        `You are ${pct}% towards your goal "${g.title}". Just ${fmtCur(target-saved)} more to go.`,
        `${pct}% complete`, null, ''));
    } else if (pct > 0) {
      insights.push(insight('Goals', 4, 'Goal In Progress',
        `"${g.title}" is ${pct}% complete. Keep saving to reach your target of ${fmtCur(target)}.`,
        `${fmtCur(saved)} saved`, null, ''));
    } else {
      insights.push(insight('Goals', 4, 'Goal Not Started',
        `Your goal "${g.title}" has a target of ${fmtCur(target)}. Start saving to make progress.`,
        fmtCur(target), null, ''));
    }
  });

  // ── PRODUCTIVITY INSIGHTS ─────────────────────────────────────────────────
  const rangeTasks     = allTasks.filter(t => inRange(t.createdAt));
  const completedTasks = rangeTasks.filter(t => t.completed || t.status==='completed');
  const pendingTasks   = allTasks.filter(t => !t.completed && t.status!=='completed');
  const overdueTasks   = pendingTasks.filter(t => t.dueDate && t.dueDate < today);

  if (overdueTasks.length > 0) {
    insights.push(insight('Productivity', 1, 'Overdue Tasks',
      `You have ${overdueTasks.length} overdue task${overdueTasks.length>1?'s':''} that need attention.`,
      `${overdueTasks.length} overdue`, 'TaskManagerScreen', 'View Tasks'));
  }

  if (pendingTasks.length > 0) {
    insights.push(insight('Productivity', 3, 'Pending Tasks',
      `You have ${pendingTasks.length} pending task${pendingTasks.length>1?'s':''} to complete.`,
      `${pendingTasks.length} pending`, 'TaskManagerScreen', 'View Tasks'));
  }

  if (rangeTasks.length >= MIN_TASKS_FOR_PRODUCTIVITY && completedTasks.length > 0) {
    const pct = Math.round((completedTasks.length/rangeTasks.length)*100);
    if (pct >= 80) {
      insights.push(insight('Productivity', 5, 'Excellent Productivity',
        `You completed ${pct}% of your tasks this period. Great work!`,
        `${completedTasks.length}/${rangeTasks.length} done`, null, ''));
    } else if (pct >= 50) {
      insights.push(insight('Productivity', 4, 'Good Progress',
        `You have completed ${pct}% of your tasks this period.`,
        `${completedTasks.length}/${rangeTasks.length} done`, null, ''));
    } else {
      insights.push(insight('Productivity', 3, 'Tasks Need Attention',
        `Only ${pct}% of tasks completed this period. ${pendingTasks.length} still pending.`,
        `${pct}% done`, 'TaskManagerScreen', 'View Tasks'));
    }
  }

  // ── REMINDERS INSIGHTS ────────────────────────────────────────────────────
  const overdueReminders = reminders.filter(r => !r.completed && r.date && r.date < today);
  const upcomingReminders = reminders.filter(r => !r.completed && r.date && r.date >= today && r.date <= next7);
  const completedReminders = reminders.filter(r => r.completed);

  if (overdueReminders.length > 0) {
    insights.push(insight('Reminders', 1, 'Missed Reminders',
      `You have ${overdueReminders.length} overdue reminder${overdueReminders.length>1?'s':''}.`,
      `${overdueReminders.length} missed`, 'AdvancedReminders', 'View Reminders'));
  }

  if (upcomingReminders.length > 0) {
    const next = upcomingReminders.sort((a,b)=>a.date.localeCompare(b.date))[0];
    insights.push(insight('Reminders', 3, 'Upcoming Reminder',
      `"${next.title}" is due on ${fmtDate(next.date)}${next.time ? ' at ' + next.time : ''}.`,
      fmtDate(next.date), 'AdvancedReminders', 'View Reminders'));
  }

  if (completedReminders.length >= 3) {
    insights.push(insight('Reminders', 5, 'Reminder Streak',
      `You have completed ${completedReminders.length} reminder${completedReminders.length>1?'s':''} so far. Stay consistent!`,
      `${completedReminders.length} done`, null, ''));
  }

  // ── CALENDAR INSIGHTS ─────────────────────────────────────────────────────
  const todayEvents = calEvents.filter(e => !e.completed && e.date === today);
  const nextWeekEvents = calEvents.filter(e => !e.completed && e.date > today && e.date <= next7);
  const overdueEvents  = calEvents.filter(e => !e.completed && e.date < today);

  if (todayEvents.length > 0) {
    insights.push(insight('Calendar', 2, "Today's Events",
      `You have ${todayEvents.length} calendar event${todayEvents.length>1?'s':''} scheduled for today.`,
      `${todayEvents.length} today`, 'AdvancedCalendar', 'View Calendar'));
  }

  if (nextWeekEvents.length > 0) {
    const next = nextWeekEvents.sort((a,b)=>a.date.localeCompare(b.date))[0];
    insights.push(insight('Calendar', 3, 'Upcoming Events',
      `"${next.title}" is coming up on ${fmtDate(next.date)}.`,
      `${nextWeekEvents.length} this week`, 'AdvancedCalendar', 'View Calendar'));
  }

  if (overdueEvents.length > 0) {
    insights.push(insight('Calendar', 4, 'Past Events Unclosed',
      `${overdueEvents.length} event${overdueEvents.length>1?'s are':' is'} past their date and not marked complete.`,
      `${overdueEvents.length} events`, 'AdvancedCalendar', 'View Calendar'));
  }

  // ── PERSONAL INSIGHTS ─────────────────────────────────────────────────────
  const pendingShopItems = lists.reduce((s,l)=>s+(l.items||[]).filter(i=>!i.checked&&!i.purchased).length,0);
  if (pendingShopItems > 0) {
    insights.push(insight('Personal', 4, 'Shopping Pending',
      `You have ${pendingShopItems} item${pendingShopItems>1?'s':''} pending in your shopping list${lists.length>1?'s':''}.`,
      `${pendingShopItems} items`, null, ''));
  }

  if (notes.length > 0) {
    const recentNotes = notes.filter(n => inRange(n.createdAt)).length;
    if (recentNotes > 0) {
      insights.push(insight('Personal', 4, 'Notes Added',
        `You created ${recentNotes} note${recentNotes>1?'s':''} this period. Your collection has ${notes.length} note${notes.length>1?'s':''}.`,
        `${notes.length} total`, null, ''));
    }
  }

  if (websites.length > 0) {
    const recent = websites.filter(w => inRange(w.createdAt)).length;
    if (recent > 0) {
      insights.push(insight('Personal', 4, 'Links Saved',
        `You saved ${recent} website${recent>1?'s':''} this period.`,
        `${websites.length} total`, null, ''));
    }
  }

  if (vehicles.length > 0) {
    insights.push(insight('Personal', 4, 'Vehicles Tracked',
      `You are tracking ${vehicles.length} vehicle${vehicles.length>1?'s':''} in your Vehicle Manager.`,
      `${vehicles.length} vehicles`, 'VehicleManagerScreen', 'View Vehicles'));
  }

  // Movies & Series insights
  if (Array.isArray(moviesSeries) && moviesSeries.length > 0) {
    const activeWatching = moviesSeries.filter(m => m.status === 'Watching');
    if (activeWatching.length > 0) {
      const first = activeWatching[0];
      const prog = first.type === 'Series' && first.currentSeason
        ? ` (S${first.currentSeason}E${first.currentEpisode || 1})`
        : '';
      insights.push(insight('Personal', 4, 'Currently Watching',
        `You're currently watching "${first.title}"${prog}${activeWatching.length > 1 ? ` and ${activeWatching.length - 1} other title${activeWatching.length > 2 ? 's' : ''}` : ''}.`,
        `${activeWatching.length} active`, 'MoviesSeries', 'Open Movies & Series'));
    }

    const wantToWatch = moviesSeries.filter(m => m.status === 'Want to Watch');
    if (wantToWatch.length >= 3) {
      insights.push(insight('Personal', 4, 'Watchlist Backlog',
        `You have ${wantToWatch.length} titles saved in your Movies & Series watchlist. Time for movie night!`,
        `${wantToWatch.length} titles`, 'MoviesSeries', 'Open Watchlist'));
    }
  }

  // Sort by priority (1 = most urgent, 5 = positive)
  insights.sort((a,b) => a.priority - b.priority);

  return insights;
};

export const INSIGHT_CATEGORIES = ['All','Important','Finance','Productivity','Reminders','Calendar','Goals','Personal'];
