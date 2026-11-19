import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  SafeAreaView, TextInput, ActivityIndicator, Alert, 
  Modal, Platform, Dimensions, Share 
} from 'react-native';
import { 
  FileText, Search, X, Edit3, Eye, Save, RotateCcw, 
  ArrowLeft, CheckCircle2, Copy, FileCode, BookOpen, 
  FolderGit2, Sparkles, RefreshCw, AlertTriangle, ShieldCheck 
} from 'lucide-react-native';
import ParticleBackground from '../../components/ParticleBackground';
import SecurityFooter from '../../components/SecurityFooter';
import { C } from '../../constants/theme';
import { fetchDocsList, fetchDocContent, saveDocContent } from '../../services/adminApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Default manifest used when backend is offline or initial loading
const DEFAULT_DOCS_MANIFEST = [
  { id: 'PROJECT_STATUS.md', name: 'PROJECT_STATUS.md', title: 'Project Status — Single Source of Truth', category: 'Status & Reports', size: 3928, linesCount: 57 },
  { id: 'OBSOLETE_FILES_REPORT.md', name: 'OBSOLETE_FILES_REPORT.md', title: 'Cleanup & Obsolete Files Final Report', category: 'Status & Reports', size: 3750, linesCount: 65 },
  { id: 'ROADMAP.md', name: 'ROADMAP.md', title: 'Project Roadmap & Phase Progress', category: 'Status & Reports', size: 1041, linesCount: 15 },
  { id: 'CHANGELOG.md', name: 'CHANGELOG.md', title: 'Changelog — Release & Module History', category: 'Status & Reports', size: 2915, linesCount: 42 },
  { id: 'QA_TESTING.md', name: 'QA_TESTING.md', title: 'QA & Testing Verification Checklist', category: 'Status & Reports', size: 1566, linesCount: 22 },
  { id: 'PRD.md', name: 'PRD.md', title: 'Product Requirements Document (PRD)', category: 'Specifications & PRD', size: 2272, linesCount: 53 },
  { id: 'PROJECT_OVERVIEW.md', name: 'PROJECT_OVERVIEW.md', title: 'Project Architecture & Design Decisions', category: 'Specifications & PRD', size: 4931, linesCount: 75 },
  { id: 'FEATURES.md', name: 'FEATURES.md', title: 'Complete 21+ Feature & Module Inventory', category: 'Specifications & PRD', size: 3075, linesCount: 35 },
  { id: 'FEATURE_TICKETS.md', name: 'FEATURE_TICKETS.md', title: 'Development Backlog & Feature Tickets', category: 'Specifications & PRD', size: 2171, linesCount: 24 },
  { id: 'DATA_MODEL.md', name: 'DATA_MODEL.md', title: 'Logical Data Model & Storage Schema', category: 'Specifications & PRD', size: 736, linesCount: 26 },
  { id: 'FRONTEND_SPECIFICATION.md', name: 'FRONTEND_SPECIFICATION.md', title: 'Frontend Architecture & Screen Tree', category: 'Technical Architecture', size: 5599, linesCount: 96 },
  { id: 'BACKEND_SPECIFICATION.md', name: 'BACKEND_SPECIFICATION.md', title: 'Backend API Specification & Controllers', category: 'Technical Architecture', size: 3503, linesCount: 65 },
  { id: 'DATABASE_SPECIFICATION.md', name: 'DATABASE_SPECIFICATION.md', title: 'Database Schema & AsyncStorage Map', category: 'Technical Architecture', size: 3283, linesCount: 68 },
  { id: 'API_DOCUMENTATION.md', name: 'API_DOCUMENTATION.md', title: 'REST API Documentation & Endpoints', category: 'Technical Architecture', size: 803, linesCount: 29 },
  { id: 'SECURITY_ACCESS.md', name: 'SECURITY_ACCESS.md', title: 'Security, Encryption & Role Access', category: 'Technical Architecture', size: 2293, linesCount: 40 },
  { id: 'DESIGN_SYSTEM.md', name: 'DESIGN_SYSTEM.md', title: 'Black & Gold Design System Specs', category: 'Technical Architecture', size: 852, linesCount: 20 },
  { id: 'DEPLOYMENT.md', name: 'DEPLOYMENT.md', title: 'Deployment, EAS Build & Release Guide', category: 'Technical Architecture', size: 2014, linesCount: 42 },
  { id: 'README.md', name: 'README.md', title: 'Project Readme & Quickstart', category: 'Project Core', size: 1450, linesCount: 41 },
  { id: 'RELEASE_NOTES.md', name: 'RELEASE_NOTES.md', title: 'Official Production Release Notes', category: 'Project Core', size: 1818, linesCount: 35 }
];

export default function AdminDocsManagerScreen({ navigation }) {
  const [docsList, setDocsList] = useState(DEFAULT_DOCS_MANIFEST);
  const [loadingList, setLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Selected Document State
  const [activeDoc, setActiveDoc] = useState(null);
  const [docContent, setDocContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [savingDoc, setSavingDoc] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Categories
  const categories = ['All', 'Status & Reports', 'Specifications & PRD', 'Technical Architecture', 'Project Core'];

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetchDocsList();
      if (res && res.success && res.data && res.data.length > 0) {
        setDocsList(res.data);
      } else {
        setDocsList(DEFAULT_DOCS_MANIFEST);
      }
    } catch (e) {
      setDocsList(DEFAULT_DOCS_MANIFEST);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // Filtered files
  const filteredDocs = useMemo(() => {
    return docsList.filter(doc => {
      const matchCat = activeCategory === 'All' || doc.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (doc.name && doc.name.toLowerCase().includes(q)) || 
        (doc.title && doc.title.toLowerCase().includes(q)) ||
        (doc.category && doc.category.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [docsList, activeCategory, searchQuery]);

  // Open Document Reader / Editor
  const handleOpenDoc = async (doc, startInEdit = false) => {
    setActiveDoc(doc);
    setIsEditMode(startInEdit);
    setSaveSuccessMsg('');
    setLoadingDoc(true);

    try {
      const res = await fetchDocContent(doc.name);
      if (res && res.success && res.data && res.data.content) {
        setDocContent(res.data.content);
        setOriginalContent(res.data.content);
      } else {
        // Fallback default notice
        const fallback = `# ${doc.title || doc.name}\n\n*File: ${doc.name}*\n\nLoading document content from project storage...`;
        setDocContent(fallback);
        setOriginalContent(fallback);
      }
    } catch (err) {
      Alert.alert('Notice', 'Unable to fetch file directly from server; showing cached template.');
    } finally {
      setLoadingDoc(false);
    }
  };

  // Save Document
  const handleSaveDoc = async () => {
    if (!activeDoc) return;
    setSavingDoc(true);
    setSaveSuccessMsg('');

    try {
      const res = await saveDocContent(activeDoc.name, docContent);
      if (res && res.success) {
        setOriginalContent(docContent);
        setSaveSuccessMsg('Saved successfully to project disk!');
        setTimeout(() => setSaveSuccessMsg(''), 3500);
        // Refresh list to update file size and timestamp
        loadList();
      } else {
        Alert.alert('Save Failed', res.message || 'Could not save file changes.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Network error occurred while saving.');
    } finally {
      setSavingDoc(false);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(docContent);
      setSaveSuccessMsg('Content copied to clipboard!');
      setTimeout(() => setSaveSuccessMsg(''), 2500);
    } else {
      Share.share({ message: docContent }).catch(() => {});
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Status & Reports': return '#10B981';
      case 'Specifications & PRD': return '#F59E0B';
      case 'Technical Architecture': return '#3B82F6';
      case 'Project Core': return '#8B5CF6';
      default: return C.gold;
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />

      {/* ── Top Header Bar ── */}
      <View style={s.topBar}>
        <View style={{ width: 40 }} />
        <View style={s.topBarTitles}>
          <Text style={s.headerTitle}>Files & Documentation Hub</Text>
          <Text style={s.headerSubtitle}>View, Read & Edit Project Reports & Specs</Text>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={loadList} activeOpacity={0.7}>
          <RefreshCw size={18} color={C.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Overview Stat Banner ── */}
        <View style={s.statBanner}>
          <View style={s.statBox}>
            <Text style={s.statVal}>{docsList.length}</Text>
            <Text style={s.statLabel}>TOTAL FILES</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={[s.statVal, { color: '#10B981' }]}>
              {docsList.filter(d => d.category === 'Status & Reports').length}
            </Text>
            <Text style={s.statLabel}>STATUS & REPORTS</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={[s.statVal, { color: '#3B82F6' }]}>
              {docsList.filter(d => d.category === 'Technical Architecture').length}
            </Text>
            <Text style={s.statLabel}>SPECS & TECH</Text>
          </View>
        </View>

        {/* ── Search Input Bar ── */}
        <View style={s.searchWrap}>
          <Search size={18} color={C.gold} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Search files, reports, statuses..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={s.clearBtn}>
              <X size={16} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Category Filter Pills ── */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={s.pillsScroll}
        >
          {categories.map((cat, idx) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={idx}
                style={[s.pill, isActive && s.pillActive]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[s.pillText, isActive && s.pillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Document Cards Grid / List ── */}
        {loadingList ? (
          <View style={s.centerLoader}>
            <ActivityIndicator size="large" color={C.gold} />
            <Text style={s.loaderText}>Scanning project files & reports...</Text>
          </View>
        ) : filteredDocs.length === 0 ? (
          <View style={s.emptyState}>
            <FileText size={42} color="rgba(255, 255, 255, 0.25)" />
            <Text style={s.emptyTitle}>No matching documents found</Text>
            <Text style={s.emptySub}>Try adjusting your search query or filter</Text>
          </View>
        ) : (
          <View style={s.docList}>
            {filteredDocs.map((doc, index) => {
              const catColor = getCategoryColor(doc.category);
              const kbSize = doc.size ? (doc.size / 1024).toFixed(1) + ' KB' : '—';
              
              return (
                <View key={doc.id || index} style={s.docCard}>
                  {/* Card Header Row */}
                  <View style={s.docCardHeader}>
                    <View style={[s.docIconBox, { backgroundColor: catColor + '18', borderColor: catColor + '40' }]}>
                      {doc.category === 'Status & Reports' ? (
                        <CheckCircle2 size={20} color={catColor} />
                      ) : doc.category === 'Technical Architecture' ? (
                        <FileCode size={20} color={catColor} />
                      ) : doc.category === 'Specifications & PRD' ? (
                        <BookOpen size={20} color={catColor} />
                      ) : (
                        <FolderGit2 size={20} color={catColor} />
                      )}
                    </View>
                    <View style={s.docCardTitleWrap}>
                      <Text style={s.docFileName} numberOfLines={1}>{doc.name}</Text>
                      <Text style={s.docHeadline} numberOfLines={1}>{doc.title || doc.name}</Text>
                    </View>
                    <View style={[s.catBadge, { backgroundColor: catColor + '20', borderColor: catColor + '50' }]}>
                      <Text style={[s.catBadgeText, { color: catColor }]}>{doc.category}</Text>
                    </View>
                  </View>

                  {/* Metadata Row */}
                  <View style={s.metaRow}>
                    <Text style={s.metaText}>📏 Size: <Text style={s.metaHighlight}>{kbSize}</Text></Text>
                    <Text style={s.metaDivider}>•</Text>
                    <Text style={s.metaText}>📑 Lines: <Text style={s.metaHighlight}>{doc.linesCount || '—'}</Text></Text>
                    {doc.updatedAt && (
                      <>
                        <Text style={s.metaDivider}>•</Text>
                        <Text style={s.metaText}>🕒 {new Date(doc.updatedAt).toLocaleDateString()}</Text>
                      </>
                    )}
                  </View>

                  {/* Action Buttons Row */}
                  <View style={s.cardActions}>
                    <TouchableOpacity 
                      style={s.readBtn} 
                      onPress={() => handleOpenDoc(doc, false)}
                      activeOpacity={0.75}
                    >
                      <Eye size={15} color={C.white} />
                      <Text style={s.readBtnText}>Read Document</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={s.editBtn} 
                      onPress={() => handleOpenDoc(doc, true)}
                      activeOpacity={0.75}
                    >
                      <Edit3 size={15} color={C.gold} />
                      <Text style={s.editBtnText}>Edit Content</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <SecurityFooter style={{ marginTop: 32 }} />
      </ScrollView>

      {/* ── Document Reader & Editor Full Modal ── */}
      <Modal
        visible={!!activeDoc}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setActiveDoc(null)}
      >
        <SafeAreaView style={s.modalSafe}>
          <ParticleBackground />

          {/* Modal Header */}
          <View style={s.modalHeader}>
            <TouchableOpacity 
              style={s.modalCloseBtn} 
              onPress={() => setActiveDoc(null)}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={C.white} />
            </TouchableOpacity>

            <View style={s.modalTitleWrap}>
              <Text style={s.modalDocName} numberOfLines={1}>{activeDoc?.name}</Text>
              <Text style={s.modalDocSub} numberOfLines={1}>
                {isEditMode ? 'Editing Mode' : 'Reading Mode'} • {activeDoc?.category}
              </Text>
            </View>

            {/* Mode Switcher & Tools */}
            <View style={s.modalHeaderActions}>
              <TouchableOpacity 
                style={[s.modeToggleBtn, !isEditMode && s.modeToggleBtnActive]} 
                onPress={() => setIsEditMode(false)}
                activeOpacity={0.7}
              >
                <Eye size={16} color={!isEditMode ? '#000' : C.white} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[s.modeToggleBtn, isEditMode && s.modeToggleBtnActive]} 
                onPress={() => setIsEditMode(true)}
                activeOpacity={0.7}
              >
                <Edit3 size={16} color={isEditMode ? '#000' : C.gold} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={s.copyBtn} 
                onPress={handleCopy}
                activeOpacity={0.7}
              >
                <Copy size={16} color={C.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Success Banner */}
          {saveSuccessMsg.length > 0 && (
            <View style={s.successBanner}>
              <CheckCircle2 size={16} color="#10B981" />
              <Text style={s.successBannerText}>{saveSuccessMsg}</Text>
            </View>
          )}

          {/* Main Body */}
          {loadingDoc ? (
            <View style={s.centerLoader}>
              <ActivityIndicator size="large" color={C.gold} />
              <Text style={s.loaderText}>Loading document content...</Text>
            </View>
          ) : isEditMode ? (
            /* ── EDIT MODE ── */
            <View style={s.editorContainer}>
              <View style={s.editorBar}>
                <Text style={s.editorStatsText}>
                  Lines: {docContent.split('\n').length} | Characters: {docContent.length}
                </Text>
                {docContent !== originalContent && (
                  <View style={s.unsavedBadge}>
                    <Text style={s.unsavedText}>● Unsaved Changes</Text>
                  </View>
                )}
              </View>

              <TextInput
                style={s.editorInput}
                multiline
                value={docContent}
                onChangeText={setDocContent}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Type or paste markdown content here..."
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
              />

              {/* Bottom Save / Discard Bar */}
              <View style={s.editorBottomBar}>
                <TouchableOpacity 
                  style={s.discardBtn} 
                  onPress={() => setDocContent(originalContent)}
                  disabled={docContent === originalContent || savingDoc}
                  activeOpacity={0.7}
                >
                  <RotateCcw size={16} color={docContent === originalContent ? '#666' : C.white} />
                  <Text style={[s.discardBtnText, docContent === originalContent && { color: '#666' }]}>
                    Discard
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[s.saveBtn, savingDoc && s.saveBtnDisabled]} 
                  onPress={handleSaveDoc}
                  disabled={savingDoc}
                  activeOpacity={0.8}
                >
                  {savingDoc ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <>
                      <Save size={16} color="#000" />
                      <Text style={s.saveBtnText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ── READ MODE ── */
            <ScrollView 
              style={s.readerScroll} 
              contentContainerStyle={s.readerScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <View style={s.docMetaHeaderCard}>
                <Text style={s.readerDocTitle}>{activeDoc?.title || activeDoc?.name}</Text>
                <Text style={s.readerDocPath}>📁 Location: {activeDoc?.isRoot ? activeDoc?.name : `docs/${activeDoc?.name}`}</Text>
                <View style={s.readerTagsRow}>
                  <View style={s.readerTag}>
                    <Text style={s.readerTagText}>Category: {activeDoc?.category}</Text>
                  </View>
                  <View style={s.readerTag}>
                    <Text style={s.readerTagText}>Size: {(docContent.length / 1024).toFixed(1)} KB</Text>
                  </View>
                  <View style={s.readerTag}>
                    <Text style={s.readerTagText}>{docContent.split('\n').length} lines</Text>
                  </View>
                </View>
              </View>

              {/* Rendered Monospace Text Box with Line Numbers */}
              <View style={s.readerBodyBox}>
                <Text style={s.readerBodyText} selectable={true}>
                  {docContent}
                </Text>
              </View>

              <TouchableOpacity 
                style={s.editFromReaderBtn} 
                onPress={() => setIsEditMode(true)}
                activeOpacity={0.8}
              >
                <Edit3 size={18} color="#000" />
                <Text style={s.editFromReaderText}>Edit This Document</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#050505' },
  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitles: { flex: 1, marginLeft: 12 },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  headerSubtitle: { color: '#A0AEC0', fontSize: 11, fontWeight: '500', marginTop: 1 },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(240, 165, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Overview Banner
  statBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(18, 22, 32, 0.85)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(240, 165, 0, 0.35)',
    paddingVertical: 14,
    marginBottom: 16,
  },
  statBox: { alignItems: 'center' },
  statVal: { color: C.gold, fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#8E9BAE', fontSize: 9.5, fontWeight: '700', letterSpacing: 1.1, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255, 255, 255, 0.1)' },

  // Search Wrap
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 24, 34, 0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 14,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  clearBtn: { padding: 4 },

  // Filter Pills
  pillsScroll: { paddingBottom: 14, gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillActive: {
    backgroundColor: 'rgba(240, 165, 0, 0.18)',
    borderColor: C.gold,
  },
  pillText: { color: '#9E9E9E', fontSize: 11.5, fontWeight: '600' },
  pillTextActive: { color: C.gold, fontWeight: '700' },

  // Document Cards List
  docList: { gap: 12 },
  docCard: {
    backgroundColor: 'rgba(14, 18, 26, 0.92)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  docCardHeader: { flexDirection: 'row', alignItems: 'center' },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docCardTitleWrap: { flex: 1, marginLeft: 12, marginRight: 8 },
  docFileName: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '700' },
  docHeadline: { color: '#A0AEC0', fontSize: 11.5, marginTop: 1 },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.8,
  },
  catBadgeText: { fontSize: 10, fontWeight: '700' },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  metaText: { color: '#718096', fontSize: 11 },
  metaHighlight: { color: '#CBD5E0', fontWeight: '600' },
  metaDivider: { color: '#4A5568', marginHorizontal: 6 },

  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  readBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  readBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(240, 165, 0, 0.12)',
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.3)',
  },
  editBtnText: { color: C.gold, fontSize: 12, fontWeight: '700' },

  // Loaders & Empty
  centerLoader: { paddingVertical: 40, alignItems: 'center' },
  loaderText: { color: '#A0AEC0', fontSize: 12, marginTop: 10 },
  emptyState: { paddingVertical: 50, alignItems: 'center' },
  emptyTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: 12 },
  emptySub: { color: '#718096', fontSize: 12, marginTop: 4 },

  // Modal View
  modalSafe: { flex: 1, backgroundColor: '#07090E' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(14, 18, 26, 0.95)',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleWrap: { flex: 1, marginLeft: 12, marginRight: 8 },
  modalDocName: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '800' },
  modalDocSub: { color: C.gold, fontSize: 11, fontWeight: '500', marginTop: 1 },
  modalHeaderActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  modeToggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeToggleBtnActive: {
    backgroundColor: C.gold,
  },
  copyBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  successBannerText: { color: '#10B981', fontSize: 12, fontWeight: '600' },

  // Reader Mode
  readerScroll: { flex: 1 },
  readerScrollContent: { padding: 16 },
  docMetaHeaderCard: {
    backgroundColor: 'rgba(18, 22, 32, 0.75)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  readerDocTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  readerDocPath: { color: '#A0AEC0', fontSize: 11, marginBottom: 8 },
  readerTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  readerTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  readerTagText: { color: '#E2E8F0', fontSize: 10, fontWeight: '600' },

  readerBodyBox: {
    backgroundColor: 'rgba(10, 12, 18, 0.9)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  readerBodyText: {
    color: '#E2E8F0',
    fontSize: 13.5,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  editFromReaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.gold,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 20,
  },
  editFromReaderText: { color: '#000', fontSize: 14, fontWeight: '800' },

  // Editor Mode
  editorContainer: { flex: 1 },
  editorBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(16, 20, 28, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  editorStatsText: { color: '#A0AEC0', fontSize: 11, fontFamily: 'monospace' },
  unsavedBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unsavedText: { color: '#F59E0B', fontSize: 10, fontWeight: '700' },

  editorInput: {
    flex: 1,
    backgroundColor: '#0A0D14',
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    padding: 16,
    textAlignVertical: 'top',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },

  editorBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(14, 18, 26, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  discardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  discardBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.gold,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#000000', fontSize: 13.5, fontWeight: '800' },
});
