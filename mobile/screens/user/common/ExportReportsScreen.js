import React, { useContext, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, TextInput, Platform,
  RefreshControl, Switch, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../../../constants/theme';
import {
  ChevronLeft, ChevronRight, ChevronDown, FileText, Download,
  Trash2, Eye, Search, Clock, CheckCircle, AlertTriangle,
  BarChart2, Filter, Plus, X
} from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import ParticleBackground from '../../../components/ParticleBackground';
import SecurityFooter from '../../../components/SecurityFooter';
import {
  REPORT_MODULES, generateReport, toCSV, toJSON, toHTML,
  downloadOnWeb, printOnWeb, shareNative,
  getReportHistory, addReportToHistory, deleteReportFromHistory,
  fmtCur
} from '../../../services/reportService';
import { RANGES } from '../../../services/analyticsService';

const SMART_RANGES = RANGES.filter(r => r !== 'Custom');
const EXPORT_FORMATS = ['CSV', 'JSON', 'PDF'];

// ── STEP: 'home' | 'configure' | 'preview' ──────────────────────────────────

export default function ExportReportsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [step, setStep]         = useState('home');

  // Config state
  const [selectedModule, setSelectedModule] = useState(null);
  const [range, setRange]                   = useState('This Month');
  const [customStart, setCustomStart]       = useState('');
  const [customEnd, setCustomEnd]           = useState('');
  const [customErr, setCustomErr]           = useState('');
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [showModulePicker, setShowModulePicker] = useState(false);
  const [opts, setOpts] = useState({
    includeSummary: true, includeDetails: true,
    includeDates: true, includeCategories: true, includeNotes: true
  });

  // Report state
  const [report, setReport]     = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  // Export state
  const [exporting, setExporting] = useState('');
  const [exportMsg, setExportMsg] = useState('');

  // History state
  const [history, setHistory]   = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [histSearch, setHistSearch]   = useState('');
  const [refreshing, setRefreshing]   = useState(false);

  const loadHistory = useCallback(async (isRefresh=false) => {
    if (!user?.user_id) return;
    if (isRefresh) setRefreshing(true); else setHistLoading(true);
    const h = await getReportHistory(user.user_id);
    setHistory(h);
    setHistLoading(false);
    setRefreshing(false);
  }, [user?.user_id]);

  useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

  // ── Display (DD/MM/YYYY) ↔ ISO (YYYY-MM-DD) helpers ──────────────────────
  const displayToISO = (disp) => {
    const digits = disp.replace(/[^0-9]/g, '');
    if (digits.length !== 8) return null;
    const d = digits.slice(0, 2), m = digits.slice(2, 4), y = digits.slice(4, 8);
    const iso = `${y}-${m}-${d}`;
    const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    if (dt.getFullYear() !== parseInt(y) || dt.getMonth() !== parseInt(m) - 1 || dt.getDate() !== parseInt(d)) return null;
    if (parseInt(m) < 1 || parseInt(m) > 12) return null;
    return iso;
  };
  const isoToDisplay = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  // ── Validate custom date ───────────────────────────────────────────────────
  const validateCustom = () => {
    setCustomErr('');
    if (!customStart || !customEnd) { setCustomErr('Both dates required.'); return false; }
    const isoStart = displayToISO(customStart);
    const isoEnd   = displayToISO(customEnd);
    if (!isoStart) { setCustomErr('Invalid start date. Enter as DD/MM/YYYY (e.g. 01/09/2026).'); return false; }
    if (!isoEnd)   { setCustomErr('Invalid end date. Enter as DD/MM/YYYY (e.g. 30/09/2026).'); return false; }
    if (isoStart > isoEnd) { setCustomErr('Start date must be before end date.'); return false; }
    return { isoStart, isoEnd };
  };

  // ── Generate report ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedModule) { setGenError('Please select a module.'); return; }
    let isoStart = customStart, isoEnd = customEnd;
    if (range === 'Custom') {
      const validated = validateCustom();
      if (!validated) return;
      isoStart = validated.isoStart;
      isoEnd   = validated.isoEnd;
    }
    setGenError('');
    setGenerating(true);
    setExportMsg('');
    try {
      const custom = { start: isoStart, end: isoEnd };
      const r = await generateReport(user.user_id, selectedModule.key, range, custom, opts);
      setReport(r);
      setStep('preview');
    } catch (e) {
      setGenError('Failed to generate report. Please try again.');
    }
    setGenerating(false);
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = async (format) => {
    if (!report) return;
    setExporting(format);
    setExportMsg('');
    try {
      const safeName = `${report.moduleLabel.replace(/\s+/g,'_')}_${report.start}_${report.end}`;
      let success = false;
      if (format === 'CSV') {
        const csv = toCSV(report);
        if (Platform.OS === 'web') success = downloadOnWeb(csv, `${safeName}.csv`, 'text/csv');
        else success = await shareNative(csv, `${safeName}.csv`);
      } else if (format === 'JSON') {
        const json = toJSON(report);
        if (Platform.OS === 'web') success = downloadOnWeb(json, `${safeName}.json`, 'application/json');
        else success = await shareNative(json, `${safeName}.json`);
      } else if (format === 'PDF') {
        const html = toHTML(report);
        if (Platform.OS === 'web') success = printOnWeb(html);
        else {
          // Native: share as HTML file
          success = await shareNative(html, `${safeName}.html`);
        }
      }
      if (success) {
        setExportMsg(`${format} exported successfully.`);
        // Save to history
        const meta = {
          reportName: `${report.moduleLabel} Report`,
          moduleKey: report.moduleKey,
          moduleLabel: report.moduleLabel,
          range: report.range,
          start: report.start, end: report.end,
          format,
          recordCount: report.details?.length || 0
        };
        const updated = await addReportToHistory(user.user_id, meta);
        setHistory(updated);
      } else {
        setExportMsg('Export could not be completed. Please try again.');
      }
    } catch (e) {
      setExportMsg('Export failed: ' + (e.message || 'Unknown error'));
    }
    setExporting('');
  };

  // ── Delete history entry ───────────────────────────────────────────────────
  const handleDelete = (id, name) => {
    const doDelete = async () => {
      const updated = await deleteReportFromHistory(user.user_id, id);
      setHistory(updated !== undefined ? updated : history.filter(h => h.id !== id));
      // reload to be safe
      loadHistory();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${name}"?`)) doDelete();
    } else {
      Alert.alert('Delete Report', `Delete "${name}" from history?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete }
      ]);
    }
  };

  // ── Filtered history ───────────────────────────────────────────────────────
  const filteredHistory = useMemo(() => {
    if (!histSearch) return history;
    const q = histSearch.toLowerCase();
    return history.filter(h =>
      (h.reportName||'').toLowerCase().includes(q) ||
      (h.moduleLabel||'').toLowerCase().includes(q) ||
      (h.format||'').toLowerCase().includes(q)
    );
  }, [history, histSearch]);

  const fmtTs = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  // PREVIEW STEP
  if (step === 'preview' && report) {
    const cols = report.details?.length > 0
      ? (report.columns || []).filter(c => c in (report.details[0] || {}))
      : [];

    return (
      <SafeAreaView style={s.safe}>
        <ParticleBackground />
        <View style={s.header}>
          <TouchableOpacity onPress={() => { setStep('configure'); setExportMsg(''); }} style={s.backBtn}>
            <ChevronLeft color={C.white} size={28} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Report Preview</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Meta */}
          <View style={s.previewMeta}>
            <Text style={s.previewModLabel}>{report.moduleLabel}</Text>
            <Text style={s.previewRange}>{report.range} · {report.start} → {report.end}</Text>
            <Text style={s.previewGenAt}>Generated: {new Date(report.generatedAt).toLocaleString()}</Text>
          </View>

          {/* Summary */}
          <View style={s.section}>
            <Text style={s.secTitle}>SUMMARY</Text>
            {Object.entries(report.summary || {}).map(([k, v]) => {
              if (typeof v === 'object' && v !== null) return null;
              return (
                <View key={k} style={s.sumRow}>
                  <Text style={s.sumKey}>{k.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase())}</Text>
                  <Text style={s.sumVal}>{typeof v === 'number' && v > 100 ? fmtCur(v) : String(v)}</Text>
                </View>
              );
            })}
          </View>

          {/* Details */}
          {report.details?.length > 0 && (
            <View style={s.section}>
              <Text style={s.secTitle}>DETAILS ({report.details.length} records)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View>
                  {/* Header row */}
                  <View style={s.tableHeader}>
                    {cols.map(c => <Text key={c} style={s.tableHead}>{c}</Text>)}
                  </View>
                  {/* Data rows */}
                  {report.details.slice(0, 50).map((row, i) => (
                    <View key={i} style={[s.tableRow, i%2===0&&s.tableRowAlt]}>
                      {cols.map(c => (
                        <Text key={c} style={s.tableCell} numberOfLines={2}>{String(row[c]??'')}</Text>
                      ))}
                    </View>
                  ))}
                  {report.details.length > 50 && (
                    <View style={s.tableRow}>
                      <Text style={[s.tableCell, {color:C.textMuted}]}>...and {report.details.length - 50} more records (exported in full)</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          )}

          {report.details?.length === 0 && (
            <View style={s.emptyState}>
              <FileText color={C.textMuted} size={40} />
              <Text style={s.emptyTitle}>No records found</Text>
              <Text style={s.emptyDesc}>No data available for the selected module and period.</Text>
            </View>
          )}

          {/* Export buttons */}
          <View style={s.section}>
            <Text style={s.secTitle}>EXPORT AS</Text>
            {exportMsg ? (
              <View style={[s.exportMsg, { borderColor: exportMsg.includes('success') ? '#22C55E' : '#EF4444' }]}>
                {exportMsg.includes('success')
                  ? <CheckCircle color="#22C55E" size={16} />
                  : <AlertTriangle color="#EF4444" size={16} />}
                <Text style={[s.exportMsgText, { color: exportMsg.includes('success') ? '#22C55E' : '#EF4444' }]}>{exportMsg}</Text>
              </View>
            ) : null}
            <View style={s.exportBtnsRow}>
              {EXPORT_FORMATS.map(fmt => (
                <TouchableOpacity
                  key={fmt}
                  style={[s.exportBtn, exporting === fmt && s.exportBtnDisabled]}
                  onPress={() => handleExport(fmt)}
                  disabled={!!exporting}
                >
                  {exporting === fmt
                    ? <ActivityIndicator color={C.black} size="small" />
                    : <Download color={C.black} size={18} />}
                  <Text style={s.exportBtnText}>{fmt}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {Platform.OS !== 'web' && (
              <Text style={s.platformNote}>Files will open in your device's share sheet.</Text>
            )}
            {Platform.OS === 'web' && (
              <Text style={s.platformNote}>CSV/JSON will download. PDF will open print dialog.</Text>
            )}
          </View>

          <SecurityFooter />
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // CONFIGURE STEP
  if (step === 'configure') {
    return (
      <SafeAreaView style={s.safe}>
        <ParticleBackground />
        <View style={s.header}>
          <TouchableOpacity onPress={() => setStep('home')} style={s.backBtn}>
            <ChevronLeft color={C.white} size={28} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Create Report</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Module picker */}
          <View style={s.section}>
            <Text style={s.secTitle}>SELECT MODULE</Text>
            <TouchableOpacity style={s.picker} onPress={() => setShowModulePicker(p=>!p)}>
              <Text style={[s.pickerText, !selectedModule && { color: C.textMuted }]}>
                {selectedModule?.label || 'Choose a module...'}
              </Text>
              <ChevronDown color={C.gold} size={16} />
            </TouchableOpacity>
            {showModulePicker && (
              <View style={s.pickerMenu}>
                {REPORT_MODULES.map(m => (
                  <TouchableOpacity key={m.key} style={s.pickerOpt} onPress={() => { setSelectedModule(m); setShowModulePicker(false); }}>
                    <Text style={[s.pickerOptText, selectedModule?.key===m.key && { color: C.gold, fontWeight:'700' }]}>{m.label}</Text>
                    {selectedModule?.key === m.key && <CheckCircle color={C.gold} size={16} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Date range */}
          <View style={s.section}>
            <Text style={s.secTitle}>DATE RANGE</Text>
            <TouchableOpacity style={s.picker} onPress={() => setShowRangePicker(p=>!p)}>
              <Text style={s.pickerText}>{range}</Text>
              <ChevronDown color={C.gold} size={16} />
            </TouchableOpacity>
            {showRangePicker && (
              <View style={s.pickerMenu}>
                {[...SMART_RANGES, 'Custom'].map(r => (
                  <TouchableOpacity key={r} style={s.pickerOpt} onPress={() => { setRange(r); setShowRangePicker(false); }}>
                    <Text style={[s.pickerOptText, range===r && { color: C.gold, fontWeight:'700' }]}>{r}</Text>
                    {range===r && <CheckCircle color={C.gold} size={16} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {range === 'Custom' && (
              <View style={s.customRow}>
                <TextInput
                  style={[s.custInput, {flex:1}, Platform.select({ web: { outlineStyle: 'none' } })]}
                  placeholder="Start DD/MM/YYYY" placeholderTextColor={C.textMuted}
                  value={customStart}
                  onChangeText={v => {
                    const digits = v.replace(/[^0-9]/g, '');
                    let fmt = digits;
                    if (digits.length > 2) fmt = digits.slice(0,2) + '/' + digits.slice(2);
                    if (digits.length > 4) fmt = digits.slice(0,2) + '/' + digits.slice(2,4) + '/' + digits.slice(4,8);
                    setCustomStart(fmt);
                  }}
                  keyboardType="numeric" maxLength={10}
                />
                <TextInput
                  style={[s.custInput, {flex:1}, Platform.select({ web: { outlineStyle: 'none' } })]}
                  placeholder="End DD/MM/YYYY" placeholderTextColor={C.textMuted}
                  value={customEnd}
                  onChangeText={v => {
                    const digits = v.replace(/[^0-9]/g, '');
                    let fmt = digits;
                    if (digits.length > 2) fmt = digits.slice(0,2) + '/' + digits.slice(2);
                    if (digits.length > 4) fmt = digits.slice(0,2) + '/' + digits.slice(2,4) + '/' + digits.slice(4,8);
                    setCustomEnd(fmt);
                  }}
                  keyboardType="numeric" maxLength={10}
                />
              </View>
            )}
            {customErr ? <Text style={s.errText}>{customErr}</Text> : null}
          </View>

          {/* Options */}
          <View style={s.section}>
            <Text style={s.secTitle}>REPORT OPTIONS</Text>
            {[
              { key: 'includeDetails',    label: 'Include detailed records' },
              { key: 'includeSummary',    label: 'Include summary'          },
              { key: 'includeDates',      label: 'Include dates'            },
              { key: 'includeCategories', label: 'Include categories'       },
              { key: 'includeNotes',      label: 'Include notes/description' },
            ].map(o => (
              <View key={o.key} style={s.optRow}>
                <Text style={s.optLabel}>{o.label}</Text>
                <Switch
                  value={opts[o.key]}
                  onValueChange={v => setOpts(prev=>({...prev,[o.key]:v}))}
                  trackColor={{ false: C.border, true: C.gold }}
                  thumbColor={opts[o.key] ? C.black : '#888'}
                />
              </View>
            ))}
          </View>

          {/* Generate button */}
          {genError ? <Text style={s.errText}>{genError}</Text> : null}
          <TouchableOpacity
            style={[s.generateBtn, generating && s.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={generating}
          >
            {generating
              ? <ActivityIndicator color={C.black} size="small" />
              : <Eye color={C.black} size={18} />}
            <Text style={s.generateBtnText}>{generating ? 'Generating...' : 'Preview Report'}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // HOME STEP ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      <View style={s.header}>
        <View style={{ width: 32 }} />
        <Text style={s.headerTitle}>Export & Reports</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} tintColor={C.gold} />}
      >

        {/* Hero card */}
        <View style={s.heroCard}>
          <BarChart2 color={C.gold} size={32} />
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle}>Reports & Exports</Text>
            <Text style={s.heroSub}>Generate reports from your actual app data and export in CSV, JSON or PDF format.</Text>
          </View>
        </View>

        {/* Create report button */}
        <TouchableOpacity style={s.createBtn} onPress={() => { setStep('configure'); setGenError(''); setExportMsg(''); }}>
          <Plus color={C.black} size={20} />
          <Text style={s.createBtnText}>Create New Report</Text>
        </TouchableOpacity>

        {/* Available modules */}
        <View style={s.section}>
          <Text style={s.secTitle}>AVAILABLE MODULES</Text>
          <View style={s.moduleGrid}>
            {REPORT_MODULES.map(m => (
              <TouchableOpacity key={m.key} style={s.moduleChip}
                onPress={() => { setSelectedModule(m); setStep('configure'); setGenError(''); setExportMsg(''); }}>
                <Text style={s.moduleChipText}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Export formats info */}
        <View style={s.section}>
          <Text style={s.secTitle}>EXPORT FORMATS</Text>
          {[
            { fmt:'CSV',  desc:'Structured spreadsheet data, compatible with Excel & Google Sheets.' },
            { fmt:'JSON', desc:'Structured JSON data, ideal for developers and data processing.' },
            { fmt:'PDF',  desc:'Printable report. On web, opens print dialog to save as PDF.' },
          ].map(f => (
            <View key={f.fmt} style={s.fmtRow}>
              <View style={s.fmtBadge}><Text style={s.fmtBadgeText}>{f.fmt}</Text></View>
              <Text style={s.fmtDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>

        {/* Recent reports */}
        <View style={s.section}>
          <Text style={s.secTitle}>RECENT REPORTS</Text>
          {/* Search bar */}
          <View style={s.searchBar}>
            <Search color={C.textMuted} size={16} />
            <TextInput
              style={s.searchInput}
              placeholder="Search reports..."
              placeholderTextColor={C.textMuted}
              value={histSearch}
              onChangeText={setHistSearch}
            />
            {histSearch ? <TouchableOpacity onPress={() => setHistSearch('')}><X color={C.textMuted} size={16} /></TouchableOpacity> : null}
          </View>

          {histLoading ? (
            <ActivityIndicator color={C.gold} size="small" style={{ marginVertical: 20 }} />
          ) : filteredHistory.length === 0 ? (
            <View style={s.emptyState}>
              <Clock color={C.textMuted} size={36} />
              <Text style={s.emptyTitle}>{histSearch ? 'No matching reports' : 'No reports yet'}</Text>
              <Text style={s.emptyDesc}>{histSearch ? 'Try a different search term.' : 'Create your first report using the button above.'}</Text>
            </View>
          ) : (
            filteredHistory.map(h => (
              <View key={h.id} style={s.histCard}>
                <View style={s.histLeft}>
                  <View style={s.histIconWrap}><FileText color={C.gold} size={18} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.histName} numberOfLines={1}>{h.reportName}</Text>
                    <Text style={s.histMeta}>{h.moduleLabel} · {h.range}</Text>
                    <Text style={s.histMeta}>{h.start} → {h.end}</Text>
                    <View style={s.histBadgeRow}>
                      <View style={s.histFmtBadge}><Text style={s.histFmtText}>{h.format}</Text></View>
                      <Text style={s.histDate}>{fmtTs(h.createdAt)}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={s.histDeleteBtn} onPress={() => handleDelete(h.id, h.reportName)}>
                  <Trash2 color="#EF4444" size={18} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <SecurityFooter />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const COL_W = 110;
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#06080D' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: 'rgba(5,5,5,0.9)'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.white },
  backBtn: { padding: 4 },
  scroll: { padding: 14, paddingBottom: 60 },

  heroCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 14
  },
  heroTitle: { fontSize: 17, fontWeight: '700', color: C.white, marginBottom: 4 },
  heroSub: { fontSize: 13, color: C.textMuted, lineHeight: 20 },

  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.gold, borderRadius: 12, padding: 16, marginBottom: 14
  },
  createBtnText: { color: C.black, fontWeight: '800', fontSize: 16 },

  section: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 12 },
  secTitle: { fontSize: 11, color: C.gold, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12 },

  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moduleChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.04)'
  },
  moduleChipText: { fontSize: 12, color: C.white },

  fmtRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  fmtBadge: { backgroundColor: C.gold, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, minWidth: 44, alignItems: 'center' },
  fmtBadgeText: { color: C.black, fontWeight: '800', fontSize: 12 },
  fmtDesc: { flex: 1, fontSize: 13, color: C.textMuted, lineHeight: 20 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, borderWidth: 1,
    borderColor: C.border, paddingHorizontal: 12, height: 44, marginBottom: 12
  },
  searchInput: { flex: 1, color: C.white, fontSize: 14 },

  // History card
  histCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, borderWidth: 1,
    borderColor: C.border, padding: 12, marginBottom: 8
  },
  histLeft: { flex: 1, flexDirection: 'row', gap: 10 },
  histIconWrap: { width: 36, height: 36, borderRadius: 9, backgroundColor: 'rgba(240,165,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  histName: { fontSize: 14, fontWeight: '700', color: C.white, marginBottom: 3 },
  histMeta: { fontSize: 12, color: C.textMuted },
  histBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  histFmtBadge: { backgroundColor: 'rgba(240,165,0,0.15)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  histFmtText: { fontSize: 11, color: C.gold, fontWeight: '700' },
  histDate: { fontSize: 11, color: C.textMuted },
  histDeleteBtn: { padding: 6 },

  // Picker
  picker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, borderWidth: 1,
    borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13
  },
  pickerText: { fontSize: 14, color: C.white },
  pickerMenu: { backgroundColor: 'rgba(10,10,10,0.98)', borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginTop: 6 },
  pickerOpt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerOptText: { fontSize: 14, color: C.white },

  customRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  custInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 10, color: C.white, fontSize: 13 },
  errText: { color: '#EF4444', fontSize: 13, marginTop: 6 },

  // Options
  optRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  optLabel: { fontSize: 14, color: C.white },

  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.gold, borderRadius: 12, padding: 16, marginTop: 14
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { color: C.black, fontWeight: '800', fontSize: 16 },

  // Preview
  previewMeta: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  previewModLabel: { fontSize: 18, fontWeight: '800', color: C.white, marginBottom: 4 },
  previewRange: { fontSize: 13, color: C.gold, fontWeight: '600' },
  previewGenAt: { fontSize: 12, color: C.textMuted, marginTop: 4 },

  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  sumKey: { fontSize: 13, color: C.textMuted },
  sumVal: { fontSize: 13, color: C.white, fontWeight: '600' },

  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: 'rgba(240,165,0,0.15)', borderRadius: 6, marginBottom: 2 },
  tableHead: { width: COL_W, padding: 8, fontSize: 11, color: C.gold, fontWeight: '700' },
  tableRow: { flexDirection: 'row' },
  tableRowAlt: { backgroundColor: 'rgba(255,255,255,0.03)' },
  tableCell: { width: COL_W, padding: 8, fontSize: 12, color: C.white },

  // Export
  exportBtnsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.gold, borderRadius: 10, paddingVertical: 13 },
  exportBtnDisabled: { opacity: 0.6 },
  exportBtnText: { color: C.black, fontWeight: '800', fontSize: 14 },
  exportMsg: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 8 },
  exportMsgText: { fontSize: 13, fontWeight: '600', flex: 1 },
  platformNote: { fontSize: 12, color: C.textMuted, marginTop: 8, textAlign: 'center' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyTitle: { fontSize: 16, color: C.white, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
});
