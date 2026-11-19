import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  Modal, TextInput, Alert, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../../../constants/theme';
import {
  ChevronLeft, BellPlus, Bell, BellOff, Check, Trash2, PenLine,
  Search, ChevronDown, ChevronUp, Clock, Calendar, RotateCcw,
  AlertTriangle, CheckCircle, Timer, AlarmClock
} from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import ParticleBackground from '../../../components/ParticleBackground';
import SecurityFooter from '../../../components/SecurityFooter';
import {
  getReminders, addReminder, updateReminder, deleteReminder, completeReminder,
  getReminderStatus, validateReminderDate, validateReminderTime,
  formatDisplayDate, formatDisplayTime, todayDateStr,
  REPEAT_OPTIONS, PRIORITY_OPTIONS, FILTER_OPTIONS
} from '../../../services/reminderService';

const PRIORITY_COLORS = {
  Low: '#22C55E',
  Medium: '#F0A500',
  High: '#F97316',
  Urgent: '#EF4444'
};

const STATUS_COLORS = {
  Today: '#F0A500',
  Upcoming: '#22C55E',
  Overdue: '#EF4444',
  Completed: '#606060'
};

export default function AdvancedRemindersScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const [reminders, setReminders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fDate, setFDate] = useState(todayDateStr());
  const [fTime, setFTime] = useState('09:00');
  const [fRepeat, setFRepeat] = useState('One Time');
  const [fPriority, setFPriority] = useState('Medium');
  const [fError, setFError] = useState('');
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  const load = useCallback(async () => {
    if (!user?.user_id) return;
    const list = await getReminders(user.user_id);
    setReminders(list);
  }, [user?.user_id]);

  // Reload every time this screen gains focus (cross-module sync)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Date helpers: display (DD/MM/YYYY) ↔ storage (YYYY-MM-DD) ──
  const toDisplayDate = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };
  const toISODate = (display) => {
    // display: DD/MM/YYYY
    const parts = display.replace(/[^0-9]/g, '');
    if (parts.length !== 8) return null;
    const d = parts.slice(0, 2), m = parts.slice(2, 4), y = parts.slice(4, 8);
    const iso = `${y}-${m}-${d}`;
    return validateReminderDate(iso) ? iso : null;
  };

  // ── Time helpers: display (HH:MM AM/PM) ↔ storage (HH:MM 24h) ──
  const to12hDisplay = (time24) => {
    if (!time24) return '';
    const [h, min] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`;
  };
  const to24h = (display) => {
    // Accepts "09:30 AM", "12:00 PM" etc.
    const match = display.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    const min = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  const resetForm = () => {
    setFTitle(''); setFDesc('');
    setFDate(toDisplayDate(todayDateStr()));
    setFTime('09:00 AM');
    setFRepeat('One Time'); setFPriority('Medium');
    setFError(''); setEditingId(null);
    setShowRepeatPicker(false); setShowPriorityPicker(false);
  };

  const openAdd = () => { resetForm(); setShowForm(true); };

  const openEdit = (rem) => {
    setFTitle(rem.title); setFDesc(rem.description || '');
    setFDate(toDisplayDate(rem.date));
    setFTime(to12hDisplay(rem.time) || '09:00 AM');
    setFRepeat(rem.repeat); setFPriority(rem.priority);
    setFError(''); setEditingId(rem.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!fTitle.trim()) { setFError('Title is required.'); return; }
    const isoDate = toISODate(fDate);
    if (!isoDate) { setFError('Invalid date. Enter as DD/MM/YYYY (e.g. 15/09/2026).'); return; }
    const time24 = to24h(fTime);
    if (!time24) { setFError('Invalid time. Enter as HH:MM AM/PM (e.g. 09:30 AM or 02:00 PM).'); return; }

    setFError('');
    try {
      if (editingId) {
        await updateReminder(user.user_id, editingId, {
          title: fTitle.trim(), description: fDesc,
          date: isoDate, time: time24, repeat: fRepeat, priority: fPriority
        });
      } else {
        await addReminder(user.user_id, {
          title: fTitle.trim(), description: fDesc,
          date: isoDate, time: time24, repeat: fRepeat, priority: fPriority
        });
      }
      setShowForm(false);
      resetForm();
      load();
    } catch (e) {
      setFError('Failed to save reminder. Please try again.');
    }
  };

  const handleComplete = async (rem) => {
    await completeReminder(user.user_id, rem.id);
    load();
  };

  const handleDelete = (rem) => {
    const doDelete = async () => { await deleteReminder(user.user_id, rem.id); load(); };
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${rem.title}"?`)) doDelete();
    } else {
      Alert.alert('Delete Reminder', `Delete "${rem.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete }
      ]);
    }
  };

  // Filter + Search
  const displayed = reminders.filter(r => {
    const status = getReminderStatus(r);
    let passFilter = true;
    if (activeFilter === 'Today') passFilter = status === 'Today';
    else if (activeFilter === 'Upcoming') passFilter = status === 'Upcoming';
    else if (activeFilter === 'Overdue') passFilter = status === 'Overdue';
    else if (activeFilter === 'Completed') passFilter = status === 'Completed';

    let passSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      passSearch = r.title.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q));
    }
    return passFilter && passSearch;
  });

  const StatusIcon = ({ status }) => {
    if (status === 'Completed') return <CheckCircle color="#606060" size={18} />;
    if (status === 'Overdue') return <AlertTriangle color="#EF4444" size={18} />;
    if (status === 'Today') return <AlarmClock color="#F0A500" size={18} />;
    return <Timer color="#22C55E" size={18} />;
  };

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />

      {/* HEADER */}
      <View style={s.header}>
        <View style={{ width: 28 }} />
        <Text style={s.headerTitle}>Advanced Reminders</Text>
        <TouchableOpacity style={s.addHeaderBtn} onPress={openAdd}>
          <BellPlus color={C.gold} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* SEARCH */}
        <View style={s.searchRow}>
          <Search color={C.textMuted} size={17} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search reminders..."
            placeholderTextColor={C.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: C.gold, fontSize: 13, fontWeight: '600' }}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* FILTERS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {FILTER_OPTIONS.map(f => (
            <TouchableOpacity
              key={f}
              style={[s.chip, activeFilter === f && s.chipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[s.chipText, activeFilter === f && s.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* REMINDER LIST */}
        {displayed.length === 0 ? (
          <View style={s.emptyState}>
            <Bell size={48} color={C.textMuted} />
            <Text style={s.emptyTitle}>
              {searchQuery ? 'No results found' : activeFilter !== 'All' ? `No ${activeFilter} reminders` : 'No reminders yet'}
            </Text>
            <Text style={s.emptyDesc}>
              {searchQuery ? 'Try adjusting your search.' : 'Create your first reminder to stay on top of important tasks.'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={s.emptyCTA} onPress={openAdd}>
                <Text style={s.emptyCTAText}>Add Reminder</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displayed.map(rem => {
            const status = getReminderStatus(rem);
            return (
              <View key={rem.id} style={[s.card, rem.completed && s.cardDone]}>
                <View style={s.cardTop}>
                  <View style={[s.priorityDot, { backgroundColor: PRIORITY_COLORS[rem.priority] }]} />
                  <View style={s.cardMain}>
                    <Text style={[s.cardTitle, rem.completed && { color: C.textMuted, textDecorationLine: 'line-through' }]}>
                      {rem.title}
                    </Text>
                    {rem.description ? <Text style={s.cardDesc} numberOfLines={2}>{rem.description}</Text> : null}

                    <View style={s.cardMeta}>
                      <Calendar color={C.textMuted} size={13} />
                      <Text style={s.cardMetaText}>{formatDisplayDate(rem.date)}</Text>
                      <Clock color={C.textMuted} size={13} style={{ marginLeft: 10 }} />
                      <Text style={s.cardMetaText}>{formatDisplayTime(rem.time)}</Text>
                      {rem.repeat !== 'One Time' && (
                        <>
                          <RotateCcw color={C.textMuted} size={13} style={{ marginLeft: 10 }} />
                          <Text style={s.cardMetaText}>{rem.repeat}</Text>
                        </>
                      )}
                    </View>
                  </View>

                  <View style={s.statusBadge}>
                    <StatusIcon status={status} />
                    <Text style={[s.statusText, { color: STATUS_COLORS[status] }]}>{status}</Text>
                  </View>
                </View>

                {/* ACTIONS */}
                {!rem.completed && (
                  <View style={s.cardActions}>
                    <TouchableOpacity style={s.actionBtn} onPress={() => openEdit(rem)}>
                      <PenLine color={C.white} size={15} />
                      <Text style={s.actionBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.actionBtn, s.actionBtnSuccess]} onPress={() => handleComplete(rem)}>
                      <Check color={C.black} size={15} />
                      <Text style={[s.actionBtnText, { color: C.black }]}>Done</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.actionBtn, s.actionBtnDel]} onPress={() => handleDelete(rem)}>
                      <Trash2 color="#F44336" size={15} />
                    </TouchableOpacity>
                  </View>
                )}
                {rem.completed && (
                  <View style={s.cardActions}>
                    <TouchableOpacity style={[s.actionBtn, s.actionBtnDel]} onPress={() => handleDelete(rem)}>
                      <Trash2 color="#F44336" size={15} />
                      <Text style={[s.actionBtnText, { color: '#F44336' }]}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.actionBtn} onPress={() => updateReminder(user.user_id, rem.id, { completed: false }).then(load)}>
                      <RotateCcw color={C.white} size={15} />
                      <Text style={s.actionBtnText}>Restore</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
        <SecurityFooter />
      </ScrollView>

      {/* FLOATING ADD BUTTON */}
      <TouchableOpacity style={s.fab} onPress={openAdd}>
        <BellPlus color={C.black} size={22} />
      </TouchableOpacity>

      {/* ===================== REMINDER FORM MODAL ===================== */}
      <Modal visible={showForm} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>{editingId ? 'Edit Reminder' : 'New Reminder'}</Text>
                <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
                  <Text style={s.modalClose}>Cancel</Text>
                </TouchableOpacity>
              </View>

              {fError ? <Text style={s.errorText}>{fError}</Text> : null}

              <Text style={s.label}>Title *</Text>
              <TextInput
                style={s.input}
                placeholder="Reminder title..."
                placeholderTextColor={C.textMuted}
                value={fTitle}
                onChangeText={setFTitle}
              />

              <Text style={s.label}>Description (optional)</Text>
              <TextInput
                style={[s.input, { height: 70 }]}
                placeholder="Add notes..."
                placeholderTextColor={C.textMuted}
                value={fDesc}
                onChangeText={setFDesc}
                multiline
                numberOfLines={3}
              />

              <Text style={s.label}>Date (DD/MM/YYYY) *</Text>
              <TextInput
                style={[s.input, Platform.select({ web: { outlineStyle: 'none' } })]}
                placeholder="e.g. 15/09/2026"
                placeholderTextColor={C.textMuted}
                value={fDate}
                onChangeText={text => {
                  // Allow only digits and slashes, auto-insert slashes
                  const digits = text.replace(/[^0-9]/g, '');
                  let formatted = digits;
                  if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
                  if (digits.length > 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
                  setFDate(formatted);
                }}
                keyboardType="numeric"
                maxLength={10}
              />

              <Text style={s.label}>Time (HH:MM AM/PM) *</Text>
              <TextInput
                style={[s.input, Platform.select({ web: { outlineStyle: 'none' } })]}
                placeholder="e.g. 09:30 AM or 02:00 PM"
                placeholderTextColor={C.textMuted}
                value={fTime}
                onChangeText={text => {
                  const cleaned = text.replace(/[^0-9:APMapm ]/g, '');
                  setFTime(cleaned);
                }}
                maxLength={8}
              />

              <Text style={s.label}>Repeat</Text>
              <TouchableOpacity style={s.picker} onPress={() => setShowRepeatPicker(!showRepeatPicker)}>
                <Text style={s.pickerText}>{fRepeat}</Text>
                {showRepeatPicker ? <ChevronUp color={C.textMuted} size={18} /> : <ChevronDown color={C.textMuted} size={18} />}
              </TouchableOpacity>
              {showRepeatPicker && (
                <View style={s.pickerMenu}>
                  {REPEAT_OPTIONS.map(opt => (
                    <TouchableOpacity key={opt} style={s.pickerOption} onPress={() => { setFRepeat(opt); setShowRepeatPicker(false); }}>
                      <Text style={[s.pickerOptionText, fRepeat === opt && { color: C.gold }]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={s.label}>Priority</Text>
              <TouchableOpacity style={s.picker} onPress={() => setShowPriorityPicker(!showPriorityPicker)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[s.dot, { backgroundColor: PRIORITY_COLORS[fPriority] }]} />
                  <Text style={s.pickerText}>{fPriority}</Text>
                </View>
                {showPriorityPicker ? <ChevronUp color={C.textMuted} size={18} /> : <ChevronDown color={C.textMuted} size={18} />}
              </TouchableOpacity>
              {showPriorityPicker && (
                <View style={s.pickerMenu}>
                  {PRIORITY_OPTIONS.map(opt => (
                    <TouchableOpacity key={opt} style={s.pickerOption} onPress={() => { setFPriority(opt); setShowPriorityPicker(false); }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={[s.dot, { backgroundColor: PRIORITY_COLORS[opt] }]} />
                        <Text style={[s.pickerOptionText, fPriority === opt && { color: C.gold }]}>{opt}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
                <Text style={s.saveBtnText}>{editingId ? 'Update Reminder' : 'Save Reminder'}</Text>
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#06080D' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(240, 165, 0, 0.18)', backgroundColor: 'rgba(10, 10, 10, 0.92)'
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.white, letterSpacing: 0.3 },
  backBtn: { padding: 4 },
  addHeaderBtn: { padding: 4 },

  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12, marginBottom: 12
  },
  searchInput: { flex: 1, height: 42, color: C.white, fontSize: 14, ...Platform.select({ web: { outlineStyle: 'none' } }) },

  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', marginRight: 8 },
  chipActive: { backgroundColor: C.gold, borderColor: C.gold },
  chipText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  chipTextActive: { color: C.black, fontWeight: '800' },

  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.035)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 2
  },
  cardDone: { opacity: 0.6 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  priorityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, marginRight: 10 },
  cardMain: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.white, marginBottom: 4, letterSpacing: 0.2 },
  cardDesc: { fontSize: 13, color: '#8E8E93', marginBottom: 6, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  cardMetaText: { fontSize: 12, color: C.textMuted, marginLeft: 4 },
  statusBadge: { alignItems: 'center', gap: 3, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },

  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: C.border
  },
  actionBtnText: { color: C.white, fontSize: 13, fontWeight: '600' },
  actionBtnSuccess: { backgroundColor: C.gold, borderColor: C.gold },
  actionBtnDel: { backgroundColor: 'rgba(244,67,54,0.08)', borderColor: 'rgba(244,67,54,0.3)' },

  emptyState: { paddingTop: 60, alignItems: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, color: C.white, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
  emptyCTA: { marginTop: 20, backgroundColor: C.gold, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  emptyCTAText: { color: C.black, fontWeight: '700', fontSize: 15 },

  fab: {
    position: 'absolute', right: 20, bottom: 32,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.gold, justifyContent: 'center', alignItems: 'center',
    shadowColor: C.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8,
    elevation: 8
  },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderColor: C.border, padding: 20, maxHeight: '90%'
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, color: C.white, fontWeight: '700' },
  modalClose: { fontSize: 15, color: C.gold, fontWeight: '600' },

  label: { fontSize: 12, color: C.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1,
    borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10,
    color: C.white, fontSize: 14
  },

  picker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1,
    borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12
  },
  pickerText: { fontSize: 14, color: C.white },
  pickerMenu: { backgroundColor: 'rgba(15,15,15,0.98)', borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginTop: 4 },
  pickerOption: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerOptionText: { fontSize: 14, color: C.white },
  dot: { width: 10, height: 10, borderRadius: 5 },

  errorText: { color: '#EF4444', fontSize: 13, marginBottom: 8, fontWeight: '500' },

  saveBtn: { backgroundColor: C.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: C.black, fontWeight: '700', fontSize: 15 }
});
