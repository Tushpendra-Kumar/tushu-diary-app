import { Platform } from 'react-native';

// ── Apple iOS Human Interface Guidelines (HIG) Typography Stack ──────────────
export const AppleTypography = {
  fontFamily: Platform.select({
    ios: '-apple-system',
    android: 'sans-serif',
    web: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
    default: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif",
  }),
  cardTitle: {
    fontSize: 16.5, // 0.95rem - 1.1rem
    fontWeight: '700',
    letterSpacing: -0.25,
    lineHeight: 22,
  },
  body: {
    fontSize: 14, // 0.85rem - 0.90rem
    fontWeight: '500',
    letterSpacing: -0.15,
    lineHeight: 20,
  },
  secondaryLabel: {
    fontSize: 12.5, // 0.75rem - 0.78rem
    fontWeight: '400',
    color: '#636366', // Apple iOS Secondary Label
    letterSpacing: -0.1,
    lineHeight: 16,
  },
  microTag: {
    fontSize: 11, // 0.68rem - 0.72rem
    fontWeight: '600',
    letterSpacing: 0.44, // 0.04em
    textTransform: 'uppercase',
  },
  largeTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  headline: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.35,
    lineHeight: 24,
  },
};

// ── Apple Frosted Glassmorphism & Materials ──────────────────────────────────
export const AppleMaterials = {
  glassCard: {
    borderRadius: 18, // Apple squircle 16px - 20px
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(17, 21, 30, 0.85)',
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    } : {}),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  glassCardLight: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    } : {}),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.025,
    shadowRadius: 16,
    elevation: 2,
  },
  touchTarget: {
    minHeight: 44, // Apple HIG min touch target
    justifyContent: 'center',
  },
};

// ── Accent color maps ──────────────────────────────────────────────────────────
const ACCENT_MAP = {
  Gold:   { primary: '#F0A500', border: 'rgba(240,165,0,0.35)',   dim: 'rgba(240,165,0,0.15)' },
  Blue:   { primary: '#007AFF', border: 'rgba(0,122,255,0.35)',   dim: 'rgba(0,122,255,0.15)' }, // Apple iOS Blue
  Green:  { primary: '#34C759', border: 'rgba(52,199,89,0.35)',   dim: 'rgba(52,199,89,0.15)' }, // Apple iOS Green
  Purple: { primary: '#AF52DE', border: 'rgba(175,82,222,0.35)', dim: 'rgba(175,82,222,0.15)' }, // Apple iOS Purple
  Red:    { primary: '#FF3B30', border: 'rgba(255,59,48,0.35)',   dim: 'rgba(255,59,48,0.15)' }, // Apple iOS Red
};

// ── Base dark theme (Apple iOS Dark Glass Palette) ───────────────────────────
export const C = {
  bg: '#06080D',
  surface: 'rgba(17, 21, 30, 0.85)',
  card: 'rgba(17, 21, 30, 0.85)',
  border: 'rgba(255, 255, 255, 0.08)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  input: 'rgba(255, 255, 255, 0.05)',
  inputBorder: 'rgba(255, 255, 255, 0.10)',
  gold: '#F0A500',
  goldDim: 'rgba(240, 165, 0, 0.15)',
  goldBorder: 'rgba(240, 165, 0, 0.35)',
  goldCard: 'rgba(26, 21, 14, 0.90)',
  white: '#FFFFFF',
  textSecondary: '#D0D0D0',
  textMuted: '#636366', // Apple iOS Secondary Label
  success: '#34C759',
  successBg: 'rgba(52,199,89,0.12)',
  successBorder: 'rgba(52,199,89,0.3)',
  error: '#FF3B30',
  errorBg: 'rgba(255,59,48,0.12)',
  errorBorder: 'rgba(255,59,48,0.3)',
  // ── Personalization scaling tokens ──
  __textScale: 1.0,
  __density: 1.0,
};

// ── Global Input Reset for React Native Web & Native ─────────────────────────
export const inputResetStyle = Platform.OS === 'web' ? {
  outlineStyle: 'none',
  outlineWidth: 0,
  outlineColor: 'transparent',
  boxShadow: 'none',
} : {};

// ── Light theme token overrides (Apple iOS Light Glass Palette) ───────────────
const LIGHT_OVERRIDES = {
  bg: '#F2F2F7', // Apple iOS System Grouped Background
  surface: 'rgba(255, 255, 255, 0.85)',
  card: 'rgba(255, 255, 255, 0.85)',
  border: 'rgba(0, 0, 0, 0.06)',
  cardBorder: 'rgba(0, 0, 0, 0.06)',
  input: 'rgba(0, 0, 0, 0.04)',
  inputBorder: 'rgba(0, 0, 0, 0.08)',
  white: '#1C1C1E', // Apple Primary Label
  textSecondary: '#3A3A3C',
  textMuted: '#636366', // Apple Secondary Label
};

const DARK_OVERRIDES = {
  bg: '#06080D',
  surface: 'rgba(17, 21, 30, 0.85)',
  card: 'rgba(17, 21, 30, 0.85)',
  border: 'rgba(255, 255, 255, 0.08)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  input: 'rgba(255, 255, 255, 0.05)',
  inputBorder: 'rgba(255, 255, 255, 0.10)',
  white: '#FFFFFF',
  textSecondary: '#D0D0D0',
  textMuted: '#636366',
};

// ── Scaling helpers ───────────────────────────────────────────────────────────
C.fs = (n) => Math.round(n * C.__textScale);
C.sp = (n) => Math.round(n * C.__density);

// ── applyThemeTokens — mutates C in-place on pref change ─────────────────────
export const applyThemeTokens = (prefs, resolvedTheme) => {
  const appearance = resolvedTheme || prefs.theme || 'Dark';
  const overrides = appearance === 'Light' ? LIGHT_OVERRIDES : DARK_OVERRIDES;
  Object.assign(C, overrides);

  const accent = ACCENT_MAP[prefs.accent] || ACCENT_MAP.Gold;
  C.gold = accent.primary;
  C.goldDim = accent.dim;
  C.goldBorder = accent.border;
  C.accentBorder = accent.border;

  C.__textScale = prefs.textSize === 'Small' ? 0.88 : prefs.textSize === 'Large' ? 1.14 : 1.0;
  C.__density = prefs.density === 'Compact' ? 0.72 : prefs.density === 'Spacious' ? 1.32 : 1.0;

  C.fs = (n) => Math.round(n * C.__textScale);
  C.sp = (n) => Math.round(n * C.__density);
};


