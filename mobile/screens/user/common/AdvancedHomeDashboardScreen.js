import React, { useContext, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../../../constants/theme';
import {
  ChevronLeft, ChevronRight, LayoutDashboard, ListTodo, Bell,
  Calendar, Wallet, Target, FileText, ShoppingCart, Car, Globe,
  Music, Paperclip, Plus, Clock, AlertTriangle, CheckCircle,
  TrendingUp, Receipt, CreditCard, BookOpen, User, Activity,
  ArrowUpRight, Layers
} from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import ParticleBackground from '../../../components/ParticleBackground';
import { loadDashboard, formatCurrency, formatDate, formatTime, relativeTime } from '../../../services/dashboardService';

const SECTION_ICONS = {
  'Work Tasks': <ListTodo color={C.gold} size={18} />,
  'Reminders': <Bell color={C.gold} size={18} />,
  'Calendar': <Calendar color={C.gold} size={18} />,
  'Expenses': <Wallet color={C.gold} size={18} />,
  'Goals': <Target color={C.gold} size={18} />,
  'Notes': <FileText color={C.gold} size={18} />,
  'Shopping': <ShoppingCart color={C.gold} size={18} />,
  'Vehicle': <Car color={C.gold} size={18} />,
  'Website': <Globe color={C.gold} size={18} />,
  'Music': <Music color={C.gold} size={18} />,
  'Bill': <Receipt color={C.gold} size={18} />,
  'EMI': <CreditCard color={C.gold} size={18} />,
  'Khata': <BookOpen color={C.gold} size={18} />,
  'Event': <Calendar color={C.gold} size={18} />,
  'Reminder': <Bell color={C.gold} size={18} />,
  'Task': <ListTodo color={C.gold} size={18} />,
  'Note': <FileText color={C.gold} size={18} />,
  'Expense': <Wallet color={C.gold} size={18} />,
};

const QUICK_ACTIONS = [
  { label: 'Add Task', icon: ListTodo, route: 'TaskManagerScreen' },
  { label: 'Reminder', icon: Bell, route: 'AdvancedReminders' },
  { label: 'Event', icon: Calendar, route: 'AdvancedCalendar' },
  { label: 'Expense', icon: Wallet, route: 'ExpenseTrackerScreen' },
  { label: 'Note', icon: FileText, route: 'QuickNotesScreen' },
  { label: 'Search', icon: Globe, route: 'AdvancedSearch' },
];

const MODULE_SHORTCUTS = [
  { label: 'Reminders', icon: Bell, route: 'AdvancedReminders' },
  { label: 'Calendar', icon: Calendar, route: 'AdvancedCalendar' },
  { label: 'Search', icon: Globe, route: 'AdvancedSearch' },
  { label: 'Tasks', icon: ListTodo, route: 'TaskManagerScreen' },
  { label: 'Notes', icon: FileText, route: 'QuickNotesScreen' },
  { label: 'Files', icon: Paperclip, route: 'ExtraStorage' },
];

// ── Reusable sub-components ──
const SectionHeader = ({ title, icon, onPress }) => (
  <View style={s.secHeader}>
    <View style={s.secHeaderLeft}>{icon}<Text style={s.secTitle}>{title}</Text></View>
    {onPress && (
      <TouchableOpacity onPress={onPress} style={s.secAction}>
        <Text style={s.secActionText}>See all</Text>
        <ChevronRight color={C.gold} size={14} />
      </TouchableOpacity>
    )}
  </View>
);

const StatCard = ({ label, value, icon, color }) => (
  <View style={[s.statCard, { borderColor: color + '44' }]}>
    <View style={[s.statIcon, { backgroundColor: color + '18' }]}>{icon}</View>
    <Text style={[s.statValue, { color }]}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const ItemRow = ({ icon, title, subtitle, badge, onPress }) => (
  <TouchableOpacity style={s.itemRow} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <View style={s.itemIcon}>{icon}</View>
    <View style={s.itemBody}>
      <Text style={s.itemTitle} numberOfLines={1}>{title}</Text>
      {subtitle ? <Text style={s.itemSub} numberOfLines={1}>{subtitle}</Text> : null}
    </View>
    {badge ? <View style={[s.badge, { backgroundColor: badge.color + '22', borderColor: badge.color + '55' }]}>
      <Text style={[s.badgeText, { color: badge.color }]}>{badge.text}</Text>
    </View> : null}
  </TouchableOpacity>
);

const EmptyRow = ({ text }) => (
  <View style={s.emptyRow}>
    <Text style={s.emptyRowText}>{text}</Text>
  </View>
);

export default function AdvancedHomeDashboardScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [hiddenSections, setHiddenSections] = useState({});

  const load = useCallback(async (isRefresh = false) => {
    if (!user?.user_id) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const result = await loadDashboard(user.user_id);
      setData(result);
    } catch (e) {}
    setLoading(false);
    setRefreshing(false);
  }, [user?.user_id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const safeNav = (route, params = {}) => {
    if (!route) return;
    try { navigation.navigate(route, params); } catch (e) {}
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const toggleSection = (key) => setHiddenSections(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <ParticleBackground />
        <View style={s.header}>
          <View style={{ width: 32 }} />
          <Text style={s.headerTitle}>Home Dashboard</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={C.gold} size="large" />
          <Text style={{ color: C.textMuted, marginTop: 12 }}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const d = data || {};
  const { today = {}, stats = {}, finance = {}, tasks = {}, personal = {}, upcoming = [], recentActivity = [] } = d;

  const overdueCount = (today.overdueTasks?.length || 0) + (today.overdueReminders?.length || 0) + (today.overdueBills?.length || 0);

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />

      {/* ── HEADER ── */}
      <View style={s.header}>
        <View style={{ width: 28 }} />
        <Text style={s.headerTitle}>Home Dashboard</Text>
        <TouchableOpacity onPress={() => setShowCustomize(!showCustomize)} style={s.backBtn}>
          <Layers color={C.gold} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.gold} />}
      >

        {/* ── GREETING ── */}
        <View style={s.greetCard}>
          <View style={s.greetIconWrap}><User color={C.gold} size={22} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.greetText}>{greeting()}, {user?.name || user?.username || 'User'}</Text>
            <Text style={s.greetDate}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          {overdueCount > 0 && (
            <View style={s.urgentBadge}>
              <AlertTriangle color="#EF4444" size={14} />
              <Text style={s.urgentBadgeText}>{overdueCount} overdue</Text>
            </View>
          )}
        </View>

        {/* ── CUSTOMIZE TOGGLE ── */}
        {showCustomize && (
          <View style={s.customizeCard}>
            <Text style={s.customizeTitle}>Show / Hide Sections</Text>
            {['today', 'stats', 'finance', 'tasks', 'upcoming', 'personal', 'recent', 'shortcuts'].map(key => (
              <TouchableOpacity key={key} style={s.customizeRow} onPress={() => toggleSection(key)}>
                <Text style={s.customizeLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                <View style={[s.customizeToggle, !hiddenSections[key] && s.customizeToggleOn]}>
                  <Text style={{ fontSize: 11, color: !hiddenSections[key] ? C.black : C.textMuted, fontWeight: '700' }}>
                    {!hiddenSections[key] ? 'ON' : 'OFF'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── QUICK ACTIONS ── */}
        <View style={s.section}>
          <SectionHeader title="QUICK ACTIONS" icon={<Plus color={C.gold} size={16} />} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.qaRow}>
            {QUICK_ACTIONS.map(qa => (
              <TouchableOpacity key={qa.label} style={s.qaBtn} onPress={() => safeNav(qa.route)}>
                <View style={s.qaIcon}><qa.icon color={C.black} size={18} /></View>
                <Text style={s.qaLabel}>{qa.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── TODAY OVERVIEW ── */}
        {!hiddenSections['today'] && (
          <View style={s.section}>
            <SectionHeader title="TODAY" icon={<Clock color={C.gold} size={16} />} />

            {overdueCount > 0 && (
              <View style={s.overdueCard}>
                <AlertTriangle color="#EF4444" size={16} />
                <Text style={s.overdueText}>{overdueCount} overdue item{overdueCount !== 1 ? 's' : ''} need attention</Text>
              </View>
            )}

            {/* Today Tasks */}
            {today.todayTasks?.length > 0 ? today.todayTasks.slice(0, 3).map(t => (
              <ItemRow key={t.id} icon={<ListTodo color={C.gold} size={16} />}
                title={t.title} subtitle={t.category || t.priority}
                badge={{ text: 'Task', color: '#F0A500' }} onPress={() => safeNav('TaskManagerScreen')} />
            )) : <EmptyRow text="No tasks for today" />}

            {/* Today Reminders */}
            {today.todayReminders?.length > 0 ? today.todayReminders.slice(0, 2).map(r => (
              <ItemRow key={r.id} icon={<Bell color={C.gold} size={16} />}
                title={r.title} subtitle={r.time ? formatTime(r.time) : 'All day'}
                badge={{ text: 'Reminder', color: '#8B5CF6' }} onPress={() => safeNav('AdvancedReminders')} />
            )) : <EmptyRow text="No reminders for today" />}

            {/* Today Events */}
            {today.todayEvents?.length > 0 ? today.todayEvents.slice(0, 2).map(e => (
              <ItemRow key={e.id} icon={<Calendar color={C.gold} size={16} />}
                title={e.title} subtitle={e.time ? formatTime(e.time) : 'All day'}
                badge={{ text: 'Event', color: '#22C55E' }} onPress={() => safeNav('AdvancedCalendar')} />
            )) : <EmptyRow text="No events for today" />}
          </View>
        )}

        {/* ── QUICK STATS ── */}
        {!hiddenSections['stats'] && (
          <View style={s.section}>
            <SectionHeader title="OVERVIEW" icon={<Activity color={C.gold} size={16} />} />
            <View style={s.statsGrid}>
              <StatCard label="Pending Tasks" value={stats.pendingTasks || 0} icon={<ListTodo color={C.gold} size={18} />} color={C.gold} />
              <StatCard label="Reminders" value={stats.upcomingReminders || 0} icon={<Bell color="#8B5CF6" size={18} />} color="#8B5CF6" />
              <StatCard label="Events" value={stats.upcomingEvents || 0} icon={<Calendar color="#22C55E" size={18} />} color="#22C55E" />
              <StatCard label="Active Goals" value={stats.activeGoals || 0} icon={<Target color="#F97316" size={18} />} color="#F97316" />
              <StatCard label="Notes" value={stats.totalNotes || 0} icon={<FileText color="#06B6D4" size={18} />} color="#06B6D4" />
              <StatCard label="Websites" value={stats.totalWebsites || 0} icon={<Globe color="#A78BFA" size={18} />} color="#A78BFA" />
            </View>
          </View>
        )}

        {/* ── FINANCIAL OVERVIEW ── */}
        {!hiddenSections['finance'] && (
          <View style={s.section}>
            <SectionHeader title="FINANCIAL OVERVIEW" icon={<Wallet color={C.gold} size={16} />} />

            {/* Expense + Budget row */}
            <View style={s.finRow}>
              <View style={[s.finCard, { flex: 1, marginRight: 6 }]}>
                <Text style={s.finLabel}>This Month</Text>
                <Text style={s.finValue}>{formatCurrency(finance.thisMonthExpenses)}</Text>
                <Text style={s.finSub}>Expenses</Text>
              </View>
              <View style={[s.finCard, { flex: 1, marginLeft: 6 }]}>
                <Text style={s.finLabel}>Budget</Text>
                <Text style={[s.finValue, { color: finance.budgetAmount > 0 ? C.gold : C.textMuted }]}>
                  {finance.budgetAmount > 0 ? formatCurrency(finance.budgetAmount) : 'Not set'}
                </Text>
                {finance.budgetAmount > 0 && (
                  <Text style={[s.finSub, { color: finance.thisMonthExpenses > finance.budgetAmount ? '#EF4444' : '#22C55E' }]}>
                    {finance.thisMonthExpenses > finance.budgetAmount ? 'Over budget' : 'Within budget'}
                  </Text>
                )}
              </View>
            </View>

            {/* Bills + Khata row */}
            <View style={s.finRow}>
              <View style={[s.finCard, { flex: 1, marginRight: 6 }]}>
                <Text style={s.finLabel}>Pending Bills</Text>
                <Text style={[s.finValue, { color: finance.pendingBillsTotal > 0 ? '#EF4444' : C.textMuted }]}>
                  {formatCurrency(finance.pendingBillsTotal)}
                </Text>
                <Text style={s.finSub}>{finance.pendingBills?.length || 0} bills</Text>
              </View>
              <View style={[s.finCard, { flex: 1, marginLeft: 6 }]}>
                <Text style={s.finLabel}>Khata Book</Text>
                <Text style={[s.finValue, { color: '#22C55E' }]}>{formatCurrency(finance.khataTotalGiven)}</Text>
                <Text style={s.finSub}>to receive</Text>
              </View>
            </View>

            {/* Goals progress */}
            {finance.goalsWithProgress?.length > 0 && (
              <>
                <Text style={s.subSectionLabel}>GOALS PROGRESS</Text>
                {finance.goalsWithProgress.map(g => {
                  const pct = g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0;
                  return (
                    <View key={g.id} style={s.goalRow}>
                      <View style={s.goalHeader}>
                        <Text style={s.goalTitle} numberOfLines={1}>{g.title}</Text>
                        <Text style={s.goalPct}>{Math.round(pct)}%</Text>
                      </View>
                      <View style={s.goalBar}>
                        <View style={[s.goalFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={s.goalAmounts}>{formatCurrency(g.current)} / {formatCurrency(g.target)}</Text>
                    </View>
                  );
                })}
              </>
            )}

            {/* Upcoming EMIs */}
            {finance.upcomingEmis?.length > 0 && (
              <>
                <Text style={s.subSectionLabel}>UPCOMING EMIs</Text>
                {finance.upcomingEmis.map(e => (
                  <ItemRow key={e.id} icon={<CreditCard color={C.gold} size={16} />}
                    title={e.title || 'EMI'} subtitle={`Due: ${formatDate(e.nextDueDate)}`}
                    badge={{ text: formatCurrency(e.amount), color: '#EF4444' }} />
                ))}
              </>
            )}
          </View>
        )}

        {/* ── TASK & PRODUCTIVITY ── */}
        {!hiddenSections['tasks'] && (
          <View style={s.section}>
            <SectionHeader title="TASKS & PRODUCTIVITY" icon={<ListTodo color={C.gold} size={16} />} onPress={() => safeNav('TaskManagerScreen')} />
            {tasks.allTasks?.length > 0 ? tasks.allTasks.map(t => (
              <ItemRow key={t.id} icon={<ListTodo color={C.gold} size={16} />}
                title={t.title}
                subtitle={t.dueDate ? `Due: ${formatDate(t.dueDate)}` : t.priority || 'Task'}
                badge={t.priority === 'Urgent' ? { text: 'Urgent', color: '#EF4444' } : null}
                onPress={() => safeNav('TaskManagerScreen')} />
            )) : <EmptyRow text="No pending tasks" />}
          </View>
        )}

        {/* ── UPCOMING ── */}
        {!hiddenSections['upcoming'] && (
          <View style={s.section}>
            <SectionHeader title="UPCOMING" icon={<ArrowUpRight color={C.gold} size={16} />} />
            {upcoming.length > 0 ? upcoming.map((item, i) => (
              <ItemRow key={item.id + i} icon={SECTION_ICONS[item.type] || <Clock color={C.gold} size={16} />}
                title={item.title}
                subtitle={`${item.type} • ${formatDate(item.date)}${item.time ? ' ' + formatTime(item.time) : ''}`}
                onPress={item.module ? () => safeNav(item.module) : null} />
            )) : <EmptyRow text="Nothing upcoming" />}
          </View>
        )}

        {/* ── PERSONAL LIFE ── */}
        {!hiddenSections['personal'] && (
          <View style={s.section}>
            <SectionHeader title="PERSONAL LIFE" icon={<LayoutDashboard color={C.gold} size={16} />} />

            {/* Shopping */}
            {personal.pendingShoppingItems > 0 && (
              <ItemRow icon={<ShoppingCart color={C.gold} size={16} />}
                title="Shopping Lists"
                subtitle={`${personal.pendingShoppingItems} items pending`}
                badge={{ text: personal.activeShoppingLists?.length + ' lists', color: '#22C55E' }} />
            )}

            {/* Vehicles */}
            {personal.vehicles?.length > 0 && personal.vehicles.map(v => (
              <ItemRow key={v.id} icon={<Car color={C.gold} size={16} />}
                title={v.name || `${v.make || ''} ${v.model || ''}`.trim() || 'Vehicle'}
                subtitle={v.plateNumber || v.type || 'Vehicle'}
                onPress={() => safeNav('VehicleManagerScreen')} />
            ))}

            {/* Music */}
            {personal.music?.length > 0 && (
              <ItemRow icon={<Music color={C.gold} size={16} />}
                title="My Music"
                subtitle={`${personal.music.length} saved tracks`}
                onPress={() => safeNav('MyMusicScreen')} />
            )}

            {/* Family Events */}
            {personal.familyEvents?.length > 0 && personal.familyEvents.map(e => (
              <ItemRow key={e.id} icon={<Calendar color={C.gold} size={16} />}
                title={e.title || 'Family Event'}
                subtitle={e.date ? formatDate(e.date) : ''} />
            ))}

            {personal.vehicles?.length === 0 && personal.music?.length === 0 &&
             personal.familyEvents?.length === 0 && personal.pendingShoppingItems === 0 && (
              <EmptyRow text="Add vehicles, music, family events or shopping lists to see them here" />
            )}
          </View>
        )}

        {/* ── RECENT ACTIVITY ── */}
        {!hiddenSections['recent'] && (
          <View style={s.section}>
            <SectionHeader title="RECENT ACTIVITY" icon={<Activity color={C.gold} size={16} />} />
            {recentActivity.length > 0 ? recentActivity.map((a, i) => (
              <ItemRow key={i}
                icon={SECTION_ICONS[a.label] || <Activity color={C.gold} size={16} />}
                title={a.title || 'Untitled'}
                subtitle={`${a.label} • ${relativeTime(a.ts)}`} />
            )) : <EmptyRow text="No recent activity" />}
          </View>
        )}

        {/* ── MODULE SHORTCUTS ── */}
        {!hiddenSections['shortcuts'] && (
          <View style={s.section}>
            <SectionHeader title="MODULE SHORTCUTS" icon={<Layers color={C.gold} size={16} />} />
            <View style={s.shortcutsGrid}>
              {MODULE_SHORTCUTS.map(m => (
                <TouchableOpacity key={m.label} style={s.shortcutCard} onPress={() => safeNav(m.route)}>
                  <View style={s.shortcutIcon}><m.icon color={C.gold} size={20} /></View>
                  <Text style={s.shortcutLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

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

  // Greeting
  greetCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 14 },
  greetIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(240,165,0,0.12)', justifyContent: 'center', alignItems: 'center' },
  greetText: { fontSize: 16, fontWeight: '700', color: C.white },
  greetDate: { fontSize: 12, color: C.textMuted, marginTop: 3 },
  urgentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.12)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  urgentBadgeText: { fontSize: 11, color: '#EF4444', fontWeight: '700' },

  // Customize
  customizeCard: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 14 },
  customizeTitle: { fontSize: 13, fontWeight: '700', color: C.white, marginBottom: 10 },
  customizeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  customizeLabel: { fontSize: 14, color: C.white },
  customizeToggle: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: C.border },
  customizeToggleOn: { backgroundColor: C.gold, borderColor: C.gold },

  // Section
  section: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 14 },
  secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  secHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secTitle: { fontSize: 12, fontWeight: '700', color: C.gold, letterSpacing: 0.8 },
  secAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  secActionText: { fontSize: 12, color: C.gold },
  subSectionLabel: { fontSize: 11, color: C.textMuted, fontWeight: '700', letterSpacing: 0.8, marginTop: 14, marginBottom: 8 },

  // Quick Actions
  qaRow: { gap: 10, paddingBottom: 4 },
  qaBtn: { alignItems: 'center', gap: 6 },
  qaIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.gold, justifyContent: 'center', alignItems: 'center' },
  qaLabel: { fontSize: 11, color: C.textMuted, fontWeight: '600', textAlign: 'center' },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: { width: '30%', flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center', minWidth: 90 },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 2 },

  // Items
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  itemIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(240,165,0,0.10)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: C.white },
  itemSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  emptyRow: { paddingVertical: 12 },
  emptyRowText: { fontSize: 13, color: C.textMuted, fontStyle: 'italic' },

  // Overdue card
  overdueCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', marginBottom: 10 },
  overdueText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },

  // Finance
  finRow: { flexDirection: 'row', marginBottom: 8 },
  finCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12 },
  finLabel: { fontSize: 11, color: C.textMuted, marginBottom: 4 },
  finValue: { fontSize: 18, fontWeight: '800', color: C.white },
  finSub: { fontSize: 11, color: C.textMuted, marginTop: 3 },

  // Goals
  goalRow: { marginBottom: 10 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  goalTitle: { fontSize: 13, color: C.white, fontWeight: '600', flex: 1 },
  goalPct: { fontSize: 13, color: C.gold, fontWeight: '700' },
  goalBar: { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  goalFill: { height: '100%', backgroundColor: C.gold, borderRadius: 3 },
  goalAmounts: { fontSize: 11, color: C.textMuted, marginTop: 4 },

  // Shortcuts
  shortcutsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shortcutCard: { width: '30%', flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12, alignItems: 'center', gap: 8, minWidth: 80 },
  shortcutIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(240,165,0,0.10)', justifyContent: 'center', alignItems: 'center' },
  shortcutLabel: { fontSize: 12, color: C.textMuted, fontWeight: '600', textAlign: 'center' },
});
