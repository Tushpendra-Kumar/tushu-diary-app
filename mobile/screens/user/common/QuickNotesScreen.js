import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { getNotes, addNote, updateNote, deleteNote } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { FileEdit, Search, Trash2, Plus, X } from 'lucide-react-native';

export default function QuickNotesScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id || user?.id;
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  
  const [content, setContent] = useState('');
  const [editNote, setEditNote] = useState(null);

  useEffect(() => {
    if (userId) load();
  }, [userId]);

  const load = async () => {
    try {
      const data = await getNotes(userId);
      setNotes(data || []);
    } catch { setNotes([]); }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    if (editNote) {
      await updateNote(userId, editNote.id, { content: content.trim() });
    } else {
      await addNote(userId, { content: content.trim(), id: Date.now().toString(), createdAt: new Date().toISOString() });
    }
    setIsModalVisible(false);
    setContent('');
    setEditNote(null);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    await deleteNote(userId, deleteItemId);
    setDeleteItemId(null);
    load();
  };

  const openEdit = (n) => {
    setEditNote(n);
    setContent(n.content);
    setIsModalVisible(true);
  };

  const openAdd = () => {
    setEditNote(null);
    setContent('');
    setIsModalVisible(true);
  };

  const filteredNotes = notes.filter(n => n.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={styles.container}>
      <ParticleBackground />

      <View style={styles.searchWrap}>
        <Search size={20} color={C.textMuted} style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput} 
          placeholderTextColor={C.textMuted} 
          placeholder="Search notes..." 
          value={search} 
          onChangeText={setSearch} 
        />
      </View>

      <FlatList
        data={filteredNotes}
        keyExtractor={i => i.id || Math.random().toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={{gap: 12}}
        ListFooterComponent={<SecurityFooter style={{marginTop: 24}}/>}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FileEdit size={48} color={C.textMuted} style={{marginBottom: 12}} />
            <Text style={styles.emptyText}>No notes yet</Text>
            <Text style={styles.emptySub}>Tap '+' to write your first note</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.8}>
            <Text style={styles.noteContent} numberOfLines={5}>{item.content}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.noteDate}>{new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
              <TouchableOpacity onPress={() => setDeleteItemId(item.id)} style={{padding: 4}}>
                <Trash2 size={16} color={C.error} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Plus size={24} color="#000" />
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editNote ? 'Edit Note' : 'New Note'}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}><X size={24} color={C.textSecondary}/></TouchableOpacity>
            </View>
            <TextInput 
              style={styles.textArea} 
              placeholderTextColor={C.textMuted} 
              value={content} 
              onChangeText={setContent} 
              placeholder="Start typing..." 
              multiline 
              autoFocus 
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Note</Text>
            </TouchableOpacity>
            <View style={{height: 20}} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!deleteItemId} animationType="fade" transparent>
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Delete Note</Text>
            <Text style={styles.alertMessage}>Are you sure you want to delete this note?</Text>
            <View style={styles.alertBtns}>
              <TouchableOpacity style={styles.alertCancel} onPress={() => setDeleteItemId(null)}><Text style={styles.alertCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.alertDelete} onPress={confirmDelete}><Text style={styles.alertDeleteText}>Delete</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.input, margin: 16, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: C.white, paddingVertical: 12, outlineStyle: 'none' },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyText: { color: C.white, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySub: { color: C.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card: { flex: 1, backgroundColor: C.goldDim, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, minHeight: 120, justifyContent: 'space-between' },
  noteContent: { color: C.white, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 8 },
  noteDate: { color: C.textSecondary, fontSize: 11, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: C.gold, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8, boxShadow: '0px 4px 15px rgba(240, 165, 0, 0.4)' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: C.border, minHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: C.white, fontSize: 20, fontWeight: '800' },
  textArea: { flex: 1, backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.white, padding: 16, textAlignVertical: 'top', fontSize: 16, marginBottom: 20, outlineStyle: 'none', minHeight: 200 },
  saveBtn: { padding: 16, borderRadius: 12, backgroundColor: C.gold, alignItems: 'center' },
  saveBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertBox: { backgroundColor: '#111', width: '100%', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border },
  alertTitle: { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 12 },
  alertMessage: { fontSize: 14, color: C.textSecondary, marginBottom: 20, lineHeight: 22 },
  alertBtns: { flexDirection: 'row', gap: 12 },
  alertCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  alertCancelText: { color: C.textSecondary, fontWeight: '600' },
  alertDelete: { flex: 1, backgroundColor: C.error, padding: 14, borderRadius: 12, alignItems: 'center' },
  alertDeleteText: { color: '#FFF', fontWeight: '800' }
});