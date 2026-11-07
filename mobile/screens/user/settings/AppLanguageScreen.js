import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';

export default function AppLanguageScreen() {
  return (
    <SafeAreaView style={s.container}>
      <ParticleBackground />
      <View style={s.content}>
        <Text style={s.sectionTitle}>SELECT LANGUAGE</Text>
        
        <View style={s.languageCard}>
          <TouchableOpacity style={s.languageRow} activeOpacity={1}>
            <View style={s.leftCol}>
              <View style={s.radioOuter}>
                <View style={s.radioInner} />
              </View>
              <Text style={s.languageLabel}>English</Text>
            </View>
            <Check size={20} color={C.gold} />
          </TouchableOpacity>
        </View>
        <Text style={s.infoText}>Currently, the application is only available in English.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20 },
  sectionTitle: { color: C.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 16, letterSpacing: 1, textTransform: 'uppercase' },
  languageCard: { backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  languageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  leftCol: { flexDirection: 'row', alignItems: 'center' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.gold, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.gold },
  languageLabel: { color: C.white, fontSize: 16, fontWeight: '500' },
  infoText: { color: C.textSecondary, fontSize: 12, marginTop: 16, textAlign: 'center' }
});
