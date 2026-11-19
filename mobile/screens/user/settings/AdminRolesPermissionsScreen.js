import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { ArrowLeft, Shield } from 'lucide-react-native';
import { C } from '../../../constants/theme';import ParticleBackground from '../../../components/ParticleBackground';


const MOCK_PERMISSIONS = [
  { id: 'p1', title: 'View Khata', desc: 'Allow normal users to see Khata', value: true },
  { id: 'p2', title: 'Create Events', desc: 'Allow normal users to create events', value: false },
  { id: 'p3', title: 'Manage Invites', desc: 'Allow normal users to manage event invites', value: true },
  { id: 'p4', title: 'View Global Analytics', desc: 'Allow normal users to see global analytics', value: false },
];

export default function AdminRolesPermissionsScreen({ navigation }) {
  const [permissions, setPermissions] = useState(MOCK_PERMISSIONS);

  const togglePermission = (id) => {
    setPermissions(permissions.map(p => p.id === id ? { ...p, value: !p.value } : p));
  };

  return (
    <SafeAreaView style={s.container}>
      <ParticleBackground />
      
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.iconWrapper}>
          <Shield size={48} color={C.gold} />
          <Text style={s.screenSubtitle}>Manage Global Permissions</Text>
        </View>
        
        {permissions.map(p => (
          <View key={p.id} style={s.permissionRow}>
            <View style={s.permissionText}>
              <Text style={s.pTitle}>{p.title}</Text>
              <Text style={s.pDesc}>{p.desc}</Text>
            </View>
            <Switch
              trackColor={{ false: '#333', true: C.gold }}
              thumbColor={p.value ? '#fff' : '#888'}
              ios_backgroundColor="#333"
              onValueChange={() => togglePermission(p.id)}
              value={p.value}
            />
          </View>
        ))}

        <TouchableOpacity style={s.saveBtn}>
          <Text style={s.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06080D' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border || '#333' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.white, marginLeft: 16 },
  content: { padding: 20 },
  iconWrapper: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  screenSubtitle: { color: C.textSecondary || '#888', marginTop: 12, fontSize: 16 },
  permissionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  permissionText: { flex: 1, paddingRight: 16 },
  pTitle: { color: C.white, fontSize: 16, fontWeight: '600', marginBottom: 4 },
  pDesc: { color: C.textSecondary || '#888', fontSize: 14 },
  saveBtn: { backgroundColor: C.gold, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 40 },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});

