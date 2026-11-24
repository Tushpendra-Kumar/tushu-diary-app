import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Settings, ChevronLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { C } from '../constants/theme';
import { useThemeVersion } from '../context/ThemeContext';
import NavigationDrawer from './NavigationDrawer';

export default function AppHeader({ navigation, title, isMain, back }) {
  useThemeVersion(); // Re-renders on accent/theme changes
  const { user, logout, currentMode, switchMode } = useContext(AuthContext);
  const isSuper = (user?.email || '').toLowerCase().trim() === 'tushpendrakumar@gmail.com';
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [displayName, setDisplayName] = useState(user?.full_name || '');
  const [dpUri, setDpUri] = useState(null);

  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0);

  const isLady = user?.gender === 'female';
  const accentColor = isLady ? '#F06292' : '#42A5F5';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user?.user_id) {
          const name = await AsyncStorage.getItem(`tushu_${user.user_id}_display_name`);
          const dp = await AsyncStorage.getItem(`tushu_${user.user_id}_dp`);
          if (name) setDisplayName(name);
          if (dp) setDpUri(dp);
        }
      } catch (e) {}
    };
    loadData();
  }, [user]);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) logout();
    } else {
      logout();
    }
  };

  return (
    <View style={[s.headerWrapper, { paddingTop: topInset + 4 }]}>
      <View style={s.header}>
        {isMain ? (
          <TouchableOpacity onPress={() => setDrawerVisible(true)} style={s.headerBtn} activeOpacity={0.7}>
            <Menu size={22} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>
        ) : back ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn} activeOpacity={0.7}>
            <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>
        ) : (
          <View style={s.headerBtn} />
        )}

        <View style={s.titleContainer}>
          <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
          {(isMain || title === 'Home' || title === 'Premium' || title === 'Profile' || title === 'My Profile' || title === 'Admin Workplace' || title === 'Admin Portal') && (
            <View style={s.headerTitleAccent} />
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {(isMain || title === 'Profile' || title === 'My Profile') ? (
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={s.headerBtn} activeOpacity={0.7}>
              <Settings size={21} color="#FFFFFF" strokeWidth={2.0} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 42 }} />
          )}
        </View>
      </View>

      <NavigationDrawer
        isAdmin={isSuper && currentMode === 'ADMIN'}
        isSuper={isSuper}
        currentMode={currentMode}
        onSwitchMode={switchMode}
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        dpUri={dpUri}
        initials={initials}
        displayName={displayName}
        userId={user?.user_id}
        accentColor={accentColor}
        onLogout={handleLogout}
        navigation={navigation}
      />
    </View>
  );
}

const s = StyleSheet.create({
  headerWrapper: {
    backgroundColor: 'rgba(6, 8, 13, 0.92)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    } : {}),
  },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    minHeight: 44, // Apple HIG min touch target
  },
  headerBtn: { 
    width: 44, 
    height: 44, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: 22, // Apple circular button
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  titleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { 
    fontSize: 17, // Apple iOS Headline scale
    fontWeight: '700', // Disciplined executive weight
    color: '#FFFFFF', 
    textAlign: 'center', 
    letterSpacing: -0.3,
  },
  headerTitleAccent: { 
    width: 28, 
    height: 3, 
    borderRadius: 1.5, 
    backgroundColor: '#F0A500', 
    marginTop: 3,
    shadowColor: '#F0A500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  modeToggleBadge: {
    backgroundColor: 'rgba(240, 165, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 6,
  },
  modeToggleText: {
    color: '#F0A500',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
