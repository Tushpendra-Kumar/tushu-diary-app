import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch, TextInput, Modal, Platform, Alert } from 'react-native';
import { C } from '../../../constants/theme';
import { ChevronLeft, ShieldAlert, KeyRound, Fingerprint, Clock, EyeOff, Save, Trash2, Lock } from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import { AppLockContext } from '../../../context/AppLockContext';
import ParticleBackground from '../../../components/ParticleBackground';
import SecurityFooter from '../../../components/SecurityFooter';
import { getAppLockConfig, saveAppLockConfig, setPin, verifyPin, removePin } from '../../../services/appLockService';
import * as LocalAuthentication from 'expo-local-authentication';

export default function AppLockSettingsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { loadConfig, lockApp } = useContext(AppLockContext);
  
  const [config, setConfig] = useState(null);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  
  // Pin Modals
  const [setupPinModal, setSetupPinModal] = useState(false);
  const [changePinModal, setChangePinModal] = useState(false);
  const [disablePinModal, setDisablePinModal] = useState(false);
  
  const [pinStep, setPinStep] = useState('CREATE'); // CREATE, CONFIRM, VERIFY
  const [tempPin, setTempPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    loadInitData();
  }, []);

  const loadInitData = async () => {
    const c = await getAppLockConfig(user.user_id);
    setConfig(c);
    
    if (Platform.OS !== 'web') {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricSupported(hasHardware && isEnrolled);
    }
  };

  const updateConfig = async (updates) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    await saveAppLockConfig(user.user_id, newConfig);
    await loadConfig(); // update context
  };

  const handleToggleAppLock = () => {
      if (!config.enabled) {
          setPinStep('CREATE');
          setPinInput('');
          setTempPin('');
          setErrorText('');
          setSetupPinModal(true);
      } else {
          setPinStep('VERIFY');
          setPinInput('');
          setErrorText('');
          setDisablePinModal(true);
      }
  };

  const processPinSetup = async () => {
      if (pinStep === 'CREATE') {
          if (pinInput.length < 4) {
              setErrorText('PIN must be at least 4 digits');
              return;
          }
          setTempPin(pinInput);
          setPinInput('');
          setErrorText('');
          setPinStep('CONFIRM');
      } else if (pinStep === 'CONFIRM') {
          if (pinInput !== tempPin) {
              setErrorText('PINs do not match. Try again.');
              setPinInput('');
              setPinStep('CREATE');
              return;
          }
          await setPin(user.user_id, pinInput);
          await updateConfig({ enabled: true });
          setSetupPinModal(false);
          Alert.alert('App Lock Enabled', 'Your privacy PIN has been set successfully.');
      }
  };

  const processDisable = async () => {
      const isValid = await verifyPin(user.user_id, pinInput);
      if (isValid) {
          await removePin(user.user_id);
          await updateConfig({ enabled: false, useBiometric: false });
          setDisablePinModal(false);
          Alert.alert('App Lock Disabled', 'App Lock has been removed.');
      } else {
          setErrorText('Incorrect PIN.');
          setPinInput('');
      }
  };

  const processChangePin = async () => {
      if (pinStep === 'VERIFY') {
          const isValid = await verifyPin(user.user_id, pinInput);
          if (isValid) {
              setPinStep('CREATE');
              setPinInput('');
              setErrorText('');
          } else {
              setErrorText('Incorrect PIN.');
              setPinInput('');
          }
      } else if (pinStep === 'CREATE') {
          if (pinInput.length < 4) {
              setErrorText('PIN must be at least 4 digits');
              return;
          }
          setTempPin(pinInput);
          setPinInput('');
          setErrorText('');
          setPinStep('CONFIRM');
      } else if (pinStep === 'CONFIRM') {
          if (pinInput !== tempPin) {
              setErrorText('PINs do not match. Try again.');
              setPinInput('');
              setPinStep('CREATE');
              return;
          }
          await setPin(user.user_id, pinInput);
          setChangePinModal(false);
          Alert.alert('PIN Changed', 'Your privacy PIN has been updated successfully.');
      }
  };

  const toggleModule = async (moduleName) => {
      let mods = [...config.protectedModules];
      if (mods.includes(moduleName)) {
          mods = mods.filter(m => m !== moduleName);
      } else {
          mods.push(moduleName);
      }
      await updateConfig({ protectedModules: mods });
  };

  const togglePrivacyControl = async (key) => {
      const pControls = { ...config.privacyControls, [key]: !config.privacyControls[key] };
      await updateConfig({ privacyControls: pControls });
  };

  if (!config) return null;

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      <View style={s.header}>
        <View style={{ width: 28 }} />
        <Text style={s.headerTitle}>App Lock & Privacy</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        
        <View style={s.statusCard}>
            <ShieldAlert color={config.enabled ? '#4CAF50' : C.textMuted} size={32} />
            <Text style={s.statusTitle}>{config.enabled ? 'Protected' : 'Not Protected'}</Text>
            <Text style={s.statusDesc}>
                {config.enabled ? 'Your sensitive app sections are locked.' : 'Enable App Lock to protect your data.'}
            </Text>
            
            <TouchableOpacity 
                style={[s.mainToggleBtn, { backgroundColor: config.enabled ? 'rgba(244,67,54,0.1)' : C.gold }]}
                onPress={handleToggleAppLock}
            >
                <Text style={[s.mainToggleText, { color: config.enabled ? '#F44336' : C.black }]}>
                    {config.enabled ? 'Disable App Lock' : 'Enable App Lock'}
                </Text>
            </TouchableOpacity>
        </View>

        {config.enabled && (
            <>
                <Text style={s.sectionTitle}>AUTHENTICATION</Text>
                
                <View style={s.settingGroup}>
                    <TouchableOpacity style={s.settingRow} onPress={() => {
                        setPinStep('VERIFY'); setPinInput(''); setErrorText(''); setChangePinModal(true);
                    }}>
                        <View style={s.settingIconBg}><KeyRound size={20} color={C.gold} /></View>
                        <View style={s.settingTextWrap}>
                            <Text style={s.settingLabel}>Change PIN</Text>
                            <Text style={s.settingDesc}>Update your current security PIN</Text>
                        </View>
                        <ChevronLeft style={{ transform: [{rotate: '180deg'}] }} color={C.textMuted} size={20} />
                    </TouchableOpacity>

                    {isBiometricSupported && (
                        <View style={s.settingRow}>
                            <View style={s.settingIconBg}><Fingerprint size={20} color={C.gold} /></View>
                            <View style={s.settingTextWrap}>
                                <Text style={s.settingLabel}>Biometric Unlock</Text>
                                <Text style={s.settingDesc}>Use Fingerprint or Face ID</Text>
                            </View>
                            <Switch 
                                trackColor={{ false: '#333', true: C.gold }}
                                thumbColor={C.white}
                                value={config.useBiometric}
                                onValueChange={(val) => updateConfig({ useBiometric: val })}
                            />
                        </View>
                    )}
                </View>

                <Text style={s.sectionTitle}>AUTO-LOCK SETTINGS</Text>
                <View style={s.settingGroup}>
                    {['immediately', '1', '5', '15', 'never'].map((timeout, i) => (
                        <TouchableOpacity key={i} style={s.timeoutRow} onPress={() => updateConfig({ autoLockTimeout: timeout })}>
                            <Text style={s.timeoutLabel}>
                                {timeout === 'immediately' ? 'Immediately' : timeout === 'never' ? 'Never' : `After ${timeout} minutes`}
                            </Text>
                            <View style={s.radioOuter}>
                                {config.autoLockTimeout === timeout && <View style={s.radioInner} />}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={s.sectionTitle}>PROTECTED MODULES</Text>
                <View style={s.settingGroup}>
                    {[
                        { id: 'PrivateWalletDashboard', label: 'Premium Private Wallet' },
                        { id: 'MediaVault', label: 'My Media' },
                        { id: 'MyMusic', label: 'My Music' },
                        { id: 'PasswordVault', label: 'ID & Password Vault' }
                    ].map((mod, i) => (
                        <View key={i} style={s.settingRow}>
                            <Text style={s.moduleLabel}>{mod.label}</Text>
                            <Switch 
                                trackColor={{ false: '#333', true: C.gold }}
                                thumbColor={C.white}
                                value={config.protectedModules.includes(mod.id)}
                                onValueChange={() => toggleModule(mod.id)}
                            />
                        </View>
                    ))}
                </View>

                <Text style={s.sectionTitle}>PRIVACY CONTROLS</Text>
                <View style={s.settingGroup}>
                    <View style={s.settingRow}>
                        <View style={s.settingIconBg}><EyeOff size={20} color={C.gold} /></View>
                        <View style={s.settingTextWrap}>
                            <Text style={s.settingLabel}>Hide Sensitive Amounts</Text>
                            <Text style={s.settingDesc}>Blur wallet balances globally</Text>
                        </View>
                        <Switch 
                            trackColor={{ false: '#333', true: C.gold }}
                            thumbColor={C.white}
                            value={config.privacyControls.hideAmounts}
                            onValueChange={() => togglePrivacyControl('hideAmounts')}
                        />
                    </View>
                </View>

                <TouchableOpacity style={s.lockNowBtn} onPress={() => lockApp()}>
                    <Lock size={18} color={C.black} />
                    <Text style={s.lockNowText}>Lock App Now</Text>
                </TouchableOpacity>
            </>
        )}

          {!config.enabled && (
          <View style={s.infoCard}>
            <Text style={s.infoTitle}>Your privacy matters</Text>
            <Text style={s.infoDesc}>App Lock protects sensitive areas of your app with an encrypted PIN. Data remains secured on your device.</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
        <SecurityFooter />
      </ScrollView>

      {/* SETUP PIN MODAL */}
      <Modal visible={setupPinModal} transparent={true} animationType="fade">
        <View style={s.modalOverlay}>
            <View style={s.modalContent}>
                <Text style={s.modalTitle}>
                    {pinStep === 'CREATE' ? 'Create PIN' : 'Confirm PIN'}
                </Text>
                <Text style={s.modalDesc}>
                    {pinStep === 'CREATE' ? 'Enter a 4-6 digit security PIN' : 'Re-enter your PIN to confirm'}
                </Text>

                <TextInput
                    style={s.pinInput}
                    value={pinInput}
                    onChangeText={t => { setPinInput(t.replace(/[^0-9]/g, '')); setErrorText(''); }}
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={6}
                    autoFocus
                />
                <Text style={s.error}>{errorText}</Text>

                <View style={s.modalActions}>
                    <TouchableOpacity style={s.modalCancel} onPress={() => setSetupPinModal(false)}>
                        <Text style={s.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.modalSubmit} onPress={processPinSetup}>
                        <Text style={s.modalSubmitText}>Next</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* DISABLE PIN MODAL */}
      <Modal visible={disablePinModal} transparent={true} animationType="fade">
        <View style={s.modalOverlay}>
            <View style={s.modalContent}>
                <Text style={s.modalTitle}>Verify Identity</Text>
                <Text style={s.modalDesc}>Enter your current PIN to disable App Lock</Text>

                <TextInput
                    style={s.pinInput}
                    value={pinInput}
                    onChangeText={t => { setPinInput(t.replace(/[^0-9]/g, '')); setErrorText(''); }}
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={6}
                    autoFocus
                />
                <Text style={s.error}>{errorText}</Text>

                <View style={s.modalActions}>
                    <TouchableOpacity style={s.modalCancel} onPress={() => setDisablePinModal(false)}>
                        <Text style={s.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.modalSubmitRed} onPress={processDisable}>
                        <Text style={s.modalSubmitRedText}>Disable</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* CHANGE PIN MODAL */}
      <Modal visible={changePinModal} transparent={true} animationType="fade">
        <View style={s.modalOverlay}>
            <View style={s.modalContent}>
                <Text style={s.modalTitle}>
                    {pinStep === 'VERIFY' ? 'Verify Current PIN' : pinStep === 'CREATE' ? 'Create New PIN' : 'Confirm New PIN'}
                </Text>
                
                <TextInput
                    style={s.pinInput}
                    value={pinInput}
                    onChangeText={t => { setPinInput(t.replace(/[^0-9]/g, '')); setErrorText(''); }}
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={6}
                    autoFocus
                />
                <Text style={s.error}>{errorText}</Text>

                <View style={s.modalActions}>
                    <TouchableOpacity style={s.modalCancel} onPress={() => setChangePinModal(false)}>
                        <Text style={s.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.modalSubmit} onPress={processChangePin}>
                        <Text style={s.modalSubmitText}>Next</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#06080D' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(240, 165, 0, 0.18)', backgroundColor: 'rgba(10, 10, 10, 0.92)'
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.white, letterSpacing: 0.3 },
  backBtn: { padding: 4 },
  
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  
  statusCard: { 
    alignItems: 'center', backgroundColor: 'rgba(22, 19, 13, 0.92)', padding: 24, 
    borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(240, 165, 0, 0.45)', 
    marginBottom: 24, shadowColor: C.gold, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 
  },
  statusTitle: { fontSize: 20, color: C.white, fontWeight: '800', marginTop: 12, marginBottom: 4, letterSpacing: 0.2 },
  statusDesc: { fontSize: 13, color: '#8E8E93', textAlign: 'center', marginBottom: 20, lineHeight: 19 },
  mainToggleBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  mainToggleText: { fontWeight: '800', fontSize: 14 },
  
  sectionTitle: { fontSize: 11, color: '#8E8E93', fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 12 },
  
  settingGroup: { 
    backgroundColor: 'rgba(255, 255, 255, 0.035)', borderRadius: 16, 
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', 
    overflow: 'hidden', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 2 
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.06)' },
  settingIconBg: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(240, 165, 0, 0.12)', borderWidth: 1, borderColor: 'rgba(240, 165, 0, 0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingTextWrap: { flex: 1 },
  settingLabel: { fontSize: 15, color: C.white, fontWeight: '700', marginBottom: 2, letterSpacing: 0.2 },
  settingDesc: { fontSize: 12, color: '#8E8E93' },
  
  moduleLabel: { flex: 1, fontSize: 15, color: C.white, fontWeight: '600' },
  
  timeoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.06)' },
  timeoutLabel: { fontSize: 15, color: C.white, fontWeight: '500' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.gold, justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.gold },
  
  lockNowBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.gold, padding: 16, borderRadius: 12, marginTop: 12 },
  lockNowText: { color: C.black, fontSize: 16, fontWeight: '700', marginLeft: 8 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 360, backgroundColor: C.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: C.border },
  modalTitle: { fontSize: 20, color: C.white, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  modalDesc: { fontSize: 13, color: C.textMuted, textAlign: 'center', marginBottom: 24 },
  pinInput: { width: '100%', height: 50, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: C.border, borderRadius: 8, color: C.white, fontSize: 24, textAlign: 'center', letterSpacing: 10, outlineStyle: 'none' },
  error: { color: '#F44336', fontSize: 13, marginTop: 12, textAlign: 'center', height: 20 },
  
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  modalCancel: { flex: 1, padding: 14, alignItems: 'center' },
  modalCancelText: { color: C.textMuted, fontSize: 15, fontWeight: '600' },
  modalSubmit: { flex: 1, backgroundColor: C.gold, padding: 14, borderRadius: 8, alignItems: 'center' },
  modalSubmitText: { color: C.black, fontSize: 15, fontWeight: '700' },
  modalSubmitRed: { flex: 1, backgroundColor: 'rgba(244,67,54,0.1)', borderWidth: 1, borderColor: 'rgba(244,67,54,0.3)', padding: 14, borderRadius: 8, alignItems: 'center' },
  
  modalSubmitRedText: { color: '#F44336', fontSize: 15, fontWeight: '700' },
  infoCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginTop: 24, alignItems: 'center' },
  infoTitle: { color: C.white, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  infoDesc: { color: C.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }

});
