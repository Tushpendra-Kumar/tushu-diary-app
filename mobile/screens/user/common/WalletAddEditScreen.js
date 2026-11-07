import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { C } from '../../../constants/theme';
import { ChevronLeft, Save } from 'lucide-react-native';
import { AuthContext } from '../../../context/AuthContext';
import ParticleBackground from '../../../components/ParticleBackground';
import { saveWalletRecord, updateWalletRecord } from '../../../services/personalDataService';


const InputField = ({ label, keyName, keyboardType = 'default', placeholder = '', formData, handleChange }) => (
  <View style={s.inputGroup}>
    <Text style={s.label}>{label}</Text>
    <TextInput
      style={s.input}
      value={formData[keyName] !== undefined ? String(formData[keyName]) : ''}
      onChangeText={(val) => handleChange(keyName, val)}
      keyboardType={keyboardType}
      placeholder={placeholder}
      placeholderTextColor={C.textMuted}
      outlineStyle="none"
    />
  </View>
);

export default function WalletAddEditScreen({ route, navigation }) {
  const { category, title, record } = route.params;
  const { user } = useContext(AuthContext);
  const isEditing = !!record;

  const [formData, setFormData] = useState(record || { date: new Date().toISOString() });
  const [error, setError] = useState('');

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleSave = async () => {
    try {
      // Validations
      if (category === 'cash') {
        if (!formData.amount || isNaN(formData.amount)) return setError('Valid Amount is required');
        if (!formData.title) return setError('Title is required');
      } else if (category === 'banks') {
        if (!formData.bank_name) return setError('Bank Name is required');
        if (!formData.balance || isNaN(formData.balance)) return setError('Valid Balance is required');
      } else if (category === 'cards') {
        if (!formData.provider) return setError('Provider is required');
      } else if (category === 'investments') {
        if (!formData.name) return setError('Investment Name is required');
        if (!formData.amount || isNaN(formData.amount)) return setError('Valid Invested Amount is required');
        if (!formData.current_value || isNaN(formData.current_value)) return setError('Valid Current Value is required');
      } else if (category === 'money_given' || category === 'money_owed') {
        if (!formData.person) return setError('Person Name is required');
        if (!formData.amount || isNaN(formData.amount)) return setError('Valid Amount is required');
      } else if (category === 'loans') {
        if (!formData.name) return setError('Loan Name is required');
        if (!formData.total_amount || isNaN(formData.total_amount)) return setError('Valid Total Amount is required');
        if (!formData.remaining_amount || isNaN(formData.remaining_amount)) return setError('Valid Remaining Amount is required');
      } else if (category === 'financial_notes') {
        if (!formData.title) return setError('Title is required');
      }

      if (isEditing) {
        await updateWalletRecord(user.user_id, category, record.id, formData);
      } else {
        await saveWalletRecord(user.user_id, category, formData);
      }
      navigation.goBack();
    } catch (e) {
      setError('Failed to save record.');
    }
  };

  

  const renderForm = () => {
    switch (category) {
      case 'cash':
        return (
          <>
            <InputField label="Amount (₹)" keyName="amount" keyboardType="numeric"  formData={formData} handleChange={handleChange} />
            <InputField label="Title / Name" keyName="title"  formData={formData} handleChange={handleChange} />
            <InputField label="Account Type (e.g., Safe, Drawer)" keyName="account_type"  formData={formData} handleChange={handleChange} />
            <InputField label="Note" keyName="note"  formData={formData} handleChange={handleChange} />
          </>
        );
      case 'banks':
        return (
          <>
            <InputField label="Bank Name" keyName="bank_name"  formData={formData} handleChange={handleChange} />
            <InputField label="Nickname" keyName="nickname"  formData={formData} handleChange={handleChange} />
            <InputField label="Account Type (Saving, Current)" keyName="account_type"  formData={formData} handleChange={handleChange} />
            <InputField label="Last 4 Digits (Optional)" keyName="last_4" keyboardType="numeric"  formData={formData} handleChange={handleChange} />
            <InputField label="Current Balance (₹)" keyName="balance" keyboardType="numeric"  formData={formData} handleChange={handleChange} />
            <InputField label="Note" keyName="note"  formData={formData} handleChange={handleChange} />
          </>
        );
      case 'cards':
        return (
          <>
            <InputField label="Provider / Bank" keyName="provider"  formData={formData} handleChange={handleChange} />
            <InputField label="Card Nickname" keyName="nickname"  formData={formData} handleChange={handleChange} />
            <InputField label="Card Type (Credit, Debit)" keyName="card_type"  formData={formData} handleChange={handleChange} />
            <InputField label="Last 4 Digits" keyName="last_4" keyboardType="numeric"  formData={formData} handleChange={handleChange} />
            <InputField label="Limit / Balance (₹)" keyName="limit" keyboardType="numeric"  formData={formData} handleChange={handleChange} />
            <InputField label="Note" keyName="note"  formData={formData} handleChange={handleChange} />
          </>
        );
      case 'investments':
        return (
          <>
            <InputField label="Investment Name" keyName="name"  formData={formData} handleChange={handleChange} />
            <InputField label="Institution" keyName="institution"  formData={formData} handleChange={handleChange} />
            <InputField label="Invested Amount (₹)" keyName="amount" keyboardType="numeric"  formData={formData} handleChange={handleChange} />
            <InputField label="Current Estimated Value (₹)" keyName="current_value" keyboardType="numeric"  formData={formData} handleChange={handleChange} />
            <InputField label="Note" keyName="note"  formData={formData} handleChange={handleChange} />
          </>
        );
      case 'money_given':
      case 'money_owed':
        return (
          <>
            <InputField label="Person Name" keyName="person"  formData={formData} handleChange={handleChange} />
            <InputField label="Amount (₹)" keyName="amount" keyboardType="numeric"  formData={formData} handleChange={handleChange} />
            <InputField label="Purpose" keyName="purpose"  formData={formData} handleChange={handleChange} />
            <InputField label="Status (Pending / Received)" keyName="status" placeholder="e.g. Pending"  formData={formData} handleChange={handleChange} />
            <InputField label="Note" keyName="note"  formData={formData} handleChange={handleChange} />
          </>
        );
      case 'loans':
        return (
          <>
            <InputField label="Loan / Debt Name" keyName="name"  formData={formData} handleChange={handleChange} />
            <InputField label="Lender / Borrower" keyName="lender"  formData={formData} handleChange={handleChange} />
            <InputField label="Total Amount (₹)" keyName="total_amount" keyboardType="numeric"  formData={formData} handleChange={handleChange} />
            <InputField label="Remaining Amount (₹)" keyName="remaining_amount" keyboardType="numeric"  formData={formData} handleChange={handleChange} />
            <InputField label="Monthly Payment (₹) Optional" keyName="monthly_payment" keyboardType="numeric"  formData={formData} handleChange={handleChange} />
            <InputField label="Due Date" keyName="due_date" placeholder="DD-MM-YYYY"  formData={formData} handleChange={handleChange} />
            <InputField label="Note" keyName="note"  formData={formData} handleChange={handleChange} />
          </>
        );
      case 'financial_notes':
        return (
          <>
            <InputField label="Title" keyName="title"  formData={formData} handleChange={handleChange} />
            <View style={s.inputGroup}>
              <Text style={s.label}>Note Content</Text>
              <TextInput
                style={[s.input, { height: 120, textAlignVertical: 'top' }]}
                value={formData.content || ''}
                onChangeText={(val) => handleChange('content', val)}
                multiline
                placeholderTextColor={C.textMuted}
                outlineStyle="none"
              />
            </View>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={C.white} size={28} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{isEditing ? 'Edit' : 'Add'} {title}</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {error ? <Text style={s.error}>{error}</Text> : null}
        
        <View style={s.formContainer}>
          {renderForm()}
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
          <Save color={C.white} size={20} />
          <Text style={s.saveBtnText}>Save Record</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: 'rgba(5,5,5,0.9)'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.white },
  backBtn: { padding: 4 },
  
  scroll: { padding: 16, paddingBottom: 40 },
  
  error: { color: '#F44336', marginBottom: 16, textAlign: 'center', fontWeight: '600' },
  
  formContainer: { backgroundColor: C.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(5,5,5,0.5)',
    borderWidth: 1, borderColor: C.border,
    borderRadius: 10, padding: 14,
    color: C.white, fontSize: 15
  },
  
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.gold, padding: 16, borderRadius: 12, marginTop: 24
  },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 16, marginLeft: 8 }
});
