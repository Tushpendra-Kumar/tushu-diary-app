import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { getGoals, addGoal, updateGoal, deleteGoal } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { Target, Book, Dumbbell, Brain, CheckCircle2, Trash2, Plus, X } from 'lucide-react-native';

export default function SelfCareGoalsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id;
  const [goals, setGoals] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  
  // Form
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Exercise');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');

  // Progress update form
  const [progressModalInfo, setProgressModalInfo] = useState(null);
  const [progressAdd, setProgressAdd] = useState('');

  const types = [
    { name: 'Exercise', icon: Dumbbell },
    { name: 'Reading', icon: Book },
    { name: 'Learning', icon: Brain },
    { name: 'Other', icon: Target }
  ];

  useEffect(() => {
    if (userId) loadGoals();
  }, [userId]);

  const loadGoals = async () => {
    try {
      const data = await getGoals(userId);
      setGoals(data || []);
    } catch (e) { setGoals([]); }
  };

  const resetForm = () => {
    setTitle(''); setType('Exercise'); setTarget(''); setUnit(''); setDeadline(''); setNotes('');
  };

  const handleSave = async () => {
    if (!title.trim() || !target.trim()) return;
    const newGoal = { title, type, target: Number(target), unit, deadline, notes, current: 0, createdAt: new Date().toISOString(), id: Date.now().toString() };
    await addGoal(userId, newGoal);
    setIsModalVisible(false);
    resetForm();
    loadGoals();
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    await deleteGoal(userId, deleteItemId);
    setDeleteItemId(null);
    loadGoals();
  };

  const updateProgress = async () => {
    if (!progressModalInfo || !progressAdd) return;
    const goal = progressModalInfo;
    const addAmt = Number(progressAdd) || 0;
    const newCurrent = goal.current + addAmt;
    await updateGoal(userId, goal.id, { ...goal, current: newCurrent });
    setProgressModalInfo(null);
    setProgressAdd('');
    loadGoals();
  };

  const markComplete = async (goal) => {
    await updateGoal(userId, goal.id, { ...goal, current: goal.target });
    loadGoals();
  };

  const activeGoals = goals.filter(g => g.current < g.target);
  const completedGoals = goals.filter(g => g.current >= g.target);

  const getIcon = (typeName, isCompleted) => {
    const TypeObj = types.find(t => t.name === typeName);
    const IconComp = TypeObj ? TypeObj.icon : Target;
    return <IconComp size={24} color={isCompleted ? C.success : C.gold} />;
  };

  const renderGoal = ({ item }) => {
    const progressPercent = Math.min((item.current / item.target) * 100, 100);
    const isCompleted = progressPercent >= 100;
    
    return (
      <View style={[styles.card, isCompleted && styles.cardCompleted]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <View style={[styles.iconBox, isCompleted && {borderColor: C.success}]}>
              {getIcon(item.type, isCompleted)}
            </View>
            <View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardCat}>{item.type} {item.deadline ? `• Due: ${item.deadline}` : ''}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setDeleteItemId(item.id)} style={{padding: 4}}>
            <Trash2 size={18} color={C.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, {width: `${progressPercent}%`, backgroundColor: isCompleted ? C.success : C.gold}]} />
          </View>
          <Text style={styles.progressText}>{item.current} / {item.target} {item.unit}</Text>
        </View>

        {!isCompleted && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.logBtn} onPress={() => setProgressModalInfo(item)}>
              <Plus size={14} color={C.gold} style={{marginRight: 4}} />
              <Text style={styles.logBtnText}>Log Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.completeBtn} onPress={() => markComplete(item)}>
              <CheckCircle2 size={14} color={C.success} style={{marginRight: 4}} />
              <Text style={styles.completeBtnText}>Complete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ParticleBackground />
      
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{activeGoals.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{completedGoals.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <FlatList
        data={[...activeGoals, ...completedGoals]}
        keyExtractor={i => i.id || Math.random().toString()}
        renderItem={renderGoal}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<SecurityFooter style={{marginTop: 24}}/>}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Target size={48} color={C.textMuted} style={{marginBottom: 12}} />
            <Text style={styles.emptyText}>No goals set yet.</Text>
            <Text style={styles.emptySub}>Start small. Set a goal for reading, exercising, or learning.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setIsModalVisible(true)}>
        <Plus size={24} color="#000" />
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Goal</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}><X size={24} color={C.textSecondary}/></TouchableOpacity>
            </View>
            <ScrollView style={{maxHeight: '80%'}}>
              <Text style={styles.label}>Goal Title *</Text>
              <TextInput style={styles.input} placeholderTextColor={C.textMuted} value={title} onChangeText={setTitle} placeholder="e.g. Read 10 books" />
              
              <Text style={styles.label}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                {types.map(t => (
                  <TouchableOpacity key={t.name} style={[styles.pill, type === t.name && styles.pillActive]} onPress={() => setType(t.name)}>
                    {t.name === type ? <t.icon size={14} color={C.gold} style={{marginRight: 6}} /> : null}
                    <Text style={[styles.pillText, type === t.name && styles.pillTextActive]}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{flexDirection: 'row', gap: 12}}>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>Target Number *</Text>
                  <TextInput style={styles.input} keyboardType="numeric" placeholderTextColor={C.textMuted} value={target} onChangeText={setTarget} placeholder="e.g. 10" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>Unit (Optional)</Text>
                  <TextInput style={styles.input} placeholderTextColor={C.textMuted} value={unit} onChangeText={setUnit} placeholder="e.g. books" />
                </View>
              </View>

              <Text style={styles.label}>Deadline (Optional)</Text>
              <TextInput style={styles.input} placeholderTextColor={C.textMuted} value={deadline} onChangeText={setDeadline} placeholder="YYYY-MM-DD" />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Create Goal</Text></TouchableOpacity>
              <View style={{height: 20}} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!progressModalInfo} animationType="fade" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Progress</Text>
            <Text style={{color: C.textSecondary, marginBottom: 20, marginTop: 8}}>Add progress for: {progressModalInfo?.title}</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholderTextColor={C.textMuted} value={progressAdd} onChangeText={setProgressAdd} placeholder={`Amount (e.g. 1 ${progressModalInfo?.unit || ''})`} />
            <View style={{flexDirection: 'row', gap: 12}}>
              <TouchableOpacity style={[styles.saveBtn, {flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: C.border}]} onPress={() => setProgressModalInfo(null)}>
                <Text style={{color: C.textSecondary, fontWeight: 'bold'}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, {flex: 1}]} onPress={updateProgress}>
                <Text style={styles.saveBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!deleteItemId} animationType="fade" transparent>
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Delete Goal</Text>
            <Text style={styles.alertMessage}>Are you sure you want to delete this goal?</Text>
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
  statsRow: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { color: C.white, fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: C.textSecondary, fontSize: 12 },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyText: { color: C.white, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySub: { color: C.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  cardCompleted: { opacity: 0.7, borderColor: 'rgba(76, 175, 80, 0.3)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardTitleWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: 'rgba(255,255,255,0.02)' },
  cardTitle: { color: C.white, fontSize: 16, fontWeight: '800' },
  cardCat: { color: C.textMuted, fontSize: 12, marginTop: 4 },
  progressWrap: { marginBottom: 16 },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressText: { color: C.textSecondary, fontSize: 12, textAlign: 'right' },
  actionRow: { flexDirection: 'row', gap: 12 },
  logBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.goldDim },
  logBtnText: { color: C.gold, fontWeight: '600', fontSize: 13 },
  completeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(76, 175, 80, 0.3)', backgroundColor: 'rgba(76, 175, 80, 0.1)' },
  completeBtnText: { color: C.success, fontWeight: '600', fontSize: 13 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: C.gold, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8, boxShadow: '0px 4px 15px rgba(240, 165, 0, 0.4)' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: C.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: C.white, fontSize: 20, fontWeight: '800' },
  label: { color: C.textSecondary, marginBottom: 8, fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.white, padding: 14, marginBottom: 20, outlineStyle: 'none' },
  pillScroll: { flexDirection: 'row', marginBottom: 20 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10 },
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