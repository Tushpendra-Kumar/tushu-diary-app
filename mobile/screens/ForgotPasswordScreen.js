import React, { useState, useContext } from 'react';
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
import ParticleBackground from '../components/ParticleBackground';
import SecurityFooter from '../components/SecurityFooter';
import BrandLogo from '../components/BrandLogo';

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
      </View>
    </View>
  );
};

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const { forgotPassword } = useContext(AuthContext);

  const handleSendReset = async () => {
    if (loading) return;
    if (!email.trim()) {
      Alert.alert('Missing Email', 'Please enter your account Email ID.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const result = await forgotPassword(email.trim());
    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Check Your Email',
        'If an account exists with this email address, password reset instructions have been dispatched.\n\nPlease check your inbox and spam folder.',
        [
          {
            text: 'Back to Login',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } else {
      Alert.alert('Request Failed', result.message || 'Unable to process password reset request.');
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
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a password reset link</Text>

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
                label="Email ID *"
                icon="mail"
                prefixIcon="at-sign"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                onPress={handleSendReset}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <View style={styles.btnRow}>
                    <Feather name="mail" size={17} color="#000" style={{ marginRight: 8 }} />
                    <Text style={styles.actionButtonText}>Send Reset Link</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Remember your password? Login */}
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Remember your password? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                  <Text style={styles.footerLink}>Login</Text>
                </TouchableOpacity>
              </View>
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
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(240, 165, 0, 0.38)',
    marginBottom: 14,
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
  actionButton: {
    backgroundColor: C.gold,
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 4,
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
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
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
});
