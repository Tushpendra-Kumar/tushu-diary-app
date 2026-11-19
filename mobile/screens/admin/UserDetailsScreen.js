import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchUserById, updateUserStatus, deleteUser } from '../../services/adminApi';
import ParticleBackground from '../../components/ParticleBackground';
import { C } from '../../constants/theme';

const InfoRow = ({ label, value, badge, badgeColor, badgeBg }) => (
  <View style={styles.infoRow}>
    <Text style={styles.rowLabel}>{label}</Text>
    {badge ? (
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.badgeText, { color: badgeColor }]}>{value}</Text>
      </View>
    ) : (
      <Text style={styles.rowValue}>{value}</Text>
    )}
  </View>
);

export default function UserDetailsScreen({ route, navigation }) {
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUser = async () => {
    setLoading(true);
    const result = await fetchUserById(userId);
    if (result.success) setUser(result.data);
    else setError(result.message || 'Failed to load user details');
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadUser(); }, [userId]));

  const handleToggleStatus = () => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionText = newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate';
    
    Alert.alert(`Confirm ${actionText}`, `Are you sure you want to ${actionText.toLowerCase()} this user?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: actionText, 
        style: newStatus === 'ACTIVE' ? 'default' : 'destructive',
        onPress: async () => {
          const res = await updateUserStatus(user.id, newStatus);
          if(res.success) loadUser();
          else Alert.alert('Error', res.message);
        }
      }
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete User', 'This action is permanent and cannot be undone. Are you absolutely sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Permanently',
        style: 'destructive',
        onPress: async () => {
          const res = await deleteUser(user.id);
          if(res.success) {
            Alert.alert('Deleted', 'User has been removed.');
            navigation.goBack();
          } else {
            Alert.alert('Error', res.message);
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ParticleBackground />
        <ActivityIndicator size="large" color={C.gold} />
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={[styles.container, styles.center]}>
        <ParticleBackground />
        <Text style={{ color: C.error }}>{error || 'User not found'}</Text>
      </View>
    );
  }

  const isActive = user.status === 'ACTIVE';

  return (
    <View style={styles.container}>
      <ParticleBackground />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user.full_name?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.name}>{user.full_name || 'User'}</Text>
          <Text style={styles.username}>@{((user.user_id || 'user').includes('privaterelay') || (user.user_id || '').includes('@')) ? ((user.full_name || user.user_id || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')) : (user.user_id || 'user').replace(/^@+/, '')}</Text>

          <View style={styles.divider} />

          <InfoRow label="Role" value={user.role} badge badgeColor={C.gold} badgeBg="rgba(240, 165, 0, 0.15)" />
          <InfoRow label="Status" value={user.status} badge badgeColor={isActive ? C.success : C.error} badgeBg={isActive ? C.successBg : C.errorBg} />
          <InfoRow label="Interface" value={user.gender === 'female' ? 'Ladies' : 'Gents'} />
          <InfoRow label="Created At" value={new Date(user.created_at).toLocaleDateString()} />
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditUserScreen', { user })}>
          <Text style={styles.editBtnText}>Edit User Details</Text>
        </TouchableOpacity>

        {user.role !== 'ADMIN' && (
          <TouchableOpacity style={[styles.toggleBtn, !isActive && styles.activateBtn]} onPress={handleToggleStatus}>
            <Text style={[styles.toggleBtnText, !isActive && { color: C.success }]}>
              {isActive ? 'Deactivate Account' : 'Activate Account'}
            </Text>
          </TouchableOpacity>
        )}

        {user.role !== 'ADMIN' && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>Delete User</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06080D' },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 24, paddingBottom: 48 },
  card: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24,
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(240, 165, 0, 0.15)',
    borderWidth: 2, borderColor: C.gold, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  avatarText: { fontSize: 28, fontWeight: '900', color: C.gold },
  name: { fontSize: 22, fontWeight: '800', color: C.white, marginBottom: 4 },
  username: { fontSize: 14, color: C.textMuted, marginBottom: 24 },
  divider: { height: 1, backgroundColor: C.border, width: '100%', marginBottom: 16 },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rowLabel: { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  rowValue: { fontSize: 14, color: C.white, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  editBtn: { backgroundColor: C.gold, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  editBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  
  toggleBtn: { backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.errorBorder, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  activateBtn: { backgroundColor: C.successBg, borderColor: C.successBorder },
  toggleBtnText: { color: C.error, fontSize: 15, fontWeight: '700' },

  deleteBtn: { padding: 16, alignItems: 'center' },
  deleteBtnText: { color: C.textMuted, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
