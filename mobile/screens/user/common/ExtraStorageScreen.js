import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  Modal, TextInput, Alert, ActivityIndicator, FlatList, Platform
} from 'react-native';
import { C } from '../../../constants/theme';
import {
  ChevronLeft, Paperclip, Upload, Trash2, FileText, Image as ImageIcon,
  Search, Filter, RotateCcw, HardDrive, CloudOff, ChevronDown, ChevronUp,
  Eye, PenLine, Info, FolderOpen
} from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import ParticleBackground from '../../../components/ParticleBackground';
import SecurityFooter from '../../../components/SecurityFooter';
import {
  getAttachments, addAttachment, deleteAttachment, updateAttachment,
  getStorageStats, formatBytes, pickFile, MODULES
} from '../../../services/attachmentService';

const SORT_OPTIONS = ['Newest First', 'Oldest First', 'Name A–Z', 'Largest First'];
const FILTER_OPTIONS = ['All', 'Images', 'Documents', 'Recent', 'Largest Files'];

export default function ExtraStorageScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const [attachments, setAttachments] = useState([]);
  const [stats, setStats] = useState({ totalFiles: 0, totalSize: 0, imageCount: 0, docCount: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Search / Filter / Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeSort, setActiveSort] = useState('Newest First');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Add Attachment Modal
  const [addModal, setAddModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingDesc, setPendingDesc] = useState('');
  const [pendingModule, setPendingModule] = useState('General / Personal');
  const [showModulePicker, setShowModulePicker] = useState(false);

  // Detail Modal
  const [detailItem, setDetailItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMode, setEditMode] = useState(false);

  const load = useCallback(async () => {
    if (!user?.user_id) return;
    setLoading(true);
    const list = await getAttachments(user.user_id);
    setAttachments(list);
    const s = await getStorageStats(user.user_id);
    setStats(s);
    setLoading(false);
  }, [user?.user_id]);

  useEffect(() => { load(); }, [load]);

  const handlePickFile = async () => {
    try {
      const file = await pickFile();
      if (!file) return;
      setPendingFile(file);
      setPendingDesc('');
      setPendingModule('General / Personal');
      setAddModal(true);
    } catch (e) {
      if (Platform.OS === 'web') window.alert('Error: ' + e.message);
      else Alert.alert('Error', e.message);
    }
  };

  const handleSaveAttachment = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const fileData = { ...pendingFile, description: pendingDesc, module: pendingModule };
      await addAttachment(user.user_id, fileData);
      setAddModal(false);
      setPendingFile(null);
      load();
    } catch (e) {
      if (e.message === 'DUPLICATE') {
        const proceed = Platform.OS === 'web'
          ? window.confirm('A similar file already exists. Add anyway?')
          : await new Promise(res => Alert.alert('Duplicate File', 'A similar file already exists. Add anyway?', [
              { text: 'Cancel', onPress: () => res(false), style: 'cancel' },
              { text: 'Add Anyway', onPress: () => res(true) }
            ]));
        if (proceed) {
          // Force add by temporarily renaming
          const forceFile = { ...pendingFile, name: pendingFile.name + '_copy', description: pendingDesc, module: pendingModule };
          await addAttachment(user.user_id, forceFile);
          setAddModal(false);
          setPendingFile(null);
          load();
        }
      } else {
        if (Platform.OS === 'web') window.alert('Upload failed: ' + e.message);
        else Alert.alert('Upload Failed', e.message);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (item) => {
    const doDelete = async () => {
      await deleteAttachment(user.user_id, item.id);
      setDetailItem(null);
      load();
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this attachment permanently?\n\nThis action cannot be undone.')) doDelete();
    } else {
      Alert.alert(
        'Delete Attachment',
        'Delete this attachment permanently?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete }
        ]
      );
    }
  };

  const handleSaveEdit = async () => {
    if (!detailItem) return;
    const updated = await updateAttachment(user.user_id, detailItem.id, {
      name: editName.trim() || detailItem.name,
      description: editDesc
    });
    setDetailItem(updated);
    setEditMode(false);
    load();
  };

  const openDetail = (item) => {
    setDetailItem(item);
    setEditName(item.name);
    setEditDesc(item.description || '');
    setEditMode(false);
  };

  // Filter + Sort + Search
  const filteredAndSorted = (() => {
    let list = [...attachments];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.module && a.module.toLowerCase().includes(q))
      );
    }

    // Filter
    if (activeFilter === 'Images') list = list.filter(a => a.type && a.type.startsWith('image/'));
    else if (activeFilter === 'Documents') list = list.filter(a => !a.type || !a.type.startsWith('image/'));
    else if (activeFilter === 'Recent') list = list.filter(a => Date.now() - a.uploadedAt < 7 * 24 * 60 * 60 * 1000);
    else if (activeFilter === 'Largest Files') list = list.sort((a, b) => (b.size || 0) - (a.size || 0));

    // Sort
    if (activeSort === 'Newest First') list.sort((a, b) => b.uploadedAt - a.uploadedAt);
    else if (activeSort === 'Oldest First') list.sort((a, b) => a.uploadedAt - b.uploadedAt);
    else if (activeSort === 'Name A–Z') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (activeSort === 'Largest First') list.sort((a, b) => (b.size || 0) - (a.size || 0));

    return list;
  })();

  const formatDate = (ts) => new Date(ts).toLocaleDateString() + ' ' + new Date(ts).toLocaleTimeString();

  const getFileIcon = (type) => {
    if (type && type.startsWith('image/')) return <ImageIcon color={C.gold} size={22} />;
    return <FileText color={C.gold} size={22} />;
  };

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />

      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={C.white} size={28} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Extra Storage & Attachments</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* STORAGE OVERVIEW */}
        <View style={s.storageCard}>
          <View style={s.storageRow}>
            <View style={s.storageIconWrap}><HardDrive color={C.gold} size={24} /></View>
            <View style={s.storageTextWrap}>
              <Text style={s.storageLabel}>Storage Used</Text>
              <Text style={s.storageValue}>{formatBytes(stats.totalSize)}</Text>
            </View>
            <View style={s.storageTextWrap}>
              <Text style={s.storageLabel}>Total Files</Text>
              <Text style={s.storageValue}>{stats.totalFiles}</Text>
            </View>
          </View>

          <View style={s.storageDivider} />

          <View style={s.storageRow}>
            <View style={s.storageIconWrap}><CloudOff color={C.textMuted} size={22} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.storageLabel}>Cloud Storage</Text>
              <Text style={[s.storageValue, { color: C.textMuted, fontSize: 12 }]}>
                Local device storage active. Cloud integration pending setup.
              </Text>
            </View>
          </View>

          <View style={s.storageBreakRow}>
            <View style={s.storageBreakItem}>
              <ImageIcon color={C.textMuted} size={16} />
              <Text style={s.storageBreakText}>{stats.imageCount} Images</Text>
            </View>
            <View style={s.storageBreakItem}>
              <FileText color={C.textMuted} size={16} />
              <Text style={s.storageBreakText}>{stats.docCount} Documents</Text>
            </View>
          </View>
        </View>

        {/* ADD BUTTON */}
        <TouchableOpacity style={s.addBtn} onPress={handlePickFile}>
          <Upload color={C.black} size={20} />
          <Text style={s.addBtnText}>Add Attachment</Text>
        </TouchableOpacity>

        {/* SEARCH */}
        <View style={s.searchRow}>
          <Search color={C.textMuted} size={18} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by name, description or module..."
            placeholderTextColor={C.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* FILTERS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}>
          {FILTER_OPTIONS.map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterChip, activeFilter === f && s.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[s.filterChipText, activeFilter === f && s.filterChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* SORT */}
        <TouchableOpacity style={s.sortRow} onPress={() => setShowSortMenu(!showSortMenu)}>
          <Filter color={C.textMuted} size={16} />
          <Text style={s.sortText}>Sort: {activeSort}</Text>
          {showSortMenu ? <ChevronUp color={C.textMuted} size={16} /> : <ChevronDown color={C.textMuted} size={16} />}
        </TouchableOpacity>
        {showSortMenu && (
          <View style={s.sortMenu}>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity key={opt} style={s.sortOption} onPress={() => { setActiveSort(opt); setShowSortMenu(false); }}>
                <Text style={[s.sortOptionText, activeSort === opt && { color: C.gold }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ATTACHMENT LIST */}
        {loading ? (
          <ActivityIndicator color={C.gold} size="large" style={{ marginTop: 40 }} />
        ) : filteredAndSorted.length === 0 ? (
          <View style={s.emptyState}>
            <Paperclip size={48} color={C.textMuted} />
            <Text style={s.emptyTitle}>
              {searchQuery || activeFilter !== 'All' ? 'No results found' : 'No attachments yet'}
            </Text>
            <Text style={s.emptyDesc}>
              {searchQuery || activeFilter !== 'All'
                ? 'Try adjusting your search or filter.'
                : 'Keep your important files connected to the things you manage.'}
            </Text>
            {!searchQuery && activeFilter === 'All' && (
              <TouchableOpacity style={s.emptyCTA} onPress={handlePickFile}>
                <Text style={s.emptyCTAText}>Add Attachment</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredAndSorted.map(item => (
            <TouchableOpacity key={item.id} style={s.attachCard} onPress={() => openDetail(item)}>
              <View style={s.attachIconWrap}>{getFileIcon(item.type)}</View>
              <View style={s.attachInfo}>
                <Text style={s.attachName} numberOfLines={1}>{item.name}</Text>
                <Text style={s.attachMeta}>{formatBytes(item.size)} • {item.module}</Text>
                {item.description ? <Text style={s.attachDesc} numberOfLines={1}>{item.description}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: 8 }}>
                <Trash2 color="#F44336" size={18} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
        <SecurityFooter />
      </ScrollView>

      {/* ===================== ADD ATTACHMENT MODAL ===================== */}
      <Modal visible={addModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Attachment</Text>
              <TouchableOpacity onPress={() => { setAddModal(false); setPendingFile(null); }}>
                <Text style={s.modalClose}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {pendingFile && (
              <View style={s.filePreviewCard}>
                <View style={s.filePreviewIcon}>{getFileIcon(pendingFile.type)}</View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.filePreviewName} numberOfLines={2}>{pendingFile.name}</Text>
                  <Text style={s.filePreviewMeta}>{formatBytes(pendingFile.size)} • {pendingFile.type}</Text>
                </View>
              </View>
            )}

            <Text style={s.inputLabel}>Description (optional)</Text>
            <TextInput
              style={s.textInput}
              placeholder="Add a note about this file..."
              placeholderTextColor={C.textMuted}
              value={pendingDesc}
              onChangeText={setPendingDesc}
              multiline
              numberOfLines={2}
            />

            <Text style={s.inputLabel}>Associated Module</Text>
            <TouchableOpacity style={s.modulePicker} onPress={() => setShowModulePicker(true)}>
              <Text style={s.modulePickerText}>{pendingModule}</Text>
              <ChevronDown color={C.textMuted} size={18} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.saveBtn, uploading && { opacity: 0.6 }]}
              onPress={handleSaveAttachment}
              disabled={uploading}
            >
              {uploading ? <ActivityIndicator color={C.black} size="small" /> : <Text style={s.saveBtnText}>Save Attachment</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===================== MODULE PICKER MODAL ===================== */}
      <Modal visible={showModulePicker} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={[s.modalBox, { height: '70%' }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select Module</Text>
              <TouchableOpacity onPress={() => setShowModulePicker(false)}>
                <Text style={s.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {MODULES.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[s.moduleOption, pendingModule === m && s.moduleOptionActive]}
                  onPress={() => { setPendingModule(m); setShowModulePicker(false); }}
                >
                  <Text style={[s.moduleOptionText, pendingModule === m && { color: C.gold }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===================== DETAIL MODAL ===================== */}
      <Modal visible={!!detailItem} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={[s.modalBox, { height: '75%' }]}>
            {detailItem && (
              <>
                <View style={s.modalHeader}>
                  <Text style={s.modalTitle} numberOfLines={1}>File Details</Text>
                  <TouchableOpacity onPress={() => setDetailItem(null)}>
                    <Text style={s.modalClose}>Close</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView>
                  {/* Preview / File icon */}
                  <View style={s.detailPreview}>
                    {detailItem.type && detailItem.type.startsWith('image/') && detailItem.uri ? (
                      // Show image preview for web (data URI)
                      Platform.OS === 'web' ? (
                        <View style={s.detailImgBox}>
                          <img src={detailItem.uri} style={{ width: '100%', height: 180, objectFit: 'contain', borderRadius: 8 }} alt={detailItem.name} />
                        </View>
                      ) : (
                        <View style={s.detailImgBox}>
                          <ImageIcon color={C.gold} size={64} />
                          <Text style={{ color: C.textMuted, marginTop: 8, fontSize: 12 }}>Open with native viewer</Text>
                        </View>
                      )
                    ) : (
                      <View style={s.detailImgBox}>
                        <FileText color={C.gold} size={64} />
                      </View>
                    )}
                  </View>

                  {/* Edit mode */}
                  {editMode ? (
                    <>
                      <Text style={s.inputLabel}>Filename</Text>
                      <TextInput
                        style={s.textInput}
                        value={editName}
                        onChangeText={setEditName}
                        placeholderTextColor={C.textMuted}
                      />
                      <Text style={s.inputLabel}>Description</Text>
                      <TextInput
                        style={s.textInput}
                        value={editDesc}
                        onChangeText={setEditDesc}
                        placeholder="Add a description..."
                        placeholderTextColor={C.textMuted}
                        multiline
                        numberOfLines={3}
                      />
                      <View style={s.detailActions}>
                        <TouchableOpacity style={s.detailSaveBtn} onPress={handleSaveEdit}>
                          <Text style={s.detailSaveBtnText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.detailCancelBtn} onPress={() => setEditMode(false)}>
                          <Text style={s.detailCancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      {/* Info rows */}
                      {[
                        { label: 'Filename', value: detailItem.name },
                        { label: 'File Type', value: detailItem.type },
                        { label: 'File Size', value: formatBytes(detailItem.size) },
                        { label: 'Uploaded', value: formatDate(detailItem.uploadedAt) },
                        { label: 'Module', value: detailItem.module },
                        { label: 'Description', value: detailItem.description || '—' }
                      ].map(r => (
                        <View key={r.label} style={s.infoRow}>
                          <Text style={s.infoRowLabel}>{r.label}</Text>
                          <Text style={s.infoRowValue}>{r.value}</Text>
                        </View>
                      ))}

                      <View style={s.detailActions}>
                        <TouchableOpacity style={s.detailEditBtn} onPress={() => setEditMode(true)}>
                          <PenLine color={C.white} size={16} />
                          <Text style={s.detailEditBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.detailDeleteBtn} onPress={() => handleDelete(detailItem)}>
                          <Trash2 color="#F44336" size={16} />
                          <Text style={s.detailDeleteBtnText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </ScrollView>
              </>
            )}
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
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(240, 165, 0, 0.18)', backgroundColor: 'rgba(10, 10, 10, 0.92)'
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.white, letterSpacing: 0.3 },
  backBtn: { padding: 4 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  storageCard: { 
    backgroundColor: 'rgba(22, 19, 13, 0.92)', borderRadius: 18, 
    borderWidth: 1.5, borderColor: 'rgba(240, 165, 0, 0.45)', padding: 18, marginBottom: 18,
    shadowColor: C.gold, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 3
  },
  storageRow: { flexDirection: 'row', alignItems: 'center' },
  storageIconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: 'rgba(240, 165, 0, 0.15)', borderWidth: 1, borderColor: 'rgba(240, 165, 0, 0.35)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  storageTextWrap: { flex: 1 },
  storageLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 2 },
  storageValue: { fontSize: 16, fontWeight: '700', color: C.white },
  storageDivider: { height: 1, backgroundColor: 'rgba(240, 165, 0, 0.2)', marginVertical: 14 },
  storageBreakRow: { flexDirection: 'row', gap: 20, marginTop: 10 },
  storageBreakItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  storageBreakText: { fontSize: 12, color: '#8E8E93' },

  addBtn: { backgroundColor: C.gold, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  addBtnText: { color: C.black, fontSize: 15, fontWeight: '800', marginLeft: 8 },

  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.035)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', paddingHorizontal: 12, marginBottom: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 42, color: C.white, fontSize: 14, ...Platform.select({ web: { outlineStyle: 'none' } }) },

  filterScroll: { marginBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', marginRight: 8, backgroundColor: 'transparent' },
  filterChipActive: { backgroundColor: C.gold, borderColor: C.gold },
  filterChipText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  filterChipTextActive: { color: C.black, fontWeight: '800' },

  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, marginBottom: 4 },
  sortText: { flex: 1, fontSize: 13, color: '#8E8E93' },
  sortMenu: { backgroundColor: 'rgba(20, 20, 20, 0.95)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', marginBottom: 12, overflow: 'hidden' },
  sortOption: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.06)' },
  sortOptionText: { fontSize: 14, color: C.white },

  attachCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.035)', 
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 2
  },
  attachIconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: 'rgba(240, 165, 0, 0.12)', borderWidth: 1, borderColor: 'rgba(240, 165, 0, 0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  attachInfo: { flex: 1 },
  attachName: { fontSize: 14.5, fontWeight: '700', color: C.white, marginBottom: 3, letterSpacing: 0.2 },
  attachMeta: { fontSize: 12, color: '#8E8E93', marginBottom: 2 },
  attachDesc: { fontSize: 12, color: '#8E8E93', fontStyle: 'italic' },

  emptyState: { paddingTop: 60, alignItems: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, color: C.white, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
  emptyCTA: { marginTop: 20, backgroundColor: C.gold, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  emptyCTAText: { color: C.black, fontWeight: '700', fontSize: 15 },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: C.border, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, color: C.white, fontWeight: '700', flex: 1 },
  modalClose: { fontSize: 15, color: C.gold, fontWeight: '600' },

  filePreviewCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, marginBottom: 16 },
  filePreviewIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(240,165,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  filePreviewName: { fontSize: 14, color: C.white, fontWeight: '600', marginBottom: 2 },
  filePreviewMeta: { fontSize: 12, color: C.textMuted },

  inputLabel: { fontSize: 12, color: C.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6, marginTop: 14 },
  textInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10, color: C.white, fontSize: 14 },

  modulePicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12 },
  modulePickerText: { fontSize: 14, color: C.white },

  saveBtn: { backgroundColor: C.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: C.black, fontWeight: '700', fontSize: 15 },

  moduleOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  moduleOptionActive: { backgroundColor: 'rgba(240,165,0,0.08)' },
  moduleOptionText: { fontSize: 15, color: C.white },

  // Detail modal
  detailPreview: { alignItems: 'center', marginBottom: 16 },
  detailImgBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 20, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: C.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  infoRowLabel: { fontSize: 13, color: C.textMuted, flex: 1 },
  infoRowValue: { fontSize: 13, color: C.white, fontWeight: '500', flex: 2, textAlign: 'right' },
  detailActions: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 8 },
  detailEditBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  detailEditBtnText: { color: C.white, fontWeight: '600', fontSize: 14, marginLeft: 6 },
  detailDeleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(244,67,54,0.08)', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(244,67,54,0.3)' },
  detailDeleteBtnText: { color: '#F44336', fontWeight: '600', fontSize: 14, marginLeft: 6 },
  detailSaveBtn: { flex: 1, backgroundColor: C.gold, alignItems: 'center', paddingVertical: 12, borderRadius: 10 },
  detailSaveBtnText: { color: C.black, fontWeight: '700', fontSize: 14 },
  detailCancelBtn: { flex: 1, borderWidth: 1, borderColor: C.border, alignItems: 'center', paddingVertical: 12, borderRadius: 10 },
  detailCancelBtnText: { color: C.white, fontWeight: '500', fontSize: 14 }
});
