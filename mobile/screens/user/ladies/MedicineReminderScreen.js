import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { getMedicines, addMedicine, updateMedicine, deleteMedicine } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { Pill, Calendar, Stethoscope, Clock, Trash2, X, Plus } from 'lucide-react-native';

export default function MedicineReminderScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id;
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('medicines'); 
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [timing, setTiming] = useState('Morning');
  const [frequency, setFrequency] = useState('Daily');
  const [notes, setNotes] = useState('');
  
  // Appt state
  const [doctorName, setDoctorName] = useState('');
  const [hospital, setHospital] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [purpose, setPurpose] = useState('');

  const timings = ['Morning', 'Afternoon', 'Evening', 'Night', 'As needed'];
  const frequencies = ['Daily', 'Weekly', 'Monthly'];

  useEffect(() => {
    if (userId) loadItems();
  }, [userId]);

  const loadItems = async () => {
    try {
      const data = await getMedicines(userId);
      setItems(data || []);
    } catch (e) {
      setItems([]);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setDosage('');
    setTiming('Morning');
    setFrequency('Daily');
    setNotes('');
    setDoctorName('');
    setHospital('');
    setDate('');
    setTime('');
    setPurpose('');
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    const data = activeTab === 'medicines' 
      ? { type: 'medicine', name, dosage, timing, frequency, notes, active: true }
      : { type: 'appointment', doctorName, hospital, date, time, purpose };
      
    if (editingId) {
      await updateMedicine(userId, editingId, data);
    } else {
      await addMedicine(userId, data);
    }
    
    setIsModalVisible(false);
    loadItems();
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    await deleteMedicine(userId, deleteItemId);
    setDeleteItemId(null);
    loadItems();
  };

  const toggleActive = async (item) => {
    await updateMedicine(userId, item.id, { ...item, active: !item.active });
    loadItems();
  };

  const medicines = items.filter(i => i.type === 'medicine');
  const appointments = items.filter(i => i.type === 'appointment');

  const renderMedicineItem = ({ item }) => (
    <View style={[styles.card, !item.active && styles.cardInactive]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <Pill size={20} color={item.active ? C.gold : C.textMuted} style={styles.cardIcon} />
          <Text style={[styles.cardTitle, !item.active && {color: C.textMuted}]}>{item.name}</Text>
        </View>
        <TouchableOpacity onPress={() => toggleActive(item)}>
          <View style={[styles.toggleBtn, item.active ? styles.toggleActive : styles.toggleInactive]}>
            <Text style={styles.toggleText}>{item.active ? 'ON' : 'OFF'}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <Text style={styles.cardDetail}>{item.dosage || 'Not specified'} • {item.frequency}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.badge}><Text style={styles.badgeText}>{item.timing}</Text></View>
        <TouchableOpacity onPress={() => setDeleteItemId(item.id)} style={{padding: 4}}>
          <Trash2 size={18} color={C.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderApptItem = ({ item }) => {
    const isPast = new Date(item.date) < new Date(new Date().setHours(0,0,0,0));
    return (
      <View style={[styles.card, isPast && styles.cardInactive]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <Stethoscope size={20} color={isPast ? C.textMuted : C.gold} style={styles.cardIcon} />
            <Text style={[styles.cardTitle, isPast && {color: C.textMuted}]}>{item.doctorName}</Text>
          </View>
          <TouchableOpacity onPress={() => setDeleteItemId(item.id)} style={{padding: 4}}>
            <Trash2 size={18} color={C.error} />
          </TouchableOpacity>
        </View>
        <Text style={styles.cardDetail}>{item.hospital || 'Not specified'} • {item.purpose || 'Not specified'}</Text>
        <View style={styles.cardFooter}>
          <View style={[styles.badge, {flexDirection: 'row', alignItems: 'center'}]}>
            <Clock size={12} color={C.gold} style={{marginRight: 4}} />
            <Text style={styles.badgeText}>{item.date} {item.time}</Text>
          </View>
          {isPast && <Text style={{color: C.textMuted, fontSize: 12}}>Past</Text>}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ParticleBackground />

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'medicines' && styles.tabActive]} onPress={() => setActiveTab('medicines')}>
          <Pill size={16} color={activeTab === 'medicines' ? C.gold : C.textSecondary} style={{marginBottom: 4}} />
          <Text style={[styles.tabText, activeTab === 'medicines' && styles.tabTextActive]}>Medicines</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'appointments' && styles.tabActive]} onPress={() => setActiveTab('appointments')}>
          <Calendar size={16} color={activeTab === 'appointments' ? C.gold : C.textSecondary} style={{marginBottom: 4}} />
          <Text style={[styles.tabText, activeTab === 'appointments' && styles.tabTextActive]}>Appointments</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'medicines' ? medicines : appointments}
        keyExtractor={i => i.id}
        renderItem={activeTab === 'medicines' ? renderMedicineItem : renderApptItem}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<SecurityFooter style={{ marginTop: 24 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {activeTab === 'medicines' ? <Pill size={48} color={C.textMuted} style={{marginBottom: 12}} /> : <Calendar size={48} color={C.textMuted} style={{marginBottom: 12}} />}
            <Text style={styles.emptyText}>{activeTab === 'medicines' ? 'No medicines added yet' : 'No appointments yet'}</Text>
            <Text style={styles.emptySub}>{activeTab === 'medicines' ? 'Add your medicines to keep track of your routine.' : 'Your upcoming appointments will appear here.'}</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Plus size={24} color="#000" />
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activeTab === 'medicines' ? 'Add Medicine' : 'Add Appointment'}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={{padding: 4}}>
                <X size={24} color={C.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{maxHeight: '80%'}}>
              {activeTab === 'medicines' ? (
                <>
                  <Text style={styles.label}>Medicine Name *</Text>
                  <TextInput style={styles.input} placeholderTextColor={C.textMuted} value={name} onChangeText={setName} placeholder="e.g. Paracetamol" />
                  <Text style={styles.label}>Dosage</Text>
                  <TextInput style={styles.input} placeholderTextColor={C.textMuted} value={dosage} onChangeText={setDosage} placeholder="e.g. 500 mg" />
                  
                  <Text style={styles.label}>Frequency</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                    {frequencies.map(f => (
                      <TouchableOpacity key={f} style={[styles.pill, frequency === f && styles.pillActive]} onPress={() => setFrequency(f)}>
                        <Text style={[styles.pillText, frequency === f && styles.pillTextActive]}>{f}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.label}>Time</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                    {timings.map(t => (
                      <TouchableOpacity key={t} style={[styles.pill, timing === t && styles.pillActive]} onPress={() => setTiming(t)}>
                        <Text style={[styles.pillText, timing === t && styles.pillTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  
                  <Text style={styles.label}>Notes</Text>
                  <TextInput style={[styles.input, {height: 80}]} placeholderTextColor={C.textMuted} value={notes} onChangeText={setNotes} placeholder="Optional notes" multiline />
                </>
              ) : (
                <>
                  <Text style={styles.label}>Doctor/Clinic Name *</Text>
                  <TextInput style={styles.input} placeholderTextColor={C.textMuted} value={doctorName} onChangeText={setDoctorName} placeholder="e.g. Dr. Sharma" />
                  <Text style={styles.label}>Hospital</Text>
                  <TextInput style={styles.input} placeholderTextColor={C.textMuted} value={hospital} onChangeText={setHospital} placeholder="e.g. City Hospital" />
                  
                  <View style={{flexDirection: 'row', gap: 12}}>
                    <View style={{flex: 1}}>
                      <Text style={styles.label}>Date</Text>
                      <TextInput style={styles.input} placeholderTextColor={C.textMuted} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={styles.label}>Time</Text>
                      <TextInput style={styles.input} placeholderTextColor={C.textMuted} value={time} onChangeText={setTime} placeholder="HH:MM" />
                    </View>
                  </View>
                  
                  <Text style={styles.label}>Purpose</Text>
                  <TextInput style={styles.input} placeholderTextColor={C.textMuted} value={purpose} onChangeText={setPurpose} placeholder="e.g. Routine checkup" />
                </>
              )}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
              <View style={{height: 20}} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteItemId} animationType="fade" transparent>
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Delete Entry</Text>
            <Text style={styles.alertMessage}>Are you sure you want to delete this {activeTab.slice(0, -1)}?</Text>
            <View style={styles.alertBtns}>
              <TouchableOpacity style={styles.alertCancel} onPress={() => setDeleteItemId(null)}>
                <Text style={styles.alertCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.alertDelete} onPress={confirmDelete}>
                <Text style={styles.alertDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: C.gold },
  tabText: { color: C.textSecondary, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: C.gold, fontWeight: '800' },
  listContent: { padding: 16, paddingBottom: 100 },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyText: { color: C.white, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySub: { color: C.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  
  card: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  cardInactive: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitleWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardIcon: { marginRight: 10 },
  cardTitle: { color: C.white, fontSize: 16, fontWeight: '800', flex: 1 },
  
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  toggleActive: { backgroundColor: 'rgba(76, 175, 80, 0.15)', borderColor: C.success },
  toggleInactive: { backgroundColor: 'transparent', borderColor: C.border },
  toggleText: { color: C.white, fontSize: 10, fontWeight: '800' },
  
  cardDetail: { color: C.textSecondary, fontSize: 14, marginBottom: 12, marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  
  badge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: C.border },
  badgeText: { color: C.gold, fontSize: 12, fontWeight: '600' },
  
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: C.gold, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8, boxShadow: '0px 4px 15px rgba(240, 165, 0, 0.4)' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: C.border, borderBottomWidth: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: C.white, fontSize: 20, fontWeight: '800' },
  label: { color: C.textSecondary, marginBottom: 8, fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.white, padding: 14, marginBottom: 20, outlineStyle: 'none' },
  
  pillScroll: { flexDirection: 'row', marginBottom: 20 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10 },
  pillActive: { backgroundColor: C.goldDim, borderColor: C.border },
  pillText: { color: C.textSecondary, fontSize: 14, fontWeight: '600' },
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
