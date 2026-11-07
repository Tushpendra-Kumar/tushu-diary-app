import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Switch, SafeAreaView } from 'react-native';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { AuthContext } from '../../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as notifService from '../../../services/notificationService';

export default function EventRemindersScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    sevenDaysBefore: true,
    oneDayBefore: true,
    morningOfEvent: true,
    oneHourBefore: false,
  });

  useEffect(() => {
    if (user?.user_id) {
      AsyncStorage.getItem(`tushu_${user.user_id}_event_reminders`).then(saved => {
        if (saved) setSettings(JSON.parse(saved));
      }).catch(()=>{});
    }
  }, [user?.user_id]);

  const toggleSwitch = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    if (user?.user_id) {
      await AsyncStorage.setItem(`tushu_${user.user_id}_event_reminders`, JSON.stringify(newSettings));
      notifService.syncFamilyEventsNotifications(user.user_id, newSettings);
    }
  };

  const renderItem = (title, key) => (
    <View style={s.item}>
      <Text style={s.itemTitle}>{title}</Text>
      <Switch
        value={settings[key]}
        onValueChange={() => toggleSwitch(key)}
        trackColor={{ false: '#333', true: C.gold }}
        thumbColor={settings[key] ? '#000' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={s.safeArea}>
      <ParticleBackground />
      <View style={s.container}>
        <Text style={s.sectionHeader}>WHEN TO NOTIFY?</Text>
        <View style={s.card}>
          {renderItem('Send reminder 7 days before', 'sevenDaysBefore')}
          <View style={s.divider} />
          {renderItem('Send reminder 1 day before', 'oneDayBefore')}
          <View style={s.divider} />
          {renderItem('Send morning of event', 'morningOfEvent')}
          <View style={s.divider} />
          {renderItem('Send reminder 1 hour before', 'oneHourBefore')}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 20 },
  sectionHeader: { color: C.textSecondary || '#aaa', fontSize: 12, fontWeight: '700', marginBottom: 8, marginLeft: 4, letterSpacing: 1 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  itemTitle: { color: C.white, fontSize: 16, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#333', marginLeft: 16 }
});
