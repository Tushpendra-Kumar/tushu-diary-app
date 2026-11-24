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
    backgroundColor: 'rgba(17, 21, 30, 0.85)',
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 18, // Apple squircle 16px - 20px
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    flex: 1,
    minWidth: '30%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
  cardTotal: {
    borderColor: 'rgba(240, 165, 0, 0.35)',
    backgroundColor: 'rgba(240, 165, 0, 0.06)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: 11, // Micro tag 0.70rem
    color: '#636366', // Apple iOS secondary label
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.44, // 0.04em
    marginTop: 6,
  },
  value: {
    fontSize: 22, // Executive scale, no clunky 900
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});

export default StatCard;
