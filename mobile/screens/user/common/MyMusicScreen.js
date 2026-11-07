import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { getMusic, addMusic, updateMusic, deleteMusic } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { Music, Search, Trash2, Plus, X } from 'lucide-react-native';

export default function MyMusicScreen() {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id || user?.id;
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState('');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  
  const [form, setForm] = useState({ name: '', artist: '', album: '', category: '', note: '' });
  const [editItem, setEditItem] = useState(null);

  useEffect(() => { if (userId) load(); }, [userId]);
  const load = async () => { try { setSongs(await getMusic(userId) || []); } catch { setSongs([]); } };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editItem) {
      await updateMusic(userId, editItem.id, form);
    } else {
      await addMusic(userId, form);
    }
    setIsModalVisible(false); setEditItem(null); setForm({ name: '', artist: '', album: '', category: '', note: '' }); load();
  };

  const filtered = songs.filter(n => (n.name+n.artist+n.album+n.category).toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={s.container}>
      <ParticleBackground />
      <View style={s.searchWrap}><Search size={20} color={C.textMuted} style={{marginRight:8}} /><TextInput style={s.searchInput} placeholderTextColor={C.textMuted} placeholder="Search songs, artists..." value={search} onChangeText={setSearch} /></View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={s.listContent}
        ListFooterComponent={<SecurityFooter style={{marginTop: 24}}/>}
        ListEmptyComponent={<View style={s.empty}><Music size={48} color={C.textMuted} /><Text style={s.emptyT}>No Music</Text><Text style={s.emptyS}>Tap '+' to save your favourite songs</Text></View>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <TouchableOpacity style={{flex: 1}} onPress={() => {setEditItem(item); setForm(item); setIsModalVisible(true);}}>
              <Text style={s.title}>{item.name}</Text>
              {item.artist ? <Text style={s.artist}>{item.artist}</Text> : null}
              <View style={{flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap'}}>
                {item.category ? <Text style={s.badge}>{item.category}</Text> : null}
                {item.album ? <Text style={s.badge2}>{item.album}</Text> : null}
              </View>
              {item.note ? <Text style={s.note}>{item.note}</Text> : null}
            </TouchableOpacity>
            <View style={s.actions}>
              <TouchableOpacity onPress={() => setDeleteItemId(item.id)} style={s.actionBtn}><Trash2 size={20} color={C.error}/></TouchableOpacity>
            </View>
          </View>
        )}
      />
      <TouchableOpacity style={s.fab} onPress={() => {setEditItem(null); setForm({name:'', artist:'', album:'', category:'', note:''}); setIsModalVisible(true);}}>
        <Plus size={24} color="#000" />
      </TouchableOpacity>
      
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editItem ? 'Edit Song' : 'Add Song'}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}><X size={24} color={C.textSecondary}/></TouchableOpacity>
            </View>
            <TextInput style={s.input} placeholderTextColor={C.textMuted} placeholder="Song Name *" value={form.name} onChangeText={t => setForm({...form, name: t})} />
            <TextInput style={s.input} placeholderTextColor={C.textMuted} placeholder="Artist / Singer" value={form.artist} onChangeText={t => setForm({...form, artist: t})} />
            <View style={{flexDirection:'row', gap: 10}}>
              <TextInput style={[s.input, {flex: 1}]} placeholderTextColor={C.textMuted} placeholder="Album" value={form.album} onChangeText={t => setForm({...form, album: t})} />
              <TextInput style={[s.input, {flex: 1}]} placeholderTextColor={C.textMuted} placeholder="Category" value={form.category} onChangeText={t => setForm({...form, category: t})} />
            </View>
            <TextInput style={s.input} placeholderTextColor={C.textMuted} placeholder="Personal Note" value={form.note} onChangeText={t => setForm({...form, note: t})} />
            <TouchableOpacity style={[s.saveBtn, !form.name && {opacity:0.5}]} onPress={handleSave}><Text style={s.saveBtnText}>Save</Text></TouchableOpacity>
            <View style={{height: 20}} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!deleteItemId} animationType="fade" transparent>
        <View style={s.alertOverlay}>
          <View style={s.alertBox}>
            <Text style={s.alertTitle}>Delete Song</Text>
            <Text style={s.alertMessage}>Are you sure you want to remove this song?</Text>
            <View style={s.alertBtns}>
              <TouchableOpacity style={s.alertCancel} onPress={() => setDeleteItemId(null)}><Text style={s.alertCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={s.alertDelete} onPress={async () => { await deleteMusic(userId, deleteItemId); setDeleteItemId(null); load(); }}><Text style={s.alertDeleteText}>Delete</Text></TouchableOpacity>
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
  artist: { color: C.textSecondary, fontSize: 13, marginTop: 4 },
  badge: { color: C.gold, fontSize: 11, fontWeight: 'bold', backgroundColor: 'rgba(240, 165, 0, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badge2: { color: '#AB47BC', fontSize: 11, fontWeight: 'bold', backgroundColor: 'rgba(171,71,188,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  note: { color: C.textMuted, fontSize: 12, marginTop: 8, fontStyle: 'italic' },
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
