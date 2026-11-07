import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import KhataLinker, { handleKhataIntegration } from '../../../components/KhataLinker';
import { getEmis, addEmi, updateEmi, deleteEmi } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import ParticleBackground from '../../../components/ParticleBackground';
import { C } from '../../../constants/theme';
import { Calendar, Plus, ChevronLeft, Trash2, Edit3, CreditCard } from 'lucide-react-native';

// Local date utilities for strictly DD-MM-YYYY
const isValidDateDDMMYYYY = (dateString) => {
  if (!dateString) return false;
  const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
  if (!regex.test(dateString)) return false;
  
  const [, dayStr, monthStr, yearStr] = dateString.match(regex);
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);
  
  if (day < 1 || day > 31) return false;
  if (month < 1 || month > 12) return false;
  
  const dateObj = new Date(year, month - 1, day);
  return dateObj.getFullYear() === year && dateObj.getMonth() === month - 1 && dateObj.getDate() === day;
};

const toStorageDate = (displayDate) => {
  if (!displayDate || !isValidDateDDMMYYYY(displayDate)) return displayDate; 
  const parts = displayDate.split('-');
  return parts[2] + '-' + parts[1] + '-' + parts[0];
};

const toDisplayDate = (storageDate) => {
  if (!storageDate) return '';
  const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
  if (regex.test(storageDate)) {
    const [, year, month, day] = storageDate.match(regex);
    return day + '-' + month + '-' + year;
  }
  return storageDate; 
};

const formatDateInput = (text) => {
  let digits = text.replace(/\D/g, '');
  if (digits.length > 8) digits = digits.slice(0, 8);
  
  let result = '';
  if (digits.length > 0) result += digits.substring(0, 2);
  if (digits.length > 2) result += '-' + digits.substring(2, 4);
  if (digits.length > 4) result += '-' + digits.substring(4, 8);
  return result;
};

export default function EMIReminderScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id || user?.id;
  
  const [emis, setEmis] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  
  // Form State
  const [loanName, setLoanName] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [frequency, setFrequency] = useState('Monthly');
  const [notes, setNotes] = useState('');
  const [khataData, setKhataData] = useState(null);

  useEffect(() => { load(); }, []);
  
  const load = async () => {
    setLoading(true);
    setEmis(await getEmis(userId) || []);
    setLoading(false);
  };

  const alertMsg = (msg) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Validation', msg);
  };

  const openAddModal = () => {
    setEditingId(null);
    setLoanName('');
    setEmiAmount('');
    setDueDate('');
    setFrequency('Monthly');
    setNotes('');
    setKhataData(null);
    setModalVisible(true);
  };

  const openEditModal = (emi) => {
    setEditingId(emi.id);
    setLoanName(emi.loanName || '');
    setEmiAmount(emi.emiAmount ? String(emi.emiAmount) : '');
    setDueDate(toDisplayDate(emi.dueDate) || '');
    setFrequency(emi.frequency || 'Monthly');
    setNotes(emi.notes || '');
    setModalVisible(true);
  };

  const handleSaveEmi = async () => {
    if (!loanName.trim()) return alertMsg('Please enter an EMI / Loan Name.');
    
    const amt = parseFloat(emiAmount);
    if (!emiAmount || isNaN(amt) || amt < 0) return alertMsg('Please enter a valid positive EMI Amount.');
    
    if (!dueDate) return alertMsg('Please enter a Due Date.');
    if (!isValidDateDDMMYYYY(dueDate)) return alertMsg('Please enter a valid calendar date in DD-MM-YYYY format.');

    const payload = {
      loanName: loanName.trim(),
      emiAmount: amt,
      dueDate: toStorageDate(dueDate),
      frequency: frequency.trim(),
      notes: notes.trim()
    };
    
    if (editingId) {
      await updateEmi(userId, editingId, payload);
    } else {
      const saved = await addEmi(userId, payload);
      if (khataData?.enabled) { await handleKhataIntegration(userId, khataData, amt, loanName, saved.id, 'EMI Reminder'); }
    }
    
    setModalVisible(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteEmi(userId, deleteId);
    setDeleteId(null);
    load();
  };
  
  const totalMonthlyEmi = emis.reduce((sum, e) => sum + (parseFloat(e.emiAmount) || 0), 0);

  const renderItem = ({ item }) => (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{item.loanName}</Text>
          <Text style={s.subText}>{item.frequency || 'Monthly'}</Text>
        </View>
        <Text style={s.amountText}>{'₹'}{(parseFloat(item.emiAmount) || 0).toLocaleString('en-IN')}</Text>
      </View>

      <View style={s.detailsBlock}>
        <View style={s.detailRow}>
          <Calendar size={14} color={C.textMuted} />
          <Text style={s.detailText}>Due: <Text style={{color: C.white, fontWeight: '700'}}>{toDisplayDate(item.dueDate)}</Text></Text>
        </View>
        {item.notes ? <Text style={s.notesText} numberOfLines={2}>{item.notes}</Text> : null}
      </View>

      <View style={s.cardActions}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={s.actionBtn}>
          <Edit3 size={14} color={C.gold} />
          <Text style={s.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDeleteId(item.id)} style={[s.actionBtn, { borderColor: C.error + '55', backgroundColor: C.error + '11' }]}>
          <Trash2 size={14} color={C.error} />
          <Text style={[s.actionText, { color: C.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ChevronLeft size={24} color={C.gold} />
          <Text style={{ color: C.gold, fontSize: 16 }}>Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>EMI Reminder</Text>
        <TouchableOpacity style={s.addBtnTop} onPress={openAddModal}>
          <Text style={s.addBtnTextTop}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={s.totalCard}>
        <Text style={s.totalLabel}>Total Monthly EMI</Text>
        <Text style={s.totalAmount}>{'₹'}{totalMonthlyEmi.toLocaleString('en-IN')}</Text>
      </View>

      {/* List */}
      <FlatList
        data={emis.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        renderItem={renderItem}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <CreditCard size={48} color={C.textMuted} />
              <Text style={s.emptyText}>No EMI reminders yet</Text>
              <Text style={s.emptySub}>Tap "+ Add" to create your first EMI reminder.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={<SecurityFooter style={{ marginTop: 24 }} />}
      />

      {/* Add / Edit EMI Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', maxHeight: '92%' }}>
            <View style={s.modal}>
              <View style={s.modalDrag} />
              <Text style={s.modalTitle}>{editingId ? 'Edit EMI' : 'Add EMI'}</Text>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={s.label}>EMI NAME / LOAN NAME *</Text>
                <TextInput style={s.input} value={loanName} onChangeText={setLoanName} placeholder="e.g. Home Loan, Car Loan" placeholderTextColor={C.textMuted} />
                
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>EMI AMOUNT ({'₹'}) *</Text>
                    <TextInput style={s.input} value={emiAmount} onChangeText={(t) => setEmiAmount(t.replace(/[^0-9.]/g, ''))} placeholder="e.g. 15000" keyboardType="numeric" placeholderTextColor={C.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>DUE DATE *</Text>
                    <TextInput style={s.input} value={dueDate} onChangeText={(t) => setDueDate(formatDateInput(t))} placeholder="DD-MM-YYYY" placeholderTextColor={C.textMuted} keyboardType="numeric" maxLength={10} />
                  </View>
                </View>

                <Text style={s.label}>FREQUENCY</Text>
                <View style={s.freqRow}>
                  {['Monthly', 'Quarterly', 'Yearly'].map(f => (
                    <TouchableOpacity key={f} style={[s.freqBtn, frequency === f && s.freqBtnActive]} onPress={() => setFrequency(f)}>
                      <Text style={[s.freqText, frequency === f && s.freqTextActive]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.label}>DESCRIPTION / NOTES (OPTIONAL)</Text>
                <TextInput style={[s.input, { height: 70, textAlignVertical: 'top', marginBottom: 16 }]} value={notes} onChangeText={setNotes} placeholder="Add any details..." placeholderTextColor={C.textMuted} multiline />
                {!editingId && <KhataLinker userId={userId} onChange={setKhataData} />}
                
                <View style={s.modalBtns}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={s.saveBtn} onPress={handleSaveEmi}><Text style={s.saveText}>Save</Text></TouchableOpacity>
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteId} animationType="fade" transparent>
        <View style={s.alertOverlay}>
          <View style={s.alertBox}>
            <Text style={s.alertTitle}>Delete EMI?</Text>
            <Text style={s.alertMessage}>Are you sure you want to delete this EMI?</Text>
            <View style={s.alertBtns}>
              <TouchableOpacity style={s.alertCancel} onPress={() => setDeleteId(null)}>
                <Text style={s.alertCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.alertDelete} onPress={confirmDelete}>
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
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { padding: 4, marginRight: 8, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: C.white, textAlign: 'center' },
  addBtnTop: { backgroundColor: C.gold, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  addBtnTextTop: { color: '#000', fontWeight: '700', fontSize: 13 },
  
  totalCard: { margin: 16, marginBottom: 0, backgroundColor: C.card, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  totalLabel: { fontSize: 12, color: C.gold, fontWeight: '600', marginBottom: 6 },
  totalAmount: { fontSize: 36, fontWeight: '800', color: C.white, letterSpacing: -1 },
  
  list: { padding: 16, paddingBottom: 100 },
  
  card: { backgroundColor: C.card, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: C.white, marginBottom: 4 },
  subText: { fontSize: 13, color: C.textMuted, fontWeight: '500' },
  amountText: { fontSize: 20, fontWeight: '800', color: C.white },
  
  detailsBlock: { padding: 16, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: C.textMuted },
  notesText: { fontSize: 13, color: C.textSecondary, marginTop: 4, lineHeight: 18 },
  
  cardActions: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, gap: 6 },
  actionText: { fontSize: 13, fontWeight: '600', color: C.gold },
  
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '800', color: C.white },
  emptySub: { fontSize: 14, color: C.textMuted, textAlign: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '100%' },
  modalDrag: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 8 },
  
  label: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, fontSize: 15, color: C.white, outlineStyle: 'none' },
  
  freqRow: { flexDirection: 'row', gap: 8 },
  freqBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.02)' },
  freqBtnActive: { borderColor: C.gold, backgroundColor: 'rgba(240, 165, 0, 0.1)' },
  freqText: { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  freqTextActive: { color: C.gold },

  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 28 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  cancelText: { color: C.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: C.gold, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#000', fontWeight: '800', fontSize: 15 },
  
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertBox: { backgroundColor: C.card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 340, borderWidth: 1, borderColor: C.border },
  alertTitle: { color: C.white, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  alertMessage: { color: C.textSecondary, fontSize: 14, marginBottom: 24, lineHeight: 20 },
  alertBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  alertCancel: { paddingHorizontal: 16, paddingVertical: 10 },
  alertCancelText: { color: C.textMuted, fontWeight: '600', fontSize: 14 },
  alertDelete: { backgroundColor: C.error, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  alertDeleteText: { color: C.white, fontWeight: '700', fontSize: 14 }
});
