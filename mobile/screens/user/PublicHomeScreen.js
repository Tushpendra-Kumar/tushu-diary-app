import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image, TextInput, Platform, Alert, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import SecurityFooter from '../../components/SecurityFooter';
import { C } from '../../constants/theme';
import { useTheme, useThemeVersion } from '../../context/ThemeContext';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';

// ── Solid Gold 3D Book Icon Matching Screenshot 2 ──
const SolidGoldBookIcon = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <Defs>
      <LinearGradient id="pubSolidBookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFE082" />
        <Stop offset="45%" stopColor="#FBBF24" />
        <Stop offset="100%" stopColor="#E59B15" />
      </LinearGradient>
    </Defs>
    <Path
      d="M 5 3.5 C 5 2.67 5.67 2 6.5 2 L 20.5 2 C 21.33 2 22 2.67 22 3.5 L 22 18.5 C 22 19.05 21.55 19.5 21 19.5 L 6 19.5 C 5.45 19.5 5 19.05 5 18.5 Z"
      fill="url(#pubSolidBookGrad)"
    />
    <Path
      d="M 14 2 L 14 11.5 L 17 9 L 20 11.5 L 20 2 Z"
      fill="#1C1304"
    />
    <Path
      d="M 5 21.2 C 5 20.7 5.4 20.3 5.9 20.3 L 21.1 20.3 C 21.6 20.3 22 20.7 22 21.2 L 22 22.5 C 22 23.9 20.9 25 19.5 25 L 7.5 25 C 6.1 25 5 23.9 5 22.5 Z"
      fill="url(#pubSolidBookGrad)"
    />
  </Svg>
);

import { 
  CheckSquare, Briefcase, Wallet, PieChart, ShoppingCart, Car, 
  ReceiptText, PiggyBank, Target, Heart, BookOpen, Pill, 
  PartyPopper, Gift, Bell, Edit3, FileText, BookMarked, ChevronRight, Search, X, Sparkles 
} from 'lucide-react-native';
import ParticleBackground from '../../components/ParticleBackground';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

import { APP_MODULES as modules } from '../../config/modulesConfig';

export default function PublicHomeScreen({ navigation }) {
  const { user, switchMode } = useContext(AuthContext);
  const isSuper = (user?.email || '').toLowerCase().trim() === 'tushpendrakumar@gmail.com';
  const userId = user?.user_id;
  const [displayName, setDisplayName] = useState(user?.full_name || '');
  const [dpUri, setDpUri] = useState(null);

  // Subscribe to theme version — re-renders when accent/theme/density changes
  useThemeVersion();
  const themeCtx = useTheme();
  const prefs = themeCtx?.prefs;
  const isCompactHome = prefs?.homeView === 'Compact';
  const textScale = C.__textScale ?? 1.0;
  const densityScale = C.__density ?? 1.0;

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      try {
        const savedName = await AsyncStorage.getItem(`tushu_${userId}_display_name`);
        const savedDp = await AsyncStorage.getItem(`tushu_${userId}_dp`);
        if (savedName) setDisplayName(savedName);
        if (savedDp) setDpUri(savedDp);
      } catch (e) {
        console.warn(e);
      }
    };
    load();
  }, [userId]);

  const name = displayName || user?.full_name || 'User';

  const { width: screenWidth } = useWindowDimensions();
  const GRID_H_PADDING = 16;
  const CARD_GAP = 12;
  const cardWidth = Math.max(140, (screenWidth - (GRID_H_PADDING * 2) - CARD_GAP) / 2);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const filteredModules = modules.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.label.toLowerCase().includes(q) || m.sub.toLowerCase().includes(q);
  });

  // Compact home: list-style cards. Standard: 2-column grid.
  const cardStyle = isCompactHome
    ? [s.card, { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14, padding: Math.round(12 * densityScale), marginBottom: 8 }]
    : [s.card, { padding: Math.round(14 * densityScale) }];
  const cardIconBgStyle = isCompactHome
    ? [s.cardIconBg, { width: 38, height: 38, borderRadius: 10 }]
    : s.cardIconBg;

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>


        <View style={s.greetingSection}>
          <View style={s.avatarWrap}>
            {dpUri ? (
              <Image source={{ uri: dpUri }} style={s.dpImage} />
            ) : (
              <Text style={s.avatarText}>{name[0]?.toUpperCase()}</Text>
            )}
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={s.greeting}>{getGreeting()}</Text>
            <Text style={s.name}>{name}</Text>
            <Text style={s.sub}>@{((user?.user_id || 'user').includes('privaterelay') || (user?.user_id || '').includes('@')) ? ((user?.full_name || user?.user_id || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')) : (user?.user_id || 'user').replace(/^@+/, '')}</Text>
          </View>
        </View>

        {/* ── Super Admin Access Pill (Visible ONLY to tushpendrakumar@gmail.com) ── */}
        {isSuper && (
          <TouchableOpacity 
            style={s.superAdminCard}
            activeOpacity={0.82}
            onPress={() => {
              Alert.alert(
                'Super Admin Verification',
                'Authorized: tushpendrakumar@gmail.com\n\nDo you want to switch to Admin Portal?',
                [
                  { text: 'Stay in User Mode', style: 'cancel' },
                  { text: 'Enter Admin Portal', onPress: () => switchMode('ADMIN') }
                ]
              );
            }}
          >
            <View style={s.superAdminLeft}>
              <View style={s.superAdminIconWrap}>
                <Sparkles size={16} color="#FBBF24" />
              </View>
              <View>
                <Text style={s.superAdminTitle}>Super Admin Access</Text>
                <Text style={s.superAdminSub}>Tap to open Admin Portal & Reports Hub</Text>
              </View>
            </View>
            <View style={s.superAdminActionBadge}>
              <Text style={s.superAdminActionText}>Admin Mode</Text>
              <ChevronRight size={14} color="#000000" strokeWidth={2.4} />
            </View>
          </TouchableOpacity>
        )}

        {/* Khata is always accessible to public users */}
        <TouchableOpacity style={s.khataCard} onPress={() => navigation.navigate('KhataBook')} activeOpacity={0.85}>
          <View style={[StyleSheet.absoluteFill, s.khataCardBg]}>
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="pubKhataBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#120D04" stopOpacity="0.98" />
                  <Stop offset="24%" stopColor="#241805" stopOpacity="0.96" />
                  <Stop offset="58%" stopColor="#62430A" stopOpacity="0.94" />
                  <Stop offset="85%" stopColor="#B2831E" stopOpacity="0.92" />
                  <Stop offset="100%" stopColor="#D6A42E" stopOpacity="0.90" />
                </LinearGradient>
                <LinearGradient id="pubWaveSilkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="rgba(255, 220, 110, 0.0)" />
                  <Stop offset="30%" stopColor="rgba(255, 215, 90, 0.15)" />
                  <Stop offset="70%" stopColor="rgba(255, 215, 90, 0.35)" />
                  <Stop offset="100%" stopColor="rgba(255, 220, 110, 0.15)" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" rx={22} fill="url(#pubKhataBaseGrad)" />
              <Path
                d="M 80 140 C 180 135 250 85 360 25 C 385 14 410 5 440 0 L 440 140 Z"
                fill="url(#pubWaveSilkGrad)"
              />
              {[...Array(12)].map((_, i) => {
                const o = i * 4.5;
                return (
                  <Path
                    key={i}
                    d={`M ${90 + o * 2.8} 140 C ${190 + o * 2.3} ${135 - o * 0.4} ${260 + o * 1.4} ${85 - o * 0.6} 440 ${20 + o * 1.2}`}
                    stroke="rgba(255, 235, 140, 0.28)"
                    strokeWidth="0.85"
                    fill="none"
                  />
                );
              })}
            </Svg>
          </View>

          <View style={s.khataIconWrap}>
            <SolidGoldBookIcon size={32} />
          </View>
          <View style={s.khataContent}>
            <Text style={s.khataTitle}>Khata Book</Text>
            <Text style={s.khataSub}>Personal Ledger & Transactions</Text>
          </View>
          <View style={s.khataArrowBadge}>
            <ChevronRight size={20} color="#FBBF24" strokeWidth={2.6} />
          </View>
        </TouchableOpacity>

        <View style={[s.searchContainer, isSearchFocused && s.searchContainerFocused]}>
          <Search size={18} color={isSearchFocused ? C.gold : '#8E8E93'} />
          <TextInput
            style={s.searchInput}
            placeholder="Search your stuff..."
            placeholderTextColor="#6E6E73"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <X size={18} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

        <View style={s.sectionHeaderRow}>
          <Text style={s.sectionHeader}>PERSONAL WORKSPACE</Text>
          <View style={s.sectionLine} />
        </View>

        {filteredModules.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>No modules found</Text>
            <Text style={s.emptySub}>We couldn't find any modules matching "{searchQuery}"</Text>
          </View>
        ) : (
          <View style={isCompactHome ? s.list : s.grid}>
            {filteredModules.map((m, i) => (
              <TouchableOpacity 
                key={i} 
                style={[
                  cardStyle,
                  !isCompactHome && { width: cardWidth, borderColor: m.color + '40', shadowColor: m.color }
                ]} 
                onPress={() => navigation.navigate(m.route)} 
                activeOpacity={0.78}
              >
                {isCompactHome ? (
                  <>
                    <View style={[cardIconBgStyle, { backgroundColor: m.color + '18', borderColor: m.color + '45' }]}>
                      <m.icon size={18} color={m.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.moduleTitle, { fontSize: Math.round(14 * textScale) }]} numberOfLines={1}>{m.label}</Text>
                      <Text style={[s.moduleSub, { fontSize: Math.round(11 * textScale) }]} numberOfLines={1}>{m.sub}</Text>
                    </View>
                    <ChevronRight size={16} color="rgba(255, 255, 255, 0.45)" />
                  </>
                ) : (
                  <View style={s.cardInner}>
                    <View style={s.cardTopRow}>
                      <View style={[cardIconBgStyle, { backgroundColor: m.color + '18', borderColor: m.color + '45' }]}>
                        <m.icon size={22} color={m.color} strokeWidth={2.0} />
                      </View>
                      <View style={s.chevronBadge}>
                        <ChevronRight size={14} color="rgba(255, 255, 255, 0.45)" strokeWidth={2.4} />
                      </View>
                    </View>
                    <View style={s.cardBottom}>
                      <Text style={[s.moduleTitle, { fontSize: Math.round(14.5 * textScale) }]} numberOfLines={1}>{m.label}</Text>
                      <Text style={[s.moduleSub, { fontSize: Math.round(11.5 * textScale) }]} numberOfLines={1}>{m.sub}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}


        <SecurityFooter style={{ marginTop: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#06080D' },
  superAdminCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  superAdminLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  superAdminIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  superAdminTitle: { color: '#FBBF24', fontSize: 14, fontWeight: '700' },
  superAdminSub: { color: 'rgba(255, 255, 255, 0.65)', fontSize: 11, marginTop: 1 },
  superAdminActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBBF24',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
  },
  superAdminActionText: { color: '#000000', fontSize: 12, fontWeight: '800' },
  scroll: { paddingBottom: 32 },
  greetingSection: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20,
  },
  avatarWrap: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(66, 165, 245, 0.14)',
    borderWidth: 2, borderColor: '#42A5F5',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#42A5F5', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#42A5F5' },
  dpImage: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: '#42A5F5' },
  greeting: { fontSize: 11, color: '#8E8E93', fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 2 },
  name: { fontSize: 22, fontWeight: '800', color: C.white, letterSpacing: 0.2, lineHeight: 28 },
  sub: { fontSize: 12.5, fontWeight: '500', color: '#8E8E93', marginTop: 1 },
  khataCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginHorizontal: 16, 
    marginBottom: 14,
    paddingVertical: 18, 
    paddingHorizontal: 18, 
    borderRadius: 22, 
    borderWidth: 1.6, 
    borderColor: '#F6C344', 
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1505',
    shadowColor: '#F6C344',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 16,
    elevation: 8,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 16px rgba(246, 195, 68, 0.55), 0 0 35px rgba(246, 195, 68, 0.22), 0 8px 24px rgba(0, 0, 0, 0.75)',
      backgroundImage: 'linear-gradient(115deg, #120D04 0%, #241805 24%, #62430A 58%, #B2831E 85%, #D6A42E 100%)',
    } : {}),
  },
  khataCardBg: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  khataIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: 'rgba(246, 195, 68, 0.14)',
    borderWidth: 1.4,
    borderColor: 'rgba(246, 195, 68, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 14px rgba(246, 195, 68, 0.25), inset 0 0 10px rgba(246, 195, 68, 0.12)',
    } : {}),
  },
  khataContent: {
    flex: 1,
    marginLeft: 16,
    marginRight: 10,
  },
  khataTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#F7CE46', 
    letterSpacing: -0.2,
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    ...(Platform.OS === 'web' ? {
      textShadow: '0 2px 6px rgba(0,0,0,0.85), 0 0 14px rgba(246, 195, 68, 0.35)',
    } : {}),
  },
  khataSub: { 
    fontSize: 13.5, 
    color: '#C5CCD6', 
    marginTop: 2, 
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  khataArrowBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(16, 12, 6, 0.65)',
    borderWidth: 1.2,
    borderColor: 'rgba(246, 195, 68, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
    } : {}),
  },
  // ── Section Header Matching AdminHomeScreen ──
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 22,
    marginBottom: 14,
  },
  sectionHeader: { 
    color: '#8A99AC', 
    fontSize: 11, 
    fontWeight: '700', 
    letterSpacing: 1.8, 
    textTransform: 'uppercase',
    marginRight: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    marginHorizontal: 16, marginTop: 14, marginBottom: 6,
    borderRadius: 14, paddingHorizontal: 16, height: 48,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchContainerFocused: {
    borderColor: 'rgba(240, 165, 0, 0.75)',
    backgroundColor: 'rgba(240, 165, 0, 0.04)',
  },
  searchInput: {
    flex: 1, marginLeft: 12, color: C.white, fontSize: 14, fontWeight: '500',
    outlineStyle: 'none',
  },
  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 40, marginHorizontal: 16,
    backgroundColor: 'rgba(14, 17, 24, 0.94)', borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyTitle: { color: C.white, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: '#8E8E93', fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', paddingHorizontal: 16,
    rowGap: 12,
  },
  list: { flexDirection: 'column', paddingHorizontal: 16, gap: 10 },
  card: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.2,
    backgroundColor: 'rgba(14, 17, 24, 0.94)',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  cardInner: { flex: 1, justifyContent: 'space-between' },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardIconBg: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  chevronBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBottom: {
    marginTop: 12,
  },
  moduleTitle: { 
    color: '#FFFFFF', 
    fontSize: 14.5, 
    fontWeight: '700', 
    letterSpacing: 0.2,
    marginBottom: 2,
    textAlign: 'left',
  },
  moduleSub: { 
    color: '#8E9BAE', 
    fontSize: 11.5, 
    fontWeight: '400',
    textAlign: 'left',
  },
});
