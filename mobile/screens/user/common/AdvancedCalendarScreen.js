import React, { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Modal, TextInput, Alert, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../../../constants/theme';
import {
  ChevronLeft, ChevronRight, Plus, PenLine, Trash2, Check,
  Calendar, Clock, RotateCcw, Tag, AlertTriangle, CheckCircle,
  Timer, AlarmClock, Search, X
} from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import ParticleBackground from '../../../components/ParticleBackground';
import SecurityFooter from '../../../components/SecurityFooter';
import {
  getEvents, addEvent, updateEvent, deleteEvent, completeEvent,
  expandRecurring, getEventStatus, validateDate, validateTime,
  formatDisplayDate, formatDisplayTime, toDateStr, todayStr,
  MONTH_NAMES, DAY_NAMES, EVENT_CATEGORIES, REPEAT_OPTIONS, PRIORITY_OPTIONS
} from '../../../services/calendarService';

const PRIORITY_COLORS = { Low: '#22C55E', Medium: '#F0A500', High: '#F97316', Urgent: '#EF4444' };
const STATUS_COLORS = { Today: '#F0A500', Upcoming: '#22C55E', Overdue: '#EF4444', Completed: '#606060' };
const FILTER_TABS = ['All', 'Today', 'Upcoming', 'Overdue', 'Completed'];

function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const grid = [];
  let day = 1 - firstDay;
  for (let row = 0; row < 6; row++) {
    const week = [];
    for (let col = 0; col < 7; col++, day++) {
      if (day < 1 || day > daysInMonth) week.push(null);
      else week.push(day);
    }
    grid.push(week);
    if (day > daysInMonth) break;
  }
  return grid;
}

// ─── Form State Default ───
const BLANK_FORM = { title: '', description: '', date: todayStr(), time: '', repeat: 'One Time', category: 'Personal', priority: 'Medium' };

export default function AdvancedCalendarScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const today = new Date();

  const [curYear, setCurYear] = useState(today.getFullYear());
  const [curMonth, setCurMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [allEvents, setAllEvents] = useState([]);

  // List-view filter
  const [listFilter, setListFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form modal
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [formError, setFormError] = useState('');
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  // Detail modal
  const [detailEvent, setDetailEvent] = useState(null);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [pendingScopeAction, setPendingScopeAction] = useState(null); // {type:'delete'|'edit', updates?}

  const load = useCallback(async () => {
    if (!user?.user_id) return;
    const evts = await getEvents(user.user_id);
    setAllEvents(evts);
  }, [user?.user_id]);

  useEffect(() => { load(); }, [load]);
  // Also reload on focus so Dashboard-added events appear
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Dots on calendar grid ──
  const dotsMap = useMemo(() => {
    const map = {};
    allEvents.forEach(ev => {
      const dates = expandRecurring(ev, { year: curYear, month: curMonth });
      dates.forEach(d => { map[d] = (map[d] || 0) + 1; });
    });
    return map;
  }, [allEvents, curYear, curMonth]);

  const grid = useMemo(() => buildCalendarGrid(curYear, curMonth), [curYear, curMonth]);

  // ── Selected date events ──
  const selectedDateEvents = useMemo(() =>
    allEvents.filter(ev => {
      const dates = expandRecurring(ev, {
        year: parseInt(selectedDate.slice(0, 4)),
        month: parseInt(selectedDate.slice(5, 7))
      });
      return dates.includes(selectedDate);
    }), [allEvents, selectedDate]);

  // ── List-view (all events with filter + search) ──
  const filteredListEvents = useMemo(() => {
    let list = [...allEvents];
    const q = searchQuery.toLowerCase();
    if (q) {
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }
    if (listFilter !== 'All') {
      list = list.filter(e => getEventStatus(e) === listFilter);
    }
    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [allEvents, listFilter, searchQuery]);

  // ── Month navigation ──
  const prevMonth = () => {
    if (curMonth === 1) { setCurYear(y => y - 1); setCurMonth(12); }
    else setCurMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (curMonth === 12) { setCurYear(y => y + 1); setCurMonth(1); }
    else setCurMonth(m => m + 1);
  };

  // ── Date/Time display ↔ storage helpers ──
  const toDisplay = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };
  const fromDisplay = (disp) => {
    const digits = disp.replace(/[^0-9]/g, '');
    if (digits.length !== 8) return null;
    const d = digits.slice(0, 2), m = digits.slice(2, 4), y = digits.slice(4, 8);
    const iso = `${y}-${m}-${d}`;
    return validateDate(iso) ? iso : null;
  };
  const to12h = (t24) => {
    if (!t24) return '';
    const [h, min] = t24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`;
  };
  const from12h = (t12) => {
    if (!t12 || !t12.trim()) return ''; // time is optional
    const match = t12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    const min = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  // ── Form helpers ──
  const openAdd = (date) => {
    setForm({ ...BLANK_FORM, date: toDisplay(date || selectedDate) });
    setEditingId(null); setFormError('');
    setShowRepeatPicker(false); setShowCatPicker(false); setShowPriorityPicker(false);
    setShowForm(true);
  };

  const openEdit = (ev) => {
    setForm({
      title: ev.title, description: ev.description || '',
      date: toDisplay(ev.date), time: to12h(ev.time) || '', repeat: ev.repeat,
      category: ev.category || 'Personal', priority: ev.priority || 'Medium'
    });
    setEditingId(ev.id); setFormError('');
    setShowRepeatPicker(false); setShowCatPicker(false); setShowPriorityPicker(false);
    setDetailEvent(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setFormError('Title is required.'); return; }
    const isoDate = fromDisplay(form.date);
    if (!isoDate) { setFormError('Invalid date. Enter as DD/MM/YYYY (e.g. 15/09/2026).'); return; }
    const time24 = form.time.trim() ? from12h(form.time) : '';
    if (time24 === null) { setFormError('Invalid time. Enter as HH:MM AM/PM (e.g. 09:30 AM).'); return; }
    setFormError('');

    try {
      const saveData = { ...form, date: isoDate, time: time24 };
      if (editingId) {
        // If recurring, ask scope
        const existing = allEvents.find(e => e.id === editingId);
        if (existing?.seriesId && existing?.repeat !== 'One Time') {
          setPendingScopeAction({ type: 'edit', updates: saveData });
          setShowScopeModal(true);
          return;
        }
        await updateEvent(user.user_id, editingId, saveData);
      } else {
        await addEvent(user.user_id, saveData);
      }
      setShowForm(false);
      load();
    } catch (e) {
      setFormError('Failed to save event.');
    }
  };

  const handleDelete = (ev) => {
    const doDelete = async (scope) => {
      await deleteEvent(user.user_id, ev.id, scope);
      setDetailEvent(null);
      load();
    };

    if (ev.seriesId && ev.repeat !== 'One Time') {
      setPendingScopeAction({ type: 'delete', event: ev });
      setShowScopeModal(true);
      return;
    }

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${ev.title}"?\nThis cannot be undone.`)) doDelete('this');
    } else {
      Alert.alert('Delete Event', `Delete "${ev.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => doDelete('this') }
      ]);
    }
  };

  const handleComplete = async (ev) => {
    await completeEvent(user.user_id, ev.id);
    setDetailEvent(null);
    load();
  };

  const handleScopeChoice = async (scope) => {
    setShowScopeModal(false);
    if (!pendingScopeAction) return;
    const { type, event: ev, updates } = pendingScopeAction;
    if (type === 'delete') {
      await deleteEvent(user.user_id, ev?.id || detailEvent?.id, scope);
      setDetailEvent(null);
    } else if (type === 'edit') {
      await updateEvent(user.user_id, editingId, updates, scope);
      setShowForm(false);
    }
    setPendingScopeAction(null);
    load();
  };

  const todayDateStr = todayStr();
  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const StatusIcon = ({ status, size = 16 }) => {
    if (status === 'Completed') return <CheckCircle color="#606060" size={size} />;
    if (status === 'Overdue') return <AlertTriangle color="#EF4444" size={size} />;
    if (status === 'Today') return <AlarmClock color="#F0A500" size={size} />;
    return <Timer color="#22C55E" size={size} />;
  };

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />

      {/* ── HEADER ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ChevronLeft color={C.white} size={28} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Advanced Calendar</Text>
        <TouchableOpacity onPress={() => openAdd()} style={s.backBtn}>
          <Plus color={C.gold} size={26} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* ── MONTH NAVIGATOR ── */}
        <View style={s.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={s.monthNavBtn}>
            <ChevronLeft color={C.white} size={22} />
          </TouchableOpacity>
          <Text style={s.monthTitle}>{MONTH_NAMES[curMonth - 1]} {curYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={s.monthNavBtn}>
            <ChevronRight color={C.white} size={22} />
          </TouchableOpacity>
        </View>

        {/* ── CALENDAR GRID ── */}
        <View style={s.calGrid}>
          {/* Day headers */}
          <View style={s.calRow}>
            {DAY_NAMES.map(d => (
              <View key={d} style={s.calCell}>
                <Text style={s.dayName}>{d}</Text>
              </View>
            ))}
          </View>
          {/* Date rows */}
          {grid.map((week, ri) => (
            <View key={ri} style={s.calRow}>
              {week.map((day, ci) => {
                if (!day) return <View key={ci} style={s.calCell} />;
                const dateStr = toDateStr(curYear, curMonth, day);
                const isToday = dateStr === todayDateStr;
                const isSelected = dateStr === selectedDate;
                const dotCount = dotsMap[dateStr] || 0;
                return (
                  <TouchableOpacity
                    key={ci}
                    style={[s.calCell, isSelected && s.calCellSelected, isToday && !isSelected && s.calCellToday]}
                    onPress={() => setSelectedDate(dateStr)}
                  >
                    <Text style={[s.calDayText, isSelected && s.calDayTextSelected, isToday && !isSelected && { color: C.gold }]}>
                      {day}
                    </Text>
                    {dotCount > 0 && (
                      <View style={s.dotRow}>
                        {[...Array(Math.min(dotCount, 3))].map((_, di) => (
                          <View key={di} style={s.dot} />
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* ── SELECTED DATE EVENTS ── */}
        <View style={s.selectedSection}>
          <View style={s.selectedHeader}>
            <View style={s.selectedHeaderLeft}>
              <Calendar color={C.gold} size={16} />
              <Text style={s.selectedHeaderText}>{formatDisplayDate(selectedDate)}</Text>
            </View>
            <TouchableOpacity style={s.addDateBtn} onPress={() => openAdd(selectedDate)}>
              <Plus color={C.black} size={15} />
              <Text style={s.addDateBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {selectedDateEvents.length === 0 ? (
            <View style={s.emptyDate}>
              <Text style={s.emptyDateText}>No events on this date.</Text>
            </View>
          ) : (
            selectedDateEvents.map(ev => {
              const status = getEventStatus(ev);
              return (
                <TouchableOpacity key={ev.id} style={[s.eventCard, ev.completed && { opacity: 0.55 }]} onPress={() => setDetailEvent(ev)}>
                  <View style={[s.priorityBar, { backgroundColor: PRIORITY_COLORS[ev.priority] }]} />
                  <View style={s.eventCardBody}>
                    <Text style={[s.eventTitle, ev.completed && { textDecorationLine: 'line-through', color: C.textMuted }]}>
                      {ev.title}
                    </Text>
                    <View style={s.eventMeta}>
                      {ev.time ? <><Clock color={C.textMuted} size={12} /><Text style={s.metaText}>{formatDisplayTime(ev.time)}</Text></> : null}
                      {ev.repeat !== 'One Time' ? <><RotateCcw color={C.textMuted} size={12} style={{ marginLeft: 8 }} /><Text style={s.metaText}>{ev.repeat}</Text></> : null}
                      <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[status] + '22', marginLeft: 8 }]}>
                        <Text style={[s.statusBadgeText, { color: STATUS_COLORS[status] }]}>{status}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── DIVIDER ── */}
        <View style={s.divider} />

        {/* ── SEARCH ── */}
        <View style={s.searchRow}>
          <Search color={C.textMuted} size={16} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search events..."
            placeholderTextColor={C.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color={C.textMuted} size={16} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── FILTERS ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {FILTER_TABS.map(f => (
            <TouchableOpacity key={f} style={[s.chip, listFilter === f && s.chipActive]} onPress={() => setListFilter(f)}>
              <Text style={[s.chipText, listFilter === f && s.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── ALL EVENTS LIST ── */}
        <Text style={s.sectionTitle}>ALL EVENTS</Text>
        {filteredListEvents.length === 0 ? (
          <View style={s.emptyAll}>
            <Calendar color={C.textMuted} size={44} />
            <Text style={s.emptyAllTitle}>{searchQuery ? 'No results found' : 'No events yet'}</Text>
            <Text style={s.emptyAllDesc}>
              {searchQuery ? 'Try a different search term.' : 'Tap + to create your first calendar event.'}
            </Text>
          </View>
        ) : (
          filteredListEvents.map(ev => {
            const status = getEventStatus(ev);
            return (
              <TouchableOpacity key={ev.id} style={[s.eventCard, ev.completed && { opacity: 0.55 }]} onPress={() => setDetailEvent(ev)}>
                <View style={[s.priorityBar, { backgroundColor: PRIORITY_COLORS[ev.priority] }]} />
                <View style={s.eventCardBody}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={[s.eventTitle, { flex: 1 }, ev.completed && { textDecorationLine: 'line-through', color: C.textMuted }]}>
                      {ev.title}
                    </Text>
                    <StatusIcon status={status} />
                  </View>
                  <View style={s.eventMeta}>
                    <Calendar color={C.textMuted} size={12} />
                    <Text style={s.metaText}>{formatDisplayDate(ev.date)}</Text>
                    {ev.time ? <><Clock color={C.textMuted} size={12} style={{ marginLeft: 8 }} /><Text style={s.metaText}>{formatDisplayTime(ev.time)}</Text></> : null}
                    {ev.category ? <><Tag color={C.textMuted} size={12} style={{ marginLeft: 8 }} /><Text style={s.metaText}>{ev.category}</Text></> : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 40 }} />
        <SecurityFooter />
      </ScrollView>

      {/* ===================== EVENT FORM MODAL ===================== */}
      <Modal visible={showForm} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>{editingId ? 'Edit Event' : 'New Event'}</Text>
                <TouchableOpacity onPress={() => { setShowForm(false); setFormError(''); }}>
                  <Text style={s.modalClose}>Cancel</Text>
                </TouchableOpacity>
              </View>

              {formError ? <Text style={s.errorText}>{formError}</Text> : null}

              <Text style={s.label}>Title *</Text>
              <TextInput style={s.input} placeholder="Event title..." placeholderTextColor={C.textMuted} value={form.title} onChangeText={v => setField('title', v)} />

              <Text style={s.label}>Description (optional)</Text>
              <TextInput style={[s.input, { height: 64 }]} placeholder="Notes..." placeholderTextColor={C.textMuted} value={form.description} onChangeText={v => setField('description', v)} multiline />

              <Text style={s.label}>Date (DD/MM/YYYY) *</Text>
              <TextInput
                style={[s.input, Platform.select({ web: { outlineStyle: 'none' } })]}
                placeholder="e.g. 15/09/2026"
                placeholderTextColor={C.textMuted}
                value={form.date}
                onChangeText={v => {
                  const digits = v.replace(/[^0-9]/g, '');
                  let formatted = digits;
                  if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
                  if (digits.length > 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
                  setField('date', formatted);
                }}
                keyboardType="numeric" maxLength={10}
              />

              <Text style={s.label}>Time (HH:MM AM/PM, optional)</Text>
              <TextInput
                style={[s.input, Platform.select({ web: { outlineStyle: 'none' } })]}
                placeholder="e.g. 09:30 AM or 02:00 PM"
                placeholderTextColor={C.textMuted}
                value={form.time}
                onChangeText={v => setField('time', v.replace(/[^0-9:APMapm ]/g, '').slice(0, 8))}
                maxLength={8}
              />

              {/* Repeat Picker */}
              <Text style={s.label}>Repeat</Text>
              <TouchableOpacity style={s.picker} onPress={() => { setShowRepeatPicker(!showRepeatPicker); setShowCatPicker(false); setShowPriorityPicker(false); }}>
                <Text style={s.pickerText}>{form.repeat}</Text>
                <ChevronRight color={C.textMuted} size={16} />
              </TouchableOpacity>
              {showRepeatPicker && (
                <View style={s.pickerMenu}>
                  {REPEAT_OPTIONS.map(opt => (
                    <TouchableOpacity key={opt} style={s.pickerOpt} onPress={() => { setField('repeat', opt); setShowRepeatPicker(false); }}>
                      <Text style={[s.pickerOptText, form.repeat === opt && { color: C.gold }]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Category Picker */}
              <Text style={s.label}>Category</Text>
              <TouchableOpacity style={s.picker} onPress={() => { setShowCatPicker(!showCatPicker); setShowRepeatPicker(false); setShowPriorityPicker(false); }}>
                <Text style={s.pickerText}>{form.category}</Text>
                <ChevronRight color={C.textMuted} size={16} />
              </TouchableOpacity>
              {showCatPicker && (
                <View style={s.pickerMenu}>
                  {EVENT_CATEGORIES.map(opt => (
                    <TouchableOpacity key={opt} style={s.pickerOpt} onPress={() => { setField('category', opt); setShowCatPicker(false); }}>
                      <Text style={[s.pickerOptText, form.category === opt && { color: C.gold }]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Priority Picker */}
              <Text style={s.label}>Priority</Text>
              <TouchableOpacity style={s.picker} onPress={() => { setShowPriorityPicker(!showPriorityPicker); setShowRepeatPicker(false); setShowCatPicker(false); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[s.priorityDot, { backgroundColor: PRIORITY_COLORS[form.priority] }]} />
                  <Text style={s.pickerText}>{form.priority}</Text>
                </View>
                <ChevronRight color={C.textMuted} size={16} />
              </TouchableOpacity>
              {showPriorityPicker && (
                <View style={s.pickerMenu}>
                  {PRIORITY_OPTIONS.map(opt => (
                    <TouchableOpacity key={opt} style={s.pickerOpt} onPress={() => { setField('priority', opt); setShowPriorityPicker(false); }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={[s.priorityDot, { backgroundColor: PRIORITY_COLORS[opt] }]} />
                        <Text style={[s.pickerOptText, form.priority === opt && { color: C.gold }]}>{opt}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
                <Text style={s.saveBtnText}>{editingId ? 'Update Event' : 'Save Event'}</Text>
              </TouchableOpacity>
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===================== EVENT DETAIL MODAL ===================== */}
      <Modal visible={!!detailEvent} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            {detailEvent && (() => {
              const status = getEventStatus(detailEvent);
              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={s.modalHeader}>
                    <Text style={s.modalTitle} numberOfLines={2}>{detailEvent.title}</Text>
                    <TouchableOpacity onPress={() => setDetailEvent(null)}>
                      <Text style={s.modalClose}>Close</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[s.statusRow, { borderColor: STATUS_COLORS[status] + '55', backgroundColor: STATUS_COLORS[status] + '11' }]}>
                    <StatusIcon status={status} size={16} />
                    <Text style={[s.statusRowText, { color: STATUS_COLORS[status] }]}>{status}</Text>
                  </View>

                  {[
                    { icon: <Calendar color={C.textMuted} size={15} />, val: formatDisplayDate(detailEvent.date) },
                    detailEvent.time ? { icon: <Clock color={C.textMuted} size={15} />, val: formatDisplayTime(detailEvent.time) } : null,
                    { icon: <RotateCcw color={C.textMuted} size={15} />, val: detailEvent.repeat },
                    { icon: <Tag color={C.textMuted} size={15} />, val: detailEvent.category },
                  ].filter(Boolean).map((row, i) => (
                    <View key={i} style={s.detailRow}>
                      {row.icon}
                      <Text style={s.detailRowText}>{row.val}</Text>
                    </View>
                  ))}

                  <View style={[s.priorityPill, { backgroundColor: PRIORITY_COLORS[detailEvent.priority] + '22', borderColor: PRIORITY_COLORS[detailEvent.priority] + '55' }]}>
                    <View style={[s.priorityDot, { backgroundColor: PRIORITY_COLORS[detailEvent.priority] }]} />
                    <Text style={[s.priorityPillText, { color: PRIORITY_COLORS[detailEvent.priority] }]}>{detailEvent.priority} Priority</Text>
                  </View>

                  {detailEvent.description ? (
                    <Text style={s.detailDesc}>{detailEvent.description}</Text>
                  ) : null}

                  <View style={s.detailActions}>
                    <TouchableOpacity style={s.detailBtn} onPress={() => openEdit(detailEvent)}>
                      <PenLine color={C.white} size={16} />
                      <Text style={s.detailBtnText}>Edit</Text>
                    </TouchableOpacity>
                    {!detailEvent.completed && (
                      <TouchableOpacity style={[s.detailBtn, s.detailBtnSuccess]} onPress={() => handleComplete(detailEvent)}>
                        <Check color={C.black} size={16} />
                        <Text style={[s.detailBtnText, { color: C.black }]}>Done</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[s.detailBtn, s.detailBtnDel]} onPress={() => handleDelete(detailEvent)}>
                      <Trash2 color="#EF4444" size={16} />
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* ===================== RECURRING SCOPE MODAL ===================== */}
      <Modal visible={showScopeModal} transparent animationType="fade">
        <View style={s.scopeOverlay}>
          <View style={s.scopeBox}>
            <Text style={s.scopeTitle}>Recurring Event</Text>
            <Text style={s.scopeDesc}>
              {pendingScopeAction?.type === 'delete'
                ? 'This is a recurring event. What would you like to delete?'
                : 'This is a recurring event. What would you like to update?'}
            </Text>
            <TouchableOpacity style={s.scopeBtn} onPress={() => handleScopeChoice('this')}>
              <Text style={s.scopeBtnText}>This event only</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.scopeBtn, { borderColor: C.gold }]} onPress={() => handleScopeChoice('all')}>
              <Text style={[s.scopeBtnText, { color: C.gold }]}>All events in series</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowScopeModal(false); setPendingScopeAction(null); }}>
              <Text style={s.scopeCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: 'rgba(5,5,5,0.9)'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.white },
  backBtn: { padding: 4 },
  scroll: { padding: 14, paddingBottom: 60 },

  // Month nav
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthNavBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: C.border },
  monthTitle: { fontSize: 17, fontWeight: '700', color: C.white },

  // Calendar grid
  calGrid: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 8, marginBottom: 16 },
  calRow: { flexDirection: 'row' },
  calCell: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
  calCellSelected: { backgroundColor: C.gold },
  calCellToday: { borderWidth: 1, borderColor: C.gold },
  dayName: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  calDayText: { fontSize: 14, color: C.white, fontWeight: '500' },
  calDayTextSelected: { color: C.black, fontWeight: '800' },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold },

  // Selected date section
  selectedSection: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 16 },
  selectedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  selectedHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectedHeaderText: { fontSize: 15, color: C.white, fontWeight: '600' },
  addDateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.gold, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addDateBtnText: { color: C.black, fontWeight: '700', fontSize: 13 },
  emptyDate: { paddingVertical: 16, alignItems: 'center' },
  emptyDateText: { color: C.textMuted, fontSize: 13 },

  // Event card
  eventCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, borderWidth: 1, borderColor: C.border, marginBottom: 8, overflow: 'hidden' },
  priorityBar: { width: 4 },
  eventCardBody: { flex: 1, padding: 12 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: C.white, marginBottom: 4 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: C.textMuted, marginLeft: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  // Divider
  divider: { height: 1, backgroundColor: C.border, marginVertical: 16 },

  // Search
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, height: 42, color: C.white, fontSize: 14, ...Platform.select({ web: { outlineStyle: 'none' } }) },

  // Filter chips
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border, marginRight: 8 },
  chipActive: { backgroundColor: C.gold, borderColor: C.gold },
  chipText: { fontSize: 13, color: C.textMuted, fontWeight: '500' },
  chipTextActive: { color: C.black, fontWeight: '700' },

  sectionTitle: { fontSize: 11, color: C.textMuted, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },

  // Empty all
  emptyAll: { alignItems: 'center', paddingVertical: 40 },
  emptyAllTitle: { fontSize: 17, color: C.white, fontWeight: '600', marginTop: 12 },
  emptyAllDesc: { fontSize: 13, color: C.textMuted, textAlign: 'center', marginTop: 6 },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: C.border, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
  modalTitle: { fontSize: 18, color: C.white, fontWeight: '700', flex: 1 },
  modalClose: { fontSize: 15, color: C.gold, fontWeight: '600' },

  label: { fontSize: 12, color: C.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10, color: C.white, fontSize: 14 },
  errorText: { color: '#EF4444', fontSize: 13, marginBottom: 8, fontWeight: '500' },

  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12 },
  pickerText: { fontSize: 14, color: C.white },
  pickerMenu: { backgroundColor: 'rgba(10,10,10,0.98)', borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginTop: 4 },
  pickerOpt: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerOptText: { fontSize: 14, color: C.white },

  saveBtn: { backgroundColor: C.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 22 },
  saveBtnText: { color: C.black, fontWeight: '700', fontSize: 15 },

  priorityDot: { width: 10, height: 10, borderRadius: 5 },

  // Detail modal
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 14 },
  statusRowText: { fontWeight: '700', fontSize: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  detailRowText: { fontSize: 14, color: C.white },
  priorityPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, marginTop: 14, alignSelf: 'flex-start' },
  priorityPillText: { fontSize: 13, fontWeight: '600' },
  detailDesc: { fontSize: 13, color: C.textMuted, marginTop: 14, lineHeight: 20 },
  detailActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  detailBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: C.border },
  detailBtnText: { color: C.white, fontWeight: '600', fontSize: 14 },
  detailBtnSuccess: { backgroundColor: C.gold, borderColor: C.gold },
  detailBtnDel: { flex: 0.5, backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' },

  // Scope modal
  scopeOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 },
  scopeBox: { backgroundColor: C.bg, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 24 },
  scopeTitle: { fontSize: 17, fontWeight: '700', color: C.white, marginBottom: 8 },
  scopeDesc: { fontSize: 14, color: C.textMuted, marginBottom: 20, lineHeight: 22 },
  scopeBtn: { paddingVertical: 13, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  scopeBtnText: { color: C.white, fontWeight: '600', fontSize: 14 },
  scopeCancel: { textAlign: 'center', color: C.textMuted, marginTop: 8, fontSize: 14 },
});
