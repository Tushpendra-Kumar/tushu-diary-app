import React, { useState, useContext, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { AuthContext } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../services/adminApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AccountPrivacyScreen({ navigation }) {
  const { user, updateUserProfile } = useContext(AuthContext);

  const [showProfile, setShowProfile] = useState(user?.privacy_show_profile !== false);
  const [showActivity, setShowActivity] = useState(user?.privacy_show_activity === true);
  const [allowTags, setAllowTags] = useState(user?.privacy_allow_tags !== false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setShowProfile(user.privacy_show_profile !== false); // default true
      setShowActivity(user.privacy_show_activity === true); // default false
      setAllowTags(user.privacy_allow_tags !== false); // default true
    }
  }, [user]);

  const handleToggle = async (key, value) => {
    setLoading(true);
    if (key === 'profile') setShowProfile(value);
    if (key === 'activity') setShowActivity(value);
    if (key === 'tags') setAllowTags(value);
    
    await updateUserProfile({ [`privacy_${key === 'tags' ? 'allow_tags' : 'show_' + key}`]: value });
    
    // Sync with backend
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${API_BASE_URL}/api/user/update-privacy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ [`privacy_${key === 'tags' ? 'allow_tags' : 'show_' + key}`]: value })
      });
    } catch (err) {
      console.log('Failed to sync privacy to backend', err);
    }
    
    setLoading(false);
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <ParticleBackground />
      
      <ScrollView contentContainerStyle={s.content}>
        
        <View style={s.settingRow}>
          <View style={s.settingTextInfo}>
            <Text style={s.settingTitle}>Show Profile to Family</Text>
            <Text style={s.settingDesc}>Allow family members to see your profile details.</Text>
          </View>
          <Switch 
            value={showProfile} 
            onValueChange={(val) => handleToggle('profile', val)} 
            trackColor={{ false: '#333', true: C.gold || '#ffd700' }}
            thumbColor={showProfile ? '#000' : '#f4f3f4'}
            disabled={loading}
          />
        </View>

        <View style={s.settingRow}>
          <View style={s.settingTextInfo}>
            <Text style={s.settingTitle}>Show Activity</Text>
            <Text style={s.settingDesc}>Display your recent expense activity to others.</Text>
          </View>
          <Switch 
            value={showActivity} 
            onValueChange={(val) => handleToggle('activity', val)} 
            trackColor={{ false: '#333', true: C.gold || '#ffd700' }}
            thumbColor={showActivity ? '#000' : '#f4f3f4'}
            disabled={loading}
          />
        </View>

        <View style={s.settingRow}>
          <View style={s.settingTextInfo}>
            <Text style={s.settingTitle}>Allow Tagging</Text>
            <Text style={s.settingDesc}>Let others tag you in split transactions.</Text>
          </View>
          <Switch 
            value={allowTags} 
            onValueChange={(val) => handleToggle('tags', val)} 
            trackColor={{ false: '#333', true: C.gold || '#ffd700' }}
            thumbColor={allowTags ? '#000' : '#f4f3f4'}
            disabled={loading}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border || '#333' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.white, marginLeft: 16 },
  content: { padding: 20 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  settingTextInfo: { flex: 1, paddingRight: 16 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: C.white, marginBottom: 4 },
  settingDesc: { fontSize: 12, color: C.textSecondary || '#aaa', lineHeight: 18 }
});
