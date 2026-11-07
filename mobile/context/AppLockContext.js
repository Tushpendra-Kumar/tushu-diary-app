import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { AppState, View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Animated, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { AuthContext } from './AuthContext';
import { getAppLockConfig, verifyPin, recordAppBackgroundTime, getAppBackgroundTime } from '../services/appLockService';
import { C } from '../constants/theme';
import { Lock, Fingerprint, ShieldAlert, X } from 'lucide-react-native';
import ParticleBackground from '../components/ParticleBackground';

export const AppLockContext = createContext();

export const AppLockProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [isLocked, setIsLocked] = useState(false);
  const [config, setConfig] = useState(null);
  const appState = useRef(AppState.currentState);
  const [pinInput, setPinInput] = useState('');
  const [errorText, setErrorText] = useState('');
  const [targetModule, setTargetModule] = useState(null);

  const loadConfig = async () => {
    if (user?.user_id) {
      const c = await getAppLockConfig(user.user_id);
      setConfig(c);
    }
  };

  useEffect(() => {
    loadConfig();
  }, [user?.user_id]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async nextAppState => {
      if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        await recordAppBackgroundTime();
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (config?.enabled && user?.user_id && !isLocked) {
           const bgTime = await getAppBackgroundTime();
           if (bgTime) {
             const now = Date.now();
             const diffMins = (now - bgTime) / 60000;
             let shouldLock = false;
             
             if (config.autoLockTimeout === 'immediately') shouldLock = true;
             else if (config.autoLockTimeout === '1') shouldLock = diffMins >= 1;
             else if (config.autoLockTimeout === '5') shouldLock = diffMins >= 5;
             else if (config.autoLockTimeout === '15') shouldLock = diffMins >= 15;
             
             if (shouldLock) {
                 lockApp();
             }
           }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [config, user, isLocked]);

  const lockApp = () => {
      setIsLocked(true);
      setPinInput('');
      setErrorText('');
      if (config?.useBiometric) {
          triggerBiometric();
      }
  };

  const triggerBiometric = async () => {
      if (Platform.OS === 'web') return; // Biometric usually not supported for our web flow seamlessly here
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (hasHardware && isEnrolled) {
          const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Unlock Application',
              fallbackLabel: 'Use PIN',
              cancelLabel: 'Cancel'
          });
          if (result.success) {
              unlockApp();
          }
      }
  };

  const unlockApp = () => {
      setIsLocked(false);
      setPinInput('');
      setErrorText('');
      setTargetModule(null);
  };

  const handlePinSubmit = async () => {
      if (pinInput.length < 4) {
          setErrorText('PIN must be at least 4 digits');
          return;
      }
      const isValid = await verifyPin(user.user_id, pinInput);
      if (isValid) {
          unlockApp();
      } else {
          setErrorText('Incorrect PIN. Try again.');
          setPinInput('');
      }
  };

  const requireAuthForModule = (moduleName, onSuccess) => {
      if (config && config.enabled && config.protectedModules.includes(moduleName)) {
          setTargetModule({ name: moduleName, onSuccess });
          lockApp();
      } else {
          onSuccess();
      }
  };

  return (
    <AppLockContext.Provider value={{ config, loadConfig, lockApp, requireAuthForModule }}>
      {children}
      
      <Modal visible={isLocked} animationType="fade" transparent={false}>
        <View style={s.lockContainer}>
            <ParticleBackground />
            <View style={s.content}>
                <View style={s.iconWrap}>
                    <Lock size={40} color={C.gold} />
                </View>
                <Text style={s.lockTitle}>App Locked</Text>
                {targetModule && <Text style={s.lockSub}>Authentication required for {targetModule.name}</Text>}
                
                <TextInput
                    style={s.pinInput}
                    value={pinInput}
                    onChangeText={t => { setPinInput(t.replace(/[^0-9]/g, '')); setErrorText(''); }}
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={6}
                    placeholder="Enter PIN"
                    placeholderTextColor={C.textMuted}
                    underlineColorAndroid="transparent"
                    autoFocus
                    onSubmitEditing={handlePinSubmit}
                />
                
                {errorText ? <Text style={s.error}>{errorText}</Text> : <View style={{height:20}} />}

                <View style={s.row}>
                    <TouchableOpacity style={s.submitBtn} onPress={handlePinSubmit}>
                        <Text style={s.submitText}>Unlock</Text>
                    </TouchableOpacity>
                    
                    {config?.useBiometric && Platform.OS !== 'web' && (
                        <TouchableOpacity style={s.bioBtn} onPress={triggerBiometric}>
                            <Fingerprint size={24} color={C.white} />
                        </TouchableOpacity>
                    )}
                </View>

                {targetModule && (
                    <TouchableOpacity style={s.cancelBtn} onPress={() => { setIsLocked(false); setTargetModule(null); }}>
                        <X size={16} color={C.textMuted} />
                        <Text style={s.cancelText}>Cancel & Go Back</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
      </Modal>
    </AppLockContext.Provider>
  );
};

const s = StyleSheet.create({
    lockContainer: { flex: 1, backgroundColor: C.background, justifyContent: 'center', alignItems: 'center' },
    content: { width: '85%', maxWidth: 400, backgroundColor: 'rgba(20,20,20,0.95)', padding: 32, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: C.border },
    iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 193, 7, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    lockTitle: { fontSize: 24, fontWeight: '700', color: C.white, marginBottom: 8 },
    lockSub: { fontSize: 13, color: C.textMuted, textAlign: 'center', marginBottom: 24 },
    pinInput: { width: '100%', height: 56, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.gold, fontSize: 24, textAlign: 'center', letterSpacing: 8, marginBottom: 8, outlineStyle: 'none' },
    error: { color: '#F44336', fontSize: 13, marginBottom: 12, height: 20 },
    row: { flexDirection: 'row', width: '100%', gap: 12 },
    submitBtn: { flex: 1, backgroundColor: C.gold, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    submitText: { color: C.black, fontSize: 16, fontWeight: '700' },
    bioBtn: { width: 50, height: 50, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
    cancelBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 24, padding: 8 },
    cancelText: { color: C.textMuted, marginLeft: 6, fontSize: 14 }
});
