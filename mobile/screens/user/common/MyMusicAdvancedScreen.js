import React, { useContext, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  TextInput, Modal, ActivityIndicator, Alert, Platform,
  Linking, FlatList, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../../../constants/theme';
import {
  ChevronLeft, Plus, Search, X, Music, Star, ExternalLink,
  Edit3, Trash2, ChevronDown, Filter, ArrowUpDown, CheckCircle,
  List, Heart, BookOpen, Globe, Clock, ChevronRight
} from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import ParticleBackground from '../../../components/ParticleBackground';
import SecurityFooter from '../../../components/SecurityFooter';
import { getMusic, addMusic, updateMusic, deleteMusic } from '../../../services/personalDataService';

// ── Playlist storage helpers ──────────────────────────────────────────────────
const PLAYLISTS_KEY = (uid) => `tushu_music_playlists_${uid}`;
const uuid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const getPlaylists = async (uid) => {
  try { const d = await AsyncStorage.getItem(PLAYLISTS_KEY(uid)); return d ? JSON.parse(d) : []; }
  catch { return []; }
};
const savePlaylists = async (uid, pl) => AsyncStorage.setItem(PLAYLISTS_KEY(uid), JSON.stringify(pl));

// ── URL helpers ───────────────────────────────────────────────────────────────
const isValidURL = (u) => { try { new URL(u||''); return true; } catch { return false; } };
const normalizeURL = (u) => {
  const t = (u||'').trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  if (/^www\./i.test(t)) return `https://${t}`;
  return t;
};
const openURL = async (url) => {
  try {
    if (Platform.OS === 'web') { window.open(url, '_blank', 'noopener,noreferrer'); return true; }
    const ok = await Linking.canOpenURL(url); if (ok) { await Linking.openURL(url); return true; }
    return false;
  } catch { return false; }
};

// ── Sort / filter constants ───────────────────────────────────────────────────
const SORT_OPTIONS = [
  { key: 'newest',   label: 'Recently Added'    },
  { key: 'updated',  label: 'Recently Updated'  },
  { key: 'az',       label: 'Song Name A–Z'     },
  { key: 'za',       label: 'Song Name Z–A'     },
  { key: 'artist',   label: 'Artist A–Z'        },
  { key: 'year_new', label: 'Release Year: Newest' },
  { key: 'year_old', label: 'Release Year: Oldest' },
];

// ── Add/Edit Form ─────────────────────────────────────────────────────────────
const FORM_INIT = { title:'', artist:'', album:'', genre:'', language:'', year:'', url:'', notes:'' };

const SongFormModal = ({ visible, editing, onClose, onSave }) => {
  const [form, setForm] = useState(FORM_INIT);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setForm(editing ? {
        title: editing.title||'', artist: editing.artist||'', album: editing.album||'',
        genre: editing.genre||'', language: editing.language||'', year: editing.year||'',
        url: editing.url||'', notes: editing.notes||''
      } : FORM_INIT);
      setErrors({}); setSaving(false);
    }
  }, [visible, editing]);

  const f = (k, v) => { setForm(p=>({...p,[k]:v})); if(errors[k]) setErrors(p=>({...p,[k]:''})); };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Song title is required.';
    if (form.year && !/^\d{4}$/.test(form.year.trim())) e.year = 'Enter a valid 4-digit year.';
    if (form.url.trim() && !isValidURL(normalizeURL(form.url))) e.url = 'Enter a valid URL or leave blank.';
    return e;
  };

  const handleSave = async () => {
    const e = validate(); if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const payload = { ...form, url: form.url.trim() ? normalizeURL(form.url) : '' };
    await onSave(payload);
    setSaving(false);
  };

  const Field = ({ label, fkey, placeholder, keyboard, multiline, maxLen=200 }) => (
    <>
      <Text style={fm.label}>{label}</Text>
      <TextInput
        style={[fm.input, errors[fkey]&&fm.inputErr, multiline&&{height:80,textAlignVertical:'top'}]}
        placeholder={placeholder} placeholderTextColor={C.textMuted}
        value={form[fkey]} onChangeText={v=>f(fkey,v)}
        keyboardType={keyboard||'default'} autoCapitalize="none" autoCorrect={false}
        multiline={!!multiline} maxLength={maxLen}
      />
      {errors[fkey] ? <Text style={fm.errText}>{errors[fkey]}</Text> : null}
    </>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}>
        <View style={fm.overlay}>
          <View style={fm.sheet}>
            <View style={fm.header}>
              <Text style={fm.headerTitle}>{editing ? 'Edit Song' : 'Add Song'}</Text>
              <TouchableOpacity onPress={onClose}><X color={C.white} size={22}/></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={fm.req}>* Required</Text>
              <Field label="Song Title *" fkey="title" placeholder="e.g. Tum Hi Ho" maxLen={150}/>
              <Field label="Artist / Singer" fkey="artist" placeholder="e.g. Arijit Singh"/>
              <Field label="Album" fkey="album" placeholder="e.g. Aashiqui 2"/>
              <Field label="Genre" fkey="genre" placeholder="e.g. Bollywood, Pop, Rock"/>
              <Field label="Language" fkey="language" placeholder="e.g. Hindi, English"/>
              <Field label="Release Year" fkey="year" placeholder="e.g. 2013" keyboard="numeric" maxLen={4}/>
              <Field label="Song / Source URL (optional)" fkey="url" placeholder="https://youtube.com/..." maxLen={500}/>
              <Field label="Personal Notes" fkey="notes" placeholder="e.g. Workout playlist" multiline maxLen={300}/>
              <TouchableOpacity style={[fm.saveBtn, saving&&{opacity:0.6}]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={C.black} size="small"/> : <CheckCircle color={C.black} size={18}/>}
                <Text style={fm.saveBtnText}>{saving ? 'Saving...' : editing ? 'Update Song' : 'Save Song'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Playlist Manager Modal ────────────────────────────────────────────────────
const PlaylistModal = ({ visible, onClose, playlists, songs, userId, onPlaylistsChange }) => {
  const [newName, setNewName] = useState('');
  const [activePl, setActivePl] = useState(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const updated = [...playlists, { id: uuid(), name: newName.trim(), songIds: [], createdAt: new Date().toISOString() }];
    await savePlaylists(userId, updated);
    onPlaylistsChange(updated);
    setNewName(''); setCreating(false);
  };

  const handleDeletePl = async (pl) => {
    const doIt = async () => {
      const updated = playlists.filter(p=>p.id!==pl.id);
      await savePlaylists(userId, updated);
      onPlaylistsChange(updated);
      if (activePl?.id === pl.id) setActivePl(null);
    };
    if (Platform.OS==='web') { if(window.confirm(`Delete playlist "${pl.name}"?`)) doIt(); }
    else Alert.alert('Delete Playlist',`Delete "${pl.name}"?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:doIt}]);
  };

  const handleRenamePl = (pl) => {
    const doRename = async (name) => {
      if (!name?.trim()) return;
      const updated = playlists.map(p=>p.id===pl.id?{...p,name:name.trim()}:p);
      await savePlaylists(userId, updated);
      onPlaylistsChange(updated);
    };
    if (Platform.OS==='web') { const n=window.prompt('Rename playlist:',pl.name); doRename(n); }
    else Alert.prompt?.('Rename','New playlist name:',doRename,'plain-text',pl.name) || (() => {})();
  };

  const toggleSongInPl = async (pl, songId) => {
    const hasIt = pl.songIds.includes(songId);
    const updated = playlists.map(p => p.id===pl.id ? {...p, songIds: hasIt ? p.songIds.filter(s=>s!==songId) : [...p.songIds, songId]} : p);
    await savePlaylists(userId, updated);
    onPlaylistsChange(updated);
    setActivePl(updated.find(p=>p.id===pl.id));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={pl.overlay}>
        <View style={pl.sheet}>
          <View style={pl.header}>
            <TouchableOpacity onPress={()=>setActivePl(null)} style={{opacity:activePl?1:0}}><ChevronLeft color={C.white} size={22}/></TouchableOpacity>
            <Text style={pl.headerTitle}>{activePl ? activePl.name : 'My Playlists'}</Text>
            <TouchableOpacity onPress={onClose}><X color={C.white} size={22}/></TouchableOpacity>
          </View>

          {!activePl ? (
            <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}} showsVerticalScrollIndicator={false}>
              {/* Create new */}
              <View style={pl.createRow}>
                <TextInput style={pl.createInput} placeholder="New playlist name..." placeholderTextColor={C.textMuted} value={newName} onChangeText={setNewName} maxLength={60}/>
                <TouchableOpacity style={pl.createBtn} onPress={handleCreate} disabled={creating}>
                  <Plus color={C.black} size={18}/>
                </TouchableOpacity>
              </View>

              {playlists.length === 0 ? (
                <View style={pl.emptyWrap}><Text style={pl.emptyText}>No playlists yet. Create one above.</Text></View>
              ) : playlists.map(p => (
                <TouchableOpacity key={p.id} style={pl.plCard} onPress={()=>setActivePl(p)}>
                  <View style={pl.plIconWrap}><List color={C.gold} size={18}/></View>
                  <View style={{flex:1}}>
                    <Text style={pl.plName}>{p.name}</Text>
                    <Text style={pl.plCount}>{p.songIds.length} song{p.songIds.length!==1?'s':''}</Text>
                  </View>
                  <View style={{flexDirection:'row',gap:8}}>
                    {Platform.OS==='web'&&<TouchableOpacity onPress={()=>handleRenamePl(p)} style={pl.plAction}><Edit3 color={C.gold} size={15}/></TouchableOpacity>}
                    <TouchableOpacity onPress={()=>handleDeletePl(p)} style={pl.plAction}><Trash2 color="#EF4444" size={15}/></TouchableOpacity>
                    <ChevronRight color={C.textMuted} size={16}/>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}} showsVerticalScrollIndicator={false}>
              <Text style={pl.sectionLabel}>SONGS IN LIBRARY</Text>
              {songs.length===0 ? <Text style={pl.emptyText}>No songs in library yet.</Text> : songs.map(song => {
                const inPl = activePl.songIds.includes(song.id);
                return (
                  <TouchableOpacity key={song.id} style={pl.songRow} onPress={()=>toggleSongInPl(activePl,song.id)}>
                    <View style={[pl.checkbox, inPl&&pl.checkboxOn]}>
                      {inPl && <CheckCircle color={C.black} size={14}/>}
                    </View>
                    <View style={{flex:1}}>
                      <Text style={pl.songTitle} numberOfLines={1}>{song.title}</Text>
                      <Text style={pl.songArtist} numberOfLines={1}>{song.artist||'Unknown Artist'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ── Song Card ─────────────────────────────────────────────────────────────────
const SongCard = ({ item, onOpen, onEdit, onDelete, onFavorite }) => (
  <View style={s.card}>
    <View style={s.cardTop}>
      <View style={s.cardIcon}><Music color={C.gold} size={22}/></View>
      <View style={{flex:1}}>
        <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={s.cardArtist} numberOfLines={1}>{item.artist||'Unknown Artist'}</Text>
      </View>
      <TouchableOpacity onPress={()=>onFavorite(item)} style={s.starBtn}>
        <Star color={item.favorite?C.gold:C.textMuted} size={18} fill={item.favorite?C.gold:'none'}/>
      </TouchableOpacity>
    </View>

    <View style={s.cardMeta}>
      {item.album && <View style={s.metaPill}><Text style={s.metaText}>{item.album}</Text></View>}
      {item.genre && <View style={s.metaPill}><Text style={s.metaText}>{item.genre}</Text></View>}
      {item.language && <View style={s.metaPill}><Text style={s.metaText}>{item.language}</Text></View>}
      {item.year && <View style={s.metaPill}><Text style={s.metaText}>{item.year}</Text></View>}
    </View>

    {item.notes ? <Text style={s.cardNotes} numberOfLines={2}>{item.notes}</Text> : null}

    <View style={s.cardActions}>
      {item.url ? (
        <TouchableOpacity style={s.openBtn} onPress={()=>onOpen(item)}>
          <ExternalLink color={C.black} size={14}/>
          <Text style={s.openBtnText}>Open Source</Text>
        </TouchableOpacity>
      ) : (
        <View style={s.openBtnGhost}><Text style={s.openBtnGhostText}>No Source URL</Text></View>
      )}
      <TouchableOpacity style={s.iconBtn} onPress={()=>onEdit(item)}><Edit3 color={C.gold} size={16}/></TouchableOpacity>
      <TouchableOpacity style={s.iconBtn} onPress={()=>onDelete(item)}><Trash2 color="#EF4444" size={16}/></TouchableOpacity>
    </View>
  </View>
);

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────
export default function MyMusicAdvancedScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [songs, setSongs]       = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('All');
  const [sort, setSort]         = useState('newest');
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [playlistModal, setPlaylistModal] = useState(false);
  const [editing, setEditing]   = useState(null);

  const load = useCallback(async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const [data, pl] = await Promise.all([getMusic(user.user_id), getPlaylists(user.user_id)]);
      setSongs(Array.isArray(data) ? data : []);
      setPlaylists(Array.isArray(pl) ? pl : []);
    } catch { setSongs([]); setPlaylists([]); }
    setLoading(false);
  }, [user?.user_id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Unique genres & languages for filter chips
  const genres    = useMemo(() => [...new Set(songs.map(s=>s.genre).filter(Boolean))], [songs]);
  const languages = useMemo(() => [...new Set(songs.map(s=>s.language).filter(Boolean))], [songs]);

  const FILTER_OPTS = useMemo(() => {
    const base = ['All', 'Favorites'];
    genres.forEach(g => base.push(`Genre: ${g}`));
    languages.forEach(l => base.push(`Lang: ${l}`));
    return base;
  }, [genres, languages]);

  const displayed = useMemo(() => {
    let list = [...songs];
    // filter
    if (filter === 'Favorites') list = list.filter(s=>s.favorite);
    else if (filter.startsWith('Genre: ')) list = list.filter(s=>s.genre===filter.replace('Genre: ',''));
    else if (filter.startsWith('Lang: '))  list = list.filter(s=>s.language===filter.replace('Lang: ',''));
    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        (s.title||'').toLowerCase().includes(q) ||
        (s.artist||'').toLowerCase().includes(q) ||
        (s.album||'').toLowerCase().includes(q) ||
        (s.genre||'').toLowerCase().includes(q) ||
        (s.language||'').toLowerCase().includes(q) ||
        (s.notes||'').toLowerCase().includes(q)
      );
    }
    // sort
    switch (sort) {
      case 'updated':  list.sort((a,b)=>(b.updatedAt||b.createdAt||'').localeCompare(a.updatedAt||a.createdAt||'')); break;
      case 'az':       list.sort((a,b)=>(a.title||'').localeCompare(b.title||'')); break;
      case 'za':       list.sort((a,b)=>(b.title||'').localeCompare(a.title||'')); break;
      case 'artist':   list.sort((a,b)=>(a.artist||'').localeCompare(b.artist||'')); break;
      case 'year_new': list.sort((a,b)=>(parseInt(b.year)||0)-(parseInt(a.year)||0)); break;
      case 'year_old': list.sort((a,b)=>(parseInt(a.year)||9999)-(parseInt(b.year)||9999)); break;
      default:         list.sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')); break;
    }
    return list;
  }, [songs, filter, search, sort]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleSave = async (form) => {
    try {
      if (editing) await updateMusic(user.user_id, editing.id, {...form, updatedAt: new Date().toISOString()});
      else await addMusic(user.user_id, form);
      await load(); setModalVisible(false); setEditing(null);
    } catch {}
  };

  const handleFavorite = async (item) => {
    try { await updateMusic(user.user_id, item.id, {favorite:!item.favorite, updatedAt:new Date().toISOString()}); await load(); } catch {}
  };

  const handleDelete = (item) => {
    const doIt = async () => { try { await deleteMusic(user.user_id, item.id); await load(); } catch {} };
    if (Platform.OS==='web') { if(window.confirm(`Delete "${item.title}"?`)) doIt(); }
    else Alert.alert('Delete Song',`Delete "${item.title}"?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:doIt}]);
  };

  const handleOpen = async (item) => {
    const ok = await openURL(item.url);
    if (!ok) {
      if (Platform.OS==='web') window.alert('Could not open URL. Please check it is valid.');
      else Alert.alert('Cannot Open','Could not open this URL.');
    }
  };

  const resetFilters = () => { setSearch(''); setFilter('All'); };
  const isFiltered = search.trim() || filter !== 'All';

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground/>

      {/* HEADER */}
      <View style={s.header}>
        <View style={{width:28}}/>
        <Text style={s.headerTitle}>My Music — Advanced</Text>
        <View style={{flexDirection:'row',gap:4}}>
          <TouchableOpacity style={s.headerIconBtn} onPress={()=>setPlaylistModal(true)}><List color={C.gold} size={22}/></TouchableOpacity>
          <TouchableOpacity style={s.headerIconBtn} onPress={()=>{setEditing(null);setModalVisible(true);}}><Plus color={C.gold} size={24}/></TouchableOpacity>
        </View>
      </View>

      {/* SEARCH */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Search color={C.textMuted} size={18}/>
          <TextInput style={s.searchInput} placeholder="Search songs, artists or albums..." placeholderTextColor={C.textMuted} value={search} onChangeText={setSearch} autoCapitalize="none" autoCorrect={false}/>
          {search ? <TouchableOpacity onPress={()=>setSearch('')}><X color={C.textMuted} size={16}/></TouchableOpacity> : null}
        </View>

        {/* Controls row */}
        <View style={s.controlRow}>
          <TouchableOpacity style={s.ctrlBtn} onPress={()=>{setShowFilter(p=>!p);setShowSort(false);}}>
            <Filter color={C.gold} size={13}/>
            <Text style={s.ctrlText} numberOfLines={1}>{filter}</Text>
            <ChevronDown color={C.gold} size={11}/>
          </TouchableOpacity>
          <TouchableOpacity style={s.ctrlBtn} onPress={()=>{setShowSort(p=>!p);setShowFilter(false);}}>
            <ArrowUpDown color={C.gold} size={13}/>
            <Text style={s.ctrlText} numberOfLines={1}>{SORT_OPTIONS.find(o=>o.key===sort)?.label}</Text>
            <ChevronDown color={C.gold} size={11}/>
          </TouchableOpacity>
          <Text style={s.countText}>{displayed.length} song{displayed.length!==1?'s':''}</Text>
        </View>

        {/* Filter dropdown */}
        {showFilter && (
          <View style={s.dropdown}>
            <ScrollView style={{maxHeight:220}} showsVerticalScrollIndicator={false}>
              {FILTER_OPTS.map(opt=>(
                <TouchableOpacity key={opt} style={s.dropOpt} onPress={()=>{setFilter(opt);setShowFilter(false);}}>
                  <Text style={[s.dropText, filter===opt&&{color:C.gold,fontWeight:'700'}]}>{opt}</Text>
                  {filter===opt&&<CheckCircle color={C.gold} size={14}/>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {/* Sort dropdown */}
        {showSort && (
          <View style={s.dropdown}>
            {SORT_OPTIONS.map(o=>(
              <TouchableOpacity key={o.key} style={s.dropOpt} onPress={()=>{setSort(o.key);setShowSort(false);}}>
                <Text style={[s.dropText, sort===o.key&&{color:C.gold,fontWeight:'700'}]}>{o.label}</Text>
                {sort===o.key&&<CheckCircle color={C.gold} size={14}/>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={s.center}><ActivityIndicator color={C.gold} size="large"/></View>
      ) : songs.length === 0 ? (
        <ScrollView contentContainerStyle={{flexGrow:1}}>
          <View style={s.emptyWrap}>
            <Music color={C.textMuted} size={56}/>
            <Text style={s.emptyTitle}>No songs added yet</Text>
            <Text style={s.emptySub}>Save your favourite songs and keep your personal music collection organized.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={()=>{setEditing(null);setModalVisible(true);}}>
              <Plus color={C.black} size={18}/><Text style={s.emptyBtnText}>Add Song</Text>
            </TouchableOpacity>
          </View>
          <SecurityFooter/>
        </ScrollView>
      ) : displayed.length === 0 ? (
        <ScrollView contentContainerStyle={{flexGrow:1}}>
          <View style={s.emptyWrap}>
            <Search color={C.textMuted} size={48}/>
            <Text style={s.emptyTitle}>No songs found</Text>
            <Text style={s.emptySub}>Try a different keyword or reset the filter.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={resetFilters}>
              <X color={C.black} size={16}/><Text style={s.emptyBtnText}>Clear Filter</Text>
            </TouchableOpacity>
          </View>
          <SecurityFooter/>
        </ScrollView>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item=>item.id}
          renderItem={({item})=>(
            <SongCard item={item} onOpen={handleOpen} onEdit={i=>{setEditing(i);setModalVisible(true);}} onDelete={handleDelete} onFavorite={handleFavorite}/>
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={<><SecurityFooter/><View style={{height:40}}/></>}
        />
      )}

      {/* ADD/EDIT MODAL */}
      <SongFormModal visible={modalVisible} editing={editing} onClose={()=>{setModalVisible(false);setEditing(null);}} onSave={handleSave}/>

      {/* PLAYLIST MODAL */}
      <PlaylistModal visible={playlistModal} onClose={()=>setPlaylistModal(false)} playlists={playlists} songs={songs} userId={user?.user_id} onPlaylistsChange={setPlaylists}/>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#06080D'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:14,borderBottomWidth:1,borderBottomColor:C.border,backgroundColor:'rgba(5,5,5,0.9)'},
  headerTitle:{fontSize:16,fontWeight:'700',color:C.white,flex:1,textAlign:'center'},
  backBtn:{padding:4}, headerIconBtn:{padding:4},

  searchWrap:{paddingHorizontal:14,paddingTop:12,paddingBottom:4,zIndex:20},
  searchBar:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:C.card,borderRadius:12,borderWidth:1,borderColor:C.border,paddingHorizontal:14,height:46,marginBottom:8},
  searchInput:{flex:1,color:C.white,fontSize:14,...Platform.select({web:{outlineStyle:'none'}})},

  controlRow:{flexDirection:'row',alignItems:'center',gap:8},
  ctrlBtn:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:C.card,borderRadius:20,borderWidth:1,borderColor:C.border,paddingHorizontal:10,paddingVertical:7,maxWidth:160},
  ctrlText:{fontSize:12,color:C.white,flexShrink:1},
  countText:{marginLeft:'auto',fontSize:12,color:C.textMuted},

  dropdown:{position:'absolute',top:90,left:0,right:0,zIndex:100,backgroundColor:'rgba(10,10,10,0.98)',borderRadius:10,borderWidth:1,borderColor:C.border,overflow:'hidden'},
  dropOpt:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,paddingHorizontal:16,borderBottomWidth:1,borderBottomColor:C.border},
  dropText:{fontSize:14,color:C.white},

  list:{padding:14,paddingBottom:20},
  card:{backgroundColor:C.card,borderRadius:14,borderWidth:1,borderColor:C.border,padding:14,marginBottom:10},
  cardTop:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:8},
  cardIcon:{width:42,height:42,borderRadius:12,backgroundColor:'rgba(240,165,0,0.12)',justifyContent:'center',alignItems:'center'},
  cardTitle:{fontSize:15,fontWeight:'700',color:C.white},
  cardArtist:{fontSize:12,color:C.gold,marginTop:2},
  starBtn:{padding:4},
  cardMeta:{flexDirection:'row',flexWrap:'wrap',gap:6,marginBottom:8},
  metaPill:{backgroundColor:'rgba(240,165,0,0.1)',borderRadius:6,borderWidth:1,borderColor:'rgba(240,165,0,0.25)',paddingHorizontal:8,paddingVertical:3},
  metaText:{fontSize:11,color:C.gold,fontWeight:'600'},
  cardNotes:{fontSize:13,color:C.textMuted,marginBottom:8,lineHeight:18},
  cardActions:{flexDirection:'row',alignItems:'center',gap:8},
  openBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:C.gold,borderRadius:8,paddingVertical:9},
  openBtnText:{color:C.black,fontWeight:'700',fontSize:13},
  openBtnGhost:{flex:1,borderRadius:8,paddingVertical:9,borderWidth:1,borderColor:C.border,alignItems:'center'},
  openBtnGhostText:{fontSize:12,color:C.textMuted},
  iconBtn:{width:40,height:40,borderRadius:8,backgroundColor:'rgba(255,255,255,0.05)',borderWidth:1,borderColor:C.border,justifyContent:'center',alignItems:'center'},

  center:{flex:1,justifyContent:'center',alignItems:'center'},
  emptyWrap:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:32,paddingVertical:60},
  emptyTitle:{fontSize:18,fontWeight:'700',color:C.white,marginTop:16,marginBottom:8},
  emptySub:{fontSize:14,color:C.textMuted,textAlign:'center',lineHeight:22,marginBottom:24},
  emptyBtn:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:C.gold,borderRadius:10,paddingHorizontal:20,paddingVertical:12},
  emptyBtnText:{color:C.black,fontWeight:'700',fontSize:14},
});

// ── Form Modal styles ─────────────────────────────────────────────────────────
const fm = StyleSheet.create({
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.75)',justifyContent:'flex-end'},
  sheet:{backgroundColor:'#0A0A0A',borderTopLeftRadius:20,borderTopRightRadius:20,borderWidth:1,borderColor:C.border,maxHeight:'92%'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:18,borderBottomWidth:1,borderBottomColor:C.border},
  headerTitle:{fontSize:17,fontWeight:'700',color:C.white},
  req:{fontSize:12,color:C.textMuted,marginBottom:6},
  label:{fontSize:13,color:C.textMuted,marginTop:14,marginBottom:6,fontWeight:'600'},
  input:{backgroundColor:'rgba(255,255,255,0.06)',borderRadius:10,borderWidth:1,borderColor:C.border,paddingHorizontal:14,paddingVertical:12,color:C.white,fontSize:14,...Platform.select({web:{outlineStyle:'none'}})},
  inputErr:{borderColor:'#EF4444'},
  errText:{color:'#EF4444',fontSize:12,marginTop:4},
  saveBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,backgroundColor:C.gold,borderRadius:12,paddingVertical:15,marginTop:20},
  saveBtnText:{color:C.black,fontWeight:'800',fontSize:15},
});

// ── Playlist Modal styles ─────────────────────────────────────────────────────
const pl = StyleSheet.create({
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.75)',justifyContent:'flex-end'},
  sheet:{backgroundColor:'#0A0A0A',borderTopLeftRadius:20,borderTopRightRadius:20,borderWidth:1,borderColor:C.border,maxHeight:'88%'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:18,borderBottomWidth:1,borderBottomColor:C.border},
  headerTitle:{fontSize:17,fontWeight:'700',color:C.white},
  createRow:{flexDirection:'row',gap:10,marginBottom:16},
  createInput:{flex:1,backgroundColor:'rgba(255,255,255,0.06)',borderRadius:10,borderWidth:1,borderColor:C.border,paddingHorizontal:14,paddingVertical:12,color:C.white,fontSize:14},
  createBtn:{width:46,height:46,borderRadius:10,backgroundColor:C.gold,justifyContent:'center',alignItems:'center'},
  emptyWrap:{paddingVertical:30,alignItems:'center'},
  emptyText:{color:C.textMuted,fontSize:14,textAlign:'center'},
  plCard:{flexDirection:'row',alignItems:'center',backgroundColor:'rgba(255,255,255,0.04)',borderRadius:12,borderWidth:1,borderColor:C.border,padding:14,marginBottom:8,gap:12},
  plIconWrap:{width:38,height:38,borderRadius:10,backgroundColor:'rgba(240,165,0,0.1)',justifyContent:'center',alignItems:'center'},
  plName:{fontSize:15,fontWeight:'700',color:C.white},
  plCount:{fontSize:12,color:C.textMuted,marginTop:2},
  plAction:{padding:4},
  sectionLabel:{fontSize:11,color:C.textMuted,fontWeight:'700',letterSpacing:0.8,marginBottom:10},
  songRow:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:10,borderBottomWidth:1,borderBottomColor:C.border},
  checkbox:{width:24,height:24,borderRadius:6,borderWidth:1.5,borderColor:C.border,justifyContent:'center',alignItems:'center'},
  checkboxOn:{backgroundColor:C.gold,borderColor:C.gold},
  songTitle:{fontSize:14,fontWeight:'600',color:C.white},
  songArtist:{fontSize:12,color:C.textMuted,marginTop:1},
});
