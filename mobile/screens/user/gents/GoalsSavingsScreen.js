import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { isValidDate, toStorageDate, toDisplayDate, formatDateInput } from '../../../utils/dateFormatter';
import { getGoals, addGoal, updateGoal, deleteGoal } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import ParticleBackground from '../../../components/ParticleBackground';
import { C } from '../../../constants/theme';
import { Target, Plus, ChevronLeft, Trash2, Edit3, PlusCircle, CheckCircle2 } from 'lucide-react-native';

export default function GoalsSavingsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id || user?.id;
  
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, In Progress, Completed
  
  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [addFundsVisible, setAddFundsVisible] = useState(false);
  const [activeGoal, setActiveGoal] = useState(null);
  const [fundsToAdd, setFundsToAdd] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  
  // Delete State
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { load(); }, []);
  
  const load = async () => {
    setLoading(true);
    setGoals(await getGoals(userId) || []);
    setLoading(false);
  };

  const alertMsg = (msg) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Validation', msg);
  };

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setTargetAmount('');
    setSavedAmount('0');
    setTargetDate('');
    setDescription('');
    setModalVisible(true);
  };

  const openEditModal = (g) => {
    setEditingId(g.id);
    setName(g.name || '');
    setTargetAmount(g.targetAmount ? String(g.targetAmount) : '');
    setSavedAmount(g.savedAmount ? String(g.savedAmount) : '0');
    setTargetDate(toDisplayDate(g.targetDate));
    setDescription(g.description || '');
    setModalVisible(true);
  };

  const handleSaveGoal = async () => {
    if (!name.trim()) return alertMsg('Goal Name is required.');
    
    const tAmt = parseFloat(targetAmount);
    if (!targetAmount || isNaN(tAmt) || tAmt <= 0) return alertMsg('Target Amount must be greater than 0.');
    
    if (targetDate && !isValidDate(targetDate)) return alertMsg('Please enter a valid Target Date (DD/MM/YYYY).');
    let sAmt = parseFloat(savedAmount) || 0;
    if (sAmt < 0) return alertMsg('Saved Amount cannot be negative.');
    if (sAmt > tAmt) return alertMsg('Saved Amount cannot exceed Target Amount.');

    const payload = {
      name: name.trim(),
      targetAmount: tAmt,
      savedAmount: sAmt,
      targetDate: toStorageDate(targetDate),
      description: description.trim()
    };
    
    if (editingId) {
      // For edits, we might not want them to change savedAmount via main form but UI allows it
      await updateGoal(userId, editingId, payload);
    } else {
      await addGoal(userId, payload);
    }
    
    setModalVisible(false);
    load();
  };

  const openAddFunds = (g) => {
    setActiveGoal(g);
    setFundsToAdd('');
    setAddFundsVisible(true);
  };

  const handleAddFunds = async () => {
    if (!activeGoal) return;
    const addAmt = parseFloat(fundsToAdd);
    if (isNaN(addAmt) || addAmt <= 0) return alertMsg('Please enter a valid amount greater than 0.');
    
    const remaining = activeGoal.targetAmount - (activeGoal.savedAmount || 0);
    if (addAmt > remaining) return alertMsg(`You can only add up to ₹${remaining}.`);
    
    const newSaved = (activeGoal.savedAmount || 0) + addAmt;
    await updateGoal(userId, activeGoal.id, { savedAmount: newSaved });
    setAddFundsVisible(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteGoal(userId, deleteId);
    setDeleteId(null);
    load();
  };

  const getComputedStatus = (g) => {
    const saved = g.savedAmount || 0;
    const target = g.targetAmount || 0;
    return saved >= target ? 'Completed' : 'In Progress';
  };

  const processedGoals = goals.map(g => ({
    ...g,
    computedStatus: getComputedStatus(g),
    saved: g.savedAmount || 0,
    target: g.targetAmount || 0,
    remaining: (g.targetAmount || 0) - (g.savedAmount || 0),
    percentage: Math.min(100, Math.max(0, ((g.savedAmount || 0) / (g.targetAmount || 1)) * 100))
  }));

  const totalSavedValue = processedGoals.reduce((sum, g) => sum + g.saved, 0);

  const filteredGoals = processedGoals.filter(g => {
    if (filter === 'All') return true;
    return g.computedStatus === filter;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const renderItem = ({ item }) => {
    const isCompleted = item.computedStatus === 'Completed';
    
    return (
      <View style={[s.card, isCompleted && s.cardCompleted]}>
        <View style={s.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{item.name}</Text>
            {item.targetDate ? <Text style={s.dateText}>Target Date: {toDisplayDate(item.targetDate)}</Text> : null}
          </View>
          <View style={[s.statusBadge, isCompleted ? { backgroundColor: '#81C78422' } : { backgroundColor: C.gold + '22' }]}>
            <Text style={[s.statusText, isCompleted ? { color: '#81C784' } : { color: C.gold }]}>{item.computedStatus}</Text>
          </View>
        </View>

        <View style={s.statsRow}>
          <Text style={s.savedText}>{'₹'}{item.saved.toLocaleString('en-IN')} <Text style={s.muted}>saved of</Text> {'₹'}{item.target.toLocaleString('en-IN')}</Text>
        </View>

        <View style={s.progressRow}>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${item.percentage}%`, backgroundColor: isCompleted ? '#81C784' : C.gold }]} />
          </View>
          <Text style={s.percentageText}>{Math.floor(item.percentage)}%</Text>
        </View>

        <View style={s.remainingRow}>
          <Text style={s.muted}>Remaining: <Text style={s.whiteText}>{'₹'}{item.remaining.toLocaleString('en-IN')}</Text></Text>
        </View>
        
        {item.description ? <Text style={s.notesText} numberOfLines={2}>{item.description}</Text> : null}

        <View style={s.cardActions}>
          {!isCompleted && (
            <TouchableOpacity onPress={() => openAddFunds(item)} style={[s.actionBtn, { borderColor: C.gold + '55', backgroundColor: C.gold + '11', flex: 1.5 }]}>
              <PlusCircle size={14} color={C.gold} />
              <Text style={s.actionText}>Add Savings</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => openEditModal(item)} style={s.actionBtn}>
            <Edit3 size={14} color={C.textSecondary} />
            <Text style={[s.actionText, { color: C.textSecondary }]}>Edit</Text>
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
      
      {/* Header */}
      <View style={s.header}>
        <View style={{ width: 48 }} />
        <Text style={s.headerTitle}>Goals & Savings</Text>
        <TouchableOpacity style={s.addBtnTop} onPress={openAddModal}>
          <Text style={s.addBtnTextTop}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={s.totalCard}>
        <Text style={s.totalLabel}>Total Saved</Text>
        <Text style={s.totalAmount}>{'₹'}{totalSavedValue.toLocaleString('en-IN')}</Text>
      </View>

      {/* Filters */}
      <View style={s.filters}>
        {['All', 'In Progress', 'Completed'].map(f => (
          <TouchableOpacity key={f} style={[s.filterTab, filter === f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter === f && { color: C.gold }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredGoals}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        renderItem={renderItem}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <Target size={48} color={C.textMuted} />
              <Text style={s.emptyText}>No goals yet</Text>
              <Text style={s.emptySub}>Start saving toward something important.</Text>
              <Text style={s.emptySub}>Tap "+ Add" to create your first savings goal.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={<SecurityFooter style={{ marginTop: 24 }} />}
      />

      {/* Add / Edit Goal Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', maxHeight: '92%' }}>
            <View style={s.modal}>
              <View style={s.modalDrag} />
              <Text style={s.modalTitle}>{editingId ? 'Edit Goal' : 'Add Goal'}</Text>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={s.label}>GOAL NAME *</Text>
                <TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g. Vacation, New Phone" placeholderTextColor={C.textMuted} />
                
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>TARGET AMOUNT ({'₹'}) *</Text>
                    <TextInput style={s.input} value={targetAmount} onChangeText={setTargetAmount} placeholder="e.g. 50000" keyboardType="numeric" placeholderTextColor={C.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>INITIAL SAVED ({'₹'})</Text>
                    <TextInput style={s.input} value={savedAmount} onChangeText={setSavedAmount} placeholder="e.g. 0" keyboardType="numeric" placeholderTextColor={C.textMuted} />
                  </View>
                </View>

                <Text style={s.label}>TARGET DATE (OPTIONAL)</Text>
                <TextInput style={s.input} value={targetDate} onChangeText={(t) => setTargetDate(formatDateInput(t))} placeholder="DD/MM/YYYY" placeholderTextColor={C.textMuted} keyboardType="numeric" maxLength={10} />

                <Text style={s.label}>DESCRIPTION (OPTIONAL)</Text>
                <TextInput style={[s.input, { height: 70, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Why is this important..." placeholderTextColor={C.textMuted} multiline />
                
                <View style={s.modalBtns}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={s.saveBtn} onPress={handleSaveGoal}><Text style={s.saveText}>Save Goal</Text></TouchableOpacity>
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Add Funds Modal */}
      <Modal visible={addFundsVisible} animationType="fade" transparent>
        <View style={s.alertOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', alignItems: 'center' }}>
            <View style={s.alertBox}>
              <Text style={s.alertTitle}>Add Savings</Text>
              <Text style={s.alertMessage}>Adding to: <Text style={{ color: C.white, fontWeight: '700' }}>{activeGoal?.name}</Text></Text>
              
              <TextInput 
                style={[s.input, { width: '100%', marginBottom: 24, fontSize: 18, textAlign: 'center' }]} 
                value={fundsToAdd} 
                onChangeText={setFundsToAdd} 
                placeholder="Amount to add (₹)" 
                keyboardType="numeric" 
                placeholderTextColor={C.textMuted} 
                autoFocus
              />
              
              <View style={s.alertBtns}>
                <TouchableOpacity style={[s.alertCancel, { flex: 1, alignItems: 'center' }]} onPress={() => setAddFundsVisible(false)}>
                  <Text style={s.alertCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.saveBtn, { flex: 1, padding: 12, marginTop: 0 }]} onPress={handleAddFunds}>
                  <Text style={s.saveText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteId} animationType="fade" transparent>
        <View style={s.alertOverlay}>
          <View style={s.alertBox}>
            <Text style={s.alertTitle}>Delete Goal?</Text>
            <Text style={s.alertMessage}>Are you sure you want to permanently delete this goal?</Text>
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
  safe: { flex: 1, backgroundColor: '#06080D' },
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
  cardCompleted: { borderColor: '#81C78455' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, paddingBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: C.white, marginBottom: 4 },
  dateText: { fontSize: 12, color: C.textMuted },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  
  statsRow: { paddingHorizontal: 16, marginBottom: 12 },
  savedText: { fontSize: 18, fontWeight: '700', color: C.white },
  muted: { color: C.textMuted, fontSize: 13, fontWeight: '500' },
  whiteText: { color: C.white, fontWeight: '700' },
  
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8, gap: 12 },
  progressTrack: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  percentageText: { fontSize: 12, fontWeight: '700', color: C.white, width: 30, textAlign: 'right' },
  
  remainingRow: { paddingHorizontal: 16, paddingBottom: 12 },
  notesText: { fontSize: 12, color: C.textSecondary, paddingHorizontal: 16, paddingBottom: 12 },
  
  cardActions: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, gap: 6 },
  actionText: { fontSize: 13, fontWeight: '600' },
  
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '800', color: C.white },
  emptySub: { fontSize: 14, color: C.textMuted, textAlign: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '100%' },
  modalDrag: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 8 },
  
  label: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, fontSize: 15, color: C.white, outlineStyle: 'none' },
  
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
