import React, { useContext, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../../../constants/theme';
import {
  ChevronLeft, ChevronRight, Lightbulb, AlertTriangle, TrendingUp,
  TrendingDown, Wallet, ListTodo, Bell, Calendar, Target, FileText,
  ShoppingCart, Car, Globe, CheckCircle, Clock, CreditCard, BookOpen,
  ArrowUpRight, Star, Info
} from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import ParticleBackground from '../../../components/ParticleBackground';
import SecurityFooter from '../../../components/SecurityFooter';
import {
  generateInsights, INSIGHT_CATEGORIES, fmtCur, fmtDate
} from '../../../services/insightsEngine';
import { RANGES } from '../../../services/analyticsService';

// ── Priority config ──────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  1: { label: 'Critical',         color: '#EF4444', Icon: AlertTriangle },
  2: { label: 'Action Required',  color: '#F97316', Icon: ArrowUpRight  },
  3: { label: 'Upcoming',         color: '#F0A500', Icon: Clock         },
  4: { label: 'Info',             color: '#06B6D4', Icon: Info          },
  5: { label: 'Positive',         color: '#22C55E', Icon: Star          },
};

// ── Category icon map ────────────────────────────────────────────────────────
const CAT_ICON = {
  Finance:      Wallet,
  Productivity: ListTodo,
  Reminders:    Bell,
  Calendar:     Calendar,
  Goals:        Target,
  Personal:     FileText,
  Important:    AlertTriangle,
};

// ── Ranges (reuse from analyticsService, minus Custom) ───────────────────────
const SMART_RANGES = RANGES.filter(r => r !== 'Custom');

export default function SmartInsightsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange]       = useState('This Month');
  const [showRange, setShowRange] = useState(false);
  const [category, setCategory] = useState('All');

  const load = useCallback(async (r = range, isRefresh = false) => {
    if (!user?.user_id) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const result = await generateInsights(user.user_id, r);
      setInsights(result);
    } catch (e) {}
    setLoading(false);
    setRefreshing(false);
  }, [user?.user_id, range]);

  useFocusEffect(useCallback(() => { load(range); }, [user?.user_id, range]));

  const onRangeSelect = (r) => { setRange(r); setShowRange(false); load(r); };

  const filtered = useMemo(() => {
    if (category === 'All') return insights;
    return insights.filter(i => i.category === category);
  }, [insights, category]);

  const safeNav = (route) => {
    if (!route) return;
    try { navigation.navigate(route); } catch (e) {}
  };

  // ── Count by priority for header summary ────────────────────────────────
  const criticalCount = insights.filter(i => i.priority <= 2).length;

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      <View style={s.header}>
        <View style={{ width: 32 }} />
        <Text style={s.headerTitle}>Smart Insights</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.gold} size="large" />
        <Text style={{ color: C.textMuted, marginTop: 12 }}>Analyzing your data...</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />

      {/* HEADER */}
      <View style={s.header}>
        <View style={{ width: 32 }} />
        <Text style={s.headerTitle}>Smart Insights</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(range, true)} tintColor={C.gold} />}
      >

        {/* SUMMARY HEADER CARD */}
        <View style={s.summaryCard}>
          <View style={s.summaryLeft}>
            <Lightbulb color={C.gold} size={22} />
            <View>
              <Text style={s.summaryCount}>{insights.length} insight{insights.length !== 1 ? 's' : ''}</Text>
              <Text style={s.summaryRange}>for {range.toLowerCase()}</Text>
            </View>
          </View>
          {criticalCount > 0 && (
            <View style={s.critBadge}>
              <AlertTriangle color="#EF4444" size={14} />
              <Text style={s.critBadgeText}>{criticalCount} need attention</Text>
            </View>
          )}
        </View>

        {/* RANGE PICKER */}
        <TouchableOpacity style={s.rangeBtn} onPress={() => setShowRange(p => !p)}>
          <Text style={s.rangeBtnText}>{range}</Text>
          <ChevronRight color={C.gold} size={16} style={{ transform: [{ rotate: showRange ? '-90deg' : '90deg' }] }} />
        </TouchableOpacity>
        {showRange && (
          <View style={s.rangeMenu}>
            {SMART_RANGES.map(r => (
              <TouchableOpacity key={r} style={s.rangeOpt} onPress={() => onRangeSelect(r)}>
                <Text style={[s.rangeOptText, range === r && { color: C.gold, fontWeight: '700' }]}>{r}</Text>
                {range === r && <CheckCircle color={C.gold} size={16} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* CATEGORY FILTER CHIPS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {INSIGHT_CATEGORIES.map(cat => {
            const CatIcon = CAT_ICON[cat];
            const count = cat === 'All' ? insights.length : insights.filter(i => i.category === cat).length;
            if (count === 0 && cat !== 'All') return null;
            return (
              <TouchableOpacity
                key={cat}
                style={[s.chip, category === cat && s.chipActive]}
                onPress={() => setCategory(cat)}
              >
                {CatIcon && <CatIcon color={category === cat ? C.black : C.textMuted} size={13} />}
                <Text style={[s.chipText, category === cat && s.chipTextActive]}>
                  {cat} {count > 0 ? `(${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* INSIGHT CARDS */}
        {filtered.length === 0 ? (
          <View style={s.emptyState}>
            <Lightbulb color={C.textMuted} size={52} />
            <Text style={s.emptyTitle}>
              {insights.length === 0 ? 'No smart insights yet' : `No ${category} insights`}
            </Text>
            <Text style={s.emptyDesc}>
              {insights.length === 0
                ? 'Keep using the app to unlock personalized insights. Add expenses, tasks, reminders and events to get started.'
                : 'Try selecting a different category or time range.'}
            </Text>
          </View>
        ) : (
          filtered.map(ins => {
            const pConf  = PRIORITY_CONFIG[ins.priority] || PRIORITY_CONFIG[4];
            const CatIcon = CAT_ICON[ins.category] || Info;
            return (
              <View key={ins.id} style={[s.insightCard, { borderLeftColor: pConf.color }]}>
                {/* Top row: category + priority badge */}
                <View style={s.cardTop}>
                  <View style={s.cardCatRow}>
                    <View style={[s.catIconWrap, { backgroundColor: pConf.color + '18' }]}>
                      <CatIcon color={pConf.color} size={16} />
                    </View>
                    <Text style={[s.catLabel, { color: pConf.color }]}>{ins.category.toUpperCase()}</Text>
                  </View>
                  <View style={[s.priorityBadge, { backgroundColor: pConf.color + '18', borderColor: pConf.color + '44' }]}>
                    <pConf.Icon color={pConf.color} size={12} />
                    <Text style={[s.priorityBadgeText, { color: pConf.color }]}>{pConf.label}</Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={s.insightTitle}>{ins.title}</Text>

                {/* Detail */}
                <Text style={s.insightDetail}>{ins.detail}</Text>

                {/* Value pill */}
                {ins.value ? (
                  <View style={s.valuePill}>
                    <Text style={s.valuePillText}>{ins.value}</Text>
                  </View>
                ) : null}

                {/* Action button */}
                {ins.route && ins.routeLabel ? (
                  <TouchableOpacity style={s.actionBtn} onPress={() => safeNav(ins.route)}>
                    <Text style={s.actionBtnText}>{ins.routeLabel}</Text>
                    <ChevronRight color={C.black} size={14} />
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })
        )}

        {/* PRIORITY LEGEND */}
        {filtered.length > 0 && (
          <View style={s.legendCard}>
            <Text style={s.legendTitle}>PRIORITY GUIDE</Text>
            <View style={s.legendGrid}>
              {Object.entries(PRIORITY_CONFIG).map(([p, conf]) => (
                <View key={p} style={s.legendRow}>
                  <conf.Icon color={conf.color} size={13} />
                  <Text style={[s.legendText, { color: conf.color }]}>{conf.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <SecurityFooter />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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

  // Summary card
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    padding: 16, marginBottom: 10
  },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryCount: { fontSize: 17, fontWeight: '800', color: C.white },
  summaryRange: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  critBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(239,68,68,0.12)', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)'
  },
  critBadgeText: { fontSize: 12, color: '#EF4444', fontWeight: '700' },

  // Range picker
  rangeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8
  },
  rangeBtnText: { fontSize: 14, color: C.white, fontWeight: '600' },
  rangeMenu: {
    backgroundColor: 'rgba(10,10,10,0.98)', borderRadius: 10,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 10
  },
  rangeOpt: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border
  },
  rangeOptText: { fontSize: 14, color: C.white },

  // Filter chips
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, marginRight: 8
  },
  chipActive: { backgroundColor: C.gold, borderColor: C.gold },
  chipText: { fontSize: 12, color: C.textMuted, fontWeight: '600' },
  chipTextActive: { color: C.black, fontWeight: '700' },

  // Insight card
  insightCard: {
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    borderLeftWidth: 4, padding: 16, marginBottom: 10
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardCatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catIconWrap: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  catLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  priorityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1
  },
  priorityBadgeText: { fontSize: 11, fontWeight: '700' },
  insightTitle: { fontSize: 16, fontWeight: '700', color: C.white, marginBottom: 6 },
  insightDetail: { fontSize: 14, color: C.textMuted, lineHeight: 22, marginBottom: 8 },
  valuePill: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(240,165,0,0.12)',
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(240,165,0,0.3)',
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10
  },
  valuePillText: { fontSize: 13, color: C.gold, fontWeight: '700' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', backgroundColor: C.gold,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8
  },
  actionBtnText: { color: C.black, fontWeight: '700', fontSize: 13 },

  // Empty state
  emptyState: { paddingTop: 50, alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  emptyTitle: { fontSize: 18, color: C.white, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22 },

  // Legend
  legendCard: {
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    padding: 14, marginTop: 8, marginBottom: 8
  },
  legendTitle: { fontSize: 11, color: C.textMuted, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '45%' },
  legendText: { fontSize: 12, fontWeight: '600' },
});
