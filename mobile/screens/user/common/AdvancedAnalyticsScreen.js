import React, { useContext, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Dimensions, TextInput, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Rect, Path, Circle, G, Text as SvgText, Line } from 'react-native-svg';
import { C } from '../../../constants/theme';
import {
  ChevronLeft, TrendingUp, TrendingDown, Minus, Wallet, ListTodo,
  Bell, Calendar, Target, FileText, Globe, Music, ShoppingCart,
  Car, Paperclip, Lightbulb, ChevronDown, ChevronUp
} from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import ParticleBackground from '../../../components/ParticleBackground';
import SecurityFooter from '../../../components/SecurityFooter';
import {
  computeAnalytics, RANGES, getRangeBounds,
  fmtCurrency, fmtPct
} from '../../../services/analyticsService';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 64;

// ── TREND INDICATOR ─────────────────────────────────────────────────────────
const Trend = ({ pct }) => {
  if (pct === null || pct === undefined) return null;
  if (pct > 0)  return <View style={tr.row}><TrendingUp  color="#EF4444" size={13}/><Text style={[tr.t,{color:'#EF4444'}]}>+{pct}%</Text></View>;
  if (pct < 0)  return <View style={tr.row}><TrendingDown color="#22C55E" size={13}/><Text style={[tr.t,{color:'#22C55E'}]}>{pct}%</Text></View>;
  return <View style={tr.row}><Minus color={C.textMuted} size={13}/><Text style={[tr.t,{color:C.textMuted}]}>0%</Text></View>;
};
const tr = StyleSheet.create({ row:{flexDirection:'row',alignItems:'center',gap:3}, t:{fontSize:12,fontWeight:'700'} });

// ── SVG BAR CHART ────────────────────────────────────────────────────────────
const BarChart = ({ data, color = C.gold, height = 120 }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.min(CHART_W / (data.length * 1.5), 28);
  const gap  = (CHART_W - barW * data.length) / (data.length + 1);
  const svgH = height + 28;
  return (
    <Svg width={CHART_W} height={svgH}>
      {data.map((item, i) => {
        const barH = Math.max((item.value / max) * height, item.value > 0 ? 3 : 0);
        const x = gap + i * (barW + gap);
        const y = height - barH;
        const opacity = 0.5 + 0.5 * (item.value / max);
        return (
          <G key={i}>
            <Rect x={x} y={y} width={barW} height={barH} rx={4} fill={color} opacity={opacity} />
            <SvgText x={x + barW / 2} y={svgH - 4} fontSize={9} fill={C.textMuted} textAnchor="middle">{item.label}</SvgText>
          </G>
        );
      })}
    </Svg>
  );
};

// ── SVG DONUT CHART ──────────────────────────────────────────────────────────
const DonutChart = ({ data, size = 110 }) => {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.amount, 0);
  if (total === 0) return null;
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const COLORS = [C.gold, '#22C55E', '#8B5CF6', '#EF4444', '#06B6D4', '#F97316', '#EC4899'];
  let angle = -Math.PI / 2;
  const slices = data.slice(0, 7).map((d, i) => {
    const sweep = (d.amount / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const largeArc = sweep > Math.PI ? 1 : 0;
    return { path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`, color: COLORS[i % COLORS.length] };
  });
  return (
    <Svg width={size} height={size}>
      {slices.map((sl, i) => <Path key={i} d={sl.path} fill={sl.color} />)}
      <Circle cx={cx} cy={cy} r={r * 0.55} fill="#050505" />
    </Svg>
  );
};

// ── PROGRESS BAR ─────────────────────────────────────────────────────────────
const ProgressBar = ({ pct, color = C.gold }) => (
  <View style={pb.wrap}>
    <View style={[pb.fill, { width: `${Math.min(pct,100)}%`, backgroundColor: color }]} />
  </View>
);
const pb = StyleSheet.create({ wrap:{height:6,backgroundColor:'rgba(255,255,255,0.08)',borderRadius:3,overflow:'hidden'}, fill:{height:'100%',borderRadius:3} });

// ── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, trend, color = C.gold, sub }) => (
  <View style={[st.card, { borderColor: color + '33' }]}>
    <View style={[st.iconWrap, { backgroundColor: color + '18' }]}>{icon}</View>
    <Text style={[st.value, { color }]}>{value}</Text>
    <Text style={st.label}>{label}</Text>
    {sub  ? <Text style={st.sub}>{sub}</Text> : null}
    {trend !== undefined ? <Trend pct={trend} /> : null}
  </View>
);
const st = StyleSheet.create({
  card: { flex:1, minWidth:90, backgroundColor:'rgba(255,255,255,0.04)', borderRadius:12, borderWidth:1, padding:12, alignItems:'center', gap:4 },
  iconWrap:{width:34,height:34,borderRadius:9,justifyContent:'center',alignItems:'center'},
  value:{fontSize:17,fontWeight:'800',color:C.white}, label:{fontSize:11,color:C.textMuted,textAlign:'center'}, sub:{fontSize:10,color:C.textMuted},
});

// ── SECTION ──────────────────────────────────────────────────────────────────
const Section = ({ title, icon, children, collapsible }) => {
  const [open, setOpen] = useState(true);
  return (
    <View style={s.section}>
      <TouchableOpacity style={s.secHeader} onPress={() => collapsible && setOpen(o => !o)} activeOpacity={collapsible ? 0.7 : 1}>
        <View style={s.secLeft}>{icon}<Text style={s.secTitle}>{title}</Text></View>
        {collapsible ? (open ? <ChevronUp color={C.textMuted} size={16}/> : <ChevronDown color={C.textMuted} size={16}/>) : null}
      </TouchableOpacity>
      {open && children}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function AdvancedAnalyticsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [range, setRange]         = useState('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd]     = useState('');
  const [customErr, setCustomErr]     = useState('');
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async (r = range, cs = customStart, ce = customEnd) => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const result = await computeAnalytics(user.user_id, r, { start: cs, end: ce });
      setData(result);
    } catch (e) {}
    setLoading(false);
  }, [user?.user_id, range, customStart, customEnd]);

  useFocusEffect(useCallback(() => { load(range, customStart, customEnd); }, [user?.user_id, range]));

  // Display (DD/MM/YYYY) to ISO (YYYY-MM-DD) helper
  const displayToISO = (disp) => {
    const digits = disp.replace(/[^0-9]/g, '');
    if (digits.length !== 8) return null;
    const d = digits.slice(0,2), m = digits.slice(2,4), y = digits.slice(4,8);
    const iso = `${y}-${m}-${d}`;
    const dt = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
    if (dt.getFullYear()!==parseInt(y)||dt.getMonth()!==parseInt(m)-1||dt.getDate()!==parseInt(d)) return null;
    return iso;
  };

  const applyCustom = () => {
    setCustomErr('');
    if (!customStart || !customEnd) { setCustomErr('Both dates required.'); return; }
    const isoStart = displayToISO(customStart);
    const isoEnd   = displayToISO(customEnd);
    if (!isoStart) { setCustomErr('Invalid start date. Enter as DD/MM/YYYY (e.g. 01/09/2026).'); return; }
    if (!isoEnd)   { setCustomErr('Invalid end date. Enter as DD/MM/YYYY (e.g. 30/09/2026).'); return; }
    if (isoStart > isoEnd) { setCustomErr('Start date must be before end date.'); return; }
    load('Custom', isoStart, isoEnd);
  };

  const d    = data;
  const fin  = d?.finance    || {};
  const prod = d?.productivity || {};
  const cal  = d?.calendar    || {};
  const per  = d?.personal    || {};
  const ins  = d?.insights    || [];

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground/>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={s.backBtn}><ChevronLeft color={C.white} size={28}/></TouchableOpacity>
        <Text style={s.headerTitle}>Advanced Analytics</Text>
        <View style={{width:32}}/>
      </View>
      <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <ActivityIndicator color={C.gold} size="large"/>
        <Text style={{color:C.textMuted,marginTop:12}}>Calculating analytics...</Text>
      </View>
    </SafeAreaView>
  );

  const hasExpenseData   = fin.totalSpend > 0 || fin.categories?.length > 0;
  const hasTaskData      = prod.total > 0 || prod.completedRemind > 0;
  const hasCalendarData  = cal.total > 0;
  const hasFinanceData   = hasExpenseData || (fin.pendingBillAmt > 0) || (fin.totalTarget > 0);

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground/>

      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={s.backBtn}><ChevronLeft color={C.white} size={28}/></TouchableOpacity>
        <Text style={s.headerTitle}>Advanced Analytics</Text>
        <View style={{width:32}}/>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* RANGE PICKER */}
        <TouchableOpacity style={s.rangeBtn} onPress={()=>setShowRangePicker(p=>!p)}>
          <Text style={s.rangeBtnText}>{range}</Text>
          {showRangePicker ? <ChevronUp color={C.gold} size={16}/> : <ChevronDown color={C.gold} size={16}/>}
        </TouchableOpacity>
        {showRangePicker && (
          <View style={s.rangeMenu}>
            {RANGES.map(r => (
              <TouchableOpacity key={r} style={s.rangeOpt} onPress={()=>{setRange(r);setShowRangePicker(false);if(r!=='Custom')load(r);}}>
                <Text style={[s.rangeOptText, range===r&&{color:C.gold}]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {range === 'Custom' && (
          <View style={s.customRow}>
            <TextInput
              style={[s.custInput,{flex:1},  Platform.select({ web: { outlineStyle: 'none' } })]}
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
              style={[s.custInput,{flex:1},  Platform.select({ web: { outlineStyle: 'none' } })]}
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
            <TouchableOpacity style={s.applyBtn} onPress={applyCustom}><Text style={s.applyBtnText}>Apply</Text></TouchableOpacity>
          </View>
        )}
        {customErr ? <Text style={s.errText}>{customErr}</Text> : null}

        {/* SUMMARY CARDS */}
        <View style={s.statsRow}>
          <StatCard icon={<Wallet color={C.gold} size={18}/>} label="Spending" value={fmtCurrency(fin.totalSpend)} trend={fin.spendTrend} color={C.gold}/>
          <StatCard icon={<ListTodo color="#22C55E" size={18}/>} label="Tasks" value={prod.total||0} trend={prod.taskTrend} color="#22C55E" sub={`${prod.taskCpPct||0}% done`}/>
          <StatCard icon={<Bell color="#8B5CF6" size={18}/>} label="Reminders" value={(prod.completedRemind||0)+(prod.pendingRemind||0)} color="#8B5CF6" sub={`${prod.pendingRemind||0} pending`}/>
        </View>
        <View style={[s.statsRow,{marginTop:8}]}>
          <StatCard icon={<Calendar color="#F97316" size={18}/>} label="Events" value={cal.total||0} color="#F97316" sub={`${cal.upcoming||0} upcoming`}/>
          <StatCard icon={<Target color="#06B6D4" size={18}/>} label="Goals" value={fin.activeGoalsCount||0} color="#06B6D4" sub={`${fin.goalsPct||0}% progress`}/>
          <StatCard icon={<FileText color="#EC4899" size={18}/>} label="Notes" value={per.totalNotes||0} color="#EC4899"/>
        </View>

        {/* INSIGHTS */}
        {ins.length > 0 && (
          <Section title="INSIGHTS" icon={<Lightbulb color={C.gold} size={16}/>} collapsible>
            {ins.map((insight, i) => (
              <View key={i} style={s.insightRow}>
                <View style={s.insightDot}/>
                <Text style={s.insightText}>{insight}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* FINANCIAL ANALYTICS */}
        <Section title="FINANCIAL ANALYTICS" icon={<Wallet color={C.gold} size={16}/>} collapsible>
          {!hasFinanceData ? (
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>No financial data yet</Text>
              <Text style={s.emptySub}>Add expenses, bills, or goals to see your financial analytics.</Text>
            </View>
          ) : (
            <>
              {/* Monthly trend */}
              {fin.monthlySpend?.some(m=>m.value>0) && (
                <>
                  <Text style={s.chartLabel}>MONTHLY SPENDING TREND</Text>
                  <BarChart data={fin.monthlySpend} color={C.gold}/>
                </>
              )}

              {/* Category breakdown */}
              {fin.categories?.length > 0 && (
                <>
                  <Text style={s.chartLabel}>CATEGORY BREAKDOWN</Text>
                  <View style={s.donutRow}>
                    <DonutChart data={fin.categories} size={120}/>
                    <View style={s.legendWrap}>
                      {fin.categories.slice(0,6).map((c,i)=>{
                        const colors=[C.gold,'#22C55E','#8B5CF6','#EF4444','#06B6D4','#F97316'];
                        return (
                          <View key={i} style={s.legendRow}>
                            <View style={[s.legendDot,{backgroundColor:colors[i%colors.length]}]}/>
                            <Text style={s.legendText} numberOfLines={1}>{c.name} ({c.pct}%)</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </>
              )}

              {/* Budget */}
              {fin.budgetAmt > 0 && (
                <View style={s.metricCard}>
                  <View style={s.metricRow}>
                    <Text style={s.metricLabel}>Budget Used</Text>
                    <Text style={[s.metricVal,{color:fin.totalSpend>fin.budgetAmt?'#EF4444':C.gold}]}>
                      {fmtCurrency(fin.totalSpend)} / {fmtCurrency(fin.budgetAmt)}
                    </Text>
                  </View>
                  <ProgressBar pct={fin.budgetAmt>0?(fin.totalSpend/fin.budgetAmt)*100:0} color={fin.totalSpend>fin.budgetAmt?'#EF4444':C.gold}/>
                </View>
              )}

              {/* Bills + EMI + Khata */}
              <View style={s.finGrid}>
                {fin.pendingBillAmt > 0 && (
                  <View style={s.finTile}>
                    <Text style={s.finTileLabel}>Pending Bills</Text>
                    <Text style={[s.finTileVal,{color:'#EF4444'}]}>{fmtCurrency(fin.pendingBillAmt)}</Text>
                    <Text style={s.finTileSub}>{fin.pendingBills?.length} bill{fin.pendingBills?.length!==1?'s':''}</Text>
                  </View>
                )}
                {fin.nextEmiAmt > 0 && (
                  <View style={s.finTile}>
                    <Text style={s.finTileLabel}>EMI Due</Text>
                    <Text style={[s.finTileVal,{color:'#F97316'}]}>{fmtCurrency(fin.nextEmiAmt)}</Text>
                    <Text style={s.finTileSub}>{fin.upcomingEmis?.length} upcoming</Text>
                  </View>
                )}
                {(fin.khataGiven > 0 || fin.khataOwed > 0) && (
                  <View style={s.finTile}>
                    <Text style={s.finTileLabel}>Khata</Text>
                    <Text style={[s.finTileVal,{color:'#22C55E'}]}>{fmtCurrency(fin.khataGiven)}</Text>
                    <Text style={s.finTileSub}>to receive</Text>
                  </View>
                )}
                {fin.totalTarget > 0 && (
                  <View style={s.finTile}>
                    <Text style={s.finTileLabel}>Savings</Text>
                    <Text style={[s.finTileVal,{color:'#06B6D4'}]}>{fin.goalsPct}%</Text>
                    <Text style={s.finTileSub}>{fmtCurrency(fin.totalSaved)} saved</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </Section>

        {/* PRODUCTIVITY ANALYTICS */}
        <Section title="TASK & PRODUCTIVITY" icon={<ListTodo color={C.gold} size={16}/>} collapsible>
          {!hasTaskData ? (
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>No task data yet</Text>
              <Text style={s.emptySub}>Add tasks or reminders to see your productivity analytics.</Text>
            </View>
          ) : (
            <>
              <View style={s.prodRow}>
                <View style={s.prodCard}>
                  <Text style={[s.prodNum,{color:C.gold}]}>{prod.total||0}</Text>
                  <Text style={s.prodLbl}>Total</Text>
                </View>
                <View style={s.prodCard}>
                  <Text style={[s.prodNum,{color:'#22C55E'}]}>{prod.completed||0}</Text>
                  <Text style={s.prodLbl}>Done</Text>
                </View>
                <View style={s.prodCard}>
                  <Text style={[s.prodNum,{color:'#F97316'}]}>{prod.pending||0}</Text>
                  <Text style={s.prodLbl}>Pending</Text>
                </View>
                <View style={s.prodCard}>
                  <Text style={[s.prodNum,{color:'#EF4444'}]}>{prod.overdue||0}</Text>
                  <Text style={s.prodLbl}>Overdue</Text>
                </View>
              </View>
              <View style={s.metricCard}>
                <View style={s.metricRow}>
                  <Text style={s.metricLabel}>Task Completion</Text>
                  <Text style={[s.metricVal,{color:'#22C55E'}]}>{prod.taskCpPct||0}%</Text>
                </View>
                <ProgressBar pct={prod.taskCpPct||0} color="#22C55E"/>
              </View>
              {/* Reminders */}
              <Text style={s.chartLabel}>REMINDERS</Text>
              <View style={s.prodRow}>
                <View style={s.prodCard}><Text style={[s.prodNum,{color:'#22C55E'}]}>{prod.completedRemind||0}</Text><Text style={s.prodLbl}>Done</Text></View>
                <View style={s.prodCard}><Text style={[s.prodNum,{color:'#8B5CF6'}]}>{prod.pendingRemind||0}</Text><Text style={s.prodLbl}>Pending</Text></View>
                <View style={s.prodCard}><Text style={[s.prodNum,{color:'#EF4444'}]}>{prod.overdueRemind||0}</Text><Text style={s.prodLbl}>Overdue</Text></View>
              </View>
            </>
          )}
        </Section>

        {/* CALENDAR ANALYTICS */}
        <Section title="CALENDAR ANALYTICS" icon={<Calendar color={C.gold} size={16}/>} collapsible>
          {!hasCalendarData ? (
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>No calendar data yet</Text>
              <Text style={s.emptySub}>Add events in Advanced Calendar to see event analytics.</Text>
            </View>
          ) : (
            <>
              <View style={s.prodRow}>
                <View style={s.prodCard}><Text style={[s.prodNum,{color:C.gold}]}>{cal.total||0}</Text><Text style={s.prodLbl}>Total</Text></View>
                <View style={s.prodCard}><Text style={[s.prodNum,{color:'#22C55E'}]}>{cal.upcoming||0}</Text><Text style={s.prodLbl}>Upcoming</Text></View>
                <View style={s.prodCard}><Text style={[s.prodNum,{color:'#606060'}]}>{cal.completed||0}</Text><Text style={s.prodLbl}>Done</Text></View>
                <View style={s.prodCard}><Text style={[s.prodNum,{color:'#8B5CF6'}]}>{cal.past||0}</Text><Text style={s.prodLbl}>Past</Text></View>
              </View>
              {cal.monthlyEvents?.some(m=>m.value>0) && (
                <>
                  <Text style={s.chartLabel}>EVENTS PER MONTH</Text>
                  <BarChart data={cal.monthlyEvents} color="#8B5CF6" height={90}/>
                </>
              )}
            </>
          )}
        </Section>

        {/* PERSONAL ACTIVITY */}
        <Section title="PERSONAL ACTIVITY" icon={<FileText color={C.gold} size={16}/>} collapsible>
          <View style={s.perGrid}>
            {[
              { icon:<FileText color="#06B6D4" size={16}/>, label:'Notes',       val:per.totalNotes,       color:'#06B6D4' },
              { icon:<Globe    color="#A78BFA" size={16}/>, label:'Websites',    val:per.totalWebsites,    color:'#A78BFA' },
              { icon:<Music    color="#EC4899" size={16}/>, label:'Music',       val:per.totalMusic,       color:'#EC4899' },
              { icon:<Car      color="#F97316" size={16}/>, label:'Vehicles',    val:per.totalVehicles,    color:'#F97316' },
              { icon:<ShoppingCart color="#22C55E" size={16}/>, label:'Shop Items', val:per.pendingShopItems, color:'#22C55E' },
              { icon:<Paperclip color={C.gold} size={16}/>, label:'Attachments',val:per.totalAttachments, color:C.gold },
            ].filter(i=>i.val>0).map((item,i)=>(
              <View key={i} style={[s.perCard,{borderColor:item.color+'33'}]}>
                {item.icon}
                <Text style={[s.perVal,{color:item.color}]}>{item.val}</Text>
                <Text style={s.perLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
          {Object.values(per).every(v=>!v) && (
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>No personal activity yet</Text>
              <Text style={s.emptySub}>Add notes, websites, music, or shopping items to see activity here.</Text>
            </View>
          )}
        </Section>

        <SecurityFooter/>
        <View style={{height:40}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:'transparent'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:14,borderBottomWidth:1,borderBottomColor:C.border,backgroundColor:'rgba(5,5,5,0.9)'},
  headerTitle:{fontSize:18,fontWeight:'700',color:C.white},
  backBtn:{padding:4},
  scroll:{padding:14,paddingBottom:60},

  // Range
  rangeBtn:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:C.card,borderRadius:10,borderWidth:1,borderColor:C.border,paddingHorizontal:16,paddingVertical:12,marginBottom:8},
  rangeBtnText:{fontSize:14,color:C.white,fontWeight:'600'},
  rangeMenu:{backgroundColor:'rgba(10,10,10,0.98)',borderRadius:10,borderWidth:1,borderColor:C.border,overflow:'hidden',marginBottom:8},
  rangeOpt:{paddingVertical:12,paddingHorizontal:16,borderBottomWidth:1,borderBottomColor:C.border},
  rangeOptText:{fontSize:14,color:C.white},
  customRow:{flexDirection:'row',gap:8,marginBottom:8},
  custInput:{backgroundColor:'rgba(255,255,255,0.06)',borderRadius:8,borderWidth:1,borderColor:C.border,paddingHorizontal:10,paddingVertical:8,color:C.white,fontSize:13},
  applyBtn:{backgroundColor:C.gold,borderRadius:8,paddingHorizontal:14,justifyContent:'center'},
  applyBtnText:{color:C.black,fontWeight:'700',fontSize:13},
  errText:{color:'#EF4444',fontSize:13,marginBottom:8},

  // Stats
  statsRow:{flexDirection:'row',gap:8},

  // Section
  section:{backgroundColor:C.card,borderRadius:14,borderWidth:1,borderColor:C.border,padding:14,marginBottom:12},
  secHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12},
  secLeft:{flexDirection:'row',alignItems:'center',gap:8},
  secTitle:{fontSize:12,fontWeight:'700',color:C.gold,letterSpacing:0.8},

  // Empty
  emptyState:{paddingVertical:24,alignItems:'center'},
  emptyTitle:{fontSize:15,color:C.white,fontWeight:'600',marginBottom:6},
  emptySub:{fontSize:13,color:C.textMuted,textAlign:'center',lineHeight:20},

  // Chart
  chartLabel:{fontSize:10,color:C.textMuted,fontWeight:'700',letterSpacing:0.8,marginTop:14,marginBottom:8},
  donutRow:{flexDirection:'row',alignItems:'center',gap:12},
  legendWrap:{flex:1},
  legendRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:6},
  legendDot:{width:8,height:8,borderRadius:4},
  legendText:{fontSize:12,color:C.textMuted,flex:1},

  // Metric card
  metricCard:{backgroundColor:'rgba(255,255,255,0.04)',borderRadius:10,borderWidth:1,borderColor:C.border,padding:12,marginTop:8,gap:8},
  metricRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  metricLabel:{fontSize:13,color:C.textMuted},
  metricVal:{fontSize:14,fontWeight:'700'},

  // Finance grid
  finGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:12},
  finTile:{flex:1,minWidth:80,backgroundColor:'rgba(255,255,255,0.04)',borderRadius:10,borderWidth:1,borderColor:C.border,padding:10,alignItems:'center'},
  finTileLabel:{fontSize:11,color:C.textMuted,marginBottom:4,textAlign:'center'},
  finTileVal:{fontSize:16,fontWeight:'800'},
  finTileSub:{fontSize:11,color:C.textMuted,marginTop:2},

  // Productivity
  prodRow:{flexDirection:'row',gap:8,marginBottom:8},
  prodCard:{flex:1,backgroundColor:'rgba(255,255,255,0.04)',borderRadius:10,borderWidth:1,borderColor:C.border,padding:10,alignItems:'center',gap:4},
  prodNum:{fontSize:20,fontWeight:'800'},
  prodLbl:{fontSize:11,color:C.textMuted},

  // Personal
  perGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  perCard:{flex:1,minWidth:80,backgroundColor:'rgba(255,255,255,0.04)',borderRadius:10,borderWidth:1,padding:10,alignItems:'center',gap:4},
  perVal:{fontSize:18,fontWeight:'800'},
  perLabel:{fontSize:11,color:C.textMuted},

  // Insights
  insightRow:{flexDirection:'row',alignItems:'flex-start',gap:10,paddingVertical:8,borderBottomWidth:1,borderBottomColor:C.border},
  insightDot:{width:6,height:6,borderRadius:3,backgroundColor:C.gold,marginTop:6},
  insightText:{fontSize:13,color:C.white,flex:1,lineHeight:20},
});
