import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleIcon } from './SocialIcons';
import { C } from '../constants/theme';

export default function GoogleAuthModal({ visible, onClose, onSelectAccount }) {
  const [savedEmail, setSavedEmail] = useState('');
  const [savedName, setSavedName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSavedAccount();
    }
  }, [visible]);

  const loadSavedAccount = async () => {
    try {
      const raw = await AsyncStorage.getItem('tushu_social_google_account');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.email) {
          setSavedEmail(parsed.email);
          setSavedName(parsed.full_name || 'Google User');
          setShowCustomInput(false);
          return;
        }
      }
      // If no saved Google account, check last auth email
      const lastEmail = await AsyncStorage.getItem('tushu_last_auth_email');
      if (lastEmail) {
        setSavedEmail(lastEmail);
        setSavedName(lastEmail.toLowerCase() === 'tushpendrakumar@gmail.com' ? 'Tushpendra Kumar' : 'User');
        setShowCustomInput(false);
      } else {
        // Default prompt for Tushpendra Kumar / new user
        setSavedEmail('tushpendrakumar@gmail.com');
        setSavedName('Tushpendra Kumar');
        setShowCustomInput(false);
      }
    } catch (e) {
      setSavedEmail('tushpendrakumar@gmail.com');
      setSavedName('Tushpendra Kumar');
    }
  };

  const handleChooseAccount = async (email, name) => {
    if (!email || !email.trim()) return;
    const cleanEmail = email.trim().toLowerCase();
    const isSuper = cleanEmail === 'tushpendrakumar@gmail.com';
    const cleanName = name ? name.trim() : (isSuper ? 'Tushpendra Kumar' : cleanEmail.split('@')[0]);

    setLoading(true);
    const profile = {
      email: cleanEmail,
      full_name: cleanName,
      provider: 'google'
    };

    try {
      await AsyncStorage.setItem('tushu_social_google_account', JSON.stringify(profile));
      await AsyncStorage.setItem('tushu_last_auth_email', cleanEmail);
      await onSelectAccount(profile);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleCustomSubmit = () => {
    if (!customEmail.trim()) {
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customEmail.trim())) {
      alert('Please enter a valid Google email address.');
      return;
    }
    handleChooseAccount(customEmail, customName);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.container}
            >
              <View style={styles.card}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <GoogleIcon size={24} />
                    <Text style={styles.title}>Google Sign-In</Text>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                    <Feather name="x" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.subtitle}>
                  Choose or enter your Google Account to continue to TushuDiary
                </Text>

                <View style={styles.divider} />

                {/* Saved Account Row (1-Tap Selection) */}
                {savedEmail && !showCustomInput && (
                  <TouchableOpacity
                    style={styles.accountRow}
                    activeOpacity={0.82}
                    disabled={loading}
                    onPress={() => handleChooseAccount(savedEmail, savedName)}
                  >
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarLetter}>
                        {(savedName || savedEmail)[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName} numberOfLines={1}>
                        {savedName || 'Google User'}
                      </Text>
                      <Text style={styles.accountEmail} numberOfLines={1}>
                        {savedEmail}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#F0A500" />
                  </TouchableOpacity>
                )}

                {/* Custom Email Input Mode */}
                {showCustomInput ? (
                  <View style={styles.form}>
                    <Text style={styles.inputLabel}>Google Email Address</Text>
                    <View style={styles.inputRow}>
                      <Feather name="at-sign" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.input}
                        placeholder="yourname@gmail.com"
                        placeholderTextColor="#666"
                        value={customEmail}
                        onChangeText={setCustomEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoCorrect={false}
                      />
                    </View>

                    <Text style={[styles.inputLabel, { marginTop: 12 }]}>Your Name (Optional)</Text>
                    <View style={styles.inputRow}>
                      <Feather name="user" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#666"
                        value={customName}
                        onChangeText={setCustomName}
                        autoCapitalize="words"
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.submitBtn, (!customEmail.trim() || loading) && { opacity: 0.6 }]}
                      activeOpacity={0.85}
                      disabled={!customEmail.trim() || loading}
                      onPress={handleCustomSubmit}
                    >
                      {loading ? (
                        <ActivityIndicator color="#000" />
                      ) : (
                        <View style={styles.btnRow}>
                          <GoogleIcon size={18} style={{ marginRight: 8 }} />
                          <Text style={styles.submitBtnText}>Continue with this Account</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setShowCustomInput(false)}
                      style={styles.switchModeBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.switchModeText}>Back to Saved Account</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowCustomInput(true)}
                    style={styles.anotherAccountBtn}
                    activeOpacity={0.7}
                  >
                    <Feather name="user-plus" size={16} color="#F0A500" style={{ marginRight: 8 }} />
                    <Text style={styles.anotherAccountText}>Use another Google Account</Text>
                  </TouchableOpacity>
                )}

                {loading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color="#F0A500" />
                    <Text style={styles.loadingText}>Authenticating with Google...</Text>
                  </View>
                )}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
  },
  card: {
    backgroundColor: '#11151E',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 16,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.3)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0A500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  anotherAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  anotherAccountText: {
    color: '#F0A500',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#F0A500',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
  switchModeBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 8,
  },
  switchModeText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  loadingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  loadingText: {
    color: '#F0A500',
    fontSize: 13,
  },
});
