import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Switch, SafeAreaView, ScrollView } from 'react-native';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { AuthContext } from '../../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FamilyNotificationsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    newMember: true,
    announcements: true,
    eventUpdates: false,
  });

  useEffect(() => {
    if (user?.user_id) {
      AsyncStorage.getItem(`tushu_${user.user_id}_fam_notif_prefs`).then(saved => {
        if (saved) setSettings(JSON.parse(saved));
      }).catch(()=>{});
    }
  }, [user?.user_id]);

  const toggleSwitch = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    if (user?.user_id) {
      await AsyncStorage.setItem(`tushu_${user.user_id}_fam_notif_prefs`, JSON.stringify(newSettings));
    }
  };

  const renderItem = (title, description, key) => (
    <View style={s.item}>
      <View style={s.textContainer}>
        <Text style={s.itemTitle}>{title}</Text>
        <Text style={s.itemDesc}>{description}</Text>
      </View>
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
      <ScrollView contentContainerStyle={s.container}>
        <View style={s.card}>
          {renderItem('New Family Member Joined', 'Get notified when someone joins the family.', 'newMember')}
          <View style={s.divider} />
          {renderItem('Family Announcements', 'Important updates broadcasted by family admins.', 'announcements')}
          <View style={s.divider} />
          {renderItem('Event Updates', 'Changes to events you are participating in.', 'eventUpdates')}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 20 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  textContainer: { flex: 1, paddingRight: 16 },
  itemTitle: { color: C.white, fontSize: 16, fontWeight: '500', marginBottom: 4 },
  itemDesc: { color: C.textSecondary || '#aaa', fontSize: 12, lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#333', marginLeft: 16 }
});
