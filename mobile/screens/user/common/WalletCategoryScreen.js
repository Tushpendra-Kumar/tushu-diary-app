import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { C } from '../../../constants/theme';
import { ChevronLeft, Plus, Trash2, Edit3 } from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import { AppLockContext } from '../../../context/AppLockContext';
import ParticleBackground from '../../../components/ParticleBackground';
import { getWalletRecords, deleteWalletRecord } from '../../../services/personalDataService';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../../../components/EmptyState';

export default function WalletCategoryScreen({ route, navigation }) {
  const { category, title } = route.params;
  const { user } = useContext(AuthContext);
  const { config } = useContext(AppLockContext);
  const [records, setRecords] = useState([]);

  const loadRecords = async () => {
    if (!user?.user_id) return;
    const data = await getWalletRecords(user.user_id, category);
    setRecords(Array.isArray(data) ? data : []);
  };

  useFocusEffect(useCallback(() => { loadRecords(); }, [user?.user_id, category]));

  const handleDelete = (id) => {
    if (window.confirm) {
        if(window.confirm('Move this record to Recycle Bin?')) {
            executeDelete(id);
        }
    } else {
        Alert.alert('Delete', 'Move this record to Recycle Bin?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => executeDelete(id) }
        ]);
    }
  };

  const executeDelete = async (id) => {
    await deleteWalletRecord(user.user_id, category, id);
    loadRecords();
  };

  const formatCurrency = (val) => {
    if (config?.enabled && config?.privacyControls?.hideAmounts) return '₹ ****';
    if (!val) return null;
    return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const renderCardDetails = (r) => {
    switch (category) {
      case 'cash':
        return (
          <>
            <Text style={s.cardTitle}>{r.title}</Text>
            {r.account_type && <Text style={s.cardSub}>{r.account_type}</Text>}
            {r.note && <Text style={s.cardNote}>{r.note}</Text>}
            <Text style={s.cardAmount}>{formatCurrency(r.amount)}</Text>
          </>
        );
      case 'banks':
        return (
          <>
            <Text style={s.cardTitle}>{r.nickname || r.bank_name}</Text>
            <Text style={s.cardSub}>{r.bank_name} {r.last_4 ? `(..${r.last_4})` : ''}</Text>
            {r.note && <Text style={s.cardNote}>{r.note}</Text>}
            <Text style={s.cardAmount}>{formatCurrency(r.balance)}</Text>
          </>
        );
      case 'cards':
        return (
          <>
            <Text style={s.cardTitle}>{r.nickname || r.provider}</Text>
            <Text style={s.cardSub}>{r.card_type} {r.last_4 ? `(..${r.last_4})` : ''}</Text>
            {r.note && <Text style={s.cardNote}>{r.note}</Text>}
            {r.limit && <Text style={s.cardAmount}>Limit: {formatCurrency(r.limit)}</Text>}
          </>
        );
      case 'investments':
        return (
          <>
            <Text style={s.cardTitle}>{r.name}</Text>
            {r.institution && <Text style={s.cardSub}>{r.institution}</Text>}
            <Text style={s.cardNote}>Invested: {formatCurrency(r.amount)}</Text>
            <Text style={s.cardAmount}>Current: {formatCurrency(r.current_value)}</Text>
          </>
        );
      case 'money_given':
      case 'money_owed':
        return (
          <>
            <Text style={s.cardTitle}>{r.person}</Text>
            <Text style={s.cardSub}>{r.purpose}</Text>
            <Text style={[s.cardStatus, { color: r.status === 'Received' ? '#4CAF50' : '#FF9800' }]}>{r.status}</Text>
            {r.note && <Text style={s.cardNote}>{r.note}</Text>}
            <Text style={s.cardAmount}>{formatCurrency(r.amount)}</Text>
          </>
        );
      case 'loans':
        return (
          <>
            <Text style={s.cardTitle}>{r.name}</Text>
            <Text style={s.cardSub}>{r.lender}</Text>
            <Text style={s.cardNote}>Total: {formatCurrency(r.total_amount)}</Text>
            <Text style={[s.cardAmount, { color: '#F44336' }]}>Remaining: {formatCurrency(r.remaining_amount)}</Text>
          </>
        );
      case 'financial_notes':
        return (
          <>
            <Text style={s.cardTitle}>{r.title}</Text>
            <Text style={s.cardNote}>{r.content}</Text>
          </>
        );
      default:
        return <Text style={s.cardTitle}>Unknown Record</Text>;
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      <View style={s.header}>
        <View style={{ width: 28 }} />
        <Text style={s.headerTitle}>{title}</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('WalletAddEdit', { category, title })}>
          <Plus color={C.white} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {records.length === 0 ? (
          <EmptyState title="No financial records yet" description="Add your first record to track it here." />
        ) : (
          records.map((r, i) => (
            <View key={i} style={s.recordCard}>
              <View style={s.recordInfo}>
                {renderCardDetails(r)}
                {r.date && <Text style={s.cardDate}>{new Date(r.date).toLocaleDateString()}</Text>}
              </View>
              <View style={s.actions}>
                <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('WalletAddEdit', { category, title, record: r })}>
                  <Edit3 size={18} color={C.gold} />
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, { marginLeft: 10 }]} onPress={() => handleDelete(r.id)}>
                  <Trash2 size={18} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
  addBtn: { padding: 4 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  
  recordCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.035)', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', flexDirection: 'row', alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 2,
  },
  recordInfo: { flex: 1, marginRight: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.white, marginBottom: 4, letterSpacing: 0.2 },
  cardSub: { fontSize: 13, color: '#8E8E93', marginBottom: 4 },
  cardNote: { fontSize: 12, color: '#8E8E93', fontStyle: 'italic', marginTop: 4 },
  cardAmount: { fontSize: 18, fontWeight: '800', color: C.gold, marginTop: 8 },
  cardStatus: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  cardDate: { fontSize: 11, color: '#8E8E93', marginTop: 8 },
  
  actions: { flexDirection: 'row' },
  actionBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }
});
