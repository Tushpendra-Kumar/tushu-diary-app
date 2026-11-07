import React, { useContext, useEffect } from 'react';
import { useThemeVersion } from '../context/ThemeContext';

import * as notifService from '../services/notificationService';
import * as dataService from '../services/personalDataService';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { C } from '../constants/theme';
import { Home, Users, UserRound, Gem } from 'lucide-react-native';

import AppHeader from '../components/AppHeader';

// ─── Home Screens ───────────────────────────────────────────────────────────
import PublicHomeScreen from '../screens/user/PublicHomeScreen';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';

// ─── Common Screens ──────────────────────────────────────────────────────────
import PrivateWalletDashboardScreen from '../screens/user/common/PrivateWalletDashboardScreen';
import WalletCategoryScreen from '../screens/user/common/WalletCategoryScreen';
import WalletAddEditScreen from '../screens/user/common/WalletAddEditScreen';
import WalletRecycleBinScreen from '../screens/user/common/WalletRecycleBinScreen';
import AppLockSettingsScreen from '../screens/user/common/AppLockSettingsScreen';
import AdvancedBackupSyncScreen from '../screens/user/common/AdvancedBackupSyncScreen';
import ExtraStorageScreen from '../screens/user/common/ExtraStorageScreen';
import AdvancedRemindersScreen from '../screens/user/common/AdvancedRemindersScreen';
import AdvancedCalendarScreen from '../screens/user/common/AdvancedCalendarScreen';
import AdvancedSearchScreen from '../screens/user/common/AdvancedSearchScreen';
import AdvancedHomeDashboardScreen from '../screens/user/common/AdvancedHomeDashboardScreen';
import AdvancedAnalyticsScreen from '../screens/user/common/AdvancedAnalyticsScreen';
import SmartInsightsScreen from '../screens/user/common/SmartInsightsScreen';
import ExportReportsScreen from '../screens/user/common/ExportReportsScreen';
import AdvancedWebsiteManagerScreen from '../screens/user/common/AdvancedWebsiteManagerScreen';
import MyMusicAdvancedScreen from '../screens/user/common/MyMusicAdvancedScreen';
import AdvancedDataManagementScreen from '../screens/user/common/AdvancedDataManagementScreen';
import PremiumPersonalizationScreen from '../screens/user/common/PremiumPersonalizationScreen';
import PremiumUpgradeScreen from '../screens/user/common/PremiumUpgradeScreen';

import TaskManagerScreen from '../screens/user/common/TaskManagerScreen';
import QuickNotesScreen from '../screens/user/common/QuickNotesScreen';
import ProfileScreen from '../screens/user/common/ProfileScreen';
import FamilyScreen from '../screens/user/common/FamilyScreen';
import ComingSoonScreen from '../screens/user/common/ComingSoonScreen';
import FamilyEventsScreen from '../screens/user/common/FamilyEventsScreen';
import FamilyNoticeBoardScreen from '../screens/user/common/FamilyNoticeBoardScreen';
import BirthdayReminderScreen from '../screens/user/common/BirthdayReminderScreen';
import MediaVaultScreen from '../screens/user/common/MediaVaultScreen';
import ImportantDocumentsScreen from '../screens/user/common/ImportantDocumentsScreen';
import SettingsScreen from '../screens/user/common/SettingsScreen';
import WebsiteLinksScreen from '../screens/user/common/WebsiteLinksScreen';
import MyMusicScreen from '../screens/user/common/MyMusicScreen';
import PasswordVaultScreen from '../screens/user/common/PasswordVaultScreen';
import MoviesSeriesScreen from '../screens/user/common/MoviesSeriesScreen';

// ─── Gents Screens ───────────────────────────────────────────────────────────
import ExpenseTrackerScreen from '../screens/user/gents/ExpenseTrackerScreen';
import WorkTasksScreen from '../screens/user/gents/WorkTasksScreen';
import VehicleManagerScreen from '../screens/user/gents/VehicleManagerScreen';
import BillsPaymentsScreen from '../screens/user/gents/BillsPaymentsScreen';
import EMIReminderScreen from '../screens/user/gents/EMIReminderScreen';
import GoalsSavingsScreen from '../screens/user/gents/GoalsSavingsScreen';

// ─── Ladies Screens ──────────────────────────────────────────────────────────
import ShoppingListScreen from '../screens/user/ladies/ShoppingListScreen';
import MonthlyBudgetScreen from '../screens/user/ladies/MonthlyBudgetScreen';
import RecipesScreen from '../screens/user/ladies/RecipesScreen';
import MedicineReminderScreen from '../screens/user/ladies/MedicineReminderScreen';
import SelfCareGoalsScreen from '../screens/user/ladies/SelfCareGoalsScreen';

// ─── Khata Screens ───────────────────────────────────────────────────────────
import KhataScreen from '../screens/user/khata/KhataScreen';
import KhataContactScreen from '../screens/user/khata/KhataContactScreen';

// ─── Settings Screens ────────────────────────────────────────────────────────
import PersonalInfoScreen from '../screens/user/settings/PersonalInfoScreen';
import ChangePasswordScreen from '../screens/user/settings/ChangePasswordScreen';
import AccountPrivacyScreen from '../screens/user/settings/AccountPrivacyScreen';
import ExpenseCategoriesScreen from '../screens/user/settings/ExpenseCategoriesScreen';
import FamilyNotificationsScreen from '../screens/user/settings/FamilyNotificationsScreen';
import EventRemindersScreen from '../screens/user/settings/EventRemindersScreen';
import RecycleBinScreen from '../screens/user/settings/RecycleBinScreen';
import AppLanguageScreen from '../screens/user/settings/AppLanguageScreen';
import HelpCenterScreen from '../screens/user/settings/HelpCenterScreen';
import ContactAdminScreen from '../screens/user/settings/ContactAdminScreen';
import TermsOfServiceScreen from '../screens/user/settings/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../screens/user/settings/PrivacyPolicyScreen';

// ─── Admin Settings Screens ──────────────────────────────────────────────────
import UsersScreen from '../screens/admin/UsersScreen';
import AddUserScreen from '../screens/admin/AddUserScreen';
import EditUserScreen from '../screens/admin/EditUserScreen';
import UserDetailsScreen from '../screens/admin/UserDetailsScreen';
import AdminFamilyManagementScreen from '../screens/user/settings/AdminFamilyManagementScreen';
import AdminRolesPermissionsScreen from '../screens/user/settings/AdminRolesPermissionsScreen';
import AdminGlobalNotificationsScreen from '../screens/user/settings/AdminGlobalNotificationsScreen';
import AdminKhataConfigScreen from '../screens/user/settings/AdminKhataConfigScreen';
import AdminAppSettingsScreen from '../screens/user/settings/AdminAppSettingsScreen';
import AdminSecurityControlsScreen from '../screens/user/settings/AdminSecurityControlsScreen';
import AdminBackupRestoreScreen from '../screens/user/settings/AdminBackupRestoreScreen';
import AdminMessagesScreen from '../screens/user/settings/AdminMessagesScreen';
import AdminDocsManagerScreen from '../screens/admin/AdminDocsManagerScreen';
import AdminPaymentsScreen from '../screens/admin/AdminPaymentsScreen';

const isSuperAdmin = (u) => {
  if (!u || u.role !== 'ADMIN') return false;
  const email = (u.email || '').toLowerCase().trim();
  const userId = (u.user_id || '').toLowerCase().trim();
  return email === 'tushpendrakumar@gmail.com' || userId === 'tushpendrakumar';
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const stackOpts = {
  header: ({ navigation, route, options, back }) => {
    const title = options.title !== undefined ? options.title : route.name;
    const isMain = !back;
    return <AppHeader navigation={navigation} title={title} isMain={isMain} back={back} />;
  },
  contentStyle: { backgroundColor: 'transparent' },
};

// ─── HOME STACK ──────────────────────────────────────────────────────────────
function HomeStack() {
  const { user } = React.useContext(AuthContext);
  const isAdmin = isSuperAdmin(user);
  const HomeScreen = isAdmin ? AdminHomeScreen : PublicHomeScreen;
  const homeTitle = isAdmin ? 'Admin Portal' : 'Home';

  return (
    <Stack.Navigator screenOptions={stackOpts}>
      {/* Main Home */}
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: homeTitle }} />


      {/* ── Shared / Common ── */}
      <Stack.Screen name="TaskManager" component={TaskManagerScreen} options={{ title: 'Daily Planner' }} />
      <Stack.Screen name="QuickNotes" component={QuickNotesScreen} options={{ title: 'Quick Notes' }} />
      <Stack.Screen name="MediaVault" component={MediaVaultScreen} options={{ title: 'Media Vault' }} />
      <Stack.Screen name="ImportantDocuments" component={ImportantDocumentsScreen} options={{ title: 'Important Documents' }} />
      <Stack.Screen name="BirthdayReminder" component={BirthdayReminderScreen} options={{ title: 'Birthdays' }} />
      <Stack.Screen name="FamilyEvents" component={FamilyEventsScreen} options={{ title: 'Family Events' }} />
      <Stack.Screen name="FamilyNoticeBoard" component={FamilyNoticeBoardScreen} options={{ title: 'Notice Board' }} />

                  
      <Stack.Screen name="WebsiteLinks" component={WebsiteLinksScreen} options={{ title: 'Website Links' }} />
      <Stack.Screen name="MyMusic" component={MyMusicScreen} options={{ title: 'My Music' }} />
      <Stack.Screen name="PasswordVault" component={PasswordVaultScreen} options={{ title: 'Password Vault' }} />
      <Stack.Screen name="MoviesSeries" component={MoviesSeriesScreen} options={{ headerShown: false }} />

      {/* ── Ladies Modules ── */}
      <Stack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ title: 'Shopping List' }} />
      <Stack.Screen name="MonthlyBudget" component={MonthlyBudgetScreen} options={{ title: 'Monthly Budget' }} />
      <Stack.Screen name="Recipes" component={RecipesScreen} options={{ title: 'Recipes' }} />
      <Stack.Screen name="MedicineReminder" component={MedicineReminderScreen} options={{ title: 'Medicines & Appt.' }} />
      <Stack.Screen name="SelfCareGoals" component={SelfCareGoalsScreen} options={{ title: 'Self-Care Goals' }} />

      {/* ── Gents Modules ── */}
      <Stack.Screen name="ExpenseTracker" component={ExpenseTrackerScreen} options={{ title: 'Expense Tracker' }} />
      <Stack.Screen name="WorkTasks" component={WorkTasksScreen} options={{ title: 'Work Tasks' }} />
      <Stack.Screen name="VehicleManager" component={VehicleManagerScreen} options={{ title: 'Vehicle Manager' }} />
      <Stack.Screen name="BillsPayments" component={BillsPaymentsScreen} options={{ title: 'Bills & Payments' }} />
      <Stack.Screen name="EMIReminder" component={EMIReminderScreen} options={{ title: 'EMI Reminder' }} />
      <Stack.Screen name="GoalsSavings" component={GoalsSavingsScreen} options={{ title: 'Goals & Savings' }} />

      {/* ── Khata ── */}
      <Stack.Screen name="KhataBook" component={KhataScreen} options={{ title: 'Khata Book' }} />
      <Stack.Screen name="KhataContact" component={KhataContactScreen} options={{ title: 'Ledger' }} />

      {/* ── Utility ── */}
      <Stack.Screen name="ComingSoon" component={ComingSoonScreen} options={({ route }) => ({ title: route.params?.title || 'Coming Soon' })} />
                  

      {/* ── Settings (navigated from AppHeader) ── */}
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="MyProfileSettings" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} options={{ title: 'Personal Information' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
      <Stack.Screen name="AccountPrivacy" component={AccountPrivacyScreen} options={{ title: 'Account Privacy' }} />
      <Stack.Screen name="ExpenseCategories" component={ExpenseCategoriesScreen} options={{ title: 'Expense Categories' }} />
      <Stack.Screen name="FamilyNotifications" component={FamilyNotificationsScreen} options={{ title: 'Family Notifications' }} />
      <Stack.Screen name="EventReminders" component={EventRemindersScreen} options={{ title: 'Event Reminders' }} />
      <Stack.Screen name="RecycleBin" component={RecycleBinScreen} options={{ title: 'Recycle Bin' }} />
      <Stack.Screen name="AppLanguage" component={AppLanguageScreen} options={{ title: 'App Language' }} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ title: 'Help Center' }} />
      <Stack.Screen name="ContactAdmin" component={ContactAdminScreen} options={{ title: 'Contact Admin' }} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />

      {/* ── Admin Screens ── */}
      <Stack.Screen name="AdminUserManagement" component={UsersScreen} options={{ title: 'User Management' }} />
      <Stack.Screen name="AddUserScreen" component={AddUserScreen} options={{ title: 'Add New User' }} />
      <Stack.Screen name="EditUserScreen" component={EditUserScreen} options={{ title: 'Edit User' }} />
      <Stack.Screen name="UserDetailsScreen" component={UserDetailsScreen} options={{ title: 'User Details' }} />
      <Stack.Screen name="AdminFamilyManagement" component={AdminFamilyManagementScreen} options={{ title: 'Family Management' }} />
      <Stack.Screen name="AdminRolesPermissions" component={AdminRolesPermissionsScreen} options={{ title: 'Roles & Permissions' }} />
      <Stack.Screen name="AdminGlobalNotifications" component={AdminGlobalNotificationsScreen} options={{ title: 'Global Notifications' }} />
      <Stack.Screen name="AdminKhataConfig" component={AdminKhataConfigScreen} options={{ title: 'Khata Configuration' }} />
      <Stack.Screen name="AdminAppSettings" component={AdminAppSettingsScreen} options={{ title: 'Application Settings' }} />
      <Stack.Screen name="AdminSecurityControls" component={AdminSecurityControlsScreen} options={{ title: 'Security Controls' }} />
      <Stack.Screen name="AdminBackupRestore" component={AdminBackupRestoreScreen} options={{ title: 'Backup & Restore' }} />
      <Stack.Screen name="AdminActivityLogs" component={AdminActivityLogsScreen} options={{ title: 'Activity Logs' }} />
      <Stack.Screen name="AdminMessages" component={AdminMessagesScreen} options={{ title: 'Support Messages' }} />
      <Stack.Screen name="AdminDocsManager" component={AdminDocsManagerScreen} options={{ title: 'Files & Documentation Hub' }} />
      <Stack.Screen name="AdminPayments" component={AdminPaymentsScreen} options={{ title: 'Payments & Revenue' }} />
      <Stack.Screen name="PremiumUpgrade" component={PremiumUpgradeScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// ─── FAMILY STACK ─────────────────────────────────────────────────────────────
function FamilyStack() {
  const { user } = React.useContext(AuthContext);
  const isAdmin = isSuperAdmin(user);
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="FamilyMain" component={FamilyScreen} options={{ title: isAdmin ? 'Admin Workplace' : 'Premium' }} />

      <Stack.Screen name="BirthdayReminder" component={BirthdayReminderScreen} options={{ title: 'Birthdays' }} />
      <Stack.Screen name="FamilyEvents" component={FamilyEventsScreen} options={{ title: 'Family Events' }} />
      <Stack.Screen name="FamilyNoticeBoard" component={FamilyNoticeBoardScreen} options={{ title: 'Notice Board' }} />
      
      <Stack.Screen name="PrivateWalletDashboard" component={PrivateWalletDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WalletCategory" component={WalletCategoryScreen} options={({ route }) => ({ title: route.params?.title || 'Category' })} />
      <Stack.Screen name="WalletAddEdit" component={WalletAddEditScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WalletRecycleBin" component={WalletRecycleBinScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AppLockSettings" component={AppLockSettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdvancedBackupSync" component={AdvancedBackupSyncScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ExtraStorage" component={ExtraStorageScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdvancedReminders" component={AdvancedRemindersScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdvancedCalendar" component={AdvancedCalendarScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdvancedSearch" component={AdvancedSearchScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdvancedHomeDashboard" component={AdvancedHomeDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdvancedAnalytics" component={AdvancedAnalyticsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SmartInsights" component={SmartInsightsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ExportReports" component={ExportReportsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdvancedWebsiteManager" component={AdvancedWebsiteManagerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MyMusicAdvanced" component={MyMusicAdvancedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdvancedDataManagement" component={AdvancedDataManagementScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PremiumPersonalization" component={PremiumPersonalizationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MoviesSeries" component={MoviesSeriesScreen} options={{ headerShown: false }} />
<Stack.Screen name="ComingSoon" component={ComingSoonScreen} options={({ route }) => ({ title: route.params?.title || 'Coming Soon' })} />
      {/* Admin screens accessible from Admin Workplace */}
      <Stack.Screen name="AdminUserManagement" component={UsersScreen} options={{ title: 'User Management' }} />
      <Stack.Screen name="AddUserScreen" component={AddUserScreen} options={{ title: 'Add New User' }} />
      <Stack.Screen name="EditUserScreen" component={EditUserScreen} options={{ title: 'Edit User' }} />
      <Stack.Screen name="UserDetailsScreen" component={UserDetailsScreen} options={{ title: 'User Details' }} />
      <Stack.Screen name="AdminDocsManager" component={AdminDocsManagerScreen} options={{ title: 'Files & Documentation Hub' }} />
      <Stack.Screen name="AdminPayments" component={AdminPaymentsScreen} options={{ title: 'Payments & Revenue' }} />
      <Stack.Screen name="PremiumUpgrade" component={PremiumUpgradeScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// ─── PROFILE STACK ────────────────────────────────────────────────────────────
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="MyProfileSettings" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} options={{ title: 'Personal Information' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
      <Stack.Screen name="AccountPrivacy" component={AccountPrivacyScreen} options={{ title: 'Account Privacy' }} />
      <Stack.Screen name="ExpenseCategories" component={ExpenseCategoriesScreen} options={{ title: 'Expense Categories' }} />
      <Stack.Screen name="FamilyNotifications" component={FamilyNotificationsScreen} options={{ title: 'Family Notifications' }} />
      <Stack.Screen name="EventReminders" component={EventRemindersScreen} options={{ title: 'Event Reminders' }} />
      <Stack.Screen name="RecycleBin" component={RecycleBinScreen} options={{ title: 'Recycle Bin' }} />
      <Stack.Screen name="AppLanguage" component={AppLanguageScreen} options={{ title: 'App Language' }} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ title: 'Help Center' }} />
      <Stack.Screen name="ContactAdmin" component={ContactAdminScreen} options={{ title: 'Contact Admin' }} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
      {/* Admin screens accessible from Profile Settings */}
      <Stack.Screen name="AdminUserManagement" component={UsersScreen} options={{ title: 'User Management' }} />
      <Stack.Screen name="AddUserScreen" component={AddUserScreen} options={{ title: 'Add New User' }} />
      <Stack.Screen name="EditUserScreen" component={EditUserScreen} options={{ title: 'Edit User' }} />
      <Stack.Screen name="UserDetailsScreen" component={UserDetailsScreen} options={{ title: 'User Details' }} />
      <Stack.Screen name="AdminFamilyManagement" component={AdminFamilyManagementScreen} options={{ title: 'Family Management' }} />
      <Stack.Screen name="AdminRolesPermissions" component={AdminRolesPermissionsScreen} options={{ title: 'Roles & Permissions' }} />
      <Stack.Screen name="AdminGlobalNotifications" component={AdminGlobalNotificationsScreen} options={{ title: 'Global Notifications' }} />
      <Stack.Screen name="AdminKhataConfig" component={AdminKhataConfigScreen} options={{ title: 'Khata Configuration' }} />
      <Stack.Screen name="AdminAppSettings" component={AdminAppSettingsScreen} options={{ title: 'Application Settings' }} />
      <Stack.Screen name="AdminSecurityControls" component={AdminSecurityControlsScreen} options={{ title: 'Security Controls' }} />
      <Stack.Screen name="AdminBackupRestore" component={AdminBackupRestoreScreen} options={{ title: 'Backup & Restore' }} />
      <Stack.Screen name="AdminActivityLogs" component={AdminActivityLogsScreen} options={{ title: 'Activity Logs' }} />
      <Stack.Screen name="AdminMessages" component={AdminMessagesScreen} options={{ title: 'Support Messages' }} />
      <Stack.Screen name="AdminDocsManager" component={AdminDocsManagerScreen} options={{ title: 'Files & Documentation Hub' }} />
      <Stack.Screen name="AdminPayments" component={AdminPaymentsScreen} options={{ title: 'Payments & Revenue' }} />
      <Stack.Screen name="PremiumUpgrade" component={PremiumUpgradeScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// ─── TAB ICON ─────────────────────────────────────────────────────────────────
const TabIcon = ({ Icon, label, focused }) => (
  <View style={tabStyles.iconWrap}>
    <Icon 
      size={22} 
      color={focused ? '#F59E0B' : '#64748B'} 
      strokeWidth={focused ? 2.4 : 2.0}
    />
    <Text 
      style={[
        tabStyles.label, 
        { 
          color: focused ? '#F59E0B' : '#64748B', 
          fontWeight: focused ? '700' : '500' 
        }
      ]} 
      numberOfLines={1}
    >
      {label}
    </Text>
    <View 
      style={[
        tabStyles.activeIndicator, 
        focused && tabStyles.activeIndicatorFocused
      ]} 
    />
  </View>
);

// ─── MAIN TAB NAVIGATOR ───────────────────────────────────────────────────────
export default function UserTabNavigator() {
  const { user } = useContext(AuthContext);
  const isAdmin = isSuperAdmin(user);
  // Subscribe to theme version — re-renders tab bar when accent/theme changes
  useThemeVersion();

  useEffect(() => {
    if (user?.user_id) {
      notifService.initializeNotifications(user.user_id, dataService).catch(console.warn);
    }
  }, [user?.user_id]);

  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: tabStyles.tabBar, tabBarShowLabel: false }}>
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Home} label="Home" focused={focused} /> }} />
      <Tab.Screen name="FamilyTab" component={FamilyStack} options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={isAdmin ? Users : Gem} label={isAdmin ? "Admin Workplace" : "Premium"} focused={focused} /> }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={UserRound} label="Profile" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#06080D',
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    borderTopWidth: 1,
    height: 68,
    paddingBottom: 6,
    paddingTop: 8,
  },
  iconWrap: { alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 11, letterSpacing: 0.3 },
  activeIndicator: { 
    width: 28, 
    height: 3.5, 
    borderRadius: 2, 
    marginTop: 3, 
    backgroundColor: 'transparent' 
  },
  activeIndicatorFocused: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
    boxShadow: '0 0 10px rgba(245, 158, 11, 0.8)',
  },
});
