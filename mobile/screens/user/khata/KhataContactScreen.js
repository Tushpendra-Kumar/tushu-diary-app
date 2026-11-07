import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { isValidDate, toStorageDate, toDisplayDate, formatDateInput } from '../../../utils/dateFormatter';
import { getKhataContacts, addKhataEntry, deleteKhataEntry, getKhataBalance } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { ArrowUpRight, ArrowDownLeft, Trash2, X, Clock } from 'lucide-react-native';

export default function KhataContactScreen({ route, navigation }) {
  const { contactId, userId } = route.params;
  const [contact, setContact] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState('gave');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  
  const todayDisplay = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  })();
  const [date, setDate] = useState(todayDisplay);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const contacts = await getKhataContacts(userId);
    setContact(contacts.find(c => c.id === contactId) || null);
  };

  const alertMsg = (msg) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Validation', msg);
  };

  const handleAdd = async () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) return alertMsg('Please enter a valid amount.');
    if (!date || !isValidDate(date)) return alertMsg('Please enter a valid date (DD/MM/YYYY).');
    
    await addKhataEntry(userId, contactId, { type, amount: amt, note: note.trim(), date: toStorageDate(date) });
    setAmount(''); setNote(''); setDate(todayDisplay); setModalVisible(false); load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteKhataEntry(userId, contactId, deleteId);
    setDeleteId(null);
    load();
  };

  if (!contact) return null;
  const balance = getKhataBalance(contact);
  const isPositive = balance >= 0;
  const isZero = balance === 0;

  const renderEntry = ({ item }) => {
    const isGave = item.type === 'gave';
    return (
      <View style={s.entry}>
        <View style={[s.entryIcon, { backgroundColor: isGave ? 'rgba(76, 175, 80, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
          {isGave ? <ArrowUpRight size={20} color={C.success} /> : <ArrowDownLeft size={20} color={C.error} />}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.entryType}>{isGave ? 'You gave' : 'You received'}</Text>
          {item.note ? <Text style={s.entryNote}>{item.note}</Text> : null}
          <Text style={s.entryDate}>{toDisplayDate(item.date)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[s.entryAmount, { color: isGave ? C.success : C.error }]}>
            {isGave ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
          </Text>
          <TouchableOpacity onPress={() => setDeleteId(item.id)} style={{padding: 4}}>
            <Trash2 size={16} color={C.error} style={{marginTop: 6}} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ color: C.gold, fontSize: 16 }}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{contact.name}</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={s.balanceCard}>
        <Text style={s.balanceLabel}>NET BALANCE</Text>
        <Text style={[s.balanceAmount, { color: isZero ? C.textSecondary : isPositive ? C.success : C.error }]}>
          {isZero ? '' : (isPositive ? '+' : '-')}₹{Math.abs(balance).toLocaleString('en-IN')}
        </Text>
        <Text style={s.balanceSub}>
          {isZero ? 'All settled' : isPositive ? `You will receive from ${contact.name}` : `You will give to ${contact.name}`}
        </Text>
      </View>

      <FlatList
        data={[...(contact.entries || [])].sort((a,b) => b.date.localeCompare(a.date))}
        keyExtractor={i => i.id}
        renderItem={renderEntry}
        contentContainerStyle={s.list}
        ListFooterComponent={<SecurityFooter style={{marginTop: 24}} />}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Clock size={48} color={C.textMuted} style={{marginBottom: 12}} />
            <Text style={s.emptyText}>No entries yet</Text>
          </View>
        }
      />

      <View style={s.fabContainer}>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.error }]} onPress={() => { setType('received'); setModalVisible(true); }}>
          <ArrowDownLeft size={20} color="#FFF" style={{marginRight: 8}} />
          <Text style={s.actionText}>You Got</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.success }]} onPress={() => { setType('gave'); setModalVisible(true); }}>
          <ArrowUpRight size={20} color="#FFF" style={{marginRight: 8}} />
          <Text style={s.actionText}>You Gave</Text>
        </TouchableOpacity>
      </View>

      {/* Add Entry Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{type === 'gave' ? 'You Gave ₹' : 'You Received ₹'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color={C.textSecondary}/></TouchableOpacity>
            </View>

            <Text style={s.label}>Amount *</Text>
            <TextInput style={s.input} placeholderTextColor={C.textMuted} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" autoFocus />

            <Text style={s.label}>Note (Optional)</Text>
            <TextInput style={s.input} placeholderTextColor={C.textMuted} value={note} onChangeText={setNote} placeholder="What was this for?" />

            <Text style={s.label}>Date</Text>
            <TextInput style={s.input} placeholderTextColor={C.textMuted} value={date} onChangeText={(t) => setDate(formatDateInput(t))} placeholder="DD/MM/YYYY" keyboardType="numeric" maxLength={10} />

            <TouchableOpacity style={[s.saveBtn, {backgroundColor: type === 'gave' ? C.success : C.error}]} onPress={handleAdd}>
              <Text style={s.saveBtnText}>Save Entry</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteId} animationType="fade" transparent>
        <View style={s.alertOverlay}>
          <View style={s.alertBox}>
            <Text style={s.alertTitle}>Delete Entry</Text>
            <Text style={s.alertMessage}>Are you sure you want to permanently delete this transaction?</Text>
            <View style={s.alertBtns}>
              <TouchableOpacity style={s.alertCancel} onPress={() => setDeleteId(null)}><Text style={s.alertCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={s.alertDelete} onPress={confirmDelete}><Text style={s.alertDeleteText}>Delete</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 50 },
  headerTitle: { color: C.white, fontSize: 18, fontWeight: 'bold' },
  balanceCard: { margin: 16, padding: 24, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  balanceLabel: { color: C.textSecondary, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  balanceAmount: { fontSize: 36, fontWeight: '900' },
  balanceSub: { color: C.textMuted, fontSize: 13, marginTop: 4 },
  list: { padding: 16, paddingBottom: 100 },
  entry: { flexDirection: 'row', backgroundColor: C.card, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  entryIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  entryType: { color: C.white, fontSize: 15, fontWeight: 'bold' },
  entryNote: { color: C.textSecondary, fontSize: 13, marginTop: 4 },
  entryDate: { color: C.textMuted, fontSize: 11, marginTop: 6 },
  entryAmount: { fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: C.white, fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  fabContainer: { position: 'absolute', bottom: 20, left: 16, right: 16, flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, elevation: 5 },
  actionText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: C.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: C.white, fontSize: 20, fontWeight: 'bold' },
  label: { color: C.textSecondary, marginBottom: 8, fontSize: 13, fontWeight: 'bold' },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.white, padding: 14, marginBottom: 20, outlineStyle: 'none' },
  saveBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertBox: { backgroundColor: '#111', width: '100%', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border },
  alertTitle: { fontSize: 20, fontWeight: 'bold', color: C.white, marginBottom: 12 },
  alertMessage: { fontSize: 14, color: C.textSecondary, marginBottom: 20, lineHeight: 22 },
  alertBtns: { flexDirection: 'row', gap: 12 },
  alertCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  alertCancelText: { color: C.textSecondary, fontWeight: 'bold' },
  alertDelete: { flex: 1, backgroundColor: C.error, padding: 14, borderRadius: 12, alignItems: 'center' },
  alertDeleteText: { color: '#FFF', fontWeight: 'bold' }
});