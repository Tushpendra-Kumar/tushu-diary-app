import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, SafeAreaView, ScrollView } from 'react-native';
import { ArrowLeft, Clock, Lock } from 'lucide-react-native';
import { C } from '../../../constants/theme';import ParticleBackground from '../../../components/ParticleBackground';


export default function AdminSecurityControlsScreen({ navigation }) {
  const [requireStrongPassword, setRequireStrongPassword] = useState(true);
  const [forceTimeout, setForceTimeout] = useState(false);

  return (
    <SafeAreaView style={s.safeArea}>
      <ParticleBackground />
      
      <ScrollView contentContainerStyle={s.content}>
        
        <View style={s.section}>
          <View style={s.row}>
            <View style={s.iconBg}>
              <Lock size={20} color={C.white} />
            </View>
            <View style={s.textContainer}>
              <Text style={s.title}>Require Strong Passwords</Text>
              <Text style={s.subtitle}>Enforce min 8 chars, uppercase, and special chars.</Text>
            </View>
            <Switch
              value={requireStrongPassword}
              onValueChange={setRequireStrongPassword}
              trackColor={{ false: '#767577', true: C.gold }}
              thumbColor={C.white}
            />
          </View>
        </View>

        <View style={s.section}>
          <View style={s.row}>
            <View style={s.iconBg}>
              <Clock size={20} color={C.white} />
            </View>
            <View style={s.textContainer}>
              <Text style={s.title}>Force Session Timeout</Text>
              <Text style={s.subtitle}>Require re-login after 30 days of inactivity.</Text>
            </View>
            <Switch
              value={forceTimeout}
              onValueChange={setForceTimeout}
              trackColor={{ false: '#767577', true: C.gold }}
              thumbColor={C.white}
            />
          </View>
        </View>
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
  section: { marginBottom: 16, padding: 16, backgroundColor: '#111', borderRadius: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  title: { fontSize: 16, color: C.white, fontWeight: '600', marginBottom: 4 },
  subtitle: { fontSize: 13, color: C.textSecondary },
});

