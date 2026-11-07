/**
 * PersonalDataService
 * AsyncStorage-based CRUD for personal user data:
 * tasks, notes, expenses, shopping lists, khata entries
 * All data is keyed by userId for isolation.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import * as notifService from './notificationService';

const key = (userId, type) => `tushu_${userId}_${type}`;
const sharedKey = (type) => `tushu_shared_${type}`;
const uuid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// â”€â”€â”€ Generic Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getAll = async (userId, type) => {
  try {
    const raw = await AsyncStorage.getItem(key(userId, type));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};
const saveAll = async (userId, type, items) => {
  await AsyncStorage.setItem(key(userId, type), JSON.stringify(items));
};
const getShared = async (type) => {
  try {
    const raw = await AsyncStorage.getItem(sharedKey(type));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};
const saveShared = async (type, items) => {
  await AsyncStorage.setItem(sharedKey(type), JSON.stringify(items));
};

// â”€â”€â”€ TASKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getTasks = (userId) => getAll(userId, 'tasks');

export const addTask = async (userId, task) => {
  const items = await getTasks(userId);
  const newItem = { id: uuid(), status: 'pending', createdAt: new Date().toISOString(), ...task };
  await saveAll(userId, 'tasks', [newItem, ...items]);
    notifService.scheduleTaskReminders(newItem);
    return newItem;
};

export const updateTask = async (userId, id, updates) => {
  const items = await getTasks(userId);
  const updated = items.map(t => t.id === id ? { ...t, ...updates } : t);
  await saveAll(userId, 'tasks', updated);
    const updatedTask = updated.find(t => t.id === id);
    if(updatedTask) notifService.scheduleTaskReminders(updatedTask);
};

export const deleteTask = async (userId, id) => {
  const items = await getTasks(userId);
  await saveAll(userId, 'tasks', items.filter(t => t.id !== id));
    notifService.cancelTaskReminders(id);
};

// â”€â”€â”€ NOTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getNotes = (userId) => getAll(userId, 'notes');

export const addNote = async (userId, note) => {
  const items = await getNotes(userId);
  const newItem = { id: uuid(), createdAt: new Date().toISOString(), ...note };
  await saveAll(userId, 'notes', [newItem, ...items]);
  return newItem;
};

export const updateNote = async (userId, id, updates) => {
  const items = await getNotes(userId);
  await saveAll(userId, 'notes', items.map(n => n.id === id ? { ...n, ...updates } : n));
};

export const deleteNote = async (userId, id) => {
  const items = await getNotes(userId);
  await saveAll(userId, 'notes', items.filter(n => n.id !== id));
};

// â”€â”€â”€ EXPENSES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getExpenses = (userId) => getAll(userId, 'expenses');

export const addExpense = async (userId, expense) => {
  const items = await getExpenses(userId);
  const newItem = { id: uuid(), createdAt: new Date().toISOString(), date: new Date().toISOString().split('T')[0], ...expense };
  await saveAll(userId, 'expenses', [newItem, ...items]);
  return newItem;
};

export const deleteExpense = async (userId, id) => { 
    const items = await getExpenses(userId); 
    await AsyncStorage.setItem(`tushu_${userId}_expenses`, JSON.stringify(items.filter(e => e.id !== id))); 
    await deleteKhataEntryBySource(userId, id);
  };

// â”€â”€â”€ SHOPPING LISTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getShoppingLists = (userId) => getAll(userId, 'shopping');

export const addShoppingList = async (userId, name) => {
  const lists = await getShoppingLists(userId);
  const newList = { id: uuid(), name, items: [], createdAt: new Date().toISOString() };
  await saveAll(userId, 'shopping', [newList, ...lists]);
  return newList;
};

export const updateShoppingList = async (userId, listId, updates) => {
  const lists = await getShoppingLists(userId);
  await saveAll(userId, 'shopping', lists.map(l => l.id === listId ? { ...l, ...updates } : l));
};

export const deleteShoppingList = async (userId, listId) => {
  const lists = await getShoppingLists(userId);
  await saveAll(userId, 'shopping', lists.filter(l => l.id !== listId));
};

export const addShoppingItem = async (userId, listId, text) => {
  const lists = await getShoppingLists(userId);
  const newItem = { id: uuid(), text, purchased: false };
  const updated = lists.map(l => l.id === listId ? { ...l, items: [...l.items, newItem] } : l);
  await saveAll(userId, 'shopping', updated);
};

export const toggleShoppingItem = async (userId, listId, itemId) => {
  const lists = await getShoppingLists(userId);
  const updated = lists.map(l => l.id === listId
    ? { ...l, items: l.items.map(i => i.id === itemId ? { ...i, purchased: !i.purchased } : i) }
    : l);
  await saveAll(userId, 'shopping', updated);
};


  export const updateShoppingItem = async (userId, listId, itemId, updates) => {
    const lists = await getShoppingLists(userId);
    const updated = lists.map(l => l.id === listId
      ? { ...l, items: l.items.map(i => i.id === itemId ? { ...i, ...updates } : i) }
      : l);
    await saveAll(userId, 'shopping', updated);
  };

  export const deleteShoppingItem = async (userId, listId, itemId) => {
  const lists = await getShoppingLists(userId);
  const updated = lists.map(l => l.id === listId
    ? { ...l, items: l.items.filter(i => i.id !== itemId) }
    : l);
  await saveAll(userId, 'shopping', updated);
};

// â”€â”€â”€ KHATA ENTRIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getKhataContacts = (userId) => getAll(userId, 'khata');

export const addKhataContact = async (userId, name) => {
  const contacts = await getKhataContacts(userId);
  const newContact = { id: uuid(), name, entries: [], createdAt: new Date().toISOString() };
  await saveAll(userId, 'khata', [newContact, ...contacts]);
  return newContact;
};

export const addKhataEntry = async (userId, contactId, entry) => {
  const contacts = await getKhataContacts(userId);
  const newEntry = { id: uuid(), date: new Date().toISOString().split('T')[0], ...entry };
  const updated = contacts.map(c => c.id === contactId
    ? { ...c, entries: [newEntry, ...c.entries] }
    : c);
  await saveAll(userId, 'khata', updated);
  notifService.scheduleKhataReminders(updated.find(c => c.id === contactId));
};

export const deleteKhataEntry = async (userId, contactId, entryId) => {
  const contacts = await getKhataContacts(userId);
  const updated = contacts.map(c => c.id === contactId
    ? { ...c, entries: c.entries.filter(e => e.id !== entryId) }
    : c);
  await saveAll(userId, 'khata', updated);
  notifService.scheduleKhataReminders(updated.find(c => c.id === contactId));
};

export const deleteKhataContact = async (userId, contactId) => {
  const contacts = await getKhataContacts(userId);
  await saveAll(userId, 'khata', contacts.filter(c => c.id !== contactId));
  notifService.cancelKhataReminders(contactId);
};

export const getKhataBalance = (contact) => {
  let balance = 0;
  for (const e of contact.entries) {
    balance += e.type === 'gave' ? -e.amount : e.amount; // gave = I gave them (they owe me), received = I received (I owe them)
  }
  return balance;
};

// ─── MONTHLY BUDGET ───────────────────────────────────────────
export const getBudget = async (userId, month) => {
  try {
    const raw = await AsyncStorage.getItem(`tushu_${userId}_budget_${month}`);
    return raw ? JSON.parse(raw) : { month, totalBudget: 0, expenses: [] };
  } catch { return { month, totalBudget: 0, expenses: [] }; }
};
export const saveBudget = async (userId, month, data) => {
  await AsyncStorage.setItem(`tushu_${userId}_budget_${month}`, JSON.stringify(data));
};

// ─── RECIPES ─────────────────────────────────────────────────
const _uuid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
export const getRecipes = async (userId) => { try { const r = await AsyncStorage.getItem(`tushu_${userId}_recipes`); return r ? JSON.parse(r) : []; } catch { return []; } };
export const addRecipe = async (userId, recipe) => { const items = await getRecipes(userId); const n = { id: _uuid(), createdAt: new Date().toISOString(), ...recipe }; await AsyncStorage.setItem(`tushu_${userId}_recipes`, JSON.stringify([n, ...items])); return n; };
export const updateRecipe = async (userId, id, updates) => { const items = await getRecipes(userId); await AsyncStorage.setItem(`tushu_${userId}_recipes`, JSON.stringify(items.map(r => r.id === id ? { ...r, ...updates } : r))); };
export const deleteRecipe = async (userId, id) => { const items = await getRecipes(userId); await AsyncStorage.setItem(`tushu_${userId}_recipes`, JSON.stringify(items.filter(r => r.id !== id))); };

// ─── MEDICINES ────────────────────────────────────────────────
export const getMedicines = async (userId) => { try { const r = await AsyncStorage.getItem(`tushu_${userId}_medicines`); return r ? JSON.parse(r) : []; } catch { return []; } };
export const addMedicine = async (userId, med) => { const items = await getMedicines(userId); const n = { id: _uuid(), createdAt: new Date().toISOString(), ...med }; await AsyncStorage.setItem(`tushu_${userId}_medicines`, JSON.stringify([n, ...items])); return n; };
export const updateMedicine = async (userId, id, updates) => { const items = await getMedicines(userId); await AsyncStorage.setItem(`tushu_${userId}_medicines`, JSON.stringify(items.map(m => m.id === id ? { ...m, ...updates } : m))); };
export const deleteMedicine = async (userId, id) => { const items = await getMedicines(userId); await AsyncStorage.setItem(`tushu_${userId}_medicines`, JSON.stringify(items.filter(m => m.id !== id))); };

// ─── DOCUMENTS ────────────────────────────────────────────────
export const getDocuments = async (userId) => { try { const r = await AsyncStorage.getItem(`tushu_${userId}_docs`); return r ? JSON.parse(r) : []; } catch { return []; } };
export const addDocument = async (userId, doc) => { const items = await getDocuments(userId); const n = { id: _uuid(), createdAt: new Date().toISOString(), ...doc }; await AsyncStorage.setItem(`tushu_${userId}_docs`, JSON.stringify([n, ...items])); return n; };
export const updateDocument = async (userId, id, updates) => { const items = await getDocuments(userId); await AsyncStorage.setItem(`tushu_${userId}_docs`, JSON.stringify(items.map(d => d.id === id ? { ...d, ...updates } : d))); };
export const deleteDocument = async (userId, id) => { const items = await getDocuments(userId); await AsyncStorage.setItem(`tushu_${userId}_docs`, JSON.stringify(items.filter(d => d.id !== id))); };

// ─── GOALS ────────────────────────────────────────────────────
export const getGoals = async (userId) => { try { const r = await AsyncStorage.getItem(`tushu_${userId}_goals`); return r ? JSON.parse(r) : []; } catch { return []; } };
export const addGoal = async (userId, goal) => { const items = await getGoals(userId); const n = { id: _uuid(), progress: 0, status: 'active', createdAt: new Date().toISOString(), ...goal }; await AsyncStorage.setItem(`tushu_${userId}_goals`, JSON.stringify([n, ...items])); return n; };
export const updateGoal = async (userId, id, updates) => { const items = await getGoals(userId); await AsyncStorage.setItem(`tushu_${userId}_goals`, JSON.stringify(items.map(g => g.id === id ? { ...g, ...updates } : g))); };
export const deleteGoal = async (userId, id) => { const items = await getGoals(userId); await AsyncStorage.setItem(`tushu_${userId}_goals`, JSON.stringify(items.filter(g => g.id !== id))); };

// ─── VEHICLES ─────────────────────────────────────────────────
export const getVehicles = async (userId) => { try { const r = await AsyncStorage.getItem(`tushu_${userId}_vehicles`); return r ? JSON.parse(r) : []; } catch { return []; } };
export const addVehicle = async (userId, v) => { const items = await getVehicles(userId); const n = { id: _uuid(), createdAt: new Date().toISOString(), ...v }; await AsyncStorage.setItem(`tushu_${userId}_vehicles`, JSON.stringify([n, ...items])); return n; };
export const updateVehicle = async (userId, id, updates) => { const items = await getVehicles(userId); await AsyncStorage.setItem(`tushu_${userId}_vehicles`, JSON.stringify(items.map(v => v.id === id ? { ...v, ...updates } : v))); };
export const deleteVehicle = async (userId, id) => { const items = await getVehicles(userId); await AsyncStorage.setItem(`tushu_${userId}_vehicles`, JSON.stringify(items.filter(v => v.id !== id))); };

// ─── BILLS ────────────────────────────────────────────────────
export const getBills = async (userId) => { try { const r = await AsyncStorage.getItem(`tushu_${userId}_bills`); return r ? JSON.parse(r) : []; } catch { return []; } };
export const addBill = async (userId, bill) => { const items = await getBills(userId); const n = { id: _uuid(), isPaid: false, createdAt: new Date().toISOString(), ...bill }; await AsyncStorage.setItem(`tushu_${userId}_bills`, JSON.stringify([n, ...items]));
  notifService.scheduleExpenseReminders(n);
  return n; };
export const updateBill = async (userId, id, updates) => { const items = await getBills(userId); await AsyncStorage.setItem(`tushu_${userId}_bills`, JSON.stringify(items.map(b => b.id === id ? { ...b, ...updates } : b)));
  const updatedBill = { ...items.find(b => b.id === id), ...updates };
  notifService.scheduleExpenseReminders(updatedBill); };
export const deleteBill = async (userId, id) => { const items = await getBills(userId); await AsyncStorage.setItem(`tushu_${userId}_bills`, JSON.stringify(items.filter(b => b.id !== id)));
  notifService.cancelExpenseReminders(id); };

// ─── EMI ──────────────────────────────────────────────────────
export const getEmis = async (userId) => { try { const r = await AsyncStorage.getItem(`tushu_${userId}_emis`); return r ? JSON.parse(r) : []; } catch { return []; } };
export const addEmi = async (userId, emi) => { const items = await getEmis(userId); const n = { id: _uuid(), status: 'active', createdAt: new Date().toISOString(), ...emi }; await AsyncStorage.setItem(`tushu_${userId}_emis`, JSON.stringify([n, ...items])); return n; };
export const updateEmi = async (userId, id, updates) => { const items = await getEmis(userId); await AsyncStorage.setItem(`tushu_${userId}_emis`, JSON.stringify(items.map(e => e.id === id ? { ...e, ...updates } : e))); };
export const deleteEmi = async (userId, id) => { const items = await getEmis(userId); await AsyncStorage.setItem(`tushu_${userId}_emis`, JSON.stringify(items.filter(e => e.id !== id))); };

// ─── SAVINGS ──────────────────────────────────────────────────
export const getSavings = async (userId) => { try { const r = await AsyncStorage.getItem(`tushu_${userId}_savings`); return r ? JSON.parse(r) : []; } catch { return []; } };
export const addSaving = async (userId, goal) => { const items = await getSavings(userId); const n = { id: _uuid(), saved: 0, createdAt: new Date().toISOString(), ...goal }; await AsyncStorage.setItem(`tushu_${userId}_savings`, JSON.stringify([n, ...items])); return n; };
export const updateSaving = async (userId, id, updates) => { const items = await getSavings(userId); await AsyncStorage.setItem(`tushu_${userId}_savings`, JSON.stringify(items.map(s => s.id === id ? { ...s, ...updates } : s))); };
export const deleteSaving = async (userId, id) => { const items = await getSavings(userId); await AsyncStorage.setItem(`tushu_${userId}_savings`, JSON.stringify(items.filter(s => s.id !== id))); };

// ─── SHARED: FAMILY EVENTS ────────────────────────────────────
export const getFamilyEvents = async () => { try { const r = await AsyncStorage.getItem('tushu_shared_fam_events'); return r ? JSON.parse(r) : []; } catch { return []; } };
export const addFamilyEvent = async (event) => { const items = await getFamilyEvents(); const n = { id: _uuid(), createdAt: new Date().toISOString(), ...event }; await AsyncStorage.setItem('tushu_shared_fam_events', JSON.stringify([n, ...items])); return n; };
export const updateFamilyEvent = async (id, updates) => { const items = await getFamilyEvents(); await AsyncStorage.setItem('tushu_shared_fam_events', JSON.stringify(items.map(e => e.id === id ? { ...e, ...updates } : e))); };
export const deleteFamilyEvent = async (id) => { const items = await getFamilyEvents(); await AsyncStorage.setItem('tushu_shared_fam_events', JSON.stringify(items.filter(e => e.id !== id))); 
  notifService.cancelFamilyEventReminders(id);
};

// ─── SHARED: NOTICES ──────────────────────────────────────────
export const getFamilyNotices = async () => { try { const r = await AsyncStorage.getItem('tushu_shared_fam_notices'); return r ? JSON.parse(r) : []; } catch { return []; } };
export const addFamilyNotice = async (notice) => { const items = await getFamilyNotices(); const n = { id: _uuid(), date: new Date().toISOString(), readBy: [], ...notice }; await AsyncStorage.setItem('tushu_shared_fam_notices', JSON.stringify([n, ...items])); return n; };
export const deleteFamilyNotice = async (id) => { const items = await getFamilyNotices(); await AsyncStorage.setItem('tushu_shared_fam_notices', JSON.stringify(items.filter(n => n.id !== id))); };
export const markNoticeRead = async (id, userId) => { const items = await getFamilyNotices(); await AsyncStorage.setItem('tushu_shared_fam_notices', JSON.stringify(items.map(n => n.id === id && !n.readBy.includes(userId) ? { ...n, readBy: [...n.readBy, userId] } : n))); };

// ─── SHARED: BIRTHDAYS 🎂 ────────────────────────────────────────
export const getBirthdays = async () => { try { const r = await AsyncStorage.getItem('tushu_shared_fam_birthdays_v2'); return r ? JSON.parse(r) : []; } catch { return []; } };
export const addBirthday = async (entry) => { const items = await getBirthdays(); const n = { id: _uuid(), ...entry }; await AsyncStorage.setItem('tushu_shared_fam_birthdays_v2', JSON.stringify([n, ...items]));
  notifService.scheduleBirthdayReminders(n);
  return n; };
export const deleteBirthday = async (id) => { const items = await getBirthdays(); await AsyncStorage.setItem('tushu_shared_fam_birthdays_v2', JSON.stringify(items.filter(b => b.id !== id)));
  notifService.cancelBirthdayReminders(id); };

// ==================== CATEGORIES ====================
export const getCategories = async (userId) => {
  try {
    const raw = await AsyncStorage.getItem(`tushu_${userId}_categories`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

export const addCategory = async (userId, categoryName) => {
  const items = await getCategories(userId);
  if (items.some(c => c.name.toLowerCase() === categoryName.toLowerCase())) {
    throw new Error('Category already exists');
  }
  const newItem = { id: _uuid(), name: categoryName, createdAt: new Date().toISOString() };
  await AsyncStorage.setItem(`tushu_${userId}_categories`, JSON.stringify([...items, newItem]));
  return newItem;
};

export const deleteCategory = async (userId, id) => {
  const items = await getCategories(userId);
  
  // Safe deletion check: Check if any budget expense uses this category.
  // We'd have to scan all months, but for simplicity, we just delete the category from the list.
  // The actual expense records won't be deleted, they will just show a deleted category name.
  
  await AsyncStorage.setItem(`tushu_${userId}_categories`, JSON.stringify(items.filter(c => c.id !== id)));
};

// ==================== MEDIA VAULT ====================
export const getVaultFiles = async (userId) => {
  try {
    const raw = await AsyncStorage.getItem(`tushu_${userId}_files_mock`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

export const addVaultFile = async (userId, fileData) => {
  const items = await getVaultFiles(userId);
  const newFile = { ...fileData, id: _uuid(), createdAt: new Date().toISOString() };
  await AsyncStorage.setItem(`tushu_${userId}_files_mock`, JSON.stringify([newFile, ...items]));
  return newFile;
};


// ==================== WORK TASKS ====================
export const getWorkTasks = (userId) => getAll(userId, 'work_tasks');
export const addWorkTask = async (userId, task) => {
  const items = await getWorkTasks(userId);
  const newItem = { id: _uuid(), createdAt: new Date().toISOString(), ...task };
  await saveAll(userId, 'work_tasks', [newItem, ...items]);
  return newItem;
};
export const updateWorkTask = async (userId, id, updates) => {
  const items = await getWorkTasks(userId);
  await saveAll(userId, 'work_tasks', items.map(t => t.id === id ? { ...t, ...updates } : t));
};
export const deleteWorkTask = async (userId, id) => {
  const items = await getWorkTasks(userId);
  await saveAll(userId, 'work_tasks', items.filter(t => t.id !== id));
};




export const updateKhataEntryBySource = async (userId, sourceId, updates) => {
  const contacts = await getKhataContacts(userId);
  let updated = false;
  const newContacts = contacts.map(c => {
    const entryIdx = c.entries.findIndex(e => e.sourceId === sourceId);
    if (entryIdx !== -1) {
      updated = true;
      const newEntries = [...c.entries];
      newEntries[entryIdx] = { ...newEntries[entryIdx], ...updates };
      return { ...c, entries: newEntries };
    }
    return c;
  });
  if (updated) await saveAll(userId, 'khata', newContacts);
};

export const deleteKhataEntryBySource = async (userId, sourceId) => {
  const contacts = await getKhataContacts(userId);
  let updated = false;
  const newContacts = contacts.map(c => {
    const originalLen = c.entries.length;
    const filtered = c.entries.filter(e => e.sourceId !== sourceId);
    if (filtered.length !== originalLen) updated = true;
    return { ...c, entries: filtered };
  });
  if (updated) await saveAll(userId, 'khata', newContacts);
};

// --- PERSONAL EVENTS (User-isolated, for personal workspace) ---
export const getPersonalEvents = (userId) => getAll(userId, 'personal_events');
export const addPersonalEvent = async (userId, event) => {
  const items = await getPersonalEvents(userId);
  const n = { id: uuid(), createdAt: new Date().toISOString(), ...event };
  await saveAll(userId, 'personal_events', [n, ...items]);
  return n;
};
export const updatePersonalEvent = async (userId, id, updates) => {
  const items = await getPersonalEvents(userId);
  await saveAll(userId, 'personal_events', items.map(e => e.id === id ? { ...e, ...updates } : e));
};
export const deletePersonalEvent = async (userId, id) => {
  const items = await getPersonalEvents(userId);
  await saveAll(userId, 'personal_events', items.filter(e => e.id !== id));
};


const ENCRYPTION_KEY = 'tushu_secure_vault_key_2026';

// ─── WEBSITE LINKS ──────────────────────────────────────────
export const getWebsiteLinks = (userId) => getAll(userId, 'website_links');
export const addWebsiteLink = async (userId, data) => {
  const items = await getWebsiteLinks(userId);
  const n = { id: uuid(), createdAt: new Date().toISOString(), ...data };
  await saveAll(userId, 'website_links', [n, ...items]);
  return n;
};
export const updateWebsiteLink = async (userId, id, updates) => {
  const items = await getWebsiteLinks(userId);
  await saveAll(userId, 'website_links', items.map(e => e.id === id ? { ...e, ...updates } : e));
};
export const deleteWebsiteLink = async (userId, id) => {
  const items = await getWebsiteLinks(userId);
  await saveAll(userId, 'website_links', items.filter(e => e.id !== id));
};

// ─── MY MUSIC ───────────────────────────────────────────────
export const getMusic = (userId) => getAll(userId, 'my_music');
export const addMusic = async (userId, data) => {
  const items = await getMusic(userId);
  const n = { id: uuid(), createdAt: new Date().toISOString(), ...data };
  await saveAll(userId, 'my_music', [n, ...items]);
  return n;
};
export const updateMusic = async (userId, id, updates) => {
  const items = await getMusic(userId);
  await saveAll(userId, 'my_music', items.map(e => e.id === id ? { ...e, ...updates } : e));
};
export const deleteMusic = async (userId, id) => {
  const items = await getMusic(userId);
  await saveAll(userId, 'my_music', items.filter(e => e.id !== id));
};

// ─── MOVIES & SERIES ─────────────────────────────────────────
export const getMoviesSeries = (userId) => getAll(userId, 'movies_series');
export const addMovieSeries = async (userId, data) => {
  const items = await getMoviesSeries(userId);
  const n = { id: uuid(), createdAt: new Date().toISOString(), ...data };
  await saveAll(userId, 'movies_series', [n, ...items]);
  return n;
};
export const updateMovieSeries = async (userId, id, updates) => {
  const items = await getMoviesSeries(userId);
  await saveAll(userId, 'movies_series', items.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e));
};
export const deleteMovieSeries = async (userId, id) => {
  const items = await getMoviesSeries(userId);
  await saveAll(userId, 'movies_series', items.filter(e => e.id !== id));
};

// ─── PASSWORD VAULT ─────────────────────────────────────────

export const getVaultCredentials = async (userId) => {
  const items = await getAll(userId, 'password_vault');
  return items.map(item => {
    try {
      const bytes = CryptoJS.AES.decrypt(item.password, ENCRYPTION_KEY + userId);
      const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
      return { ...item, password: decryptedPassword };
    } catch(e) {
      return item; // Fallback if decryption fails
    }
  });
};
export const addVaultCredential = async (userId, data) => {
  const items = await getAll(userId, 'password_vault'); // fetch raw encrypted items
  const encryptedPassword = CryptoJS.AES.encrypt(data.password, ENCRYPTION_KEY + userId).toString();
  const n = { id: uuid(), createdAt: new Date().toISOString(), ...data, password: encryptedPassword };
  await saveAll(userId, 'password_vault', [n, ...items]);
  return { ...n, password: data.password }; // Return decrypted for state
};
export const updateVaultCredential = async (userId, id, updates) => {
  const items = await getAll(userId, 'password_vault');
  const updatedItems = items.map(e => {
    if (e.id === id) {
      const newEntry = { ...e, ...updates };
      if (updates.password !== undefined) {
        newEntry.password = CryptoJS.AES.encrypt(updates.password, ENCRYPTION_KEY + userId).toString();
      }
      return newEntry;
    }
    return e;
  });
  await saveAll(userId, 'password_vault', updatedItems);
};
export const deleteVaultCredential = async (userId, id) => {
  const items = await getAll(userId, 'password_vault');
  await saveAll(userId, 'password_vault', items.filter(e => e.id !== id));
};


// ─── PRIVATE WALLET ────────────────────────────────────────────────────────────
export const getWalletRecords = async (userId, category) => {
  try {
    const data = await AsyncStorage.getItem(`tushu_${userId}_wallet_${category}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveWalletRecord = async (userId, category, record) => {
  const records = await getWalletRecords(userId, category);
  const newRecord = {
    id: _uuid(),
    createdAt: new Date().toISOString(),
    ...record
  };
  await AsyncStorage.setItem(`tushu_${userId}_wallet_${category}`, JSON.stringify([newRecord, ...records]));
  
  // Save to history
  await logWalletHistory(userId, `Added to ${category}`, record.amount || record.current_value || record.balance || 0);
  return newRecord;
};

export const updateWalletRecord = async (userId, category, id, updates) => {
  const records = await getWalletRecords(userId, category);
  const updated = records.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r);
  await AsyncStorage.setItem(`tushu_${userId}_wallet_${category}`, JSON.stringify(updated));
  
  await logWalletHistory(userId, `Updated record in ${category}`, updates.amount || updates.current_value || updates.balance || 0);
};

export const deleteWalletRecord = async (userId, category, id) => {
  const records = await getWalletRecords(userId, category);
  const recordToMove = records.find(r => r.id === id);
  const updated = records.filter(r => r.id !== id);
  await AsyncStorage.setItem(`tushu_${userId}_wallet_${category}`, JSON.stringify(updated));
  
  if (recordToMove) {
    const binData = await AsyncStorage.getItem(`tushu_${userId}_wallet_recycle_bin`);
    const bin = binData ? JSON.parse(binData) : [];
    bin.unshift({ ...recordToMove, category, deletedAt: new Date().toISOString() });
    await AsyncStorage.setItem(`tushu_${userId}_wallet_recycle_bin`, JSON.stringify(bin));
  }
  
  await logWalletHistory(userId, `Deleted record from ${category}`, 0, id, category);
};

export const getWalletRecycleBin = async (userId) => {
  try {
    const data = await AsyncStorage.getItem(`tushu_${userId}_wallet_recycle_bin`);
    let parsed = data ? JSON.parse(data) : [];
    if (!Array.isArray(parsed)) parsed = [];

    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    const validItems = parsed.filter(item => {
      if (!item.deletedAt) return false;
      const deletedTime = new Date(item.deletedAt).getTime();
      return (now - deletedTime) <= THIRTY_DAYS_MS;
    });

    if (validItems.length !== parsed.length) {
      await AsyncStorage.setItem(`tushu_${userId}_wallet_recycle_bin`, JSON.stringify(validItems));
    }

    return validItems;
  } catch (e) { return []; }
};

export const restoreWalletRecord = async (userId, id) => {
  const bin = await getWalletRecycleBin(userId);
  const record = bin.find(r => r.id === id);
  if (!record) return;
  
  const { category, deletedAt, ...originalRecord } = record;
  const records = await getWalletRecords(userId, category);
  records.unshift(originalRecord);
  await AsyncStorage.setItem(`tushu_${userId}_wallet_${category}`, JSON.stringify(records));
  
  const updatedBin = bin.filter(r => r.id !== id);
  await AsyncStorage.setItem(`tushu_${userId}_wallet_recycle_bin`, JSON.stringify(updatedBin));
  
  await logWalletHistory(userId, `Restored record in ${category}`, 0, id, category);
};

export const permanentDeleteWalletRecord = async (userId, id) => {
  const bin = await getWalletRecycleBin(userId);
  const updatedBin = bin.filter(r => r.id !== id);
  await AsyncStorage.setItem(`tushu_${userId}_wallet_recycle_bin`, JSON.stringify(updatedBin));
};

export const emptyWalletRecycleBin = async (userId) => {
  await AsyncStorage.setItem(`tushu_${userId}_wallet_recycle_bin`, JSON.stringify([]));
};

export const clearWalletHistory = async (userId) => {
  await AsyncStorage.setItem(`tushu_${userId}_wallet_history`, JSON.stringify([]));
};

export const getWalletHistory = async (userId) => {
  try {
    const data = await AsyncStorage.getItem(`tushu_${userId}_wallet_history`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};


export const logWalletHistory = async (userId, action, amount, recordId = null, category = null) => {
  const history = await getWalletHistory(userId);
  const newEntry = {
    id: _uuid(),
    date: new Date().toISOString(),
    action,
    amount,
    recordId,
    category
  };
  await AsyncStorage.setItem(`tushu_${userId}_wallet_history`, JSON.stringify([newEntry, ...history].slice(0, 50)));
};
