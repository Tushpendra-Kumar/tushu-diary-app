import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, Animated, Dimensions,
  TouchableWithoutFeedback, TouchableOpacity, Image as RNImage,
  ScrollView, Platform, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X, Home, Users, CheckSquare, Wallet, Calendar, BookOpen,
  User, Settings, LogOut, ChevronRight, Shield, LayoutDashboard, UserCog, Sparkles, RefreshCw, DownloadCloud
} from 'lucide-react-native';
import { checkForAppUpdates } from '../services/updateService';
import { C } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.80, 340);

const ROUTE_MAP = {
  HomeTab: 'Home',
  FamilyTab: 'Family',
  TaskManager: 'Tasks',
  ExpenseTracker: 'Expenses',
  FamilyEvents: 'Calendar',
  QuickNotes: 'Memories',
  ProfileTab: 'Profile',
  Settings: 'Settings',
  AdminUserManagement: 'Manage Users',
  AdminFamilyManagement: 'Family Roles',
  AdminSecurityControls: 'Security Controls',
  AdminActivityLogs: 'Activity Logs',
};

function DrawerItem({ icon: Icon, label, onPress, isActive, color = C.gold }) {
  const iconColor = isActive ? C.gold : color;
  return (
    <TouchableOpacity
      style={[s.itemCard, isActive && s.itemCardActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[
        s.iconWrap,
        {
          backgroundColor: isActive ? 'rgba(240, 165, 0, 0.15)' : (color + '14'),
          borderColor: isActive ? 'rgba(240, 165, 0, 0.38)' : (color + '26'),
        }
      ]}>
        <Icon
          size={19}
          color={iconColor}
          strokeWidth={isActive ? 2.2 : 2.0}
        />
      </View>
      <Text style={[s.itemLabel, isActive && s.itemLabelActive]}>{label}</Text>
      <ChevronRight
        size={15}
        color={isActive ? C.gold : 'rgba(255, 255, 255, 0.28)'}
        strokeWidth={2}
        style={s.chevron}
      />
    </TouchableOpacity>
  );
}

function LogoutCard({ onPress }) {
  return (
    <TouchableOpacity style={s.logoutCard} onPress={onPress} activeOpacity={0.75}>
      <View style={s.logoutIconWrap}>
        <LogOut size={19} color="#F87171" strokeWidth={2} />
      </View>
      <Text style={s.logoutLabel}>Logout</Text>
      <ChevronRight size={15} color="#F87171" strokeWidth={2} style={s.chevron} />
    </TouchableOpacity>
  );
}

export default function NavigationDrawer({
  visible, onClose, dpUri, initials, displayName, userId,
  accentColor, onLogout, navigation, isAdmin, isSuper, currentMode, onSwitchMode,
}) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: false }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 260, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 240, useNativeDriver: false }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: false }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const currentRoute = navigation?.getState
    ? navigation.getState()?.routes?.[navigation.getState()?.index]?.name
    : null;
  const activeLabel = ROUTE_MAP[currentRoute] || null;
  const isItemActive = (label) => activeLabel === label;

  const go = (routeArgs) => {
    onClose();
    if (Array.isArray(routeArgs)) {
      navigation.navigate(...routeArgs);
    } else {
      navigation.navigate(routeArgs);
    }
  };

  const insets = useSafeAreaInsets();
  // Robust Safe Area top inset for Android status bar & punch-hole cameras (avoids overlapping clock/icons)
  const statusBarHeight = Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, 42) : (insets.top || 20);
  const topInset = Math.max(insets.top || 0, statusBarHeight) + 16;
  const bottomInset = Math.max(insets.bottom || 0, 16);

  const ringColor = 'rgba(240, 165, 0, 0.65)';

  const backdropOpacity = backdropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.65],
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: backdropOpacity }]}
          />
        </TouchableWithoutFeedback>

        <Animated.View style={[s.panel, { transform: [{ translateX: slideAnim }] }]}>
          <View style={s.glowEdge} />

          <View style={{ flex: 1 }}>
            <View style={[s.header, { paddingTop: topInset, paddingBottom: 16 }]}>
              <View style={s.avatarRow}>
                {dpUri ? (
                  <RNImage source={{ uri: dpUri }} style={[s.avatarImage, { borderColor: ringColor }]} />
                ) : (
                  <View style={[s.avatarCircle, { borderColor: ringColor }]}>
                    <Text style={s.avatarInitials}>{initials}</Text>
                  </View>
                )}
                <View style={s.userInfo}>
                  <Text style={s.userName} numberOfLines={1}>{displayName}</Text>
                  <Text style={s.userId} numberOfLines={1}>@{userId || 'user'}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={s.closeBtn} activeOpacity={0.75}>
                <X size={18} color="rgba(255, 255, 255, 0.70)" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            <View style={s.headerDivider} />

            <ScrollView
              style={s.scrollArea}
              contentContainerStyle={s.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <DrawerItem icon={Home}        label="Home"     color="#F0A500" isActive={isItemActive('Home')}     onPress={() => go('HomeTab')} />
              <DrawerItem icon={Users}       label="Family"   color="#34D399" isActive={isItemActive('Family')}   onPress={() => go('FamilyTab')} />
              <DrawerItem icon={CheckSquare} label="Tasks"    color="#F472B6" isActive={isItemActive('Tasks')}    onPress={() => go('TaskManager')} />
              <DrawerItem icon={Wallet}      label="Expenses" color="#38BDF8" isActive={isItemActive('Expenses')} onPress={() => go('ExpenseTracker')} />
              <DrawerItem icon={Calendar}    label="Calendar" color="#FBBF24" isActive={isItemActive('Calendar')} onPress={() => go('FamilyEvents')} />
              <DrawerItem icon={BookOpen}      label="Memories"      color="#A78BFA" isActive={isItemActive('Memories')} onPress={() => go('QuickNotes')} />
              <DrawerItem icon={User}          label="Profile"       color="#60A5FA" isActive={isItemActive('Profile')}  onPress={() => go('ProfileTab')} />
              <DrawerItem icon={DownloadCloud} label="Check Updates" color="#38BDF8" isActive={false} onPress={() => { onClose(); setTimeout(() => checkForAppUpdates({ showAlert: true }), 350); }} />
              <DrawerItem icon={Settings}      label="Settings"      color="#94A3B8" isActive={isItemActive('Settings')} onPress={() => go(['ProfileTab', { screen: 'Settings' }])} />

              {isAdmin && (
                <View style={s.adminSection}>
                  <View style={s.adminSectionHeader}>
                    <View style={s.adminSectionLine} />
                    <Text style={s.adminSectionLabel}>ADMIN WORKSPACE</Text>
                    <View style={s.adminSectionLine} />
                  </View>
                  <DrawerItem icon={Users}           label="Manage Users"      color="#34D399" isActive={isItemActive('Manage Users')}      onPress={() => go('AdminUserManagement')} />
                  <DrawerItem icon={UserCog}         label="Family Roles"      color="#F59E0B" isActive={isItemActive('Family Roles')}      onPress={() => go('AdminFamilyManagement')} />
                  <DrawerItem icon={Shield}          label="Security Controls" color="#EF4444" isActive={isItemActive('Security Controls')} onPress={() => go('AdminSecurityControls')} />
                  <DrawerItem icon={LayoutDashboard} label="Activity Logs"     color="#818CF8" isActive={isItemActive('Activity Logs')}     onPress={() => go('AdminActivityLogs')} />
                </View>
              )}
            </ScrollView>

            <View style={[s.logoutArea, { paddingBottom: bottomInset }]}>
              <View style={s.logoutDivider} />
              <LogoutCard onPress={onLogout} />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: 'rgba(10, 14, 23, 0.96)',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 20,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  glowEdge: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: 'rgba(240, 165, 0, 0.40)',
    shadowColor: C.gold,
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 165, 0, 0.12)',
    overflow: 'hidden',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: C.gold,
    letterSpacing: 0.5,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 0.2,
  },
  userId: {
    fontSize: 12.5,
    color: '#8E8E93',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: 16,
    minHeight: 44, // Apple HIG min touch target
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 8,
  },
  itemCardActive: {
    backgroundColor: 'rgba(240, 165, 0, 0.10)',
    borderColor: 'rgba(240, 165, 0, 0.42)',
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.88)',
    letterSpacing: 0.1,
  },
  itemLabelActive: {
    color: C.gold,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 4,
  },
  adminSection: {
    marginTop: 8,
  },
  adminSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 4,
    gap: 8,
  },
  adminSectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  adminSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#636366',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  logoutArea: {
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  logoutDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderRadius: 16,
    minHeight: 44, // Apple HIG min touch target
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  logoutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#F87171',
    letterSpacing: 0.1,
  },
});
