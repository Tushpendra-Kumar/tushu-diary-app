import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { getFamilyNotices, addFamilyNotice, deleteFamilyNotice } from '../../../services/personalDataService';
import { AuthContext } from '../../../context/AuthContext';
import { C } from '../../../constants/theme';
import SecurityFooter from '../../../components/SecurityFooter';
import ParticleBackground from '../../../components/ParticleBackground';
import { Megaphone, Trash2, Plus, X, Calendar as CalIcon } from 'lucide-react-native';

export default function FamilyNoticeBoardScreen() {
  const { user } = useContext(AuthContext);
  const [notices, setNotices] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getFamilyNotices();
      setNotices(data || []);
    } catch { setNotices([]); }
  };

  const handlePost = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    const payload = { 
      ...form, 
      postedBy: user?.full_name || 'Member', 
      date: new Date().toISOString(), 
      id: Date.now().toString() 
    };
    await addFamilyNotice(payload);
    setIsModalVisible(false);
    setForm({ title: '', content: '' });
    loadData();
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    await deleteFamilyNotice(deleteItemId);
    setDeleteItemId(null);
    loadData();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ParticleBackground />

      <FlatList
        data={notices}
        keyExtractor={i => i.id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<SecurityFooter style={{marginTop: 24}}/>}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Megaphone size={48} color={C.textMuted} style={{marginBottom: 12}} />
            <Text style={styles.emptyText}>No notices posted</Text>
            <Text style={styles.emptySub}>Post a notice to share updates with your family.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleWrap}>
                <Megaphone size={20} color={C.gold} style={{marginRight: 10}} />
                <View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardAuthor}>Posted by {item.postedBy}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setDeleteItemId(item.id)} style={{padding: 4}}>
                <Trash2 size={18} color={C.error} />
              </TouchableOpacity>
            </View>
            <Text style={styles.cardContent}>{item.content}</Text>
            <View style={styles.cardFooter}>
              <CalIcon size={12} color={C.textMuted} style={{marginRight: 4}} />
              <Text style={styles.cardDate}>{new Date(item.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}</Text>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setIsModalVisible(true)}>
        <Plus size={24} color="#000" />
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post Notice</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}><X size={24} color={C.textSecondary}/></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.label}>Title *</Text>
              <TextInput 
                style={styles.input} 
                placeholderTextColor={C.textMuted} 
                value={form.title} 
                onChangeText={t => setForm({...form, title: t})} 
                placeholder="e.g. Family Trip Planning" 
              />
              <Text style={styles.label}>Content *</Text>
              <TextInput 
                style={[styles.input, {height: 120, textAlignVertical: 'top'}]} 
                placeholderTextColor={C.textMuted} 
                value={form.content} 
                onChangeText={t => setForm({...form, content: t})} 
                placeholder="Write your message here..." 
                multiline 
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handlePost}>
                <Text style={styles.saveBtnText}>Post Notice</Text>
              </TouchableOpacity>
              <View style={{height: 20}} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!deleteItemId} animationType="fade" transparent>
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Delete Notice</Text>
            <Text style={styles.alertMessage}>Are you sure you want to delete this notice?</Text>
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
  listContent: { padding: 16, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyText: { color: C.white, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySub: { color: C.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitleWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardTitle: { color: C.white, fontSize: 16, fontWeight: '800' },
  cardAuthor: { color: C.textMuted, fontSize: 12, marginTop: 2 },
  cardContent: { color: C.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 16 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  cardDate: { color: C.textMuted, fontSize: 12 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: C.gold, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8, boxShadow: '0px 4px 15px rgba(240, 165, 0, 0.4)' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: C.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: C.white, fontSize: 20, fontWeight: '800' },
  label: { color: C.textSecondary, marginBottom: 8, fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.white, padding: 14, marginBottom: 20, outlineStyle: 'none' },
  saveBtn: { padding: 16, borderRadius: 12, backgroundColor: C.gold, alignItems: 'center', marginTop: 10 },
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