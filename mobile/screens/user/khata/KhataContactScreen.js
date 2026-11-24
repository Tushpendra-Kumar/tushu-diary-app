import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { isValidDate, toStorageDate, toDisplayDate, formatDateInput } from '../../../utils/dateFormatter';
import { getKhataContacts, addKhataEntry, deleteKhataEntry, getKhataBalance } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { ArrowUpRight, ArrowDownLeft, Trash2, X, Clock, Calendar, CheckCircle2 } from 'lucide-react-native';

export default function KhataContactScreen({ route, navigation }) {
  const { contactId, userId } = route.params;
  const activeUserId = userId || 'default_user';
  
  const [contact, setContact] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState('gave');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  
  const todayDisplay = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  })();
  const [date, setDate] = useState(todayDisplay);

  useEffect(() => { load(); }, [contactId, activeUserId]);

  const load = async () => {
    try {
      const contacts = await getKhataContacts(activeUserId);
      const found = (Array.isArray(contacts) ? contacts : []).find(c => c.id === contactId);
      setContact(found || null);
    } catch (e) {
      console.warn('[KhataContactScreen] load error:', e);
    }
  };

  const alertMsg = (msg) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Validation', msg);
  };

  const handleAdd = async () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) return alertMsg('Please enter a valid amount.');
    if (!date || !isValidDate(date)) return alertMsg('Please enter a valid date (DD/MM/YYYY).');
    
    if (saving) return;
    setSaving(true);
    try {
      await addKhataEntry(activeUserId, contactId, { 
        type, 
        amount: amt, 
        note: (note || '').trim(), 
        date: toStorageDate(date) 
      });
      setAmount(''); 
      setNote(''); 
      setDate(todayDisplay); 
      setModalVisible(false); 
      await load();
    } catch (e) {
      console.warn('[KhataContactScreen] handleAdd error:', e);
      alertMsg('Failed to record transaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteKhataEntry(activeUserId, contactId, deleteId);
      setDeleteId(null);
      await load();
    } catch (e) {
      console.warn('[KhataContactScreen] delete error:', e);
    }
  };

  if (!contact) {
    return (
      <SafeAreaView style={s.safe}>
        <ParticleBackground />
        <View style={s.centerLoading}>
          <Clock size={36} color={C.gold} />
          <Text style={s.loadingText}>Loading ledger...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const balance = getKhataBalance(contact);
  const isPositive = balance >= 0;
  const isZero = balance === 0;

  const renderEntry = ({ item }) => {
    const isGave = item.type === 'gave';
    const amtVal = Number(item.amount) || 0;
    return (
      <View style={s.entry}>
        <View style={[s.entryIcon, { backgroundColor: isGave ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)' }]}>
          {isGave ? <ArrowUpRight size={20} color={C.success} /> : <ArrowDownLeft size={20} color={C.error} />}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.entryType}>{isGave ? 'You gave' : 'You received'}</Text>
          {item.note ? <Text style={s.entryNote}>{item.note}</Text> : null}
          <Text style={s.entryDate}>{toDisplayDate(item.date)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[s.entryAmount, { color: isGave ? C.success : C.error }]}>
            {isGave ? '+' : '-'}₹{amtVal.toLocaleString('en-IN')}
          </Text>
          <TouchableOpacity 
            onPress={() => setDeleteId(item.id)} 
            style={{ padding: 6, marginTop: 4 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={16} color="rgba(239, 68, 68, 0.7)" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      
      {/* Contact Name Sub-header */}
      <View style={s.headerBar}>
        <View style={s.contactAvatar}>
          <Text style={s.contactInitial}>{(contact.name?.[0] || '?').toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle} numberOfLines={1}>{contact.name}</Text>
          <Text style={s.headerSub}>Account Ledger</Text>
        </View>
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
        data={[...(contact.entries || [])].sort((a,b) => (b.date || '').localeCompare(a.date || ''))}
        keyExtractor={i => i.id}
        renderItem={renderEntry}
        contentContainerStyle={s.list}
        ListFooterComponent={<SecurityFooter style={{ marginTop: 24, marginBottom: 80 }} />}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Clock size={40} color={C.textMuted} style={{ marginBottom: 12 }} />
            <Text style={s.emptyText}>No entries yet</Text>
            <Text style={s.emptySub}>Record payments using "You Got" or "You Gave" below.</Text>
          </View>
        }
      />

      {/* Floating Action Buttons */}
      <View style={s.fabContainer}>
        <TouchableOpacity 
          style={[s.actionBtn, { backgroundColor: '#DC2626' }]} 
          onPress={() => { setType('received'); setModalVisible(true); }}
          activeOpacity={0.82}
        >
          <ArrowDownLeft size={18} color="#FFF" style={{ marginRight: 6 }} strokeWidth={2.4} />
          <Text style={s.actionText}>You Got ₹</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.actionBtn, { backgroundColor: '#16A34A' }]} 
          onPress={() => { setType('gave'); setModalVisible(true); }}
          activeOpacity={0.82}
        >
          <ArrowUpRight size={18} color="#FFF" style={{ marginRight: 6 }} strokeWidth={2.4} />
          <Text style={s.actionText}>You Gave ₹</Text>
        </TouchableOpacity>
      </View>

      {/* Add Entry Modal */}
      <Modal 
        visible={modalVisible} 
        animationType="fade" 
        transparent
        onRequestClose={() => { if (!saving) setModalVisible(false); }}
      >
        <KeyboardAvoidingView 
          style={s.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => { if (!saving) setModalVisible(false); }} 
          />
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{type === 'gave' ? 'You Gave ₹' : 'You Received ₹'}</Text>
              <TouchableOpacity onPress={() => { if (!saving) setModalVisible(false); }} style={{ padding: 4 }}>
                <X size={22} color={C.textSecondary}/>
              </TouchableOpacity>
            </View>

            <Text style={s.label}>AMOUNT (₹) *</Text>
            <TextInput 
              style={s.input} 
              placeholderTextColor={C.textMuted} 
              value={amount} 
              onChangeText={setAmount} 
              keyboardType="numeric" 
              placeholder="0.00" 
              editable={!saving}
            />

            <Text style={s.label}>NOTE / DESCRIPTION (OPTIONAL)</Text>
            <TextInput 
              style={s.input} 
              placeholderTextColor={C.textMuted} 
              value={note} 
              onChangeText={setNote} 
              placeholder="What was this for?" 
              editable={!saving}
            />

            <Text style={s.label}>DATE (DD/MM/YYYY)</Text>
            <TextInput 
              style={s.input} 
              placeholderTextColor={C.textMuted} 
              value={date} 
              onChangeText={(t) => setDate(formatDateInput(t))} 
              placeholder="DD/MM/YYYY" 
              keyboardType="numeric" 
              maxLength={10} 
              editable={!saving}
            />

            <TouchableOpacity 
              style={[s.saveBtn, { backgroundColor: type === 'gave' ? '#16A34A' : '#DC2626' }, saving && { opacity: 0.7 }]} 
              onPress={handleAdd}
              disabled={saving}
              activeOpacity={0.82}
            >
              <Text style={s.saveBtnText}>{saving ? 'Saving...' : 'Save Entry'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        visible={!!deleteId} 
        animationType="fade" 
        transparent
        onRequestClose={() => setDeleteId(null)}
      >
        <View style={s.alertOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setDeleteId(null)} />
          <View style={s.alertBox}>
            <Text style={s.alertTitle}>Delete Entry</Text>
            <Text style={s.alertMessage}>Are you sure you want to permanently delete this transaction from the ledger?</Text>
            <View style={s.alertBtns}>
              <TouchableOpacity style={s.alertCancel} onPress={() => setDeleteId(null)} activeOpacity={0.8}>
                <Text style={s.alertCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.alertDelete} onPress={confirmDelete} activeOpacity={0.8}>
                <Text style={s.alertDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#06080D' },
  centerLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: C.textSecondary, marginTop: 12, fontSize: 14, fontWeight: '600' },
  headerBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 14, 
    backgroundColor: '#0A0E17',
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255, 255, 255, 0.06)' 
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(240, 165, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInitial: { color: C.gold, fontSize: 16, fontWeight: '800' },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  headerSub: { color: C.textSecondary, fontSize: 11, marginTop: 1 },
  balanceCard: { 
    margin: 16, 
    padding: 22, 
    backgroundColor: 'rgba(18, 22, 34, 0.85)', 
    borderRadius: 18, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.08)', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceLabel: { color: '#8E8E93', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  balanceAmount: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  balanceSub: { color: C.textSecondary, fontSize: 13, marginTop: 6, fontWeight: '500' },
  list: { padding: 16, paddingBottom: 120 },
  entry: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(18, 22, 34, 0.85)', 
    padding: 14, 
    borderRadius: 14, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.06)', 
    alignItems: 'center' 
  },
  entryIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  entryType: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  entryNote: { color: C.textSecondary, fontSize: 13, marginTop: 2 },
  entryDate: { color: C.textMuted, fontSize: 11, marginTop: 4 },
  entryAmount: { fontSize: 16, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: C.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
  fabContainer: { 
    position: 'absolute', 
    bottom: 24, 
    left: 16, 
    right: 16, 
    flexDirection: 'row', 
    gap: 12 
  },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 15, 
    borderRadius: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.75)', 
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: { 
    backgroundColor: '#0E131F', 
    padding: 24, 
    borderRadius: 22, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.12)' 
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  label: { color: '#8E8E93', marginBottom: 8, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  input: { 
    backgroundColor: 'rgba(255, 255, 255, 0.06)', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.12)', 
    borderRadius: 12, 
    color: '#FFFFFF', 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    marginBottom: 16, 
    fontSize: 14,
    fontWeight: '600',
    outlineStyle: 'none' 
  },
  saveBtn: { 
    paddingVertical: 15, 
    borderRadius: 14, 
    alignItems: 'center', 
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  alertBox: { 
    backgroundColor: '#0E131F', 
    width: '100%', 
    borderRadius: 22, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.12)' 
  },
  alertTitle: { fontSize: 19, fontWeight: '800', color: '#FFFFFF', marginBottom: 10 },
  alertMessage: { fontSize: 14, color: C.textSecondary, marginBottom: 22, lineHeight: 22 },
  alertBtns: { flexDirection: 'row', gap: 12 },
  alertCancel: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', alignItems: 'center' },
  alertCancelText: { color: '#FFFFFF', fontWeight: '700' },
  alertDelete: { flex: 1, backgroundColor: C.error, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  alertDeleteText: { color: '#FFFFFF', fontWeight: '700' }
});
