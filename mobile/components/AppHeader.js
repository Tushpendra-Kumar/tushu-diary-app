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
    backgroundColor: '#06080D',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    backgroundColor: '#06080D',
  },
  headerBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  titleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', letterSpacing: 0.4 },
  headerTitleAccent: { 
    width: 32, 
    height: 3.5, 
    borderRadius: 2, 
    backgroundColor: '#F59E0B', 
    marginTop: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 2,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 8px rgba(245, 158, 11, 0.7)' } : {}),
  },
  modeToggleBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 6,
  },
  modeToggleText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
});
