import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { C } from '../../../constants/theme';
import { ChevronLeft, Trash2, RotateCcw, AlertTriangle } from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import { AppLockContext } from '../../../context/AppLockContext';
import ParticleBackground from '../../../components/ParticleBackground';
import { getWalletRecycleBin, restoreWalletRecord, permanentDeleteWalletRecord, emptyWalletRecycleBin } from '../../../services/personalDataService';
import { useFocusEffect } from '@react-navigation/native';

export default function WalletRecycleBinScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { config } = useContext(AppLockContext);
  const [items, setItems] = useState([]);

  const loadBin = async () => {
    if (user?.user_id) {
      const data = await getWalletRecycleBin(user.user_id);
      setItems(data);
    }
  };

  useFocusEffect(useCallback(() => { loadBin(); }, [user?.user_id]));

  const handleRestore = async (id) => {
    await restoreWalletRecord(user.user_id, id);
    loadBin();
  };

  const handlePermanentDelete = (id) => {
    if (window.confirm) {
      if (window.confirm('Permanently delete this record? This action cannot be undone.')) {
        permanentDeleteWalletRecord(user.user_id, id).then(loadBin);
      }
    } else {
      Alert.alert('Permanent Delete', 'Permanently delete this record? This action cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
            await permanentDeleteWalletRecord(user.user_id, id);
            loadBin();
          } 
        }
      ]);
    }
  };

  const handleEmptyBin = () => {
    if (items.length === 0) return;
    if (window.confirm) {
      if (window.confirm('Empty Recycle Bin? All deleted records will be permanently removed.')) {
        emptyWalletRecycleBin(user.user_id).then(loadBin);
      }
    } else {
      Alert.alert('Empty Recycle Bin', 'All deleted records will be permanently removed.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Empty', style: 'destructive', onPress: async () => {
            await emptyWalletRecycleBin(user.user_id);
            loadBin();
          }
        }
      ]);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={C.white} size={28} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Recycle Bin</Text>
        <TouchableOpacity onPress={handleEmptyBin} style={{ padding: 4, opacity: items.length === 0 ? 0.3 : 1 }} disabled={items.length === 0}>
          <Trash2 color="#F44336" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {items.length === 0 ? (
          <View style={s.emptyState}>
            <Trash2 color={C.textMuted} size={48} />
            <Text style={s.emptyText}>Recycle Bin is Empty</Text>
            <Text style={s.emptyDesc}>Deleted wallet records will appear here for 30 days.</Text>
          </View>
        ) : (
          items.map((item, idx) => (
            <View key={item.id || idx} style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.catBadge}>{String(item.category).toUpperCase().replace('_', ' ')}</Text>
                <Text style={s.dateText}>{new Date(item.deletedAt).toLocaleDateString()}</Text>
              </View>
              <Text style={s.cardTitle}>{item.title || item.name || item.bank_name || item.provider || item.person || 'Record'}</Text>
              {item.amount || item.balance || item.total_amount || item.current_value ? (
                <Text style={s.amount}>{(config?.enabled && config?.privacyControls?.hideAmounts) ? '₹ ****' : `₹${item.amount || item.balance || item.total_amount || item.current_value}`}</Text>
              ) : null}

              <View style={s.actions}>
                <TouchableOpacity style={s.restoreBtn} onPress={() => handleRestore(item.id)}>
                  <RotateCcw color={C.black} size={16} />
                  <Text style={s.restoreText}>Restore</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.delBtn} onPress={() => handlePermanentDelete(item.id)}>
                  <Trash2 color="#F44336" size={16} />
                  <Text style={s.delText}>Delete</Text>
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
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(240, 165, 0, 0.18)', backgroundColor: 'rgba(10, 10, 10, 0.92)'
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.white, letterSpacing: 0.3 },
  backBtn: { padding: 4 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#8E8E93', marginTop: 12, fontSize: 16, fontWeight: "700" },

  emptyDesc: { color: '#8E8E93', marginTop: 6, fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
  expireContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 12 },
  expireText: { fontSize: 11, color: '#FF9800', marginLeft: 6 },

  
  card: { 
    backgroundColor: 'rgba(255, 255, 255, 0.035)', borderRadius: 16, padding: 16, marginBottom: 12, 
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  catBadge: { fontSize: 11, color: C.gold, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateText: { fontSize: 11, color: '#8E8E93' },
  cardTitle: { fontSize: 15, color: C.white, fontWeight: '700', marginBottom: 4, letterSpacing: 0.2 },
  amount: { fontSize: 16, color: '#4CAF50', fontWeight: '800', marginBottom: 4 },
  
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  restoreBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.gold, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  restoreText: { color: C.black, fontWeight: '700', fontSize: 12, marginLeft: 4 },
  delBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(244,67,54,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(244,67,54,0.3)' },
  delText: { color: '#F44336', fontWeight: '700', fontSize: 12, marginLeft: 4 }
});
