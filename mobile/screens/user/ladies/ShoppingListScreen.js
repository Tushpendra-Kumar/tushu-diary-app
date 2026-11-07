import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { getShoppingLists, addShoppingList, deleteShoppingList, addShoppingItem, toggleShoppingItem, deleteShoppingItem, updateShoppingItem } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import ParticleBackground from '../../../components/ParticleBackground';
import { C } from '../../../constants/theme';
import { ShoppingCart, Shirt, Home, Sparkles, Activity, Smartphone, Briefcase, Baby, Car, Gift, PawPrint, Wrench, Package, Search, Plus, Trash2, ArrowLeft, CheckCircle, Circle, Edit2, ChevronRight, X } from 'lucide-react-native';

const CATEGORIES = [
  { id: 'Grocery', name: 'Grocery & Food', icon: ShoppingCart, desc: 'Fruits, veggies, daily needs' },
  { id: 'Clothing', name: 'Clothing & Fashion', icon: Shirt, desc: 'Men, women, kids apparel' },
  { id: 'Household', name: 'Home & Household', icon: Home, desc: 'Decor, cleaning, furniture' },
  { id: 'Personal', name: 'Personal Care', icon: Sparkles, desc: 'Skincare, haircare, bath' },
  { id: 'Health', name: 'Health & Wellness', icon: Activity, desc: 'Fitness, supplements' },
  { id: 'Electronics', name: 'Electronics', icon: Smartphone, desc: 'Gadgets, accessories' },
  { id: 'Office', name: 'Office & Study', icon: Briefcase, desc: 'Stationery, books' },
  { id: 'Kids', name: 'Kids & Baby', icon: Baby, desc: 'Toys, care, school' },
  { id: 'Vehicle', name: 'Vehicle & Travel', icon: Car, desc: 'Car/bike, travel items' },
  { id: 'Gifts', name: 'Gifts & Occasions', icon: Gift, desc: 'Birthdays, festivals' },
  { id: 'Pets', name: 'Pets', icon: PawPrint, desc: 'Pet food, toys, grooming' },
  { id: 'Tools', name: 'Tools & Hardware', icon: Wrench, desc: 'DIY, repairs, hardware' },
  { id: 'Other', name: 'Other', icon: Package, desc: 'Custom shopping needs' }
];

const UNITS = ['pcs', 'kg', 'g', 'litre', 'ml', 'pack', 'box', 'bottle', 'dozen', 'pair', 'set', 'other'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const PRIORITY_COLORS = { 'Low': '#66BB6A', 'Medium': '#FFA726', 'High': '#EF5350' };

export default function ShoppingListScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user_id;
  
  const [lists, setLists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  const [selectedList, setSelectedList] = useState(null);
  
  // List Creation Flow
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [listName, setListName] = useState('');
  
  // Item Creation/Edit Flow
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemUnit, setItemUnit] = useState('pcs');
  const [itemNotes, setItemNotes] = useState('');
  const [itemPriority, setItemPriority] = useState('Medium');

  // Delete State
  const [deleteData, setDeleteData] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const data = await getShoppingLists(userId);
    setLists(data);
    if (selectedList) {
      const updated = data.find(l => l.id === selectedList.id);
      setSelectedList(updated || null);
    }
  };

  const startCreateList = () => {
    setSelectedCat(null);
    setListName('');
    setCatModalVisible(true);
  };

  const handleSelectCategory = (cat) => {
    setSelectedCat(cat);
    setCatModalVisible(false);
    setTimeout(() => setNameModalVisible(true), 150); // slight delay for smooth transition
  };

  const handleCreateList = async () => {
    if (!listName.trim()) return Alert.alert('Error', 'List name is required');
    await addShoppingList(userId, { name: listName.trim(), category: selectedCat.name });
    setNameModalVisible(false);
    load();
  };

  const getCategoryIcon = (catName) => {
    const cat = CATEGORIES.find(c => c.name === catName);
    return cat ? cat.icon : Package;
  };

  const confirmDelete = async () => {
    if (deleteData.type === 'list') {
      await deleteShoppingList(userId, deleteData.id);
    } else {
      await deleteShoppingItem(userId, deleteData.listId, deleteData.id);
    }
    setDeleteData(null);
    load();
  };

  const openAddItem = () => {
    setEditingItem(null);
    setItemName(''); setItemQty(''); setItemUnit('pcs'); setItemNotes(''); setItemPriority('Medium');
    setItemModalVisible(true);
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setItemName(item.text || ''); 
    setItemQty(item.quantity || ''); 
    setItemUnit(item.unit || 'pcs'); 
    setItemNotes(item.notes || ''); 
    setItemPriority(item.priority || 'Medium');
    setItemModalVisible(true);
  };

  const handleSaveItem = async () => {
    if (!itemName.trim()) return Alert.alert('Error', 'Item name is required');
    
    const itemData = {
      name: itemName.trim(),
      quantity: itemQty.trim(),
      unit: itemUnit,
      notes: itemNotes.trim(),
      priority: itemPriority
    };

    if (editingItem) {
      await updateShoppingItem(userId, selectedList.id, editingItem.id, itemData);
    } else {
      await addShoppingItem(userId, selectedList.id, itemData);
    }
    
    setItemModalVisible(false);
    load();
  };

  const handleDeleteRequest = (type, id, name, listId = null) => {
    let cleanName = typeof name === 'object' ? name.name : name;
    setDeleteData({ type, id, name: cleanName, listId });
  };

  const filteredLists = lists.filter(l => {
    const matchesSearch = typeof l.name === 'string' ? l.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    const matchesFilter = activeFilter === 'All' || l.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const availableFilters = ['All', ...new Set(lists.map(l => l.category || 'Other'))];

  // ===================== INDIVIDUAL LIST ITEMS VIEW =====================
  if (selectedList) {
    const items = selectedList.items || [];
    const done = items.filter(i => i.purchased).length;
    const total = items.length;
    
    const ListIcon = getCategoryIcon(selectedList.category);

    return (
      <SafeAreaView style={s.safe}>
        <ParticleBackground />
        
        <View style={s.subHeader}>
          <TouchableOpacity onPress={() => setSelectedList(null)} style={s.subBackBtn}>
            <ArrowLeft size={18} color={C.gold} />
            <Text style={s.subBackText}>All Lists</Text>
          </TouchableOpacity>
        </View>

        <View style={s.listHeaderInfo}>
          <View style={s.listHeaderIconWrap}>
            <ListIcon size={28} color={C.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.listHeaderTitle} numberOfLines={1}>{typeof selectedList.name === 'object' ? selectedList.name.name : selectedList.name}</Text>
            <Text style={s.listHeaderSub}>{selectedList.category || 'Uncategorized'}</Text>
          </View>
        </View>

        <View style={s.progressContainer}>
          <View style={s.progressRow}>
            <Text style={s.progressText}>{done} of {total} items purchased</Text>
            {total > 0 && <Text style={s.progressPercent}>{Math.round((done/total)*100)}%</Text>}
          </View>
          <View style={s.progressBarBg}>
            <View style={[s.progressBarFill, { width: total > 0 ? `${(done/total)*100}%` : '0%' }]} />
          </View>
        </View>

        <FlatList
          data={items} 
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <View style={[s.itemCard, item.purchased && s.itemCardCompleted]}>
              <TouchableOpacity onPress={() => { toggleShoppingItem(userId, selectedList.id, item.id).then(load); }} style={s.checkbox}>
                {item.purchased ? <CheckCircle size={24} color={C.success} /> : <Circle size={24} color={C.textMuted} />}
              </TouchableOpacity>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={[s.itemName, item.purchased && s.strikethrough]}>{item.text}</Text>
                
                <View style={s.itemMetaRow}>
                  {item.quantity ? <Text style={[s.itemMeta, item.purchased && s.strikethrough]}>{item.quantity} {item.unit}</Text> : null}
                  {item.priority && item.priority !== 'Medium' && (
                    <View style={[s.priorityBadge, { backgroundColor: PRIORITY_COLORS[item.priority] + '20' }]}>
                      <Text style={[s.priorityText, { color: PRIORITY_COLORS[item.priority] }]}>{item.priority.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                
                {item.notes ? <Text style={[s.itemNotes, item.purchased && s.strikethrough]}>{item.notes}</Text> : null}
              </View>
              <View style={s.itemActions}>
                <TouchableOpacity onPress={() => openEditItem(item)} style={s.actionBtn}>
                  <Edit2 size={16} color={item.purchased ? C.textMuted : C.gold} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteRequest('item', item.id, item.text, selectedList.id)} style={s.actionBtn}>
                  <Trash2 size={16} color={C.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <ShoppingCart size={48} color={C.textMuted} style={{ marginBottom: 12 }} />
              <Text style={s.emptyText}>List is empty</Text>
              <Text style={s.emptySub}>Tap + to add items</Text>
            </View>
          }
          ListFooterComponent={<SecurityFooter style={{ marginTop: 24 }} />}
        />

        <TouchableOpacity style={s.fab} onPress={openAddItem}>
          <Plus size={24} color="#000" />
        </TouchableOpacity>

        {/* Delete Confirmation Modal */}
        <Modal visible={!!deleteData} animationType="fade" transparent>
          <View style={s.overlayCenter}>
            <View style={s.alertBox}>
              <Text style={s.modalTitle}>{deleteData?.type === 'list' ? 'Delete List' : 'Delete Item'}</Text>
              <Text style={{ fontSize: 14, color: C.textSecondary, marginBottom: 20, lineHeight: 22 }}>
                Are you sure you want to delete "{deleteData?.name}"?
              </Text>
              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setDeleteData(null)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[s.saveBtn, { backgroundColor: C.error }]} onPress={confirmDelete}><Text style={[s.saveText, { color: '#FFF' }]}>Delete</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add/Edit Item Modal */}
        <Modal visible={itemModalVisible} animationType="slide" transparent>
          <View style={s.overlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
              <View style={s.modal}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={s.modalTitle}>{editingItem ? 'Edit Item' : 'Add Item'}</Text>
                  <TouchableOpacity onPress={() => setItemModalVisible(false)}><X size={24} color={C.textMuted}/></TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={s.label}>ITEM NAME *</Text>
                  <TextInput style={s.input} value={itemName} onChangeText={setItemName} placeholder="e.g. Basmati Rice" placeholderTextColor={C.textMuted} />
                  
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.label}>QUANTITY</Text>
                      <TextInput style={s.input} value={itemQty} onChangeText={setItemQty} placeholder="e.g. 5" placeholderTextColor={C.textMuted} keyboardType="numeric" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.label}>UNIT</Text>
                      <View style={[s.input, { padding: 0 }]}>
                        {/* Native select simulation for simplicity or horizontal scroll for units */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, alignItems: 'center' }}>
                          {UNITS.map(u => (
                            <TouchableOpacity key={u} style={[s.unitChip, itemUnit === u && s.unitChipActive]} onPress={() => setItemUnit(u)}>
                              <Text style={[s.unitText, itemUnit === u && s.unitTextActive]}>{u}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  </View>

                  <Text style={s.label}>PRIORITY</Text>
                  <View style={s.priorityRow}>
                    {PRIORITIES.map(p => (
                      <TouchableOpacity key={p} style={[s.priorityBtn, itemPriority === p && { backgroundColor: PRIORITY_COLORS[p] + '30', borderColor: PRIORITY_COLORS[p] }]} onPress={() => setItemPriority(p)}>
                        <Text style={[s.priorityBtnText, itemPriority === p && { color: PRIORITY_COLORS[p] }]}>{p.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={s.label}>NOTES (OPTIONAL)</Text>
                  <TextInput style={[s.input, { minHeight: 70, textAlignVertical: 'top' }]} value={itemNotes} onChangeText={setItemNotes} multiline placeholder="Any specific brand or detail..." placeholderTextColor={C.textMuted} />

                  <TouchableOpacity style={[s.saveBtn, { marginTop: 24 }]} onPress={handleSaveItem}>
                    <Text style={s.saveText}>{editingItem ? 'Update Item' : 'Add Item'}</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

      </SafeAreaView>
    );
  }

  // ===================== MAIN LISTS VIEW =====================
  return (
    <SafeAreaView style={s.safe}>
      <ParticleBackground />

      <View style={s.searchContainer}>
        <View style={s.searchBar}>
          <Search size={20} color={C.textMuted} />
          <TextInput style={s.searchInput} placeholder="Search lists..." placeholderTextColor={C.textMuted} value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
          {availableFilters.map(f => (
            <TouchableOpacity key={f} style={[s.filterTab, activeFilter === f && s.filterTabActive]} onPress={() => setActiveFilter(f)}>
              <Text style={[s.filterText, activeFilter === f && s.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredLists} 
        keyExtractor={l => l.id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => {
          const done = (item.items || []).filter(i => i.purchased).length;
          const total = (item.items || []).length;
          const ListIcon = getCategoryIcon(item.category);
          
          return (
            <TouchableOpacity style={s.listCardMain} onPress={() => setSelectedList(item)} activeOpacity={0.8}>
              <View style={s.listIconMain}>
                <ListIcon size={24} color={C.gold} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={s.listNameMain}>{typeof item.name === 'object' ? item.name.name : item.name}</Text>
                <Text style={s.listCategoryText}>{item.category || 'Uncategorized'}</Text>
                <View style={s.listMiniProgress}>
                  <Text style={s.listMetaMain}>{done}/{total} items completed</Text>
                  <View style={s.miniBarBg}>
                    <View style={[s.miniBarFill, { width: total > 0 ? `${(done/total)*100}%` : '0%' }]} />
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDeleteRequest('list', item.id, item.name)} style={s.actionBtn}>
                <Trash2 size={18} color={C.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={s.emptyMain}>
            <ShoppingCart size={64} color={C.gold} style={{ marginBottom: 16, opacity: 0.9 }} />
            <Text style={s.emptyTextMain}>No shopping lists yet</Text>
            <Text style={s.emptySubMain}>Create your first shopping list to get started.</Text>
          </View>
        }
        ListFooterComponent={<SecurityFooter style={{ marginTop: 24 }} />}
      />

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteData} animationType="fade" transparent>
        <View style={s.overlayCenter}>
          <View style={s.alertBox}>
            <Text style={s.modalTitle}>{deleteData?.type === 'list' ? 'Delete List' : 'Delete Item'}</Text>
            <Text style={{ fontSize: 14, color: C.textSecondary, marginBottom: 20, lineHeight: 22 }}>
              Are you sure you want to delete "{deleteData?.name}"?
            </Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setDeleteData(null)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: C.error }]} onPress={confirmDelete}><Text style={[s.saveText, { color: '#FFF' }]}>Delete</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CATEGORY SELECTION MODAL */}
      <Modal visible={catModalVisible} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={[s.modal, { height: '85%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={s.modalTitle}>Create Shopping List</Text>
              <TouchableOpacity onPress={() => setCatModalVisible(false)}><X size={24} color={C.textMuted}/></TouchableOpacity>
            </View>
            <Text style={s.modalSub}>What are you shopping for?</Text>
            
            <FlatList
              data={CATEGORIES}
              keyExtractor={c => c.id}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={{ gap: 12 }}
              contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
              renderItem={({ item }) => {
                const IconComp = item.icon;
                return (
                  <TouchableOpacity style={s.catCard} onPress={() => handleSelectCategory(item)}>
                    <View style={s.catIconWrap}><IconComp size={24} color={C.gold} /></View>
                    <Text style={s.catName}>{item.name}</Text>
                    <Text style={s.catDesc} numberOfLines={2}>{item.desc}</Text>
                  </TouchableOpacity>
                )
              }}
            />
          </View>
        </View>
      </Modal>

      {/* NAME INPUT MODAL */}
      <Modal visible={nameModalVisible} animationType="fade" transparent>
        <View style={s.overlayCenter}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <View style={s.alertBox}>
              <Text style={s.modalTitle}>Name Your List</Text>
              <View style={s.selectedCatBadge}>
                {selectedCat && <selectedCat.icon size={16} color={C.gold} />}
                <Text style={s.selectedCatText}>{selectedCat?.name}</Text>
              </View>
              <TextInput style={[s.input, { marginTop: 16 }]} value={listName} onChangeText={setListName} placeholder="e.g. Monthly Grocery, Winter Clothes" placeholderTextColor={C.textMuted} autoFocus />
              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setNameModalVisible(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleCreateList}><Text style={s.saveText}>Create List</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <TouchableOpacity style={s.fab} onPress={startCreateList}>
        <Plus size={24} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  // Common
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: C.gold, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8, boxShadow: '0px 4px 15px rgba(240, 165, 0, 0.4)' },
  list: { padding: 16, paddingBottom: 100 },
  actionBtn: { padding: 8 },
  label: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, fontSize: 15, color: C.white, outlineStyle: 'none', height: 50, justifyContent: 'center' },
  
  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'flex-end' },
  overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  alertBox: { backgroundColor: '#111', width: '100%', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.white },
  modalSub: { fontSize: 14, color: C.textMuted, marginBottom: 12 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  cancelText: { color: C.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: C.gold, padding: 15, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#000', fontWeight: '800', fontSize: 15 },
  
  // Main View
  searchContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, height: 46 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: C.white, outlineStyle: 'none' },
  filters: { paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.border },
  filterTabActive: { backgroundColor: C.goldDim, borderColor: C.border },
  filterText: { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  filterTextActive: { color: C.gold },
  listCardMain: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  listIconMain: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(240, 165, 0, 0.1)', justifyContent: 'center', alignItems: 'center' },
  listNameMain: { fontSize: 17, fontWeight: '700', color: C.white },
  listCategoryText: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  listMiniProgress: { marginTop: 8 },
  listMetaMain: { fontSize: 11, color: C.textSecondary, marginBottom: 4 },
  miniBarBg: { height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  miniBarFill: { height: '100%', backgroundColor: C.gold },
  emptyMain: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyTextMain: { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 8, textAlign: 'center' },
  emptySubMain: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 20 },

  // Category Selection
  catCard: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center', textAlign: 'center' },
  catIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(240, 165, 0, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  catName: { fontSize: 14, fontWeight: '700', color: C.white, marginBottom: 4, textAlign: 'center' },
  catDesc: { fontSize: 11, color: C.textMuted, textAlign: 'center', lineHeight: 16 },
  selectedCatBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(240, 165, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6, marginTop: 12 },
  selectedCatText: { color: C.gold, fontSize: 12, fontWeight: '600' },

  // Items View
  subHeader: { paddingHorizontal: 16, paddingTop: 16 },
  subBackBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 6, alignSelf: 'flex-start' },
  subBackText: { color: C.gold, fontSize: 14, fontWeight: '700' },
  listHeaderInfo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 12, marginBottom: 20 },
  listHeaderIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(240, 165, 0, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  listHeaderTitle: { fontSize: 24, fontWeight: '800', color: C.white },
  listHeaderSub: { fontSize: 14, color: C.textMuted, marginTop: 4 },
  progressContainer: { paddingHorizontal: 16, marginBottom: 20 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { fontSize: 13, color: C.textSecondary },
  progressPercent: { fontSize: 13, fontWeight: '700', color: C.gold },
  progressBarBg: { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: C.gold },
  
  itemCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  itemCardCompleted: { opacity: 0.6 },
  checkbox: { padding: 4, paddingTop: 0 },
  itemName: { fontSize: 16, color: C.white, fontWeight: '700' },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  itemMeta: { fontSize: 13, color: C.textMuted },
  itemNotes: { fontSize: 12, color: C.textSecondary, marginTop: 8, fontStyle: 'italic' },
  itemActions: { flexDirection: 'row', gap: 4 },
  strikethrough: { textDecorationLine: 'line-through', textDecorationStyle: 'solid', color: C.textMuted },
  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  priorityBtnText: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  priorityText: { fontSize: 9, fontWeight: '800' },
  unitChip: { paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: C.border, height: '100%' },
  unitChipActive: { backgroundColor: 'rgba(240, 165, 0, 0.1)' },
  unitText: { fontSize: 14, color: C.textMuted, fontWeight: '500' },
  unitTextActive: { color: C.gold, fontWeight: '700' }
});
