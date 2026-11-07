
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, FlatList } from 'react-native';
import { C } from '../constants/theme';
import { getKhataContacts, addKhataContact, addKhataEntry } from '../services/personalDataService';

export const handleKhataIntegration = async (userId, khataLinkData, amount, description, sourceId, sourceModule) => {
  if (!khataLinkData || !khataLinkData.enabled || !khataLinkData.contactId) return null;
  
  const entry = {
    amount: parseFloat(amount) || 0,
    type: khataLinkData.type, // 'gave' or 'received'
    remarks: description ? `${sourceModule}: ${description}` : sourceModule,
    sourceId: sourceId
  };
  
  await addKhataEntry(userId, khataLinkData.contactId, entry);
  return khataLinkData.contactId;
};

export default function KhataLinker({ userId, onChange }) {
  const [enabled, setEnabled] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactId, setContactId] = useState(null);
  const [type, setType] = useState('gave'); // 'gave' (You Gave) or 'received' (You Got)
  
  const [newContactName, setNewContactName] = useState('');
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    loadContacts();
  }, [userId]);

  useEffect(() => {
    onChange({ enabled, contactId, type });
  }, [enabled, contactId, type]);

  const loadContacts = async () => {
    const c = await getKhataContacts(userId);
    setContacts(c || []);
  };

  const createContact = async () => {
    if (!newContactName.trim()) return;
    const nc = await addKhataContact(userId, newContactName.trim());
    setContacts([nc, ...contacts]);
    setContactId(nc.id);
    setShowNew(false);
    setNewContactName('');
  };

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.toggleRow} onPress={() => setEnabled(!enabled)}>
        <View style={[s.checkbox, enabled && s.checked]} />
        <Text style={s.label}>Link this to Khata Book</Text>
      </TouchableOpacity>

      {enabled && (
        <View style={s.expanded}>
          <Text style={s.subLabel}>SELECT PARTY</Text>
          {contacts.length > 0 && !showNew ? (
            <View style={s.contactList}>
              {contacts.map(c => (
                <TouchableOpacity key={c.id} style={[s.contactBtn, contactId === c.id && s.contactBtnActive]} onPress={() => setContactId(c.id)}>
                  <Text style={[s.contactText, contactId === c.id && s.contactTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={s.newBtn} onPress={() => setShowNew(true)}>
                <Text style={s.newBtnText}>+ New Party</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.newContactRow}>
              <TextInput style={s.input} value={newContactName} onChangeText={setNewContactName} placeholder="Enter Person/Vendor Name" placeholderTextColor={C.textMuted} underlineColorAndroid="transparent" />
              <TouchableOpacity style={s.addBtn} onPress={createContact}><Text style={s.addBtnText}>Add</Text></TouchableOpacity>
              {contacts.length > 0 && <TouchableOpacity style={s.cancelBtn} onPress={() => setShowNew(false)}><Text style={s.cancelBtnText}>Cancel</Text></TouchableOpacity>}
            </View>
          )}

          <Text style={s.subLabel}>TRANSACTION TYPE</Text>
          <View style={s.typeRow}>
            <TouchableOpacity style={[s.typeBtn, type === 'gave' && s.typeBtnGave]} onPress={() => setType('gave')}>
              <Text style={[s.typeText, type === 'gave' && s.typeTextGave]}>You Gave (Owed to you)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.typeBtn, type === 'received' && s.typeBtnRecv]} onPress={() => setType('received')}>
              <Text style={[s.typeText, type === 'received' && s.typeTextRecv]}>You Got (You owe)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: C.textMuted },
  checked: { backgroundColor: C.gold, borderColor: C.gold },
  label: { color: C.white, fontWeight: '600', fontSize: 14 },
  expanded: { marginTop: 16, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16 },
  subLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5, marginBottom: 8 },
  contactList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  contactBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#222', borderWidth: 1, borderColor: '#333' },
  contactBtnActive: { borderColor: C.gold, backgroundColor: 'rgba(240, 165, 0, 0.1)' },
  contactText: { color: C.textSecondary, fontSize: 13, fontWeight: '600' },
  contactTextActive: { color: C.gold },
  newBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: C.gold, borderStyle: 'dashed' },
  newBtnText: { color: C.gold, fontSize: 13, fontWeight: '600' },
  newContactRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: { flex: 1, backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, height: 40, color: C.white, outlineStyle: 'none' },
  addBtn: { backgroundColor: C.gold, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 8 },
  addBtnText: { color: '#000', fontWeight: '700' },
  cancelBtn: { justifyContent: 'center', paddingHorizontal: 8 },
  cancelBtnText: { color: C.textMuted },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: '#222' },
  typeBtnGave: { borderColor: '#E57373', backgroundColor: 'rgba(229, 115, 115, 0.1)' },
  typeBtnRecv: { borderColor: '#81C784', backgroundColor: 'rgba(129, 199, 132, 0.1)' },
  typeText: { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  typeTextGave: { color: '#E57373' },
  typeTextRecv: { color: '#81C784' }
});
