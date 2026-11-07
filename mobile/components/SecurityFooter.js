import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shield, Lock } from 'lucide-react-native';
import { C } from '../constants/theme';

export default function SecurityFooter({ style, compact = true }) {
  return (
    <View style={[styles.footerContainer, compact && styles.compactContainer, style]}>
      <Text style={[styles.footerText, compact && styles.compactFooterText]}>
        Powered by <Text style={styles.footerBrand}>CodeByTushu</Text>
      </Text>
      
      <View style={[styles.shieldIconContainer, compact && styles.compactShieldContainer]}>
        <Shield size={compact ? 24 : 36} color={C.gold} strokeWidth={1.8} />
        <View style={[styles.lockWrapper, compact && styles.compactLockWrapper]}>
          <Lock size={compact ? 10 : 14} color={C.gold} strokeWidth={2.2} />
        </View>
      </View>
      
      <Text style={[styles.securityText, compact && styles.compactSecurityText]}>
        Secure. Reliable. Trusted.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  compactContainer: {
    marginTop: 8,
    marginBottom: 4,
    marginHorizontal: 0,
  },
  footerText: { 
    color: '#A0A0A0', 
    fontSize: 13,
  },
  compactFooterText: {
    fontSize: 11,
  },
  footerBrand: { 
    color: C.gold, 
    fontWeight: '800',
  },
  shieldIconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    position: 'relative',
  },
  compactShieldContainer: {
    width: 32,
    height: 32,
    marginVertical: 4,
  },
  lockWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  compactLockWrapper: {
    marginTop: -1,
  },
  securityText: { 
    color: '#888888', 
    fontSize: 12, 
    fontWeight: '500',
  },
  compactSecurityText: {
    fontSize: 10,
  },
});
