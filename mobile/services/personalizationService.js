import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = (uid) => `tushu_personalization_${uid}`;

export const DEFAULT_PERSONALIZATION = {
  theme: 'Dark', // 'Dark', 'Light', 'System'
  accent: 'Gold', // 'Gold', 'Blue', 'Green', 'Purple', 'Red'
  textSize: 'Medium', // 'Small', 'Medium', 'Large'
  density: 'Comfortable', // 'Compact', 'Comfortable', 'Spacious'
  reduceMotion: false,
  reduceEffects: false,
  homeView: 'Standard' // 'Standard', 'Compact'
};

export const getPersonalization = async (uid) => {
  try {
    const raw = await AsyncStorage.getItem(THEME_KEY(uid));
    if (raw) return { ...DEFAULT_PERSONALIZATION, ...JSON.parse(raw) };
    return DEFAULT_PERSONALIZATION;
  } catch {
    return DEFAULT_PERSONALIZATION;
  }
};

export const savePersonalization = async (uid, prefs) => {
  try {
    await AsyncStorage.setItem(THEME_KEY(uid), JSON.stringify(prefs));
  } catch {}
};

export const clearPersonalization = async (uid) => {
  try {
    await AsyncStorage.removeItem(THEME_KEY(uid));
  } catch {}
};

// Map accent name to actual hex colors (using existing theme structure)
export const getAccentColor = (accentName) => {
  switch (accentName) {
    case 'Blue': return { primary: '#3B82F6', border: 'rgba(59,130,246,0.35)', bg: 'rgba(59,130,246,0.15)' };
    case 'Green': return { primary: '#10B981', border: 'rgba(16,185,129,0.35)', bg: 'rgba(16,185,129,0.15)' };
    case 'Purple': return { primary: '#8B5CF6', border: 'rgba(139,92,246,0.35)', bg: 'rgba(139,92,246,0.15)' };
    case 'Red': return { primary: '#EF4444', border: 'rgba(239,68,68,0.35)', bg: 'rgba(239,68,68,0.15)' };
    case 'Gold': 
    default: return { primary: '#F0A500', border: 'rgba(240,165,0,0.35)', bg: 'rgba(240,165,0,0.15)' };
  }
};
