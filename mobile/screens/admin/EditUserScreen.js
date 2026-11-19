import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { updateUser } from '../../services/adminApi';
import ParticleBackground from '../../components/ParticleBackground';
import { C } from '../../constants/theme';

export default function EditUserScreen({ route, navigation }) {
  const { user } = route.params;
  const [fullName, setFullName] = useState(user.full_name);
  const [status, setStatus] = useState(user.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    if (loading) return;
    setError('');
    if (!fullName.trim()) return setError('Full Name is required.');
    setLoading(true);
    const result = await updateUser(user.id, { fullName: fullName.trim(), status });
    setLoading(false);
    if (result.success) {
      Alert.alert('Success ✓', 'User updated successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } else {
      setError(result.message || 'Failed to update user');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ParticleBackground />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Edit User</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>User ID (Cannot be changed)</Text>
        <TextInput style={[styles.input, styles.disabledInput]} value={user.user_id} editable={false} />

        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName}
          placeholder="e.g. Rahul Kumar" placeholderTextColor={C.textMuted} />

        <Text style={styles.label}>Status</Text>
        <View style={styles.statusToggle}>
          <TouchableOpacity
            style={[styles.statusOption, status === 'ACTIVE' && styles.statusActiveSelected]}
            onPress={() => setStatus('ACTIVE')}
          >
            <Text style={[styles.statusText, status === 'ACTIVE' && { color: C.success, fontWeight: '700' }]}>✓ Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusOption, status === 'INACTIVE' && styles.statusInactiveSelected]}
            onPress={() => setStatus('INACTIVE')}
          >
            <Text style={[styles.statusText, status === 'INACTIVE' && { color: C.error, fontWeight: '700' }]}>✕ Inactive</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleUpdate} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06080D' },
  scroll: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', color: C.white, marginBottom: 24, marginTop: 12 },
  label: {
    fontSize: 11, fontWeight: '700', color: C.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
  },
  input: {
    backgroundColor: C.input, borderWidth: 1, borderColor: C.border,
    padding: 16, borderRadius: 12, marginBottom: 20, fontSize: 15, color: C.white,
    outlineStyle: 'none',
  },
  disabledInput: { backgroundColor: 'rgba(255,255,255,0.05)', color: C.textMuted },
  statusToggle: {
    flexDirection: 'row', marginBottom: 32, borderRadius: 12,
    overflow: 'hidden', borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  statusOption: { flex: 1, padding: 16, alignItems: 'center' },
  statusActiveSelected: { backgroundColor: C.successBg, borderRightWidth: 1, borderRightColor: C.successBorder },
  statusInactiveSelected: { backgroundColor: C.errorBg },
  statusText: { fontWeight: '600', color: C.textMuted, fontSize: 15 },
  button: {
    backgroundColor: C.gold, padding: 18, borderRadius: 12,
    alignItems: 'center', marginTop: 10,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  errorBox: { backgroundColor: C.errorBg, padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: C.errorBorder },
  errorText: { color: C.error, fontWeight: '600', fontSize: 14 },
});
