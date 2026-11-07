import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { User, Settings, Database, Activity } from 'lucide-react-native';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';

const MOCK_LOGS = [
  { id: '1', user: 'Admin', action: 'changed settings', time: '10:00 AM', date: 'Today', type: 'settings' },
  { id: '2', user: 'User 2', action: 'logged in', time: '09:15 AM', date: 'Today', type: 'user' },
  { id: '3', user: 'User 3', action: 'created new ledger', time: '08:42 AM', date: 'Today', type: 'activity' },
  { id: '4', user: 'System', action: 'automated backup completed', time: '02:00 AM', date: 'Today', type: 'system' },
  { id: '5', user: 'Admin', action: 'exported database', time: '04:30 PM', date: 'Yesterday', type: 'system' },
  { id: '6', user: 'User 4', action: 'failed login attempt', time: '01:12 PM', date: 'Yesterday', type: 'user' },
];

export default function AdminActivityLogsScreen({ navigation }) {
  const getIcon = (type) => {
    switch(type) {
      case 'settings': return <Settings size={20} color={C.white} />;
      case 'user': return <User size={20} color={C.white} />;
      case 'system': return <Database size={20} color={C.white} />;
      default: return <Activity size={20} color={C.white} />;
    }
  };

  const renderLog = ({ item }) => (
    <View style={s.logItem}>
      <View style={s.iconBg}>
        {getIcon(item.type)}
      </View>
      <View style={s.logContent}>
        <Text style={s.logText}>
          <Text style={s.boldText}>{item.user}</Text> {item.action}
        </Text>
        <Text style={s.timeText}>{item.date} at {item.time}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safeArea}>
      <ParticleBackground />
      
      <FlatList
        data={MOCK_LOGS}
        keyExtractor={item => item.id}
        renderItem={renderLog}
        contentContainerStyle={s.listContent}
        ItemSeparatorComponent={() => <View style={s.separator} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.white, marginLeft: 16 },
  listContent: { padding: 20 },
  logItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  iconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1, borderColor: '#222' },
  logContent: { flex: 1 },
  logText: { fontSize: 15, color: C.white, marginBottom: 4 },
  boldText: { fontWeight: 'bold' },
  timeText: { fontSize: 12, color: C.textMuted },
  separator: { height: 1, backgroundColor: '#1a1a1a', marginVertical: 4 }
});
