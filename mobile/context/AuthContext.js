import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../services/adminApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore active session on application launch
  useEffect(() => {
    const restoreSession = async () => {
      try {
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
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  // ----------------------------------------------------
  // User Login (Email + Password)
  // ----------------------------------------------------
  const login = async (emailOrUserId, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: emailOrUserId.trim().toLowerCase(), 
          password 
        }),
      });
      
      const json = await response.json();
      
      if (json.success) {
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
        
        // Save to secure device storage
        await AsyncStorage.setItem('userToken', json.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        if (hasPrem) {
          await AsyncStorage.setItem(`tushu_${userData.user_id}_premium_status`, JSON.stringify({
            isPremium: true,
            tier: 'LIFETIME',
            activatedAt: userData.premium_activated_at || new Date().toISOString()
          }));
        }
        return { success: true };
      } else {
        return { success: false, message: json.message || 'Login failed.' };
      }
    } catch (e) {
      console.warn('[AuthContext] Login error / network issue:', e);
      return { 
        success: false, 
        message: 'Unable to connect to authentication server. Please check your network connection.' 
      };
    }
  };

  // ----------------------------------------------------
  // User Account Creation (Email + Password)
  // ----------------------------------------------------
  const register = async (email, password, fullName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password, 
          fullName: fullName.trim() 
        }),
      });

      const json = await response.json();

      if (json.success) {
        const userData = {
          ...json.data.user,
          has_khata: true,
        };
        setToken(json.data.token);
        setUser(userData);

        await AsyncStorage.setItem('userToken', json.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        return { success: true };
      } else {
        return { success: false, message: json.message || 'Registration failed.' };
      }
    } catch (e) {
      console.warn('[AuthContext] Register network error:', e);
      return {
        success: false,
        message: 'Unable to connect to registration server. Please check your network.'
      };
    }
  };

  // ----------------------------------------------------
  // Password Reset / Forgot Password Request
  // ----------------------------------------------------
  const forgotPassword = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const json = await response.json();
      return json;
    } catch (e) {
      console.warn('[AuthContext] Forgot password network error:', e);
      return {
        success: false,
        message: 'Unable to connect to server. Please try again later.'
      };
    }
  };

  // ----------------------------------------------------
  // Social Login (Google, Apple, Facebook, GitHub via Firebase ID Token)
  // ----------------------------------------------------
  const socialLogin = async (idToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const json = await response.json();

      if (json.success) {
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

        await AsyncStorage.setItem('userToken', json.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        if (hasPrem) {
          await AsyncStorage.setItem(`tushu_${userData.user_id}_premium_status`, JSON.stringify({
            isPremium: true,
            tier: 'LIFETIME',
            activatedAt: userData.premium_activated_at || new Date().toISOString()
          }));
        }
        return { success: true };
      } else {
        return { success: false, message: json.message || 'Social authentication failed.' };
      }
    } catch (e) {
      console.warn('[AuthContext] Social login error:', e);
      return {
        success: false,
        message: 'Unable to connect to authentication server. Please check your network connection.'
      };
    }
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
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (e) {
      console.warn('[AuthContext] Logout cleanup error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
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
