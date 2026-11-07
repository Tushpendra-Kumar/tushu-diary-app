import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Switch, Alert, Platform
} from 'react-native';
import { C } from '../../../constants/theme';
import { useTheme, useThemeVersion } from '../../../context/ThemeContext';
import {
  ChevronLeft, Palette, Type, Maximize, Zap,
  LayoutTemplate, RotateCcw, Check
} from 'lucide-react-native';
import ParticleBackground from '../../../components/ParticleBackground';
import SecurityFooter from '../../../components/SecurityFooter';

export default function PremiumPersonalizationScreen({ navigation }) {
  // Subscribe to theme version so this screen re-renders immediately on any pref change
  useThemeVersion();
  const themeCtx = useTheme();
  // C is the live mutable theme object — always up-to-date after applyThemeTokens runs
  const T = C;
  const prefs = themeCtx?.prefs || {
    theme: 'Dark', accent: 'Gold', textSize: 'Medium',
    density: 'Comfortable', reduceMotion: false, reduceEffects: false, homeView: 'Standard'
  };

  const updatePref = (k, v) => themeCtx?.updatePrefs?.({ [k]: v });



  // ── Options ────────────────────────────────────────────────────────
  const THEMES = ['Dark', 'Light', 'System Default'];
  const ACCENTS = [
    { label: 'Gold', hex: '#F0A500' },
    { label: 'Blue', hex: '#3B82F6' },
    { label: 'Green', hex: '#10B981' },
    { label: 'Purple', hex: '#8B5CF6' },
    { label: 'Red', hex: '#EF4444' }
  ];
  const SIZES = ['Small', 'Medium', 'Large'];
  const DENSITIES = ['Compact', 'Comfortable', 'Spacious'];
  const HOME_VIEWS = ['Standard', 'Compact'];

  // ── Render ─────────────────────────────────────────────────────────
  const Section = ({ title, icon: Icon, children }) => (
    <View style={s.section(T)}>
      <View style={s.secHeader}>
        <Icon color={T.gold} size={18} />
        <Text style={s.secTitle(T)}>{title}</Text>
      </View>
      <View style={s.secBody}>
        {children}
      </View>
    </View>
  );

  const OptionRow = ({ label, selected, onPress }) => (
    <TouchableOpacity style={s.optRow(T)} onPress={onPress}>
      <Text style={[s.optText(T), selected && { color: T.gold, fontWeight: '600' }]}>{label}</Text>
      <View style={[s.radio(T), selected && s.radioOn(T)]}>
        {selected && <Check color={T.black || '#050505'} size={12} />}
      </View>
    </TouchableOpacity>
  );

  const handleReset = () => {
    const doIt = () => themeCtx?.resetPrefs?.();
    if (Platform.OS === 'web') {
      if (window.confirm('Reset all personalization settings? Your data will not be affected.')) doIt();
    } else {
      Alert.alert('Reset Personalization', 'Reset all personalization settings? Your data will not be affected.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: doIt }
      ]);
    }
  };

  return (
    <SafeAreaView style={s.safe(T)}>
      {!prefs.reduceEffects && <ParticleBackground />}

      <View style={s.header(T)}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ChevronLeft color={T.white} size={28} />
        </TouchableOpacity>
        <Text style={s.headerTitle(T)}>Premium Personalization</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.heroDesc(T)}>Customize your app experience to match your preferences.</Text>

        {/* 1. APPEARANCE */}
        <Section title="APPEARANCE" icon={Palette}>
          {THEMES.map(t => (
            <OptionRow key={t} label={t} selected={prefs.theme === t || (t==='System Default' && prefs.theme==='System')} 
              onPress={() => updatePref('theme', t === 'System Default' ? 'System' : t)} />
          ))}
        </Section>

        {/* 2. ACCENT COLOR */}
        <Section title="ACCENT COLOR" icon={Palette}>
          <View style={s.colorGrid}>
            {ACCENTS.map(a => (
              <TouchableOpacity key={a.label} style={[s.colorBox(T), prefs.accent === a.label && s.colorBoxOn(T, a.hex)]} 
                onPress={() => updatePref('accent', a.label)}>
                <View style={[s.colorCircle, { backgroundColor: a.hex }]} />
                <Text style={[s.colorLbl(T), prefs.accent === a.label && { color: T.white, fontWeight: '700' }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* 3. TEXT SIZE */}
        <Section title="TEXT SIZE" icon={Type}>
          <View style={s.pillRow}>
            {SIZES.map(sz => (
              <TouchableOpacity key={sz} style={[s.pillBtn(T), prefs.textSize === sz && s.pillBtnOn(T)]} 
                onPress={() => updatePref('textSize', sz)}>
                <Text style={[s.pillText(T), prefs.textSize === sz && s.pillTextOn(T)]}>{sz}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* 4. DISPLAY DENSITY */}
        <Section title="DISPLAY DENSITY" icon={Maximize}>
          <View style={s.pillRow}>
            {DENSITIES.map(d => (
              <TouchableOpacity key={d} style={[s.pillBtn(T), prefs.density === d && s.pillBtnOn(T)]} 
                onPress={() => updatePref('density', d)}>
                <Text style={[s.pillText(T), prefs.density === d && s.pillTextOn(T)]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* 5 & 6. EFFECTS */}
        <Section title="MOTION & VISUALS" icon={Zap}>
          <View style={s.toggleRow(T)}>
            <Text style={s.toggleLbl(T)}>Reduce Motion</Text>
            <Switch value={prefs.reduceMotion} onValueChange={v => updatePref('reduceMotion', v)}
              trackColor={{ false: T.border, true: T.gold }} thumbColor={prefs.reduceMotion ? (T.black||'#000') : '#888'} />
          </View>
          <View style={[s.toggleRow(T), { borderBottomWidth: 0 }]}>
            <Text style={s.toggleLbl(T)}>Reduce Visual Effects</Text>
            <Switch value={prefs.reduceEffects} onValueChange={v => updatePref('reduceEffects', v)}
              trackColor={{ false: T.border, true: T.gold }} thumbColor={prefs.reduceEffects ? (T.black||'#000') : '#888'} />
          </View>
        </Section>

        {/* 7. HOME VIEW */}
        <Section title="DEFAULT HOME VIEW" icon={LayoutTemplate}>
          <View style={s.pillRow}>
            {HOME_VIEWS.map(v => (
              <TouchableOpacity key={v} style={[s.pillBtn(T), prefs.homeView === v && s.pillBtnOn(T)]} 
                onPress={() => updatePref('homeView', v)}>
                <Text style={[s.pillText(T), prefs.homeView === v && s.pillTextOn(T)]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* 9. RESET */}
        <View style={s.resetWrap}>
          <TouchableOpacity style={s.resetBtn} onPress={handleReset}>
            <RotateCcw color="#EF4444" size={16} />
            <Text style={s.resetText}>Reset Personalization</Text>
          </TouchableOpacity>
        </View>

        <SecurityFooter />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Pass T (theme) to generate dynamic styles
const s = {
  safe: (T) => ({ flex: 1, backgroundColor: T.bg || '#050505' }),
  header: (T) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border, backgroundColor: T.bg }),
  headerTitle: (T) => ({ fontSize: 16, fontWeight: '700', color: T.white }),
  backBtn: { padding: 4 },
  scroll: { padding: 16 },
  
  heroDesc: (T) => ({ fontSize: 14, color: T.textMuted, marginBottom: 20, lineHeight: 22 }),
  
  section: (T) => ({ backgroundColor: T.card, borderRadius: 16, borderWidth: 1, borderColor: T.border, marginBottom: 16, overflow: 'hidden' }),
  secHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 10 },
  secTitle: (T) => ({ fontSize: 11, color: T.gold, fontWeight: '700', letterSpacing: 0.8 }),
  secBody: { paddingBottom: 6 },
  
  optRow: (T) => ({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }),
  optText: (T) => ({ fontSize: 14, color: T.white }),
  radio: (T) => ({ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: T.textMuted, justifyContent: 'center', alignItems: 'center' }),
  radioOn: (T) => ({ borderColor: T.gold, backgroundColor: T.gold }),

  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 14, paddingBottom: 10 },
  colorBox: (T) => ({ alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' }),
  colorBoxOn: (T, hex) => ({ borderColor: hex, backgroundColor: 'rgba(255,255,255,0.08)' }),
  colorCircle: { width: 24, height: 24, borderRadius: 12 },
  colorLbl: (T) => ({ fontSize: 12, color: T.textMuted }),

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingBottom: 10 },
  pillBtn: (T) => ({ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: T.border, backgroundColor: 'rgba(255,255,255,0.02)' }),
  pillBtnOn: (T) => ({ backgroundColor: T.goldDim, borderColor: T.gold }),
  pillText: (T) => ({ fontSize: 13, color: T.white }),
  pillTextOn: (T) => ({ color: T.gold, fontWeight: '700' }),

  toggleRow: (T) => ({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }),
  toggleLbl: (T) => ({ fontSize: 14, color: T.white }),

  resetWrap: { marginTop: 10, alignItems: 'center' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)' },
  resetText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
};
