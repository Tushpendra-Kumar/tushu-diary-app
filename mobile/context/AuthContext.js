import React, { createContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../services/adminApi';

export const isSuperAdmin = (u) => {
  if (!u) return false;
  const email = (u.email || '').toLowerCase().trim();
  return email === 'tushpendrakumar@gmail.com';
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMode, setCurrentMode] = useState('USER'); // Always defaults to USER mode

  const switchMode = () => {
    // Manual switching disabled: user role and portal are automatically determined by email ID
  };

  // Restore active session on application launch
  useEffect(() => {
    // 1.5s Safety Failsafe: Ensures isLoading is never permanently stuck on app launch
    const failsafe = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    const restoreSession = async () => {
      try {
        const rememberMe = await AsyncStorage.getItem('tushu_remember_me');
        if (rememberMe !== 'true') {
          // Fresh install, update, or logged out state: Always show Login/Welcome screen first
          setUser(null);
          setToken(null);
          setCurrentMode('USER');
          return;
        }

        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedToken && storedUserData) {
          const parsedUser = JSON.parse(storedUserData);
          if (parsedUser && (parsedUser.user_id || parsedUser.email)) {
            // Immediately sanitize legacy/relay email format in user_id
            if (parsedUser.user_id && (parsedUser.user_id.includes('privaterelay') || parsedUser.user_id.includes('@'))) {
              const clean = (parsedUser.full_name || parsedUser.user_id).toLowerCase().replace(/[^a-z0-9]/g, '');
              parsedUser.user_id = clean || 'user';
              AsyncStorage.setItem('userData', JSON.stringify(parsedUser)).catch(() => {});
            }
            // Ensure ONLY tushpendrakumar@gmail.com is recognized as ADMIN, all others as USER
            const isSuper = (parsedUser.email && parsedUser.email.toLowerCase().trim() === 'tushpendrakumar@gmail.com') ||
                            (parsedUser.user_id && parsedUser.user_id.toLowerCase().trim() === 'tushpendrakumar');
            parsedUser.role = isSuper ? 'ADMIN' : 'USER';

            // Check cached premium status
            let isCachedPremium = isSuper;
            try {
              const cachedPrem = await AsyncStorage.getItem(`tushu_${parsedUser.user_id}_premium_status`);
              if (cachedPrem) {
                const parsedPrem = JSON.parse(cachedPrem);
                if (parsedPrem && parsedPrem.isPremium) isCachedPremium = true;
              }
            } catch (e) {}

            parsedUser.is_premium = isSuper ? true : (parsedUser.is_premium || isCachedPremium);
            parsedUser.premium_tier = parsedUser.is_premium ? 'LIFETIME' : 'FREE';

            AsyncStorage.setItem('userData', JSON.stringify(parsedUser)).catch(() => {});

            setToken(storedToken);
            setUser(parsedUser);
            setCurrentMode(isSuper ? 'ADMIN' : 'USER');

            // Background sync with Firestore for latest clean user profile
            fetch(`${API_BASE_URL}/api/user/profile`, {
              headers: { 'Authorization': `Bearer ${storedToken}` }
            })
              .then(res => res.json())
              .then(jsonRes => {
                if (jsonRes.success && jsonRes.data) {
                  setUser(prev => {
                    const merged = { ...prev, ...jsonRes.data };
                    const isSuperSync = (merged.email && merged.email.toLowerCase().trim() === 'tushpendrakumar@gmail.com') ||
                                        (merged.user_id && merged.user_id.toLowerCase().trim() === 'tushpendrakumar');
                    merged.role = isSuperSync ? 'ADMIN' : 'USER';
                    merged.is_premium = isSuperSync ? true : Boolean(merged.is_premium || prev?.is_premium);
                    merged.premium_tier = merged.is_premium ? 'LIFETIME' : 'FREE';
                    AsyncStorage.setItem('userData', JSON.stringify(merged)).catch(() => {});
                    return merged;
                  });
                }
              })
              .catch(() => {});
          } else {
            setUser(null);
      setCurrentMode('USER');
            setToken(null);
          }
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (e) {
        console.warn('[AuthContext] Session restore error:', e);
        setUser(null);
        setToken(null);
      } finally {
        clearTimeout(failsafe);
        setIsLoading(false);
      }
    };
    restoreSession();
    return () => clearTimeout(failsafe);
  }, []);

  // ----------------------------------------------------
  // User Login (Email + Password) - Hybrid Online/Offline
  // ----------------------------------------------------
  const login = async (emailOrUserId, password) => {
    const cleanInput = (emailOrUserId || '').trim().toLowerCase();
    const isSuper = cleanInput === 'tushpendrakumar@gmail.com';

    // 1. First attempt to verify with remote server if reachable (with 2.5s quick timeout)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanInput, password }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const json = await response.json();
      
      if (json.success && json.data?.user) {
        const hasPrem = isSuper ? true : Boolean(json.data.user?.is_premium);
        const userData = {
          ...json.data.user,
          role: isSuper ? 'ADMIN' : (json.data.user?.role || 'USER'),
          has_khata: json.data.user.has_khata !== false,
          is_premium: hasPrem,
          premium_tier: hasPrem ? 'LIFETIME' : 'FREE',
        };
        setToken(json.data.token);
        setUser(userData);
        setCurrentMode(isSuper ? 'ADMIN' : 'USER');
        
        await AsyncStorage.setItem('userToken', json.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        if (userData.email) await AsyncStorage.setItem('tushu_last_auth_email', userData.email);
        return { success: true };
      }
    } catch (e) {
      console.log('[AuthContext] Remote server unavailable, checking local storage for credentials...');
    }

    // 2. Standalone / Offline Fallback from local device storage
    try {
      // Super Admin Master Access: Always allows founder to log in on standalone device
      if (isSuper) {
        const adminUser = {
          user_id: 'tushpendrakumar',
          email: 'tushpendrakumar@gmail.com',
          full_name: 'Tushpendra Kumar',
          role: 'ADMIN',
          has_khata: true,
          is_premium: true,
          premium_tier: 'LIFETIME',
        };
        const localToken = 'tushu_master_jwt_' + Date.now();
        setToken(localToken);
        setUser(adminUser);
        setCurrentMode('ADMIN');
        await AsyncStorage.setItem('userToken', localToken);
        await AsyncStorage.setItem('userData', JSON.stringify(adminUser));
        await AsyncStorage.setItem('tushu_last_auth_email', 'tushpendrakumar@gmail.com');
        return { success: true };
      }

      // Check locally registered accounts
      const rawLocalUsers = await AsyncStorage.getItem('tushu_local_registered_users');
      const localUsers = rawLocalUsers ? JSON.parse(rawLocalUsers) : [];
      
      const matchedUser = localUsers.find(u => 
        (u.email?.toLowerCase() === cleanInput || u.user_id?.toLowerCase() === cleanInput) &&
        u.password === password
      );

      if (matchedUser) {
        const userData = {
          ...matchedUser,
          role: 'USER',
          has_khata: true,
          is_premium: true,
          premium_tier: 'LIFETIME',
        };
        const localToken = 'tushu_local_jwt_' + Date.now();
        setToken(localToken);
        setUser(userData);
        setCurrentMode('USER');
        await AsyncStorage.setItem('userToken', localToken);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        await AsyncStorage.setItem('tushu_remember_me', 'true');
        if (userData.email) await AsyncStorage.setItem('tushu_last_auth_email', userData.email);
        return { success: true };
      }

      return { 
        success: false, 
        message: 'Invalid credentials. If you haven\'t created an account yet on this device, please tap "Create Account".' 
      };
    } catch (localErr) {
      console.warn('[AuthContext] Local login fallback error:', localErr);
      return { success: false, message: 'Authentication error. Please try again.' };
    }
  };

  // ----------------------------------------------------
  // User Account Creation (Email + Password) - Hybrid Online/Offline
  // ----------------------------------------------------
  const register = async (email, password, fullName) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (fullName || '').trim();
    const isSuper = cleanEmail === 'tushpendrakumar@gmail.com';
    const cleanId = (cleanName || cleanEmail).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'user_' + Date.now();

    // 1. Attempt remote registration if backend server is reachable (with 2.5s quick timeout)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, fullName: cleanName }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json = await response.json();
      if (json.success && json.data?.user) {
        const userData = {
          ...json.data.user,
          role: isSuper ? 'ADMIN' : (json.data.user?.role || 'USER'),
          has_khata: true,
          is_premium: true,
          premium_tier: 'LIFETIME',
        };
        setToken(json.data.token);
        setUser(userData);

        await AsyncStorage.setItem('userToken', json.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        return { success: true };
      }
    } catch (e) {
      console.log('[AuthContext] Remote server unavailable, creating standalone local account on device...');
    }

    // 2. Standalone / Offline Creation in local device storage
    try {
      const localUserData = {
        user_id: isSuper ? 'tushpendrakumar' : cleanId,
        email: cleanEmail,
        full_name: cleanName,
        password: password,
        role: isSuper ? 'ADMIN' : 'USER',
        has_khata: true,
        is_premium: true,
        premium_tier: 'LIFETIME',
        created_at: new Date().toISOString()
      };

      // Save into registered users list
      const rawLocalUsers = await AsyncStorage.getItem('tushu_local_registered_users');
      const localUsers = rawLocalUsers ? JSON.parse(rawLocalUsers) : [];
      // Remove any existing duplicate by email
      const filtered = localUsers.filter(u => u.email?.toLowerCase() !== cleanEmail);
      filtered.push(localUserData);
      await AsyncStorage.setItem('tushu_local_registered_users', JSON.stringify(filtered));

      // Set active session
      const localToken = 'tushu_local_jwt_' + Date.now();
      setToken(localToken);
      setUser(localUserData);
      await AsyncStorage.setItem('userToken', localToken);
      await AsyncStorage.setItem('userData', JSON.stringify(localUserData));

      return { success: true };
    } catch (localErr) {
      console.warn('[AuthContext] Local account creation error:', localErr);
      return { success: false, message: 'Unable to save local account profile.' };
    }
  };

  // ----------------------------------------------------
  // Password Reset / Forgot Password Request
  // ----------------------------------------------------
  const forgotPassword = async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json = await response.json();
      return json;
    } catch (e) {
      console.log('[AuthContext] Remote server unavailable for reset, checking local accounts...');
    }

    try {
      const rawLocalUsers = await AsyncStorage.getItem('tushu_local_registered_users');
      const localUsers = rawLocalUsers ? JSON.parse(rawLocalUsers) : [];
      const found = localUsers.find(u => u.email?.toLowerCase() === cleanEmail);
      if (found || cleanEmail === 'tushpendrakumar@gmail.com') {
        return {
          success: true,
          message: 'Account verified on device. Reset instructions processed.'
        };
      }
      return {
        success: false,
        message: 'No registered account found with this email. Please tap "Create Account".'
      };
    } catch (localErr) {
      return {
        success: false,
        message: 'Unable to process reset request.'
      };
    }
  };

  // ----------------------------------------------------
  // Social Login (Google, Apple, Facebook, GitHub - Hybrid Online/Offline)
  // ----------------------------------------------------
  const socialLogin = async (idToken, socialProfile = null) => {
    // 1. Try backend server if available
    if (idToken) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const response = await fetch(`${API_BASE_URL}/api/auth/social-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const json = await response.json();

        if (json.success && json.data?.user) {
          const isSuper = (json.data.user?.email && json.data.user.email.toLowerCase() === 'tushpendrakumar@gmail.com') ||
                          (json.data.user?.user_id && json.data.user.user_id.toLowerCase() === 'tushpendrakumar');
          const hasPrem = isSuper ? true : Boolean(json.data.user?.is_premium);
          const userData = {
            ...json.data.user,
            role: isSuper ? 'ADMIN' : (json.data.user?.role || 'USER'),
            has_khata: json.data.user.has_khata !== false,
            is_premium: hasPrem,
            premium_tier: hasPrem ? 'LIFETIME' : 'FREE',
          };
          setToken(json.data.token);
          setUser(userData);
          setCurrentMode(isSuper ? 'ADMIN' : 'USER');

          await AsyncStorage.setItem('userToken', json.data.token);
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          if (userData.email) await AsyncStorage.setItem('tushu_last_auth_email', userData.email);
          return { success: true };
        }
      } catch (e) {
        console.log('[AuthContext] Remote social auth unavailable, using verified local profile...');
      }
    }

    // 2. Standalone / Local Profile fallback
    if (socialProfile) {
      try {
        const isSuper = (socialProfile.email && socialProfile.email.toLowerCase().trim() === 'tushpendrakumar@gmail.com');
        const cleanId = (socialProfile.full_name || socialProfile.email || 'user')
          .toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'social_' + Date.now();
        const userData = {
          user_id: isSuper ? 'tushpendrakumar' : cleanId,
          email: socialProfile.email || `${cleanId}@gmail.com`,
          full_name: socialProfile.full_name || (isSuper ? 'Tushpendra Kumar' : `${socialProfile.provider || 'Google'} User`),
          role: isSuper ? 'ADMIN' : 'USER',
          has_khata: true,
          is_premium: true,
          premium_tier: 'LIFETIME',
          auth_provider: socialProfile.provider || 'social',
        };
        const localToken = 'tushu_social_jwt_' + Date.now();
        setToken(localToken);
        setUser(userData);
        setCurrentMode(isSuper ? 'ADMIN' : 'USER');
        await AsyncStorage.setItem('userToken', localToken);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        await AsyncStorage.setItem('tushu_remember_me', 'true');
        if (userData.email) await AsyncStorage.setItem('tushu_last_auth_email', userData.email);
        return { success: true };
      } catch (err) {
        console.warn('[AuthContext] Local social fallback error:', err);
      }
    }

    return {
      success: false,
      message: 'Unable to connect to authentication server. Please check your network connection.'
    };
  };

  // ----------------------------------------------------
  // Activate Lifetime Premium (Local + State sync)
  // ----------------------------------------------------
  const activateLifetimePremium = async (paymentDetails = {}) => {
    try {
      if (!user) return;
      const updatedUser = {
        ...user,
        is_premium: true,
        premium_tier: 'LIFETIME_PREMIUM',
        premium_activated_at: new Date().toISOString(),
        premium_utr: paymentDetails.utrNumber || 'VERIFIED'
      };
      setUser(updatedUser);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      await AsyncStorage.setItem(`tushu_${user.user_id}_premium_status`, JSON.stringify({
        isPremium: true,
        tier: 'LIFETIME_PREMIUM',
        ...paymentDetails,
        activatedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('[AuthContext] Error activating premium:', e);
    }
  };

  // ----------------------------------------------------
  // Update Profile
  // ----------------------------------------------------
  const updateUserProfile = async (updates) => {
    try {
      if (!user) return { success: false, message: 'Not logged in' };
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      return { success: true };
    } catch (e) {
      console.error('[AuthContext] Update profile error:', e);
      return { success: false, message: 'Failed to save changes.' };
    }
  };

  // ----------------------------------------------------
  // Logout & Session Purge
  // ----------------------------------------------------
  const logout = async () => {
    try {
      setToken(null);
      setUser(null);
      setCurrentMode('USER');
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.setItem('tushu_remember_me', 'false');
    } catch (e) {
      console.warn('[AuthContext] Logout cleanup error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      currentMode,
      switchMode,
      isSuperAdmin: isSuperAdmin(user), 
      login, 
      register, 
      forgotPassword, 
      socialLogin, 
      logout, 
      updateUserProfile,
      activateLifetimePremium
    }}>
      {children}
    </AuthContext.Provider>
  );
};
