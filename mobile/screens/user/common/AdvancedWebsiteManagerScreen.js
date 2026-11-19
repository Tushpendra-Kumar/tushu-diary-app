import React, { useContext, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Modal, ActivityIndicator,
  Alert, Platform, Linking, FlatList, KeyboardAvoidingView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../../../constants/theme';
import {
  ChevronLeft, Plus, Search, X, Globe, Star, ExternalLink,
  Edit3, Trash2, ChevronDown, Filter, ArrowUpDown, Heart,
  Link2, Tag, FileText, SlidersHorizontal, CheckCircle
} from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import ParticleBackground from '../../../components/ParticleBackground';
import SecurityFooter from '../../../components/SecurityFooter';
import {
  getWebsiteLinks, addWebsiteLink, updateWebsiteLink, deleteWebsiteLink
} from '../../../services/personalDataService';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Entertainment', 'Work', 'Education', 'Finance', 'Shopping', 'Tools', 'Social', 'Personal', 'Other'];
const SORT_OPTIONS = [
  { key: 'newest',    label: 'Recently Added'   },
  { key: 'updated',   label: 'Recently Updated'  },
  { key: 'az',        label: 'Name A–Z'          },
  { key: 'za',        label: 'Name Z–A'          },
  { key: 'favorites', label: 'Favorites First'   },
];

// ── URL helpers ───────────────────────────────────────────────────────────────
const normalizeURL = (input) => {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  // bare domain like "example.com"
  if (/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+/i.test(trimmed)) return `https://${trimmed}`;
  return '';
};

const isValidURL = (url) => {
  if (!url) return false;
  try { new URL(url); return true; } catch { return false; }
};

const getDomain = (url) => {
  try { return new URL(url).hostname.replace(/^www\./i, ''); } catch { return url; }
};

const openURL = async (url) => {
  try {
    if (Platform.OS === 'web') { window.open(url, '_blank', 'noopener,noreferrer'); return true; }
    const ok = await Linking.canOpenURL(url);
    if (ok) { await Linking.openURL(url); return true; }
    return false;
  } catch { return false; }
};

// ── Empty & No-results states ─────────────────────────────────────────────────
const EmptyState = ({ onAdd }) => (
  <View style={s.emptyWrap}>
    <Globe color={C.textMuted} size={56} />
    <Text style={s.emptyTitle}>No websites saved yet</Text>
    <Text style={s.emptySub}>Add your useful websites and keep them ready for later.</Text>
    <TouchableOpacity style={s.emptyBtn} onPress={onAdd}>
      <Plus color={C.black} size={18} /><Text style={s.emptyBtnText}>Add Website</Text>
    </TouchableOpacity>
  </View>
);

const NoResults = ({ onClear }) => (
  <View style={s.emptyWrap}>
    <Search color={C.textMuted} size={48} />
    <Text style={s.emptyTitle}>No websites found</Text>
    <Text style={s.emptySub}>Try a different keyword or reset the filter.</Text>
    <TouchableOpacity style={s.emptyBtn} onPress={onClear}>
      <X color={C.black} size={16} /><Text style={s.emptyBtnText}>Clear Filter</Text>
    </TouchableOpacity>
  </View>
);

// ── Add/Edit Modal ─────────────────────────────────────────────────────────────
const FORM_INIT = { name: '', url: '', purpose: '', category: 'Personal', notes: '' };

const AddEditModal = ({ visible, editing, onClose, onSave }) => {
  const [form, setForm]     = useState(FORM_INIT);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setForm(editing ? { name: editing.name||'', url: editing.url||'', purpose: editing.purpose||'', category: editing.category||'Personal', notes: editing.notes||'' } : FORM_INIT);
      setErrors({});
      setSaving(false);
      setShowCatPicker(false);
    }
  }, [visible, editing]);

  const field = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Website name is required.';
    const normalized = normalizeURL(form.url);
    if (!form.url.trim()) errs.url = 'URL is required.';
    else if (!normalized || !isValidURL(normalized)) errs.url = 'Enter a valid URL (e.g. https://example.com)';
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    await onSave({ ...form, url: normalizeURL(form.url) });
    setSaving(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.header}>
              <Text style={m.title}>{editing ? 'Edit Website' : 'Add Website'}</Text>
              <TouchableOpacity onPress={onClose}><X color={C.white} size={22} /></TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Name */}
              <Text style={m.label}>Website Name <Text style={m.req}>*</Text></Text>
              <TextInput style={[m.input, errors.name && m.inputErr]} placeholder="e.g. Netflix" placeholderTextColor={C.textMuted} value={form.name} onChangeText={v => field('name', v)} maxLength={100} />
              {errors.name ? <Text style={m.errText}>{errors.name}</Text> : null}

              {/* URL */}
              <Text style={m.label}>Website URL <Text style={m.req}>*</Text></Text>
              <TextInput style={[m.input, errors.url && m.inputErr]} placeholder="https://example.com or www.example.com" placeholderTextColor={C.textMuted} value={form.url} onChangeText={v => { field('url', v); if (errors.url) setErrors(p=>({...p,url:''})); }} autoCapitalize="none" autoCorrect={false} keyboardType="url" maxLength={500} />
              {errors.url ? <Text style={m.errText}>{errors.url}</Text> : null}

              {/* Purpose */}
              <Text style={m.label}>Purpose / Description</Text>
              <TextInput style={m.input} placeholder="What is this website for?" placeholderTextColor={C.textMuted} value={form.purpose} onChangeText={v => field('purpose', v)} maxLength={200} />

              {/* Category */}
              <Text style={m.label}>Category</Text>
              <TouchableOpacity style={[m.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]} onPress={() => setShowCatPicker(p => !p)}>
                <Text style={{ color: C.white, fontSize: 14 }}>{form.category}</Text>
                <ChevronDown color={C.gold} size={16} />
              </TouchableOpacity>
              {showCatPicker && (
                <View style={m.catMenu}>
                  {CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <TouchableOpacity key={cat} style={m.catOpt} onPress={() => { field('category', cat); setShowCatPicker(false); }}>
                      <Text style={[m.catOptText, form.category === cat && { color: C.gold, fontWeight: '700' }]}>{cat}</Text>
                      {form.category === cat && <CheckCircle color={C.gold} size={15} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Notes */}
              <Text style={m.label}>Notes (optional)</Text>
              <TextInput style={[m.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Additional notes..." placeholderTextColor={C.textMuted} value={form.notes} onChangeText={v => field('notes', v)} multiline maxLength={500} />

              <TouchableOpacity style={[m.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={C.black} size="small" /> : <CheckCircle color={C.black} size={18} />}
                <Text style={m.saveBtnText}>{saving ? 'Saving...' : editing ? 'Update Website' : 'Save Website'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Website Card ──────────────────────────────────────────────────────────────
const WebsiteCard = ({ item, onOpen, onEdit, onDelete, onFavorite }) => (
  <View style={s.card}>
    <View style={s.cardTop}>
      <View style={s.cardIconWrap}>
        <Globe color={C.gold} size={22} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={s.cardDomain} numberOfLines={1}>{getDomain(item.url)}</Text>
      </View>
      <TouchableOpacity style={s.favBtn} onPress={() => onFavorite(item)}>
        <Star color={item.favorite ? C.gold : C.textMuted} size={18} fill={item.favorite ? C.gold : 'none'} />
      </TouchableOpacity>
    </View>

    {item.purpose ? <Text style={s.cardPurpose} numberOfLines={2}>{item.purpose}</Text> : null}

    <View style={s.cardMeta}>
      <View style={s.catBadge}><Text style={s.catBadgeText}>{item.category || 'Other'}</Text></View>
      {item.notes ? <Text style={s.cardNotes} numberOfLines={1}>{item.notes}</Text> : null}
    </View>

    <View style={s.cardActions}>
      <TouchableOpacity style={s.openBtn} onPress={() => onOpen(item)}>
        <ExternalLink color={C.black} size={15} />
        <Text style={s.openBtnText}>Open</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.iconBtn} onPress={() => onEdit(item)}>
        <Edit3 color={C.gold} size={17} />
      </TouchableOpacity>
      <TouchableOpacity style={s.iconBtn} onPress={() => onDelete(item)}>
        <Trash2 color="#EF4444" size={17} />
      </TouchableOpacity>
    </View>
  </View>
);

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────
export default function AdvancedWebsiteManagerScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort]         = useState('newest');
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing]   = useState(null);

  const load = useCallback(async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const data = await getWebsiteLinks(user.user_id);
      setWebsites(Array.isArray(data) ? data : []);
    } catch { setWebsites([]); }
    setLoading(false);
  }, [user?.user_id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Filtered + sorted list
  const displayed = useMemo(() => {
    let list = [...websites];
    // category filter
    if (category !== 'All') list = list.filter(w => w.category === category);
    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(w =>
        (w.name||'').toLowerCase().includes(q) ||
        (w.url||'').toLowerCase().includes(q) ||
        (w.purpose||'').toLowerCase().includes(q) ||
        (w.notes||'').toLowerCase().includes(q)
      );
    }
    // sort
    switch (sort) {
      case 'updated':   list.sort((a,b) => (b.updatedAt||b.createdAt||'').localeCompare(a.updatedAt||a.createdAt||'')); break;
      case 'az':        list.sort((a,b) => (a.name||'').localeCompare(b.name||'')); break;
      case 'za':        list.sort((a,b) => (b.name||'').localeCompare(a.name||'')); break;
      case 'favorites': list.sort((a,b) => (b.favorite?1:0)-(a.favorite?1:0)); break;
      default:          list.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||'')); break;
    }
    return list;
  }, [websites, category, search, sort]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleSave = async (form) => {
    try {
      if (editing) {
        await updateWebsiteLink(user.user_id, editing.id, { ...form, updatedAt: new Date().toISOString() });
      } else {
        await addWebsiteLink(user.user_id, form);
      }
      await load();
      setModalVisible(false);
      setEditing(null);
    } catch (e) {}
  };

  const handleEdit = (item) => { setEditing(item); setModalVisible(true); };

  const handleDelete = (item) => {
    const doDelete = async () => {
      try { await deleteWebsiteLink(user.user_id, item.id); await load(); } catch {}
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${item.name}"?`)) doDelete();
    } else {
      Alert.alert('Delete Website', `Delete "${item.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete }
      ]);
    }
  };

  const handleFavorite = async (item) => {
    try {
      await updateWebsiteLink(user.user_id, item.id, { favorite: !item.favorite, updatedAt: new Date().toISOString() });
      await load();
    } catch {}
  };

  const handleOpen = async (item) => {
    const ok = await openURL(item.url);
    if (!ok) {
      if (Platform.OS === 'web') window.alert('Could not open the URL. Please check it is valid.');
      else Alert.alert('Cannot Open', 'Could not open the URL. Please check it is valid.');
    }
  };

  const resetFilters = () => { setSearch(''); setCategory('All'); };

  const isFiltered = search.trim() || category !== 'All';

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />

      {/* HEADER */}
      <View style={s.header}>
        <View style={{ width: 28 }} />
        <Text style={s.headerTitle}>Website & Link Manager</Text>
        <TouchableOpacity style={s.addIconBtn} onPress={() => { setEditing(null); setModalVisible(true); }}>
          <Plus color={C.gold} size={24} />
        </TouchableOpacity>
      </View>

      {/* SEARCH + CONTROLS */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Search color={C.textMuted} size={18} />
          <TextInput
            style={s.searchInput}
            placeholder="Search websites, links or purpose..."
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><X color={C.textMuted} size={16} /></TouchableOpacity> : null}
        </View>
        <View style={s.controlRow}>
          {/* Filter by category */}
          <TouchableOpacity style={s.ctrlBtn} onPress={() => { setShowFilter(p=>!p); setShowSort(false); }}>
            <Filter color={C.gold} size={14} />
            <Text style={s.ctrlBtnText}>{category}</Text>
            <ChevronDown color={C.gold} size={12} />
          </TouchableOpacity>
          {/* Sort */}
          <TouchableOpacity style={s.ctrlBtn} onPress={() => { setShowSort(p=>!p); setShowFilter(false); }}>
            <ArrowUpDown color={C.gold} size={14} />
            <Text style={s.ctrlBtnText}>{SORT_OPTIONS.find(o=>o.key===sort)?.label || 'Sort'}</Text>
            <ChevronDown color={C.gold} size={12} />
          </TouchableOpacity>
          {/* Count */}
          <Text style={s.countText}>{displayed.length} site{displayed.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* Category dropdown */}
        {showFilter && (
          <View style={s.dropdown}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat} style={s.dropOpt} onPress={() => { setCategory(cat); setShowFilter(false); }}>
                <Text style={[s.dropOptText, category===cat && { color: C.gold, fontWeight:'700' }]}>{cat}</Text>
                {category===cat && <CheckCircle color={C.gold} size={14} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Sort dropdown */}
        {showSort && (
          <View style={s.dropdown}>
            {SORT_OPTIONS.map(o => (
              <TouchableOpacity key={o.key} style={s.dropOpt} onPress={() => { setSort(o.key); setShowSort(false); }}>
                <Text style={[s.dropOptText, sort===o.key && { color: C.gold, fontWeight:'700' }]}>{o.label}</Text>
                {sort===o.key && <CheckCircle color={C.gold} size={14} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* MAIN CONTENT */}
      {loading ? (
        <View style={s.centerState}>
          <ActivityIndicator color={C.gold} size="large" />
        </View>
      ) : websites.length === 0 ? (
        <ScrollView contentContainerStyle={{ flex: 1 }}>
          <EmptyState onAdd={() => { setEditing(null); setModalVisible(true); }} />
          <SecurityFooter />
        </ScrollView>
      ) : displayed.length === 0 ? (
        <ScrollView contentContainerStyle={{ flex: 1 }}>
          <NoResults onClear={resetFilters} />
          <SecurityFooter />
        </ScrollView>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <WebsiteCard
              item={item}
              onOpen={handleOpen}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onFavorite={handleFavorite}
            />
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={<><SecurityFooter /><View style={{height:40}}/></>}
        />
      )}

      {/* ADD/EDIT MODAL */}
      <AddEditModal
        visible={modalVisible}
        editing={editing}
        onClose={() => { setModalVisible(false); setEditing(null); }}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#06080D' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: 'rgba(5,5,5,0.9)'
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.white, flex: 1, textAlign: 'center' },
  backBtn: { padding: 4 },
  addIconBtn: { padding: 4 },

  searchWrap: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4, zIndex: 20 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, height: 46, marginBottom: 8
  },
  searchInput: { flex: 1, color: C.white, fontSize: 14, ...Platform.select({ web: { outlineStyle: 'none' } }) },

  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  ctrlBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 7
  },
  ctrlBtnText: { fontSize: 12, color: C.white, maxWidth: 90 },
  countText: { marginLeft: 'auto', fontSize: 12, color: C.textMuted },

  dropdown: {
    position: 'absolute', top: 90, left: 0, right: 0, zIndex: 100,
    backgroundColor: 'rgba(10,10,10,0.98)', borderRadius: 10,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden'
  },
  dropOpt: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border
  },
  dropOptText: { fontSize: 14, color: C.white },

  list: { padding: 14, paddingBottom: 20 },

  card: {
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 10
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  cardIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(240,165,0,0.12)', justifyContent: 'center', alignItems: 'center' },
  cardName: { fontSize: 15, fontWeight: '700', color: C.white },
  cardDomain: { fontSize: 12, color: C.gold, marginTop: 2 },
  favBtn: { padding: 4 },
  cardPurpose: { fontSize: 13, color: C.textMuted, lineHeight: 18, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' },
  catBadge: { backgroundColor: 'rgba(240,165,0,0.12)', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(240,165,0,0.3)', paddingHorizontal: 8, paddingVertical: 3 },
  catBadgeText: { fontSize: 11, color: C.gold, fontWeight: '700' },
  cardNotes: { fontSize: 12, color: C.textMuted, flex: 1 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  openBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: C.gold, borderRadius: 8, paddingVertical: 9
  },
  openBtnText: { color: C.black, fontWeight: '700', fontSize: 13 },
  iconBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },

  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.white, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.gold, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { color: C.black, fontWeight: '700', fontSize: 14 },
});

// ── Modal styles ──────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0A0A0A', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: C.border, maxHeight: '92%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { fontSize: 17, fontWeight: '700', color: C.white },
  label: { fontSize: 13, color: C.textMuted, marginTop: 14, marginBottom: 6, fontWeight: '600' },
  req: { color: '#EF4444' },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, color: C.white, fontSize: 14, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  inputErr: { borderColor: '#EF4444' },
  errText: { color: '#EF4444', fontSize: 12, marginTop: 4 },
  catMenu: { backgroundColor: 'rgba(10,10,10,0.98)', borderRadius: 10, borderWidth: 1, borderColor: C.border, marginTop: 6, overflow: 'hidden' },
  catOpt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  catOptText: { fontSize: 14, color: C.white },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.gold, borderRadius: 12, paddingVertical: 15, marginTop: 20 },
  saveBtnText: { color: C.black, fontWeight: '800', fontSize: 15 },
});
