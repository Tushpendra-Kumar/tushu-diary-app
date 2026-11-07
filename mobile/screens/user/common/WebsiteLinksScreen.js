import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { getWebsiteLinks, addWebsiteLink, updateWebsiteLink, deleteWebsiteLink } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { Link, Search, Trash2, Plus, X, ExternalLink } from 'lucide-react-native';

export default function WebsiteLinksScreen() {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id || user?.id;
  const [links, setLinks] = useState([]);
  const [search, setSearch] = useState('');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  
  const [form, setForm] = useState({ name: '', url: '', description: '', category: '' });
  const [editItem, setEditItem] = useState(null);

  useEffect(() => { if (userId) load(); }, [userId]);
  const load = async () => { try { setLinks(await getWebsiteLinks(userId) || []); } catch { setLinks([]); } };

  const handleSave = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    let finalUrl = form.url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    const data = { ...form, url: finalUrl };
    if (editItem) {
      await updateWebsiteLink(userId, editItem.id, data);
    } else {
      await addWebsiteLink(userId, data);
    }
    setIsModalVisible(false); setEditItem(null); setForm({ name: '', url: '', description: '', category: '' }); load();
  };

  const openLink = (url) => Linking.openURL(url).catch(() => alert('Could not open the link'));
  const filtered = links.filter(n => (n.name+n.url+n.description+n.category).toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={s.container}>
      <ParticleBackground />
      <View style={s.searchWrap}><Search size={20} color={C.textMuted} style={{marginRight:8}} /><TextInput style={s.searchInput} placeholderTextColor={C.textMuted} placeholder="Search websites..." value={search} onChangeText={setSearch} /></View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={s.listContent}
        ListFooterComponent={<SecurityFooter style={{marginTop: 24}}/>}
        ListEmptyComponent={<View style={s.empty}><Link size={48} color={C.textMuted} /><Text style={s.emptyT}>No Links</Text><Text style={s.emptyS}>Tap '+' to save a website</Text></View>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <TouchableOpacity style={{flex: 1}} onPress={() => {setEditItem(item); setForm(item); setIsModalVisible(true);}}>
              <Text style={s.title}>{item.name}</Text>
              {item.category ? <Text style={s.cat}>{item.category}</Text> : null}
              {item.description ? <Text style={s.desc}>{item.description}</Text> : null}
              <Text style={s.url} numberOfLines={1}>{item.url}</Text>
            </TouchableOpacity>
            <View style={s.actions}>
              <TouchableOpacity onPress={() => openLink(item.url)} style={s.actionBtn}><ExternalLink size={20} color={C.gold}/></TouchableOpacity>
              <TouchableOpacity onPress={() => setDeleteItemId(item.id)} style={s.actionBtn}><Trash2 size={20} color={C.error}/></TouchableOpacity>
            </View>
          </View>
        )}
      />
      <TouchableOpacity style={s.fab} onPress={() => {setEditItem(null); setForm({name:'', url:'', description:'', category:''}); setIsModalVisible(true);}}>
        <Plus size={24} color="#000" />
      </TouchableOpacity>
      
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editItem ? 'Edit Link' : 'Add Link'}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}><X size={24} color={C.textSecondary}/></TouchableOpacity>
            </View>
            <TextInput style={s.input} placeholderTextColor={C.textMuted} placeholder="Website Name *" value={form.name} onChangeText={t => setForm({...form, name: t})} />
            <TextInput style={s.input} placeholderTextColor={C.textMuted} placeholder="URL (e.g., example.com) *" value={form.url} onChangeText={t => setForm({...form, url: t})} autoCapitalize="none" keyboardType="url" />
            <TextInput style={s.input} placeholderTextColor={C.textMuted} placeholder="Description/Purpose" value={form.description} onChangeText={t => setForm({...form, description: t})} />
            <TextInput style={s.input} placeholderTextColor={C.textMuted} placeholder="Category" value={form.category} onChangeText={t => setForm({...form, category: t})} />
            <TouchableOpacity style={[s.saveBtn, (!form.name || !form.url) && {opacity:0.5}]} onPress={handleSave}><Text style={s.saveBtnText}>Save</Text></TouchableOpacity>
            <View style={{height: 20}} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={!!deleteItemId} animationType="fade" transparent>
        <View style={s.alertOverlay}>
          <View style={s.alertBox}>
            <Text style={s.alertTitle}>Delete Link</Text>
            <Text style={s.alertMessage}>Are you sure you want to delete this website?</Text>
            <View style={s.alertBtns}>
              <TouchableOpacity style={s.alertCancel} onPress={() => setDeleteItemId(null)}><Text style={s.alertCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={s.alertDelete} onPress={async () => { await deleteWebsiteLink(userId, deleteItemId); setDeleteItemId(null); load(); }}><Text style={s.alertDeleteText}>Delete</Text></TouchableOpacity>
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
  desc: { color: C.textSecondary, fontSize: 13, marginTop: 4 },
  cat: { color: C.gold, fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  url: { color: '#29B6F6', fontSize: 12, marginTop: 6, opacity: 0.8 },
  actions: { flexDirection: 'row', marginLeft: 10 },
  actionBtn: { padding: 10, marginLeft: 5, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: C.gold, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8, boxShadow: '0px 4px 15px rgba(240, 165, 0, 0.4)' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: C.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, modalTitle: { color: C.white, fontSize: 20, fontWeight: '800' },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.white, padding: 16, fontSize: 16, marginBottom: 12, outlineStyle: 'none' },
  saveBtn: { padding: 16, borderRadius: 12, backgroundColor: C.gold, alignItems: 'center', marginTop: 10 }, saveBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertBox: { backgroundColor: '#111', width: '100%', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border },
  alertTitle: { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 12 }, alertMessage: { fontSize: 14, color: C.textSecondary, marginBottom: 20, lineHeight: 22 },
  alertBtns: { flexDirection: 'row', gap: 12 }, alertCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' }, alertCancelText: { color: C.textSecondary, fontWeight: '600' },
  alertDelete: { flex: 1, backgroundColor: C.error, padding: 14, borderRadius: 12, alignItems: 'center' }, alertDeleteText: { color: '#FFF', fontWeight: '800' }
});
