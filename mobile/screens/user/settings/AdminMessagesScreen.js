import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { ArrowLeft, Send } from 'lucide-react-native';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { getAllAdminMessages, replyToAdminMessage } from '../../../services/adminApi';
import { triggerAnnouncementNotification } from '../../../services/notificationService';

export default function AdminMessagesScreen() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [replyingId, setReplyingId] = useState(null);

  const loadMessages = async () => {
    try {
      const data = await getAllAdminMessages();
      setMessages(data);
    } catch (e) {
      console.warn('Failed to load admin messages', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleReply = async (id, userId) => {
    const text = replyText[id];
    if (!text || !text.trim()) {
      if (Platform.OS === 'web') window.alert('Reply cannot be empty');
      else Alert.alert('Error', 'Reply cannot be empty');
      return;
    }

    setReplyingId(id);
    try {
      await replyToAdminMessage(id, text.trim());
      // Notify the user locally (simulated push)
      triggerAnnouncementNotification(userId, 'Admin Reply Received', 'Your Family Admin has replied to your message.');
      
      if (Platform.OS === 'web') window.alert('Reply sent successfully!');
      else Alert.alert('Success', 'Reply sent successfully!');
      
      loadMessages();
    } catch (e) {
      if (Platform.OS === 'web') window.alert(e.message || 'Failed to send reply');
      else Alert.alert('Error', e.message || 'Failed to send reply');
    } finally {
      setReplyingId(null);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <ParticleBackground />
      
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.description}>
          Manage and reply to support messages sent by family members.
        </Text>

        {loading ? (
          <ActivityIndicator color={C.gold} style={{marginTop: 40}} />
        ) : messages.length === 0 ? (
          <Text style={s.emptyText}>No messages from users.</Text>
        ) : (
          messages.map(m => (
            <View key={m.id} style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.userId}>User ID: {m.user_id}</Text>
                <Text style={s.status(m.status)}>{m.status}</Text>
              </View>
              <Text style={s.date}>{formatDate(m.createdAt)}</Text>
              <Text style={s.subject}>{m.subject}</Text>
              <Text style={s.message}>{m.message}</Text>
              
              {m.status === 'REPLIED' ? (
                <View style={s.replyBox}>
                  <Text style={s.replyLabel}>Your Reply:</Text>
                  <Text style={s.replyTextContent}>{m.adminReply}</Text>
                  <Text style={s.date}>{formatDate(m.repliedAt)}</Text>
                </View>
              ) : (
                <View style={s.inputContainer}>
                  <TextInput
                    style={s.input}
                    placeholder="Type your reply..."
                    placeholderTextColor="#666"
                    underlineColorAndroid="transparent"
                    value={replyText[m.id] || ''}
                    onChangeText={(val) => setReplyText({...replyText, [m.id]: val})}
                    multiline
                  />
                  <TouchableOpacity 
                    style={[s.sendBtn, replyingId === m.id && {opacity: 0.7}]}
                    onPress={() => handleReply(m.id, m.userId)}
                    disabled={replyingId === m.id}
                  >
                    {replyingId === m.id ? <ActivityIndicator size="small" color="#000" /> : <Send size={20} color="#000" />}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20 },
  description: { fontSize: 14, color: C.textSecondary || '#aaa', marginBottom: 24 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 16 },
  card: { backgroundColor: '#1A1A1A', borderRadius: 8, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  userId: { color: '#888', fontSize: 12 },
  status: (st) => ({ color: st === 'REPLIED' ? '#4CAF50' : '#FF9800', fontSize: 12, fontWeight: '700' }),
  date: { color: '#666', fontSize: 12, marginBottom: 12 },
  subject: { color: C.gold, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  message: { color: '#eee', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  replyBox: { backgroundColor: '#222', padding: 12, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: '#4CAF50' },
  replyLabel: { color: '#4CAF50', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  replyTextContent: { color: '#ddd', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 },
  input: { flex: 1, backgroundColor: '#111', borderWidth: 1, borderColor: '#333', borderRadius: 8, color: C.white, padding: 12, minHeight: 48, maxHeight: 120, marginRight: 8, outlineStyle: 'none' },
  sendBtn: { backgroundColor: C.gold, width: 48, height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }
});
