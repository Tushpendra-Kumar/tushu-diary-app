import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput, ActivityIndicator, Platform } from 'react-native';
import { MessageSquare, Clock, CheckCircle, Mail } from 'lucide-react-native';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { sendContactAdminMessage, getUserAdminMessages } from '../../../services/adminApi';

export default function ContactAdminScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadMessages = async () => {
    try {
      const data = await getUserAdminMessages();
      setMessages(data);
    } catch (e) {
      console.warn('Failed to load past messages', e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleSend = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!subject.trim()) {
      setErrorMsg('Subject is required');
      return;
    }
    if (!message.trim()) {
      setErrorMsg('Message is required');
      return;
    }

    setLoading(true);
    try {
      await sendContactAdminMessage(subject.trim(), message.trim());
      setSuccessMsg('Your message was sent successfully to the Admin!');
      setSubject('');
      setMessage('');
      loadMessages();
    } catch (e) {
      setErrorMsg(e.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
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
          Send a direct message to your Family Admin. They will receive a notification and can reply to you.
        </Text>

        <Text style={s.label}>Subject</Text>
        <TextInput
          style={s.input}
          placeholder="What is this regarding?"
          placeholderTextColor={C.textMuted || '#666'}
          underlineColorAndroid="transparent"
          value={subject}
          onChangeText={setSubject}
          editable={!loading}
        />

        <Text style={s.label}>Message</Text>
        <TextInput
          style={[s.input, s.textArea]}
          placeholder="Type your message here..."
          placeholderTextColor={C.textMuted || '#666'}
          underlineColorAndroid="transparent"
          value={message}
          onChangeText={setMessage}
          multiline
          textAlignVertical="top"
          editable={!loading}
        />

        {errorMsg ? <Text style={s.errorText}>{errorMsg}</Text> : null}
        {successMsg ? <Text style={s.successText}>{successMsg}</Text> : null}

        <TouchableOpacity 
          style={[s.submitBtn, loading && {opacity: 0.7}]} 
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <MessageSquare size={20} color={'#000'} style={s.submitIcon} />
              <Text style={s.submitText}>Send Message</Text>
            </>
          )}
        </TouchableOpacity>

        {fetching ? (
          <ActivityIndicator color={C.gold} style={{marginTop: 40}} />
        ) : messages.length > 0 ? (
          <View style={s.historyContainer}>
            <Text style={s.historyTitle}>Past Messages</Text>
            {messages.map(m => (
              <View key={m.id} style={s.historyCard}>
                <View style={s.historyHeader}>
                  <Text style={s.historySubject}>{m.subject}</Text>
                  <Text style={s.historyStatus(m.status)}>{m.status === 'REPLIED' ? 'Replied' : 'Pending'}</Text>
                </View>
                <Text style={s.historyDate}>{formatDate(m.createdAt)}</Text>
                <Text style={s.historyMessage}>{m.message}</Text>
                
                {m.adminReply && (
                  <View style={s.replyBox}>
                    <Text style={s.replyLabel}>Admin Reply:</Text>
                    <Text style={s.replyText}>{m.adminReply}</Text>
                    <Text style={s.historyDate}>{formatDate(m.repliedAt)}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20 },
  description: { fontSize: 14, color: C.textSecondary || '#aaa', marginBottom: 24, lineHeight: 20 },
  label: { fontSize: 14, color: C.textSecondary || '#aaa', marginBottom: 8 },
  input: { backgroundColor: '#111', borderWidth: 1, borderColor: '#333', borderRadius: 8, color: C.white, padding: 16, fontSize: 16, marginBottom: 16, outlineStyle: 'none' },
  textArea: { height: 160, paddingTop: 16 },
  submitBtn: { backgroundColor: C.gold || '#ffd700', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 8, marginTop: 8 },
  submitIcon: { marginRight: 8 },
  submitText: { color: '#000', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#ff4d4d', fontSize: 14, marginBottom: 10, textAlign: 'center' },
  successText: { color: '#4CAF50', fontSize: 14, marginBottom: 10, textAlign: 'center' },
  historyContainer: { marginTop: 40 },
  historyTitle: { color: C.white, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  historyCard: { backgroundColor: '#1A1A1A', borderRadius: 8, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  historySubject: { color: C.white, fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  historyStatus: (status) => ({ color: status === 'REPLIED' ? '#4CAF50' : '#FF9800', fontSize: 12, fontWeight: '600' }),
  historyDate: { color: '#666', fontSize: 12, marginBottom: 12 },
  historyMessage: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  replyBox: { marginTop: 16, padding: 12, backgroundColor: '#2A2A2A', borderRadius: 6, borderLeftWidth: 3, borderLeftColor: C.gold },
  replyLabel: { color: C.gold, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  replyText: { color: '#eee', fontSize: 14, lineHeight: 20, marginBottom: 8 }
});
