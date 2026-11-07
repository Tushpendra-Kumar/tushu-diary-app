import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { getBudget, saveBudget } from '../../../services/personalDataService';
import SecurityFooter from '../../../components/SecurityFooter';
import { C } from '../../../constants/theme';
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react-native';
import ParticleBackground from '../../../components/ParticleBackground';

export default function MonthlyBudgetScreen({ navigation }) {
  const formatCurrency = (val) => '₹' + (Number(val) || 0).toLocaleString('en-IN');
  const { user } = useContext(AuthContext);
  const [currentMonth, setCurrentMonth] = useState('');
  const [budgetData, setBudgetData] = useState({ budget: 0, expenses: [] });
  const [isBudgetModalVisible, setIsBudgetModalVisible] = useState(false);
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  
  // Budget form
  const [budgetAmount, setBudgetAmount] = useState('');
  
  // Expense form
  const [amount, setAmount] = useState('');
  const [deleteExpenseId, setDeleteExpenseId] = useState(null);
  const [category, setCategory] = useState('Other');
  const [description, setDescription] = useState('');
  
  const categories = ['Grocery', 'Household', 'Clothing', 'Medical', 'Education', 'Entertainment', 'Other'];

  useEffect(() => {
    const today = new Date();
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(monthStr);
  }, []);

  useEffect(() => {
    if (user && currentMonth) {
      loadBudget();
    }
  }, [user, currentMonth]);

  const loadBudget = async () => {
    try {
      // fallback in case getBudget is not generic
      const data = await getBudget(user.id, currentMonth);
      if (data) {
        setBudgetData(data);
      } else {
        setBudgetData({ budget: 0, expenses: [] });
      }
    } catch (e) {
      setBudgetData({ budget: 0, expenses: [] });
    }
  };

  const handleSaveBudget = async () => {
    if (!budgetAmount || isNaN(budgetAmount)) return Alert.alert('Error', 'Please enter a valid amount');
    const newBudgetData = { ...budgetData, budget: parseFloat(budgetAmount) };
    setBudgetData(newBudgetData);
    await saveBudget(user.id, currentMonth, newBudgetData);
    setIsBudgetModalVisible(false);
    setBudgetAmount('');
  };

  const handleAddExpense = async () => {
    if (!amount || isNaN(amount)) return Alert.alert('Error', 'Please enter a valid amount');
    if (!description) return Alert.alert('Error', 'Please enter a description');
    
    const newExpense = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      category,
      description,
      date: new Date().toISOString()
    };
    
    const newBudgetData = { ...budgetData, expenses: [...budgetData.expenses, newExpense] };
    setBudgetData(newBudgetData);
    await saveBudget(user.id, currentMonth, newBudgetData);
    
    setIsExpenseModalVisible(false);
    setAmount('');
    setCategory('Other');
    setDescription('');
  };

  const handleDeleteExpense = (id) => {
    setDeleteExpenseId(id);
  };

  const confirmDeleteExpense = async () => {
    if (!deleteExpenseId) return;
    const newBudgetData = { ...budgetData, expenses: budgetData.expenses.filter(e => e.id !== deleteExpenseId) };
    setBudgetData(newBudgetData);
    await saveBudget(user?.user_id || user?.id, currentMonth, newBudgetData);
    setDeleteExpenseId(null);
  };


  const totalSpent = budgetData.expenses ? budgetData.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) : 0;
  const remaining = (budgetData.budget || 0) - totalSpent;
  const spentPercent = budgetData.budget > 0 ? (totalSpent / budgetData.budget) * 100 : 0;
  
  let progressBarColor = C.success;
  if (spentPercent > 90) progressBarColor = C.error;
  else if (spentPercent > 75) progressBarColor = C.gold;

  const categoryBreakdown = {};
  if (budgetData.expenses) {
    budgetData.expenses.forEach(item => {
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + (Number(item.amount) || 0);
    });
  }

  const handlePrevMonth = () => {
    if (!currentMonth) return;
    const [y, m] = currentMonth.split('-');
    let date = new Date(parseInt(y), parseInt(m) - 1 - 1, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    if (!currentMonth) return;
    const [y, m] = currentMonth.split('-');
    let date = new Date(parseInt(y), parseInt(m) - 1 + 1, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const renderMonthNav = () => {
    if (!currentMonth) return null;
    const [y, m] = currentMonth.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    const formatted = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    return (
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={handlePrevMonth}>
          <ChevronLeft size={24} style={styles.navBtn} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{formatted}</Text>
        <TouchableOpacity onPress={handleNextMonth}>
          <ChevronRight size={24} style={styles.navBtn} />
        </TouchableOpacity>
      </View>
    );
  };

    return (
    <SafeAreaView style={styles.container}>
      <ParticleBackground />
      

      {renderMonthNav()}

      {budgetData.budget === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No budget set for this month.</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsBudgetModalVisible(true)}>
            <Text style={styles.addBtnText}>Set Budget</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Budget</Text>
              <Text style={styles.summaryValue}>{formatCurrency(budgetData.budget)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Spent</Text>
              <Text style={[styles.summaryValue, {color: C.error}]}>{formatCurrency(totalSpent)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text style={[styles.summaryValue, {color: remaining >= 0 ? C.success : C.error}]}>{formatCurrency(remaining)}</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(spentPercent, 100)}%`, backgroundColor: progressBarColor }]} />
            </View>
            <Text style={styles.progressText}>{(Number(spentPercent) || 0).toFixed(1)}% Used</Text>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Expenses</Text>
            <TouchableOpacity onPress={() => setIsExpenseModalVisible(true)}>
              <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(240, 165, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20}}><Plus size={16} color={C.gold} /><Text style={{color: C.gold, fontWeight: '700', marginLeft: 4}}>Add</Text></View>
            </TouchableOpacity>
          </View>

          {Object.keys(categoryBreakdown).length > 0 && (
            <View style={styles.breakdownContainer}>
              <Text style={styles.breakdownTitle}>By Category:</Text>
              <View style={styles.breakdownTags}>
                {Object.entries(categoryBreakdown).map(([cat, amt]) => (
                  <View key={cat} style={styles.breakdownTag}>
                    <Text style={styles.breakdownCat}>{cat}</Text>
                    <Text style={styles.breakdownAmt}>{formatCurrency(amt)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {budgetData.expenses.length === 0 ? (
            <View style={{alignItems: 'center', marginVertical: 32}}>
              <Text style={{color: C.textMuted, fontSize: 14}}>No expenses recorded yet.</Text>
            </View>
          ) : budgetData.expenses.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardMain}>
                <Text style={styles.cardDesc}>{item.description}</Text>
                <Text style={styles.cardCat}>{item.category}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardAmt}>{formatCurrency(item.amount)}</Text>
                <TouchableOpacity onPress={() => handleDeleteExpense(item.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>Ã—</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{height: 100}} />
        </ScrollView>
      )}

      {/* Set Budget Modal */}
      <Modal visible={isBudgetModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Monthly Budget</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount (e.g. 15000)"
              placeholderTextColor={C.textMuted}
              keyboardType="numeric"
              value={budgetAmount}
              onChangeText={setBudgetAmount}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsBudgetModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBudget}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Expense Modal */}
      <Modal visible={isExpenseModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount"
              placeholderTextColor={C.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              placeholderTextColor={C.textMuted}
              value={description}
              onChangeText={setDescription}
            />
            <Text style={styles.label}>Category</Text>
            <View style={styles.catWrap}>
              {categories.map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.catBtn, category === cat && styles.catBtnActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catBtnText, category === cat && styles.catBtnTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsExpenseModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddExpense}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      <SecurityFooter />
    
      <Modal visible={!!deleteExpenseId} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#111', width: '100%', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 12 }}>Delete Expense</Text>
            <Text style={{ fontSize: 14, color: C.textSecondary, marginBottom: 20, lineHeight: 22 }}>Are you sure you want to delete this expense?</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' }} onPress={() => setDeleteExpenseId(null)}>
                <Text style={{ color: C.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: C.error, padding: 14, borderRadius: 12, alignItems: 'center' }} onPress={confirmDeleteExpense}>
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
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'rgba(255,255,255,0.02)' },
  navBtn: { color: C.gold, fontSize: 16 },
  monthTitle: { color: C.white, fontSize: 18, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: C.textMuted, fontSize: 16, marginBottom: 20 },
  addBtn: { backgroundColor: C.gold, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  addBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  content: { flex: 1, padding: 16 },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 12, marginHorizontal: 4, alignItems: 'center' },
  summaryLabel: { color: C.textSecondary, fontSize: 12, marginBottom: 4 },
  summaryValue: { color: C.white, fontSize: 16, fontWeight: 'bold' },
  progressContainer: { marginBottom: 24 },
  progressBarBg: { height: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },
  progressText: { color: C.textSecondary, fontSize: 12, marginTop: 8, textAlign: 'right' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: C.white, fontSize: 18, fontWeight: 'bold' },
  breakdownContainer: { marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8 },
  breakdownTitle: { color: C.textSecondary, fontSize: 14, marginBottom: 8 },
  breakdownTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  breakdownTag: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignItems: 'center' },
  breakdownCat: { color: C.textSecondary, fontSize: 12, marginRight: 6 },
  breakdownAmt: { color: C.white, fontSize: 12, fontWeight: 'bold' },
  card: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMain: { flex: 1 },
  cardDesc: { color: C.white, fontSize: 16, marginBottom: 4 },
  cardCat: { color: C.textSecondary, fontSize: 12 },
  cardRight: { flexDirection: 'row', alignItems: 'center' },
  cardAmt: { color: C.white, fontSize: 16, fontWeight: 'bold', marginRight: 12 },
  deleteBtn: { padding: 4, backgroundColor: C.errorBg, borderRadius: 4 },
  deleteText: { color: C.error, fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border },
  modalTitle: { color: C.white, fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 8, color: C.white, padding: 12, marginBottom: 16, outlineStyle: 'none' },
  label: { color: C.textSecondary, marginBottom: 8 },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.05)' },
  catBtnActive: { backgroundColor: C.goldDim, borderColor: C.border },
  catBtnText: { color: C.textSecondary, fontSize: 12 },
  catBtnTextActive: { color: C.gold, fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  cancelBtnText: { color: C.white, fontWeight: 'bold' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: C.gold, alignItems: 'center' },
  saveBtnText: { color: '#000', fontWeight: 'bold' },
});


