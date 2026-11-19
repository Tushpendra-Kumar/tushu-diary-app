import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { C } from '../../../constants/theme';
import { 
  ChevronLeft, Wallet, Landmark, CreditCard, TrendingUp,
  ArrowUpRight, ArrowDownRight, HandCoins, FileText, Activity, Trash2, ChevronRight
} from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import { AppLockContext } from '../../../context/AppLockContext';
import ParticleBackground from '../../../components/ParticleBackground';
import { getWalletRecords, getWalletHistory } from '../../../services/personalDataService';
import { useFocusEffect } from '@react-navigation/native';
import SecurityFooter from '../../../components/SecurityFooter';

export default function PrivateWalletDashboardScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { config } = useContext(AppLockContext);
  const [refreshing, setRefreshing] = useState(false);
  const [totals, setTotals] = useState({
    assets: 0, liabilities: 0, moneyGiven: 0, moneyOwed: 0, netWorth: 0
  });
  

  const loadData = async () => {
    if (!user?.user_id) return;
    try {
      const [
        cash, banks, cards, investments, given, owed, loans
      ] = await Promise.all([
        getWalletRecords(user.user_id, 'cash'),
        getWalletRecords(user.user_id, 'banks'),
        getWalletRecords(user.user_id, 'cards'),
        getWalletRecords(user.user_id, 'investments'),
        getWalletRecords(user.user_id, 'money_given'),
        getWalletRecords(user.user_id, 'money_owed'),
        getWalletRecords(user.user_id, 'loans')
        
      ]);

      const sum = (arr, key) => (Array.isArray(arr) ? arr : []).reduce((acc, curr) => acc + (parseFloat(curr[key]) || 0), 0);

      const totalCash = sum(cash, 'amount');
      const totalBanks = sum(banks, 'balance');
      const totalInv = sum(investments, 'current_value');
      const totalAssets = totalCash + totalBanks + totalInv;

      // Card liability could be balance owed, but we just track limits. We'll use loans remaining for liabilities.
      const totalLoans = sum(loans, 'remaining_amount');
      const totalLiabilities = totalLoans; 

      const totalGiven = sum(given, 'amount');
      const totalOwed = sum(owed, 'amount');

      const netWorth = totalAssets + totalGiven - totalLiabilities - totalOwed;

      setTotals({
        assets: totalAssets,
        liabilities: totalLiabilities,
        moneyGiven: totalGiven,
        moneyOwed: totalOwed,
        netWorth: netWorth
      });
      

    } catch (e) {
      console.log('Error loading wallet dashboard', e);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [user?.user_id]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (val) => {
    if (config?.enabled && config?.privacyControls?.hideAmounts) return '₹ ****';
    if (val === undefined || val === null || isNaN(val)) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const categories = [
    { id: 'cash', label: 'Cash & Savings', icon: Wallet, color: '#4CAF50' },
    { id: 'banks', label: 'Bank Accounts', icon: Landmark, color: '#2196F3' },
    { id: 'cards', label: 'Cards', icon: CreditCard, color: '#9C27B0' },
    { id: 'investments', label: 'Investments', icon: TrendingUp, color: '#00BCD4' },
    { id: 'money_given', label: 'Money Given', icon: ArrowUpRight, color: '#4CAF50' },
    { id: 'money_owed', label: 'Money Owed', icon: ArrowDownRight, color: '#F44336' },
    { id: 'loans', label: 'Loans & Debts', icon: HandCoins, color: '#FF9800' },
    { id: 'financial_notes', label: 'Financial Notes', icon: FileText, color: '#9E9E9E' }
  ];

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      <View style={s.header}>
        <View style={{ width: 28 }} />
        <Text style={s.headerTitle}>Private Wallet</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView 
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
      >
        <View style={s.privacyHeader}>
          <Text style={s.privacyTitle}>Your Private Financial Vault</Text>
          <Text style={s.privacyDesc}>Securely organize your personal financial records in one private place.</Text>
        </View>

        <View style={s.overviewCard}>
          <View style={s.overviewTop}>
            <Text style={s.netWorthLabel}>ESTIMATED NET WORTH</Text>
            <Text style={[s.netWorthValue, { color: totals.netWorth >= 0 ? C.gold : '#F44336' }]}>
              {formatCurrency(totals.netWorth)}
            </Text>
          </View>
          <View style={s.overviewGrid}>
            <View style={s.overviewItem}>
              <Text style={s.overviewLabel}>Assets</Text>
              <Text style={[s.overviewAmount, { color: '#4CAF50' }]}>{formatCurrency(totals.assets)}</Text>
            </View>
            <View style={s.overviewItem}>
              <Text style={s.overviewLabel}>Liabilities</Text>
              <Text style={[s.overviewAmount, { color: '#F44336' }]}>{formatCurrency(totals.liabilities)}</Text>
            </View>
            <View style={s.overviewItem}>
              <Text style={s.overviewLabel}>Money Given</Text>
              <Text style={[s.overviewAmount, { color: '#4CAF50' }]}>{formatCurrency(totals.moneyGiven)}</Text>
            </View>
            <View style={s.overviewItem}>
              <Text style={s.overviewLabel}>Money Owed</Text>
              <Text style={[s.overviewAmount, { color: '#F44336' }]}>{formatCurrency(totals.moneyOwed)}</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>CATEGORIES</Text>
        <View style={s.grid}>
          {categories.map((cat, i) => (
            <TouchableOpacity 
              key={i} 
              style={s.catCard} 
              activeOpacity={0.75}
              onPress={() => navigation.navigate('WalletCategory', { category: cat.id, title: cat.label })}
            >
              <View style={[s.iconBg, { backgroundColor: cat.color + '18', borderColor: cat.color + '30' }]}>
                <cat.icon size={22} color={cat.color} />
              </View>
              <Text style={s.catLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={s.recycleBinCard} 
          activeOpacity={0.75}
          onPress={() => navigation.navigate('WalletRecycleBin')}
        >
          <View style={[s.iconBg, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
            <Trash2 size={22} color="#EF4444" />
          </View>
          <View style={s.recycleBinTextContainer}>
            <Text style={s.recycleBinTitle}>Recycle Bin</Text>
            <Text style={s.recycleBinDesc}>View or restore deleted records</Text>
          </View>
          <ChevronRight size={18} color="rgba(255, 255, 255, 0.35)" />
        </TouchableOpacity>

        <SecurityFooter />

      </ScrollView>
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
  headerBtn: { padding: 4 },
  
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  
  privacyHeader: { alignItems: 'center', marginBottom: 20, marginTop: 4 },
  privacyTitle: { fontSize: 18, fontWeight: '800', color: C.gold, marginBottom: 6, letterSpacing: 0.2 },
  privacyDesc: { fontSize: 13, color: '#8E8E93', textAlign: 'center', lineHeight: 19, paddingHorizontal: 16 },
  
  overviewCard: { 
    backgroundColor: 'rgba(22, 19, 13, 0.92)', borderRadius: 18, padding: 20, marginBottom: 24,
    borderWidth: 1.5, borderColor: 'rgba(240, 165, 0, 0.45)',
    shadowColor: C.gold, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 3,
  },
  overviewTop: { alignItems: 'center', marginBottom: 18 },
  netWorthLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 6 },
  netWorthValue: { fontSize: 32, fontWeight: '800', letterSpacing: 0.3 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: 'rgba(240, 165, 0, 0.25)', paddingTop: 16 },
  overviewItem: { width: '50%', marginBottom: 14 },
  overviewLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '600', marginBottom: 4 },
  overviewAmount: { fontSize: 15, fontWeight: '700' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#8E8E93', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 12 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  catCard: { 
    width: '48%', backgroundColor: 'rgba(255, 255, 255, 0.035)', padding: 16, borderRadius: 16, 
    alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 2,
  },
  iconBg: { width: 44, height: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  catLabel: { fontSize: 13.5, color: C.white, fontWeight: '700', textAlign: 'center', letterSpacing: 0.2 },
  
  activityCard: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.035)', padding: 16, borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  activityLeft: { flex: 1 },
  activityTitle: { fontSize: 14, color: C.white, fontWeight: '700', marginBottom: 4 },
  activityDate: { fontSize: 11, color: '#8E8E93' },
  activityAmount: { fontSize: 14, color: C.white, fontWeight: '700' },
  
  noDataText: { color: '#8E8E93', textAlign: 'center', padding: 20, fontSize: 13 },
  
  recycleBinCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.035)',
    padding: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 8, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 2,
  },
  recycleBinTextContainer: { flex: 1, marginLeft: 14 },
  recycleBinTitle: { fontSize: 14.5, color: C.white, fontWeight: '700', marginBottom: 2, letterSpacing: 0.2 },
  recycleBinDesc: { fontSize: 12, color: '#8E8E93' }
});
