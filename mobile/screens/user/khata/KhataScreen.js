import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, FlatList } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { getKhataContacts, addKhataContact, deleteKhataContact, getKhataBalance } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { BookOpen, Users, CheckCircle2, Trash2, Plus, X, UserPlus, ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react-native';

export default function KhataScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const activeUserId = user?.user_id || user?.id || user?.email || 'default_user';
  
  const [contacts, setContacts] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [activeUserId]);

  const load = async () => {
    try {
      const data = await getKhataContacts(activeUserId);
      setContacts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('[KhataScreen] load error:', e);
      setContacts([]);
    }
  };

  const handleAdd = async () => {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      if (Platform.OS === 'web') window.alert('Please enter a contact name.');
      else Alert.alert('Contact Name Required', 'Please enter a person or business name.');
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await addKhataContact(activeUserId, trimmed);
      setName('');
      setModalVisible(false);
      await load();
    } catch (e) {
      console.warn('[KhataScreen] handleAdd error:', e);
      if (Platform.OS === 'web') window.alert('Failed to save contact.');
      else Alert.alert('Error', 'Failed to save contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteKhataContact(activeUserId, deleteId);
      setDeleteId(null);
      await load();
    } catch (e) {
      console.warn('[KhataScreen] delete error:', e);
    }
  };

  const totalBalance = contacts.reduce((sum, c) => sum + getKhataBalance(c), 0);

  const renderContactCard = (item) => {
    const bal = getKhataBalance(item);
    const isPositive = bal >= 0;
    const isZero = bal === 0;
    const initial = (item.name && item.name.length > 0) ? item.name[0].toUpperCase() : '?';
    const entryCount = Array.isArray(item.entries) ? item.entries.length : 0;

    return (
      <TouchableOpacity 
        key={item.id}
        style={s.card} 
        onPress={() => navigation.navigate('KhataContact', { contactId: item.id, userId: activeUserId })} 
        activeOpacity={0.78}
      >
        <View style={s.contactAvatar}>
          <Text style={s.contactInitial}>{initial}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.contactName} numberOfLines={1}>{item.name}</Text>
          <Text style={s.entryCount}>{entryCount} {entryCount === 1 ? 'transaction' : 'transactions'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
          <Text style={[s.balance, { color: isZero ? C.textSecondary : isPositive ? C.success : C.error }]}>
            {isZero ? '' : (isPositive ? '+' : '-')}₹{Math.abs(bal).toLocaleString('en-IN')}
          </Text>
          <Text style={s.balanceLabel}>{isZero ? 'Settled' : (isPositive ? 'will receive' : 'will give')}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setDeleteId(item.id)} 
          style={s.deleteBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={18} color="rgba(239, 68, 68, 0.75)" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      
      {/* Sleek Action Bar */}
      <View style={s.actionBar}>
        <View style={{ flex: 1 }}>
          <Text style={s.actionTitle}>Khata Ledger</Text>
          <Text style={s.actionSub}>Personal & Business accounts</Text>
        </View>
        <TouchableOpacity 
          style={s.addBtn} 
          onPress={() => setModalVisible(true)}
          activeOpacity={0.82}
        >
          <UserPlus size={15} color="#000000" strokeWidth={2.4} style={{ marginRight: 6 }} />
          <Text style={s.addBtnText}>Add Person</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Total Net Balance Hero Card */}
        <View style={s.totalCard}>
          <Text style={s.totalLabel}>NET BALANCE</Text>
          <Text style={[s.totalAmount, { color: totalBalance === 0 ? C.textSecondary : totalBalance > 0 ? C.success : C.error }]}>
            {totalBalance === 0 ? '' : (totalBalance > 0 ? '+' : '-')}₹{Math.abs(totalBalance).toLocaleString('en-IN')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            {totalBalance === 0 ? (
              <CheckCircle2 size={16} color={C.textSecondary} style={{ marginRight: 6 }} />
            ) : totalBalance > 0 ? (
              <ArrowDownLeft size={16} color={C.success} style={{ marginRight: 6 }} />
            ) : (
              <ArrowUpRight size={16} color={C.error} style={{ marginRight: 6 }} />
            )}
            <Text style={s.totalSub}>
              {totalBalance === 0 ? 'All accounts fully settled' : totalBalance > 0 ? 'Overall you will receive' : 'Overall you will give'}
            </Text>
          </View>
        </View>

        {/* Contacts Section */}
        <View style={{ paddingHorizontal: 16, marginTop: 6 }}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>CONTACTS</Text>
            <View style={s.badgePill}>
              <Text style={s.badgePillText}>{contacts.length}</Text>
            </View>
          </View>

          {contacts.length === 0 ? (
            <View style={s.emptyContainer}>
              <View style={s.emptyIconCircle}>
                <Users size={36} color={C.gold} />
              </View>
              <Text style={s.emptyText}>No contacts added yet</Text>
              <Text style={s.emptySub}>Tap "+ Add Person" above to create your first ledger entry.</Text>
            </View>
          ) : (
            contacts.map(renderContactCard)
          )}
        </View>

        <SecurityFooter style={{ marginTop: 36 }} />
      </ScrollView>

      {/* Add Contact Modal - Non-freezing, Clean Overlay */}
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={s.modalIconWrap}>
                  <UserPlus size={18} color={C.gold} />
                </View>
                <Text style={s.modalTitle}>Add Contact</Text>
              </View>
              <TouchableOpacity 
                onPress={() => { if (!saving) setModalVisible(false); }}
                style={{ padding: 6 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={s.label}>PERSON OR BUSINESS NAME *</Text>
            <TextInput 
              style={s.input} 
              placeholderTextColor={C.textMuted} 
              value={name} 
              onChangeText={setName} 
              placeholder="e.g. Rahul Sharma" 
              editable={!saving}
            />

            <TouchableOpacity 
              style={[s.saveBtn, saving && { opacity: 0.7 }]} 
              onPress={handleAdd}
              disabled={saving}
              activeOpacity={0.82}
            >
              <Text style={s.saveBtnText}>{saving ? 'Saving Contact...' : 'Save Contact'}</Text>
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
            <Text style={s.alertTitle}>Delete Contact</Text>
            <Text style={s.alertMessage}>Are you sure you want to permanently delete this contact and all their ledger entries?</Text>
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
  actionBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingVertical: 14, 
    backgroundColor: '#0A0E17',
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255, 255, 255, 0.06)' 
  },
  actionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  actionSub: { color: C.textSecondary, fontSize: 12, marginTop: 2 },
  addBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.gold, 
    paddingHorizontal: 16, 
    paddingVertical: 9, 
    borderRadius: 12, 
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnText: { color: '#000000', fontWeight: '800', fontSize: 13 },
  scrollContent: { paddingBottom: 100 },
  totalCard: { 
    margin: 16, 
    padding: 22, 
    borderRadius: 20, 
    backgroundColor: 'rgba(20, 16, 10, 0.94)', 
    borderWidth: 1.5, 
    borderColor: 'rgba(240, 165, 0, 0.45)', 
    shadowColor: C.gold, 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, 
    shadowRadius: 10, 
    elevation: 4,
    alignItems: 'center' 
  },
  totalLabel: { color: '#8E8E93', fontSize: 11, letterSpacing: 1.8, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 },
  totalAmount: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  totalSub: { color: 'rgba(255, 255, 255, 0.75)', fontSize: 13, fontWeight: '500' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { color: '#8E8E93', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.8 },
  badgePill: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgePillText: { color: '#8E8E93', fontSize: 11, fontWeight: '700' },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(18, 22, 34, 0.85)', 
    padding: 14, 
    borderRadius: 16, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.07)',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, 
    shadowRadius: 6, 
    elevation: 2,
  },
  contactAvatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 13, 
    backgroundColor: 'rgba(240, 165, 0, 0.15)', 
    borderWidth: 1, 
    borderColor: 'rgba(240, 165, 0, 0.35)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  contactInitial: { color: C.gold, fontSize: 18, fontWeight: '800' },
  contactName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  entryCount: { color: C.textMuted, fontSize: 12, marginTop: 2 },
  balance: { fontSize: 15, fontWeight: '800' },
  balanceLabel: { color: C.textSecondary, fontSize: 11, marginTop: 2 },
  deleteBtn: { padding: 8, marginLeft: 2 },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(240, 165, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: C.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 32, lineHeight: 18 },
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
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalIconWrap: { width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(240, 165, 0, 0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  modalTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  label: { color: '#8E8E93', marginBottom: 8, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  input: { 
    backgroundColor: 'rgba(255, 255, 255, 0.06)', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.12)', 
    borderRadius: 14, 
    color: '#FFFFFF', 
    paddingHorizontal: 16, 
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 22, 
    outlineStyle: 'none' 
  },
  saveBtn: { 
    backgroundColor: C.gold, 
    paddingVertical: 15, 
    borderRadius: 14, 
    alignItems: 'center', 
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: { color: '#000000', fontWeight: '800', fontSize: 15 },
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
