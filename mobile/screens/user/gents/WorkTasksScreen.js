import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { isValidDate, toStorageDate, toDisplayDate, formatDateInput, isValidTime, formatTimeInput } from '../../../utils/dateFormatter';
import { getWorkTasks, addWorkTask, updateWorkTask, deleteWorkTask } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import ParticleBackground from '../../../components/ParticleBackground';
import { C } from '../../../constants/theme';
import { CheckSquare, Plus, ChevronLeft, Trash2, Clock, Calendar as CalIcon, Edit3, AlertCircle } from 'lucide-react-native';

export default function WorkTasksScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id || user?.id;
  
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('All');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const todayDisplay = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  })();
  const [date, setDate] = useState(todayDisplay);
  const [time, setTime] = useState('');
  const [ampm, setAmpm] = useState('AM');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending');
  
  // Delete Modal State
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => setTasks(await getWorkTasks(userId) || []);

  const openAddModal = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setDate(toDisplayDate(new Date().toISOString().split('T')[0]));
    setTime('');
    setAmpm('AM');
    setPriority('Medium');
    setStatus('Pending');
    setModalVisible(true);
  };

  const openEditModal = (task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setDate(toDisplayDate(task.date));
    if (task.time) {
      const parts = task.time.split(' ');
      setTime(parts[0] || '');
      setAmpm(parts[1] || 'AM');
    } else {
      setTime('');
      setAmpm('AM');
    }
    setPriority(task.priority || 'Medium');
    setStatus(task.status || 'Pending');
    setModalVisible(true);
  };

  const handleSave = async () => {
    const alertMsg = (msg) => {
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Validation', msg);
    };
    if (!title.trim()) return alertMsg('Task Title is required.');

    
    if (date && !isValidDate(date)) return alertMsg('Please enter a valid date (DD/MM/YYYY).');
    const fullTime = time.trim() ? `${time.trim()} ${ampm}` : '';
    if (fullTime && !isValidTime(fullTime)) return alertMsg('Please enter a valid time (HH:MM).');

    const payload = { title: title.trim(), description: description.trim(), date: toStorageDate(date), time: fullTime, priority, status };
    
    if (editingId) {
      await updateWorkTask(userId, editingId, payload);
    } else {
      await addWorkTask(userId, payload);
    }
    
    setModalVisible(false);
    load();
  };

  const toggleStatus = async (task) => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    await updateWorkTask(userId, task.id, { status: newStatus });
    load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteWorkTask(userId, deleteId);
    setDeleteId(null);
    load();
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'All') return true;
    return t.status === filter;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const renderItem = ({ item }) => {
    const isCompleted = item.status === 'Completed';
    const pColor = item.priority === 'High' ? C.error : (item.priority === 'Medium' ? C.gold : '#66BB6A');
    
    return (
      <View style={[s.card, isCompleted && s.cardCompleted]}>
        <TouchableOpacity style={s.checkboxWrap} onPress={() => toggleStatus(item)}>
          <View style={[s.checkbox, isCompleted && s.checkboxChecked]}>
            {isCompleted && <CheckSquare size={16} color="#000" />}
          </View>
        </TouchableOpacity>
        
        <View style={s.cardBody}>
          <Text style={[s.cardTitle, isCompleted && s.textCompleted]}>{item.title}</Text>
          {item.description ? <Text style={[s.cardDesc, isCompleted && s.textCompleted]}>{item.description}</Text> : null}
          
          <View style={s.metaRow}>
            {item.date ? <View style={s.metaItem}><CalIcon size={12} color={C.textMuted} /><Text style={s.metaText}>{toDisplayDate(item.date)}</Text></View> : null}
            {item.time ? <View style={s.metaItem}><Clock size={12} color={C.textMuted} /><Text style={s.metaText}>{item.time}</Text></View> : null}
            <View style={[s.priorityBadge, { backgroundColor: pColor + '22' }]}>
              <Text style={{ color: pColor, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>{item.priority}</Text>
            </View>
          </View>
        </View>
        
        <View style={s.cardActions}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={{ padding: 4 }}><Edit3 size={18} color={C.textSecondary} /></TouchableOpacity>
          <TouchableOpacity onPress={() => setDeleteId(item.id)} style={{ padding: 4 }}><Trash2 size={18} color={C.error} /></TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      <View style={s.header}>
        <View style={{ width: 60 }} />
        <Text style={s.headerTitle}>Work Tasks</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={s.filters}>
        {['All', 'Pending', 'Completed'].map(f => (
          <TouchableOpacity key={f} style={[s.filterTab, filter === f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter === f && { color: C.gold }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={s.empty}>
            <CheckSquare size={48} color={C.textMuted} />
            <Text style={s.emptyText}>No work tasks yet</Text>
            <Text style={s.emptySub}>Tap "+ Add" to create your first work task.</Text>
          </View>
        }
        ListFooterComponent={<SecurityFooter style={{ marginTop: 24 }} />}
      />

      <TouchableOpacity style={s.fab} onPress={openAddModal}>
        <Plus size={24} color="#000" />
      </TouchableOpacity>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', maxHeight: '90%' }}>
            <View style={s.modal}>
              <Text style={s.modalTitle}>{editingId ? 'Edit Work Task' : 'Add Work Task'}</Text>
              
              <Text style={s.label}>TASK TITLE *</Text>
              <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="e.g. Finish Q3 Report" placeholderTextColor={C.textMuted} autoFocus />
              
              <Text style={s.label}>DESCRIPTION (OPTIONAL)</Text>
              <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Task details..." placeholderTextColor={C.textMuted} multiline />
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>DATE</Text>
                  <TextInput style={s.input} value={date} onChangeText={(t) => setDate(formatDateInput(t))} placeholder="DD/MM/YYYY" placeholderTextColor={C.textMuted} keyboardType="numeric" maxLength={10} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>TIME (OPTIONAL)</Text>
                  <View style={{flexDirection: 'row', gap: 8}}>
                    <TextInput style={[s.input, {flex: 1}]} value={time} onChangeText={(t) => setTime(formatTimeInput(t))} placeholder="HH:MM" placeholderTextColor={C.textMuted} keyboardType="numeric" maxLength={5} />
                    <TouchableOpacity style={[s.input, {justifyContent:'center', paddingHorizontal: 12, backgroundColor: ampm==='AM'?'rgba(240, 165, 0, 0.1)':'#222'}]} onPress={()=>setAmpm('AM')}><Text style={{color: ampm==='AM'?C.gold:C.textMuted, fontWeight:'700'}}>AM</Text></TouchableOpacity>
                    <TouchableOpacity style={[s.input, {justifyContent:'center', paddingHorizontal: 12, backgroundColor: ampm==='PM'?'rgba(240, 165, 0, 0.1)':'#222'}]} onPress={()=>setAmpm('PM')}><Text style={{color: ampm==='PM'?C.gold:C.textMuted, fontWeight:'700'}}>PM</Text></TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={s.label}>PRIORITY</Text>
              <View style={s.prioGrid}>
                {['Low', 'Medium', 'High'].map(p => (
                  <TouchableOpacity key={p} style={[s.prioBtn, priority === p && { borderColor: C.gold, backgroundColor: 'rgba(240, 165, 0, 0.1)' }]} onPress={() => setPriority(p)}>
                    <Text style={[s.prioBtnText, priority === p && { color: C.gold }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleSave}><Text style={s.saveText}>Save Task</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteId} animationType="fade" transparent>
        <View style={s.alertOverlay}>
          <View style={s.alertBox}>
            <Text style={s.alertTitle}>Delete Task?</Text>
            <Text style={s.alertMessage}>This work task will be permanently deleted.</Text>
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
  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.border },
  filterActive: { backgroundColor: C.goldDim, borderColor: C.border },
  filterText: { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100 },
  
  card: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  cardCompleted: { opacity: 0.6 },
  checkboxWrap: { marginRight: 16, paddingTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: C.textMuted, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: C.gold, borderColor: C.gold },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.white, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: C.textSecondary, marginBottom: 8, lineHeight: 18 },
  textCompleted: { textDecorationLine: 'line-through', color: C.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: C.textMuted },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  cardActions: { justifyContent: 'space-between', alignItems: 'flex-end', paddingLeft: 12 },

  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: C.gold, justifyContent: 'center', alignItems: 'center',    height: 2 },  
  
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '800', color: C.white },
  emptySub: { fontSize: 14, color: C.textMuted },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, fontSize: 15, color: C.white, outlineStyle: 'none' },
  
  prioGrid: { flexDirection: 'row', gap: 12 },
  prioBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  prioBtnText: { color: C.textSecondary, fontWeight: '600', fontSize: 13 },
  
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
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
