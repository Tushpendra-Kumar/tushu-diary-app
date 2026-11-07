import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { ArrowLeft, Download, UploadCloud } from 'lucide-react-native';
import { C } from '../../../constants/theme';import ParticleBackground from '../../../components/ParticleBackground';


export default function AdminBackupRestoreScreen({ navigation }) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = () => {
    setIsExporting(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => { setIsExporting(false); setProgress(0); }, 1500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <ParticleBackground />
      
      <ScrollView contentContainerStyle={s.content}>
        
        <View style={s.card}>
          <View style={s.iconWrapper}>
            <UploadCloud size={32} color={C.gold} />
          </View>
          <Text style={s.cardTitle}>Export Database</Text>
          <Text style={s.cardDesc}>Save a copy of all ledgers and user data to an encrypted file.</Text>
          
          {isExporting ? (
            <View style={s.progressContainer}>
              <View style={s.progressBar}>
                <View style={[s.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={s.progressText}>{progress === 100 ? 'Export Complete' : `Exporting... ${progress}%`}</Text>
            </View>
          ) : (
            <TouchableOpacity style={s.primaryBtn} onPress={handleExport}>
              <Text style={s.primaryBtnText}>Start Export</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={s.card}>
          <View style={s.iconWrapper}>
            <Download size={32} color={C.white} />
          </View>
          <Text style={s.cardTitle}>Restore from Backup</Text>
          <Text style={s.cardDesc}>Replace current database with a previously exported backup file.</Text>
          
          <TouchableOpacity style={s.secondaryBtn}>
            <Text style={s.secondaryBtnText}>Select Backup File</Text>
          </TouchableOpacity>
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
  card: { backgroundColor: '#111', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 20 },
  iconWrapper: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, color: C.white, fontWeight: 'bold', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  primaryBtn: { backgroundColor: C.gold, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, width: '100%', alignItems: 'center' },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { backgroundColor: 'transparent', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  secondaryBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
  progressContainer: { width: '100%', alignItems: 'center' },
  progressBar: { width: '100%', height: 8, backgroundColor: '#333', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: C.gold },
  progressText: { color: C.textSecondary, fontSize: 13 }
});

