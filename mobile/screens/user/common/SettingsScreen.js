import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert, Platform } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as notifService from '../../../services/notificationService';
import * as dataService from '../../../services/personalDataService';
import { C } from '../../../constants/theme';
import { 
  User, Camera, Pencil, Bell, ShieldCheck, Lock, KeyRound, Users, Calendar, Wallet, Database, HardDrive, Languages, 
  HelpCircle, Info, Settings, UserCog, UserRoundCog, Shield, ClipboardList, LogOut, ChevronRight, BookMarked, MessageSquare, FolderGit2, CreditCard, Gem,
  DownloadCloud
} from 'lucide-react-native';
import { checkForAppUpdates, CURRENT_VERSION } from '../../../services/updateService';
import AppUpdatesCard from '../../../components/AppUpdatesCard';
import SecurityFooter from '../../../components/SecurityFooter';
import ParticleBackground from '../../../components/ParticleBackground';

const SectionTitle = ({ title }) => (
  <Text style={s.sectionTitle}>{title}</Text>
);

const SettingRow = ({ icon: Icon, title, desc, onPress }) => (
  <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
    <View style={s.iconWrap}>
      <Icon size={20} color={C.white} />
    </View>
    <View style={s.rowContent}>
      <Text style={s.rowTitle}>{title}</Text>
      {desc ? <Text style={s.rowDesc}>{desc}</Text> : null}
    </View>
    <ChevronRight size={18} color={C.textMuted} />
  </TouchableOpacity>
);

const SettingToggle = ({ title, desc, value, onValueChange }) => (
  <View style={s.row}>
    <View style={s.rowContent}>
      <Text style={s.rowTitle}>{title}</Text>
      {desc ? <Text style={s.rowDesc}>{desc}</Text> : null}
    </View>
    <Switch 
      value={value} 
      onValueChange={onValueChange} 
      trackColor={{ false: '#333', true: C.gold }}
      thumbColor={C.white}
    />
  </View>
);

const Divider = () => <View style={s.divider} />;

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN' && (
    (user?.email && user.email.toLowerCase().trim() === 'tushpendrakumar@gmail.com') ||
    (user?.user_id && user.user_id.toLowerCase().trim() === 'tushpendrakumar')
  );
  const hasKhata = user?.has_khata;

  const [toggles, setToggles] = useState({
    taskReminders: true,
    bdayReminders: true,
    expenseReminders: false,
    khataReminders: true
  });

  useEffect(() => {
    if (user?.user_id) {
      AsyncStorage.getItem(`tushu_${user.user_id}_notif_settings`).then(saved => {
        if (saved) setToggles(JSON.parse(saved));
      }).catch(()=>{});
    }
  }, [user?.user_id]);

  const handleToggle = async (key) => {
    const newToggles = { ...toggles, [key]: !toggles[key] };
    setToggles(newToggles);
    if (user?.user_id) {
      await AsyncStorage.setItem(`tushu_${user.user_id}_notif_settings`, JSON.stringify(newToggles));
      if (Platform.OS !== 'web') {
        notifService.initializeNotifications(user.user_id, dataService);
      }
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Log out of your account?')) logout();
    } else {
      Alert.alert('Log Out', 'Log out of your account?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout }
      ]);
    }
  };

  const navTo = (route) => navigation.navigate(route);

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        
        {/* NORMAL USER SETTINGS */}
        
        <SectionTitle title="ACCOUNT" />
        <View style={s.card}>
          <SettingRow icon={User} title="Personal Information" desc="View your account details" onPress={() => navTo('PersonalInfo')} />
          <Divider />
          <SettingRow icon={User} title="My Profile" desc="View and manage your profile" onPress={() => navTo('MyProfileSettings')} />
        </View>

        <SectionTitle title="NOTIFICATIONS" />
        <View style={s.card}>
          <SettingToggle title="Task Reminders" desc="Get reminded for daily tasks" value={toggles.taskReminders} onValueChange={() => handleToggle('taskReminders')} />
          <Divider />
          <SettingToggle title="Birthday Reminders" desc="Get reminders before birthdays" value={toggles.bdayReminders} onValueChange={() => handleToggle('bdayReminders')} />
          <Divider />
          <SettingToggle title="Expense Reminders" desc="Reminders for pending bills" value={toggles.expenseReminders} onValueChange={() => handleToggle('expenseReminders')} />
        </View>

        <SectionTitle title="PRIVACY & SECURITY" />
        <View style={s.card}>
          <SettingRow icon={KeyRound} title="Change Password" desc="Update your security key" onPress={() => navTo('ChangePassword')} />
          <Divider />
          <SettingRow icon={ShieldCheck} title="Account Privacy" desc="Control your data visibility" onPress={() => navTo('AccountPrivacy')} />
          
        </View>

        {hasKhata && (
          <>
            <SectionTitle title="KHATA SETTINGS" />
            <View style={s.card}>
              <SettingRow icon={BookMarked} title="Expense Categories" desc="Manage your ledger categories" onPress={() => navTo('ExpenseCategories')} />
              <Divider />
              <SettingToggle title="Khata Reminders" desc="Get reminded to collect dues" value={toggles.khataReminders} onValueChange={() => handleToggle('khataReminders')} />
            </View>
          </>
        )}

        <SectionTitle title="MEMBERSHIP & ACCESS" />
        <View style={s.card}>
          <SettingRow 
            icon={Gem} 
            title={user?.is_premium ? "👑 Lifetime VIP Active" : "Upgrade to Lifetime VIP (₹499)"} 
            desc={user?.is_premium ? "Lifetime access unlocked across all updates" : "One-time payment for lifetime access to all 21+ tools"} 
            onPress={() => navTo('PremiumUpgrade')} 
          />
        </View>

        <SectionTitle title="FAMILY SETTINGS" />
        <View style={s.card}>
          <SettingRow icon={Users} title="Family Notifications" desc="Preferences for shared events" onPress={() => navTo('FamilyNotifications')} />
          <Divider />
          <SettingRow icon={Calendar} title="Event Reminders" desc="Family gatherings & dates" onPress={() => navTo('EventReminders')} />
        </View>

        <SectionTitle title="DATA & STORAGE" />
        <View style={s.card}>
          
          <SettingRow icon={Database} title="Recycle Bin" desc="Recover deleted files before permanent deletion" onPress={() => navTo('RecycleBin')} />
        </View>

        <SectionTitle title="LANGUAGE" />
        <View style={s.card}>
          <SettingRow icon={Languages} title="App Language" desc="English" onPress={() => navTo('AppLanguage')} />
        </View>

        <SectionTitle title="HELP & SUPPORT" />
        <View style={s.card}>
          <SettingRow icon={HelpCircle} title="Help Center" desc="Guides and FAQ" onPress={() => navTo('HelpCenter')} />
          <Divider />
          
          <SettingRow icon={User} title="Contact Admin" desc="Reach out to your family admin" onPress={() => navTo('ContactAdmin')} />
        </View>

        <SectionTitle title="APP UPDATES (LIVE OTA & GITHUB RELEASES)" />
        <AppUpdatesCard style={{ marginBottom: 16 }} />

        <SectionTitle title="ABOUT APP" />
        <View style={s.card}>
          <SettingRow icon={Info} title="Terms of Service" onPress={() => navTo('TermsOfService')} />
          <Divider />
          <SettingRow icon={ShieldCheck} title="Privacy Policy" onPress={() => navTo('PrivacyPolicy')} />
          <Divider />
          <View style={s.aboutRow}>
            <Shield size={32} color={C.gold} />
            <View style={{ marginLeft: 16 }}>
              <Text style={s.aboutTitle}>TushuDiary</Text>
              <Text style={s.aboutDesc}>Your Life, Your Diary.</Text>
              <Text style={s.aboutPowered}>CodeByTushu • v{CURRENT_VERSION}</Text>
            </View>
          </View>
        </View>

        {isAdmin && (
          <>
            <View style={s.adminBanner}>
              <Text style={s.adminBannerText}>ADMINISTRATOR SETTINGS</Text>
            </View>

            <SectionTitle title="ADMIN - LIFETIME PAYMENTS & REVENUE" />
            <View style={s.card}>
              <SettingRow icon={CreditCard} title="Payments & Subscriptions" desc="Verify ₹499 UPI payments, UTRs & configure UPI ID" onPress={() => navTo('AdminPayments')} />
            </View>

            <SectionTitle title="ADMIN - FILES & DOCUMENTATION" />
            <View style={s.card}>
              <SettingRow icon={FolderGit2} title="Files & Documentation Hub" desc="Read, review & live-edit 19 reports and specs" onPress={() => navTo('AdminDocsManager')} />
            </View>

            <SectionTitle title="ADMIN - MESSAGES & SUPPORT" />
              <View style={s.card}>
                <SettingRow icon={MessageSquare} title="Support Messages" desc="Reply to user queries" onPress={() => navTo('AdminMessages')} />
              </View>

              <SectionTitle title="ADMIN - USER MANAGEMENT" />
            <View style={s.card}>
              <SettingRow icon={Users} title="User Management" desc="11 Family Members" onPress={() => navTo('AdminUserManagement')} />
            </View>

            <SectionTitle title="ADMIN - FAMILY MANAGEMENT" />
            <View style={s.card}>
              <SettingRow icon={UserCog} title="Family Management" desc="Manage structure & connections" onPress={() => navTo('AdminFamilyManagement')} />
            </View>

            <SectionTitle title="ADMIN - ROLES & PERMISSIONS" />
            <View style={s.card}>
              <SettingRow icon={UserRoundCog} title="Roles & Permissions" desc="Control access and features" onPress={() => navTo('AdminRolesPermissions')} />
            </View>

            <SectionTitle title="ADMIN - NOTIFICATION MANAGEMENT" />
            <View style={s.card}>
              <SettingRow icon={Bell} title="Global Notifications" desc="Manage app-wide alerts" onPress={() => navTo('AdminGlobalNotifications')} />
            </View>

            <SectionTitle title="ADMIN - KHATA MANAGEMENT" />
            <View style={s.card}>
              <SettingRow icon={Wallet} title="Khata Configuration" desc="Ledger settings and access" onPress={() => navTo('AdminKhataConfig')} />
            </View>

            <SectionTitle title="ADMIN - APP SETTINGS" />
            <View style={s.card}>
              <SettingRow icon={Settings} title="Application Settings" desc="Global app preferences" onPress={() => navTo('AdminAppSettings')} />
            </View>

            <SectionTitle title="ADMIN - SECURITY SETTINGS" />
            <View style={s.card}>
              <SettingRow icon={Shield} title="Security Controls" desc="Authentication and policies" onPress={() => navTo('AdminSecurityControls')} />
            </View>

            <SectionTitle title="ADMIN - BACKUP & DATA" />
            <View style={s.card}>
              <SettingRow icon={Database} title="Backup & Restore" desc="Manage database exports" onPress={() => navTo('AdminBackupRestore')} />
            </View>

            <SectionTitle title="ADMIN - ACTIVITY LOGS" />
            <View style={s.card}>
              <SettingRow icon={ClipboardList} title="Audit & Activity Logs" desc="View system events" onPress={() => navTo('AdminActivityLogs')} />
            </View>
          </>
        )}

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={20} color={C.error} />
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <SecurityFooter style={{ marginTop: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#06080D' },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5, marginLeft: 8, marginBottom: 8, marginTop: 24 },
  card: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  rowContent: { flex: 1, paddingRight: 16 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: C.white, marginBottom: 2 },
  rowDesc: { fontSize: 12, color: C.textMuted },
  divider: { height: 1, backgroundColor: C.border, marginLeft: 66 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  aboutTitle: { fontSize: 16, fontWeight: '800', color: C.gold, marginBottom: 4 },
  aboutDesc: { fontSize: 13, color: C.textSecondary, marginBottom: 2 },
  aboutPowered: { fontSize: 11, color: C.textMuted },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(244, 67, 54, 0.1)', padding: 16, borderRadius: 14, marginTop: 40, borderWidth: 1, borderColor: 'rgba(244, 67, 54, 0.3)' },
  logoutText: { color: C.error, fontWeight: '700', fontSize: 16 },
  adminBanner: { backgroundColor: 'rgba(240, 165, 0, 0.15)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: C.gold, alignItems: 'center', marginTop: 40, marginBottom: 10 },
  adminBannerText: { color: C.gold, fontSize: 12, fontWeight: '800', letterSpacing: 2 }
});



