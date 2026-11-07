import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '../constants/theme';

const EmptyState = ({ message = 'No data available', subMessage = '' }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✧</Text>
      <Text style={styles.message}>{message}</Text>
      {subMessage ? <Text style={styles.subMessage}>{subMessage}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  icon: {
    fontSize: 48,
    color: C.gold,
    marginBottom: 16,
    opacity: 0.8,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: C.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  subMessage: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
  },
});

export default EmptyState;
