import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { getVaultCredentials, addVaultCredential, updateVaultCredential, deleteVaultCredential } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { Lock, Search, Trash2, Plus, X, Eye, EyeOff } from 'lucide-react-native';

export default function PasswordVaultScreen() {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id || user?.id;
  const [credentials, setCredentials] = useState([]);
  const [search, setSearch] = useState('');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  
  const [form, setForm] = useState({ service: '', username: '', password: '', note: '' });
  const [editItem, setEditItem] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});

  useEffect(() => { if (userId) load(); }, [userId]);
  const load = async () => { try { setCredentials(await getVaultCredentials(userId) || []); } catch { setCredentials([]); } };

  const handleSave = async () => {
    if (!form.service.trim() || !form.password.trim()) return;
    if (editItem) {
      await updateVaultCredential(userId, editItem.id, form);
    } else {
      await addVaultCredential(userId, form);
    }
    setIsModalVisible(false); setEditItem(null); setForm({ service: '', username: '', password: '', note: '' }); load();
  };

  const toggleVisibility = (id) => setVisiblePasswords(p => ({...p, [id]: !p[id]}));

  const filtered = credentials.filter(n => (n.service+n.username).toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={s.container}>
      <ParticleBackground />
      <View style={s.searchWrap}><Search size={20} color={C.textMuted} style={{marginRight:8}} /><TextInput style={s.searchInput} placeholderTextColor={C.textMuted} placeholder="Search services..." value={search} onChangeText={setSearch} /></View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={s.listContent}
        ListFooterComponent={<SecurityFooter style={{marginTop: 24}}/>}
        ListEmptyComponent={<View style={s.empty}><Lock size={48} color={C.textMuted} /><Text style={s.emptyT}>Vault is Empty</Text><Text style={s.emptyS}>Tap '+' to save credentials securely</Text></View>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <TouchableOpacity style={{flex: 1}} onPress={() => {setEditItem(item); setForm(item); setIsModalVisible(true);}}>
              <Text style={s.title}>{item.service}</Text>
              {item.username ? <Text style={s.user}>{item.username}</Text> : null}
              <View style={s.pwdWrap}>
                <Text style={s.pwd}>{visiblePasswords[item.id] ? item.password : '••••••••••••'}</Text>
                <TouchableOpacity onPress={() => toggleVisibility(item.id)} style={{padding: 5}}>
                  {visiblePasswords[item.id] ? <EyeOff size={16} color={C.textMuted}/> : <Eye size={16} color={C.textMuted}/>}
                </TouchableOpacity>
              </View>
              {item.note ? <Text style={s.note}>{item.note}</Text> : null}
            </TouchableOpacity>
            <View style={s.actions}>
              <TouchableOpacity onPress={() => setDeleteItemId(item.id)} style={s.actionBtn}><Trash2 size={20} color={C.error}/></TouchableOpacity>
            </View>
          </View>
        )}
      />
      <TouchableOpacity style={s.fab} onPress={() => {setEditItem(null); setForm({service:'', username:'', password:'', note:''}); setIsModalVisible(true);}}>
        <Plus size={24} color="#000" />
      </TouchableOpacity>
      
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editItem ? 'Edit Credential' : 'Add Credential'}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}><X size={24} color={C.textSecondary}/></TouchableOpacity>
            </View>
            <TextInput style={s.input} placeholderTextColor={C.textMuted} placeholder="Service/Website Name *" value={form.service} onChangeText={t => setForm({...form, service: t})} />
            <TextInput style={s.input} placeholderTextColor={C.textMuted} placeholder="Username / Email" value={form.username} onChangeText={t => setForm({...form, username: t})} autoCapitalize="none" />
            <TextInput style={s.input} placeholderTextColor={C.textMuted} placeholder="Password *" value={form.password} onChangeText={t => setForm({...form, password: t})} secureTextEntry={!visiblePasswords['modal']} />
            <TouchableOpacity onPress={() => setVisiblePasswords(p => ({...p, 'modal': !p['modal']}))} style={s.modalEye}>
              {visiblePasswords['modal'] ? <EyeOff size={20} color={C.textMuted}/> : <Eye size={20} color={C.textMuted}/>}
            </TouchableOpacity>
            <TextInput style={s.input} placeholderTextColor={C.textMuted} placeholder="Notes" value={form.note} onChangeText={t => setForm({...form, note: t})} />
            <TouchableOpacity style={[s.saveBtn, (!form.service || !form.password) && {opacity:0.5}]} onPress={handleSave}><Text style={s.saveBtnText}>Save Securely</Text></TouchableOpacity>
            <View style={{height: 20}} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!deleteItemId} animationType="fade" transparent>
        <View style={s.alertOverlay}>
          <View style={s.alertBox}>
            <Text style={s.alertTitle}>Delete Credential</Text>
            <Text style={s.alertMessage}>Are you sure you want to permanently delete this credential?</Text>
            <View style={s.alertBtns}>
              <TouchableOpacity style={s.alertCancel} onPress={() => setDeleteItemId(null)}><Text style={s.alertCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={s.alertDelete} onPress={async () => { await deleteVaultCredential(userId, deleteItemId); setDeleteItemId(null); load(); }}><Text style={s.alertDeleteText}>Delete</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.input, margin: 16, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  searchInput: { flex: 1, color: C.white, paddingVertical: 12, outlineStyle: 'none' },
  listContent: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 80 }, emptyT: { color: C.white, fontSize: 18, fontWeight: '800', marginVertical: 8 }, emptyS: { color: C.textMuted },
  card: { backgroundColor: C.goldDim, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  title: { color: C.white, fontSize: 16, fontWeight: 'bold' },
  user: { color: C.textSecondary, fontSize: 13, marginTop: 4 },
  pwdWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8 },
  pwd: { color: C.gold, fontSize: 14, fontWeight: '600', marginRight: 10, letterSpacing: 2 },
  note: { color: C.textMuted, fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  actions: { flexDirection: 'row', marginLeft: 10 },
  actionBtn: { padding: 10, marginLeft: 5, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: C.gold, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8, boxShadow: '0px 4px 15px rgba(240, 165, 0, 0.4)' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: C.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, modalTitle: { color: C.white, fontSize: 20, fontWeight: '800' },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.white, padding: 16, fontSize: 16, marginBottom: 12, outlineStyle: 'none' },
  modalEye: { position: 'absolute', right: 40, top: 220, padding: 10 },
  saveBtn: { padding: 16, borderRadius: 12, backgroundColor: C.gold, alignItems: 'center', marginTop: 10 }, saveBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertBox: { backgroundColor: '#111', width: '100%', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border },
  alertTitle: { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 12 }, alertMessage: { fontSize: 14, color: C.textSecondary, marginBottom: 20, lineHeight: 22 },
  alertBtns: { flexDirection: 'row', gap: 12 }, alertCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' }, alertCancelText: { color: C.textSecondary, fontWeight: '600' },
  alertDelete: { flex: 1, backgroundColor: C.error, padding: 14, borderRadius: 12, alignItems: 'center' }, alertDeleteText: { color: '#FFF', fontWeight: '800' }
});
