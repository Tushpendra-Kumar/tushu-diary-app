import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const BACKUP_HISTORY_KEY = (userId) => `tushu_backups_history_${userId}`;

// ─── Complete module-key coverage ─────────────────────────────────────────────
// Maps logical backup scope IDs to the AsyncStorage key substrings for that scope.
// Pattern: tushu_${userId}_${type}  OR  tushu_${userId}_${type}_*
const MODULE_KEY_PATTERNS = {
  'Tasks':          ['_tasks', '_work_tasks'],
  'Notes':          ['_notes'],
  'Finance':        ['_expenses', '_budget', '_bills', '_emis', '_goals', '_savings', '_khata'],
  'Shopping':       ['_shopping_lists'],
  'Vehicles':       ['_vehicles'],
  'Music':          ['_my_music', '_music_playlists'],
  'Websites':       ['_website_links'],
  'Entertainment':  ['_movies_series'],
  'Events':         ['_family_events', '_personal_events', '_birthdays'],
  'Reminders':      ['_reminders'],
  'Calendar':       ['_calendar_events'],
  'Attachments':    ['_attachments'],
  'Settings':       ['_personalization', '_backup_prefs'],
};

export const fetchAvailableDataScopes = () => [
  { id: 'Tasks',         label: 'Daily Planner & Work Tasks' },
  { id: 'Finance',       label: 'Finance (Expenses, Budget, Bills, Khata, Goals)' },
  { id: 'Notes',         label: 'Quick Notes' },
  { id: 'Shopping',      label: 'Shopping Lists' },
  { id: 'Vehicles',      label: 'Vehicle Manager' },
  { id: 'Entertainment', label: 'Movies & Series Tracker' },
  { id: 'Music',         label: 'My Music — Advanced' },
  { id: 'Websites',      label: 'Advanced Website Manager' },
  { id: 'Events',        label: 'Family Events & Calendar' },
  { id: 'Reminders',     label: 'Advanced Reminders' },
  { id: 'Attachments',   label: 'Extra Storage & Attachments' },
  { id: 'Settings',      label: 'App Settings & Preferences' },
];

export const getBackupHistory = async (userId) => {
  try {
    const data = await AsyncStorage.getItem(BACKUP_HISTORY_KEY(userId));
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('[BackupService] Error fetching backup history:', e);
  }
  return [];
};

const keyMatchesScope = (key, userId, scope) => {
  const patterns = MODULE_KEY_PATTERNS[scope] || [];
  return patterns.some(pattern => key.includes(`tushu_${userId}${pattern}`) || key.includes(`tushu_${userId}${pattern}`));
};

export const createLocalBackup = async (userId, selectedScopes) => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const payload = {};
    let sizeEstimate = 0;

    for (const key of allKeys) {
      // Hard exclusions — never backup sensitive auth/security keys
      if (
        key.includes('app_lock_pin') ||
        key.includes('auth_token') ||
        key.includes('session_token') ||
        key.includes('password') ||
        key.includes('wallet_records') ||   // Sensitive private wallet data excluded
        key.includes('wallet_recyclebin')
      ) continue;

      // Must belong to this user
      if (!key.includes(`tushu_${userId}_`)) continue;

      // Check if any selected scope matches this key
      let include = false;
      for (const scope of selectedScopes) {
        if (keyMatchesScope(key, userId, scope)) {
          include = true;
          break;
        }
      }

      if (include) {
        const val = await AsyncStorage.getItem(key);
        if (val) {
          payload[key] = val;
          sizeEstimate += val.length;
        }
      }
    }

    const backupData = {
      id: 'bkp_' + Date.now(),
      timestamp: Date.now(),
      sizeBytes: sizeEstimate,
      scopes: selectedScopes,
      scopeCount: selectedScopes.length,
      data: payload,
      version: 2,
    };

    const history = await getBackupHistory(userId);
    history.unshift({
      id: backupData.id,
      timestamp: backupData.timestamp,
      sizeBytes: backupData.sizeBytes,
      scopes: backupData.scopes,
      scopeCount: backupData.scopeCount,
    });

    // Keep up to 20 backups in history
    const trimmedHistory = history.slice(0, 20);

    await AsyncStorage.setItem(`tushu_backup_payload_${backupData.id}`, JSON.stringify(backupData));
    await AsyncStorage.setItem(BACKUP_HISTORY_KEY(userId), JSON.stringify(trimmedHistory));

    return backupData;
  } catch (e) {
    console.error('[BackupService] Error creating backup:', e);
    throw e;
  }
};

export const restoreLocalBackup = async (userId, backupId) => {
  try {
    if (!userId) throw new Error('User ID is required for secure restoration.');
    const history = await getBackupHistory(userId);
    const backupRecord = history.find(b => b.id === backupId);
    if (!backupRecord) {
      throw new Error('Unauthorized or backup does not belong to this account.');
    }

    const dataStr = await AsyncStorage.getItem(`tushu_backup_payload_${backupId}`);
    if (!dataStr) throw new Error('Backup payload not found. It may have been deleted or corrupted.');

    const backupObj = JSON.parse(dataStr);
    const { data } = backupObj;

    if (!data || typeof data !== 'object') throw new Error('Backup data is invalid or corrupted.');

    const userPrefix = `tushu_${userId}_`;

    // Strict validation: Restore only keys that belong to this userId and are safe
    for (const key of Object.keys(data)) {
      // Prevent cross-user data overwrite and privilege escalation
      if (!key.startsWith(userPrefix)) {
        console.warn(`[Security] Blocked restoration of foreign key: ${key}`);
        continue;
      }
      if (
        key.includes('app_lock_pin') ||
        key.includes('auth_token') ||
        key.includes('session_token') ||
        key.includes('password')
      ) {
        console.warn(`[Security] Blocked restoration of sensitive security key: ${key}`);
        continue;
      }
      await AsyncStorage.setItem(key, data[key]);
    }

    return true;
  } catch (e) {
    console.error('[BackupService] Error restoring backup:', e);
    throw e;
  }
};

export const exportBackupToFile = async (userId, backupId) => {
  try {
    const dataStr = await AsyncStorage.getItem(`tushu_backup_payload_${backupId}`);
    if (!dataStr) throw new Error('Backup payload not found.');

    if (Platform.OS === 'web') {
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tushu_Backup_${backupId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } else {
      const fileUri = FileSystem.documentDirectory + `Tushu_Backup_${backupId}.json`;
      await FileSystem.writeAsStringAsync(fileUri, dataStr, { encoding: FileSystem.EncodingType.UTF8 });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) await Sharing.shareAsync(fileUri);
      return true;
    }
  } catch (e) {
    console.error('[BackupService] Error exporting backup:', e);
    throw e;
  }
};

export const deleteBackup = async (userId, backupId) => {
  try {
    if (!userId) throw new Error('User ID is required.');
    const history = await getBackupHistory(userId);
    const backupExists = history.some(b => b.id === backupId);
    if (!backupExists) {
      throw new Error('Unauthorized: backup does not belong to your account.');
    }
    const newHistory = history.filter(b => b.id !== backupId);
    await AsyncStorage.setItem(BACKUP_HISTORY_KEY(userId), JSON.stringify(newHistory));
    await AsyncStorage.removeItem(`tushu_backup_payload_${backupId}`);
  } catch (e) {
    console.error('[BackupService] Error deleting backup:', e);
    throw e;
  }
};
