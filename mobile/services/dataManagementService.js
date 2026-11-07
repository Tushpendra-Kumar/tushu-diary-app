/**
 * dataManagementService.js
 * Central data-management service. Reads from existing module storage keys.
 * Never writes sensitive auth/PIN/token data to exports.
 * No new storage architecture — reuses tushu_${userId}_${type} pattern.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  getTasks, getNotes, getExpenses, getShoppingLists, getKhataContacts,
  getGoals, getVehicles, getBills, getEmis, getFamilyEvents, getPersonalEvents,
  getWebsiteLinks, getMusic, getWorkTasks, getSavings, getDocuments, getMedicines,
  getMoviesSeries
} from './personalDataService';
import { getReminders } from './reminderService';
import { getEvents }    from './calendarService';
import { getAttachments } from './attachmentService';
import { getReportHistory } from './reportService';
import { getBackupHistory } from './backupService';

// ── Activity log ─────────────────────────────────────────────────────────────
const ACTIVITY_KEY = (uid) => `tushu_dm_activity_${uid}`;
const uuidShort = () => Date.now().toString(36) + Math.random().toString(36).slice(2,5);

export const getActivity = async (uid) => {
  try { const d = await AsyncStorage.getItem(ACTIVITY_KEY(uid)); return d ? JSON.parse(d) : []; }
  catch { return []; }
};
const logActivity = async (uid, type, detail) => {
  const list = await getActivity(uid);
  const updated = [{ id: uuidShort(), type, detail, ts: Date.now() }, ...list].slice(0, 30);
  await AsyncStorage.setItem(ACTIVITY_KEY(uid), JSON.stringify(updated));
};

// ── Safe fetch wrapper ────────────────────────────────────────────────────────
const safe = async (fn, fb=[]) => { try { const r = await fn(); return r ?? fb; } catch { return fb; } };

// ── Module definitions ────────────────────────────────────────────────────────
// Sensitive modules excluded from export (wallet credentials, vault, auth)
const SENSITIVE_KEYS = new Set(['vault_credentials','wallet_records','wallet_history','wallet_recyclebin']);

export const DATA_MODULES = [
  { key:'tasks',         label:'Daily Planner',                fn: (uid)=>getTasks(uid)       },
  { key:'work_tasks',    label:'Work Tasks',                   fn: (uid)=>getWorkTasks(uid)   },
  { key:'notes',         label:'Quick Notes',                  fn: (uid)=>getNotes(uid)       },
  { key:'expenses',      label:'Expense Tracker',              fn: (uid)=>getExpenses(uid)    },
  { key:'shopping_lists',label:'Shopping List',                fn: (uid)=>getShoppingLists(uid)},
  { key:'khata',         label:'Khata Book',                   fn: (uid)=>getKhataContacts(uid)},
  { key:'goals',         label:'Goals & Savings',              fn: (uid)=>getGoals(uid)       },
  { key:'vehicles',      label:'Vehicle Manager',              fn: (uid)=>getVehicles(uid)    },
  { key:'bills',         label:'Bills & Payments',             fn: (uid)=>getBills(uid)       },
  { key:'emis',          label:'EMI Reminder',                 fn: (uid)=>getEmis(uid)        },
  { key:'family_events', label:'Family Events',                fn: (uid)=>getFamilyEvents(uid)},
  { key:'personal_events',label:'Personal Events',            fn: (uid)=>getPersonalEvents(uid)},
  { key:'website_links', label:'Advanced Website Manager',     fn: (uid)=>getWebsiteLinks(uid)},
  { key:'my_music',      label:'My Music — Advanced',          fn: (uid)=>getMusic(uid)       },
  { key:'movies_series', label:'Movies & Series',              fn: (uid)=>getMoviesSeries(uid)},
  { key:'reminders',     label:'Advanced Reminders',           fn: (uid)=>getReminders(uid)   },
  { key:'calendar',      label:'Advanced Calendar',            fn: (uid)=>getEvents(uid)      },
  { key:'attachments',   label:'Extra Storage & Attachments',  fn: (uid)=>getAttachments(uid) },
  { key:'savings',       label:'Savings Records',              fn: (uid)=>getSavings(uid)     },
  { key:'documents',     label:'Documents',                    fn: (uid)=>getDocuments(uid)   },
  { key:'medicines',     label:'Medicines',                    fn: (uid)=>getMedicines(uid)   },
];

// ── Compute overview & per-module stats ───────────────────────────────────────
export const computeDataOverview = async (userId) => {
  const results = await Promise.all(
    DATA_MODULES.map(async (m) => {
      const data = await safe(() => m.fn(userId));
      const arr  = Array.isArray(data) ? data : (data ? [data] : []);
      const count = arr.length;
      // find latest updatedAt or createdAt
      let latest = null;
      arr.forEach(item => {
        const ts = item.updatedAt || item.createdAt || item.date;
        if (ts && (!latest || ts > latest)) latest = ts;
      });
      // rough byte estimate
      let bytes = 0;
      try { bytes = JSON.stringify(arr).length; } catch {}
      return { ...m, count, latest, bytes };
    })
  );
  const totalRecords  = results.reduce((s, r) => s + r.count, 0);
  const activeModules = results.filter(r => r.count > 0).length;
  const totalBytes    = results.reduce((s, r) => s + r.bytes, 0);
  const latestAll     = results.map(r=>r.latest).filter(Boolean).sort().pop() || null;
  return { modules: results, totalRecords, activeModules, totalBytes, latestAll };
};

// ── Format bytes ──────────────────────────────────────────────────────────────
export const fmtBytes = (b) => {
  if (!b) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(2)} MB`;
};

// ── Format date ───────────────────────────────────────────────────────────────
export const fmtTs = (ts) => {
  if (!ts) return 'Never';
  const d = new Date(ts);
  if (isNaN(d)) return 'Never';
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? `Today, ${d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}`
    : d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
};

// ── Export all/selected ───────────────────────────────────────────────────────
export const exportData = async (userId, selectedKeys, format) => {
  const modules = DATA_MODULES.filter(m => selectedKeys.includes(m.key) && !SENSITIVE_KEYS.has(m.key));
  const bundle  = { exportedAt: new Date().toISOString(), userId: 'private', version: 1, modules: {} };
  for (const m of modules) {
    bundle.modules[m.key] = await safe(() => m.fn(userId));
  }

  let content = '';
  let filename = `tushu_export_${new Date().toISOString().slice(0,10)}`;

  if (format === 'JSON') {
    content  = JSON.stringify(bundle, null, 2);
    filename += '.json';
  } else {
    // CSV — one section per module
    const lines = [`# TushuDiary Data Export — ${bundle.exportedAt}`, ''];
    for (const [modKey, records] of Object.entries(bundle.modules)) {
      const label = DATA_MODULES.find(m=>m.key===modKey)?.label || modKey;
      lines.push(`## ${label}`);
      if (!Array.isArray(records) || records.length === 0) { lines.push('No data'); lines.push(''); continue; }
      const cols = [...new Set(records.flatMap(r=>Object.keys(r)))].filter(c=>!['id'].includes(c));
      lines.push(cols.join(','));
      records.forEach(r => lines.push(cols.map(c => `"${String(r[c]??'').replace(/"/g,'""')}"`).join(',')));
      lines.push('');
    }
    content  = lines.join('\n');
    filename += '.csv';
  }

  const mime = format === 'JSON' ? 'application/json' : 'text/csv';

  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([content], { type: mime });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      await logActivity(userId, 'export', `Exported ${modules.length} module(s) as ${format}`);
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  } else {
    try {
      const FileSystem = require('expo-file-system');
      const Sharing    = require('expo-sharing');
      const path = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(path, content, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path);
      await logActivity(userId, 'export', `Exported ${modules.length} module(s) as ${format}`);
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  }
};

// ── Import / restore ──────────────────────────────────────────────────────────
export const validateImportBundle = (json) => {
  try {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    if (!parsed || typeof parsed !== 'object') return { valid: false, error: 'Invalid JSON structure.' };
    if (!parsed.version || !parsed.modules) return { valid: false, error: 'Unsupported or missing version/modules field.' };
    if (typeof parsed.modules !== 'object') return { valid: false, error: 'Invalid modules field.' };
    const knownKeys = new Set(DATA_MODULES.map(m=>m.key));
    const found = Object.keys(parsed.modules).filter(k => knownKeys.has(k));
    if (found.length === 0) return { valid: false, error: 'No supported modules found in this export file.' };
    return { valid: true, parsed, found };
  } catch { return { valid: false, error: 'File could not be parsed. Make sure it is a valid JSON export.' }; }
};

// ── Storage key overrides for modules that use non-standard key patterns ──────
// personalDataService uses: tushu_${userId}_${modKey}
// But some services use their own key patterns:
const STORAGE_KEY_OVERRIDES = {
  reminders:   (uid) => `tushu_advanced_reminders_${uid}`,
  calendar:    (uid) => `tushu_calendar_events_${uid}`,
  attachments: (uid) => `tushu_attachments_${uid}`,
};
const getStorageKey = (userId, modKey) =>
  STORAGE_KEY_OVERRIDES[modKey]
    ? STORAGE_KEY_OVERRIDES[modKey](userId)
    : `tushu_${userId}_${modKey}`;

export const importData = async (userId, bundle, strategy) => {
  let imported = 0;
  let skipped  = 0;
  for (const [modKey, records] of Object.entries(bundle.modules)) {
    if (SENSITIVE_KEYS.has(modKey)) continue;
    if (!Array.isArray(records) || records.length === 0) continue;
    const storageKey = getStorageKey(userId, modKey);
    if (strategy === 'replace') {
      await AsyncStorage.setItem(storageKey, JSON.stringify(records));
      imported += records.length;
    } else {
      // 'add' — merge avoiding duplicate IDs
      let existing = [];
      try { const d = await AsyncStorage.getItem(storageKey); existing = d ? JSON.parse(d) : []; } catch {}
      const existingIds = new Set(existing.map(r => r.id));
      const toAdd = records.filter(r => r.id && !existingIds.has(r.id));
      skipped += records.length - toAdd.length;
      imported += toAdd.length;
      if (toAdd.length > 0) await AsyncStorage.setItem(storageKey, JSON.stringify([...existing, ...toAdd]));
    }
  }
  await logActivity(userId, 'import', `Imported ${imported} records (${skipped} duplicates skipped, strategy: ${strategy})`);
  return { success: true, imported, skipped };
};

const _buildImportFns = async () => ({
  importMerge: async (key, records) => records
});

// ── Clear specific module data ─────────────────────────────────────────────────
export const clearModuleData = async (userId, moduleKey) => {
  if (SENSITIVE_KEYS.has(moduleKey)) return { success: false, error: 'Cannot clear this module from here.' };
  const storageKey = `tushu_${userId}_${moduleKey}`;
  await AsyncStorage.removeItem(storageKey);
  const label = DATA_MODULES.find(m=>m.key===moduleKey)?.label || moduleKey;
  await logActivity(userId, 'clear', `Cleared all data from ${label}`);
  return { success: true };
};

// ── Backup summary (reads backupService) ─────────────────────────────────────
export const getBackupSummary = async (userId) => {
  try {
    const history = await getBackupHistory(userId);
    if (!history || history.length === 0) return null;
    const latest = history[0];
    return { count: history.length, latest, latestDate: latest.createdAt || latest.timestamp };
  } catch { return null; }
};
