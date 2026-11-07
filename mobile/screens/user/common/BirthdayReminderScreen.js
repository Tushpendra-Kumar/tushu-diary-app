import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { getBirthdays, addBirthday, deleteBirthday } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { Gift, Heart, Plus, Trash2, X } from 'lucide-react-native';



export default function BirthdayReminderScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id;
  const [events, setEvents] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('birthday');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (userId) loadEvents();
  }, [userId]);

    const loadEvents = async () => {
    try {
      const data = await getBirthdays();
      setEvents(data || []);
    } catch (e) { setEvents([]); }
  };

  const handleSave = async () => {
    if (!name || !date) return;
    const newEvent = { name, relation, date, type, notes, id: Date.now().toString() };
    await addBirthday(newEvent);
    setIsModalVisible(false);
    setName(''); setRelation(''); setDate(''); setType('birthday'); setNotes('');
    loadEvents();
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    await deleteBirthday(deleteItemId);
    setDeleteItemId(null);
    loadEvents();
  };

  const calculateDaysUntil = (dateStr) => {
    if (!dateStr) return 999;
    try {
      const [day, month] = dateStr.split('-');
      if (!day || !month) return 999;
      const today = new Date();
      today.setHours(0,0,0,0);
      let eventDate = new Date(today.getFullYear(), parseInt(month)-1, parseInt(day));
      if (eventDate < today) { eventDate.setFullYear(today.getFullYear() + 1); }
      const diffTime = eventDate - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch { return 999; }
  };

  const enrichedEvents = events.map(e => ({ ...e, daysUntil: calculateDaysUntil(e.date) })).sort((a, b) => a.daysUntil - b.daysUntil);
  const todayEvents = enrichedEvents.filter(e => e.daysUntil === 0);
  const upcomingEvents = enrichedEvents.filter(e => e.daysUntil > 0);

  const renderEvent = (item, isHighlight = false) => {
    const isToday = item.daysUntil === 0;
    return (
      <View key={item.id} style={[styles.card, isHighlight && styles.cardHighlight, isToday && styles.cardToday]}>
        <View style={styles.cardLeft}>
          {item.type === 'anniversary' ? <Heart size={24} color={isToday ? '#000' : C.gold} /> : <Gift size={24} color={isToday ? '#000' : C.gold} />}
          <View style={{marginLeft: 12}}>
            <Text style={[styles.name, (isHighlight || isToday) && {color: isToday ? '#000' : C.gold}]}>{item.name}</Text>
            <Text style={[styles.relation, isToday && {color: '#333'}]}>{item.relation || 'Family'} • {item.date}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.badge, isToday && {backgroundColor: '#000'}]}>
            <Text style={[styles.badgeText, isToday && {color: C.gold}]}>{isToday ? 'Today!' : `In ${item.daysUntil} days`}</Text>
          </View>
          <TouchableOpacity onPress={() => setDeleteItemId(item.id)} style={{padding: 4}}>
            <Trash2 size={18} color={isToday ? '#EF4444' : C.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ParticleBackground />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {todayEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Celebrations 🎉</Text>
            {todayEvents.map(e => renderEvent(e, true))}
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          {upcomingEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Gift size={48} color={C.textMuted} style={{marginBottom: 12}} />
              <Text style={{color: C.textMuted, fontSize: 16}}>No upcoming events</Text>
            </View>
          ) : upcomingEvents.map(e => renderEvent(e))}
        </View>
        <SecurityFooter style={{marginTop: 20}} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setIsModalVisible(true)}>
        <Plus size={24} color="#000" />
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Event</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}><X size={24} color={C.textSecondary}/></TouchableOpacity>
            </View>
            <ScrollView style={{maxHeight: '80%'}}>
              <Text style={styles.label}>Name *</Text>
              <TextInput style={styles.input} placeholderTextColor={C.textMuted} value={name} onChangeText={setName} placeholder="e.g. Rahul" />
              
              <Text style={styles.label}>Relation</Text>
              <TextInput style={styles.input} placeholderTextColor={C.textMuted} value={relation} onChangeText={setRelation} placeholder="e.g. Brother" />
              
              <Text style={styles.label}>Date (DD-MM) *</Text>
              <TextInput style={styles.input} placeholderTextColor={C.textMuted} value={date} onChangeText={setDate} placeholder="e.g. 15-08" />
              
              <Text style={styles.label}>Type</Text>
              <View style={{flexDirection: 'row', gap: 12, marginBottom: 20}}>
                <TouchableOpacity style={[styles.typeBtn, type === 'birthday' && styles.typeBtnActive]} onPress={() => setType('birthday')}>
                  <Text style={[styles.typeText, type === 'birthday' && styles.typeTextActive]}>Birthday</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeBtn, type === 'anniversary' && styles.typeBtnActive]} onPress={() => setType('anniversary')}>
                  <Text style={[styles.typeText, type === 'anniversary' && styles.typeTextActive]}>Anniversary</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
              <View style={{height: 20}} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!deleteItemId} animationType="fade" transparent>
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Delete Event</Text>
            <Text style={styles.alertMessage}>Are you sure you want to delete this event?</Text>
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
  scrollContent: { padding: 16, paddingBottom: 100 },
  section: { marginBottom: 24 },
  sectionTitle: { color: C.white, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.card, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  cardHighlight: { borderColor: C.gold, backgroundColor: 'rgba(240, 165, 0, 0.05)' },
  cardToday: { backgroundColor: C.gold, borderColor: C.gold },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  name: { color: C.white, fontSize: 16, fontWeight: 'bold' },
  relation: { color: C.textSecondary, fontSize: 12, marginTop: 2 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  badgeText: { color: C.gold, fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: C.gold, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: C.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: C.white, fontSize: 20, fontWeight: '800' },
  label: { color: C.textSecondary, marginBottom: 8, fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.white, padding: 14, marginBottom: 20, outlineStyle: 'none' },
  typeBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  typeBtnActive: { backgroundColor: C.goldDim, borderColor: C.gold },
  typeText: { color: C.textSecondary, fontWeight: '600' },
  typeTextActive: { color: C.gold, fontWeight: '800' },
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