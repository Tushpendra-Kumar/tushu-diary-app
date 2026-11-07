/**
 * ThemeContext.js
 * Centralized personalization context.
 * - Loads/saves prefs from AsyncStorage
 * - Calls applyThemeTokens() on every pref change → mutates C in-place
 * - Exposes themeVersion (increments on change) → screens can subscribe for immediate re-render
 * - Handles System Default via useColorScheme()
 */
import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useColorScheme } from 'react-native';
import { AuthContext } from './AuthContext';
import {
  getPersonalization, savePersonalization, clearPersonalization,
  DEFAULT_PERSONALIZATION,
} from '../services/personalizationService';
import { applyThemeTokens } from '../constants/theme';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [prefs, setPrefs] = useState(DEFAULT_PERSONALIZATION);
  const [themeVersion, setThemeVersion] = useState(0);
  const [loading, setLoading] = useState(true);

  // Resolve actual theme from prefs + system
  const resolveTheme = useCallback((p, scheme) => {
    if (p.theme === 'System' || p.theme === 'System Default') {
      return scheme === 'light' ? 'Light' : 'Dark';
    }
    return p.theme || 'Dark';
  }, []);

  // Apply theme tokens and bump version
  const applyAndBump = useCallback((p, scheme) => {
    const resolved = resolveTheme(p, scheme);
    applyThemeTokens(p, resolved);
    setThemeVersion(v => v + 1);
  }, [resolveTheme]);

  // Load preferences from storage on user login
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let p = DEFAULT_PERSONALIZATION;
      if (user?.user_id) {
        p = await getPersonalization(user.user_id);
      }
      setPrefs(p);
      applyAndBump(p, systemScheme);
      setLoading(false);
    };
    load();
  }, [user?.user_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // React to system scheme changes (for System Default mode)
  useEffect(() => {
    if (loading) return;
    if (prefs.theme === 'System' || prefs.theme === 'System Default') {
      applyAndBump(prefs, systemScheme);
    }
  }, [systemScheme]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update a single or multiple preferences
  const updatePrefs = useCallback(async (updates) => {
    if (!user?.user_id) return;
    setPrefs(prev => {
      const next = { ...prev, ...updates };
      savePersonalization(user.user_id, next).catch(() => {});
      applyAndBump(next, systemScheme);
      return next;
    });
  }, [user?.user_id, systemScheme, applyAndBump]);

  // Reset all preferences to defaults
  const resetPrefs = useCallback(async () => {
    if (!user?.user_id) return;
    const defaults = { ...DEFAULT_PERSONALIZATION };
    setPrefs(defaults);
    await clearPersonalization(user.user_id);
    applyAndBump(defaults, systemScheme);
  }, [user?.user_id, systemScheme, applyAndBump]);

  return (
    <ThemeContext.Provider value={{ prefs, themeVersion, updatePrefs, resetPrefs, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Main hook — access prefs + actions
export const useTheme = () => useContext(ThemeContext);

// Version hook — subscribe to theme changes for immediate re-render
// Usage: const tv = useThemeVersion(); (component re-renders on every pref change)
export const useThemeVersion = () => {
  const ctx = useContext(ThemeContext);
  return ctx?.themeVersion ?? 0;
};

