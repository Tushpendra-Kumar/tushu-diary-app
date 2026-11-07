import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, SafeAreaView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import KhataLinker, { handleKhataIntegration } from '../../../components/KhataLinker';
import { isValidDate, toStorageDate, toDisplayDate, formatDateInput } from '../../../utils/dateFormatter';
import { getExpenses, addExpense, deleteExpense } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { Utensils, Car, ShoppingBag, ReceiptText, Stethoscope, Tv, MoreHorizontal, Wallet, ChevronLeft } from 'lucide-react-native';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Medical', 'Entertainment', 'Other'];

const getCatIcon = (category, color) => {
  const size = 20;
  switch (category) {
    case 'Food': return <Utensils size={size} color={color} />;
    case 'Transport': return <Car size={size} color={color} />;
    case 'Shopping': return <ShoppingBag size={size} color={color} />;
    case 'Bills': return <ReceiptText size={size} color={color} />;
    case 'Medical': return <Stethoscope size={size} color={color} />;
    case 'Entertainment': return <Tv size={size} color={color} />;
    default: return <MoreHorizontal size={size} color={color} />;
  }
};

const CAT_COLORS = { Food: '#FF7043', Transport: '#42A5F5', Shopping: '#AB47BC', Bills: '#FFA726', Medical: '#EF5350', Entertainment: '#EC407A', Other: '#78909C' };

export default function ExpenseTrackerScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id || user?.id;
  const [expenses, setExpenses] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [filter, setFilter] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  // Initialize date in display format DD/MM/YYYY
  const todayDisplay = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  })();
  const [date, setDate] = useState(todayDisplay);

  useEffect(() => { load(); }, []);
  const load = async () => setExpenses(await getExpenses(userId) || []);

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      if (Platform.OS === 'web') window.alert('Please enter a valid numeric amount greater than 0.');
      else Alert.alert('Error', 'Please enter a valid numeric amount greater than 0.');
      return;
    }
    if (!date || !isValidDate(date)) {
      if (Platform.OS === 'web') window.alert('Please enter a valid date in DD/MM/YYYY format.');
      else Alert.alert('Error', 'Please enter a valid date in DD/MM/YYYY format.');
      return;
    }

    await addExpense(userId, { amount: amt, category, description: description.trim(), date: toStorageDate(date) });
    setAmount(''); setDescription(''); setDate(todayDisplay); setModalVisible(false);
    load();
  };


  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteExpense(userId, deleteId); 
      load();
    } catch(e) {}
    setDeleteId(null);
  };

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.slice(0, 7);
  const filtered = expenses.filter(e => {
    if (filter === 'Today') return e.date === today;
    if (filter === 'This Month') return e.date?.startsWith(thisMonth);
    return true;
  });

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  // Category breakdown
  const catBreakdown = CATEGORIES.map(c => ({
    cat: c, total: filtered.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const renderItem = ({ item }) => (
    <View style={s.card}>
      <View style={[s.catIcon, { backgroundColor: CAT_COLORS[item.category] + '22' }]}>
        {getCatIcon(item.category, CAT_COLORS[item.category])}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={s.catLabel}>{item.category}</Text>
        {item.description ? <Text style={s.desc}>{item.description}</Text> : null}
        <Text style={s.eDate}>{toDisplayDate(item.date)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.eAmount}>-{'₹'}{item.amount.toLocaleString('en-IN')}</Text>
        <TouchableOpacity onPress={() => setDeleteId(item.id)}>
          <Text style={{ color: C.error, fontSize: 12, marginTop: 4, fontWeight: 'bold' }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ChevronLeft size={24} color={C.gold} />
          <Text style={{ color: C.gold, fontSize: 16 }}>Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Expense Tracker</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Total */}
      <View style={s.totalCard}>
        <Text style={s.totalLabel}>{filter === 'Today' ? 'TODAY' : filter === 'This Month' ? 'THIS MONTH' : 'TOTAL'} SPENT</Text>
        <Text style={s.totalAmount}>{'₹'}{totalFiltered.toLocaleString('en-IN')}</Text>
      </View>

      {/* Filter */}
      <View style={s.filters}>
        {['All', 'Today', 'This Month'].map(f => (
          <TouchableOpacity key={f} style={[s.filterTab, filter === f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter === f && { color: C.gold }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category breakdown */}
      {catBreakdown.length > 0 && (
        <View style={s.breakdown}>
          {catBreakdown.map(c => (
            <View key={c.cat} style={s.breakdownRow}>
              {getCatIcon(c.cat, CAT_COLORS[c.cat])}
              <Text style={s.breakdownCat}>{c.cat}</Text>
              <Text style={s.breakdownAmt}>{'₹'}{c.total.toLocaleString('en-IN')}</Text>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={filtered} keyExtractor={i => i.id} renderItem={renderItem}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Wallet size={48} color={C.textMuted} />
            <Text style={s.emptyText}>No expenses yet</Text>
          </View>
        }
        ListFooterComponent={<SecurityFooter style={{ marginTop: 24 }} />}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <View style={s.modal}>
              <Text style={s.modalTitle}>Add Expense</Text>
              
              <Text style={s.label}>AMOUNT ({'₹'})</Text>
              <TextInput style={s.input} value={amount} onChangeText={setAmount}
                placeholder="e.g. 250" placeholderTextColor={C.textMuted} keyboardType="numeric" autoFocus />
                
              <Text style={s.label}>CATEGORY</Text>
              <View style={s.catGrid}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c} style={[s.catBtn, category === c && { borderColor: CAT_COLORS[c], backgroundColor: CAT_COLORS[c] + '22' }]}
                    onPress={() => setCategory(c)}>
                    {getCatIcon(c, category === c ? CAT_COLORS[c] : C.textMuted)}
                    <Text style={[s.catBtnText, category === c && { color: CAT_COLORS[c] }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={s.label}>DESCRIPTION (OPTIONAL)</Text>
              <TextInput style={s.input} value={description} onChangeText={setDescription}
                placeholder="What was this for?" placeholderTextColor={C.textMuted} />
                
              <Text style={s.label}>DATE</Text>
              <TextInput style={s.input} value={date} onChangeText={(t) => setDate(formatDateInput(t))} placeholder="DD/MM/YYYY" placeholderTextColor={C.textMuted} keyboardType="numeric" maxLength={10} />
              
              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleSave}><Text style={s.saveText}>Save</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteId} animationType="fade" transparent>
        <View style={s.alertOverlay}>
          <View style={s.alertBox}>
            <Text style={s.alertTitle}>Delete Expense?</Text>
            <Text style={s.alertMessage}>This expense will be permanently deleted.</Text>
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
  addBtn: { backgroundColor: C.gold, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  addBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  totalCard: { margin: 16, marginBottom: 0, backgroundColor: C.card, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  totalLabel: { fontSize: 10, color: C.textMuted, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  totalAmount: { fontSize: 36, fontWeight: '800', color: C.error, letterSpacing: -1 },
  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.border },
  filterActive: { backgroundColor: C.goldDim, borderColor: C.border },
  filterText: { fontSize: 12, color: C.textMuted, fontWeight: '600' },
  breakdown: { marginHorizontal: 16, backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 5 },
  breakdownCat: { flex: 1, fontSize: 13, color: C.textSecondary, fontWeight: '500' },
  breakdownAmt: { fontSize: 13, color: C.white, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 32 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  catIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  catLabel: { fontSize: 14, fontWeight: '700', color: C.white },
  desc: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  eDate: { fontSize: 11, color: C.textMuted, marginTop: 3 },
  eAmount: { fontSize: 16, fontWeight: '800', color: C.error },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: C.white },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 16 },
  label: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, fontSize: 14, color: C.white, outlineStyle: 'none' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 6 },
  catBtnText: { fontSize: 12, fontWeight: '600', color: C.textMuted },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
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
