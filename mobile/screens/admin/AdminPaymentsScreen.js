import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import {
  CreditCard, ArrowLeft, RefreshCw, Search, ShieldCheck,
  CheckCircle2, DollarSign, Users, Sparkles, Copy, Edit3, Save
} from 'lucide-react-native';
import ParticleBackground from '../../components/ParticleBackground';
import SecurityFooter from '../../components/SecurityFooter';
import { C } from '../../constants/theme';
import { fetchAdminPayments } from '../../services/paymentService';
import { PAYMENT_CONFIG } from '../../config/paymentConfig';

export default function AdminPaymentsScreen({ navigation }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUpiId, setCurrentUpiId] = useState(PAYMENT_CONFIG.defaultUpiId);
  const [editingUpi, setEditingUpi] = useState(false);
  const [tempUpi, setTempUpi] = useState(PAYMENT_CONFIG.defaultUpiId);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAdminPayments();
      setPayments(data || []);
    } catch (e) {
      console.warn('Error loading payments:', e.message);
      // Fallback empty
      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  const handleSaveUpi = () => {
    if (!tempUpi.trim().includes('@')) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid UPI ID (e.g. yourname@okaxis).');
      return;
    }
    setCurrentUpiId(tempUpi.trim());
    PAYMENT_CONFIG.defaultUpiId = tempUpi.trim();
    setEditingUpi(false);
    Alert.alert('UPI ID Updated', `Active receiver UPI ID set to: ${tempUpi.trim()}`);
  };

  const totalRevenue = payments.reduce((acc, p) => acc + (Number(p.amount) || 499), 0);
  const totalVerified = payments.filter(p => p.status === 'ACTIVE' || p.status === 'CONFIRMED').length;

  const filtered = payments.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.user_id && p.user_id.toLowerCase().includes(q)) ||
      (p.utr_number && p.utr_number.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />

      {/* Top Bar */}
      <View style={s.topBar}>
        <View style={{ width: 40 }} />
        <View style={s.topBarTitles}>
          <Text style={s.headerTitle}>Payments & Subscriptions</Text>
          <Text style={s.headerSubtitle}>Lifetime Premium User Records & Revenue</Text>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
          <RefreshCw size={16} color={C.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
      >
        {/* ── METRIC STAT CARDS ── */}
        <View style={s.metricsRow}>
          <View style={[s.metricCard, { borderColor: 'rgba(240, 165, 0, 0.45)' }]}>
            <View style={[s.metricIconWrap, { backgroundColor: 'rgba(240, 165, 0, 0.15)' }]}>
              <DollarSign size={20} color={C.gold} />
            </View>
            <Text style={s.metricValue}>₹{totalRevenue}</Text>
            <Text style={s.metricLabel}>TOTAL REVENUE</Text>
          </View>

          <View style={[s.metricCard, { borderColor: 'rgba(16, 185, 129, 0.45)' }]}>
            <View style={[s.metricIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Users size={20} color="#10B981" />
            </View>
            <Text style={[s.metricValue, { color: '#10B981' }]}>{totalVerified}</Text>
            <Text style={s.metricLabel}>PAID VIP USERS</Text>
          </View>
        </View>

        {/* ── RECEIVER UPI ID SETTING CARD ── */}
        <View style={s.upiCard}>
          <View style={s.upiCardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.upiCardTag}>ACTIVE PAYMENT RECEIVER</Text>
              <Text style={s.upiCardTitle}>UPI ID for ₹499 Payments</Text>
            </View>
            {!editingUpi ? (
              <TouchableOpacity
                style={s.editUpiBtn}
                onPress={() => { setTempUpi(currentUpiId); setEditingUpi(true); }}
                activeOpacity={0.75}
              >
                <Edit3 size={15} color={C.gold} />
                <Text style={s.editUpiBtnText}>Change</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={s.saveUpiBtn}
                onPress={handleSaveUpi}
                activeOpacity={0.75}
              >
                <Save size={15} color="#000" />
                <Text style={s.saveUpiBtnText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>

          {!editingUpi ? (
            <View style={s.upiDisplayBox}>
              <Text style={s.upiDisplayText}>{currentUpiId}</Text>
              <View style={s.activePill}>
                <Text style={s.activePillText}>LIVE</Text>
              </View>
            </View>
          ) : (
            <TextInput
              style={s.upiInput}
              value={tempUpi}
              onChangeText={setTempUpi}
              autoCapitalize="none"
              placeholder="e.g. yourname@okaxis"
              placeholderTextColor="#666"
            />
          )}
          <Text style={s.upiHelpText}>
            Users will send ₹499 directly to this UPI ID when upgrading to Lifetime Premium.
          </Text>
        </View>

        {/* ── SEARCH BAR ── */}
        <View style={s.searchBar}>
          <Search size={16} color={C.gold} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by User ID or UTR number..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* ── TRANSACTIONS LIST ── */}
        <View style={s.txSection}>
          <Text style={s.sectionHeader}>USER PAYMENT TRANSACTIONS ({filtered.length})</Text>

          {loading ? (
            <View style={s.centerLoader}>
              <ActivityIndicator size="large" color={C.gold} />
              <Text style={s.loaderText}>Loading payment records...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={s.emptyBox}>
              <CreditCard size={36} color="rgba(255, 255, 255, 0.25)" />
              <Text style={s.emptyTitle}>No payment records found</Text>
              <Text style={s.emptySub}>
                Transactions will appear here when users submit their UPI payments.
              </Text>
            </View>
          ) : (
            filtered.map((tx, idx) => (
              <View key={tx.id || tx.utr_number || idx} style={s.txCard}>
                <View style={s.txHeaderRow}>
                  <View style={s.userIconWrap}>
                    <CheckCircle2 size={18} color="#10B981" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={s.txUserId}>{tx.user_id}</Text>
                    <Text style={s.txDate}>
                      {tx.created_at ? new Date(tx.created_at).toLocaleString() : 'Recent'}
                    </Text>
                  </View>
                  <View style={s.amountBadge}>
                    <Text style={s.amountText}>₹{tx.amount || 499}</Text>
                  </View>
                </View>

                <View style={s.txDetailsBox}>
                  <Text style={s.txDetailLabel}>UTR / REFERENCE NUMBER:</Text>
                  <Text style={s.txUtrValue} selectable>{tx.utr_number}</Text>
                  <View style={s.txMetaRow}>
                    <Text style={s.txMetaText}>App: {tx.payment_method || 'UPI'}</Text>
                    <Text style={s.txMetaText}>• Status: {tx.status || 'ACTIVE'}</Text>
                    <Text style={s.txMetaText}>• Lifetime: Yes</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <SecurityFooter style={{ marginTop: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#05070D' },
  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
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
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(240, 165, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.3)',
  },

  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(18, 22, 34, 0.95)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.2,
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: { color: C.gold, fontSize: 24, fontWeight: '900', marginBottom: 2 },
  metricLabel: { color: '#8A99AC', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  upiCard: {
    backgroundColor: 'rgba(14, 18, 26, 0.95)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(240, 165, 0, 0.35)',
    marginBottom: 16,
  },
  upiCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  upiCardTag: { color: C.gold, fontSize: 9.5, fontWeight: '800', letterSpacing: 1 },
  upiCardTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 2 },
  editUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(240, 165, 0, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.3)',
  },
  editUpiBtnText: { color: C.gold, fontSize: 11, fontWeight: '700' },
  saveUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.gold,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveUpiBtnText: { color: '#000', fontSize: 11, fontWeight: '800' },
  upiDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  upiDisplayText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  activePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: { color: '#10B981', fontSize: 9.5, fontWeight: '800' },
  upiInput: {
    backgroundColor: '#0A0D14',
    borderWidth: 1,
    borderColor: C.gold,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 14,
    marginBottom: 8,
  },
  upiHelpText: { color: '#718096', fontSize: 11, lineHeight: 16 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 24, 34, 0.85)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  searchInput: { flex: 1, color: '#FFF', fontSize: 13 },

  txSection: { gap: 12 },
  sectionHeader: { color: '#8A99AC', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 4 },
  centerLoader: { paddingVertical: 40, alignItems: 'center' },
  loaderText: { color: '#A0AEC0', fontSize: 12, marginTop: 10 },
  emptyBox: { paddingVertical: 40, alignItems: 'center' },
  emptyTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: 10 },
  emptySub: { color: '#718096', fontSize: 12, textAlign: 'center', marginTop: 4, paddingHorizontal: 20 },

  txCard: {
    backgroundColor: 'rgba(14, 18, 26, 0.95)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  txHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  userIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txUserId: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  txDate: { color: '#718096', fontSize: 10.5, marginTop: 1 },
  amountBadge: {
    backgroundColor: 'rgba(240, 165, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amountText: { color: C.gold, fontSize: 13, fontWeight: '800' },
  txDetailsBox: {
    backgroundColor: 'rgba(10, 12, 18, 0.85)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  txDetailLabel: { color: '#718096', fontSize: 9.5, fontWeight: '700', letterSpacing: 1 },
  txUtrValue: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '800', marginTop: 2, letterSpacing: 0.5 },
  txMetaRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  txMetaText: { color: '#A0AEC0', fontSize: 10.5 },
});
