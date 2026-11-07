import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Eye, EyeOff, Save } from 'lucide-react-native';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { changePassword } from '../../../services/adminApi';

export default function ChangePasswordScreen({ navigation }) {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (loading) return;
    
    if (!current.trim() || !newPass.trim() || !confirm.trim()) {
      return Alert.alert('Error', 'All fields are required.');
    }
    if (newPass !== confirm) {
      return Alert.alert('Error', 'New password and confirm password do not match.');
    }
    if (current === newPass) {
      return Alert.alert('Error', 'New password must be different from current password.');
    }
    
    setLoading(true);
    const result = await changePassword(current, newPass);
    setLoading(false);
    
    if (result && result.success) {
      Alert.alert('Success', 'Your password has been updated successfully.');
      setCurrent('');
      setNewPass('');
      setConfirm('');
    } else {
      Alert.alert('Error', result?.message || 'Failed to update password.');
    }
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <ParticleBackground />
      
      <ScrollView contentContainerStyle={s.content}>
        
        <View style={s.inputContainer}>
          <Text style={s.label}>Current Password</Text>
          <View style={s.passwordRow}>
            <TextInput 
              style={s.input}
              secureTextEntry={!showCurrent}
              value={current}
              onChangeText={setCurrent}
              placeholderTextColor={C.textSecondary}
              underlineColorAndroid="transparent"
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={s.eyeIcon}>
              {showCurrent ? <EyeOff size={20} color={C.textSecondary || '#aaa'} /> : <Eye size={20} color={C.textSecondary || '#aaa'} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.inputContainer}>
          <Text style={s.label}>New Password</Text>
          <View style={s.passwordRow}>
            <TextInput 
              style={s.input}
              secureTextEntry={!showNew}
              value={newPass}
              onChangeText={setNewPass}
              placeholderTextColor={C.textSecondary}
              underlineColorAndroid="transparent"
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={s.eyeIcon}>
              {showNew ? <EyeOff size={20} color={C.textSecondary || '#aaa'} /> : <Eye size={20} color={C.textSecondary || '#aaa'} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.inputContainer}>
          <Text style={s.label}>Confirm New Password</Text>
          <View style={s.passwordRow}>
            <TextInput 
              style={s.input}
              secureTextEntry={!showConfirm}
              value={confirm}
              onChangeText={setConfirm}
              placeholderTextColor={C.textSecondary}
              underlineColorAndroid="transparent"
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={s.eyeIcon}>
              {showConfirm ? <EyeOff size={20} color={C.textSecondary || '#aaa'} /> : <Eye size={20} color={C.textSecondary || '#aaa'} />}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[s.saveBtn, loading && { opacity: 0.7 }]} 
          onPress={handleUpdatePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Save size={20} color={'#000'} style={s.btnIcon} />
              <Text style={s.saveBtnText}>Update Password</Text>
            </>
          )}
        </TouchableOpacity>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border || '#333' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.white, marginLeft: 16 },
  content: { padding: 20 },
  inputContainer: { marginBottom: 20 },
  label: { color: C.textSecondary || '#aaa', fontSize: 14, marginBottom: 8 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  input: { flex: 1, color: C.white, padding: 16, fontSize: 16, outlineStyle: 'none' },
  eyeIcon: { padding: 16 },
  saveBtn: { backgroundColor: C.gold || '#ffd700', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 8, marginTop: 12 },
  btnIcon: { marginRight: 8 },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: '700' }
});
