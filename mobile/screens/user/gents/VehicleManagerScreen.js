import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import KhataLinker, { handleKhataIntegration } from '../../../components/KhataLinker';
import { isValidDate, toStorageDate, toDisplayDate, formatDateInput } from '../../../utils/dateFormatter';
import { getVehicles, addVehicle, updateVehicle, deleteVehicle } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import ParticleBackground from '../../../components/ParticleBackground';
import { C } from '../../../constants/theme';
import { Car, Bike, Plus, ChevronLeft, Trash2, Edit3, Navigation, Disc, Zap, FileText } from 'lucide-react-native';

const VEHICLE_TYPES = ['Bike', 'Scooter', 'Car', 'Other'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric'];

export default function VehicleManagerScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id || user?.id;
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [type, setType] = useState('Car');
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [fuel, setFuel] = useState('Petrol');
  const [odometer, setOdometer] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [khataData, setKhataData] = useState({ enabled: false, contactId: null, description: '' });
  
  // Delete Modal State
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    setVehicles(await getVehicles(userId) || []);
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingId(null);
    setType('Car');
    setName('');
    setNumber('');
    setBrand('');
    setModel('');
    setPurchaseDate('');
    setPurchasePrice('');
    setFuel('Petrol');
    setOdometer('');
    setNotes('');
    setKhataData({ enabled: false, contactId: null, description: '' });
    setModalVisible(true);
  };

  const openEditModal = (v) => {
    setEditingId(v.id);
    setType(v.type || 'Car');
    setName(v.name || '');
    setNumber(v.number || '');
    setBrand(v.brand || '');
    setModel(v.model || '');
    setPurchaseDate(toDisplayDate(v.purchaseDate));
    setPurchasePrice(v.purchasePrice ? String(v.purchasePrice) : '');
    setFuel(v.fuel || 'Petrol');
    setOdometer(v.odometer ? String(v.odometer) : '');
    setNotes(v.notes || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return alertMsg('Vehicle name is required.');
    if (!number.trim()) return alertMsg('Vehicle number is required.');
    
    // basic number validation
    if (number.trim().length < 4) return alertMsg('Please enter a valid vehicle number.');
    
    if (odometer && (isNaN(odometer) || parseFloat(odometer) < 0)) {
      return alertMsg('Please enter a valid odometer reading.');
    }

    if (purchaseDate && !isValidDate(purchaseDate)) return alertMsg('Please enter a valid date (DD/MM/YYYY).');
    const payload = { 
      type, name: name.trim(), number: number.trim(), 
      brand: brand.trim(), model: model.trim(), 
      purchaseDate: toStorageDate(purchaseDate), fuel, 
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0,
      odometer: odometer ? parseFloat(odometer) : 0, 
      notes: notes.trim() 
    };
    
    if (editingId) {
      await updateVehicle(userId, editingId, payload);
    } else {
      const saved = await addVehicle(userId, payload);
      const amt = parseFloat(purchasePrice) || 0;
      if (khataData?.enabled && amt > 0) { await handleKhataIntegration(userId, khataData, amt, `${brand} ${model}`, saved.id, 'Vehicle Manager'); }
    }
    
    setModalVisible(false);
    load();
  };
  
  const alertMsg = (msg) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Validation', msg);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteVehicle(userId, deleteId);
    setDeleteId(null);
    load();
  };

  const getIcon = (vType) => {
    if (vType === 'Bike' || vType === 'Scooter') return <Bike size={24} color={C.gold} />;
    return <Car size={24} color={C.gold} />;
  };

  const renderItem = ({ item }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.iconBox}>{getIcon(item.type)}</View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.cardTitle}>{item.name}</Text>
          <Text style={s.vNumber}>{item.number}</Text>
        </View>
      </View>
      
      <View style={s.cardBody}>
        {item.brand || item.model ? <Text style={s.detailText}><Navigation size={12} color={C.textMuted}/> {item.brand} {item.brand && item.model ? '•' : ''} {item.model}</Text> : null}
        <Text style={s.detailText}><Zap size={12} color={C.textMuted}/> Fuel: {item.fuel}</Text>
        <Text style={s.detailText}><Disc size={12} color={C.textMuted}/> Odometer: {item.odometer.toLocaleString('en-IN')} km</Text>
        {item.purchaseDate ? <Text style={s.detailText}><FileText size={12} color={C.textMuted}/> Purchased: {toDisplayDate(item.purchaseDate)}</Text> : null}
        {item.notes ? <Text style={[s.detailText, { marginTop: 4, color: C.textSecondary }]} numberOfLines={2}>Notes: {item.notes}</Text> : null}
      </View>
      
      <View style={s.cardActions}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={s.actionBtn}>
          <Edit3 size={14} color={C.gold} />
          <Text style={s.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDeleteId(item.id)} style={[s.actionBtn, { borderColor: C.error + '55', backgroundColor: C.error + '11' }]}>
          <Trash2 size={14} color={C.error} />
          <Text style={[s.actionText, { color: C.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ChevronLeft size={24} color={C.gold} />
          <Text style={{ color: C.gold, fontSize: 16 }}>Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Vehicle Manager</Text>
        <TouchableOpacity style={s.addBtnTop} onPress={openAddModal}>
          <Text style={s.addBtnTextTop}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        renderItem={renderItem}
        ListHeaderComponent={vehicles.length > 0 ? <Text style={s.sectionTitle}>Your Vehicles</Text> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <Car size={48} color={C.textMuted} />
              <Text style={s.emptyText}>No vehicles added yet</Text>
              <Text style={s.emptySub}>Tap "+ Add" to add your first vehicle.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={<SecurityFooter style={{ marginTop: 24 }} />}
      />

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', maxHeight: '92%' }}>
            <View style={s.modal}>
              <View style={s.modalDrag} />
              <Text style={s.modalTitle}>{editingId ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={s.label}>VEHICLE TYPE</Text>
                <View style={s.gridRow}>
                  {VEHICLE_TYPES.map(t => (
                    <TouchableOpacity key={t} style={[s.gridBtn, type === t && s.gridBtnActive]} onPress={() => setType(t)}>
                      <Text style={[s.gridBtnText, type === t && s.gridBtnTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.label}>VEHICLE NAME / NICKNAME *</Text>
                <TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g. My Bike" placeholderTextColor={C.textMuted} />
                
                <Text style={s.label}>VEHICLE NUMBER *</Text>
                <TextInput style={s.input} value={number} onChangeText={setNumber} placeholder="e.g. UP16AB1234" placeholderTextColor={C.textMuted} autoCapitalize="characters" />
                
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>BRAND</Text>
                    <TextInput style={s.input} value={brand} onChangeText={setBrand} placeholder="e.g. Honda" placeholderTextColor={C.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>MODEL</Text>
                    <TextInput style={s.input} value={model} onChangeText={setModel} placeholder="e.g. Activa" placeholderTextColor={C.textMuted} />
                  </View>
                </View>

                <Text style={s.label}>FUEL TYPE</Text>
                <View style={s.gridRow}>
                  {FUEL_TYPES.map(f => (
                    <TouchableOpacity key={f} style={[s.gridBtn, fuel === f && s.gridBtnActive]} onPress={() => setFuel(f)}>
                      <Text style={[s.gridBtnText, fuel === f && s.gridBtnTextActive]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>ODOMETER (KM)</Text>
                    <TextInput style={s.input} value={odometer} onChangeText={setOdometer} placeholder="e.g. 15000" keyboardType="numeric" placeholderTextColor={C.textMuted} />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>PURCHASE DATE</Text>
                    <TextInput style={s.input} value={purchaseDate} onChangeText={(t) => setPurchaseDate(formatDateInput(t))} placeholder="DD/MM/YYYY" placeholderTextColor={C.textMuted} keyboardType="numeric" maxLength={10} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>PURCHASE PRICE</Text>
                    <TextInput style={s.input} value={purchasePrice} onChangeText={setPurchasePrice} placeholder="₹ Amount" keyboardType="numeric" placeholderTextColor={C.textMuted} />
                  </View>
                </View>

                <Text style={s.label}>NOTES (OPTIONAL)</Text>
                <TextInput style={[s.input, { height: 70, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Any specific details..." placeholderTextColor={C.textMuted} multiline />
                
                {!editingId && <View style={{marginTop: 16}}><KhataLinker userId={userId} onChange={setKhataData} /></View>}
                <View style={s.modalBtns}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={s.saveBtn} onPress={handleSave}><Text style={s.saveText}>Save Vehicle</Text></TouchableOpacity>
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteId} animationType="fade" transparent>
        <View style={s.alertOverlay}>
          <View style={s.alertBox}>
            <Text style={s.alertTitle}>Delete this vehicle?</Text>
            <Text style={s.alertMessage}>This vehicle and its related information will be permanently removed.</Text>
            <View style={s.alertBtns}>
              <TouchableOpacity style={s.alertCancel} onPress={() => setDeleteId(null)}>
                <Text style={s.alertCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.alertDelete} onPress={confirmDelete}>
                <Text style={s.alertDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { padding: 4, marginRight: 8, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: C.white, textAlign: 'center' },
  addBtnTop: { backgroundColor: C.gold, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  addBtnTextTop: { color: '#000', fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 13, color: C.textMuted, fontWeight: '700', letterSpacing: 2, marginBottom: 12, marginTop: 4, textTransform: 'uppercase' },
  list: { padding: 16, paddingBottom: 100 },
  
  card: { backgroundColor: C.card, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(240, 165, 0, 0.1)', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.white, marginBottom: 2 },
  vNumber: { fontSize: 13, color: C.gold, fontWeight: '600', letterSpacing: 1 },
  
  cardBody: { padding: 16, gap: 6 },
  detailText: { fontSize: 13, color: '#DDD' },
  
  cardActions: { flexDirection: 'row', padding: 12, paddingTop: 0, gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, gap: 6 },
  actionText: { color: C.gold, fontSize: 13, fontWeight: '600' },
  
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '800', color: C.white },
  emptySub: { fontSize: 14, color: C.textMuted },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '100%' },
  modalDrag: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 8 },
  
  label: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, fontSize: 15, color: C.white, outlineStyle: 'none' },
  
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.03)' },
  gridBtnActive: { borderColor: C.gold, backgroundColor: 'rgba(240, 165, 0, 0.1)' },
  gridBtnText: { color: C.textSecondary, fontWeight: '600', fontSize: 13 },
  gridBtnTextActive: { color: C.gold },
  
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 28 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  cancelText: { color: C.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: C.gold, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#000', fontWeight: '800', fontSize: 15 },
  
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertBox: { backgroundColor: C.card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 340, borderWidth: 1, borderColor: C.border },
  alertTitle: { color: C.white, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  alertMessage: { color: C.textSecondary, fontSize: 14, marginBottom: 24, lineHeight: 20 },
  alertBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  alertCancel: { paddingHorizontal: 16, paddingVertical: 10 },
  alertCancelText: { color: C.textMuted, fontWeight: '600', fontSize: 14 },
  alertDelete: { backgroundColor: C.error, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  alertDeleteText: { color: C.white, fontWeight: '700', fontSize: 14 }
});
