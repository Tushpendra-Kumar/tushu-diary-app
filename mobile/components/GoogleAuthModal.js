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
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleIcon } from './SocialIcons';
import { C } from '../constants/theme';

export default function GoogleAuthModal({ visible, onClose, onSelectAccount }) {
  const [deviceAccounts, setDeviceAccounts] = useState([]);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showInputForm, setShowInputForm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (visible) {
      setErrorMessage('');
      loadDeviceAccounts();
    }
  }, [visible]);

  // Load ONLY accounts previously signed in on this specific device (Never hardcoded!)
  const loadDeviceAccounts = async () => {
    try {
      const raw = await AsyncStorage.getItem('tushu_device_google_accounts');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDeviceAccounts(parsed);
          setShowInputForm(false);
          return;
        }
      }
      // Fresh install or no accounts on this device: show clean input form with NO pre-filled email
      setDeviceAccounts([]);
      setShowInputForm(true);
      setCustomEmail('');
      setCustomName('');
    } catch {
      setDeviceAccounts([]);
      setShowInputForm(true);
    }
  };

  const handleAccountSelect = async (account) => {
    if (!account || !account.email) return;
    await processGoogleLogin(account.email, account.full_name || account.name);
  };

  const handleFormSubmit = async () => {
    setErrorMessage('');
    const cleanEmail = (customEmail || '').trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your Google email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email format (e.g. name@gmail.com).');
      return;
    }

    const cleanName = (customName || '').trim();
    await processGoogleLogin(cleanEmail, cleanName);
  };

  const processGoogleLogin = async (email, name) => {
    const cleanEmail = email.trim().toLowerCase();
    const isSuper = cleanEmail === 'tushpendrakumar@gmail.com';
    const resolvedName = name ? name.trim() : (isSuper ? 'Tushpendra Kumar' : cleanEmail.split('@')[0]);

    setLoading(true);
    const profile = {
      email: cleanEmail,
      full_name: resolvedName,
      provider: 'google'
    };

    try {
      // Save to device's list of previously logged-in accounts
      const raw = await AsyncStorage.getItem('tushu_device_google_accounts');
      let accounts = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(accounts)) accounts = [];
      // Remove duplicates
      accounts = accounts.filter(a => a.email?.toLowerCase() !== cleanEmail);
      accounts.unshift({ email: cleanEmail, full_name: resolvedName });
      await AsyncStorage.setItem('tushu_device_google_accounts', JSON.stringify(accounts.slice(0, 5)));
      await AsyncStorage.setItem('tushu_last_auth_email', cleanEmail);

      await onSelectAccount(profile);
      onClose();
    } catch (e) {
      setErrorMessage('Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAccount = async (emailToRemove) => {
    try {
      const updated = deviceAccounts.filter(a => a.email?.toLowerCase() !== emailToRemove.toLowerCase());
      setDeviceAccounts(updated);
      await AsyncStorage.setItem('tushu_device_google_accounts', JSON.stringify(updated));
      if (updated.length === 0) {
        setShowInputForm(true);
      }
    } catch (e) {
      console.warn('Error removing account:', e);
    }
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
                {/* Header with Google Brand Mark */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <GoogleIcon size={24} />
                    <Text style={styles.title}>Sign in with Google</Text>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                    <Feather name="x" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.subtitle}>
                  {deviceAccounts.length > 0 && !showInputForm
                    ? 'Choose an account to continue to TushuDiary'
                    : 'Enter your Google Account to continue to TushuDiary'}
                </Text>

                <View style={styles.divider} />

                {/* Error Banner */}
                {errorMessage ? (
                  <View style={styles.errorBox}>
                    <Feather name="alert-circle" size={15} color="#FF3B30" style={{ marginRight: 6 }} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* Mode 1: List of Accounts Used on This Device */}
                {deviceAccounts.length > 0 && !showInputForm ? (
                  <View>
                    <Text style={styles.sectionHeading}>SAVED ON THIS DEVICE</Text>
                    <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                      {deviceAccounts.map((acc, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.accountRow}
                          activeOpacity={0.82}
                          disabled={loading}
                          onPress={() => handleAccountSelect(acc)}
                        >
                          <View style={styles.avatarCircle}>
                            <Text style={styles.avatarLetter}>
                              {(acc.full_name || acc.email)[0].toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.accountInfo}>
                            <Text style={styles.accountName} numberOfLines={1}>
                              {acc.full_name || 'Google User'}
                            </Text>
                            <Text style={styles.accountEmail} numberOfLines={1}>
                              {acc.email}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.removeBtn}
                            onPress={() => handleRemoveAccount(acc.email)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Feather name="x" size={16} color="#636366" />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <TouchableOpacity
                      onPress={() => {
                        setShowInputForm(true);
                        setCustomEmail('');
                        setCustomName('');
                        setErrorMessage('');
                      }}
                      style={styles.anotherAccountBtn}
                      activeOpacity={0.7}
                    >
                      <Feather name="user-plus" size={16} color="#F0A500" style={{ marginRight: 8 }} />
                      <Text style={styles.anotherAccountText}>Use another Google Account</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Mode 2: Clean Google Account Entry Form (Fresh Install / New Account) */
                  <View style={styles.form}>
                    <Text style={styles.inputLabel}>Google Email Address</Text>
                    <View style={styles.inputRow}>
                      <Feather name="mail" size={18} color="#8E8E93" style={{ marginRight: 10 }} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. name@gmail.com"
                        placeholderTextColor="#636366"
                        value={customEmail}
                        onChangeText={(t) => {
                          setCustomEmail(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoCorrect={false}
                        autoFocus={deviceAccounts.length === 0}
                      />
                    </View>

                    <Text style={[styles.inputLabel, { marginTop: 12 }]}>Full Name (Optional)</Text>
                    <View style={styles.inputRow}>
                      <Feather name="user" size={18} color="#8E8E93" style={{ marginRight: 10 }} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Tushpendra Kumar"
                        placeholderTextColor="#636366"
                        value={customName}
                        onChangeText={setCustomName}
                        autoCapitalize="words"
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                      activeOpacity={0.85}
                      disabled={loading}
                      onPress={handleFormSubmit}
                    >
                      {loading ? (
                        <ActivityIndicator color="#000000" size="small" />
                      ) : (
                        <View style={styles.btnRow}>
                          <GoogleIcon size={18} style={{ marginRight: 8 }} />
                          <Text style={styles.submitBtnText}>Continue with Google</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {deviceAccounts.length > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          setShowInputForm(false);
                          setErrorMessage('');
                        }}
                        style={styles.switchModeBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.switchModeText}>← Back to Saved Accounts</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Footer Security Pill */}
                <View style={styles.securityPill}>
                  <Feather name="shield" size={12} color="#F0A500" style={{ marginRight: 6 }} />
                  <Text style={styles.securityPillText}>
                    Standard JWT Authentication • CodeByTushu Security
                  </Text>
                </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.80)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
  },
  card: {
    backgroundColor: 'rgba(17, 21, 30, 0.95)',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    } : {}),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 17.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  subtitle: {
    fontSize: 12.5,
    color: '#636366',
    lineHeight: 18,
    marginTop: 2,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 14,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: '#636366',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.25)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    minHeight: 44,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0A500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarLetter: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 12,
    color: '#636366',
  },
  removeBtn: {
    padding: 6,
  },
  anotherAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(240, 165, 0, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.2)',
    minHeight: 44,
  },
  anotherAccountText: {
    color: '#F0A500',
    fontSize: 13.5,
    fontWeight: '600',
  },
  form: {
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    minHeight: 44,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    height: '100%',
  },
  submitBtn: {
    backgroundColor: '#F0A500',
    borderRadius: 16,
    height: 48,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#F0A500',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  switchModeBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  switchModeText: {
    color: '#636366',
    fontSize: 13,
    fontWeight: '500',
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  securityPillText: {
    color: '#636366',
    fontSize: 11,
    fontWeight: '500',
  },
});
