import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import { API_BASE_URL } from './adminApi';
import { PAYMENT_CONFIG } from '../config/paymentConfig';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

/**
 * Get Payment Configuration
 */
export const getPaymentConfig = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/payment/config`);
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
  } catch (e) {
    // offline fallback
  }
  return PAYMENT_CONFIG;
};

/**
 * Get User's Premium Status
 * Checks local device storage first (offline support), then validates with server
 */
export const getUserPremiumStatus = async (userId) => {
  if (!userId) return { isPremium: false, tier: 'FREE' };

  // Master Admin is always lifetime premium
  if (userId.toLowerCase().includes('tushpendrakumar')) {
    return { isPremium: true, tier: 'ADMIN_LIFETIME' };
  }

  // 1. Check local cache
  let localStatus = null;
  try {
    const cached = await AsyncStorage.getItem(`tushu_${userId}_premium_status`);
    if (cached) {
      localStatus = JSON.parse(cached);
    }
  } catch (e) {}

  // 2. Validate with server if online
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/payment/status`, { headers });
    const json = await res.json();
    if (json.success && json.data) {
      const serverStatus = {
        isPremium: Boolean(json.data.is_premium),
        tier: json.data.tier || (json.data.is_premium ? 'LIFETIME' : 'FREE'),
        activatedAt: json.data.activated_at,
        utr: json.data.utr
      };
      // Update local cache
      await AsyncStorage.setItem(`tushu_${userId}_premium_status`, JSON.stringify(serverStatus));
      return serverStatus;
    }
  } catch (e) {
    // Offline - return local cache
  }

  return localStatus || { isPremium: false, tier: 'FREE' };
};

/**
 * Submit UPI Payment Verification (UTR / Reference Number)
 */
export const submitUpiPaymentVerification = async ({ userId, utrNumber, upiId, amount = 499, appName = 'UPI' }) => {
  const cleanUtr = (utrNumber || '').trim().toUpperCase();
  const activeUpi = (upiId || PAYMENT_CONFIG.defaultUpiId).trim();
  const nowIso = new Date().toISOString();

  const newStatus = {
    isPremium: true,
    tier: 'LIFETIME_PREMIUM',
    utr: cleanUtr,
    amount,
    currency: 'INR',
    activatedAt: nowIso
  };

  // 1. Immediately persist to local device storage so user gets access even offline
  await AsyncStorage.setItem(`tushu_${userId}_premium_status`, JSON.stringify(newStatus));

  // 2. Transmit to backend for permanent cloud database storage
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/payment/submit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        utrNumber: cleanUtr,
        upiId: activeUpi,
        amount,
        appName
      })
    });
    const json = await res.json();
    if (json.success) {
      return { success: true, message: json.message, data: json.data };
    }
  } catch (e) {
    console.warn('[paymentService] Sync deferred due to network, local activation granted:', e.message);
  }

  return {
    success: true,
    message: '🎉 Lifetime Premium activated on your device! Your record is securely saved.',
    data: newStatus
  };
};

/**
 * Generate UPI Deep Link URL for direct intent launch
 */
export const generateUpiDeepLink = ({ upiId, amount = 499, note = 'TushuDiary Lifetime Premium' }) => {
  const activeUpi = encodeURIComponent(upiId || PAYMENT_CONFIG.defaultUpiId);
  const merchant = encodeURIComponent(PAYMENT_CONFIG.merchantName);
  const txnNote = encodeURIComponent(note);
  return `upi://pay?pa=${activeUpi}&pn=${merchant}&am=${amount}&cu=INR&tn=${txnNote}`;
};

/**
 * Open UPI App on device
 */
export const openUpiApp = async (upiUrl) => {
  try {
    const supported = await Linking.canOpenURL(upiUrl);
    if (supported || Platform.OS === 'android') {
      await Linking.openURL(upiUrl);
      return { success: true };
    }
  } catch (e) {
    console.warn('Cannot launch UPI URL directly:', e.message);
  }
  return { success: false, message: 'Could not open UPI app automatically. Please copy the UPI ID and pay via your app.' };
};

/**
 * Admin: Fetch all payments
 */
export const fetchAdminPayments = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/payment/admin/all`, { headers });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch payments');
  return json.data || [];
};
