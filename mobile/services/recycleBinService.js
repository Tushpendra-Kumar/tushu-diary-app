import AsyncStorage from '@react-native-async-storage/async-storage';

const _uuid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const getBinKey = (userId) => `tushu_${userId}_recycle_bin`;
const getActiveFilesKey = (userId) => `tushu_${userId}_files_mock`; // Future foundation for active files

// 30 days in milliseconds
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export const getRecycleBinItems = async (userId) => {
  try {
    const raw = await AsyncStorage.getItem(getBinKey(userId));
    let parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) parsed = [];

    // Auto-cleanup: Filter out items older than 30 days
    const now = Date.now();
    const validItems = parsed.filter(item => {
      const deletedTime = new Date(item.deletedAt).getTime();
      return (now - deletedTime) <= THIRTY_DAYS;
    });

    // If some items were cleaned up, save the updated list back to storage
    if (validItems.length !== parsed.length) {
      await AsyncStorage.setItem(getBinKey(userId), JSON.stringify(validItems));
      // In a real app, physical files of the expired items would be deleted here via backend API
    }

    return validItems;
  } catch { return []; }
};

export const moveToRecycleBin = async (userId, fileMetadata) => {
  // 1. Remove from active files
  try {
    const activeRaw = await AsyncStorage.getItem(getActiveFilesKey(userId));
    if (activeRaw) {
      const activeFiles = JSON.parse(activeRaw);
      const updatedActive = activeFiles.filter(f => f.id !== fileMetadata.id);
      await AsyncStorage.setItem(getActiveFilesKey(userId), JSON.stringify(updatedActive));
    }
  } catch (e) { console.warn(e); }

  // 2. Add to Recycle Bin
  const items = await getRecycleBinItems(userId);
  const deletedItem = {
    ...fileMetadata,
    binId: _uuid(),
    deletedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(getBinKey(userId), JSON.stringify([deletedItem, ...items]));
  return deletedItem;
};

export const restoreFromRecycleBin = async (userId, binId) => {
  const items = await getRecycleBinItems(userId);
  const itemToRestore = items.find(i => i.binId === binId);
  if (!itemToRestore) throw new Error("Item not found in Recycle Bin");

  // 1. Remove from Recycle Bin
  const updatedItems = items.filter(i => i.binId !== binId);
  await AsyncStorage.setItem(getBinKey(userId), JSON.stringify(updatedItems));

  // 2. Restore to Active Files
  try {
    const activeRaw = await AsyncStorage.getItem(getActiveFilesKey(userId));
    const activeFiles = activeRaw ? JSON.parse(activeRaw) : [];
    
    // Strip bin metadata
    const { binId: _b, deletedAt: _d, ...originalFile } = itemToRestore;
    
    await AsyncStorage.setItem(getActiveFilesKey(userId), JSON.stringify([originalFile, ...activeFiles]));
  } catch (e) { console.warn(e); }

  return itemToRestore;
};

export const deletePermanently = async (userId, binId) => {
  const items = await getRecycleBinItems(userId);
  const updatedItems = items.filter(i => i.binId !== binId);
  
  // 1. Physical file deletion logic (e.g. Firebase/AWS) would go here
  // e.g., await FirebaseStorage.ref(itemToDelete.storagePath).delete();

  // 2. Remove metadata from local Recycle Bin
  await AsyncStorage.setItem(getBinKey(userId), JSON.stringify(updatedItems));
};

// DEV ONLY: Helper to mock an active file and move it to recycle bin for testing
export const mockDeleteActiveFile = async (userId) => {
  const mockFile = {
    id: _uuid(),
    name: `IMG_${Math.floor(Math.random() * 10000)}.jpg`,
    type: 'image/jpeg',
    size: Math.floor(Math.random() * 5 + 1) + '.' + Math.floor(Math.random() * 9) + ' MB',
    originalLocation: 'Important Documents', // just a mock string
  };
  
  // Inject to active files first so we can simulate the full flow
  const activeRaw = await AsyncStorage.getItem(getActiveFilesKey(userId));
  const activeFiles = activeRaw ? JSON.parse(activeRaw) : [];
  await AsyncStorage.setItem(getActiveFilesKey(userId), JSON.stringify([mockFile, ...activeFiles]));

  // Now trigger the standard delete flow
  await moveToRecycleBin(userId, mockFile);
  return mockFile;
};
