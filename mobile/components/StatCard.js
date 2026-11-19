import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { C } from '../constants/theme';
import { Feather } from '@expo/vector-icons';

const StatCard = ({ title, value, type = 'total' }) => {
  const getValueColor = () => {
    if (type === 'active') return C.success;
    if (type === 'inactive') return C.error;
    return C.gold;
  };

  const getIcon = () => {
    if (type === 'active') return 'check-circle';
    if (type === 'inactive') return 'x-circle';
    return 'users';
  };

  const isTotal = type === 'total';

  return (
    <View style={[styles.card, isTotal && styles.cardTotal]}>
      <View style={[styles.iconContainer, { backgroundColor: `${getValueColor()}15` }]}>
        <Feather name={getIcon()} style={[styles.icon, { color: getValueColor() }]} />
      </View>
      <Text style={[styles.value, { color: getValueColor() }]}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(20, 20, 20, 0.7)',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    flex: 1,
    minWidth: '30%',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    ...(Platform.OS === 'web' ? { boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.4)' } : {}),
    elevation: 3,
  },
  cardTotal: {
    borderColor: 'rgba(240, 165, 0, 0.3)',
    backgroundColor: 'rgba(240, 165, 0, 0.05)',
    ...(Platform.OS === 'web' ? { boxShadow: '0px 0px 20px rgba(240, 165, 0, 0.15)' } : {}),
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 22,
  },
  title: {
    fontSize: 11,
    color: C.textSecondary,
    textAlign: 'center',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 8,
  },
  value: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
});

export default StatCard;
