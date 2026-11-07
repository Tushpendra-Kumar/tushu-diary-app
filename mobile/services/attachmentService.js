import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ATTACHMENTS_KEY = 'tushu_attachments_';
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB local limit

export const SUPPORTED_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  documents: ['application/pdf', 'text/plain']
};

export const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.txt'];

export const MODULES = [
  'General / Personal',
  'Expense Tracker',
  'Work Tasks',
  'Vehicle Manager',
  'Bills & Payments',
  'EMI Reminder',
  'Goals & Savings',
  'Quick Notes',
  'Family Events',
  'Khata Book',
  'Website & Link Manager',
  'My Music',
  'Premium Private Wallet'
];

export const getAttachments = async (userId) => {
  try {
    const data = await AsyncStorage.getItem(ATTACHMENTS_KEY + userId);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return [];
};

export const saveAttachments = async (userId, attachments) => {
  try {
    await AsyncStorage.setItem(ATTACHMENTS_KEY + userId, JSON.stringify(attachments));
    return true;
  } catch (e) {
    return false;
  }
};

export const addAttachment = async (userId, fileData) => {
  const attachments = await getAttachments(userId);

  // Check file size
  if (fileData.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File is too large. Maximum allowed size is 20 MB. Your file is ${formatBytes(fileData.size)}.`);
  }

  // Check supported type
  const ext = ('.' + fileData.name.split('.').pop()).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported file type (${ext}). Supported: JPG, PNG, WEBP, PDF, TXT.`);
  }

  // Check duplicates by name + size
  const duplicate = attachments.find(a => a.name === fileData.name && a.size === fileData.size);
  if (duplicate) {
    throw new Error('DUPLICATE');
  }

  const newAttachment = {
    id: 'att_' + Date.now() + '_' + Math.floor(Math.random() * 9999),
    name: fileData.name,
    originalName: fileData.name,
    type: fileData.type || 'application/octet-stream',
    size: fileData.size,
    uri: fileData.uri || null,
    base64: fileData.base64 || null,
    module: fileData.module || 'General / Personal',
    description: fileData.description || '',
    uploadedAt: Date.now()
  };

  attachments.unshift(newAttachment);
  await saveAttachments(userId, attachments);
  return newAttachment;
};

export const updateAttachment = async (userId, attachmentId, updates) => {
  const attachments = await getAttachments(userId);
  const idx = attachments.findIndex(a => a.id === attachmentId);
  if (idx === -1) throw new Error('Attachment not found');
  attachments[idx] = { ...attachments[idx], ...updates };
  await saveAttachments(userId, attachments);
  return attachments[idx];
};

export const deleteAttachment = async (userId, attachmentId) => {
  const attachments = await getAttachments(userId);
  const newList = attachments.filter(a => a.id !== attachmentId);
  await saveAttachments(userId, newList);
};

export const getStorageStats = async (userId) => {
  const attachments = await getAttachments(userId);
  const totalSize = attachments.reduce((acc, a) => acc + (a.size || 0), 0);
  const imageCount = attachments.filter(a => a.type && a.type.startsWith('image/')).length;
  const docCount = attachments.filter(a => !a.type || !a.type.startsWith('image/')).length;
  return {
    totalFiles: attachments.length,
    totalSize,
    imageCount,
    docCount
  };
};

export const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const pickFile = async () => {
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.jpg,.jpeg,.png,.webp,.pdf,.txt';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
          resolve({
            name: file.name,
            type: file.type,
            size: file.size,
            uri: ev.target.result,
            base64: null
          });
        };
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }
  // Native: use expo-document-picker (if available)
  try {
    const DocumentPicker = require('expo-document-picker');
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'],
      copyToCacheDirectory: true
    });
    if (result.canceled || !result.assets || result.assets.length === 0) return null;
    const asset = result.assets[0];
    return {
      name: asset.name,
      type: asset.mimeType || 'application/octet-stream',
      size: asset.size || 0,
      uri: asset.uri,
      base64: null
    };
  } catch (e) {
    throw new Error('File picker not available on this platform.');
  }
};
