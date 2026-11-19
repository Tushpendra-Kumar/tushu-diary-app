import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ArrowLeft, BellRing } from 'lucide-react-native';
import { C } from '../../../constants/theme';import ParticleBackground from '../../../components/ParticleBackground';


export default function AdminGlobalNotificationsScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = () => {
    // Logic to send notification
    alert('Notification sent to all users!');
    setTitle('');
    setMessage('');
  };

  return (
    <SafeAreaView style={s.container}>
      <ParticleBackground />
      
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.iconWrapper}>
          <BellRing size={48} color={C.gold} />
          <Text style={s.screenSubtitle}>Send Announcements</Text>
        </View>

        <View style={s.formGroup}>
          <Text style={s.label}>Notification Title</Text>
          <TextInput
            style={s.input}
            placeholder="E.g., System Maintenance"
            placeholderTextColor={C.textSecondary || '#666'}
            underlineColorAndroid="transparent"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={s.formGroup}>
          <Text style={s.label}>Message Body</Text>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Write your announcement here..."
            placeholderTextColor={C.textSecondary || '#666'}
            underlineColorAndroid="transparent"
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity 
          style={[s.sendBtn, (!title || !message) && s.sendBtnDisabled]} 
          onPress={handleSend}
          disabled={!title || !message}
        >
          <Text style={s.sendBtnText}>Send Notification</Text>
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
  formGroup: { marginBottom: 20 },
  label: { color: C.white, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#111', borderWidth: 1, borderColor: '#333', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, color: C.white, fontSize: 16, outlineStyle: 'none' },
  textArea: { height: 120, paddingTop: 16 },
  sendBtn: { backgroundColor: C.gold, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});

