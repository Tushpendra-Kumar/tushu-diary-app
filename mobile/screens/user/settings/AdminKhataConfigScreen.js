import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, SafeAreaView, ScrollView } from 'react-native';
import { ArrowLeft, Power, DollarSign } from 'lucide-react-native';
import { C } from '../../../constants/theme';import ParticleBackground from '../../../components/ParticleBackground';


export default function AdminKhataConfigScreen({ navigation }) {
  const [globalEnable, setGlobalEnable] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState('INR');

  return (
    <SafeAreaView style={s.safeArea}>
      <ParticleBackground />
      
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.section}>
          <View style={s.row}>
            <View style={s.iconBg}>
              <Power size={20} color={C.white} />
            </View>
            <View style={s.textContainer}>
              <Text style={s.title}>Enable Global Khata</Text>
              <Text style={s.subtitle}>Turn Khata features on or off for all users.</Text>
            </View>
            <Switch
              value={globalEnable}
              onValueChange={setGlobalEnable}
              trackColor={{ false: '#767577', true: C.gold }}
              thumbColor={C.white}
            />
          </View>
        </View>

        <View style={s.section}>
          <View style={s.row}>
            <View style={s.iconBg}>
              <DollarSign size={20} color={C.white} />
            </View>
            <View style={s.textContainer}>
              <Text style={s.title}>Default Currency</Text>
              <Text style={s.subtitle}>Set default currency for new ledgers.</Text>
            </View>
          </View>
          <View style={s.currencyOptions}>
            {['INR', 'USD', 'EUR'].map(curr => (
              <TouchableOpacity 
                key={curr} 
                style={[s.currencyBtn, defaultCurrency === curr && s.currencyBtnActive]}
                onPress={() => setDefaultCurrency(curr)}
              >
                <Text style={[s.currencyText, defaultCurrency === curr && s.currencyTextActive]}>{curr}</Text>
              </TouchableOpacity>
            ))}
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
  section: { marginBottom: 24, padding: 16, backgroundColor: '#111', borderRadius: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  title: { fontSize: 16, color: C.white, fontWeight: '600', marginBottom: 4 },
  subtitle: { fontSize: 13, color: C.textSecondary },
  currencyOptions: { flexDirection: 'row', marginTop: 16, gap: 12 },
  currencyBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  currencyBtnActive: { borderColor: C.gold, backgroundColor: 'rgba(255, 215, 0, 0.1)' },
  currencyText: { color: C.textSecondary, fontWeight: '600' },
  currencyTextActive: { color: C.gold }
});

