import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft, Save, CheckCircle2 } from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';

export default function PersonalInfoScreen({ navigation }) {
  const { user, updateUserProfile } = useContext(AuthContext);
  
  // Initialize with display_name if it exists, otherwise fallback to full_name
  const initialName = user?.display_name || user?.full_name || '';
  const [displayName, setDisplayName] = useState(initialName);
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset messages when user types
  useEffect(() => {
    if (errorMsg) setErrorMsg('');
    if (successMsg) setSuccessMsg('');
  }, [displayName]);

  const handleSave = async () => {
    const trimmedName = displayName.trim();
    
    // Validation
    if (!trimmedName) {
      setErrorMsg('Display name cannot be empty.');
      return;
    }
    if (trimmedName.length < 2) {
      setErrorMsg('Display name must be at least 2 characters long.');
      return;
    }
    
    // Check if changed
    if (trimmedName === initialName) {
      setSuccessMsg('No changes to save.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const result = await updateUserProfile({ display_name: trimmedName });
      
      if (result.success) {
        setSuccessMsg('Display name updated successfully!');
      } else {
        setErrorMsg(result.message || 'Failed to update display name.');
      }
    } catch (error) {
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  // Determine Family Relation based on role/gender if not explicitly stored
  let familyRelation = user.family_relation || 'Member';
  if (!user.family_relation) {
    if (user.role === 'GENTS') familyRelation = 'Father / Husband';
    else if (user.role === 'LADIES') familyRelation = 'Mother / Wife';
    else if (user.role === 'KIDS') familyRelation = 'Child';
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <ParticleBackground />
      
      {/* Centered Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ArrowLeft color={C.white} size={24} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Personal Information</Text>
        <View style={s.placeholder} />
      </View>
      
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        
        {/* Read-only Info Card */}
        <View style={s.infoCard}>
          <Text style={s.label}>Original Name</Text>
          <Text style={s.value}>{user.full_name || 'N/A'}</Text>
          
          <Text style={s.label}>Role</Text>
          <Text style={s.value}>{user.role || 'N/A'}</Text>
          
          <Text style={s.label}>Account Type</Text>
          <Text style={s.value}>{user.account_type || 'Standard'}</Text>
          
          <Text style={s.label}>Family Relation</Text>
          <Text style={s.value}>{familyRelation}</Text>
        </View>

        {/* Editable Display Name Form */}
        <View style={s.formGroup}>
          <Text style={s.formLabel}>Display Name</Text>
          <TextInput 
            style={[s.input, errorMsg ? s.inputError : null]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your display name"
            placeholderTextColor={C.textMuted || '#888'}
            maxLength={30}
            editable={!isSaving}
          />
          {errorMsg ? <Text style={s.errorText}>{errorMsg}</Text> : null}
          {successMsg ? (
            <View style={s.successBox}>
              <CheckCircle2 size={14} color={C.success || '#4ade80'} style={{marginRight: 6}} />
              <Text style={s.successText}>{successMsg}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity 
          style={[s.saveBtn, isSaving && s.saveBtnDisabled]} 
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#000" style={s.btnIcon} />
          ) : (
            <Save size={20} color={'#000'} style={s.btnIcon} />
          )}
          <Text style={s.saveBtnText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg }, // Matching global dark background
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingTop: 16, 
    paddingBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#222' 
  },
  backBtn: { padding: 4 },
  placeholder: { width: 32 }, // Matches back button width to center title perfectly
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: C.white, textAlign: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  infoCard: { 
    backgroundColor: '#111', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#222'
  },
  label: { color: C.textSecondary || '#aaa', fontSize: 12, marginBottom: 4, marginTop: 14 },
  value: { color: C.white, fontSize: 16, fontWeight: 'bold' },
  formGroup: { marginBottom: 24 },
  formLabel: { color: C.textSecondary || '#aaa', fontSize: 13, marginBottom: 8, fontWeight: 'bold' },
  input: { 
    backgroundColor: '#111', 
    color: C.white, 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: '#333',
    outlineStyle: 'none'
  },
  inputError: { borderColor: C.error || '#ef4444' },
  errorText: { color: C.error || '#ef4444', fontSize: 12, marginTop: 8, fontWeight: 'bold' },
  successBox: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  successText: { color: C.success || '#4ade80', fontSize: 12, fontWeight: 'bold' },
  saveBtn: { 
    backgroundColor: C.gold || '#F5A900', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 16, 
    borderRadius: 12,
    elevation: 2
  },
  saveBtnDisabled: { opacity: 0.7 },
  btnIcon: { marginRight: 8 },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' }
});