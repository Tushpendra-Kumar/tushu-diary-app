import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, inputResetStyle } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SecurityFooter from '../components/SecurityFooter';
import { GoogleIcon } from '../components/SocialIcons';
import ParticleBackground from '../components/ParticleBackground';
import BrandLogo from '../components/BrandLogo';
import { performSocialAuth } from '../services/socialAuthService';

// Self-contained, non-re-rendering Input Field (rock-solid focus stability)
const FormInput = ({ 
  label, 
  icon, 
  prefixIcon, 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry, 
  autoCapitalize, 
  keyboardType, 
  showPasswordToggle, 
  showPassword, 
  onTogglePassword 
}) => {
  return (
    <View style={{ width: '100%', marginBottom: 12 }}>
      <View style={styles.labelRow}>
        <Feather name={icon} style={styles.labelIcon} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.inputRow}>
        <Feather name={prefixIcon || icon} style={styles.inputPrefixIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize || 'none'}
          keyboardType={keyboardType || 'default'}
          autoCorrect={false}
          spellCheck={false}
          autoComplete="off"
          importantForAutofill="no"
          underlineColorAndroid="transparent"
        />
        {showPasswordToggle && (
          <TouchableOpacity 
            onPress={onTogglePassword} 
            style={styles.eyeBtn}
            activeOpacity={0.7}
          >
            <Feather name={showPassword ? 'eye' : 'eye-off'} style={styles.eyeIcon} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [socialLoading, setSocialLoading] = useState(false);

  const { login, socialLogin } = useContext(AuthContext);

  // Load saved Email/User ID when screen mounts
  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('tushu_saved_userid');
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        } else {
          setRememberMe(false);
        }
      } catch (e) {
        console.log('Error loading saved credentials', e);
      }
    };
    loadSavedEmail();
  }, []);

  const handleLogin = async () => {
    if (loading) return;
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both Email ID and Password.');
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (result.success) {
      try {
        if (rememberMe) {
          await AsyncStorage.setItem('tushu_saved_userid', email.trim());
          await AsyncStorage.setItem('tushu_remember_me', 'true');
        } else {
          await AsyncStorage.removeItem('tushu_saved_userid');
          await AsyncStorage.setItem('tushu_remember_me', 'false');
        }
      } catch (e) {
        console.log('Error saving credentials preference', e);
      }
    } else {
      Alert.alert('Login Failed', result.message || 'Please check your credentials.');
    }
  };

  const handleSocialAuth = async (providerName) => {
    if (socialLoading || loading) return;
    setSocialLoading(true);
    try {
      await performSocialAuth(providerName, socialLogin);
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ParticleBackground />
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled" 
          showsVerticalScrollIndicator={false}
        >
          {/* Unified Auth Card */}
          <View style={styles.card}>
            {/* Brand Monogram T+D */}
            <BrandLogo size={74} style={{ marginBottom: 12, alignSelf: 'center' }} />

            {/* Title & Subtitle */}
            <Text style={styles.title}>Login</Text>
            <Text style={styles.subtitle}>Enter your email & password to continue</Text>

            {/* Title Divider */}
            <View style={styles.titleDividerContainer}>
              <View style={styles.titleDividerLine} />
              <View style={styles.titleDividerGlow} />
              <View style={styles.titleDividerLine} />
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email Address */}
              <FormInput
                label="Email ID"
                icon="mail"
                prefixIcon="at-sign"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              {/* Password */}
              <FormInput
                label="Password"
                icon="lock"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                showPasswordToggle={true}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />

              {/* Remember Me & Forgot Password Row */}
              <View style={styles.rememberRow}>
                <TouchableOpacity 
                  style={styles.checkboxContainer} 
                  activeOpacity={0.7}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={[styles.checkboxBase, rememberMe && styles.checkboxSelected]}>
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => navigation.navigate('ForgotPassword')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <View style={styles.btnRow}>
                    <Feather name="log-in" size={17} color="#000000" style={{ marginRight: 8 }} />
                    <Text style={styles.actionButtonText}>Login</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Sign Up Navigation Link */}
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
                  <Text style={styles.footerLink}>Sign up</Text>
                </TouchableOpacity>
              </View>

              {/* Social Login Divider */}
              <View style={styles.orDividerContainer}>
                <View style={styles.orDividerLine} />
                <Text style={styles.orText}>OR LOGIN WITH</Text>
                <View style={styles.orDividerLine} />
              </View>

              {/* Google Direct Sign-In Button */}
              <TouchableOpacity 
                style={[styles.googleSignInBtn, (socialLoading || loading) && { opacity: 0.6 }]} 
                activeOpacity={0.82}
                disabled={socialLoading || loading}
                onPress={() => handleSocialAuth('Google')}
              >
                <View style={styles.googleIconBox}>
                  <GoogleIcon size={18} />
                </View>
                <Text style={styles.googleSignInText}>
                  {socialLoading ? 'Connecting Google...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Compact Brand & Security Footer */}
            <SecurityFooter compact={true} style={{ marginTop: 8 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#06080D',
  },
  kav: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(240, 165, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(240, 165, 0, 0.28)',
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: 2,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(240, 165, 0, 0.35)',
    elevation: 10,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  logoOuterRing: {
    alignSelf: 'center',
    marginBottom: 10,
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: 'rgba(240, 165, 0, 0.55)',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInnerRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: C.white,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#D0D0D0',
    textAlign: 'center',
    marginBottom: 12,
  },
  titleDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    alignSelf: 'center',
    width: '65%',
  },
  titleDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(240, 165, 0, 0.25)',
  },
  titleDividerGlow: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.gold,
    marginHorizontal: 10,
  },
  form: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    marginLeft: 2,
  },
  labelIcon: {
    fontSize: 13,
    color: C.gold,
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: C.white,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(240, 165, 0, 0.38)',
    marginBottom: 11,
    paddingHorizontal: 14,
    height: 48,
  },
  inputRowFocused: {
    borderColor: C.gold,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  inputPrefixIcon: {
    fontSize: 16,
    marginRight: 10,
    color: C.gold,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontSize: 14,
    color: C.white,
    fontWeight: '500',
    ...inputResetStyle,
  },
  eyeBtn: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 18,
    color: C.gold,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
    marginTop: 2,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBase: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: 'rgba(240, 165, 0, 0.2)',
    borderColor: C.gold,
  },
  checkmark: {
    color: C.gold,
    fontSize: 11,
    fontWeight: 'bold',
  },
  rememberText: {
    color: '#D0D0D0',
    fontSize: 12,
  },
  forgotText: {
    color: C.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: C.gold,
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    marginTop: 2,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  footerText: {
    color: '#D0D0D0',
    fontSize: 12,
  },
  footerLink: {
    color: C.gold,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  orDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  orText: {
    color: '#8E8E93',
    paddingHorizontal: 8,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  googleSignInBtn: {
    width: '100%',
    height: 46,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  googleIconBox: {
    marginRight: 10,
  },
  googleSignInText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
