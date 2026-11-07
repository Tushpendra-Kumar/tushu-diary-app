import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Trash2, Plus } from 'lucide-react-native';
import { C } from '../../../constants/theme';
import ParticleBackground from '../../../components/ParticleBackground';
import { AuthContext } from '../../../context/AuthContext';
import { getCategories, addCategory, deleteCategory } from '../../../services/personalDataService';

export default function ExpenseCategoriesScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user?.user_id) {
      loadCategories();
    }
  }, [user?.user_id]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const cats = await getCategories(user.user_id);
      setCategories(cats || []);
    } catch (e) {
      console.error('Failed to load categories', e);
      setErrorMsg('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title, msg) => {
    if (Platform.OS === 'web') {
      window.alert(title + ': ' + msg);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleAdd = async () => {
    try {
      setErrorMsg('');
      console.log('handleAdd called. Input:', newCat);
      const catName = newCat.trim();
      
      if (!catName) {
        console.log('Validation failed: empty name');
        setErrorMsg('Category name cannot be empty.');
        return;
      }
      
      if (!user || !user.user_id) {
        console.log('Validation failed: user not found');
        setErrorMsg('User identity not found. Please relogin.');
        return;
      }
      
      if (categories.some(c => c.name.toLowerCase() === catName.toLowerCase())) {
        console.log('Validation failed: duplicate');
        setErrorMsg('This category already exists.');
        return;
      }
  
      console.log('Validation passed. Adding category...');
      setAdding(true);
      
      const newItem = await addCategory(user.user_id, catName);
      console.log('Category added successfully:', newItem);
      
      setCategories([...categories, newItem]);
      setNewCat('');
    } catch (e) {
      console.error('Error adding category:', e);
      setErrorMsg(e.message || 'Failed to add category.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (id, name) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${name}"? Existing transactions will not be deleted.`)) {
        executeDelete(id);
      }
    } else {
      Alert.alert(
        'Delete Category',
        `Are you sure you want to delete "${name}"? Existing transactions using this category will not be deleted, but it won't be available for new transactions.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => executeDelete(id)
          }
        ]
      );
    }
  };

  const executeDelete = async (id) => {
    try {
      await deleteCategory(user.user_id, id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (e) {
      console.error('Error deleting category:', e);
      setErrorMsg('Failed to delete category.');
    }
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <ParticleBackground />
      
      <View style={s.addSection}>
        <TextInput 
          style={s.input}
          value={newCat}
          onChangeText={setNewCat}
          placeholder="New category name"
          placeholderTextColor={C.textMuted || '#888'}
          underlineColorAndroid="transparent"
          maxLength={30}
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={s.addBtn} onPress={handleAdd} disabled={adding}>
          {adding ? <ActivityIndicator size="small" color="#000" /> : <Plus size={24} color="#000" />}
        </TouchableOpacity>
      </View>

      {errorMsg ? <Text style={s.errorText}>{errorMsg}</Text> : null}

      <ScrollView contentContainerStyle={s.list}>
        {loading ? (
          <ActivityIndicator size="large" color={C.gold} style={{ marginTop: 40 }} />
        ) : categories.length === 0 ? (
          <Text style={s.emptyText}>No custom categories added yet.</Text>
        ) : (
          categories.map(c => (
            <View key={c.id} style={s.catRow}>
              <Text style={s.catName}>{c.name}</Text>
              <TouchableOpacity style={s.delBtn} onPress={() => handleDelete(c.id, c.name)}>
                <Trash2 size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  addSection: { flexDirection: 'row', padding: 20, gap: 12 },
  input: { flex: 1, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', borderRadius: 8, color: C.white, paddingHorizontal: 16, fontSize: 16, outlineStyle: 'none' },
  addBtn: { backgroundColor: C.gold || '#ffd700', width: 56, height: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#ff4444', textAlign: 'center', marginHorizontal: 20, marginBottom: 10 },
  list: { padding: 20, paddingTop: 0 },
  catRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  catName: { flex: 1, color: C.white, fontSize: 16, fontWeight: '500' },
  delBtn: { padding: 8, marginRight: -8 },
  emptyText: { color: C.textSecondary || '#aaa', textAlign: 'center', marginTop: 40, fontSize: 14 }
});
