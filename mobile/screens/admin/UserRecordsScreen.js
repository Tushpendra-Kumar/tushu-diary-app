import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchUserRecords, fetchUserTotalAmount } from '../../services/adminApi';
import EmptyState from '../../components/EmptyState';
import { C } from '../../constants/theme';
import ParticleBackground from '../../components/ParticleBackground';




export default function UserRecordsScreen({ route, navigation }) {
  const { userId, userName } = route.params;
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [recordsResult, totalResult] = await Promise.all([fetchUserRecords(userId), fetchUserTotalAmount(userId)]);
    if (recordsResult.success && totalResult.success) {
      setRecords(recordsResult.data || []);
      setTotal(totalResult.data.total || 0);
    } else { setError('Unable to load records.'); }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadData(); }, [userId]));

  const renderRecord = ({ item }) => {
    const isPositive = item.amount >= 0;
    return (
      <TouchableOpacity style={styles.recordCard} onPress={() => navigation.navigate('RecordDetailsScreen', { recordId: item.id })}>
        <View style={[styles.amountBadge, { backgroundColor: isPositive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }]}>
          <Text style={[styles.amountSymbol, { color: isPositive ? C.success : C.error }]}>{isPositive ? '↓' : '↑'}</Text>
        </View>
        <View style={styles.recordInfo}>
          <Text style={styles.recordTitle}>{item.title}</Text>
          <Text style={styles.recordDate}>{new Date(item.record_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        </View>
        <Text style={[styles.recordAmount, { color: isPositive ? C.success : C.error }]}>
          {isPositive ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString('en-IN')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ParticleBackground />
      {/* Header Card */}
      <View style={styles.header}>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.totalLabel}>Net Balance</Text>
        <Text style={[styles.totalAmount, { color: total >= 0 ? C.success : C.error }]}>
          {total >= 0 ? '+' : '-'}₹{Math.abs(total).toLocaleString('en-IN')}
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddRecordScreen', { userId })}>
          <Text style={styles.addButtonText}>＋  Add Record</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.gold} />
          <Text style={styles.loadingText}>Loading records...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={renderRecord}
          ListEmptyComponent={<EmptyState message="No records yet." subMessage="Tap + Add Record to create one." />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    padding: 24, backgroundColor: 'transparent',
    borderBottomWidth: 1, borderBottomColor: C.border, alignItems: 'center',
  },
  userName: { fontSize: 18, fontWeight: '700', color: C.white, marginBottom: 12 },
  totalLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  totalAmount: { fontSize: 40, fontWeight: '800', letterSpacing: -1, marginBottom: 20 },
  addButton: { backgroundColor: C.gold, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14, width: '100%', alignItems: 'center', elevation: 3 },
  addButtonText: { color: '#000', fontSize: 15, fontWeight: '700' },
  listContainer: { padding: 16, paddingBottom: 40 },
  recordCard: {
    backgroundColor: C.card, padding: 16, borderRadius: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, elevation: 2,
  },
  amountBadge: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  amountSymbol: { fontSize: 20, fontWeight: '700' },
  recordInfo: { flex: 1 },
  recordTitle: { fontSize: 15, fontWeight: '700', color: C.white, marginBottom: 3 },
  recordDate: { fontSize: 12, color: C.textSecondary },
  recordAmount: { fontSize: 16, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: C.textSecondary },
  errorText: { color: C.error, marginBottom: 16, textAlign: 'center' },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  retryText: { color: C.white, fontWeight: '700' },
});
