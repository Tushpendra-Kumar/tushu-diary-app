import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import { Construction, ArrowLeft } from 'lucide-react-native';
import ParticleBackground from '../../../components/ParticleBackground';

export default function ComingSoonScreen({ route, navigation }) {
  const { title = 'Feature', desc = 'This feature is coming soon.' } = route.params || {};

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      <View style={s.content}>
        <Construction size={72} color={C.gold} style={{ marginBottom: 20 }} />
        <Text style={s.title}>{title}</Text>
        <Text style={s.desc}>{desc}</Text>
        <View style={s.badge}>
          <Text style={s.badgeText}>🚧 Coming Soon</Text>
        </View>
        <Text style={s.hint}>This feature is being built and will be available in the next update.</Text>
      </View>
      <SecurityFooter />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#06080D' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { fontSize: 22, fontWeight: '800', color: C.white, marginBottom: 12, textAlign: 'center' },
  desc: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  badge: { backgroundColor: 'rgba(240, 165, 0, 0.1)', borderWidth: 1, borderColor: 'rgba(240, 165, 0, 0.3)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, marginBottom: 16 },
  badgeText: { color: C.gold, fontWeight: '700', fontSize: 14 },
  hint: { fontSize: 12, color: C.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 32 },
  backHomeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.goldDim, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  backHomeBtnText: { color: C.gold, fontWeight: '700', fontSize: 14 },
});
