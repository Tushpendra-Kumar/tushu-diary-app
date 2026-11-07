import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import CryptoJS from 'crypto-js';

const STORAGE_PREFIX = 'tushu_app_lock_';
const isWeb = Platform.OS === 'web';

const setSecureItem = async (key, value) => {
  if (isWeb) {
    await AsyncStorage.setItem(STORAGE_PREFIX + key, value);
  } else {
    await SecureStore.setItemAsync(STORAGE_PREFIX + key, value);
  }
};

const getSecureItem = async (key) => {
  if (isWeb) {
    return await AsyncStorage.getItem(STORAGE_PREFIX + key);
  } else {
    return await SecureStore.getItemAsync(STORAGE_PREFIX + key);
  }
};

const deleteSecureItem = async (key) => {
  if (isWeb) {
    await AsyncStorage.removeItem(STORAGE_PREFIX + key);
  } else {
    await SecureStore.deleteItemAsync(STORAGE_PREFIX + key);
  }
};

// Cryptographic hash for PIN using SHA-256 + user salt
const hashPin = (userId, pin) => {
  return CryptoJS.SHA256(`tushu_salt_${userId}_${pin}`).toString();
};

export const getAppLockConfig = async (userId) => {
  try {
    const data = await getSecureItem(`config_${userId}`);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.log('Error reading App Lock config', e);
  }
  
  return {
    enabled: false,
    useBiometric: false,
    autoLockTimeout: 'immediately', // immediately, 1, 5, 15, never
    protectedModules: [],
    privacyControls: {
      hideAmounts: true,
      hideDetails: false
    }
  };
};

export const saveAppLockConfig = async (userId, config) => {
  await setSecureItem(`config_${userId}`, JSON.stringify(config));
};

export const verifyPin = async (userId, pin) => {
  const storedPin = await getSecureItem(`pin_${userId}`);
  if (!storedPin) return false;
  
  // Backwards compatibility check: if stored pin is plain text, verify and auto-migrate to hashed
  if (storedPin === pin) {
    await setSecureItem(`pin_${userId}`, hashPin(userId, pin));
    return true;
  }
  
  return storedPin === hashPin(userId, pin);
};

export const setPin = async (userId, pin) => {
  // Store hashed PIN with salt
  await setSecureItem(`pin_${userId}`, hashPin(userId, pin));
};

export const removePin = async (userId) => {
  await deleteSecureItem(`pin_${userId}`);
};

export const recordAppBackgroundTime = async () => {
  await AsyncStorage.setItem('app_background_time', Date.now().toString());
};

export const getAppBackgroundTime = async () => {
  const time = await AsyncStorage.getItem('app_background_time');
  return time ? parseInt(time, 10) : null;
};
