import { signInWithPopup } from 'firebase/auth';
import { 
  auth, 
  googleProvider, 
  appleProvider, 
  facebookProvider, 
  githubProvider 
} from '../config/firebase';
import { Alert, Platform } from 'react-native';

const PROVIDERS = {
  Google: googleProvider,
  Apple: appleProvider,
  Facebook: facebookProvider,
  GitHub: githubProvider,
};

/**
 * Executes secure OAuth sign-in using Firebase Authentication
 * @param {string} providerName - 'Google' | 'Apple' | 'Facebook' | 'GitHub'
 * @param {function} onTokenVerified - Callback from AuthContext (socialLogin(idToken))
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const performSocialAuth = async (providerName, onTokenVerified) => {
  const provider = PROVIDERS[providerName];

  if (!provider) {
    Alert.alert('Unsupported Provider', `${providerName} is not a supported authentication provider.`);
    return { success: false, message: 'Unsupported provider' };
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
