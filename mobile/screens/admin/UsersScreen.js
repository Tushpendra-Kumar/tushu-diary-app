import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { fetchUsers } from '../../services/adminApi';
import UserCard from '../../components/UserCard';
import EmptyState from '../../components/EmptyState';
import SecurityFooter from '../../components/SecurityFooter';
import { C } from '../../constants/theme';
import ParticleBackground from '../../components/ParticleBackground';

export default function UsersScreen({ navigation, route }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Accept filter from route, default to 'ALL'
  const initialFilter = route.params?.filter || 'ALL';
  const [activeFilter, setActiveFilter] = useState(initialFilter);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    const result = await fetchUsers();
    if (result.success) setUsers(result.data || []);
    else setError(result.message || 'Unable to load users.');
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadUsers(); }, []));

  const filteredUsers = users.filter(user => {
    const name = (user.full_name || '').toLowerCase();
    const uid = (user.user_id || '').toLowerCase();
    const mail = (user.email || '').toLowerCase();
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = name.includes(q) || uid.includes(q) || mail.includes(q);
    const matchesFilter = activeFilter === 'ACTIVE' ? user.status === 'ACTIVE' : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ParticleBackground />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Manage Users</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddUserScreen')} activeOpacity={0.8}>
            <Feather name="user-plus" style={styles.addIcon} />
            <Text style={styles.addButtonText}>Add User</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Feather name="search" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or ID..."
            placeholderTextColor={C.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.filterTabs}>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'ALL' && styles.filterTabActive]} 
            onPress={() => setActiveFilter('ALL')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'ALL' && styles.filterTabTextActive]}>All Users</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'ACTIVE' && styles.filterTabActive]} 
            onPress={() => setActiveFilter('ACTIVE')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'ACTIVE' && styles.filterTabTextActive]}>Active Only</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.gold} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUsers}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <UserCard user={item} onPress={() => navigation.navigate('UserDetailsScreen', { userId: item.id })} />
          )}
          ListEmptyComponent={
            <EmptyState
              message={searchQuery ? 'No users found.' : 'No users yet.'}
              subMessage={!searchQuery ? 'Tap + Add User to create one.' : ''}
            />
          }
          ListFooterComponent={<SecurityFooter />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 48,
    zIndex: 10,
  },
  title: { fontSize: 28, fontWeight: '800', color: C.white, letterSpacing: -0.5, zIndex: 10 },
  addButton: {
    backgroundColor: 'rgba(240, 165, 0, 0.15)',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.3)',
  },
  addIcon: { color: C.gold, fontSize: 16, marginRight: 8 },
  addButtonText: { color: C.gold, fontSize: 14, fontWeight: '700' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 15, 15, 0.8)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(240, 165, 0, 0.25)',
    paddingHorizontal: 16,
    height: 54,
  },
  searchIcon: { fontSize: 20, color: C.gold, marginRight: 12 },
  searchInput: { flex: 1, fontSize: 15, color: C.white, fontWeight: '500', outlineStyle: 'none' },
  filterTabs: { flexDirection: 'row', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4 },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  filterTabActive: { backgroundColor: C.gold },
  filterTabText: { color: C.textMuted, fontSize: 13, fontWeight: '600' },
  filterTabTextActive: { color: '#000', fontWeight: '700' },
  listContainer: { padding: 24, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: C.textSecondary, fontWeight: '500' },
  errorText: { color: C.error, marginBottom: 16, textAlign: 'center', fontWeight: '500' },
  retryButton: {
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border,
  },
  retryText: { color: C.white, fontWeight: '700' },
});
