import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert, Platform, ScrollView } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { getVaultFiles, addVaultFile } from '../../../services/personalDataService';
import { moveToRecycleBin } from '../../../services/recycleBinService';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { Image as ImageIcon, Video, Music, FileText, Plus, Trash2, FolderOpen } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export default function MediaVaultScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id || user?.id;
  const [files, setFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('Photos');
  
  const tabs = [
    { name: 'Photos', icon: ImageIcon, typePrefix: 'image' },
    { name: 'Videos', icon: Video, typePrefix: 'video' },
    { name: 'Music', icon: Music, typePrefix: 'audio' },
    { name: 'Documents', icon: FileText, typePrefix: 'application' }
  ];

  useEffect(() => {
    if (userId) loadFiles();
  }, [userId]);

  const loadFiles = async () => {
    const allFiles = await getVaultFiles(userId);
    setFiles(allFiles);
  };

  const pickImageOrVideo = async (mediaType) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const fileName = asset.fileName || `${mediaType}_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`;
      const fileData = {
        name: fileName,
        uri: asset.uri,
        type: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
        size: asset.fileSize ? (asset.fileSize / (1024*1024)).toFixed(2) + ' MB' : 'Unknown Size',
        category: mediaType === 'video' ? 'Videos' : 'Photos',
        originalLocation: 'Media Vault'
      };
      await addVaultFile(userId, fileData);
      loadFiles();
    }
  };

  const pickDocumentOrAudio = async (isAudio) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: isAudio ? 'audio/*' : '*/*',
      copyToCacheDirectory: true,
    });
    if (result.type === 'success' || (result.assets && result.assets.length > 0)) {
      const asset = result.assets ? result.assets[0] : result;
      const fileData = {
        name: asset.name,
        uri: asset.uri,
        type: asset.mimeType || (isAudio ? 'audio/mp3' : 'application/pdf'),
        size: asset.size ? (asset.size / (1024*1024)).toFixed(2) + ' MB' : 'Unknown Size',
        category: isAudio ? 'Music' : 'Documents',
        originalLocation: 'Media Vault'
      };
      await addVaultFile(userId, fileData);
      loadFiles();
    }
  };

  const handleAdd = () => {
    if (activeTab === 'Photos') pickImageOrVideo('image');
    else if (activeTab === 'Videos') pickImageOrVideo('video');
    else if (activeTab === 'Music') pickDocumentOrAudio(true);
    else pickDocumentOrAudio(false);
  };

  const handleDelete = async (file) => {
    Alert.alert('Move to Recycle Bin?', `${file.name} will be moved to the Recycle Bin and can be restored within 30 days.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Move to Bin', style: 'destructive', onPress: async () => {
        await moveToRecycleBin(userId, file);
        loadFiles();
      }}
    ]);
  };
  
  // For web since Alert doesn't work well
  const handleDeleteWeb = async (file) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Move ${file.name} to Recycle Bin?`)) {
        await moveToRecycleBin(userId, file);
        loadFiles();
      }
    } else {
      handleDelete(file);
    }
  };

  const filteredFiles = files.filter(f => f.category === activeTab);

  return (
    <SafeAreaView style={styles.container}>
      <ParticleBackground />
      <View style={styles.header}>
        <View style={{width: 40}} />
        <Text style={styles.headerTitle}>Media Vault</Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 16}}>
          {tabs.map(tab => (
            <TouchableOpacity 
              key={tab.name} 
              style={[styles.tab, activeTab === tab.name && styles.activeTab]}
              onPress={() => setActiveTab(tab.name)}
            >
              <tab.icon size={16} color={activeTab === tab.name ? '#000' : C.textSecondary} />
              <Text style={[styles.tabText, activeTab === tab.name && styles.activeTabText]}>{tab.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredFiles}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListFooterComponent={<SecurityFooter />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FolderOpen size={48} color={C.textMuted} style={{marginBottom: 16}} />
            <Text style={styles.emptyTitle}>No {activeTab}</Text>
            <Text style={styles.emptySub}>Click the + button below to add {activeTab.toLowerCase()} to your vault.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconBox}>
               {activeTab === 'Photos' && <ImageIcon size={24} color={C.gold} />}
               {activeTab === 'Videos' && <Video size={24} color={C.gold} />}
               {activeTab === 'Music' && <Music size={24} color={C.gold} />}
               {activeTab === 'Documents' && <FileText size={24} color={C.gold} />}
            </View>
            <View style={styles.cardMain}>
              <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.cardMeta}>{item.size} • {new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteWeb(item)} style={styles.deleteBtn}>
              <Trash2 size={20} color={C.error} />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <Plus size={24} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06080D' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { color: C.white, fontSize: 18, fontWeight: 'bold' },
  tabContainer: { marginVertical: 10, height: 40 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10, borderWidth: 1, borderColor: C.border },
  activeTab: { backgroundColor: C.gold, borderColor: C.gold },
  tabText: { color: C.textSecondary, marginLeft: 8, fontWeight: '600' },
  activeTabText: { color: '#000', fontWeight: 'bold' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(240, 165, 0, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardMain: { flex: 1 },
  cardName: { color: C.white, fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  cardMeta: { color: C.textMuted, fontSize: 12 },
  deleteBtn: { padding: 10 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: C.gold, justifyContent: 'center', alignItems: 'center',    height: 2 },  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: C.white, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySub: { color: C.textMuted, textAlign: 'center', paddingHorizontal: 40 }
});
