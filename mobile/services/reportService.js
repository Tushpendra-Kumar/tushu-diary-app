/**
 * reportService.js
 * Generates structured reports from actual module data.
 * Handles CSV, JSON and PDF (web: HTML-print, native: expo-print/sharing).
 * No separate data store — reads from existing services directly.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  getTasks, getNotes, getExpenses, getShoppingLists, getKhataContacts,
  getGoals, getVehicles, getBills, getEmis, getFamilyEvents,
  getWebsiteLinks, getMusic, getWorkTasks, getBudget, getMoviesSeries
} from './personalDataService';
import { getReminders } from './reminderService';
import { getEvents }    from './calendarService';
import { getAttachments } from './attachmentService';
import { getRangeBounds } from './analyticsService';

// ── History storage ──────────────────────────────────────────────────────────
const HISTORY_KEY = (uid) => `tushu_reports_history_${uid}`;
const uuid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export const getReportHistory = async (uid) => {
  try { const d = await AsyncStorage.getItem(HISTORY_KEY(uid)); return d ? JSON.parse(d) : []; }
  catch { return []; }
};
const saveHistory = async (uid, history) => {
  await AsyncStorage.setItem(HISTORY_KEY(uid), JSON.stringify(history));
};
export const addReportToHistory = async (uid, meta) => {
  const history = await getReportHistory(uid);
  const updated = [{ id: uuid(), createdAt: Date.now(), ...meta }, ...history].slice(0, 50);
  await saveHistory(uid, updated);
  return updated;
};
export const deleteReportFromHistory = async (uid, id) => {
  const history = await getReportHistory(uid);
  await saveHistory(uid, history.filter(r => r.id !== id));
};

// ── Module definitions ───────────────────────────────────────────────────────
export const REPORT_MODULES = [
  { key: 'expenses',     label: 'Expense Tracker'          },
  { key: 'budget',       label: 'Monthly Budget'            },
  { key: 'workTasks',    label: 'Work Tasks'                },
  { key: 'tasks',        label: 'Daily Planner'             },
  { key: 'bills',        label: 'Bills & Payments'          },
  { key: 'emis',         label: 'EMI Reminder'              },
  { key: 'goals',        label: 'Goals & Savings'           },
  { key: 'khata',        label: 'Khata Book'                },
  { key: 'shopping',     label: 'Shopping List'             },
  { key: 'notes',        label: 'Quick Notes'               },
  { key: 'familyEvents', label: 'Family Events'             },
  { key: 'calendar',     label: 'Advanced Calendar'         },
  { key: 'reminders',    label: 'Advanced Reminders'        },
  { key: 'vehicles',     label: 'Vehicle Manager'           },
  { key: 'websites',     label: 'Website & Link Manager'    },
  { key: 'music',        label: 'My Music'                  },
  { key: 'movies',       label: 'Movies & Series'           },
  { key: 'attachments',  label: 'Attachments'               },
];

// ── Date helpers ─────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0,10);
const fmtD = (d) => {
  if (!d) return '';
  const dt = typeof d === 'number' ? new Date(d) : new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
};
export const fmtCur = (n) => `Rs.${(n||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;

const inRange = (dateVal, start, end) => {
  if (!dateVal) return false;
  const d = typeof dateVal === 'number' ? new Date(dateVal) : new Date(dateVal);
  return !isNaN(d) && d >= start && d <= end;
};

// ── Data fetchers ─────────────────────────────────────────────────────────────
const safe = async (fn, fb=[]) => { try { return await fn(); } catch { return fb; } };

const fetchModule = async (userId, moduleKey) => {
  switch (moduleKey) {
    case 'expenses':     return safe(() => getExpenses(userId));
    case 'budget':       return safe(() => getBudget(userId), null);
    case 'workTasks':    return safe(() => getWorkTasks(userId));
    case 'tasks':        return safe(() => getTasks(userId));
    case 'bills':        return safe(() => getBills(userId));
    case 'emis':         return safe(() => getEmis(userId));
    case 'goals':        return safe(() => getGoals(userId));
    case 'khata':        return safe(() => getKhataContacts(userId));
    case 'shopping':     return safe(() => getShoppingLists(userId));
    case 'notes':        return safe(() => getNotes(userId));
    case 'familyEvents': return safe(() => getFamilyEvents(userId));
    case 'calendar':     return safe(() => getEvents(userId));
    case 'reminders':    return safe(() => getReminders(userId));
    case 'vehicles':     return safe(() => getVehicles(userId));
    case 'websites':     return safe(() => getWebsiteLinks(userId));
    case 'music':        return safe(() => getMusic(userId));
    case 'movies':       return safe(() => getMoviesSeries(userId));
    case 'attachments':  return safe(() => getAttachments(userId));
    default:             return [];
  }
};

// ── Report builders per module ────────────────────────────────────────────────
const buildReport = (moduleKey, raw, start, end, opts) => {
  const today = todayStr();
  const { includeSummary=true, includeDetails=true, includeDates=true, includeCategories=true, includeNotes=true } = opts;

  switch (moduleKey) {

    case 'expenses': {
      const items = raw.filter(e => inRange(e.date||e.createdAt, start, end));
      const total = items.reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
      const catMap = {};
      items.forEach(e=>{ const c=e.category||'Other'; catMap[c]=(catMap[c]||0)+(parseFloat(e.amount)||0); });
      const categories = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).map(([c,a])=>({ category:c, amount:a }));
      const summary = { totalRecords:items.length, totalAmount:total, topCategory: categories[0]?.category||'N/A', categories };
      const details = includeDetails ? items.map(e=>({
        date: includeDates?fmtD(e.date):'', title:e.title||'', category:e.category||'',
        amount:fmtCur(e.amount), paymentMethod:e.paymentMethod||'', notes:includeNotes?e.description||'':''
      })) : [];
      return { summary, details, columns:['date','title','category','amount','paymentMethod','notes'] };
    }

    case 'workTasks':
    case 'tasks': {
      const items = raw.filter(t => inRange(t.createdAt||t.dueDate, start, end));
      const completed = items.filter(t=>t.completed||t.status==='completed').length;
      const overdue   = items.filter(t=>!t.completed&&t.dueDate&&t.dueDate<today).length;
      const summary   = { totalRecords:items.length, completed, pending:items.length-completed, overdue, completionPct: items.length>0?Math.round((completed/items.length)*100):0 };
      const details   = includeDetails ? items.map(t=>({
        date:includeDates?fmtD(t.createdAt):'', title:t.title||'', category:includeCategories?t.category||'':'',
        status:t.completed||t.status==='completed'?'Completed':'Pending', dueDate:includeDates?fmtD(t.dueDate):'',
        priority:t.priority||'', notes:includeNotes?t.description||'':''
      })) : [];
      return { summary, details, columns:['date','title','category','status','dueDate','priority','notes'] };
    }

    case 'bills': {
      const items = raw.filter(b => inRange(b.dueDate||b.createdAt, start, end));
      const paid  = items.filter(b=>b.paid).length;
      const unpaid= items.filter(b=>!b.paid).length;
      const overdue= items.filter(b=>!b.paid&&b.dueDate&&b.dueDate<today).length;
      const totalAmt = items.reduce((s,b)=>s+(parseFloat(b.amount)||0),0);
      const summary  = { totalRecords:items.length, paid, unpaid, overdue, totalAmount:totalAmt };
      const details  = includeDetails ? items.map(b=>({
        title:b.title||b.category||'', category:includeCategories?b.category||'':'',
        amount:fmtCur(b.amount), dueDate:includeDates?fmtD(b.dueDate):'',
        status:b.paid?'Paid':'Unpaid', notes:includeNotes?b.description||'':''
      })) : [];
      return { summary, details, columns:['title','category','amount','dueDate','status','notes'] };
    }

    case 'emis': {
      const items = raw.filter(e => inRange(e.nextDueDate||e.createdAt, start, end));
      const totalAmt = items.reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
      const summary  = { totalRecords:items.length, totalMonthlyAmount:totalAmt };
      const details  = includeDetails ? items.map(e=>({
        title:e.title||'EMI', lender:e.lender||'', amount:fmtCur(e.amount),
        nextDueDate:includeDates?fmtD(e.nextDueDate):'', notes:includeNotes?e.description||'':''
      })) : [];
      return { summary, details, columns:['title','lender','amount','nextDueDate','notes'] };
    }

    case 'goals': {
      const items = raw.filter(g => inRange(g.createdAt||g.targetDate, start, end));
      const completed= items.filter(g=>g.achieved||g.completed).length;
      const totalTarget= items.reduce((s,g)=>s+(parseFloat(g.targetAmount||g.target||0)),0);
      const totalSaved = items.reduce((s,g)=>s+(parseFloat(g.currentAmount||g.saved||g.current||0)),0);
      const summary  = { totalRecords:items.length, completed, active:items.length-completed, totalTarget, totalSaved };
      const details  = includeDetails ? items.map(g=>({
        title:g.title||'', category:includeCategories?g.category||'':'',
        target:fmtCur(g.targetAmount||g.target||0), saved:fmtCur(g.currentAmount||g.saved||g.current||0),
        pct: (g.targetAmount||g.target)>0?Math.round(((g.currentAmount||g.saved||g.current||0)/(g.targetAmount||g.target||1))*100)+'%':'0%',
        status:g.achieved||g.completed?'Achieved':'Active', targetDate:includeDates?fmtD(g.targetDate):''
      })) : [];
      return { summary, details, columns:['title','category','target','saved','pct','status','targetDate'] };
    }

    case 'khata': {
      const contacts = raw;
      const toReceive= contacts.reduce((s,c)=>s+Math.max(parseFloat(c.totalGiven||c.balance||0),0),0);
      const toPay    = contacts.reduce((s,c)=>s+Math.abs(Math.min(parseFloat(c.totalOwed||c.balance||0),0)),0);
      const summary  = { totalContacts:contacts.length, toReceive, toPay };
      const details  = includeDetails ? contacts.map(c=>({
        name:c.name||'', phone:c.phone||'', balance:fmtCur(c.totalGiven||c.balance||0),
        notes:includeNotes?c.notes||'':''
      })) : [];
      return { summary, details, columns:['name','phone','balance','notes'] };
    }

    case 'reminders': {
      const items  = raw.filter(r => inRange(r.date||r.createdAt, start, end));
      const done   = items.filter(r=>r.completed).length;
      const overdue= items.filter(r=>!r.completed&&r.date&&r.date<today).length;
      const summary= { totalRecords:items.length, completed:done, pending:items.length-done, overdue };
      const details= includeDetails ? items.map(r=>({
        title:r.title||'', date:includeDates?fmtD(r.date):'', time:r.time||'', repeat:r.repeat||'',
        priority:r.priority||'', status:r.completed?'Done':'Pending', notes:includeNotes?r.description||'':''
      })) : [];
      return { summary, details, columns:['title','date','time','repeat','priority','status','notes'] };
    }

    case 'calendar': {
      const items  = raw.filter(e => inRange(e.date||e.createdAt, start, end));
      const done   = items.filter(e=>e.completed).length;
      const summary= { totalRecords:items.length, completed:done, pending:items.length-done };
      const details= includeDetails ? items.map(e=>({
        title:e.title||'', date:includeDates?fmtD(e.date):'', time:e.time||'', category:includeCategories?e.category||'':'',
        repeat:e.repeat||'', status:e.completed?'Done':'Upcoming', notes:includeNotes?e.description||'':''
      })) : [];
      return { summary, details, columns:['title','date','time','category','repeat','status','notes'] };
    }

    case 'notes': {
      const items  = raw.filter(n => inRange(n.createdAt, start, end));
      const summary= { totalRecords:items.length };
      const details= includeDetails ? items.map(n=>({
        title:n.title||'Note', date:includeDates?fmtD(n.createdAt):'', category:includeCategories?n.category||'':'',
        content:includeNotes?String(n.content||'').slice(0,200):''
      })) : [];
      return { summary, details, columns:['title','date','category','content'] };
    }

    case 'vehicles': {
      const items  = raw;
      const summary= { totalRecords:items.length };
      const details= includeDetails ? items.map(v=>({
        name:v.name||`${v.make||''} ${v.model||''}`.trim(), type:v.type||'', plate:v.plateNumber||'',
        year:v.year||'', notes:includeNotes?v.notes||'':''
      })) : [];
      return { summary, details, columns:['name','type','plate','year','notes'] };
    }

    case 'shopping': {
      const totalItems  = raw.reduce((s,l)=>s+(l.items||[]).length,0);
      const pendingItems= raw.reduce((s,l)=>s+(l.items||[]).filter(i=>!i.checked&&!i.purchased).length,0);
      const summary= { totalLists:raw.length, totalItems, pendingItems };
      const details= includeDetails ? raw.flatMap(l=>(l.items||[]).map(i=>({
        list:l.name||'', item:i.name||'', quantity:i.quantity||'1', status:i.checked||i.purchased?'Done':'Pending'
      }))) : [];
      return { summary, details, columns:['list','item','quantity','status'] };
    }

    case 'websites': {
      const items  = raw.filter(w => inRange(w.createdAt, start, end));
      const summary= { totalRecords:items.length };
      const details= includeDetails ? items.map(w=>({
        name:w.name||'', url:w.url||'', category:includeCategories?w.category||'':'',
        date:includeDates?fmtD(w.createdAt):'', notes:includeNotes?w.description||'':''
      })) : [];
      return { summary, details, columns:['name','url','category','date','notes'] };
    }

    case 'music': {
      const summary= { totalRecords:raw.length };
      const details= includeDetails ? raw.map(m=>({
        title:m.title||'', artist:m.artist||'', album:m.album||'', genre:m.genre||''
      })) : [];
      return { summary, details, columns:['title','artist','album','genre'] };
    }

    case 'movies': {
      const items = raw.filter(m => inRange(m.createdAt, start, end));
      const watching = items.filter(m => m.status === 'Watching').length;
      const watched = items.filter(m => m.status === 'Watched').length;
      const wantToWatch = items.filter(m => m.status === 'Want to Watch').length;
      const summary = {
        totalRecords: items.length,
        moviesCount: items.filter(m => (m.type || 'Movie') === 'Movie').length,
        seriesCount: items.filter(m => m.type === 'Series').length,
        watching, watched, wantToWatch
      };
      const details = includeDetails ? items.map(m => ({
        title: m.title || '',
        type: m.type || 'Movie',
        status: m.status || 'Want to Watch',
        genre: includeCategories ? m.genre || '' : '',
        rating: m.rating ? `${m.rating}/5` : '',
        platform: m.platform || '',
        progress: m.type === 'Series' ? `S${m.currentSeason || 1} E${m.currentEpisode || 1}` : 'N/A',
        date: includeDates ? fmtD(m.createdAt) : '',
        notes: includeNotes ? m.notes || '' : ''
      })) : [];
      return { summary, details, columns: ['title', 'type', 'status', 'genre', 'rating', 'platform', 'progress', 'date', 'notes'] };
    }

    case 'attachments': {
      const items  = raw.filter(a => inRange(a.uploadedAt||a.createdAt, start, end));
      const summary= { totalRecords:items.length };
      const details= includeDetails ? items.map(a=>({
        name:a.name||'', module:a.module||'', type:a.type||'', size:a.size||'',
        date:includeDates?fmtD(a.uploadedAt||a.createdAt):''
      })) : [];
      return { summary, details, columns:['name','module','type','size','date'] };
    }

    case 'familyEvents': {
      const items  = raw.filter(e => inRange(e.date||e.createdAt, start, end));
      const summary= { totalRecords:items.length };
      const details= includeDetails ? items.map(e=>({
        title:e.title||'', date:includeDates?fmtD(e.date):'', type:e.type||'',
        location:e.location||'', notes:includeNotes?e.description||'':''
      })) : [];
      return { summary, details, columns:['title','date','type','location','notes'] };
    }

    case 'budget': {
      const b = Array.isArray(raw) ? raw[0] : raw;
      if (!b) return { summary:{ totalRecords:0 }, details:[], columns:[] };
      const summary= { budget:parseFloat(b.amount||b.total||0), period:b.period||b.month||'' };
      return { summary, details:[], columns:[] };
    }

    default:
      return { summary:{ totalRecords:0 }, details:[], columns:[] };
  }
};

// ── Main report generator ─────────────────────────────────────────────────────
export const generateReport = async (userId, moduleKey, range, custom={}, opts={}) => {
  const { start, end } = getRangeBounds(range, custom);
  const moduleDef = REPORT_MODULES.find(m => m.key === moduleKey);
  const raw = await fetchModule(userId, moduleKey);
  const report = buildReport(moduleKey, raw, start, end, opts);
  return {
    id: uuid(),
    moduleKey, moduleLabel: moduleDef?.label || moduleKey,
    range, start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10),
    generatedAt: new Date().toISOString(),
    ...report,
  };
};

// ── CSV export ────────────────────────────────────────────────────────────────
export const toCSV = (report) => {
  const { moduleLabel, range, start, end, generatedAt, summary, details, columns } = report;
  const lines = [];
  lines.push(`Report: ${moduleLabel}`);
  lines.push(`Period: ${range} (${start} to ${end})`);
  lines.push(`Generated: ${new Date(generatedAt).toLocaleString()}`);
  lines.push('');
  lines.push('--- SUMMARY ---');
  Object.entries(summary).forEach(([k,v]) => {
    if (typeof v !== 'object' || v === null) lines.push(`${k},${v}`);
  });
  if (details.length > 0) {
    lines.push('');
    lines.push('--- DETAILS ---');
    const cols = columns.filter(c => details[0] && c in details[0]);
    lines.push(cols.join(','));
    details.forEach(row => {
      lines.push(cols.map(c => `"${String(row[c]||'').replace(/"/g,'""')}"`).join(','));
    });
  }
  return lines.join('\n');
};

// ── JSON export ───────────────────────────────────────────────────────────────
export const toJSON = (report) => JSON.stringify(report, null, 2);

// ── HTML for PDF ─────────────────────────────────────────────────────────────
export const toHTML = (report) => {
  const { moduleLabel, range, start, end, generatedAt, summary, details, columns } = report;
  const summaryRows = Object.entries(summary)
    .filter(([,v]) => typeof v !== 'object' || v === null)
    .map(([k,v]) => `<tr><td><b>${k}</b></td><td>${v}</td></tr>`).join('');

  const cols = details.length > 0 ? columns.filter(c => c in details[0]) : [];
  const tableHeader = cols.map(c=>`<th>${c}</th>`).join('');
  const tableRows = details.map(row =>
    `<tr>${cols.map(c=>`<td>${row[c]??''}</td>`).join('')}</tr>`
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>${moduleLabel} Report</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:13px;color:#111;padding:24px}
    h1{font-size:20px;margin-bottom:4px}h2{font-size:14px;color:#555;font-weight:normal;margin:0 0 16px}
    h3{font-size:14px;margin:20px 0 8px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{background:#f0a500;color:#000;padding:8px;text-align:left;font-size:12px}
    td{padding:7px 8px;border-bottom:1px solid #eee;font-size:12px}
    tr:nth-child(even){background:#fafafa}
    .meta{color:#666;font-size:12px;margin-bottom:20px}
    @media print{body{padding:0}}
  </style></head><body>
  <h1>${moduleLabel} Report</h1>
  <h2>Period: ${range} &nbsp;|&nbsp; ${start} to ${end}</h2>
  <p class="meta">Generated: ${new Date(generatedAt).toLocaleString()}</p>
  <h3>Summary</h3>
  <table><tbody>${summaryRows}</tbody></table>
  ${details.length > 0 ? `<h3>Details (${details.length} records)</h3>
  <table><thead><tr>${tableHeader}</tr></thead><tbody>${tableRows}</tbody></table>` : ''}
  </body></html>`;
};

// ── Trigger download (web) ────────────────────────────────────────────────────
export const downloadOnWeb = (content, filename, mimeType) => {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch { return false; }
};

// ── Open print dialog for PDF (web) ──────────────────────────────────────────
export const printOnWeb = (html) => {
  try {
    const w = window.open('','_blank');
    if (!w) return false;
    w.document.write(html);
    w.document.close();
    w.onload = () => { w.print(); };
    return true;
  } catch { return false; }
};

// ── Native share (CSV/JSON) via expo-sharing ──────────────────────────────────
export const shareNative = async (content, filename) => {
  try {
    const FileSystem = require('expo-file-system');
    const Sharing    = require('expo-sharing');
    const path = FileSystem.cacheDirectory + filename;
    await FileSystem.writeAsStringAsync(path, content, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(path);
    return true;
  } catch { return false; }
};
