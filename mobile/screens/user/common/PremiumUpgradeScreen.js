import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, ActivityIndicator, Alert,
  Platform, Image, Share
} from 'react-native';
import {
  Gem, Crown, CheckCircle2, Copy, ExternalLink,
  ShieldCheck, ArrowLeft, Sparkles, Lock, Smartphone,
  Wallet, Cloud, PieChart, FileText, Bell, RefreshCw
} from 'lucide-react-native';
import ParticleBackground from '../../../components/ParticleBackground';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import { AuthContext } from '../../../context/AuthContext';
import { PAYMENT_CONFIG } from '../../../config/paymentConfig';
import {
  getPaymentConfig,
  getUserPremiumStatus,
  submitUpiPaymentVerification,
  generateUpiDeepLink,
  openUpiApp
} from '../../../services/paymentService';

export default function PremiumUpgradeScreen({ navigation }) {
  const { user, activateLifetimePremium } = useContext(AuthContext);

  const [config, setConfig] = useState(PAYMENT_CONFIG);
  const [utrNumber, setUtrNumber] = useState('');
  const [selectedApp, setSelectedApp] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const isAlreadyPremium = user?.is_premium || user?.role === 'ADMIN';

  useEffect(() => {
    getPaymentConfig().then(cfg => {
      if (cfg) setConfig(cfg);
    });
  }, []);

  const upiId = config.defaultUpiId || 'tushpendrakumar@okaxis';
  const amount = config.amount || 499;
  const upiUrl = generateUpiDeepLink({
    upiId,
    amount,
    note: `TushuDiary_Premium_${user?.user_id || 'User'}`
  });

  // QR Code generator URL using public high-res QR service
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(upiUrl)}`;

  const handleCopyUpi = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(upiId);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      Alert.alert('UPI ID', `Active UPI ID:\n\n${upiId}\n\nOpen your UPI app (PhonePe, GPay, Paytm) and pay ₹${amount} to activate Lifetime Premium.`);
    } catch (e) {
      Alert.alert('UPI ID', upiId);
    }
  };

  const handleLaunchUpi = async (appName = 'UPI') => {
    setSelectedApp(appName);
    const res = await openUpiApp(upiUrl);
    if (!res.success) {
      handleCopyUpi();
    }
  };

  const handleSubmitVerification = async () => {
    if (!utrNumber || utrNumber.trim().length < 6) {
      Alert.alert(
        'UTR Number Required',
        'Please enter the 12-digit UPI Reference / UTR Number from your payment receipt.'
      );
      return;
    }

    setVerifying(true);
    try {
      const res = await submitUpiPaymentVerification({
        userId: user?.user_id || user?.id,
        utrNumber: utrNumber.trim(),
        upiId,
        amount,
        appName: selectedApp
      });

      if (res && res.success) {
        await activateLifetimePremium({
          utrNumber: utrNumber.trim(),
          amount,
          upiId
        });

        setSuccessData(res.data);
        Alert.alert(
          '🎉 Premium Activated!',
          'Congratulations! Lifetime Premium access is now permanently active on your account.',
          [{ text: 'Explore Premium Features', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Verification Issue', res.message || 'Could not verify payment. Please check your UTR number.');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Network error while verifying payment.');
    } finally {
      setVerifying(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const status = await getUserPremiumStatus(user?.user_id || user?.id);
      if (status && status.isPremium) {
        await activateLifetimePremium(status);
        Alert.alert('Restored!', 'Your Lifetime Premium access has been restored successfully.');
      } else {
        Alert.alert('No Record Found', 'We could not find an active payment record for this account. If you paid, please submit your UTR number below.');
      }
    } catch (e) {
      Alert.alert('Restore Error', 'Could not reach server to verify. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />

      {/* Top Header */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ArrowLeft size={20} color={C.white} />
        </TouchableOpacity>
        <View style={s.topBarTitles}>
          <Text style={s.headerTitle}>Lifetime Premium</Text>
          <Text style={s.headerSubtitle}>Permanent Access • ₹499 One-Time</Text>
        </View>
        <TouchableOpacity style={s.restoreBtn} onPress={handleRestore} activeOpacity={0.7}>
          <RefreshCw size={16} color={C.gold} />
          <Text style={s.restoreBtnText}>Restore</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── ALREADY PREMIUM CELEBRATION CARD ── */}
        {isAlreadyPremium ? (
          <View style={s.activePremCard}>
            <View style={s.activePremIconWrap}>
              <Crown size={36} color={C.gold} />
            </View>
            <Text style={s.activePremTitle}>👑 Lifetime VIP Member</Text>
            <Text style={s.activePremSub}>
              All 14+ Premium features, Private Wallet, App Lock, Cloud Sync & Analytics are permanently unlocked on your account.
            </Text>
            <View style={s.activePremBadge}>
              <CheckCircle2 size={16} color="#10B981" />
              <Text style={s.activePremBadgeText}>LIFETIME ACCESS • ACTIVE</Text>
            </View>
          </View>
        ) : (
          <>
            {/* ── HERO VALUE BANNER ── */}
            <View style={s.heroCard}>
              <View style={s.heroCrownBadge}>
                <Crown size={28} color={C.gold} />
              </View>
              <Text style={s.heroPlanName}>{config.planName}</Text>
              <View style={s.priceRow}>
                <Text style={s.priceSymbol}>₹</Text>
                <Text style={s.priceAmount}>{amount}</Text>
                <View style={s.oneTimePill}>
                  <Text style={s.oneTimePillText}>ONE-TIME ONLY</Text>
                </View>
              </View>
              <Text style={s.heroTagline}>
                Pay once. Keep forever. No monthly subscriptions, no recurring renewals.
              </Text>
            </View>

            {/* ── VIP FEATURES LIST ── */}
            <View style={s.featuresBlock}>
              <Text style={s.sectionHeader}>WHAT'S INCLUDED IN LIFETIME PREMIUM</Text>
              <View style={s.featuresCard}>
                {config.features.map((item, idx) => (
                  <View key={item.id || idx} style={s.featureRow}>
                    <View style={s.featureCheckWrap}>
                      <CheckCircle2 size={18} color={C.gold} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={s.featureTitle}>{item.title}</Text>
                      <Text style={s.featureDesc}>{item.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* ── STEP 1: PAYMENT VIA UPI ── */}
            <View style={s.payBlock}>
              <View style={s.stepBadge}>
                <Text style={s.stepBadgeText}>STEP 1 OF 2</Text>
              </View>
              <Text style={s.payBlockTitle}>Pay ₹{amount} via any UPI App</Text>
              <Text style={s.payBlockDesc}>
                Scan the QR code below or click any UPI app to transfer ₹{amount} directly to the official CodeByTushu UPI ID.
              </Text>

              {/* UPI ID Box */}
              <View style={s.upiIdCard}>
                <View style={{ flex: 1 }}>
                  <Text style={s.upiLabel}>RECEIVER UPI ID</Text>
                  <Text style={s.upiValue} numberOfLines={1}>{upiId}</Text>
                </View>
                <TouchableOpacity style={s.copyUpiBtn} onPress={handleCopyUpi} activeOpacity={0.75}>
                  <Copy size={16} color={C.gold} />
                  <Text style={s.copyUpiBtnText}>{copied ? 'COPIED!' : 'COPY'}</Text>
                </TouchableOpacity>
              </View>

              {/* Dynamic QR Code Card */}
              <View style={s.qrBox}>
                <Image
                  source={{ uri: qrCodeUrl }}
                  style={s.qrImage}
                  resizeMode="contain"
                />
                <View style={s.qrCaptionRow}>
                  <Sparkles size={14} color={C.gold} />
                  <Text style={s.qrCaptionText}>Scan using GPay, PhonePe, Paytm or BHIM</Text>
                </View>
              </View>

              {/* Quick App Intent Launch Buttons */}
              <View style={s.upiAppRow}>
                <TouchableOpacity
                  style={s.upiAppBtn}
                  onPress={() => handleLaunchUpi('PhonePe')}
                  activeOpacity={0.75}
                >
                  <Smartphone size={16} color="#6739B7" />
                  <Text style={s.upiAppBtnText}>PhonePe</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.upiAppBtn}
                  onPress={() => handleLaunchUpi('GPay')}
                  activeOpacity={0.75}
                >
                  <Smartphone size={16} color="#34A853" />
                  <Text style={s.upiAppBtnText}>Google Pay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.upiAppBtn}
                  onPress={() => handleLaunchUpi('Paytm')}
                  activeOpacity={0.75}
                >
                  <Smartphone size={16} color="#00BAF2" />
                  <Text style={s.upiAppBtnText}>Paytm</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.upiAppBtn, s.upiAppBtnGold]}
                  onPress={() => handleLaunchUpi('ALL')}
                  activeOpacity={0.75}
                >
                  <ExternalLink size={16} color={C.gold} />
                  <Text style={[s.upiAppBtnText, { color: C.gold }]}>Any UPI</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── STEP 2: UTR NUMBER INPUT ── */}
            <View style={s.utrBlock}>
              <View style={s.stepBadge}>
                <Text style={s.stepBadgeText}>STEP 2 OF 2</Text>
              </View>
              <Text style={s.payBlockTitle}>Submit UPI Reference / UTR Number</Text>
              <Text style={s.payBlockDesc}>
                After successful payment, enter the 12-digit UTR / Transaction Reference Number from your payment confirmation screen to activate Lifetime Premium instantly.
              </Text>

              <View style={s.inputWrap}>
                <TextInput
                  style={s.utrInput}
                  placeholder="e.g. 432109876543 (12-digit UTR)"
                  placeholderTextColor="rgba(255, 255, 255, 0.35)"
                  value={utrNumber}
                  onChangeText={setUtrNumber}
                  autoCapitalize="characters"
                  maxLength={24}
                />
              </View>

              <TouchableOpacity
                style={[s.verifyBtn, verifying && { opacity: 0.6 }]}
                onPress={handleSubmitVerification}
                disabled={verifying}
                activeOpacity={0.82}
              >
                {verifying ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Crown size={18} color="#000" />
                    <Text style={s.verifyBtnText}>Activate Lifetime Premium (₹{amount})</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={s.guaranteeRow}>
                <ShieldCheck size={16} color="#10B981" />
                <Text style={s.guaranteeText}>
                  100% Secure • Lifetime Access Tied to Your Account Permanently
                </Text>
              </View>
            </View>
          </>
        )}

        <SecurityFooter style={{ marginTop: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#05070D' },
  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(10, 14, 22, 0.95)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitles: { flex: 1, marginLeft: 12 },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  headerSubtitle: { color: C.gold, fontSize: 11, fontWeight: '600', marginTop: 1 },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(240, 165, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.3)',
  },
  restoreBtnText: { color: C.gold, fontSize: 11, fontWeight: '700' },

  // Hero Card
  heroCard: {
    backgroundColor: 'rgba(18, 22, 34, 0.95)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(240, 165, 0, 0.45)',
    padding: 22,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  heroCrownBadge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(240, 165, 0, 0.15)',
    borderWidth: 1.4,
    borderColor: 'rgba(240, 165, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroPlanName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  priceSymbol: { color: C.gold, fontSize: 24, fontWeight: '800', marginRight: 2 },
  priceAmount: { color: '#FFFFFF', fontSize: 44, fontWeight: '900', letterSpacing: -1 },
  oneTimePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 10,
  },
  oneTimePillText: { color: '#10B981', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  heroTagline: {
    color: '#A0AEC0',
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Active Premium Card
  activePremCard: {
    backgroundColor: 'rgba(18, 26, 20, 0.95)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#10B981',
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  activePremIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(240, 165, 0, 0.15)',
    borderWidth: 1.5,
    borderColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  activePremTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginBottom: 6 },
  activePremSub: { color: '#A0AEC0', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 14 },
  activePremBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  activePremBadgeText: { color: '#10B981', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  // Features Block
  featuresBlock: { marginBottom: 20 },
  sectionHeader: {
    color: '#8A99AC',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 10,
    marginLeft: 4,
  },
  featuresCard: {
    backgroundColor: 'rgba(14, 18, 26, 0.92)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    gap: 14,
  },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start' },
  featureCheckWrap: { marginTop: 2 },
  featureTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  featureDesc: { color: '#8E9BAE', fontSize: 11.5, lineHeight: 16 },

  // Pay Block & Step
  payBlock: {
    backgroundColor: 'rgba(14, 18, 26, 0.95)',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(240, 165, 0, 0.35)',
    padding: 18,
    marginBottom: 18,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(240, 165, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: 'rgba(240, 165, 0, 0.4)',
    marginBottom: 8,
  },
  stepBadgeText: { color: C.gold, fontSize: 9.5, fontWeight: '800', letterSpacing: 1 },
  payBlockTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  payBlockDesc: { color: '#A0AEC0', fontSize: 12, lineHeight: 18, marginBottom: 14 },

  // UPI ID Card
  upiIdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 24, 34, 0.95)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 12,
    marginBottom: 14,
  },
  upiLabel: { color: '#718096', fontSize: 9.5, fontWeight: '700', letterSpacing: 1 },
  upiValue: { color: C.gold, fontSize: 15, fontWeight: '800', marginTop: 2 },
  copyUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(240, 165, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.35)',
  },
  copyUpiBtnText: { color: C.gold, fontSize: 11, fontWeight: '800' },

  // QR Code Box
  qrBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrCaptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  qrCaptionText: {
    color: '#1A202C',
    fontSize: 11,
    fontWeight: '700',
  },

  // UPI App Intent Buttons
  upiAppRow: {
    flexDirection: 'row',
    gap: 8,
  },
  upiAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  upiAppBtnGold: {
    backgroundColor: 'rgba(240, 165, 0, 0.12)',
    borderColor: 'rgba(240, 165, 0, 0.35)',
  },
  upiAppBtnText: { color: '#E2E8F0', fontSize: 11, fontWeight: '700' },

  // UTR Block
  utrBlock: {
    backgroundColor: 'rgba(14, 18, 26, 0.95)',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    padding: 18,
    marginBottom: 20,
  },
  inputWrap: {
    backgroundColor: 'rgba(10, 12, 18, 0.95)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 14,
    paddingVertical: 2,
    marginBottom: 14,
  },
  utrInput: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    height: 48,
    letterSpacing: 1.2,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.gold,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  verifyBtnText: { color: '#000000', fontSize: 14.5, fontWeight: '900', letterSpacing: 0.2 },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  guaranteeText: { color: '#10B981', fontSize: 10.5, fontWeight: '600' },
});
