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
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    ...(Platform.OS === 'web' ? { boxShadow: '0px 4px 5px rgba(0, 0, 0, 0.3)' } : {}),
    elevation: 3,
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
  avatarText: { fontSize: 18, fontWeight: '800', color: C.gold },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: C.white, marginBottom: 3 },
  userId: { fontSize: 13, color: C.textSecondary },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  chevron: { fontSize: 22, color: C.gold, fontWeight: '300' },
});

export default UserCard;
