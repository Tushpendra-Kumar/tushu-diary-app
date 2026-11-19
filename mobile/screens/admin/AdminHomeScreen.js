import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Platform } from 'react-native';
import ParticleBackground from '../../components/ParticleBackground';
import { ChevronRight, FolderGit2, FileText, Users, MessageSquare, ShieldCheck, Sparkles, CreditCard, RefreshCw } from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';
import { APP_MODULES } from '../../config/modulesConfig';
import { C } from '../../constants/theme';

// ── Solid Gold 3D Book Icon Matching Screenshot 2 ──
const SolidGoldBookIcon = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <Defs>
      <LinearGradient id="solidBookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFE082" />
        <Stop offset="45%" stopColor="#FBBF24" />
        <Stop offset="100%" stopColor="#E59B15" />
      </LinearGradient>
    </Defs>
    {/* Main Book Cover Body */}
    <Path
      d="M 5 3.5 C 5 2.67 5.67 2 6.5 2 L 20.5 2 C 21.33 2 22 2.67 22 3.5 L 22 18.5 C 22 19.05 21.55 19.5 21 19.5 L 6 19.5 C 5.45 19.5 5 19.05 5 18.5 Z"
      fill="url(#solidBookGrad)"
    />
    {/* Bookmark Ribbon Cutout */}
    <Path
      d="M 14 2 L 14 11.5 L 17 9 L 20 11.5 L 20 2 Z"
      fill="#1C1304"
    />
    {/* Bottom Pages / Spine Strip */}
    <Path
      d="M 5 21.2 C 5 20.7 5.4 20.3 5.9 20.3 L 21.1 20.3 C 21.6 20.3 22 20.7 22 21.2 L 22 22.5 C 22 23.9 20.9 25 19.5 25 L 7.5 25 C 6.1 25 5 23.9 5 22.5 Z"
      fill="url(#solidBookGrad)"
    />
  </Svg>
);

// Enclosed Luxury Module Card matching updated color styling reference
const ModuleCard = ({ icon: Icon, title, sub, color, onPress, cardWidth }) => (
  <TouchableOpacity 
    style={[
      s.moduleCard, 
      { 
        width: cardWidth,
        borderColor: color + '40',
        shadowColor: color,
      },
      Platform.OS === 'web' && {
        backgroundImage: `linear-gradient(135deg, ${color}1C 0%, rgba(12, 16, 24, 0.94) 75%)`,
        boxShadow: `0 4px 18px ${color}24`,
      }
    ]} 
    onPress={onPress} 
    activeOpacity={0.78}
  >
    {/* Top Row: Icon badge + Chevron circle */}
    <View style={s.cardTopRow}>
      <View style={[s.iconBox, { backgroundColor: color + '18', borderColor: color + '45' }]}>
        <Icon size={22} color={color} strokeWidth={2.0} />
      </View>
      <View style={s.chevronBadge}>
        <ChevronRight size={14} color="rgba(255, 255, 255, 0.45)" strokeWidth={2.4} />
      </View>
    </View>
    
    {/* Bottom: Title & Subtitle */}
    <View style={s.cardBottom}>
      <Text style={s.moduleTitle} numberOfLines={1}>{title}</Text>
      <Text style={s.moduleSub} numberOfLines={1}>{sub}</Text>
    </View>
  </TouchableOpacity>
);

export default function AdminHomeScreen({ navigation }) {
  const { switchMode } = useContext(AuthContext);
  const { width: screenWidth } = useWindowDimensions();
  
  // 2-column responsive layout with 16px screen padding and 12px card gap
  const GRID_H_PADDING = 16;
  const CARD_GAP = 12;
  const cardWidth = Math.max(140, (screenWidth - (GRID_H_PADDING * 2) - CARD_GAP) / 2);

  const navTo = (route) => navigation.navigate(route);

  return (
    <View style={s.safe}>
      {/* Existing background animations, particles, and orbit flow untouched */}
      <ParticleBackground />
      
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Admin Master Header & Files Hub Card */}
        <View style={s.adminHeaderBlock}>
          <View style={s.adminBadgeRow}>
            <View style={s.adminBadge}>
              <Sparkles size={12} color={C.gold} />
              <Text style={s.adminBadgeText}>ADMINISTRATOR WORKSPACE</Text>
            </View>
            <Text style={s.adminStatusTag}>Role: Master Admin</Text>
          </View>
          <Text style={s.adminTitle}>Admin Portal</Text>
          <Text style={s.adminSubtitle}>Manage project files, documentation, reports, users & system</Text>
        </View>

        {/* ── DEDICATED FILES & DOCUMENTATION HUB HERO CARD ── */}
        <TouchableOpacity 
          style={s.docsHubHeroCard} 
          onPress={() => navTo('AdminDocsManager')} 
          activeOpacity={0.85}
        >
          <View style={s.docsHubTopRow}>
            <View style={s.docsHubIconWrap}>
              <FolderGit2 size={24} color={C.gold} />
            </View>
            <View style={s.docsHubBadge}>
              <Text style={s.docsHubBadgeText}>DEDICATED MODULE</Text>
            </View>
          </View>

          <Text style={s.docsHubTitle}>Files & Reports Manager</Text>
          <Text style={s.docsHubSub}>
            Scroll, read & live-edit all 19 project status files, specifications, PRDs, and architecture reports directly.
          </Text>

          <View style={s.docsHubBottomRow}>
            <View style={s.docsHubStatsPill}>
              <FileText size={12} color={C.gold} />
              <Text style={s.docsHubStatsText}>19 Documents Active</Text>
            </View>
            <View style={s.docsHubActionWrap}>
              <Text style={s.docsHubActionText}>Open Files Hub</Text>
              <ChevronRight size={15} color={C.gold} />
            </View>
          </View>
        </TouchableOpacity>

        {/* ── ADMIN QUICK MODULES BAR ── */}
        <View style={s.adminQuickBar}>
          <TouchableOpacity style={s.adminQuickItem} onPress={() => navTo('AdminDocsManager')} activeOpacity={0.75}>
            <View style={[s.adminQuickIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.16)', borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
              <FileText size={18} color="#F59E0B" />
            </View>
            <Text style={s.adminQuickLabel}>Docs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.adminQuickItem} onPress={() => navTo('AdminUserManagement')} activeOpacity={0.75}>
            <View style={[s.adminQuickIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.16)', borderColor: 'rgba(59, 130, 246, 0.4)' }]}>
              <Users size={18} color="#3B82F6" />
            </View>
            <Text style={s.adminQuickLabel}>Users</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.adminQuickItem} onPress={() => navTo('AdminPayments')} activeOpacity={0.75}>
            <View style={[s.adminQuickIconBox, { backgroundColor: 'rgba(234, 179, 8, 0.16)', borderColor: 'rgba(234, 179, 8, 0.4)' }]}>
              <CreditCard size={18} color="#EAB308" />
            </View>
            <Text style={s.adminQuickLabel}>Payments</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.adminQuickItem} onPress={() => navTo('AdminMessages')} activeOpacity={0.75}>
            <View style={[s.adminQuickIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.16)', borderColor: 'rgba(16, 185, 129, 0.4)' }]}>
              <MessageSquare size={18} color="#10B981" />
            </View>
            <Text style={s.adminQuickLabel}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.adminQuickItem} onPress={() => navTo('AdminSecurityControls')} activeOpacity={0.75}>
            <View style={[s.adminQuickIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.16)', borderColor: 'rgba(139, 92, 246, 0.4)' }]}>
              <ShieldCheck size={18} color="#8B5CF6" />
            </View>
            <Text style={s.adminQuickLabel}>Security</Text>
          </TouchableOpacity>
        </View>

        {/* Khata Book – Bright Golden Shimmer Hero Card (Exact Screenshot 2 Match) */}
        <TouchableOpacity style={s.khataCard} onPress={() => navTo('KhataBook')} activeOpacity={0.85}>
          {/* Liquid Gold Gradient with Smooth Curved Silk Highlights */}
          <View style={[StyleSheet.absoluteFill, s.khataCardBg]}>
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
              <Defs>
                {/* Base Warm Liquid Amber Gold Gradient */}
                <LinearGradient id="khataBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#120D04" stopOpacity="0.98" />
                  <Stop offset="24%" stopColor="#241805" stopOpacity="0.96" />
                  <Stop offset="58%" stopColor="#62430A" stopOpacity="0.94" />
                  <Stop offset="85%" stopColor="#B2831E" stopOpacity="0.92" />
                  <Stop offset="100%" stopColor="#D6A42E" stopOpacity="0.90" />
                </LinearGradient>
                {/* Luminous Curved Silk Wave Gradient */}
                <LinearGradient id="waveSilkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="rgba(255, 220, 110, 0.0)" />
                  <Stop offset="30%" stopColor="rgba(255, 215, 90, 0.15)" />
                  <Stop offset="70%" stopColor="rgba(255, 215, 90, 0.35)" />
                  <Stop offset="100%" stopColor="rgba(255, 220, 110, 0.15)" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" rx={22} fill="url(#khataBaseGrad)" />

              {/* Sweeping Parabolic Silk Wave */}
              <Path
                d="M 80 140 C 180 135 250 85 360 25 C 385 14 410 5 440 0 L 440 140 Z"
                fill="url(#waveSilkGrad)"
              />

              {/* Delicate Parallel Golden Silk Mesh Lines */}
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

          {/* Left Solid Golden Icon Container */}
          <View style={s.khataIconWrap}>
            <SolidGoldBookIcon size={32} />
          </View>

          {/* High-Contrast Texts */}
          <View style={s.khataContent}>
            <Text style={s.khataTitle}>Khata Book</Text>
            <Text style={s.khataSub}>Personal Ledger & Transactions</Text>
          </View>

          {/* Right Circular Gold Arrow Button */}
          <View style={s.khataArrowBadge}>
            <ChevronRight size={20} color="#FBBF24" strokeWidth={2.6} />
          </View>
        </TouchableOpacity>

        {/* Section Header with Sleek Accent Line */}
        <View style={s.sectionHeaderRow}>
          <Text style={s.sectionHeader}>PERSONAL WORKSPACE</Text>
          <View style={s.sectionLine} />
        </View>

        {/* 2-Column Responsive Grid */}
        <View style={s.grid}>
          {APP_MODULES.map((m, i) => (
            <ModuleCard 
              key={i}
              cardWidth={cardWidth} 
              icon={m.icon} 
              title={m.label} 
              sub={m.sub} 
              color={m.color} 
              onPress={() => navTo(m.route)} 
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#06080D',
  },
  scroll: { 
    paddingTop: 16, 
    paddingBottom: 100,
  },

  // ── Admin Header Block ──
  switchBackUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBBF24',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 14,
    gap: 8,
  },
  switchBackUserText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  adminHeaderBlock: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  adminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(240, 165, 0, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.3)',
  },
  adminBadgeText: {
    color: C.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  adminStatusTag: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  adminTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  adminSubtitle: {
    color: '#8E9BAE',
    fontSize: 12.5,
    marginTop: 2,
  },

  // ── Dedicated Files Hub Hero Card ──
  docsHubHeroCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(240, 165, 0, 0.5)',
    backgroundColor: '#121622',
    overflow: 'hidden',
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
    ...(Platform.OS === 'web' ? {
      backgroundImage: 'linear-gradient(135deg, rgba(28, 22, 10, 0.95) 0%, rgba(14, 18, 26, 0.98) 60%, rgba(10, 14, 22, 1) 100%)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 20px rgba(240, 165, 0, 0.15)',
    } : {}),
  },
  docsHubTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  docsHubIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(240, 165, 0, 0.15)',
    borderWidth: 1.2,
    borderColor: 'rgba(240, 165, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docsHubBadge: {
    backgroundColor: 'rgba(240, 165, 0, 0.18)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: 'rgba(240, 165, 0, 0.4)',
  },
  docsHubBadgeText: {
    color: C.gold,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  docsHubTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  docsHubSub: {
    color: '#A0AEC0',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  docsHubBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  docsHubStatsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  docsHubStatsText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  docsHubActionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docsHubActionText: {
    color: C.gold,
    fontSize: 12.5,
    fontWeight: '800',
  },

  // ── Admin Quick Modules Bar ──
  adminQuickBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  adminQuickItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(18, 22, 32, 0.75)',
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  adminQuickIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  adminQuickLabel: {
    color: '#CBD5E0',
    fontSize: 10.5,
    fontWeight: '700',
  },
  
  // ── Khata Hero Card (Bright Gold Gradient & Glowing Border) ──
  khataCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginHorizontal: 16, 
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
    fontSize: 21.5, 
    fontWeight: '900', 
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

  // ── Section Header ──
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

  // ── 2-Column Responsive Grid ──
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    rowGap: 12,
  },
  
  // ── Enclosed Luxury Module Card ──
  moduleCard: { 
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
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: { 
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center', 
    justifyContent: 'center',
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
