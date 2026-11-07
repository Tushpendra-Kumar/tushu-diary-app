// ── Accent color maps ──────────────────────────────────────────────────────────
const ACCENT_MAP = {
  Gold:   { primary: '#F0A500', border: 'rgba(240,165,0,0.35)',   dim: 'rgba(240,165,0,0.15)' },
  Blue:   { primary: '#3B82F6', border: 'rgba(59,130,246,0.35)',  dim: 'rgba(59,130,246,0.15)' },
  Green:  { primary: '#10B981', border: 'rgba(16,185,129,0.35)',  dim: 'rgba(16,185,129,0.15)' },
  Purple: { primary: '#8B5CF6', border: 'rgba(139,92,246,0.35)', dim: 'rgba(139,92,246,0.15)' },
  Red:    { primary: '#EF4444', border: 'rgba(239,68,68,0.35)',   dim: 'rgba(239,68,68,0.15)' },
};

// ── Base dark theme (defaults matching Home screen visual design) ────────────────
export const C = {
  bg: '#050505',
  surface: 'rgba(255, 255, 255, 0.035)',
  card: 'rgba(255, 255, 255, 0.035)',
  border: 'rgba(255, 255, 255, 0.08)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  input: 'rgba(255, 255, 255, 0.035)',
  inputBorder: 'rgba(255, 255, 255, 0.09)',
  gold: '#F0A500',
  goldDim: 'rgba(240, 165, 0, 0.15)',
  goldBorder: 'rgba(240, 165, 0, 0.45)',
  goldCard: 'rgba(22, 19, 13, 0.92)',
  white: '#FFFFFF',
  textSecondary: '#D0D0D0',
  textMuted: '#8E8E93',
  success: '#22C55E',
  successBg: 'rgba(34,197,94,0.12)',
  successBorder: 'rgba(34,197,94,0.3)',
  error: '#EF4444',
  errorBg: 'rgba(239,68,68,0.12)',
  errorBorder: 'rgba(239,68,68,0.3)',
  // ── Personalization scaling tokens (read by helper fns) ──
  __textScale: 1.0,   // Small=0.85, Medium=1.0, Large=1.15
  __density: 1.0,     // Compact=0.75, Comfortable=1.0, Spacious=1.3
};

// ── Global Input Reset for React Native Web & Native ─────────────────────────
export const inputResetStyle = {
  outlineStyle: 'none',
  outlineWidth: 0,
  outlineColor: 'transparent',
  boxShadow: 'none',
};

// ── Light theme token overrides ────────────────────────────────────────────────
// Placeholder values — exact values to be provided by user in next task.
const LIGHT_OVERRIDES = {
  bg: '#FAFAFA',
  surface: 'rgba(245,245,245,0.95)',
  card: 'rgba(240,240,240,0.95)',
  border: 'rgba(0,0,0,0.08)',
  cardBorder: 'rgba(0,0,0,0.08)',
  input: 'rgba(220,220,220,0.9)',
  inputBorder: 'rgba(0,0,0,0.1)',
  white: '#1A1A1A',        // primary text inverted
  textSecondary: '#3A3A3A',
  textMuted: '#6B7280',
};

const DARK_OVERRIDES = {
  bg: '#050505',
  surface: 'rgba(255, 255, 255, 0.035)',
  card: 'rgba(255, 255, 255, 0.035)',
  border: 'rgba(255, 255, 255, 0.08)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  input: 'rgba(255, 255, 255, 0.035)',
  inputBorder: 'rgba(255, 255, 255, 0.09)',
  white: '#FFFFFF',
  textSecondary: '#D0D0D0',
  textMuted: '#8E8E93',
};

// ── Scaling helpers ───────────────────────────────────────────────────────────
// Use C.fs(n) instead of raw fontSize values in theme-aware components (optional).
// All static-C screens still get updated __textScale on next render.
C.fs = (n) => Math.round(n * C.__textScale);
C.sp = (n) => Math.round(n * C.__density);

// ── applyThemeTokens — mutates C in-place on pref change ─────────────────────
export const applyThemeTokens = (prefs, resolvedTheme) => {
  // 1. Appearance (resolvedTheme = 'Dark' | 'Light')
  const appearance = resolvedTheme || prefs.theme || 'Dark';
  const overrides = appearance === 'Light' ? LIGHT_OVERRIDES : DARK_OVERRIDES;
  Object.assign(C, overrides);

  // 2. Accent color
  const accent = ACCENT_MAP[prefs.accent] || ACCENT_MAP.Gold;
  C.gold = accent.primary;
  C.goldDim = accent.dim;
  C.goldBorder = accent.border;
  C.accentBorder = accent.border;

  // 3. Text scale
  C.__textScale = prefs.textSize === 'Small' ? 0.88 : prefs.textSize === 'Large' ? 1.14 : 1.0;

  // 4. Density
  C.__density = prefs.density === 'Compact' ? 0.72 : prefs.density === 'Spacious' ? 1.32 : 1.0;

  // Keep fs/sp helpers updated
  C.fs = (n) => Math.round(n * C.__textScale);
  C.sp = (n) => Math.round(n * C.__density);
};

