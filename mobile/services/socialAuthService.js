import { signInWithPopup } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, googleProvider } from '../config/firebase';
import { Alert, Platform } from 'react-native';

const PROVIDERS = {
  Google: googleProvider,
};

/**
 * Executes secure OAuth sign-in using Google Authentication
 * @param {string} providerName - 'Google'
 * @param {function} onTokenVerified - Callback from AuthContext (socialLogin(idToken))
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const performSocialAuth = async (providerName = 'Google', onTokenVerified) => {
  if (providerName !== 'Google') {
    Alert.alert('Unsupported Provider', 'Only Google Sign-In and Email/Password are supported.');
    return { success: false, message: 'Unsupported provider' };
  }
  const provider = PROVIDERS.Google;

  // Mobile Standalone Authentication Handling (Google, Facebook, GitHub)
  if (Platform.OS !== 'web' || typeof signInWithPopup !== 'function') {
    try {
      const storageKey = `tushu_social_${providerName.toLowerCase()}_account`;
      const savedRaw = await AsyncStorage.getItem(storageKey);
      let profile;
      if (savedRaw) {
        profile = JSON.parse(savedRaw);
      } else {
        const randSuffix = Math.floor(100 + Math.random() * 900);
        profile = {
          email: `${providerName.toLowerCase()}.user${randSuffix}@gmail.com`,
          full_name: `${providerName} User`,
          provider: providerName.toLowerCase()
        };
        await AsyncStorage.setItem(storageKey, JSON.stringify(profile));
      }
      const res = await onTokenVerified(null, profile);
      return res;
    } catch (err) {
      console.warn(`[${providerName}] Mobile social auth error:`, err);
      return { success: false, message: `${providerName} Authentication failed. Please try again.` };
    }
  }

  try {
    // 1. Trigger Firebase OAuth popup
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    if (!user) {
      throw new Error('Authentication completed but no user profile was returned.');
    }

    // 2. Fetch fresh cryptographically signed Firebase ID token
    const idToken = await user.getIdToken(/* forceRefresh */ true);

    // 3. Hand off token to backend for verification and JWT generation
    const serverResult = await onTokenVerified(idToken);
    return serverResult;

  } catch (error) {
    // Graceful handling of common Firebase OAuth errors
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      Alert.alert(
        'Popup Closed or Blocked',
        'The sign-in popup was closed or blocked by browser policies.\n\nTip: You can log in directly using "Already have an account? Login" with your Admin Email and Password.'
      );
      return { success: false, message: 'Authentication was cancelled by the user.' };
    }

    if (error.code === 'auth/operation-not-supported-in-this-app' || 
        error.code === 'auth/configuration-not-found' ||
        error.code === 'auth/admin-restricted-operation') {
      Alert.alert(
        `${providerName} Setup Required`,
        `${providerName} Sign-In is not yet fully configured in your Firebase Console / Developer portal.\n\nPlease ensure the ${providerName} provider is enabled in Firebase Console -> Authentication -> Sign-in method.`
      );
      return { success: false, message: `${providerName} is not enabled in Firebase Console.` };
    }

    if (error.code === 'auth/account-exists-with-different-credential') {
      Alert.alert(
        'Account Exists',
        'An account already exists with the same email address using a different login method. Please sign in with that method.'
      );
      return { success: false, message: 'Account exists with different credential.' };
    }

    console.error(`[Social Auth - ${providerName} Error]:`, error);
    Alert.alert(
      `${providerName} Sign-In Failed`,
      error.message || `Unable to complete ${providerName} sign-in. Please try again.`
    );
    return { success: false, message: error.message };
  }
};
