import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, Platform, Image as RNImage } from 'react-native';
import { RefreshCcw, Trash2, FileText, Image as ImageIcon, Video, FileWarning } from 'lucide-react-native';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { AuthContext } from '../../../context/AuthContext';
import { getRecycleBinItems, restoreFromRecycleBin, deletePermanently, mockDeleteActiveFile } from '../../../services/recycleBinService';

export default function RecycleBinScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilesCount, setActiveFilesCount] = useState(0);

  useEffect(() => {
    if (user?.user_id) loadItems();
  }, [user?.user_id]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const bItems = await getRecycleBinItems(user.user_id);
      if (__DEV__) {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const activeRaw = await AsyncStorage.getItem(`tushu_${user.user_id}_files_mock`);
        const activeArr = activeRaw ? JSON.parse(activeRaw) : [];
        setActiveFilesCount(activeArr.length);
      }
      setItems(bItems.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type) => {
    if (type.includes('image')) return <ImageIcon size={24} color="#42A5F5" />;
    if (type.includes('video')) return <Video size={24} color="#EC407A" />;
    if (type.includes('pdf')) return <FileWarning size={24} color="#EF5350" />;
    return <FileText size={24} color={C.textSecondary} />;
  };

  const handleRestore = async (item) => {
    try {
      await restoreFromRecycleBin(user.user_id, item.binId);
      if (Platform.OS === 'web') window.alert(`"${item.name}" restored to ${item.originalLocation}`);
      else Alert.alert('Restored', `"${item.name}" restored to ${item.originalLocation}`);
      loadItems();
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = (item) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to permanently delete "${item.name}"? This cannot be undone.`)) {
        executeDelete(item.binId);
      }
    } else {
      Alert.alert(
        'Permanent Delete',
        `Are you sure you want to permanently delete "${item.name}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Permanently', style: 'destructive', onPress: () => executeDelete(item.binId) }
        ]
      );
    }
  };

  const executeDelete = async (binId) => {
    try {
      await deletePermanently(user.user_id, binId);
      loadItems();
    } catch (e) {
      console.error(e);
    }
  };

  const devTestMockDelete = async () => {
    await mockDeleteActiveFile(user.user_id);
    loadItems();
    if (Platform.OS === 'web') window.alert('Mock Image deleted from Active Files and moved to Recycle Bin!');
    else Alert.alert('Test', 'Mock Image deleted from Active Files and moved to Recycle Bin!');
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={s.container}>
      <ParticleBackground />
      
      {__DEV__ && (
        <View style={{marginBottom: 10}}>
          <TouchableOpacity style={s.devBtn} onPress={devTestMockDelete}>
            <Text style={s.devBtnText}>[DEV TEST] Simulate Deleting an Uploaded File</Text>
          </TouchableOpacity>
          <Text style={{color: '#FF9800', textAlign: 'center', marginTop: 8, fontSize: 12}}>DEV ONLY: Active Files in Storage: {activeFilesCount}</Text>
        </View>
      )}

      <View style={s.headerContainer}>
        <Text style={s.subText}>Recover deleted files. Files will be permanently deleted after 30 days (when backend cron is enabled).</Text>
      </View>

      <ScrollView contentContainerStyle={s.list}>
        {items.length === 0 && !loading ? (
          <View style={s.emptyState}>
            <Trash2 size={48} color="#333" />
            <Text style={s.emptyText}>Recycle Bin is empty.</Text>
          </View>
        ) : (
          items.map(item => (
            <View key={item.binId} style={s.card}>
              <View style={s.cardRow}>
                <View style={s.iconBox}>{getFileIcon(item.type)}</View>
                <View style={s.cardDetails}>
                  <Text style={s.fileName} numberOfLines={1}>{item.name}</Text>
                  <Text style={s.fileMeta}>{item.size} • Deleted: {formatDate(item.deletedAt)}</Text>
                </View>
              </View>
              <View style={s.actions}>
                <TouchableOpacity style={s.restoreBtn} onPress={() => handleRestore(item)}>
                  <RefreshCcw size={16} color="#fff" />
                  <Text style={s.restoreText}>Restore</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.deleteBtn} onPress={() => confirmDelete(item)}>
                  <Trash2 size={16} color="#ff4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06080D' },
  headerContainer: { padding: 20, paddingBottom: 10 },
  subText: { color: C.textSecondary, fontSize: 13, lineHeight: 18 },
  list: { padding: 20 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardDetails: { flex: 1 },
  fileName: { color: '#fff', fontSize: 16, fontWeight: '500', marginBottom: 4 },
  fileMeta: { color: '#888', fontSize: 12 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 12 },
  restoreBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  restoreText: { color: '#fff', fontSize: 14, marginLeft: 8, fontWeight: '500' },
  deleteBtn: { padding: 8 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666', marginTop: 16, fontSize: 16 },
  devBtn: { backgroundColor: '#FF9800', margin: 20, marginBottom: 0, padding: 12, borderRadius: 8, alignItems: 'center' },
  devBtnText: { color: '#fff', fontWeight: 'bold' }
});
