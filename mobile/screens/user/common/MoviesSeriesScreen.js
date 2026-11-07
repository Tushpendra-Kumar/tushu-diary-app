import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Modal, Alert, Platform, KeyboardAvoidingView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../../context/AuthContext';
import { useTheme, useThemeVersion } from '../../../context/ThemeContext';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import SecurityFooter from '../../../components/SecurityFooter';
import {
  Film, Tv, Star, Plus, Search, X, Pencil, Trash2,
  ChevronLeft, CircleCheck, Clock, CirclePause, CircleX,
  Bookmark, Heart, CirclePlay, Calendar, Globe,
  ArrowUpDown, SlidersHorizontal, Eye, EyeOff, Tag,
  Minus, CirclePlus, Award
} from 'lucide-react-native';
import {
  getMoviesSeries, addMovieSeries, updateMovieSeries, deleteMovieSeries
} from '../../../services/personalDataService';

// ── Formatters ───────────────────────────────────────────────────────────────
const formatDisplayDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// ── Configuration Constants ──────────────────────────────────────────────────
const STATUS_CONFIG = {
  'Want to Watch': { color: '#F0A500', icon: Bookmark, bg: 'rgba(240,165,0,0.15)' },
  'Watching':      { color: '#42A5F5', icon: CirclePlay, bg: 'rgba(66,165,245,0.15)' },
  'Watched':       { color: '#4CAF50', icon: CircleCheck, bg: 'rgba(76,175,80,0.15)' },
  'On Hold':       { color: '#FFA726', icon: CirclePause, bg: 'rgba(255,167,38,0.15)' },
  'Dropped':       { color: '#EF5350', icon: CircleX, bg: 'rgba(239,83,80,0.15)' },
};

const STATUS_LIST = ['Want to Watch', 'Watching', 'Watched', 'On Hold', 'Dropped'];

const GENRE_PRESETS = [
  'Action', 'Drama', 'Comedy', 'Sci-Fi', 'Thriller',
  'Romance', 'Horror', 'Animation', 'Documentary', 'Crime', 'Fantasy'
];

const PLATFORM_PRESETS = [
  'Netflix', 'Prime Video', 'Disney+', 'JioHotstar',
  'YouTube', 'Apple TV+', 'SonyLIV', 'Zee5', 'Cinema', 'Other'
];

const LANGUAGE_PRESETS = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam', 'Korean', 'Japanese', 'Other'
];

const SORT_OPTIONS = [
  { key: 'newest',        label: 'Recently Added' },
  { key: 'oldest',        label: 'Oldest Added' },
  { key: 'az',            label: 'Title A–Z' },
  { key: 'za',            label: 'Title Z–A' },
  { key: 'highest_rated', label: 'Highest Rated' },
  { key: 'lowest_rated',  label: 'Lowest Rated' },
  { key: 'year',          label: 'Release Year' },
];

export default function MoviesSeriesScreen({ navigation }) {
  useThemeVersion();
  const { user } = useContext(AuthContext);
  const userId = user?.user_id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All'); // All, Movie, Series
  const [statusFilter, setStatusFilter] = useState('All');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [showSortModal, setShowSortModal] = useState(false);

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('Movie'); // Movie, Series
  const [formStatus, setFormStatus] = useState('Want to Watch');
  const [formGenre, setFormGenre] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formLanguage, setFormLanguage] = useState('');
  const [formPlatform, setFormPlatform] = useState('');
  const [formDirector, setFormDirector] = useState('');
  const [formCast, setFormCast] = useState('');
  const [formRating, setFormRating] = useState(0); // 1-5
  const [formNotes, setFormNotes] = useState('');
  const [formIsFavorite, setFormIsFavorite] = useState(false);

  // Series Specific Form State
  const [formTotalSeasons, setFormTotalSeasons] = useState('');
  const [formCurrentSeason, setFormCurrentSeason] = useState('1');
  const [formTotalEpisodes, setFormTotalEpisodes] = useState('');
  const [formCurrentEpisode, setFormCurrentEpisode] = useState('1');

  // Load Data
  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getMoviesSeries(userId);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to load movies & series', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Open Form for Add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormType('Movie');
    setFormStatus('Want to Watch');
    setFormGenre('');
    setFormYear('');
    setFormLanguage('');
    setFormPlatform('');
    setFormDirector('');
    setFormCast('');
    setFormRating(0);
    setFormNotes('');
    setFormIsFavorite(false);
    setFormTotalSeasons('');
    setFormCurrentSeason('1');
    setFormTotalEpisodes('');
    setFormCurrentEpisode('1');
    setModalVisible(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormTitle(item.title || '');
    setFormType(item.type || 'Movie');
    setFormStatus(item.status || 'Want to Watch');
    setFormGenre(item.genre || '');
    setFormYear(item.releaseYear ? String(item.releaseYear) : '');
    setFormLanguage(item.language || '');
    setFormPlatform(item.platform || '');
    setFormDirector(item.director || '');
    setFormCast(item.cast || '');
    setFormRating(item.rating || 0);
    setFormNotes(item.notes || '');
    setFormIsFavorite(!!item.isFavorite);
    setFormTotalSeasons(item.totalSeasons ? String(item.totalSeasons) : '');
    setFormCurrentSeason(item.currentSeason ? String(item.currentSeason) : '1');
    setFormTotalEpisodes(item.totalEpisodes ? String(item.totalEpisodes) : '');
    setFormCurrentEpisode(item.currentEpisode ? String(item.currentEpisode) : '1');
    setModalVisible(true);
    setDetailItem(null);
  };

  // Save Item
  const handleSave = async () => {
    if (!formTitle.trim()) {
      if (Platform.OS === 'web') window.alert('Title is required');
      else Alert.alert('Validation', 'Title is required');
      return;
    }

    const payload = {
      title: formTitle.trim(),
      type: formType,
      status: formStatus,
      genre: formGenre.trim(),
      releaseYear: formYear ? parseInt(formYear, 10) || formYear.trim() : null,
      language: formLanguage.trim(),
      platform: formPlatform.trim(),
      director: formDirector.trim(),
      cast: formCast.trim(),
      rating: formRating > 0 ? formRating : null,
      notes: formNotes.trim(),
      isFavorite: formIsFavorite,
      ...(formType === 'Series' ? {
        totalSeasons: formTotalSeasons ? parseInt(formTotalSeasons, 10) || null : null,
        currentSeason: formCurrentSeason ? parseInt(formCurrentSeason, 10) || 1 : 1,
        totalEpisodes: formTotalEpisodes ? parseInt(formTotalEpisodes, 10) || null : null,
        currentEpisode: formCurrentEpisode ? parseInt(formCurrentEpisode, 10) || 1 : 1,
      } : {
        totalSeasons: null,
        currentSeason: null,
        totalEpisodes: null,
        currentEpisode: null,
      })
    };

    try {
      if (editingItem) {
        await updateMovieSeries(userId, editingItem.id, payload);
      } else {
        await addMovieSeries(userId, payload);
      }
      setModalVisible(false);
      await loadData();
    } catch (e) {
      console.warn('Save movie/series failed', e);
    }
  };

  // Delete Item
  const handleDelete = (id, title) => {
    const doDelete = async () => {
      await deleteMovieSeries(userId, id);
      setDetailItem(null);
      await loadData();
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Title',
        `Are you sure you want to delete "${title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete }
        ]
      );
    }
  };

  // Quick Toggle Favorite
  const handleToggleFavorite = async (item) => {
    const newVal = !item.isFavorite;
    await updateMovieSeries(userId, item.id, { isFavorite: newVal });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, isFavorite: newVal } : i));
    if (detailItem?.id === item.id) {
      setDetailItem(prev => ({ ...prev, isFavorite: newVal }));
    }
  };

  // Quick Change Status
  const handleQuickStatusChange = async (item, newStatus) => {
    await updateMovieSeries(userId, item.id, { status: newStatus });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
    if (detailItem?.id === item.id) {
      setDetailItem(prev => ({ ...prev, status: newStatus }));
    }
  };

  // Quick Advance Episode for Series (+1)
  const handleQuickEpisodeAdvance = async (item, delta = 1) => {
    const current = parseInt(item.currentEpisode, 10) || 1;
    const next = Math.max(1, current + delta);
    const updates = { currentEpisode: next };
    // If user starts watching, auto-switch to Watching if it was Want to Watch
    if (item.status === 'Want to Watch' && next > 1) {
      updates.status = 'Watching';
    }
    await updateMovieSeries(userId, item.id, updates);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...updates } : i));
    if (detailItem?.id === item.id) {
      setDetailItem(prev => ({ ...prev, ...updates }));
    }
  };

  // Quick Advance Season for Series (+1)
  const handleQuickSeasonAdvance = async (item, delta = 1) => {
    const current = parseInt(item.currentSeason, 10) || 1;
    const next = Math.max(1, current + delta);
    const updates = { currentSeason: next, currentEpisode: 1 };
    await updateMovieSeries(userId, item.id, updates);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...updates } : i));
    if (detailItem?.id === item.id) {
      setDetailItem(prev => ({ ...prev, ...updates }));
    }
  };

  // Dynamic Dashboard Counts
  const stats = useMemo(() => {
    const totalMovies = items.filter(i => i.type === 'Movie').length;
    const totalSeries = items.filter(i => i.type === 'Series').length;
    const wantToWatch = items.filter(i => i.status === 'Want to Watch').length;
    const watching    = items.filter(i => i.status === 'Watching').length;
    const watched     = items.filter(i => i.status === 'Watched').length;
    return { totalMovies, totalSeries, wantToWatch, watching, watched };
  }, [items]);

  // Filter & Search & Sort Pipeline
  const filteredItems = useMemo(() => {
    let list = [...items];

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(i => {
        return (
          (i.title && i.title.toLowerCase().includes(q)) ||
          (i.genre && i.genre.toLowerCase().includes(q)) ||
          (i.platform && i.platform.toLowerCase().includes(q)) ||
          (i.language && i.language.toLowerCase().includes(q)) ||
          (i.director && i.director.toLowerCase().includes(q)) ||
          (i.cast && i.cast.toLowerCase().includes(q)) ||
          (i.notes && i.notes.toLowerCase().includes(q))
        );
      });
    }

    // Type Filter
    if (typeFilter !== 'All') {
      list = list.filter(i => i.type === typeFilter);
    }

    // Status Filter
    if (statusFilter !== 'All') {
      list = list.filter(i => i.status === statusFilter);
    }

    // Favorites Filter
    if (onlyFavorites) {
      list = list.filter(i => !!i.isFavorite);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'az') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'za') {
        return (b.title || '').localeCompare(a.title || '');
      }
      if (sortBy === 'highest_rated') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'lowest_rated') {
        return (a.rating || 0) - (b.rating || 0);
      }
      if (sortBy === 'year') {
        return (parseInt(b.releaseYear, 10) || 0) - (parseInt(a.releaseYear, 10) || 0);
      }
      return 0;
    });

    return list;
  }, [items, searchQuery, typeFilter, statusFilter, onlyFavorites, sortBy]);

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />

      {/* Top Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft color={C.white} size={22} />
        </TouchableOpacity>
        <View style={s.headerTitleWrap}>
          <Text style={s.headerTitle}>Movies & Series</Text>
          <Text style={s.headerSubtitle}>Personal Watchlist & Entertainment Tracker</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={handleOpenAdd} activeOpacity={0.8}>
          <Plus color={C.black} size={18} />
          <Text style={s.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Dynamic Summary Cards */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Film color={C.gold} size={16} />
            <Text style={s.statValue}>{stats.totalMovies}</Text>
            <Text style={s.statLabel}>Movies</Text>
          </View>
          <View style={s.statCard}>
            <Tv color="#42A5F5" size={16} />
            <Text style={[s.statValue, { color: '#42A5F5' }]}>{stats.totalSeries}</Text>
            <Text style={s.statLabel}>Series</Text>
          </View>
          <View style={s.statCard}>
            <CirclePlay color="#64B5F6" size={16} />
            <Text style={[s.statValue, { color: '#64B5F6' }]}>{stats.watching}</Text>
            <Text style={s.statLabel}>Watching</Text>
          </View>
          <View style={s.statCard}>
            <CircleCheck color="#81C784" size={16} />
            <Text style={[s.statValue, { color: '#81C784' }]}>{stats.watched}</Text>
            <Text style={s.statLabel}>Watched</Text>
          </View>
          <View style={s.statCard}>
            <Bookmark color="#FFB74D" size={16} />
            <Text style={[s.statValue, { color: '#FFB74D' }]}>{stats.wantToWatch}</Text>
            <Text style={s.statLabel}>Watchlist</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={s.searchBar}>
          <Search color={C.textMuted} size={18} />
          <TextInput
            style={s.searchInput}
            placeholder="Search movies, series, genre, platform..."
            placeholderTextColor={C.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <X color={C.textMuted} size={16} />
            </TouchableOpacity>
          )}
        </View>

        {/* Type Filter Tabs */}
        <View style={s.filterRow}>
          {['All', 'Movie', 'Series'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[s.typeTab, typeFilter === t && s.typeTabActive]}
              onPress={() => setTypeFilter(t)}
            >
              <Text style={[s.typeTabText, typeFilter === t && s.typeTabTextActive]}>
                {t === 'Movie' ? 'Movies' : t === 'Series' ? 'Series' : 'All'}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[s.favToggle, onlyFavorites && s.favToggleActive]}
            onPress={() => setOnlyFavorites(prev => !prev)}
          >
            <Star color={onlyFavorites ? C.gold : C.textMuted} size={14} fill={onlyFavorites ? C.gold : 'transparent'} />
            <Text style={[s.favToggleText, onlyFavorites && { color: C.gold }]}>Favorites</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.sortBtn} onPress={() => setShowSortModal(true)}>
            <ArrowUpDown color={C.gold} size={14} />
          </TouchableOpacity>
        </View>

        {/* Status Filter Horizontal Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.statusScroll} contentContainerStyle={s.statusScrollContent}>
          <TouchableOpacity
            style={[s.statusPill, statusFilter === 'All' && s.statusPillActive]}
            onPress={() => setStatusFilter('All')}
          >
            <Text style={[s.statusPillText, statusFilter === 'All' && s.statusPillTextActive]}>All Status</Text>
          </TouchableOpacity>
          {STATUS_LIST.map(st => {
            const conf = STATUS_CONFIG[st];
            const active = statusFilter === st;
            return (
              <TouchableOpacity
                key={st}
                style={[
                  s.statusPill,
                  active && { backgroundColor: conf.bg, borderColor: conf.color }
                ]}
                onPress={() => setStatusFilter(st)}
              >
                <conf.icon size={12} color={active ? conf.color : C.textMuted} />
                <Text style={[s.statusPillText, active && { color: conf.color, fontWeight: '700' }]}>{st}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <View style={s.emptyState}>
            <Film color={C.textMuted} size={48} style={{ opacity: 0.5, marginBottom: 12 }} />
            <Text style={s.emptyTitle}>
              {searchQuery || typeFilter !== 'All' || statusFilter !== 'All' || onlyFavorites
                ? 'No matching movies or series'
                : 'No movies or series yet'}
            </Text>
            <Text style={s.emptySubtitle}>
              {searchQuery || typeFilter !== 'All' || statusFilter !== 'All' || onlyFavorites
                ? 'Try adjusting your search or filters'
                : 'Add movies and series to build your personal watchlist.'}
            </Text>
            <TouchableOpacity style={s.emptyBtn} onPress={handleOpenAdd} activeOpacity={0.8}>
              <Plus color={C.black} size={16} />
              <Text style={s.emptyBtnText}>Add Movie or Series</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.listWrap}>
            {filteredItems.map(item => {
              const stConf = STATUS_CONFIG[item.status] || STATUS_CONFIG['Want to Watch'];
              const isSeries = item.type === 'Series';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={s.card}
                  onPress={() => setDetailItem(item)}
                  activeOpacity={0.85}
                >
                  {/* Card Header */}
                  <View style={s.cardHeader}>
                    <View style={s.cardHeaderBadges}>
                      <View style={[s.typeBadge, { borderColor: isSeries ? '#42A5F5' : C.gold }]}>
                        {isSeries ? <Tv size={11} color="#42A5F5" /> : <Film size={11} color={C.gold} />}
                        <Text style={[s.typeBadgeText, { color: isSeries ? '#42A5F5' : C.gold }]}>
                          {item.type}
                        </Text>
                      </View>

                      <View style={[s.statusBadge, { backgroundColor: stConf.bg, borderColor: stConf.color }]}>
                        <stConf.icon size={11} color={stConf.color} />
                        <Text style={[s.statusBadgeText, { color: stConf.color }]}>{item.status}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={s.favIconBtn}
                      onPress={() => handleToggleFavorite(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Star
                        size={18}
                        color={item.isFavorite ? C.gold : C.textMuted}
                        fill={item.isFavorite ? C.gold : 'transparent'}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Title & Rating */}
                  <View style={s.cardTitleRow}>
                    <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
                    {item.rating ? (
                      <View style={s.ratingWrap}>
                        <Star size={13} color={C.gold} fill={C.gold} />
                        <Text style={s.ratingText}>{item.rating}/5</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Meta Tags: Genre, Year, Platform, Language */}
                  <View style={s.metaRow}>
                    {item.genre ? (
                      <View style={s.metaChip}>
                        <Tag size={10} color={C.textMuted} />
                        <Text style={s.metaChipText}>{item.genre}</Text>
                      </View>
                    ) : null}
                    {item.releaseYear ? (
                      <View style={s.metaChip}>
                        <Calendar size={10} color={C.textMuted} />
                        <Text style={s.metaChipText}>{item.releaseYear}</Text>
                      </View>
                    ) : null}
                    {item.platform ? (
                      <View style={s.metaChip}>
                        <Globe size={10} color={C.textMuted} />
                        <Text style={s.metaChipText}>{item.platform}</Text>
                      </View>
                    ) : null}
                    {item.language ? (
                      <View style={s.metaChip}>
                        <Text style={s.metaChipText}>{item.language}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Series Progress Bar / Indicator */}
                  {isSeries && (
                    <View style={s.seriesProgressRow}>
                      <View style={s.seriesProgressTextWrap}>
                        <Text style={s.seriesProgressLabel}>
                          Season {item.currentSeason || 1}{item.totalSeasons ? ` of ${item.totalSeasons}` : ''}
                          {' • '}
                          Episode {item.currentEpisode || 1}{item.totalEpisodes ? ` of ${item.totalEpisodes}` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={s.quickEpBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleQuickEpisodeAdvance(item, 1);
                        }}
                      >
                        <CirclePlus size={13} color={C.black} />
                        <Text style={s.quickEpBtnText}>+1 Ep</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Notes snippet */}
                  {item.notes ? (
                    <Text style={s.cardNotes} numberOfLines={1}>{item.notes}</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <SecurityFooter style={{ marginTop: 36 }} />
      </ScrollView>

      {/* ── ADD / EDIT MODAL ──────────────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.modalOverlay}
        >
          <View style={s.modalContainer}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editingItem ? 'Edit Title' : 'Add Movie or Series'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={s.closeModalBtn}>
                <X color={C.white} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={s.modalForm} showsVerticalScrollIndicator={false}>

              {/* Title (Required) */}
              <Text style={s.formLabel}>TITLE / NAME *</Text>
              <TextInput
                style={s.formInput}
                placeholder="e.g. Interstellar, Breaking Bad"
                placeholderTextColor={C.textMuted}
                value={formTitle}
                onChangeText={setFormTitle}
              />

              {/* Content Type Selector */}
              <Text style={s.formLabel}>CONTENT TYPE *</Text>
              <View style={s.typeSelectorRow}>
                <TouchableOpacity
                  style={[s.typeSelectorBtn, formType === 'Movie' && s.typeSelectorBtnActive]}
                  onPress={() => setFormType('Movie')}
                >
                  <Film size={16} color={formType === 'Movie' ? C.black : C.white} />
                  <Text style={[s.typeSelectorBtnText, formType === 'Movie' && s.typeSelectorBtnTextActive]}>
                    Movie
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.typeSelectorBtn, formType === 'Series' && s.typeSelectorBtnActive]}
                  onPress={() => setFormType('Series')}
                >
                  <Tv size={16} color={formType === 'Series' ? C.black : C.white} />
                  <Text style={[s.typeSelectorBtnText, formType === 'Series' && s.typeSelectorBtnTextActive]}>
                    Series / TV Show
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Watch Status */}
              <Text style={s.formLabel}>WATCH STATUS *</Text>
              <View style={s.chipWrap}>
                {STATUS_LIST.map(st => {
                  const conf = STATUS_CONFIG[st];
                  const active = formStatus === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[
                        s.chipBtn,
                        active && { backgroundColor: conf.bg, borderColor: conf.color }
                      ]}
                      onPress={() => setFormStatus(st)}
                    >
                      <conf.icon size={13} color={active ? conf.color : C.textMuted} />
                      <Text style={[s.chipText, active && { color: conf.color, fontWeight: '700' }]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Series Specific Progress Fields */}
              {formType === 'Series' && (
                <View style={s.seriesFieldsSection}>
                  <Text style={s.seriesSectionHeader}>SERIES PROGRESS & EPISODES</Text>
                  <View style={s.gridRow}>
                    <View style={s.gridCol}>
                      <Text style={s.gridLabel}>CURRENT SEASON</Text>
                      <TextInput
                        style={s.gridInput}
                        placeholder="1"
                        placeholderTextColor={C.textMuted}
                        value={formCurrentSeason}
                        onChangeText={setFormCurrentSeason}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={s.gridCol}>
                      <Text style={s.gridLabel}>TOTAL SEASONS</Text>
                      <TextInput
                        style={s.gridInput}
                        placeholder="e.g. 5"
                        placeholderTextColor={C.textMuted}
                        value={formTotalSeasons}
                        onChangeText={setFormTotalSeasons}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={s.gridRow}>
                    <View style={s.gridCol}>
                      <Text style={s.gridLabel}>CURRENT EPISODE</Text>
                      <TextInput
                        style={s.gridInput}
                        placeholder="1"
                        placeholderTextColor={C.textMuted}
                        value={formCurrentEpisode}
                        onChangeText={setFormCurrentEpisode}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={s.gridCol}>
                      <Text style={s.gridLabel}>TOTAL EPISODES</Text>
                      <TextInput
                        style={s.gridInput}
                        placeholder="e.g. 62"
                        placeholderTextColor={C.textMuted}
                        value={formTotalEpisodes}
                        onChangeText={setFormTotalEpisodes}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Genre Selection */}
              <Text style={s.formLabel}>GENRE</Text>
              <TextInput
                style={s.formInput}
                placeholder="Select below or type custom genre..."
                placeholderTextColor={C.textMuted}
                value={formGenre}
                onChangeText={setFormGenre}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.presetScroll}>
                {GENRE_PRESETS.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[s.smallPresetPill, formGenre === g && s.smallPresetPillActive]}
                    onPress={() => setFormGenre(g)}
                  >
                    <Text style={[s.smallPresetText, formGenre === g && s.smallPresetTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Release Year & Language */}
              <View style={s.gridRow}>
                <View style={s.gridCol}>
                  <Text style={s.formLabel}>RELEASE YEAR</Text>
                  <TextInput
                    style={s.gridInput}
                    placeholder="e.g. 2024"
                    placeholderTextColor={C.textMuted}
                    value={formYear}
                    onChangeText={setFormYear}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
                <View style={s.gridCol}>
                  <Text style={s.formLabel}>LANGUAGE</Text>
                  <TextInput
                    style={s.gridInput}
                    placeholder="e.g. Hindi, English"
                    placeholderTextColor={C.textMuted}
                    value={formLanguage}
                    onChangeText={setFormLanguage}
                  />
                </View>
              </View>

              {/* Streaming Platform */}
              <Text style={s.formLabel}>STREAMING PLATFORM</Text>
              <TextInput
                style={s.formInput}
                placeholder="e.g. Netflix, Prime Video, Other..."
                placeholderTextColor={C.textMuted}
                value={formPlatform}
                onChangeText={setFormPlatform}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.presetScroll}>
                {PLATFORM_PRESETS.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[s.smallPresetPill, formPlatform === p && s.smallPresetPillActive]}
                    onPress={() => setFormPlatform(p)}
                  >
                    <Text style={[s.smallPresetText, formPlatform === p && s.smallPresetTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Director & Cast */}
              <View style={s.gridRow}>
                <View style={s.gridCol}>
                  <Text style={s.formLabel}>DIRECTOR</Text>
                  <TextInput
                    style={s.gridInput}
                    placeholder="e.g. Christopher Nolan"
                    placeholderTextColor={C.textMuted}
                    value={formDirector}
                    onChangeText={setFormDirector}
                  />
                </View>
                <View style={s.gridCol}>
                  <Text style={s.formLabel}>CAST / ACTORS</Text>
                  <TextInput
                    style={s.gridInput}
                    placeholder="e.g. Matthew McConaughey"
                    placeholderTextColor={C.textMuted}
                    value={formCast}
                    onChangeText={setFormCast}
                  />
                </View>
              </View>

              {/* Personal Star Rating (1-5) */}
              <Text style={s.formLabel}>RATING</Text>
              <View style={s.starsRow}>
                {[1, 2, 3, 4, 5].map(star => {
                  const filled = star <= formRating;
                  return (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setFormRating(prev => (prev === star ? 0 : star))}
                      style={s.starBtn}
                    >
                      <Star
                        size={28}
                        color={filled ? C.gold : C.textMuted}
                        fill={filled ? C.gold : 'transparent'}
                      />
                    </TouchableOpacity>
                  );
                })}
                {formRating > 0 ? (
                  <Text style={s.ratingNumLabel}>{formRating}/5</Text>
                ) : (
                  <Text style={s.ratingNumLabelMuted}>Not rated</Text>
                )}
              </View>

              {/* Personal Notes */}
              <Text style={s.formLabel}>PERSONAL NOTES</Text>
              <TextInput
                style={[s.formInput, s.textArea]}
                placeholder="Review, recommendation, must watch again..."
                placeholderTextColor={C.textMuted}
                value={formNotes}
                onChangeText={setFormNotes}
                multiline
                numberOfLines={3}
              />

              {/* Mark Favorite Toggle */}
              <TouchableOpacity
                style={[s.favToggleRow, formIsFavorite && s.favToggleRowActive]}
                onPress={() => setFormIsFavorite(prev => !prev)}
              >
                <Star
                  size={18}
                  color={formIsFavorite ? C.gold : C.textMuted}
                  fill={formIsFavorite ? C.gold : 'transparent'}
                />
                <Text style={[s.favToggleRowText, formIsFavorite && { color: C.gold }]}>
                  {formIsFavorite ? 'Added to Favorites' : 'Add to Favorites'}
                </Text>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={s.modalActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
                  <Text style={s.saveBtnText}>{editingItem ? 'Update' : 'Save Title'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── DETAIL MODAL ─────────────────────────────────────────────────── */}
      <Modal visible={!!detailItem} transparent animationType="fade">
        <View style={s.modalOverlay}>
          {detailItem && (
            <View style={s.detailContainer}>
              <View style={s.detailHeader}>
                <View style={s.cardHeaderBadges}>
                  <View style={[s.typeBadge, { borderColor: detailItem.type === 'Series' ? '#42A5F5' : C.gold }]}>
                    {detailItem.type === 'Series' ? <Tv size={12} color="#42A5F5" /> : <Film size={12} color={C.gold} />}
                    <Text style={[s.typeBadgeText, { color: detailItem.type === 'Series' ? '#42A5F5' : C.gold }]}>
                      {detailItem.type}
                    </Text>
                  </View>

                  <View style={[s.statusBadge, {
                    backgroundColor: (STATUS_CONFIG[detailItem.status] || STATUS_CONFIG['Want to Watch']).bg,
                    borderColor: (STATUS_CONFIG[detailItem.status] || STATUS_CONFIG['Want to Watch']).color
                  }]}>
                    <Text style={[s.statusBadgeText, {
                      color: (STATUS_CONFIG[detailItem.status] || STATUS_CONFIG['Want to Watch']).color
                    }]}>
                      {detailItem.status}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity onPress={() => setDetailItem(null)} style={s.closeModalBtn}>
                  <X color={C.white} size={20} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={s.detailBody} showsVerticalScrollIndicator={false}>
                {/* Big Title */}
                <View style={s.detailTitleRow}>
                  <Text style={s.detailTitle}>{detailItem.title}</Text>
                  <TouchableOpacity onPress={() => handleToggleFavorite(detailItem)} style={{ padding: 4 }}>
                    <Star
                      size={22}
                      color={detailItem.isFavorite ? C.gold : C.textMuted}
                      fill={detailItem.isFavorite ? C.gold : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Rating display */}
                {detailItem.rating ? (
                  <View style={s.detailStarsRow}>
                    {[1, 2, 3, 4, 5].map(st => (
                      <Star
                        key={st}
                        size={18}
                        color={st <= detailItem.rating ? C.gold : C.textMuted}
                        fill={st <= detailItem.rating ? C.gold : 'transparent'}
                      />
                    ))}
                    <Text style={s.detailScoreText}>{detailItem.rating} / 5 Stars</Text>
                  </View>
                ) : null}

                {/* Series Progress Tracker Panel */}
                {detailItem.type === 'Series' && (
                  <View style={s.seriesDetailPanel}>
                    <Text style={s.seriesPanelTitle}>WATCH PROGRESS</Text>
                    <View style={s.seriesControlRow}>
                      <View style={s.seriesProgressBox}>
                        <Text style={s.seriesBoxLabel}>SEASON</Text>
                        <View style={s.controlButtonsRow}>
                          <TouchableOpacity
                            style={s.stepBtn}
                            onPress={() => handleQuickSeasonAdvance(detailItem, -1)}
                          >
                            <Minus size={14} color={C.white} />
                          </TouchableOpacity>
                          <Text style={s.seriesBoxValue}>{detailItem.currentSeason || 1}</Text>
                          <TouchableOpacity
                            style={s.stepBtn}
                            onPress={() => handleQuickSeasonAdvance(detailItem, 1)}
                          >
                            <Plus size={14} color={C.white} />
                          </TouchableOpacity>
                        </View>
                        {detailItem.totalSeasons ? (
                          <Text style={s.seriesBoxSub}>of {detailItem.totalSeasons} total</Text>
                        ) : null}
                      </View>

                      <View style={s.seriesProgressBox}>
                        <Text style={s.seriesBoxLabel}>EPISODE</Text>
                        <View style={s.controlButtonsRow}>
                          <TouchableOpacity
                            style={s.stepBtn}
                            onPress={() => handleQuickEpisodeAdvance(detailItem, -1)}
                          >
                            <Minus size={14} color={C.white} />
                          </TouchableOpacity>
                          <Text style={s.seriesBoxValue}>{detailItem.currentEpisode || 1}</Text>
                          <TouchableOpacity
                            style={s.stepBtn}
                            onPress={() => handleQuickEpisodeAdvance(detailItem, 1)}
                          >
                            <Plus size={14} color={C.white} />
                          </TouchableOpacity>
                        </View>
                        {detailItem.totalEpisodes ? (
                          <Text style={s.seriesBoxSub}>of {detailItem.totalEpisodes} total</Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                )}

                {/* Info Grid */}
                <View style={s.infoGrid}>
                  {detailItem.genre ? (
                    <View style={s.infoGridItem}>
                      <Text style={s.infoItemLabel}>GENRE</Text>
                      <Text style={s.infoItemValue}>{detailItem.genre}</Text>
                    </View>
                  ) : null}
                  {detailItem.releaseYear ? (
                    <View style={s.infoGridItem}>
                      <Text style={s.infoItemLabel}>RELEASE YEAR</Text>
                      <Text style={s.infoItemValue}>{detailItem.releaseYear}</Text>
                    </View>
                  ) : null}
                  {detailItem.platform ? (
                    <View style={s.infoGridItem}>
                      <Text style={s.infoItemLabel}>STREAMING ON</Text>
                      <Text style={s.infoItemValue}>{detailItem.platform}</Text>
                    </View>
                  ) : null}
                  {detailItem.language ? (
                    <View style={s.infoGridItem}>
                      <Text style={s.infoItemLabel}>LANGUAGE</Text>
                      <Text style={s.infoItemValue}>{detailItem.language}</Text>
                    </View>
                  ) : null}
                  {detailItem.director ? (
                    <View style={s.infoGridItemFull}>
                      <Text style={s.infoItemLabel}>DIRECTOR</Text>
                      <Text style={s.infoItemValue}>{detailItem.director}</Text>
                    </View>
                  ) : null}
                  {detailItem.cast ? (
                    <View style={s.infoGridItemFull}>
                      <Text style={s.infoItemLabel}>CAST</Text>
                      <Text style={s.infoItemValue}>{detailItem.cast}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Quick Status Changer */}
                <View style={s.quickStatusChangeSection}>
                  <Text style={s.quickStatusTitle}>CHANGE STATUS</Text>
                  <View style={s.quickStatusRow}>
                    {STATUS_LIST.map(st => {
                      const active = detailItem.status === st;
                      const conf = STATUS_CONFIG[st];
                      return (
                        <TouchableOpacity
                          key={st}
                          style={[
                            s.quickStatusChip,
                            active && { backgroundColor: conf.bg, borderColor: conf.color }
                          ]}
                          onPress={() => handleQuickStatusChange(detailItem, st)}
                        >
                          <Text style={[s.quickStatusChipText, active && { color: conf.color, fontWeight: '700' }]}>
                            {st}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Notes */}
                {detailItem.notes ? (
                  <View style={s.detailNotesBlock}>
                    <Text style={s.detailNotesLabel}>PERSONAL NOTES</Text>
                    <Text style={s.detailNotesText}>{detailItem.notes}</Text>
                  </View>
                ) : null}

                {/* Added Date */}
                {detailItem.createdAt ? (
                  <Text style={s.detailDateText}>Added on {formatDisplayDate(detailItem.createdAt)}</Text>
                ) : null}

                {/* Bottom Actions */}
                <View style={s.detailActionsRow}>
                  <TouchableOpacity
                    style={s.editBtn}
                    onPress={() => handleOpenEdit(detailItem)}
                  >
                    <Pencil size={16} color={C.white} />
                    <Text style={s.editBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={s.deleteBtn}
                    onPress={() => handleDelete(detailItem.id, detailItem.title)}
                  >
                    <Trash2 size={16} color="#EF5350" />
                    <Text style={s.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* ── SORT MODAL ────────────────────────────────────────────────────── */}
      <Modal visible={showSortModal} transparent animationType="fade">
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={s.sortModalCard}>
            <Text style={s.sortModalTitle}>SORT BY</Text>
            {SORT_OPTIONS.map(opt => {
              const active = sortBy === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[s.sortOptRow, active && s.sortOptRowActive]}
                  onPress={() => {
                    setSortBy(opt.key);
                    setShowSortModal(false);
                  }}
                >
                  <Text style={[s.sortOptText, active && s.sortOptTextActive]}>{opt.label}</Text>
                  {active && <CircleCheck size={16} color={C.gold} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: 'rgba(10,10,10,0.85)',
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  headerTitleWrap: { flex: 1, marginLeft: 6 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.white, letterSpacing: 0.3 },
  headerSubtitle: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.gold,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, gap: 5,
  },
  addBtnText: { color: C.black, fontSize: 13, fontWeight: '800' },

  scrollContent: { paddingBottom: 40 },

  // Stats
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8,
  },
  statCard: {
    flex: 1, marginHorizontal: 3, backgroundColor: C.card,
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 4,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  statValue: { fontSize: 15, fontWeight: '800', color: C.white, marginTop: 4 },
  statLabel: { fontSize: 9, color: C.textMuted, fontWeight: '600', marginTop: 1, textTransform: 'uppercase' },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, marginHorizontal: 14, marginTop: 10, marginBottom: 8,
    borderRadius: 12, paddingHorizontal: 14, height: 44,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  searchInput: {
    flex: 1, marginLeft: 10, color: C.white, fontSize: 13,
    outlineStyle: 'none',
  },

  // Type Filters
  filterRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, marginTop: 6, marginBottom: 8, gap: 8,
  },
  typeTab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  typeTabActive: { backgroundColor: C.gold, borderColor: C.gold },
  typeTabText: { color: C.textMuted, fontSize: 12, fontWeight: '600' },
  typeTabTextActive: { color: C.black, fontWeight: '800' },

  favToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  favToggleActive: { borderColor: C.gold, backgroundColor: 'rgba(240,165,0,0.1)' },
  favToggleText: { color: C.textMuted, fontSize: 12, fontWeight: '600' },

  sortBtn: {
    marginLeft: 'auto', width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },

  // Status pills
  statusScroll: { marginTop: 4, marginBottom: 12 },
  statusScrollContent: { paddingHorizontal: 14, gap: 7 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: C.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  statusPillActive: { backgroundColor: 'rgba(240,165,0,0.15)', borderColor: C.gold },
  statusPillText: { color: C.textMuted, fontSize: 11, fontWeight: '600' },
  statusPillTextActive: { color: C.gold, fontWeight: '700' },

  // List
  listWrap: { paddingHorizontal: 14, gap: 12 },
  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardHeaderBadges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.4)',
  },
  typeBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  favIconBtn: { padding: 4 },

  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: C.white, letterSpacing: 0.2 },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(240,165,0,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ratingText: { fontSize: 11, fontWeight: '800', color: C.gold },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  metaChipText: { fontSize: 11, color: C.textSecondary },

  seriesProgressRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(66,165,245,0.08)', borderWidth: 1, borderColor: 'rgba(66,165,245,0.25)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginTop: 4, marginBottom: 4,
  },
  seriesProgressTextWrap: { flex: 1 },
  seriesProgressLabel: { fontSize: 12, fontWeight: '700', color: '#64B5F6' },
  quickEpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#42A5F5', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
  },
  quickEpBtnText: { color: C.black, fontSize: 11, fontWeight: '800' },

  cardNotes: { fontSize: 11, color: C.textMuted, fontStyle: 'italic', marginTop: 4 },

  // Empty State
  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 50, paddingHorizontal: 24, marginHorizontal: 14,
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.white, marginBottom: 6, textAlign: 'center' },
  emptySubtitle: { fontSize: 12, color: C.textMuted, textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.gold,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, gap: 6,
  },
  emptyBtnText: { color: C.black, fontSize: 13, fontWeight: '800' },

  // Modal Common
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center', alignItems: 'center', padding: 14,
  },
  modalContainer: {
    width: '100%', maxWidth: 500, maxHeight: '90%',
    backgroundColor: '#0F0F0F', borderRadius: 20,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: C.white },
  closeModalBtn: { padding: 4 },

  modalForm: { padding: 18, paddingBottom: 24 },
  formLabel: { fontSize: 10, fontWeight: '800', color: C.textMuted, letterSpacing: 1.2, marginTop: 12, marginBottom: 6 },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    color: C.white, fontSize: 13, paddingHorizontal: 12, paddingVertical: 9,
    outlineStyle: 'none',
  },
  textArea: { height: 70, textAlignVertical: 'top' },

  typeSelectorRow: { flexDirection: 'row', gap: 10 },
  typeSelectorBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  typeSelectorBtnActive: { backgroundColor: C.gold, borderColor: C.gold },
  typeSelectorBtnText: { color: C.white, fontSize: 13, fontWeight: '700' },
  typeSelectorBtnTextActive: { color: C.black },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  chipText: { fontSize: 11, color: C.textMuted, fontWeight: '600' },

  seriesFieldsSection: {
    backgroundColor: 'rgba(66,165,245,0.05)', borderWidth: 1, borderColor: 'rgba(66,165,245,0.2)',
    borderRadius: 12, padding: 12, marginTop: 14,
  },
  seriesSectionHeader: { fontSize: 10, fontWeight: '800', color: '#42A5F5', letterSpacing: 1, marginBottom: 10 },
  gridRow: { flexDirection: 'row', gap: 10 },
  gridCol: { flex: 1 },
  gridLabel: { fontSize: 9, fontWeight: '800', color: C.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  gridInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    color: C.white, fontSize: 13, paddingHorizontal: 10, paddingVertical: 7,
    outlineStyle: 'none',
  },

  presetScroll: { marginTop: 6, marginBottom: 4 },
  smallPresetPill: {
    backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, marginRight: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  smallPresetPillActive: { backgroundColor: 'rgba(240,165,0,0.2)', borderColor: C.gold },
  smallPresetText: { fontSize: 10, color: C.textSecondary },
  smallPresetTextActive: { color: C.gold, fontWeight: '700' },

  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  starBtn: { padding: 3 },
  ratingNumLabel: { color: C.gold, fontSize: 13, fontWeight: '800', marginLeft: 8 },
  ratingNumLabelMuted: { color: C.textMuted, fontSize: 12, marginLeft: 8 },

  favToggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginTop: 14,
  },
  favToggleRowActive: { borderColor: C.gold, backgroundColor: 'rgba(240,165,0,0.1)' },
  favToggleRowText: { fontSize: 13, fontWeight: '700', color: C.textMuted },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center',
  },
  cancelBtnText: { color: C.white, fontSize: 13, fontWeight: '700' },
  saveBtn: {
    flex: 2, paddingVertical: 12, borderRadius: 10,
    backgroundColor: C.gold, alignItems: 'center',
  },
  saveBtnText: { color: C.black, fontSize: 13, fontWeight: '800' },

  // Detail Modal
  detailContainer: {
    width: '100%', maxWidth: 480, maxHeight: '88%',
    backgroundColor: '#0D0D0D', borderRadius: 20,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  detailBody: { padding: 18, paddingBottom: 24 },
  detailTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  detailTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: C.white },
  detailStarsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  detailScoreText: { color: C.gold, fontSize: 12, fontWeight: '700', marginLeft: 6 },

  seriesDetailPanel: {
    backgroundColor: 'rgba(66,165,245,0.06)', borderWidth: 1, borderColor: 'rgba(66,165,245,0.25)',
    borderRadius: 14, padding: 14, marginBottom: 14,
  },
  seriesPanelTitle: { fontSize: 10, fontWeight: '800', color: '#42A5F5', letterSpacing: 1.2, marginBottom: 10 },
  seriesControlRow: { flexDirection: 'row', gap: 10 },
  seriesProgressBox: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 10,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  seriesBoxLabel: { fontSize: 9, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8, marginBottom: 6 },
  controlButtonsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  seriesBoxValue: { fontSize: 18, fontWeight: '800', color: C.white, minWidth: 24, textAlign: 'center' },
  seriesBoxSub: { fontSize: 10, color: C.textMuted, marginTop: 4 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  infoGridItem: {
    width: '48%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8,
    padding: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  infoGridItemFull: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8,
    padding: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  infoItemLabel: { fontSize: 9, fontWeight: '800', color: C.textMuted, letterSpacing: 0.8 },
  infoItemValue: { fontSize: 13, fontWeight: '700', color: C.white, marginTop: 2 },

  quickStatusChangeSection: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 14,
  },
  quickStatusTitle: { fontSize: 9, fontWeight: '800', color: C.textMuted, letterSpacing: 1, marginBottom: 6 },
  quickStatusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  quickStatusChip: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  quickStatusChipText: { fontSize: 10, color: C.textMuted, fontWeight: '600' },

  detailNotesBlock: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 14,
  },
  detailNotesLabel: { fontSize: 9, fontWeight: '800', color: C.textMuted, letterSpacing: 1, marginBottom: 4 },
  detailNotesText: { fontSize: 13, color: C.textSecondary, lineHeight: 18 },

  detailDateText: { fontSize: 11, color: C.textMuted, textAlign: 'center', marginBottom: 14 },

  detailActionsRow: { flexDirection: 'row', gap: 10 },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 10, borderRadius: 10,
  },
  editBtnText: { color: C.white, fontSize: 13, fontWeight: '700' },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(239,83,80,0.15)', borderWidth: 1, borderColor: 'rgba(239,83,80,0.3)',
    paddingVertical: 10, borderRadius: 10,
  },
  deleteBtnText: { color: '#EF5350', fontSize: 13, fontWeight: '700' },

  // Sort Modal
  sortModalCard: {
    width: '100%', maxWidth: 320, backgroundColor: '#141414',
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border,
  },
  sortModalTitle: { fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 1.2, marginBottom: 12 },
  sortOptRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4,
  },
  sortOptRowActive: { backgroundColor: 'rgba(240,165,0,0.1)' },
  sortOptText: { fontSize: 13, color: C.white, fontWeight: '600' },
  sortOptTextActive: { color: C.gold, fontWeight: '700' },
});
