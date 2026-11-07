import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchRecordById, deleteRecord } from '../../services/adminApi';
import { C } from '../../constants/theme';

export default function RecordDetailsScreen({ route, navigation }) {
  const { recordId } = route.params;
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecord = async () => {
    setLoading(true);
    const result = await fetchRecordById(recordId);
    if (result.success) setRecord(result.data);
    else setError(result.message || 'Failed to load record details');
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadRecord(); }, [recordId]));

  const handleDelete = () => setDeleteId(true);
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const r = await deleteRecord(recordId);
          if (r.success) navigation.goBack();
          else Alert.alert('Error', r.message || 'Unable to delete record.');
    } catch(e) {}
    setDeleteId(null);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={C.gold} /></View>;
  if (error || !record) return <View style={styles.center}><Text style={styles.errorText}>{error || 'Record not found'}</Text></View>;

  const isPositive = record.amount >= 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Amount Hero */}
      <View style={styles.amountHero}>
        <View style={[styles.amountIcon, { backgroundColor: isPositive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }]}>
          <Text style={{ fontSize: 28 }}>{isPositive ? '↓' : '↑'}</Text>
        </View>
        <Text style={styles.heroTitle}>{record.title}</Text>
        <Text style={[styles.heroAmount, { color: isPositive ? C.success : C.error }]}>
          {isPositive ? '+' : '-'}₹{Math.abs(record.amount).toLocaleString('en-IN')}
        </Text>
        <Text style={styles.heroDate}>
          {new Date(record.record_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {/* Details Card */}
      <View style={styles.card}>
        {record.description ? (
          <>
            <Text style={styles.rowLabel}>Description</Text>
            <Text style={styles.rowValue}>{record.description}</Text>
            <View style={styles.divider} />
          </>
        ) : null}
        <View style={styles.infoRow}>
          <Text style={styles.rowLabel}>Created</Text>
          <Text style={styles.rowValue}>{new Date(record.created_at).toLocaleDateString('en-IN')}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.rowLabel}>Last Updated</Text>
          <Text style={styles.rowValue}>{new Date(record.updated_at).toLocaleDateString('en-IN')}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.goldBtn} onPress={() => navigation.navigate('EditRecordScreen', { record })}>
          <Text style={styles.goldBtnText}>✎  Edit Record</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>🗑  Delete Record</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  amountHero: {
    alignItems: 'center', padding: 32, paddingTop: 24,
    backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: C.border,
  },
  amountIcon: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: C.white, marginBottom: 8 },
  heroAmount: { fontSize: 42, fontWeight: '800', letterSpacing: -1, marginBottom: 8 },
  heroDate: { fontSize: 13, color: C.textSecondary, textAlign: 'center' },
  card: { margin: 16, backgroundColor: C.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 12, color: C.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  rowValue: { fontSize: 15, color: C.white, fontWeight: '600', marginBottom: 12 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 8 },
  actions: { paddingHorizontal: 16, gap: 12 },
  goldBtn: { backgroundColor: C.gold, padding: 17, borderRadius: 14, alignItems: 'center', elevation: 3 },
  goldBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
  deleteBtn: { padding: 17, borderRadius: 14, alignItems: 'center' },
  deleteBtnText: { color: C.error, fontSize: 15, fontWeight: '700' },
  errorText: { color: C.error, fontSize: 16, fontWeight: '500' },
});
