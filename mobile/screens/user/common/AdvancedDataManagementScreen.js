import React, { useContext, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, Platform,
  TextInput, Switch, KeyboardAvoidingView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { C } from '../../../constants/theme';
import {
  ChevronLeft, Database, Download, Upload, Trash2,
  ChevronRight, Search, FileText, CheckCircle, AlertTriangle,
  Clock, Shield, Settings, Server, RefreshCw
} from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import ParticleBackground from '../../../components/ParticleBackground';
import SecurityFooter from '../../../components/SecurityFooter';
import {
  DATA_MODULES, computeDataOverview, exportData,
  validateImportBundle, importData, clearModuleData,
  getBackupSummary, getActivity, fmtBytes, fmtTs
} from '../../../services/dataManagementService';

// ── Components ───────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Export', 'Import', 'Manage', 'Activity'];

// ── OVERVIEW TAB
const OverviewTab = ({ loading, stats, onModuleClick }) => {
  if (loading) return <View style={s.center}><ActivityIndicator color={C.gold} size="large" /></View>;
  if (!stats) return null;

  return (
    <View style={s.tabContent}>
      {/* Hero Stats */}
      <View style={s.statsGrid}>
        <View style={s.statBox}>
          <Database color={C.gold} size={20} />
          <Text style={s.statVal}>{stats.totalRecords}</Text>
          <Text style={s.statLbl}>Total Records</Text>
        </View>
        <View style={s.statBox}>
          <Server color={C.gold} size={20} />
          <Text style={s.statVal}>{stats.activeModules}</Text>
          <Text style={s.statLbl}>Active Modules</Text>
        </View>
        <View style={s.statBox}>
          <Shield color={C.gold} size={20} />
          <Text style={s.statVal}>{fmtBytes(stats.totalBytes)}</Text>
          <Text style={s.statLbl}>Storage Used</Text>
        </View>
        <View style={s.statBox}>
          <Clock color={C.gold} size={20} />
          <Text style={s.statVal}>{fmtTs(stats.latestAll).split(',')[0]}</Text>
          <Text style={s.statLbl}>Last Updated</Text>
        </View>
      </View>

      <Text style={s.secTitle}>MODULE BREAKDOWN</Text>
      {stats.modules.sort((a,b) => b.count - a.count).map(m => (
        <TouchableOpacity key={m.key} style={s.modRow} onPress={() => onModuleClick(m)}>
          <View style={s.modIcon}><Database color={C.gold} size={16} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.modName}>{m.label}</Text>
            {m.count > 0 ? (
              <Text style={s.modSub}>{m.count} records · {fmtTs(m.latest)}</Text>
            ) : (
              <Text style={s.modSubEmpty}>No data</Text>
            )}
          </View>
          <ChevronRight color={C.textMuted} size={16} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ── EXPORT TAB
const ExportTab = ({ user, stats, onExportDone }) => {
  const [format, setFormat] = useState('JSON'); // or CSV
  const [mode, setMode] = useState('all'); // all or specific
  const [selected, setSelected] = useState(new Set(DATA_MODULES.map(m=>m.key)));
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg] = useState(null);

  const toggleSelect = (key) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSelected(next);
  };

  const doExport = async () => {
    const keys = mode === 'all' ? DATA_MODULES.map(m=>m.key) : Array.from(selected);
    if (keys.length === 0) { setMsg({ err: true, text: 'Select at least one module.' }); return; }
    setExporting(true); setMsg(null);
    const res = await exportData(user.user_id, keys, format);
    if (res.success) {
      setMsg({ err: false, text: `Data exported successfully as ${format}.` });
      if (onExportDone) onExportDone();
    }
    else setMsg({ err: true, text: res.error || 'Export failed.' });
    setExporting(false);
  };

  return (
    <View style={s.tabContent}>
      <Text style={s.pText}>Export your personal data to your device for backup or analysis. Private keys and PINs are securely excluded.</Text>

      <Text style={s.secTitle}>EXPORT FORMAT</Text>
      <View style={s.fmtRow}>
        {['JSON', 'CSV'].map(f => (
          <TouchableOpacity key={f} style={[s.fmtBtn, format===f && s.fmtBtnOn]} onPress={() => setFormat(f)}>
            <Text style={[s.fmtText, format===f && s.fmtTextOn]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.secTitle}>MODULE SELECTION</Text>
      <View style={s.fmtRow}>
        {['all', 'specific'].map(m => (
          <TouchableOpacity key={m} style={[s.fmtBtn, mode===m && s.fmtBtnOn]} onPress={() => setMode(m)}>
            <Text style={[s.fmtText, mode===m && s.fmtTextOn]}>{m === 'all' ? 'Export All Data' : 'Select Modules'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'specific' && (
        <View style={s.selBox}>
          <View style={s.selHead}>
            <Text style={s.selHeadText}>Available Modules</Text>
            <TouchableOpacity onPress={() => setSelected(new Set(DATA_MODULES.map(x=>x.key)))}>
              <Text style={s.selActText}>Select All</Text>
            </TouchableOpacity>
          </View>
          {DATA_MODULES.map(m => (
            <TouchableOpacity key={m.key} style={s.chkRow} onPress={() => toggleSelect(m.key)}>
              <View style={[s.chk, selected.has(m.key) && s.chkOn]}>
                {selected.has(m.key) && <CheckCircle color={C.black} size={14} />}
              </View>
              <Text style={s.chkLabel}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {msg && (
        <View style={[s.msgBox, msg.err ? s.msgErr : s.msgOk]}>
          {msg.err ? <AlertTriangle color="#EF4444" size={16} /> : <CheckCircle color="#22C55E" size={16} />}
          <Text style={[s.msgText, msg.err ? {color:'#EF4444'} : {color:'#22C55E'}]}>{msg.text}</Text>
        </View>
      )}

      <TouchableOpacity style={[s.primaryBtn, exporting && { opacity: 0.6 }]} onPress={doExport} disabled={exporting}>
        {exporting ? <ActivityIndicator color={C.black} size="small" /> : <Download color={C.black} size={18} />}
        <Text style={s.primaryBtnText}>{exporting ? 'Exporting...' : 'Export Data'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// ── IMPORT TAB
const ImportTab = ({ user, onImportDone }) => {
  const [file, setFile] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [strategy, setStrategy] = useState('add'); // add | replace
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState(null);

  const pickFile = async () => {
    try {
      setMsg(null); setFile(null); setBundle(null);
      let content = null, name = '';
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json,application/json';
        input.onchange = (e) => {
          const f = e.target.files[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const str = ev.target.result;
            const val = validateImportBundle(str);
            if (!val.valid) { setMsg({ err: true, text: val.error }); return; }
            setFile({ name: f.name, size: f.size });
            setBundle(val.parsed);
          };
          reader.readAsText(f);
        };
        input.click();
      } else {
        const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
        if (res.canceled || !res.assets || res.assets.length === 0) return;
        const f = res.assets[0];
        const str = await FileSystem.readAsStringAsync(f.uri);
        const val = validateImportBundle(str);
        if (!val.valid) { setMsg({ err: true, text: val.error }); return; }
        setFile({ name: f.name, size: f.size });
        setBundle(val.parsed);
      }
    } catch (e) {
      setMsg({ err: true, text: 'Failed to read file.' });
    }
  };

  const doImport = async () => {
    if (!bundle) return;
    const execute = async () => {
      setImporting(true); setMsg(null);
      const res = await importData(user.user_id, bundle, strategy);
      if (res.success) {
        setMsg({ err: false, text: `Successfully imported ${res.imported} records. Skipped ${res.skipped} duplicates.` });
        setFile(null); setBundle(null);
        if (onImportDone) onImportDone();
      } else {
        setMsg({ err: true, text: res.error || 'Import failed.' });
      }
      setImporting(false);
    };

    if (strategy === 'replace') {
      if (Platform.OS === 'web') {
        if (window.confirm('This will OVERWRITE your existing data for the imported modules. Continue?')) execute();
      } else {
        Alert.alert('Overwrite Warning', 'This will OVERWRITE existing data for the imported modules. Continue?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', style: 'destructive', onPress: execute }
        ]);
      }
    } else {
      execute();
    }
  };

  return (
    <View style={s.tabContent}>
      <Text style={s.pText}>Restore previously exported data. Only valid Tushu JSON export files are supported.</Text>

      <TouchableOpacity style={s.pickFileBtn} onPress={pickFile}>
        <Upload color={C.gold} size={24} />
        <Text style={s.pickFileText}>{file ? 'Select Different File' : 'Select JSON Export File'}</Text>
      </TouchableOpacity>

      {file && bundle && (
        <View style={s.fileInfo}>
          <FileText color={C.gold} size={20} />
          <View style={{ flex: 1 }}>
            <Text style={s.fileName}>{file.name}</Text>
            <Text style={s.fileMeta}>Version {bundle.version} · {Object.keys(bundle.modules).length} modules</Text>
          </View>
        </View>
      )}

      {msg && (
        <View style={[s.msgBox, msg.err ? s.msgErr : s.msgOk]}>
          {msg.err ? <AlertTriangle color="#EF4444" size={16} /> : <CheckCircle color="#22C55E" size={16} />}
          <Text style={[s.msgText, msg.err ? {color:'#EF4444'} : {color:'#22C55E'}]}>{msg.text}</Text>
        </View>
      )}

      {bundle && (
        <View style={s.stratBox}>
          <Text style={s.secTitle}>IMPORT STRATEGY</Text>
          <View style={s.fmtRow}>
            {[{k:'add',l:'Add / Merge (Safe)'}, {k:'replace',l:'Replace Existing'}].map(m => (
              <TouchableOpacity key={m.k} style={[s.fmtBtn, strategy===m.k && s.fmtBtnOn]} onPress={() => setStrategy(m.k)}>
                <Text style={[s.fmtText, strategy===m.k && s.fmtTextOn]}>{m.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.stratDesc}>
            {strategy === 'add' ? 'Adds new records and skips exact duplicates. Safe for existing data.' : 'WARNING: Deletes existing data for imported modules before importing.'}
          </Text>

          <TouchableOpacity style={[s.primaryBtn, importing && { opacity: 0.6 }]} onPress={doImport} disabled={importing}>
            {importing ? <ActivityIndicator color={C.black} size="small" /> : <Upload color={C.black} size={18} />}
            <Text style={s.primaryBtnText}>{importing ? 'Importing...' : 'Start Import'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ── MANAGE TAB
const ManageTab = ({ user, stats, onClearDone }) => {
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null);

  if (!stats) return null;

  const mods = stats.modules.filter(m => m.count > 0 && m.label.toLowerCase().includes(search.toLowerCase()));

  const handleClear = (mod) => {
    const doIt = async () => {
      setMsg(null);
      const res = await clearModuleData(user.user_id, mod.key);
      if (res.success) {
        setMsg({ err: false, text: `${mod.label} data cleared.` });
        if (onClearDone) onClearDone();
      } else {
        setMsg({ err: true, text: res.error || 'Failed to clear data.' });
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you SURE you want to clear all data in ${mod.label}? This is irreversible.`)) doIt();
    } else {
      Alert.alert('Clear Data', `Are you SURE you want to clear all data in ${mod.label}? This is irreversible.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear Data', style: 'destructive', onPress: doIt }
      ]);
    }
  };

  return (
    <View style={s.tabContent}>
      <Text style={s.pText}>Permanently delete data from specific modules. This action is irreversible unless you have a backup.</Text>
      
      {msg && (
        <View style={[s.msgBox, msg.err ? s.msgErr : s.msgOk]}>
          <Text style={[s.msgText, msg.err ? {color:'#EF4444'} : {color:'#22C55E'}]}>{msg.text}</Text>
        </View>
      )}

      <View style={s.searchBar}>
        <Search color={C.textMuted} size={16} />
        <TextInput style={s.searchInput} placeholder="Search modules..." placeholderTextColor={C.textMuted} value={search} onChangeText={setSearch} />
      </View>

      <Text style={s.secTitle}>ACTIVE MODULES</Text>
      {mods.length === 0 ? <Text style={s.pText}>No active modules to clear.</Text> : mods.map(m => (
        <View key={m.key} style={s.clearRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.clearName}>{m.label}</Text>
            <Text style={s.clearSub}>{m.count} records · {fmtBytes(m.bytes)}</Text>
          </View>
          <TouchableOpacity style={s.clearBtn} onPress={() => handleClear(m)}>
            <Trash2 color="#EF4444" size={16} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

// ── ACTIVITY TAB
const ActivityTab = ({ activities }) => (
  <View style={s.tabContent}>
    {activities.length === 0 ? (
      <Text style={s.pText}>No recent data management activity.</Text>
    ) : activities.map(a => (
      <View key={a.id} style={s.actRow}>
        <View style={s.actIcon}>
          {a.type === 'export' ? <Download color={C.gold} size={16} /> :
           a.type === 'import' ? <Upload color="#22C55E" size={16} /> :
           <Trash2 color="#EF4444" size={16} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.actDetail}>{a.detail}</Text>
          <Text style={s.actTime}>{new Date(a.ts).toLocaleString()}</Text>
        </View>
      </View>
    ))}
  </View>
);

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────
export default function AdvancedDataManagementScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [backupSum, setBackupSum] = useState(null);

  const loadAll = useCallback(async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const [st, acts, bk] = await Promise.all([
        computeDataOverview(user.user_id),
        getActivity(user.user_id),
        getBackupSummary(user.user_id)
      ]);
      setStats(st); setActivities(acts); setBackupSum(bk);
    } catch {}
    setLoading(false);
  }, [user?.user_id]);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  // Module detail sheet
  const [detailMod, setDetailMod] = useState(null);

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><ChevronLeft color={C.white} size={28} /></TouchableOpacity>
        <Text style={s.headerTitle}>Data Management</Text>
        <TouchableOpacity onPress={loadAll} style={s.refreshBtn}><RefreshCw color={C.gold} size={20} /></TouchableOpacity>
      </View>

      {/* Tabs */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabScroll}>
          {TABS.map(t => (
            <TouchableOpacity key={t} style={[s.tabBtn, tab===t && s.tabBtnOn]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, tab===t && s.tabTextOn]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {tab === 'Overview' && <OverviewTab loading={loading} stats={stats} onModuleClick={setDetailMod} />}
        {tab === 'Export'   && <ExportTab user={user} stats={stats} onExportDone={loadAll} />}
        {tab === 'Import'   && <ImportTab user={user} onImportDone={loadAll} />}
        {tab === 'Manage'   && <ManageTab user={user} stats={stats} onClearDone={loadAll} />}
        {tab === 'Activity' && <ActivityTab activities={activities} />}

        {/* Backup widget if overview */}
        {tab === 'Overview' && backupSum && (
          <View style={s.bkupWidget}>
            <Text style={s.secTitle}>BACKUP STATUS</Text>
            <View style={s.bkupRow}>
              <View style={s.bkupIcon}><Shield color="#22C55E" size={20} /></View>
              <View>
                <Text style={s.bkupName}>Advanced Backup & Sync</Text>
                <Text style={s.bkupSub}>Last backed up: {fmtTs(backupSum.latestDate)}</Text>
              </View>
            </View>
          </View>
        )}

        <SecurityFooter />
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Detail Modal */}
      {detailMod && (
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>{detailMod.label}</Text>
              <TouchableOpacity onPress={() => setDetailMod(null)}><X color={C.white} size={22} /></TouchableOpacity>
            </View>
            <View style={s.sheetBody}>
              <View style={s.sheetStatRow}>
                <Text style={s.sheetStatLbl}>Total Records</Text>
                <Text style={s.sheetStatVal}>{detailMod.count}</Text>
              </View>
              <View style={s.sheetStatRow}>
                <Text style={s.sheetStatLbl}>Storage Size</Text>
                <Text style={s.sheetStatVal}>{fmtBytes(detailMod.bytes)}</Text>
              </View>
              <View style={s.sheetStatRow}>
                <Text style={s.sheetStatLbl}>Last Updated</Text>
                <Text style={s.sheetStatVal}>{fmtTs(detailMod.latest)}</Text>
              </View>
              <Text style={s.sheetNote}>Raw data preview is disabled for privacy and security. Use Export to view actual records.</Text>
            </View>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: 'rgba(5,5,5,0.9)' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.white },
  backBtn: { padding: 4 }, refreshBtn: { padding: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  
  tabScroll: { paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.05)' },
  tabBtnOn: { backgroundColor: C.gold, borderColor: C.gold },
  tabText: { fontSize: 13, color: C.white, fontWeight: '600' },
  tabTextOn: { color: C.black, fontWeight: '700' },

  scroll: { padding: 16 },
  tabContent: { flex: 1 },
  secTitle: { fontSize: 11, color: C.gold, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12, marginTop: 16 },
  pText: { fontSize: 13, color: C.textMuted, lineHeight: 20, marginBottom: 12 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statBox: { width: '48%', backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 16, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '700', color: C.white, marginTop: 10, marginBottom: 4 },
  statLbl: { fontSize: 11, color: C.textMuted },

  modRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 8 },
  modIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(240,165,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  modName: { fontSize: 14, fontWeight: '700', color: C.white },
  modSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  modSubEmpty: { fontSize: 12, color: C.gold, marginTop: 2, opacity: 0.8 },

  fmtRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  fmtBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.05)' },
  fmtBtnOn: { backgroundColor: 'rgba(240,165,0,0.15)', borderColor: C.gold },
  fmtText: { fontSize: 14, color: C.white },
  fmtTextOn: { color: C.gold, fontWeight: '700' },

  selBox: { backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 16 },
  selHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  selHeadText: { fontSize: 14, fontWeight: '700', color: C.white },
  selActText: { fontSize: 13, color: C.gold, fontWeight: '600' },
  chkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  chk: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  chkOn: { backgroundColor: C.gold, borderColor: C.gold },
  chkLabel: { fontSize: 14, color: C.white },

  msgBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  msgOk: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  msgErr: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  msgText: { fontSize: 13, fontWeight: '600', flex: 1 },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.gold, borderRadius: 12, paddingVertical: 16, marginTop: 10 },
  primaryBtnText: { color: C.black, fontWeight: '800', fontSize: 15 },

  pickFileBtn: { borderStyle: 'dashed', borderWidth: 2, borderColor: C.border, borderRadius: 14, padding: 30, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', marginBottom: 16 },
  pickFileText: { color: C.gold, fontWeight: '600', marginTop: 12, fontSize: 14 },
  fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  fileName: { fontSize: 14, fontWeight: '700', color: C.white },
  fileMeta: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  stratBox: { backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 8 },
  stratDesc: { fontSize: 12, color: '#EF4444', fontStyle: 'italic', marginBottom: 16, lineHeight: 18 },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, height: 44, marginBottom: 16 },
  searchInput: { flex: 1, color: C.white, fontSize: 14, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  clearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 8 },
  clearName: { fontSize: 14, fontWeight: '700', color: C.white },
  clearSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  clearBtn: { padding: 10, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8 },

  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 8 },
  actIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  actDetail: { fontSize: 13, color: C.white, fontWeight: '600' },
  actTime: { fontSize: 11, color: C.textMuted, marginTop: 4 },

  bkupWidget: { marginTop: 24, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 16 },
  bkupRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bkupIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(34,197,94,0.1)', justifyContent: 'center', alignItems: 'center' },
  bkupName: { fontSize: 14, fontWeight: '700', color: C.white },
  bkupSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20, zIndex: 100 },
  sheet: { backgroundColor: '#0A0A0A', borderRadius: 16, borderWidth: 1, borderColor: C.border },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: C.white },
  sheetBody: { padding: 16 },
  sheetStatRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  sheetStatLbl: { fontSize: 13, color: C.textMuted },
  sheetStatVal: { fontSize: 14, color: C.white, fontWeight: '600' },
  sheetNote: { fontSize: 12, color: C.gold, marginTop: 16, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 },
});
