import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { C } from '../constants/theme';

const UserCard = ({ user, onPress }) => {
  const isActive = user.status === 'ACTIVE';
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user.full_name?.charAt(0)?.toUpperCase() || '?'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{user.full_name}</Text>
        <Text style={styles.userId}>@{user.user_id}</Text>
      </View>
      <View style={styles.right}>
        <View style={[styles.statusBadge, { backgroundColor: isActive ? C.successBg : C.errorBg }]}>
          <Text style={[styles.statusText, { color: isActive ? C.success : C.error }]}>
            {user.status}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18, // Apple squircle 16px - 20px
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 44, // Apple HIG min touch target
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
    ...(Platform.OS === 'web' ? { 
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)' 
    } : {}),
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(240, 165, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: { fontSize: 17, fontWeight: '700', color: C.gold },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: C.white, marginBottom: 2, letterSpacing: -0.2 },
  userId: { fontSize: 12.5, color: '#636366', fontWeight: '400' }, // Apple secondary label
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.44 },
  chevron: { fontSize: 20, color: C.gold, fontWeight: '400' },
});

export default UserCard;
