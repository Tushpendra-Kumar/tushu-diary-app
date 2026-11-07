/**
 * searchService.js
 * Centralized search engine for Advanced Search module.
 * Reads from all existing data sources and normalises to
 * a common SearchResult shape — no duplicate data, no separate DB.
 *
 * SearchResult shape:
 * { id, module, moduleKey, title, subtitle, detail, date, route, routeParams, sensitive }
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTasks, getNotes, getExpenses, getShoppingLists,
  getKhataContacts, getGoals, getVehicles, getBills, getEmis,
  getFamilyEvents, getWebsiteLinks, getMusic, getWorkTasks,
  getPersonalEvents, getMoviesSeries
} from './personalDataService';
import { getAttachments } from './attachmentService';
import { getReminders } from './reminderService';
import { getEvents } from './calendarService';

// ──────── SENSITIVE MODULES ────────
const SENSITIVE_MODULES = new Set(['Premium Private Wallet', 'Password Vault']);

// ──────── Module Key Constants (filter chips) ────────
export const MODULE_FILTER_MAP = {
  Tasks: ['Work Tasks', 'Daily Tasks'],
  Finance: ['Expenses', 'Goals & Savings', 'Khata Book', 'Bills & Payments', 'EMI Reminder'],
  Reminders: ['Advanced Reminders'],
  Calendar: ['Advanced Calendar'],
  Entertainment: ['Movies & Series', 'My Music', 'Website & Link Manager'],
  Notes: ['Quick Notes', 'Family Events', 'Personal Events'],
  Shopping: ['Shopping List'],
  Vehicle: ['Vehicle Manager'],
  Websites: ['Website & Link Manager'],
  Music: ['My Music'],
  Attachments: ['Attachments'],
  Other: ['All']
};

export const FILTER_TABS = [
  'All', 'Tasks', 'Finance', 'Reminders', 'Calendar', 'Entertainment',
  'Notes', 'Shopping', 'Vehicle', 'Websites', 'Music', 'Attachments'
];

// ──────── Text matching helper ────────
const matches = (query, ...fields) => {
  const q = query.toLowerCase();
  return fields.some(f => f && String(f).toLowerCase().includes(q));
};

// ──────── Normalise helpers ────────
const result = (module, id, title, subtitle, detail, date, route, routeParams = {}, sensitive = false) => ({
  id: `${module}_${id}`,
  module,
  moduleName: module,
  title: title || '',
  subtitle: subtitle || '',
  detail: detail || '',
  date: date || '',
  route,
  routeParams,
  sensitive
});

// ──────── Search all data sources ────────
export const searchAll = async (userId, query) => {
  if (!query || query.trim().length < 1) return [];
  const q = query.trim();
  const results = [];

  try {
    // Work Tasks
    const workTasks = await getWorkTasks(userId);
    workTasks.forEach(t => {
      if (matches(q, t.title, t.description, t.category, t.priority)) {
        results.push(result('Work Tasks', t.id, t.title, t.category || t.priority || 'Task',
          t.description, t.dueDate || t.createdAt, 'TaskManagerScreen', { taskId: t.id }));
      }
    });

    // Daily Tasks
    const tasks = await getTasks(userId);
    tasks.forEach(t => {
      if (matches(q, t.title, t.description, t.category)) {
        results.push(result('Daily Tasks', t.id, t.title, t.category || 'Task',
          t.description, t.createdAt, null, {}));
      }
    });

    // Quick Notes
    const notes = await getNotes(userId);
    notes.forEach(n => {
      if (matches(q, n.title, n.content, n.category)) {
        results.push(result('Quick Notes', n.id, n.title || 'Note',
          n.category || 'Note', n.content, n.createdAt, 'QuickNotesScreen', {}));
      }
    });

    // Expenses
    const expenses = await getExpenses(userId);
    expenses.forEach(e => {
      if (matches(q, e.title, e.category, e.description, e.amount, e.paymentMethod)) {
        results.push(result('Expenses', e.id, e.title || e.category,
          `₹${e.amount || 0} • ${e.category || ''}`, e.description, e.date, 'ExpenseTrackerScreen', {}));
      }
    });

    // Shopping Lists
    const lists = await getShoppingLists(userId);
    lists.forEach(l => {
      if (matches(q, l.name, l.category)) {
        results.push(result('Shopping List', l.id, l.name || 'Shopping List',
          `${l.items?.length || 0} items`, l.category, l.createdAt, null, {}));
      }
      // Also search items within list
      (l.items || []).forEach(item => {
        if (matches(q, item.name, item.category)) {
          results.push(result('Shopping List', l.id + '_' + (item.id || item.name), item.name,
            `in ${l.name}`, '', '', null, {}));
        }
      });
    });

    // Goals & Savings
    const goals = await getGoals(userId);
    goals.forEach(g => {
      if (matches(q, g.title, g.description, g.category)) {
        results.push(result('Goals & Savings', g.id, g.title || 'Goal',
          g.category || 'Goal', g.description, g.targetDate, null, {}));
      }
    });

    // Khata Book
    const khataContacts = await getKhataContacts(userId);
    khataContacts.forEach(c => {
      if (matches(q, c.name, c.phone, c.email, c.notes)) {
        results.push(result('Khata Book', c.id, c.name || 'Contact',
          c.phone || '', c.notes, c.createdAt, 'KhataBookScreen', { contactId: c.id }));
      }
    });

    // Bills & Payments
    const bills = await getBills(userId);
    bills.forEach(b => {
      if (matches(q, b.title, b.category, b.description, b.amount)) {
        results.push(result('Bills & Payments', b.id, b.title || b.category,
          `₹${b.amount || 0} • ${b.category || ''}`, b.description, b.dueDate, null, {}));
      }
    });

    // EMI Reminder
    const emis = await getEmis(userId);
    emis.forEach(e => {
      if (matches(q, e.title, e.lender, e.description, e.amount)) {
        results.push(result('EMI Reminder', e.id, e.title || 'EMI',
          `₹${e.amount || 0} • ${e.lender || ''}`, e.description, e.nextDueDate, null, {}));
      }
    });

    // Vehicle Manager
    const vehicles = await getVehicles(userId);
    vehicles.forEach(v => {
      if (matches(q, v.name, v.make, v.model, v.plateNumber, v.type, v.notes)) {
        results.push(result('Vehicle Manager', v.id, v.name || `${v.make} ${v.model}`,
          v.plateNumber || v.type || 'Vehicle', v.notes, v.createdAt, 'VehicleManagerScreen', {}));
      }
    });

    // Family Events
    const familyEvents = await getFamilyEvents(userId);
    familyEvents.forEach(ev => {
      if (matches(q, ev.title, ev.description, ev.location, ev.type)) {
        results.push(result('Family Events', ev.id, ev.title || 'Event',
          ev.type || 'Event', ev.description, ev.date, null, {}));
      }
    });

    // Personal Events
    const personalEvents = await getPersonalEvents(userId);
    personalEvents.forEach(ev => {
      if (matches(q, ev.title, ev.description, ev.location)) {
        results.push(result('Personal Events', ev.id, ev.title || 'Event',
          ev.location || 'Event', ev.description, ev.date, null, {}));
      }
    });

    // Website & Link Manager
    const websites = await getWebsiteLinks(userId);
    websites.forEach(w => {
      if (matches(q, w.name, w.url, w.category, w.description)) {
        results.push(result('Website & Link Manager', w.id, w.name || w.url,
          w.url || '', w.description, w.createdAt, null, {}));
      }
    });

    // My Music
    const music = await getMusic(userId);
    music.forEach(m => {
      if (matches(q, m.title, m.artist, m.album, m.genre)) {
        results.push(result('My Music', m.id, m.title || 'Track',
          `${m.artist || ''} ${m.album ? '• ' + m.album : ''}`, m.genre, m.createdAt, null, {}));
      }
    });

    // Advanced Reminders
    const reminders = await getReminders(userId);
    reminders.forEach(r => {
      if (matches(q, r.title, r.description, r.repeat, r.priority)) {
        results.push(result('Advanced Reminders', r.id, r.title,
          `${r.priority} • ${r.repeat}`, r.description, r.date, 'AdvancedReminders', {}));
      }
    });

    // Advanced Calendar
    const calEvents = await getEvents(userId);
    calEvents.forEach(ev => {
      if (matches(q, ev.title, ev.description, ev.category, ev.repeat)) {
        results.push(result('Advanced Calendar', ev.id, ev.title,
          `${ev.category || ''} • ${ev.date}`, ev.description, ev.date, 'AdvancedCalendar', {}));
      }
    });

    // Attachments (non-sensitive only)
    const attachments = await getAttachments(userId);
    attachments.forEach(a => {
      if (matches(q, a.name, a.description, a.module)) {
        results.push(result('Attachments', a.id, a.name,
          `${a.module} • ${a.type}`, a.description, a.uploadedAt, 'ExtraStorage', {}));
      }
    });

    // Movies & Series
    const moviesSeries = await getMoviesSeries(userId);
    moviesSeries.forEach(m => {
      if (matches(q, m.title, m.genre, m.platform, m.language, m.director, m.cast, m.notes, m.type, m.status)) {
        const sub = `${m.type || 'Movie'} • ${m.status || 'Want to Watch'}${m.type === 'Series' && m.currentSeason ? ` • S${m.currentSeason}E${m.currentEpisode || 1}` : ''}${m.rating ? ` • ${m.rating}★` : ''}`;
        results.push(result('Movies & Series', m.id, m.title, sub, m.notes || m.genre || '', m.createdAt, 'MoviesSeries', { itemId: m.id }));
      }
    });

  } catch (e) {
    // Fail silently — partial results still returned
  }

  // De-duplicate by unique result id
  const seen = new Set();
  return results.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
};

// ──────── Recent Searches ────────
const RECENT_KEY = 'tushu_search_recents_';
const MAX_RECENTS = 10;

export const getRecentSearches = async (userId) => {
  try {
    const data = await AsyncStorage.getItem(RECENT_KEY + userId);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export const saveRecentSearch = async (userId, query) => {
  if (!query || query.trim().length < 2) return;
  const recents = await getRecentSearches(userId);
  const updated = [query.trim(), ...recents.filter(r => r !== query.trim())].slice(0, MAX_RECENTS);
  await AsyncStorage.setItem(RECENT_KEY + userId, JSON.stringify(updated));
};

export const clearRecentSearches = async (userId) => {
  await AsyncStorage.removeItem(RECENT_KEY + userId);
};

// ──────── Apply filter tab to results ────────
export const filterResults = (results, filterTab) => {
  if (filterTab === 'All') return results;
  const allowed = MODULE_FILTER_MAP[filterTab] || [];
  if (allowed.includes('All')) return results;
  return results.filter(r => allowed.includes(r.module));
};
