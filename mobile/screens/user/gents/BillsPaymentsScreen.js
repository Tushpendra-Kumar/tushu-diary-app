import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import KhataLinker, { handleKhataIntegration } from '../../../components/KhataLinker';
import { isValidDate, toStorageDate, toDisplayDate, formatDateInput } from '../../../utils/dateFormatter';
import { getBills, addBill, updateBill, deleteBill } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import ParticleBackground from '../../../components/ParticleBackground';
import { C } from '../../../constants/theme';
import { FileText, Plus, ChevronLeft, Trash2, Edit3, Zap, Droplet, Wifi, Home, Smartphone, MonitorPlay, ShieldPlus, MoreHorizontal, CheckCircle2, Clock } from 'lucide-react-native';

const CATEGORIES = ['Electricity', 'Water', 'Internet', 'Rent', 'Mobile', 'Subscription', 'Insurance', 'Other'];

export default function BillsPaymentsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id || user?.id;
  
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Electricity');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Unpaid');
  const [paymentDate, setPaymentDate] = useState('');
  const [khataData, setKhataData] = useState(null);
  const [notes, setNotes] = useState('');
  
  // Delete Modal State
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    setBills(await getBills(userId) || []);
    setLoading(false);
  };

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const getComputedStatus = (bill) => {
    if (bill.status === 'Paid') return 'Paid';
    if (bill.dueDate && bill.dueDate < getTodayStr()) return 'Overdue';
    return 'Unpaid';
  };

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setAmount('');
    setCategory('Electricity');
    setDueDate(toDisplayDate(getTodayStr()));
    setStatus('Unpaid');
    setPaymentDate('');
    setKhataData(null);
    setNotes('');
    setModalVisible(true);
  };

  const openEditModal = (b) => {
    setEditingId(b.id);
    setName(b.name || '');
    setAmount(b.amount ? String(b.amount) : '');
    setCategory(b.category || 'Electricity');
    setDueDate(toDisplayDate(b.dueDate));
    setStatus(b.status || 'Unpaid');
    setPaymentDate(toDisplayDate(b.paymentDate));
    setNotes(b.notes || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return alertMsg('Bill name is required.');
    
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt < 0) return alertMsg('Please enter a valid amount.');
    if (!dueDate) return alertMsg('Due Date is required.');
    if (!isValidDate(dueDate)) return alertMsg('Please enter a valid Due Date (DD/MM/YYYY).');
    if (status === 'Paid' && paymentDate && !isValidDate(paymentDate)) return alertMsg('Please enter a valid Payment Date (DD/MM/YYYY).');

    const payload = { 
      name: name.trim(), 
      amount: amt, 
      category, 
      dueDate: toStorageDate(dueDate), 
      status, 
      paymentDate: status === 'Paid' ? (toStorageDate(paymentDate) || getTodayStr()) : '',
      notes: notes.trim() 
    };
    
    if (editingId) {
      await updateBill(userId, editingId, payload);
    } else {
      const saved = await addBill(userId, payload);
      if (khataData?.enabled) { await handleKhataIntegration(userId, khataData, amt, name.trim(), saved.id, 'Bills & Payments'); }
    }
    
    setModalVisible(false);
    load();
  };

  const markAsPaid = async (bill) => {
    await updateBill(userId, bill.id, { status: 'Paid', paymentDate: getTodayStr() });
    load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteBill(userId, deleteId);
    setDeleteId(null);
    load();
  };
  
  const alertMsg = (msg) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Validation', msg);
  };

  const getIcon = (cat) => {
    const size = 20;
    switch(cat) {
      case 'Electricity': return <Zap size={size} color={C.gold} />;
      case 'Water': return <Droplet size={size} color={'#4FC3F7'} />;
      case 'Internet': return <Wifi size={size} color={'#81C784'} />;
      case 'Rent': return <Home size={size} color={'#E57373'} />;
      case 'Mobile': return <Smartphone size={size} color={'#BA68C8'} />;
      case 'Subscription': return <MonitorPlay size={size} color={'#FF8A65'} />;
      case 'Insurance': return <ShieldPlus size={size} color={'#A1887F'} />;
      default: return <MoreHorizontal size={size} color={C.textSecondary} />;
    }
  };

  // Process Bills for rendering
  const processedBills = bills.map(b => ({ ...b, computedStatus: getComputedStatus(b) }));
  
  const totalUnpaid = processedBills
    .filter(b => b.computedStatus !== 'Paid')
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const filteredBills = processedBills.filter(b => {
    if (filter === 'All') return true;
    return b.computedStatus === filter;
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const renderItem = ({ item }) => {
    const isPaid = item.computedStatus === 'Paid';
    const isOverdue = item.computedStatus === 'Overdue';
    
    return (
      <View style={[s.card, isPaid && s.cardPaid, isOverdue && s.cardOverdue]}>
        <View style={s.cardHeader}>
          <View style={[s.iconBox, isPaid && {backgroundColor:'rgba(255,255,255,0.05)'}]}>{getIcon(item.category)}</View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.cardTitle, isPaid && s.textMuted]}>{item.name}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 2, alignItems: 'center' }}>
              <Clock size={10} color={isOverdue ? C.error : C.textMuted} />
              <Text style={{ fontSize: 12, color: isOverdue ? C.error : C.textMuted, fontWeight: isOverdue ? '700' : '500' }}>
                Due: {toDisplayDate(item.dueDate)}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[s.amount, isPaid && s.textMuted]}>{'₹'}{item.amount.toLocaleString('en-IN')}</Text>
            <Text style={[s.statusBadge, 
              isPaid ? { color: '#81C784' } : isOverdue ? { color: C.error } : { color: C.gold }
            ]}>{item.computedStatus}</Text>
          </View>
        </View>
        
        {item.paymentDate && isPaid ? (
          <Text style={s.paidOnText}>Paid on: {toDisplayDate(item.paymentDate)}</Text>
        ) : null}
        
        {item.notes ? (
          <Text style={s.notesText} numberOfLines={2}>{item.notes}</Text>
        ) : null}
        
        <View style={s.cardActions}>
          {!isPaid && (
            <TouchableOpacity onPress={() => markAsPaid(item)} style={[s.actionBtn, { borderColor: '#81C78455', backgroundColor: '#81C78411', flex: 1.5 }]}>
              <CheckCircle2 size={14} color="#81C784" />
              <Text style={[s.actionText, { color: '#81C784' }]}>Mark Paid</Text>
            </TouchableOpacity>
          )}
          
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
  };

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ChevronLeft size={24} color={C.gold} />
          <Text style={{ color: C.gold, fontSize: 16 }}>Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Bills & Payments</Text>
        <TouchableOpacity style={s.addBtnTop} onPress={openAddModal}>
          <Text style={s.addBtnTextTop}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={s.totalCard}>
        <Text style={s.totalLabel}>Total Unpaid Bills</Text>
        <Text style={s.totalAmount}>{'₹'}{totalUnpaid.toLocaleString('en-IN')}</Text>
      </View>

      <View style={s.filters}>
        {['All', 'Unpaid', 'Paid', 'Overdue'].map(f => (
          <TouchableOpacity key={f} style={[s.filterTab, filter === f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter === f && { color: C.gold }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredBills}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        renderItem={renderItem}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <FileText size={48} color={C.textMuted} />
              <Text style={s.emptyText}>No {filter.toLowerCase()} bills</Text>
              <Text style={s.emptySub}>{filter === 'All' ? 'Tap "+ Add" to create your first bill.' : 'No bills found for this category.'}</Text>
            </View>
          ) : null
        }
        ListFooterComponent={<SecurityFooter style={{ marginTop: 24 }} />}
      />

      

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', maxHeight: '92%' }}>
            <View style={s.modal}>
              <View style={s.modalDrag} />
              <Text style={s.modalTitle}>{editingId ? 'Edit Bill' : 'Add Bill'}</Text>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={s.label}>BILL / PAYMENT NAME *</Text>
                <TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g. Electricity Bill" placeholderTextColor={C.textMuted} />
                
                <Text style={s.label}>AMOUNT ({'₹'}) *</Text>
                <TextInput style={s.input} value={amount} onChangeText={setAmount} placeholder="e.g. 1250" keyboardType="numeric" placeholderTextColor={C.textMuted} />
                
                <Text style={s.label}>CATEGORY</Text>
                <View style={s.gridRow}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity key={c} style={[s.gridBtn, category === c && s.gridBtnActive]} onPress={() => setCategory(c)}>
                      <Text style={[s.gridBtnText, category === c && s.gridBtnTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>DUE DATE *</Text>
                    <TextInput style={s.input} value={dueDate} onChangeText={(t) => setDueDate(formatDateInput(t))} placeholder="DD/MM/YYYY" placeholderTextColor={C.textMuted} keyboardType="numeric" maxLength={10} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>STATUS</Text>
                    <View style={[s.gridRow, { marginTop: 0 }]}>
                      {['Unpaid', 'Paid'].map(st => (
                        <TouchableOpacity key={st} style={[s.gridBtn, { flex: 1, paddingHorizontal: 0, alignItems: 'center' }, status === st && s.gridBtnActive]} onPress={() => setStatus(st)}>
                          <Text style={[s.gridBtnText, status === st && s.gridBtnTextActive]}>{st}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
                
                {!editingId && <KhataLinker userId={userId} onChange={setKhataData} />}
                {status === 'Paid' && (
                  <View>
                    <Text style={s.label}>PAYMENT DATE (OPTIONAL)</Text>
                    <TextInput style={s.input} value={paymentDate} onChangeText={(t) => setPaymentDate(formatDateInput(t))} placeholder="DD/MM/YYYY" placeholderTextColor={C.textMuted} keyboardType="numeric" maxLength={10} />
                  </View>
                )}

                <Text style={s.label}>NOTES (OPTIONAL)</Text>
                <TextInput style={[s.input, { height: 70, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Any specific details..." placeholderTextColor={C.textMuted} multiline />
                
                <View style={s.modalBtns}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={s.saveBtn} onPress={handleSave}><Text style={s.saveText}>Save Bill</Text></TouchableOpacity>
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
            <Text style={s.alertTitle}>Delete this bill?</Text>
            <Text style={s.alertMessage}>Are you sure you want to permanently delete this bill?</Text>
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
  
  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.border },
  filterActive: { backgroundColor: C.goldDim, borderColor: C.border },
  filterText: { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  
  list: { padding: 16, paddingBottom: 100 },
  
  card: { backgroundColor: C.card, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardPaid: { opacity: 0.7, borderColor: '#81C78444' },
  cardOverdue: { borderColor: C.error + '66' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(240, 165, 0, 0.1)', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.white, marginBottom: 2 },
  amount: { fontSize: 18, fontWeight: '800', color: C.white },
  statusBadge: { fontSize: 11, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  textMuted: { color: C.textSecondary, textDecorationLine: 'line-through' },
  
  paidOnText: { fontSize: 12, color: '#81C784', paddingHorizontal: 16, paddingBottom: 8, fontWeight: '600' },
  notesText: { fontSize: 12, color: C.textSecondary, paddingHorizontal: 16, paddingBottom: 12 },
  
  cardActions: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, gap: 6 },
  actionText: { color: C.gold, fontSize: 13, fontWeight: '600' },
  
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: C.gold, justifyContent: 'center', alignItems: 'center',    height: 2 },  
  
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '800', color: C.white },
  emptySub: { fontSize: 14, color: C.textMuted },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '100%' },
  modalDrag: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 8 },
  
  label: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, fontSize: 15, color: C.white, outlineStyle: 'none' },
  
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.03)' },
  gridBtnActive: { borderColor: C.gold, backgroundColor: 'rgba(240, 165, 0, 0.1)' },
  gridBtnText: { color: C.textSecondary, fontWeight: '600', fontSize: 13 },
  gridBtnTextActive: { color: C.gold },
  
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
