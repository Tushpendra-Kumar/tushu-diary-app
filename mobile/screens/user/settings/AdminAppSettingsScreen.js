import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, SafeAreaView, TextInput, ScrollView } from 'react-native';
import { ArrowLeft, AppWindow, Mail, AlertTriangle } from 'lucide-react-native';
import { C } from '../../../constants/theme';import ParticleBackground from '../../../components/ParticleBackground';


export default function AdminAppSettingsScreen({ navigation }) {
  const [appName, setAppName] = useState('TushuDiary');
  const [supportEmail, setSupportEmail] = useState('support@tushudiary.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <SafeAreaView style={s.safeArea}>
      <ParticleBackground />
      
      <ScrollView contentContainerStyle={s.content}>
        
        <View style={s.inputGroup}>
          <Text style={s.label}>App Name</Text>
          <View style={s.inputContainer}>
            <AppWindow size={20} color={C.textMuted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              value={appName}
              onChangeText={setAppName}
              placeholderTextColor={C.textMuted}
              underlineColorAndroid="transparent"
            />
          </View>
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>Support Email</Text>
          <View style={s.inputContainer}>
            <Mail size={20} color={C.textMuted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              value={supportEmail}
              onChangeText={setSupportEmail}
              keyboardType="email-address"
              placeholderTextColor={C.textMuted}
              underlineColorAndroid="transparent"
            />
          </View>
        </View>

        <View style={s.section}>
          <View style={s.row}>
            <View style={[s.iconBg, { backgroundColor: 'rgba(255, 165, 0, 0.1)' }]}>
              <AlertTriangle size={20} color="#FFA500" />
            </View>
            <View style={s.textContainer}>
              <Text style={s.title}>Maintenance Mode</Text>
              <Text style={s.subtitle}>Lock the app for all non-admin users.</Text>
            </View>
            <Switch
              value={maintenanceMode}
              onValueChange={setMaintenanceMode}
              trackColor={{ false: '#767577', true: '#FFA500' }}
              thumbColor={C.white}
            />
          </View>
        </View>

        <TouchableOpacity style={s.saveBtn}>
          <Text style={s.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.white, marginLeft: 16 },
  content: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { color: C.textSecondary, fontSize: 14, marginBottom: 8, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#333' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: C.white, fontSize: 16, paddingVertical: 14, outlineStyle: 'none' },
  section: { marginBottom: 24, padding: 16, backgroundColor: '#111', borderRadius: 12, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  title: { fontSize: 16, color: C.white, fontWeight: '600', marginBottom: 4 },
  subtitle: { fontSize: 13, color: C.textSecondary },
  saveBtn: { backgroundColor: C.gold, paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' }
});

