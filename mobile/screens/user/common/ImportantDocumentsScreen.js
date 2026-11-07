import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { getDocuments, addDocument, updateDocument, deleteDocument } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { FileText, Trash2, Plus, X } from 'lucide-react-native';

export default function ImportantDocumentsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id;
  const [documents, setDocuments] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  // Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Aadhaar');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  const categories = ['All', 'Aadhaar', 'PAN', 'Passport', 'Voter ID', 'Driving License', 'Other'];

  useEffect(() => {
    if (userId) loadDocuments();
  }, [userId]);

  const loadDocuments = async () => {
    try {
      const data = await getDocuments(userId);
      setDocuments(data || []);
    } catch (e) {
      setDocuments([]);
    }
  };

  const resetForm = () => {
    setName(''); setCategory('Aadhaar'); setDocumentNumber(''); setIssueDate(''); setExpiryDate(''); setNotes('');
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const newDoc = { name, category, issueDate, expiryDate, documentNumber, notes, updatedAt: new Date().toISOString(), id: Date.now().toString() };
    await addDocument(userId, newDoc);
    setIsModalVisible(false);
    resetForm();
    loadDocuments();
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    await deleteDocument(userId, deleteItemId);
    setDeleteItemId(null);
    loadDocuments();
  };

  const filteredDocs = activeCategory === 'All' ? documents : documents.filter(d => d.category === activeCategory);

  return (
    <SafeAreaView style={styles.container}>
      <ParticleBackground />

      <View style={{height: 60}}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {categories.map(cat => (
            <TouchableOpacity key={cat} style={[styles.catBtn, activeCategory === cat && styles.catBtnActive]} onPress={() => setActiveCategory(cat)}>
              <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredDocs}
        keyExtractor={i => i.id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<SecurityFooter style={{marginTop: 24}} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FileText size={48} color={C.textMuted} style={{marginBottom: 12}} />
            <Text style={styles.emptyText}>No documents added yet.</Text>
            <Text style={styles.emptySub}>Tap '+' to securely add your document details.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleWrap}>
                <FileText size={20} color={C.gold} style={{marginRight: 10}} />
                <View>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardCat}>{item.category}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setDeleteItemId(item.id)} style={{padding: 4}}>
                <Trash2 size={18} color={C.error} />
              </TouchableOpacity>
            </View>
            {item.documentNumber ? <Text style={styles.docNum}>{item.documentNumber}</Text> : null}
            <View style={styles.cardFooter}>
              {item.issueDate ? <Text style={styles.dateText}>Issued: {item.issueDate}</Text> : <Text />}
              {item.expiryDate ? <Text style={styles.dateText}>Exp: {item.expiryDate}</Text> : <Text />}
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
              <Text style={styles.modalTitle}>Add Document</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}><X size={24} color={C.textSecondary}/></TouchableOpacity>
            </View>
            <ScrollView style={{maxHeight: '80%'}}>
              <Text style={styles.label}>Document Name *</Text>
              <TextInput style={styles.input} placeholderTextColor={C.textMuted} value={name} onChangeText={setName} placeholder="e.g. My Aadhaar" />
              
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexDirection: 'row', marginBottom: 16}}>
                {categories.filter(c=>c!=='All').map(c => (
                  <TouchableOpacity key={c} style={[styles.pill, category === c && styles.pillActive]} onPress={() => setCategory(c)}>
                    <Text style={[styles.pillText, category === c && styles.pillTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Document Number</Text>
              <TextInput style={styles.input} placeholderTextColor={C.textMuted} value={documentNumber} onChangeText={setDocumentNumber} placeholder="Optional" />
              
              <View style={{flexDirection: 'row', gap: 12}}>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>Issue Date</Text>
                  <TextInput style={styles.input} placeholderTextColor={C.textMuted} value={issueDate} onChangeText={setIssueDate} placeholder="YYYY-MM-DD" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>Expiry Date</Text>
                  <TextInput style={styles.input} placeholderTextColor={C.textMuted} value={expiryDate} onChangeText={setExpiryDate} placeholder="YYYY-MM-DD" />
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
              <View style={{height: 20}} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!deleteItemId} animationType="fade" transparent>
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Delete Document</Text>
            <Text style={styles.alertMessage}>Are you sure you want to delete this document?</Text>
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
  catScroll: { paddingHorizontal: 16, alignItems: 'center' },
  catBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10, borderWidth: 1, borderColor: C.border },
  catBtnActive: { backgroundColor: C.goldDim, borderColor: C.border },
  catText: { color: C.textSecondary, fontWeight: '600' },
  catTextActive: { color: C.gold, fontWeight: '800' },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyText: { color: C.white, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySub: { color: C.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitleWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardTitle: { color: C.white, fontSize: 16, fontWeight: '800' },
  cardCat: { color: C.textMuted, fontSize: 12, marginTop: 2 },
  docNum: { color: C.gold, fontSize: 15, letterSpacing: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  dateText: { color: C.textSecondary, fontSize: 12 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: C.gold, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8, boxShadow: '0px 4px 15px rgba(240, 165, 0, 0.4)' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: C.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: C.white, fontSize: 20, fontWeight: '800' },
  label: { color: C.textSecondary, marginBottom: 8, fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.white, padding: 14, marginBottom: 20, outlineStyle: 'none' },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10 },
  pillActive: { backgroundColor: C.goldDim, borderColor: C.border },
  pillText: { color: C.textSecondary, fontWeight: '600' },
  pillTextActive: { color: C.gold, fontWeight: '800' },
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