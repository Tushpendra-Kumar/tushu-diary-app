import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { addUser } from '../../services/adminApi';
import SecurityFooter from '../../components/SecurityFooter';
import ParticleBackground from '../../components/ParticleBackground';
import { C } from '../../constants/theme';

export default function AddUserScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [gender, setGender] = useState(''); // '' means unselected initially
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (loading) return;
    setError('');
    if (!fullName.trim()) return setError('Full Name is required.');
    if (!userId.trim()) return setError('User ID is required.');
    if (!password) return setError('Password is required.');
    if (!confirmPassword) return setError('Confirm Password is required.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (!gender) return setError('Please select an Interface (Male or Female).');

    setLoading(true);
    const result = await addUser({ fullName: fullName.trim(), userId: userId.trim(), password, status, gender });
    setLoading(false);

    if (result.success) {
      Alert.alert('Success ✓', 'User created successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } else {
      setError(result.message || 'Failed to create user');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ParticleBackground />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Add New User</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName}
          placeholder="e.g. Rahul Kumar" placeholderTextColor={C.textMuted} />

        <Text style={styles.label}>User ID (Unique Login ID)</Text>
        <TextInput style={styles.input} value={userId} onChangeText={setUserId}
          placeholder="e.g. rahul123" placeholderTextColor={C.textMuted} autoCapitalize="none" />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword}
          secureTextEntry placeholder="Set password for user" placeholderTextColor={C.textMuted} />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword}
          secureTextEntry placeholder="Repeat password" placeholderTextColor={C.textMuted} />

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

        <Text style={styles.label}>Interface *</Text>
        <View style={styles.statusToggle}>
          <TouchableOpacity
            style={[styles.statusOption, gender === 'male' && styles.interfaceMaleSelected]}
            onPress={() => setGender('male')}
          >
            <Text style={[styles.statusText, gender === 'male' && { color: C.gold, fontWeight: '700' }]}>Male / Gents</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusOption, gender === 'female' && styles.interfaceFemaleSelected]}
            onPress={() => setGender('female')}
          >
            <Text style={[styles.statusText, gender === 'female' && { color: '#FF4081', fontWeight: '700' }]}>Female / Ladies</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Create User</Text>}
        </TouchableOpacity>

        <SecurityFooter style={{ marginTop: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
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
  statusToggle: {
    flexDirection: 'row', marginBottom: 32, borderRadius: 12,
    overflow: 'hidden', borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  statusOption: { flex: 1, padding: 16, alignItems: 'center' },
  statusActiveSelected: { backgroundColor: C.successBg, borderRightWidth: 1, borderRightColor: C.successBorder },
  statusInactiveSelected: { backgroundColor: C.errorBg },
  interfaceMaleSelected: { backgroundColor: 'rgba(255, 179, 0, 0.1)', borderRightWidth: 1, borderRightColor: 'rgba(255, 179, 0, 0.3)' },
  interfaceFemaleSelected: { backgroundColor: 'rgba(255, 64, 129, 0.1)' },
  statusText: { fontWeight: '600', color: C.textMuted, fontSize: 15 },
  button: {
    backgroundColor: C.gold, padding: 18, borderRadius: 14,
    alignItems: 'center', marginTop: 8, elevation: 3,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '700' },
  errorBox: {
    backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.errorBorder,
    padding: 14, borderRadius: 12, marginBottom: 20,
  },
  errorText: { color: C.error, fontWeight: '600', fontSize: 14 },
});
