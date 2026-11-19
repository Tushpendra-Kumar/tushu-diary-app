import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, TextInput, Modal, Image as RNImage, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../../context/AuthContext';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import { useThemeVersion } from '../../../context/ThemeContext';

import { Camera, Edit2, ChevronRight, User, Shield, Image as ImageIcon, LogOut, Users, FolderGit2, Sparkles, RefreshCw } from 'lucide-react-native';
import ParticleBackground from '../../../components/ParticleBackground';

const MenuItemRow = ({ icon: Icon, title, description, color = C.gold, onPress }) => (
  <TouchableOpacity style={s.menuItemRow} onPress={onPress} activeOpacity={0.75}>
    <View style={[s.menuItemIconWrap, { backgroundColor: color + '18', borderColor: color + '30' }]}>
      <Icon size={20} color={color} strokeWidth={2} />
    </View>
    <View style={s.menuItemContent}>
      <Text style={s.menuItemTitle}>{title}</Text>
      {description ? <Text style={s.menuItemDesc}>{description}</Text> : null}
    </View>
    <ChevronRight size={16} color="rgba(255, 255, 255, 0.35)" strokeWidth={2} />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  useThemeVersion(); // Re-renders on accent/theme changes
  const { user, logout, updateUserProfile, currentMode, switchMode } = useContext(AuthContext);
  const navigation = useNavigation();

  const isSuper = (user?.email && user.email.toLowerCase().trim() === 'tushpendrakumar@gmail.com');

  const userId = user?.user_id;
  const isLady = user?.gender === 'female';
  const avatarAccent = isLady ? '#F06292' : C.gold;

  const [displayName, setDisplayName] = useState(user?.display_name || user?.full_name || '');
  const [dpUri, setDpUri] = useState(null);
  const [renameModal, setRenameModal] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const savedDp = await AsyncStorage.getItem(`tushu_${userId}_dp`);
        if (user?.display_name) setDisplayName(user.display_name);
        if (savedDp) setDpUri(savedDp);
      } catch (e) {}
    };
    loadProfile();
  }, [userId]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission Required', 'Please allow access to your photo library.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const imageToSave = Platform.OS === 'web' && asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setDpUri(imageToSave);
      await AsyncStorage.setItem(`tushu_${userId}_dp`, imageToSave);
    }
  };

  const handleRenameSave = async () => {
    if (!tempName.trim()) return Alert.alert('Error', 'Name cannot be empty.');
    const newName = tempName.trim();
    setDisplayName(newName);
    if (updateUserProfile) {
      await updateUserProfile({ display_name: newName });
    } else {
      await AsyncStorage.setItem(`tushu_${userId}_display_name`, newName);
    }
    setRenameModal(false);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) logout();
    } else {
      Alert.alert('Log Out', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]);
    }
  };

  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ────────── PROFILE HERO SECTION ────────── */}
        <View style={s.profileSection}>
          <View style={s.profileTopRow}>
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85} style={s.avatarWrap}>
              <View style={[s.avatarContainer, { borderColor: avatarAccent + '80' }]}>
                {dpUri ? (
                  <RNImage source={{ uri: dpUri }} style={s.dpImage} resizeMode="cover" />
                ) : (
                  <View style={[s.avatarCircle, { backgroundColor: avatarAccent + '18' }]}>
                    <Text style={[s.avatarText, { color: avatarAccent }]}>{initials}</Text>
                  </View>
                )}
              </View>
              <View style={s.cameraOverlay}>
                <Camera size={13} color={C.gold} strokeWidth={2.2} />
              </View>
            </TouchableOpacity>

            <View style={s.profileDetails}>
              <Text style={s.displayName} numberOfLines={1}>{displayName}</Text>
              <Text style={s.userId}>@{((user?.user_id || 'user').includes('privaterelay') || (user?.user_id || '').includes('@')) ? ((user?.full_name || displayName || user?.user_id || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')) : (user?.user_id || 'user').replace(/^@+/, '')}</Text>
              <TouchableOpacity
                onPress={() => { setTempName(displayName); setRenameModal(true); }}
                style={s.editProfileBtn}
                activeOpacity={0.75}
              >
                <Edit2 size={13} color={C.gold} strokeWidth={2.2} />
                <Text style={s.editProfileBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Badges ── */}
          <View style={s.badgesRow}>
            <View style={[s.badge, isLady ? s.badgeLadies : s.badgeGents]}>
              <Text style={[s.badgeText, isLady ? s.badgeTextLadies : s.badgeTextGents]}>
                {isLady ? 'Ladies Interface' : 'Gents Interface'}
              </Text>
            </View>
            <View style={[s.badge, s.badgeRole]}>
              <Text style={[s.badgeText, s.badgeTextRole]}>
                {user?.role || 'USER'}
              </Text>
            </View>
          </View>
        </View>

        {/* ────────── ACCOUNT SECTION ────────── */}
        <View style={s.menuGroup}>
          <Text style={s.sectionTitle}>ACCOUNT</Text>
          <View style={s.menuCard}>
            <MenuItemRow
              icon={Edit2}
              title="Rename Display Name"
              description="Change how your name appears"
              color="#F0A500"
              onPress={() => { setTempName(displayName); setRenameModal(true); }}
            />
            <View style={s.menuDivider} />
            <MenuItemRow
              icon={ImageIcon}
              title="Profile Picture"
              description="Upload from your gallery"
              color="#38BDF8"
              onPress={handlePickImage}
            />
          </View>
        </View>

        {/* ────────── SUPER ADMIN CONTROLS (FOUNDER ONLY) ────────── */}
        {isSuper && (
          <View style={s.menuGroup}>
            <Text style={s.sectionTitle}>SUPER ADMIN CONTROLS</Text>
            <View style={s.menuCard}>
              <MenuItemRow
                icon={currentMode === 'ADMIN' ? RefreshCw : Sparkles}
                title={currentMode === 'ADMIN' ? 'Switch to Normal User Mode' : 'Switch to Admin Portal'}
                description={currentMode === 'ADMIN' ? 'Current: Admin Portal Mode' : 'Current: User Mode (Normal View)'}
                color="#FBBF24"
                onPress={() => switchMode(currentMode === 'ADMIN' ? 'USER' : 'ADMIN')}
              />
              {currentMode === 'ADMIN' && (
                <>
                  <View style={s.menuDivider} />
                  <MenuItemRow
                    icon={FolderGit2}
                    title="Files & Documentation Hub"
                    description="Manage, read & edit 19 reports and specs"
                    color={C.gold}
                    onPress={() => navigation.navigate('AdminDocsManager')}
                  />
                  <View style={s.menuDivider} />
                  <MenuItemRow
                    icon={Users}
                    title="User Management"
                    description="Manage registered users & access"
                    color="#34D399"
                    onPress={() => navigation.navigate('AdminUserManagement')}
                  />
                </>
              )}
            </View>
          </View>
        )}

        {/* ────────── SECURITY SECTION ────────── */}
        <View style={s.menuGroup}>
          <Text style={s.sectionTitle}>SECURITY</Text>
          <View style={s.menuCard}>
            <MenuItemRow
              icon={LogOut}
              title="Logout"
              description="Sign out of your account"
              color="#F87171"
              onPress={handleLogout}
            />
          </View>
        </View>

        <SecurityFooter style={{ marginTop: 28 }} />
      </ScrollView>

      {/* ────────── RENAME MODAL ────────── */}
      <Modal visible={renameModal} transparent animationType="fade">
        <View style={s.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <View style={s.modal}>
              <View style={s.modalHeaderRow}>
                <Text style={s.modalTitle}>Rename Display Name</Text>
                <Edit2 size={20} color={C.white} />
              </View>
              <Text style={s.modalSub}>This will change how your name appears on the dashboard.</Text>
              <Text style={s.label}>YOUR NAME</Text>
              <TextInput
                style={s.input}
                value={tempName}
                onChangeText={setTempName}
                placeholderTextColor={C.textMuted}
                underlineColorAndroid="transparent"
                autoFocus
              />
              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setRenameModal(false)}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleRenameSave}>
                  <Text style={s.saveText}>Save Name</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#06080D' },
  scroll: { paddingBottom: 32 },

  // ── Profile Hero Section ──
  profileSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    position: 'relative',
    width: 78,
    height: 78,
  },
  avatarContainer: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: 'rgba(240, 165, 0, 0.55)',
    backgroundColor: '#0D0E11',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 3,
  },
  dpImage: {
    width: '100%',
    height: '100%',
    borderRadius: 39,
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 39,
    backgroundColor: 'rgba(240, 165, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: C.gold,
    letterSpacing: 0.5,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#18191E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  profileDetails: {
    flex: 1,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  userId: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 10,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(240, 165, 0, 0.12)',
    borderWidth: 1.2,
    borderColor: 'rgba(240, 165, 0, 0.40)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  editProfileBtnText: {
    color: C.gold,
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Badges ──
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeGents: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.30)',
  },
  badgeTextGents: {
    color: '#38BDF8',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  badgeLadies: {
    backgroundColor: 'rgba(240, 98, 146, 0.08)',
    borderColor: 'rgba(240, 98, 146, 0.30)',
  },
  badgeTextLadies: {
    color: '#F06292',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  badgeRole: {
    backgroundColor: 'rgba(240, 165, 0, 0.08)',
    borderColor: 'rgba(240, 165, 0, 0.30)',
  },
  badgeTextRole: {
    color: C.gold,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  badgeText: {},

  // ── Menu Groups ──
  menuGroup: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 2,
  },

  // ── Card Containers ──
  menuCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  menuItemDesc: {
    fontSize: 11.5,
    color: '#8E8E93',
    lineHeight: 15,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 16,
  },

  // ── Modal ──
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#121317',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 0.2,
  },
  modalSub: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 20,
    lineHeight: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: C.gold,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: C.white,
    outlineStyle: 'none',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
  },
  cancelText: {
    color: '#D0D0D0',
    fontWeight: '700',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: C.gold,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 14.5,
  },
});
