import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { getKhataContacts, addKhataContact, deleteKhataContact, getKhataBalance } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { BookOpen, Users, CheckCircle2, Trash2, Plus, X, UserPlus, ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react-native';

export default function KhataScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id;
  const [contacts, setContacts] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (userId) load();
  }, [userId]);

  const load = async () => {
    const data = await getKhataContacts(userId);
    setContacts(data || []);
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addKhataContact(userId, name.trim());
    setName('');
    setModalVisible(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteKhataContact(userId, deleteId);
    setDeleteId(null);
    load();
  };

  const totalBalance = contacts.reduce((sum, c) => sum + getKhataBalance(c), 0);

  const renderItem = ({ item }) => {
    const bal = getKhataBalance(item);
    const isPositive = bal >= 0;
    const isZero = bal === 0;

    return (
      <TouchableOpacity style={s.card} onPress={() => navigation.navigate('KhataContact', { contactId: item.id, userId })} activeOpacity={0.8}>
        <View style={s.contactAvatar}>
          <Text style={s.contactInitial}>{item.name[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.contactName}>{item.name}</Text>
          <Text style={s.entryCount}>{item.entries ? item.entries.length : 0} entries</Text>
        </View>
        <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
          <Text style={[s.balance, { color: isZero ? C.textSecondary : isPositive ? C.success : C.error }]}>
            {isZero ? '' : (isPositive ? '+' : '-')}₹{Math.abs(bal).toLocaleString('en-IN')}
          </Text>
          <Text style={s.balanceLabel}>{isZero ? 'Settled' : (isPositive ? 'will receive' : 'will give')}</Text>
        </View>
        <TouchableOpacity onPress={() => setDeleteId(item.id)} style={s.deleteBtn}>
          <Trash2 size={20} color={C.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      
      {/* Inline Header (Fixed spacing & icons) */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ color: C.gold, fontSize: 16 }}>‹ Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <BookOpen size={24} color={C.gold} style={{marginRight: 10}} />
          <View>
            <Text style={s.headerTitle}>Khata Book</Text>
            <Text style={s.headerSub}>Personal ledger</Text>
          </View>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 100}}>
        {/* Total Balance Card */}
        <View style={s.totalCard}>
          <Text style={s.totalLabel}>NET BALANCE</Text>
          <Text style={[s.totalAmount, { color: totalBalance === 0 ? C.textSecondary : totalBalance > 0 ? C.success : C.error }]}>
            {totalBalance === 0 ? '' : (totalBalance > 0 ? '+' : '-')}₹{Math.abs(totalBalance).toLocaleString('en-IN')}
          </Text>
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
            {totalBalance === 0 ? <CheckCircle2 size={16} color={C.textSecondary} style={{marginRight: 6}} /> :
             totalBalance > 0 ? <ArrowDownLeft size={16} color={C.success} style={{marginRight: 6}} /> : 
             <ArrowUpRight size={16} color={C.error} style={{marginRight: 6}} />}
            <Text style={s.totalSub}>
              {totalBalance === 0 ? 'All settled' : totalBalance > 0 ? 'Overall you will receive' : 'Overall you will give'}
            </Text>
          </View>
        </View>

        {/* Contacts List */}
        <View style={{paddingHorizontal: 16, marginTop: 10}}>
          <Text style={s.sectionTitle}>CONTACTS ({contacts.length})</Text>
          {contacts.length === 0 ? (
            <View style={s.emptyContainer}>
              <Users size={48} color={C.textMuted} style={{marginBottom: 12}} />
              <Text style={s.emptyText}>No contacts yet</Text>
              <Text style={s.emptySub}>Add a person to start tracking transactions.</Text>
            </View>
          ) : (
            contacts.map(item => <View key={item.id}>{renderItem({item})}</View>)
          )}
        </View>
        <SecurityFooter style={{marginTop: 40}} />
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Contact</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color={C.textSecondary}/></TouchableOpacity>
            </View>
            <Text style={s.label}>Contact Name *</Text>
            <TextInput 
              style={s.input} 
              placeholderTextColor={C.textMuted} 
              value={name} 
              onChangeText={setName} 
              placeholder="e.g. Rahul" 
              autoFocus 
            />
            <TouchableOpacity style={s.saveBtn} onPress={handleAdd}>
              <Text style={s.saveBtnText}>Save Contact</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteId} animationType="fade" transparent>
        <View style={s.alertOverlay}>
          <View style={s.alertBox}>
            <Text style={s.alertTitle}>Delete Contact</Text>
            <Text style={s.alertMessage}>Are you sure you want to permanently delete this contact and all their entries?</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { marginRight: 16 },
  headerTitle: { color: C.white, fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: C.textSecondary, fontSize: 12 },
  addBtn: { backgroundColor: C.goldDim, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  addBtnText: { color: C.gold, fontWeight: 'bold' },
  totalCard: { 
    margin: 16, padding: 24, borderRadius: 18, 
    backgroundColor: 'rgba(22, 19, 13, 0.92)', 
    borderWidth: 1.5, borderColor: 'rgba(240, 165, 0, 0.45)', 
    shadowColor: C.gold, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 3,
    alignItems: 'center' 
  },
  totalLabel: { color: '#8E8E93', fontSize: 11, letterSpacing: 1.8, fontWeight: '800', textTransform: 'uppercase', marginBottom: 10 },
  totalAmount: { fontSize: 36, fontWeight: '900' },
  totalSub: { color: C.textSecondary, fontSize: 13 },
  sectionTitle: { color: '#8E8E93', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 12 },
  card: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.035)', 
    padding: 14, borderRadius: 16, marginBottom: 10, 
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 2,
  },
  contactAvatar: { width: 44, height: 44, borderRadius: 13, backgroundColor: 'rgba(240, 165, 0, 0.15)', borderWidth: 1, borderColor: 'rgba(240, 165, 0, 0.35)', alignItems: 'center', justifyContent: 'center' },
  contactInitial: { color: C.gold, fontSize: 18, fontWeight: 'bold' },
  contactName: { color: C.white, fontSize: 16, fontWeight: 'bold' },
  entryCount: { color: C.textMuted, fontSize: 12, marginTop: 2 },
  balance: { fontSize: 15, fontWeight: 'bold' },
  balanceLabel: { color: C.textSecondary, fontSize: 11, marginTop: 2 },
  deleteBtn: { padding: 8 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: C.white, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySub: { color: C.textMuted, fontSize: 14, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: C.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: C.white, fontSize: 20, fontWeight: 'bold' },
  label: { color: C.textSecondary, marginBottom: 8, fontSize: 13, fontWeight: 'bold' },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.white, padding: 14, marginBottom: 24, outlineStyle: 'none' },
  saveBtn: { backgroundColor: C.gold, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  saveBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
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