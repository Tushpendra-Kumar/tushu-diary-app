import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, SafeAreaView, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { getRecipes, addRecipe, updateRecipe, deleteRecipe } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import { ArrowLeft, Plus, Trash2, Clock, ChefHat, BookOpen } from 'lucide-react-native';
import ParticleBackground from '../../../components/ParticleBackground';

export default function RecipesScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isRandomModalVisible, setIsRandomModalVisible] = useState(false);
  
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Breakfast');
  const [cookingTime, setCookingTime] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [notes, setNotes] = useState('');
  
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [deleteRecipeId, setDeleteRecipeId] = useState(null);

  const categories = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Dessert', 'Drinks', 'Other'];

  useEffect(() => {
    if (user) {
      loadRecipes();
    }
  }, [user]);

  const loadRecipes = async () => {
    try {
      const data = await getRecipes(user?.user_id);
      setRecipes(data || []);
    } catch (e) {
      setRecipes([]);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setCategory('Breakfast');
    setCookingTime('');
    setIngredients('');
    setSteps('');
    setNotes('');
    setIsModalVisible(true);
  };

  const openEditModal = (recipe) => {
    setEditingId(recipe.id);
    setName(recipe.name);
    setCategory(recipe.category);
    setCookingTime(recipe.cookingTime || '');
    setIngredients(recipe.ingredients || '');
    setSteps(recipe.steps || '');
    setNotes(recipe.notes || '');
    setIsDetailModalVisible(false);
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Please enter a recipe name');
    
    const recipeData = {
      name,
      category,
      cookingTime,
      ingredients,
      steps,
      notes,
      updatedAt: new Date().toISOString()
    };

    if (editingId) {
      await updateRecipe(user?.user_id, editingId, recipeData);
    } else {
      await addRecipe(user?.user_id, recipeData);
    }
    
    setIsModalVisible(false);
    loadRecipes();
  };

  const handleDelete = (id) => {
    setDeleteRecipeId(id);
  };

  const confirmDelete = async () => {
    if (!deleteRecipeId) return;
    await deleteRecipe(user?.user_id, deleteRecipeId);
    setDeleteRecipeId(null);
    setIsDetailModalVisible(false);
    loadRecipes();
  };

  const pickRandom = () => {
    if (recipes.length === 0) return Alert.alert('No recipes', 'Add some recipes first!');
    const random = recipes[Math.floor(Math.random() * recipes.length)];
    setSelectedRecipe(random);
    setIsRandomModalVisible(true);
  };

  const filteredRecipes = recipes.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const renderRecipeItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => { setSelectedRecipe(item); setIsDetailModalVisible(true); }}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={styles.cardActions}>
          <Text style={styles.cardCat}>{item.category}</Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={{padding: 4}}>
            <Trash2 size={20} color={C.error} />
          </TouchableOpacity>
        </View>
      </View>
      {item.cookingTime ? <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}><Clock size={12} color={C.textMuted} /><Text style={styles.cardTime}> {item.cookingTime}</Text></View> : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ParticleBackground />
      

      <View style={styles.topActions}>
        <TouchableOpacity style={[styles.randomBtn, {flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}]} onPress={pickRandom}>
          <ChefHat size={20} color={'#000'} style={{marginRight: 8}}/><Text style={styles.randomBtnText}>Aaj Kya Banaye?</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchBar}
          placeholder="Search recipes..."
          placeholderTextColor={C.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BookOpen size={48} color={C.textMuted} style={{marginBottom: 12}} />
          <Text style={styles.emptyText}>No recipes saved yet.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={item => item.id}
          renderItem={renderRecipeItem}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={<SecurityFooter />}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContentFullscreen}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}><Text style={{color: C.textSecondary}}>Cancel</Text></TouchableOpacity>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Recipe' : 'Add Recipe'}</Text>
              <TouchableOpacity onPress={handleSave}><Text style={{color: C.gold, fontWeight:'bold'}}>Save</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.label}>Recipe Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Paneer Butter Masala" placeholderTextColor={C.textMuted} value={name} onChangeText={setName} />
              
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {categories.map(cat => (
                  <TouchableOpacity key={cat} style={[styles.catBtn, category === cat && styles.catBtnActive]} onPress={() => setCategory(cat)}>
                    <Text style={[styles.catBtnText, category === cat && styles.catBtnTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <Text style={styles.label}>Cooking Time</Text>
              <TextInput style={styles.input} placeholder="e.g. 45 mins" placeholderTextColor={C.textMuted} value={cookingTime} onChangeText={setCookingTime} />
              
              <Text style={styles.label}>Ingredients (comma separated or new lines)</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Ingredients..." placeholderTextColor={C.textMuted} multiline value={ingredients} onChangeText={setIngredients} />
              
              <Text style={styles.label}>Steps</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Cooking steps..." placeholderTextColor={C.textMuted} multiline value={steps} onChangeText={setSteps} />
              
              <Text style={styles.label}>Notes</Text>
              <TextInput style={styles.input} placeholder="Any tips?" placeholderTextColor={C.textMuted} value={notes} onChangeText={setNotes} />
              <View style={{height: 50}} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={isDetailModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailCard}>
            {selectedRecipe && (
              <ScrollView>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>{selectedRecipe.name}</Text>
                  <TouchableOpacity onPress={() => setIsDetailModalVisible(false)}><Text style={{color: C.textSecondary, fontSize: 24}}>Ã—</Text></TouchableOpacity>
                </View>
                <Text style={styles.detailMeta}>{selectedRecipe.category} {selectedRecipe.cookingTime ? `â€¢ â±ï¸ ${selectedRecipe.cookingTime}` : ''}</Text>
                
                {selectedRecipe.ingredients ? (
                  <>
                    <Text style={styles.sectionTitle}>Ingredients</Text>
                    <Text style={styles.detailText}>{selectedRecipe.ingredients}</Text>
                  </>
                ) : null}

                {selectedRecipe.steps ? (
                  <>
                    <Text style={styles.sectionTitle}>Steps</Text>
                    <Text style={styles.detailText}>{selectedRecipe.steps}</Text>
                  </>
                ) : null}

                {selectedRecipe.notes ? (
                  <>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    <Text style={styles.detailText}>{selectedRecipe.notes}</Text>
                  </>
                ) : null}

                <View style={styles.detailActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(selectedRecipe)}>
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(selectedRecipe.id)}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Random Modal */}
      <Modal visible={isRandomModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.randomCard}>
            <Text style={styles.randomHeader}>You should make:</Text>
            {selectedRecipe && (
              <>
                <Text style={styles.randomTitle}>{selectedRecipe.name}</Text>
                <Text style={styles.randomCat}>{selectedRecipe.category}</Text>
                <View style={styles.randomActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsRandomModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>Maybe Later</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={() => { setIsRandomModalVisible(false); setIsDetailModalVisible(true); }}>
                    <Text style={styles.saveBtnText}>View Recipe</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={{ position: 'absolute', bottom: 24, right: 24, backgroundColor: C.gold, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8, boxShadow: '0px 4px 15px rgba(240, 165, 0, 0.4)' }} onPress={openAddModal}>
        <Plus size={24} color="#000" />
      </TouchableOpacity>
    
      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteRecipeId} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#111', width: '100%', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 12 }}>Delete Recipe</Text>
            <Text style={{ fontSize: 14, color: C.textSecondary, marginBottom: 20, lineHeight: 22 }}>Are you sure you want to delete this recipe?</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' }} onPress={() => setDeleteRecipeId(null)}>
                <Text style={{ color: C.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: C.error, padding: 14, borderRadius: 12, alignItems: 'center' }} onPress={confirmDelete}>
                <Text style={{ color: '#FFF', fontWeight: '800' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { color: C.gold, fontSize: 16 },
  title: { color: C.white, fontSize: 18, fontWeight: 'bold' },
  topActions: { padding: 16, gap: 12 },
  randomBtn: { backgroundColor: C.goldDim, borderWidth: 1, borderColor: C.border, padding: 12, borderRadius: 8, alignItems: 'center' },
  randomBtnText: { color: C.gold, fontWeight: 'bold', fontSize: 16 },
  searchBar: { backgroundColor: C.input, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 8, color: C.white, padding: 10, outlineStyle: 'none' },
  listContent: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: C.textMuted, fontSize: 16 },
  card: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: C.white, fontSize: 16, fontWeight: 'bold', flex: 1 },
  cardCategory: { color: C.gold, fontSize: 12, backgroundColor: C.goldDim, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, overflow: 'hidden' },
  cardTime: { color: C.textSecondary, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContentFullscreen: { backgroundColor: '#111', flex: 1, marginTop: 40, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: C.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { color: C.white, fontSize: 18, fontWeight: 'bold' },
  modalScroll: { padding: 16 },
  label: { color: C.textSecondary, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 8, color: C.white, padding: 12, outlineStyle: 'none' },
  textArea: { height: 100, textAlignVertical: 'top' },
  catScroll: { flexDirection: 'row', marginBottom: 8 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8 },
  catBtnActive: { backgroundColor: C.goldDim, borderColor: C.border },
  catBtnText: { color: C.textSecondary, fontSize: 14 },
  catBtnTextActive: { color: C.gold, fontWeight: 'bold' },
  detailCard: { backgroundColor: '#111', margin: 20, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 20, maxHeight: '80%' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  detailTitle: { color: C.white, fontSize: 24, fontWeight: 'bold', flex: 1, marginRight: 16 },
  detailMeta: { color: C.gold, fontSize: 14, marginBottom: 20, marginTop: 4 },
  sectionTitle: { color: C.textSecondary, fontSize: 12, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  detailText: { color: C.white, fontSize: 15, lineHeight: 22 },
  detailActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, gap: 12 },
  editBtn: { flex: 1, backgroundColor: C.goldDim, borderWidth: 1, borderColor: C.border, padding: 12, borderRadius: 8, alignItems: 'center' },
  editBtnText: { color: C.gold, fontWeight: 'bold' },
  deleteBtn: { flex: 1, backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.errorBorder, padding: 12, borderRadius: 8, alignItems: 'center' },
  deleteBtnText: { color: C.error, fontWeight: 'bold' },
  randomCard: { backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 30, width: '100%', alignItems: 'center' },
  randomHeader: { color: C.textSecondary, fontSize: 16, marginBottom: 16 },
  randomTitle: { color: C.gold, fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  randomCat: { color: C.white, fontSize: 14, marginBottom: 30 },
  randomActions: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  cancelBtnText: { color: C.white, fontWeight: 'bold' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: C.gold, alignItems: 'center' },
  saveBtnText: { color: '#000', fontWeight: 'bold' },
});


