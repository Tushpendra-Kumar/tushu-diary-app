import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { isValidDate, toStorageDate, toDisplayDate, formatDateInput, isValidTime, formatTimeInput } from '../../../utils/dateFormatter';
import {
  getPersonalEvents as getFamilyEvents,
  addPersonalEvent as addFamilyEvent,
  updatePersonalEvent as updateFamilyEvent,
  deletePersonalEvent as deleteFamilyEvent
} from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import ParticleBackground from '../../../components/ParticleBackground';
import { C } from '../../../constants/theme';
import { CalendarHeart, Plus, ChevronLeft, Trash2, Edit3, MapPin, Clock, PartyPopper } from 'lucide-react-native';

const EVENT_TYPES = ['Birthday', 'Anniversary', 'Family Gathering', 'Festival', 'Meeting', 'Other'];

export default function FamilyEventsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id || user?.id;
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Family Gathering');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [ampm, setAmpm] = useState('AM');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  
  // Delete Modal State
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { load(); }, [userId]);
  
  const load = async () => {
    if (!userId) return;
    setLoading(true);
    setEvents(await getFamilyEvents(userId) || []);
    setLoading(false);
  };

  const alertMsg = (msg) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Validation', msg);
  };

  const openAddModal = () => {
    setEditingId(null);
    setTitle('');
    setType('Family Gathering');
    setDate('');
    setTime('');
    setAmpm('AM');
    setVenue('');
    setDescription('');
    setModalVisible(true);
  };

  const openEditModal = (ev) => {
    setEditingId(ev.id);
    setTitle(ev.title || '');
    setType(ev.type || 'Family Gathering');
    setDate(toDisplayDate(ev.date));
    if (ev.time) {
      const parts = ev.time.split(' ');
      setTime(parts[0] || '');
      setAmpm(parts[1] || 'AM');
    } else {
      setTime('');
      setAmpm('AM');
    }
    setVenue(ev.venue || '');
    setDescription(ev.description || '');
    setModalVisible(true);
  };

  const handleSaveEvent = async () => {
    if (!title.trim()) return alertMsg('Please enter an event title.');
    if (!type.trim()) return alertMsg('Please select an event type.');
    if (!date.trim()) return alertMsg('Please select a date.');
    if (!isValidDate(date)) return alertMsg('Please enter a valid date (DD/MM/YYYY).');
    
    const fullTime = time.trim() ? `${time.trim()} ${ampm}` : '';
    if (fullTime && !isValidTime(fullTime)) return alertMsg('Please enter a valid time (HH:MM).');

    const payload = {
      title: title.trim(),
      type: type.trim(),
      date: toStorageDate(date),
      time: fullTime,
      venue: venue.trim(),
      description: description.trim(),
      createdBy: user?.full_name || 'Family Member'
    };
    
    if (editingId) {
      await updateFamilyEvent(userId, editingId, payload);
    } else {
      await addFamilyEvent(userId, payload);
    }
    
    setModalVisible(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteFamilyEvent(userId, deleteId);
    setDeleteId(null);
    load();
  };

  const renderItem = ({ item }) => (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{item.title}</Text>
          <Text style={s.typeText}>{item.type}</Text>
        </View>
        <View style={s.dateBox}>
          <Text style={s.dateBoxText}>{toDisplayDate(item.date)}</Text>
        </View>
      </View>

      <View style={s.detailsBlock}>
        {item.time ? (
          <View style={s.detailRow}>
            <Clock size={14} color={C.textMuted} />
            <Text style={s.detailText}>{item.time}</Text>
          </View>
        ) : null}
        
        {item.venue ? (
          <View style={s.detailRow}>
            <MapPin size={14} color={C.textMuted} />
            <Text style={s.detailText}>{item.venue}</Text>
          </View>
        ) : null}
        
        {item.description ? (
          <Text style={s.notesText} numberOfLines={3}>{item.description}</Text>
        ) : null}
      </View>

      <View style={s.cardActions}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={s.actionBtn}>
          <Edit3 size={14} color={C.gold} />
          <Text style={s.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDeleteId(item.id)} style={[s.actionBtn, { borderColor: C.error + '55', backgroundColor: C.error + '11' }]}>
          <Trash2 size={14} color={C.error} />
          <Text style={[s.actionText, { color: C.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ChevronLeft size={24} color={C.gold} />
          <Text style={{ color: C.gold, fontSize: 16 }}>Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Family Events</Text>
        <TouchableOpacity style={s.addBtnTop} onPress={openAddModal}>
          <Text style={s.addBtnTextTop}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={events.sort((a, b) => new Date(a.date) - new Date(b.date))}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        renderItem={renderItem}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <PartyPopper size={48} color={C.textMuted} />
              <Text style={s.emptyText}>No family events yet</Text>
              <Text style={s.emptySub}>Create your first family event by tapping "+ Add".</Text>
            </View>
          ) : null
        }
        ListFooterComponent={<SecurityFooter style={{ marginTop: 24 }} />}
      />

      {/* Add / Edit Event Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', maxHeight: '92%' }}>
            <View style={s.modal}>
              <View style={s.modalDrag} />
              <Text style={s.modalTitle}>{editingId ? 'Edit Event' : 'Add Event'}</Text>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={s.label}>EVENT TITLE *</Text>
                <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Enter event title" placeholderTextColor={C.textMuted} />
                
                <Text style={s.label}>EVENT TYPE *</Text>
                <View style={s.gridRow}>
                  {EVENT_TYPES.map(t => (
                    <TouchableOpacity key={t} style={[s.gridBtn, type === t && s.gridBtnActive]} onPress={() => setType(t)}>
                      <Text style={[s.gridBtnText, type === t && s.gridBtnTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>DATE *</Text>
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

                <Text style={s.label}>VENUE (OPTIONAL)</Text>
                <TextInput style={s.input} value={venue} onChangeText={setVenue} placeholder="Enter venue (optional)" placeholderTextColor={C.textMuted} />

                <Text style={s.label}>DESCRIPTION (OPTIONAL)</Text>
                <TextInput style={[s.input, { height: 70, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Add event details (optional)" placeholderTextColor={C.textMuted} multiline />
                
                <View style={s.modalBtns}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={s.saveBtn} onPress={handleSaveEvent}><Text style={s.saveText}>Save</Text></TouchableOpacity>
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteId} animationType="fade" transparent>
        <View style={s.alertOverlay}>
          <View style={s.alertBox}>
            <Text style={s.alertTitle}>Delete Event?</Text>
            <Text style={s.alertMessage}>Are you sure you want to permanently delete this event?</Text>
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
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { padding: 4, marginRight: 8, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: C.white, textAlign: 'center' },
  addBtnTop: { backgroundColor: C.gold, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  addBtnTextTop: { color: '#000', fontWeight: '700', fontSize: 13 },
  
  list: { padding: 16, paddingBottom: 100 },
  
  card: { backgroundColor: C.card, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: C.white, marginBottom: 4 },
  typeText: { fontSize: 13, color: C.gold, fontWeight: '600' },
  dateBox: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  dateBoxText: { color: C.white, fontWeight: '700', fontSize: 12 },
  
  detailsBlock: { padding: 16, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: C.white },
  notesText: { fontSize: 13, color: C.textSecondary, marginTop: 4, lineHeight: 18 },
  
  cardActions: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, gap: 6 },
  actionText: { fontSize: 13, fontWeight: '600', color: C.gold },
  
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '800', color: C.white },
  emptySub: { fontSize: 14, color: C.textMuted, textAlign: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '100%' },
  modalDrag: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 8 },
  
  label: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, fontSize: 15, color: C.white, outlineStyle: 'none' },
  
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.03)' },
  gridBtnActive: { borderColor: C.gold, backgroundColor: 'rgba(240, 165, 0, 0.1)' },
  gridBtnText: { color: C.textSecondary, fontWeight: '600', fontSize: 13 },
  gridBtnTextActive: { color: C.gold },
  
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 28 },
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
