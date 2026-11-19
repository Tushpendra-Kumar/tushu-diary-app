import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { updateRecord } from '../../services/adminApi';
import { C } from '../../constants/theme';




export default function EditRecordScreen({ route, navigation }) {
  const { record } = route.params;
  const [title, setTitle] = useState(record.title);
  const [amount, setAmount] = useState(record.amount.toString());
  const [description, setDescription] = useState(record.description || '');
  const [date, setDate] = useState(record.record_date);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    if (loading) return;
    setError('');
    if (!title.trim()) return setError('Title is required.');
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) return setError('Valid positive amount is required.');
    if (!date || isNaN(Date.parse(date))) return setError('Valid date is required (YYYY-MM-DD).');

    setLoading(true);
    const result = await updateRecord(record.id, { title: title.trim(), amount: numericAmount, description: description.trim(), date });
    setLoading(false);

    if (result.success) {
      Alert.alert('Success ✓', 'Record updated successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } else {
      setError(result.message || 'Failed to update record');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Edit Record</Text>

        {error ? (
          <View style={styles.errorBox}><Text style={styles.errorText}>⚠ {error}</Text></View>
        ) : null}

        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle}
          placeholder="e.g. March Expense" placeholderTextColor={C.textMuted} underlineColorAndroid="transparent" />

        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount}
          placeholder="e.g. 7500" placeholderTextColor={C.textMuted} keyboardType="numeric" underlineColorAndroid="transparent" />

        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription}
          placeholder="Enter description..." placeholderTextColor={C.textMuted} multiline numberOfLines={3} underlineColorAndroid="transparent" />

        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate}
          placeholder="2026-03-10" placeholderTextColor={C.textMuted} underlineColorAndroid="transparent" />

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
  title: { fontSize: 24, fontWeight: '800', color: C.white, marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, padding: 16, borderRadius: 12, marginBottom: 20, fontSize: 15, color: C.white, outlineStyle: 'none' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  button: { backgroundColor: C.gold, padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 8, elevation: 3 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '700' },
  errorBox: { backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.errorBorder, padding: 14, borderRadius: 12, marginBottom: 20 },
  errorText: { color: C.error, fontWeight: '600', fontSize: 14 },
});
