import React, { useContext, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../constants/theme';
import SecurityFooter from '../components/SecurityFooter';
import ParticleBackground from '../components/ParticleBackground';
import BrandLogo from '../components/BrandLogo';
import { GoogleIcon } from '../components/SocialIcons';
import { AuthContext } from '../context/AuthContext';
import { performSocialAuth } from '../services/socialAuthService';

export default function WelcomeScreen({ navigation }) {
  const { socialLogin } = useContext(AuthContext);
  const [socialLoading, setSocialLoading] = useState(false);

  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0);
  const bottomInset = Math.max(insets.bottom, 16);

  const handleSocialAuth = async (providerName) => {
    if (socialLoading) return;
    setSocialLoading(true);
    try {
      await performSocialAuth(providerName, socialLogin);
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <ParticleBackground />
      <View style={[styles.container, { paddingTop: topInset + 20, paddingBottom: bottomInset }]}>
        <View style={styles.content}>
          {/* Brand Monogram T+D */}
          <BrandLogo size={96} style={{ marginBottom: 16 }} />

          {/* Titles */}
          <Text style={styles.title}>TushuDiary</Text>
          <Text style={styles.subtitle}>Your Life, Your Diary.</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Primary Action: Create Account */}
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Register')}
          >
            <View style={styles.btnRow}>
              <Feather name="user-plus" size={20} color="#000000" style={styles.btnIconLeft} />
              <Text style={styles.primaryBtnText}>Create Account</Text>
              <Feather name="chevron-right" size={20} color="#000000" style={styles.btnIconRight} />
            </View>
          </TouchableOpacity>

          {/* Secondary Action: Login */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Login')}
          >
            <View style={styles.btnRow}>
              <Feather name="log-in" size={20} color={C.gold} style={styles.btnIconLeft} />
              <Text style={styles.secondaryBtnText}>Already have an account? Login</Text>
              <Feather name="chevron-right" size={20} color={C.gold} style={styles.btnIconRight} />
            </View>
          </TouchableOpacity>

          {/* OR Divider */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          {/* Google Direct Sign In */}
          <TouchableOpacity 
            style={[styles.googleBtn, socialLoading && { opacity: 0.6 }]} 
            activeOpacity={0.85}
            disabled={socialLoading}
            onPress={() => handleSocialAuth('Google')}
          >
            <View style={styles.googleBtnContent}>
              <View style={styles.googleIconBox}>
                <GoogleIcon size={22} />
              </View>
              <Text style={styles.googleBtnText}>
                {socialLoading ? 'Connecting Google...' : 'Continue with Google'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <SecurityFooter style={{ marginTop: 'auto', marginBottom: 12 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#06080D',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoOuterRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: 'rgba(240, 165, 0, 0.40)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 165, 0, 0.05)',
    marginBottom: 28,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  logoInnerRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1.5,
    borderColor: 'rgba(240, 165, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 165, 0, 0.10)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
    maxWidth: 280,
  },
  actions: {
    width: '100%',
    paddingBottom: 16,
    gap: 12,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.gold,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    paddingHorizontal: 18,
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 165, 0, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(240, 165, 0, 0.40)',
    paddingHorizontal: 18,
  },
  secondaryBtnText: {
    color: C.gold,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  btnIconLeft: {
    marginRight: 6,
  },
  btnIconRight: {
    marginLeft: 6,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 8,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  orText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 14,
    letterSpacing: 0.8,
  },
  googleBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  googleBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconBox: {
    marginRight: 12,
  },
  googleBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
