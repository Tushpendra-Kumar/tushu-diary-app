import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import { useThemeVersion } from '../../../context/ThemeContext';

import { 
  Users, UserPlus, ShieldAlert, ChevronRight, Gem,
  Shield, KeyRound, Cloud, Database, BellPlus, CalendarDays,
  Search, LayoutDashboard, PieChart, Lightbulb, FileDown,
  Link, Music, Archive, Palette, FolderGit2, FileText, MessageSquare,
  Crown, Lock, CheckCircle2, Sparkles
} from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import { AppLockContext } from '../../../context/AppLockContext';
import ParticleBackground from '../../../components/ParticleBackground';
import { fetchUsers } from '../../../services/adminApi';
import { useFocusEffect } from '@react-navigation/native';

const StatCard = ({ icon: Icon, title, value, color, onPress }) => (
  <TouchableOpacity style={[s.statCard, { borderColor: color ? color + '40' : 'rgba(255,255,255,0.08)' }]} onPress={onPress} activeOpacity={0.7}>
    <View style={[s.statIconWrap, { backgroundColor: (color || C.gold) + '18', borderColor: (color || C.gold) + '30' }]}>
      <Icon size={22} color={color} />
    </View>
    <Text style={[s.statValue, { color }]}>{value}</Text>
    <Text style={s.statTitle}>{title}</Text>
  </TouchableOpacity>
);

const PremiumCategory = ({ title, features, navigation, requireAuthForModule, isPremiumUser }) => (
  <View style={s.categoryContainer}>
    <Text style={s.categoryTitle}>{title}</Text>
    {features.map((item, i) => {
      const isWallet = item.label === 'Premium Private Wallet';
      return (
        <TouchableOpacity 
          key={i} 
          style={[s.featureCard, isWallet && s.featuredWalletCard]} 
          activeOpacity={0.75}
          onPress={() => {
            if (!isPremiumUser) {
              navigation.navigate('PremiumUpgrade');
              return;
            }
            if(item.label === 'Premium Private Vault' || item.label === 'Premium Private Wallet') {
                requireAuthForModule('PrivateWalletDashboard', () => navigation.navigate('PrivateWalletDashboard'));
            } else if(item.label === 'App Lock & Advanced Privacy') {
                navigation.navigate('AppLockSettings');
            } else if(item.label === 'Advanced Backup & Sync') {
                navigation.navigate('AdvancedBackupSync');
            } else if(item.label === 'Extra Storage & Attachments') {
                navigation.navigate('ExtraStorage');
            } else if(item.label === 'Advanced Reminders') {
                navigation.navigate('AdvancedReminders');
            } else if(item.label === 'Advanced Calendar') {
                navigation.navigate('AdvancedCalendar');
            } else if(item.label === 'Advanced Search') {
                navigation.navigate('AdvancedSearch');
            } else if(item.label === 'Advanced Home Dashboard') {
                navigation.navigate('AdvancedHomeDashboard');
            } else if(item.label === 'Advanced Analytics') {
                navigation.navigate('AdvancedAnalytics');
            } else if(item.label === 'Smart Insights') {
                navigation.navigate('SmartInsights');
            } else if(item.label === 'Export & Reports') {
                navigation.navigate('ExportReports');
            } else if(item.label === 'Advanced Website & Link Manager') {
                navigation.navigate('AdvancedWebsiteManager');
            } else if(item.label === 'My Music — Advanced') {
                navigation.navigate('MyMusicAdvanced');
            } else if(item.label === 'Advanced Data Management') {
                navigation.navigate('AdvancedDataManagement');
            } else if(item.label === 'Premium Personalization') {
                navigation.navigate('PremiumPersonalization');
            } else {
                navigation.navigate('ComingSoon', { title: item.label });
            }
          }}
        >
          <View style={[
            s.featureIconWrap, 
            { 
              backgroundColor: isWallet ? 'rgba(240, 165, 0, 0.15)' : (item.color + '18'), 
              borderColor: isWallet ? 'rgba(240, 165, 0, 0.35)' : (item.color + '30') 
            }
          ]}>
            <item.icon size={22} color={isWallet ? C.gold : item.color} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[s.featureLabel, isWallet && s.featuredWalletLabel]}>{item.label}</Text>
              {!isPremiumUser && (
                <View style={s.lockBadgePill}>
                  <Text style={s.lockBadgeText}>₹499</Text>
                </View>
              )}
            </View>
          </View>
          {!isPremiumUser ? (
            <Lock size={15} color={C.gold} />
          ) : (
            <ChevronRight size={16} color={isWallet ? C.gold : "rgba(255, 255, 255, 0.35)"} />
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

export default function FamilyScreen({ navigation }) {
  useThemeVersion(); // Re-renders on accent/theme changes
  const { user } = useContext(AuthContext);
  const { requireAuthForModule } = useContext(AppLockContext);
  const isAdmin = user?.role === 'ADMIN' && (
    (user?.email && user.email.toLowerCase().trim() === 'tushpendrakumar@gmail.com') ||
    (user?.user_id && user.user_id.toLowerCase().trim() === 'tushpendrakumar')
  );
  const isPremiumUser = Boolean(user?.is_premium) || isAdmin;

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  const loadStats = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetchUsers();
      if (res.success && res.data) {
        const total = res.data.length;
        const active = res.data.filter(u => u.status === 'ACTIVE').length;
        setStats({ total, active, inactive: total - active });
      }
    } catch (e) { }
  };

  useFocusEffect(useCallback(() => { loadStats(); }, [isAdmin]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const premiumStructure = [
    {
      title: 'SECURITY & PRIVACY',
      features: [
        { icon: Shield, label: 'Premium Private Wallet', color: '#F0A500' },
        { icon: KeyRound, label: 'App Lock & Advanced Privacy', color: '#26A69A' }
      ]
    },
    {
      title: 'BACKUP & STORAGE',
      features: [
        { icon: Cloud, label: 'Advanced Backup & Sync', color: '#42A5F5' },
        { icon: Database, label: 'Extra Storage & Attachments', color: '#AB47BC' }
      ]
    },
    {
      title: 'SMART PRODUCTIVITY',
      features: [
        { icon: BellPlus, label: 'Advanced Reminders', color: '#FFA726' },
        { icon: CalendarDays, label: 'Advanced Calendar', color: '#F06292' },
        { icon: Search, label: 'Advanced Search', color: '#26A69A' },
        { icon: LayoutDashboard, label: 'Advanced Home Dashboard', color: '#5C6BC0' }
      ]
    },
    {
      title: 'INSIGHTS & REPORTS',
      features: [
        { icon: PieChart, label: 'Advanced Analytics', color: '#42A5F5' },
        { icon: Lightbulb, label: 'Smart Insights', color: '#FFCA28' },
        { icon: FileDown, label: 'Export & Reports', color: '#66BB6A' }
      ]
    },
    {
      title: 'PERSONAL TOOLS',
      features: [
        { icon: Link, label: 'Advanced Website & Link Manager', color: '#29B6F6' },
        { icon: Music, label: 'My Music — Advanced', color: '#FF7043' },
        { icon: Archive, label: 'Advanced Data Management', color: '#AB47BC' }
      ]
    },
    {
      title: 'PERSONALIZATION',
      features: [
        { icon: Palette, label: 'Premium Personalization', color: '#EC407A' }
      ]
    }
  ];

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      <ScrollView 
        contentContainerStyle={s.scroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
      >
        {isAdmin && <Text style={s.sectionTitle}>ADMIN WORKPLACE</Text>}
        
        {isAdmin ? (
          <>
            <View style={s.greetingBlock}>
              <Text style={s.greetingSub}>Welcome Back,</Text>
              <Text style={s.greetingName}>Admin {user?.full_name}</Text>
            </View>
            <View style={s.statsContainer}>
              <StatCard icon={Users}       title="TOTAL USERS" value={stats.total}  color={C.gold}   onPress={() => navigation.navigate('AdminUserManagement')} />
              <StatCard icon={ShieldAlert}  title="ACTIVE"      value={stats.active} color="#4CAF50"  onPress={() => navigation.navigate('AdminUserManagement', { filter: 'ACTIVE' })} />
              <StatCard icon={UserPlus}    title="ADD USER"    value="+"             color="#2196F3"  onPress={() => navigation.navigate('AddUserScreen')} />
            </View>

            {/* ── Files & Reports Hub Card for Admin Workplace ── */}
            <TouchableOpacity 
              style={s.docsHubAdminCard} 
              onPress={() => navigation.navigate('AdminDocsManager')}
              activeOpacity={0.82}
            >
              <View style={s.docsHubLeftWrap}>
                <View style={s.docsHubIcon}>
                  <FolderGit2 size={24} color={C.gold} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={s.docsTagRow}>
                    <Text style={s.docsTagText}>PROJECT REPOSITORY & SPECS</Text>
                  </View>
                  <Text style={s.docsCardTitle}>Files & Documentation Hub</Text>
                  <Text style={s.docsCardSub}>Browse, read & live-edit all 19 project status files, reports & specifications</Text>
                </View>
              </View>
              <View style={s.docsArrowWrap}>
                <ChevronRight size={18} color={C.gold} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={s.adminBtn} onPress={() => navigation.navigate('AdminUserManagement')} activeOpacity={0.8}>
              <ShieldAlert size={20} color={C.gold} />
              <Text style={s.adminBtnText}>Manage All Users (Admin)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[s.adminBtn, { borderColor: 'rgba(16, 185, 129, 0.45)' }]} onPress={() => navigation.navigate('AdminMessages')} activeOpacity={0.8}>
              <MessageSquare size={20} color="#10B981" />
              <Text style={[s.adminBtnText, { color: '#10B981' }]}>Support & User Messages</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={s.premiumHero}>
            {/* VIP Lifetime Banner */}
            {!isPremiumUser ? (
              <TouchableOpacity
                style={s.upgradeHeroCard}
                onPress={() => navigation.navigate('PremiumUpgrade')}
                activeOpacity={0.85}
              >
                <View style={s.upgradeTopRow}>
                  <View style={s.upgradeIconBox}>
                    <Crown size={24} color={C.gold} />
                  </View>
                  <View style={s.upgradePricePill}>
                    <Text style={s.upgradePriceText}>₹499 ONE-TIME</Text>
                  </View>
                </View>
                <Text style={s.upgradeHeroTitle}>Upgrade to Lifetime Premium</Text>
                <Text style={s.upgradeHeroSub}>
                  Unlock Private Wallet, Biometric App Lock, Cloud Backup, Analytics & Reports forever. No subscriptions!
                </Text>
                <View style={s.upgradeHeroActionRow}>
                  <Text style={s.upgradeHeroActionText}>Get Lifetime VIP Access</Text>
                  <ChevronRight size={16} color="#000" />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={s.lifetimeActiveCard}>
                <View style={s.lifetimeActiveIconWrap}>
                  <Crown size={24} color={C.gold} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.lifetimeActiveTitle}>👑 Lifetime VIP Active</Text>
                  <Text style={s.lifetimeActiveSub}>
                    Permanent access unlocked. All updates & features included forever.
                  </Text>
                </View>
              </View>
            )}

            <View style={s.heroIconWrap}>
              <Gem size={34} color={C.gold} />
            </View>
            <Text style={s.heroTitle}>Premium Tools</Text>
            <Text style={s.heroDesc}>
              {isPremiumUser 
                ? 'All luxury vaults, privacy locks & analytics are unlocked.' 
                : 'Free tier active. Tap any tool below to upgrade to Lifetime VIP.'}
            </Text>
            
            <View style={s.premiumList}>
              {premiumStructure.map((cat, idx) => (
                <PremiumCategory 
                  key={idx} 
                  title={cat.title} 
                  features={cat.features} 
                  navigation={navigation} 
                  requireAuthForModule={requireAuthForModule}
                  isPremiumUser={isPremiumUser}
                />
              ))}
            </View>
          </View>
        )}

        <SecurityFooter style={{ marginTop: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  sectionTitle: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#8E8E93', 
    letterSpacing: 1.8, 
    textTransform: 'uppercase', 
    marginBottom: 14 
  },
  
  greetingBlock: { marginBottom: 20 },
  greetingSub:   { color: '#8E8E93', fontSize: 11, fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase' },
  greetingName:  { color: C.gold, fontSize: 26, fontWeight: '800', marginTop: 4 },
  
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { 
    flex: 1, 
    backgroundColor: 'rgba(255, 255, 255, 0.035)', 
    borderRadius: 16, 
    padding: 14, 
    alignItems: 'center', 
    marginHorizontal: 4, 
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  statTitle: { fontSize: 10, color: '#8E8E93', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  
  adminBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(22, 19, 13, 0.92)',
    padding: 16, 
    borderRadius: 16, 
    justifyContent: 'center', 
    marginTop: 10,
    borderWidth: 1.5, 
    borderColor: 'rgba(240, 165, 0, 0.45)',
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  adminBtnText: { color: C.gold, fontWeight: '800', marginLeft: 10, fontSize: 15, letterSpacing: 0.3 },
  
  // Premium specific styles
  premiumHero: { alignItems: 'center', marginTop: 8 },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(240, 165, 0, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(240, 165, 0, 0.40)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTitle: { fontSize: 32, fontWeight: '800', color: C.white, marginBottom: 8, letterSpacing: 0.3 },
  heroDesc: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginBottom: 28, paddingHorizontal: 16, lineHeight: 21, fontWeight: '500' },
  
  premiumList: { width: '100%' },
  categoryContainer: { marginBottom: 24 },
  categoryTitle: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#8E8E93', 
    letterSpacing: 1.8, 
    textTransform: 'uppercase', 
    marginBottom: 12, 
    marginLeft: 2 
  },
  
  featureCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.035)', 
    borderRadius: 16, 
    padding: 14, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  featuredWalletCard: {
    backgroundColor: 'rgba(22, 19, 13, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(240, 165, 0, 0.45)',
    borderRadius: 18,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIconWrap: { 
    width: 44, 
    height: 44, 
    borderRadius: 13, 
    borderWidth: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  featureLabel: { color: C.white, fontSize: 14.5, fontWeight: '700', letterSpacing: 0.2 },
  featuredWalletLabel: { color: C.gold, fontWeight: '800' },

  lockBadgePill: {
    backgroundColor: 'rgba(240, 165, 0, 0.16)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 0.8,
    borderColor: 'rgba(240, 165, 0, 0.35)',
  },
  lockBadgeText: { color: C.gold, fontSize: 9.5, fontWeight: '800' },

  // Upgrade Hero Card for Free Users
  upgradeHeroCard: {
    width: '100%',
    backgroundColor: '#121622',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(240, 165, 0, 0.55)',
    padding: 18,
    marginBottom: 22,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  upgradeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  upgradeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(240, 165, 0, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradePricePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  upgradePriceText: { color: '#10B981', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  upgradeHeroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  upgradeHeroSub: { color: '#A0AEC0', fontSize: 12, lineHeight: 18, marginBottom: 14 },
  upgradeHeroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.gold,
    borderRadius: 12,
    paddingVertical: 12,
  },
  upgradeHeroActionText: { color: '#000000', fontSize: 13.5, fontWeight: '900' },

  // Active Lifetime Card
  lifetimeActiveCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#10B981',
    padding: 16,
    marginBottom: 20,
  },
  lifetimeActiveIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(240, 165, 0, 0.15)',
    borderWidth: 1,
    borderColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifetimeActiveTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  lifetimeActiveSub: { color: '#A0AEC0', fontSize: 11.5, lineHeight: 16 },

  // Docs Hub Card for Admin Workplace
  docsHubAdminCard: {
    backgroundColor: 'rgba(18, 22, 32, 0.95)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(240, 165, 0, 0.5)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  docsHubLeftWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  docsHubIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(240, 165, 0, 0.15)',
    borderWidth: 1.2,
    borderColor: 'rgba(240, 165, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docsTagRow: { marginBottom: 3 },
  docsTagText: { color: C.gold, fontSize: 9.5, fontWeight: '800', letterSpacing: 1.1 },
  docsCardTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  docsCardSub: { color: '#A0AEC0', fontSize: 11.5, lineHeight: 16 },
  docsArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(240, 165, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
