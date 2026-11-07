import React, { useState, useEffect, useContext } from 'react';
import { ClipboardList, Plus, CheckCircle, Circle, Edit2, Trash2, Calendar as CalIcon } from 'lucide-react-native';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, SafeAreaView, KeyboardAvoidingView,
  Platform, Alert
} from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { getTasks, addTask, updateTask, deleteTask } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';

const PRIORITIES = ['low', 'medium', 'high'];
const PRIORITY_COLORS = { low: '#66BB6A', medium: '#FFA726', high: '#EF5350' };
const FILTERS = ['All', 'Today', 'Pending', 'Done'];

export default function TaskManagerScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id;
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDateDisplay, setDueDateDisplay] = useState(''); // Stores DD-MM-YYYY

  useEffect(() => { load(); }, []);

  const load = async () => {
    const data = await getTasks(userId);
    setTasks(data);
  };

  // Convert YYYY-MM-DD to DD-MM-YYYY for display
  const formatForUI = (isoDate) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return isoDate;
  };

  // Convert DD-MM-YYYY to YYYY-MM-DD for backend
  const formatForBackend = (uiDate) => {
    if (!uiDate) return '';
    const parts = uiDate.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return uiDate;
  };

  const openAdd = () => {
    setEditTask(null);
    setTitle(''); 
    setDescription(''); 
    setPriority('medium'); 
    setDueDateDisplay('');
    setModalVisible(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setTitle(task.title); 
    setDescription(task.description || '');
    setPriority(task.priority || 'medium'); 
    setDueDateDisplay(formatForUI(task.dueDate));
    setModalVisible(true);
  };

  const handleDueDateChange = (text) => {
    const isDeleting = text.length < dueDateDisplay.length;
    let val = text.replace(/[^0-9]/g, '');
    
    let day = '';
    let month = '';
    let year = '';
    
    if (val.length > 0) {
      day = val.substring(0, 2);
      if (day === '00') day = '0';
      else if (day.length === 2 && parseInt(day, 10) > 31) day = day[0];
    }
    
    if (day.length === 2 && val.length > 2) {
      month = val.substring(2, 4);
      if (month === '00') month = '0';
      else if (month.length === 2 && parseInt(month, 10) > 12) month = month[0];
    }
    
    if (month.length === 2 && val.length > 4) {
      year = val.substring(4, 8);
    }
    
    let formatted = day;
    if (day.length === 2) {
      if (month.length > 0) formatted += '-' + month;
      else if (!isDeleting) formatted += '-';
    }
    if (month.length === 2) {
      if (year.length > 0) formatted += '-' + year;
      else if (!isDeleting) formatted += '-';
    }
    
    setDueDateDisplay(formatted);
  };

  const validateDate = (uiDate) => {
    if (!uiDate) return true;
    if (uiDate.length !== 10) return false;
    
    const parts = uiDate.split('-');
    if (parts.length !== 3) return false;
    
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);

    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    if (y < 1000 || y > 9999) return false;

    const isoDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(isoDate);
    if (dateObj.getUTCFullYear() !== y || dateObj.getUTCMonth() + 1 !== m || dateObj.getUTCDate() !== d) {
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Task title is required.');
    
    if (dueDateDisplay && !validateDate(dueDateDisplay)) {
      return Alert.alert('Invalid Date', 'Please enter a valid date in DD-MM-YYYY format.');
    }

    const isoDueDate = formatForBackend(dueDateDisplay);

    if (editTask) {
      await updateTask(userId, editTask.id, { title: title.trim(), description: description.trim(), priority, dueDate: isoDueDate });
    } else {
      await addTask(userId, { title: title.trim(), description: description.trim(), priority, dueDate: isoDueDate, status: 'pending' });
    }
    setModalVisible(false);
    load();
  };

  const handleToggle = async (task) => {
    await updateTask(userId, task.id, { status: task.status === 'done' ? 'pending' : 'done' });
    load();
  };

  const handleDelete = (id) => {
    setDeleteError('');
    setDeleteTaskId(id);
  };

  const confirmDelete = async () => {
    try {
      await deleteTask(userId, deleteTaskId);
      setDeleteTaskId(null);
      load();
    } catch (e) {
      setDeleteError('Unable to delete task. Please try again.');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = tasks.filter(t => {
    if (filter === 'Today') return t.dueDate === today;
    if (filter === 'Pending') return t.status !== 'done';
    if (filter === 'Done') return t.status === 'done';
    return true;
  });

  const renderItem = ({ item }) => (
    <View style={s.card}>
      <TouchableOpacity style={s.checkbox} onPress={() => handleToggle(item)}>
        {item.status === 'done' ? <CheckCircle size={20} color={C.success} /> : <Circle size={20} color={C.textMuted} />}
      </TouchableOpacity>
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text style={[s.taskTitle, item.status === 'done' && s.done]}>{item.title}</Text>
        {item.description ? <Text style={[s.taskDesc, item.status === 'done' && s.doneDesc]}>{item.description}</Text> : null}
        <View style={s.taskMeta}>
          <View style={[s.priorityBadge, { backgroundColor: PRIORITY_COLORS[item.priority] + '22' }]}>
            <Text style={[s.priorityText, { color: PRIORITY_COLORS[item.priority] }]}>{item.priority?.toUpperCase()}</Text>
          </View>
          {item.dueDate ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <CalIcon size={12} color={C.textMuted} />
              <Text style={s.dueDate}>{formatForUI(item.dueDate)}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={s.actions}>
        <TouchableOpacity onPress={() => openEdit(item)} style={s.actionBtn}>
          <Edit2 size={16} color={C.gold} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={s.actionBtn}>
          <Trash2 size={16} color={C.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      
      {/* Filter Tabs */}
      <View style={s.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[s.filterTab, filter === f && s.filterTabActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <ClipboardList size={48} color={C.textMuted} style={{ marginBottom: 12 }} />
            <Text style={s.emptyText}>No tasks yet</Text>
            <Text style={s.emptySub}>Tap "+ Add" to create your first task</Text>
          </View>
        }
        ListFooterComponent={<SecurityFooter style={{ marginTop: 24 }} />}
      />

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteTaskId} animationType="fade" transparent>
        <View style={s.overlayCenter}>
          <View style={s.alertBox}>
            <Text style={s.alertTitle}>Delete Task</Text>
            <Text style={s.alertMessage}>Are you sure you want to delete this task?</Text>
            {deleteError ? <Text style={s.errorText}>{deleteError}</Text> : null}
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setDeleteTaskId(null)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: C.error }]} onPress={confirmDelete}>
                <Text style={[s.saveBtnText, { color: '#FFF' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <View style={s.modal}>
              <Text style={s.modalTitle}>{editTask ? 'Edit Task' : 'New Task'}</Text>

              <Text style={s.label}>TITLE *</Text>
              <TextInput style={s.input} value={title} onChangeText={setTitle}
                placeholder="What needs to be done?" placeholderTextColor={C.textMuted} />

              <Text style={s.label}>DESCRIPTION</Text>
              <TextInput style={[s.input, { minHeight: 70, textAlignVertical: 'top' }]}
                value={description} onChangeText={setDescription} multiline
                placeholder="Optional details..." placeholderTextColor={C.textMuted} />

              <Text style={s.label}>PRIORITY</Text>
              <View style={s.priorityRow}>
                {PRIORITIES.map(p => (
                  <TouchableOpacity key={p} style={[s.priorityBtn, priority === p && { backgroundColor: PRIORITY_COLORS[p] + '30', borderColor: PRIORITY_COLORS[p] }]}
                    onPress={() => setPriority(p)}>
                    <Text style={[s.priorityBtnText, priority === p && { color: PRIORITY_COLORS[p] }]}>{p.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>DUE DATE (DD-MM-YYYY)</Text>
              <TextInput 
                style={s.input} 
                value={dueDateDisplay} 
                onChangeText={handleDueDateChange}
                maxLength={10}
                keyboardType="numeric"
                placeholder="Example: 20-08-2026" 
                placeholderTextColor={C.textMuted} 
              />

              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
                  <Text style={s.saveBtnText}>Save Task</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <TouchableOpacity style={s.fab} onPress={openAdd}>
        <Plus size={24} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: C.gold, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8, boxShadow: '0px 4px 15px rgba(240, 165, 0, 0.4)' },
  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.border },
  filterTabActive: { backgroundColor: C.goldDim, borderColor: C.border },
  filterText: { fontSize: 12, color: C.textMuted, fontWeight: '600' },
  filterTextActive: { color: C.gold },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  checkbox: { paddingTop: 2 },
  taskTitle: { fontSize: 15, fontWeight: '700', color: C.white },
  done: { textDecorationLine: 'line-through', textDecorationStyle: 'solid', color: C.textMuted, opacity: 0.6 },
  doneDesc: { textDecorationLine: 'line-through', opacity: 0.6 },
  taskDesc: { fontSize: 13, color: C.textSecondary, marginTop: 3 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  dueDate: { fontSize: 11, color: C.textMuted },
  actions: { gap: 6, flexDirection: 'row' },
  actionBtn: { padding: 4, marginLeft: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '700', color: C.white, marginBottom: 6 },
  emptySub: { fontSize: 13, color: C.textMuted, textAlign: 'center' },
  overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertBox: { backgroundColor: '#111', width: '100%', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border },
  alertTitle: { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 12 },
  alertMessage: { fontSize: 14, color: C.textSecondary, marginBottom: 8, lineHeight: 22 },
  errorText: { fontSize: 13, color: C.error, marginBottom: 10 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, fontSize: 14, color: C.white, outlineStyle: 'none' },
  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  priorityBtnText: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  cancelBtnText: { color: C.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: C.gold, padding: 15, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
});
