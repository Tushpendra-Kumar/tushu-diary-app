import React, { useContext, useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, ActivityIndicator, FlatList, Keyboard, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../../../constants/theme';
import {
  ChevronLeft, Search, X, Clock, SlidersHorizontal,
  FolderOpen, CircleDollarSign, Calendar, CheckSquare, 
  ChevronRight, Bookmark, Film
} from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import ParticleBackground from '../../../components/ParticleBackground';

// Reuse the full functional search engine built previously
import { searchAll, getRecentSearches, saveRecentSearch, clearRecentSearches } from '../../../services/searchService';

// ── Search Filters ────────────────────────────────────────────────────────────
const FILTER_TABS = ['All', 'Tasks', 'Finance', 'Reminders', 'Calendar', 'Entertainment'];

const FILTER_ICONS = {
  All: <FolderOpen size={14} color={C.textMuted} />,
  Tasks: <CheckSquare size={14} color={C.textMuted} />,
  Finance: <CircleDollarSign size={14} color={C.textMuted} />,
  Reminders: <Bookmark size={14} color={C.textMuted} />,
  Calendar: <Calendar size={14} color={C.textMuted} />,
  Entertainment: <Film size={14} color={C.textMuted} />,
};

// Map screen filter tabs to underlying engine categories
const mapFilterToCategory = (filterTab) => {
  if (filterTab === 'All') return null;
  return filterTab; // Engine already maps these string keywords (Tasks, Finance, etc)
};

export default function AdvancedSearchScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  const [recents, setRecents] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false); // Did user execute a search?

  // 1. Load Recents
  const loadRecents = useCallback(async () => {
    if (!user?.user_id) return;
    const r = await getRecentSearches(user.user_id);
    setRecents(r);
  }, [user?.user_id]);

  useFocusEffect(useCallback(() => { loadRecents(); }, [loadRecents]));

  // 2. Perform Search
  const runSearch = async (qText) => {
    const term = qText.trim();
    if (!term) {
      setSearched(false);
      setResults([]);
      return;
    }
    setLoading(true);
    setSearched(true);
    
    // Engine performs search across all real module data
    const res = await searchAll(user.user_id, term);
    setResults(res);
    setLoading(false);

    // Save to recents
    await saveRecentSearch(user.user_id, term);
    loadRecents();
  };

  // Automatically search as you type (debounced manually via UX)
  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length > 1) runSearch(query);
      else if (query.trim().length === 0) setSearched(false);
    }, 400); // 400ms debounce
    return () => clearTimeout(t);
  }, [query]);

  // Apply Filter UI-side
  const displayResults = React.useMemo(() => {
    if (activeFilter === 'All') return results;
    // Map tab to matching modules
    return results.filter(r => {
      if (activeFilter === 'Tasks') return ['Daily Planner', 'Work Tasks'].includes(r.moduleName);
      if (activeFilter === 'Finance') return ['Expense Tracker', 'Khata Book', 'Monthly Budget', 'Bills & Payments', 'EMI Reminder', 'Goals & Savings', 'Wallet'].includes(r.moduleName);
      if (activeFilter === 'Reminders') return ['Advanced Reminders', 'EMI Reminder'].includes(r.moduleName);
      if (activeFilter === 'Calendar') return ['Advanced Calendar', 'Family Events', 'Personal Events', 'Birthdays'].includes(r.moduleName);
      if (activeFilter === 'Entertainment') return ['Movies & Series', 'My Music', 'Website & Link Manager'].includes(r.moduleName || r.module);
      return true;
    });
  }, [results, activeFilter]);

  // Actions
  const onChangeText = (text) => setQuery(text);
  const onClear = () => { setQuery(''); setSearched(false); setResults([]); setActiveFilter('All'); Keyboard.dismiss(); };
  const onRecentTap = (term) => { setQuery(term); runSearch(term); };
  const onClearRecents = async () => { await clearRecentSearches(user.user_id); setRecents([]); };

  // Result Click Navigation — Real Data Links
  const handleResultClick = (item) => {
    if (!item.route) return; // safeguard
    navigation.navigate(item.route);
  };

  // Render Result Card
  const renderResult = ({ item }) => (
    <TouchableOpacity style={s.resultCard} onPress={() => handleResultClick(item)}>
      <View style={s.resultIconWrap}>
        <Search color={C.gold} size={18} />
      </View>
      <View style={s.resultBody}>
        <View style={s.resultTopRow}>
          <Text style={s.resultTitle} numberOfLines={1}>{item.title}</Text>
          <ChevronRight color={C.textMuted} size={16} />
        </View>
        <Text style={s.resultModule}>{item.moduleName.toUpperCase()}</Text>
        {item.subtitle ? <Text style={s.resultDetail} numberOfLines={2}>{item.subtitle}</Text> : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />

      {/* HEADER */}
      <View style={s.header}>
        <View style={{ width: 32 }} />
        <Text style={s.headerTitle}>Advanced Search</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* SEARCH BAR — Fixed Focus Outline */}
      <View style={s.searchBarWrap}>
        <View style={s.searchBar}>
          <Search color={C.textMuted} size={18} />
          <TextInput
            style={s.searchInput}
            placeholder="Search anything across your app..."
            placeholderTextColor={C.textMuted}
            value={query}
            onChangeText={onChangeText}
            autoFocus={false}
            returnKeyType="search"
            onSubmitEditing={() => runSearch(query)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={onClear} style={{ padding: 4 }}>
              <X color={C.textMuted} size={16} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* FILTER CHIPS */}
      <View style={s.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          {FILTER_TABS.map(f => {
            const isActive = activeFilter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[s.chip, isActive && s.chipActive]}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {/* Clone icon element to inject color dynamically */}
                  {React.cloneElement(FILTER_ICONS[f], { color: isActive ? C.black : C.textMuted })}
                  <Text style={[s.chipText, isActive && s.chipTextActive]}>{f}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* MAIN CONTENT */}
      {loading ? (
        <View style={s.centerState}>
          <ActivityIndicator color={C.gold} size="large" />
          <Text style={s.centerText}>Searching...</Text>
        </View>
      ) : !searched ? (
        /* Empty / Initial State */
        <ScrollView contentContainerStyle={s.initialContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {recents.length > 0 && (
            <View style={s.recentsSection}>
              <View style={s.recentHeader}>
                <Text style={s.sectionLabel}>RECENT SEARCHES</Text>
                <TouchableOpacity onPress={onClearRecents}>
                  <Text style={s.clearAll}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {recents.map((r, i) => (
                <TouchableOpacity key={i} style={s.recentItem} onPress={() => onRecentTap(r)}>
                  <Clock color={C.textMuted} size={15} />
                  <Text style={s.recentText}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={s.tipsSection}>
            <Text style={s.sectionLabel}>SEARCH ACROSS</Text>
            {[
              'Work Tasks, Daily Tasks, Quick Notes',
              'Expenses, Khata Book, Bills, EMIs, Goals',
              'Vehicle Manager, Shopping Lists',
              'Family Events, Website & Links, Music',
              'Advanced Reminders, Advanced Calendar',
              'Attachments & Files'
            ].map((tip, i) => (
              <View key={i} style={s.tipRow}>
                <View style={s.tipDot} />
                <Text style={s.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : displayResults.length === 0 ? (
        /* No Results */
        <View style={s.centerState}>
          <Search color={C.textMuted} size={48} />
          <Text style={s.emptyTitle}>No results found</Text>
          <Text style={s.emptyDesc}>Try a different keyword or choose a different category.</Text>
          <TouchableOpacity onPress={onClear} style={{ marginTop: 20, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ color: C.gold, fontSize: 14, fontWeight: '600' }}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Results */
        <View style={{ flex: 1 }}>
          <View style={s.resultsHeader}>
            <SlidersHorizontal color={C.textMuted} size={14} />
            <Text style={s.resultsCount}>{displayResults.length} result{displayResults.length !== 1 ? 's' : ''}</Text>
          </View>
          <FlatList
            data={displayResults}
            keyExtractor={item => item.id}
            renderItem={renderResult}
            contentContainerStyle={s.resultsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// Global stylesheet fixes for React Native Web outline
const injectedStyles = `
  input:focus, textarea:focus {
    outline: none !important;
    box-shadow: none !important;
  }
`;

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#06080D' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: 'rgba(5,5,5,0.9)'
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.white },
  backBtn: { padding: 4 },

  searchBarWrap: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, height: 46
  },
  // By using React Native Web's outline style we block the white border
  searchInput: { 
    flex: 1, color: C.white, fontSize: 15, 
    ...Platform.select({ web: { outlineStyle: 'none' } }) // CRITICAL FIX
  },

  filterWrap: { paddingBottom: 10 },
  filterScroll: { paddingHorizontal: 14, gap: 8 },
  chip: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, 
    borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.03)',
    ...Platform.select({ web: { outlineStyle: 'none' } }) // FIX FOR CHIPS
  },
  chipActive: { backgroundColor: C.gold, borderColor: C.gold },
  chipText: { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  chipTextActive: { color: C.black, fontWeight: '700' },

  // Loading / empty
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 60 },
  centerText: { color: C.textMuted, marginTop: 12, fontSize: 14 },
  emptyTitle: { fontSize: 18, color: C.white, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22 },

  // Results
  resultsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  resultsCount: { fontSize: 12, color: C.textMuted, fontWeight: '600' },
  resultsList: { paddingHorizontal: 14, paddingBottom: 40 },
  resultCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 8
  },
  resultIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(240,165,0,0.10)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  resultBody: { flex: 1 },
  resultTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  resultTitle: { fontSize: 15, fontWeight: '700', color: C.white, flex: 1 },
  resultModule: { fontSize: 10, color: C.gold, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  resultDetail: { fontSize: 13, color: C.textMuted, lineHeight: 18 },

  // Initial state
  initialContent: { padding: 14, paddingBottom: 60 },
  recentsSection: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 14 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLabel: { fontSize: 11, color: C.textMuted, fontWeight: '700', letterSpacing: 1 },
  clearAll: { fontSize: 12, color: C.gold, fontWeight: '600' },
  recentItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  recentText: { fontSize: 14, color: C.white },

  tipsSection: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold, marginTop: 7 },
  tipText: { fontSize: 13, color: C.textMuted, flex: 1, lineHeight: 20 },
});
