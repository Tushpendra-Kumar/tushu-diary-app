import React, { forwardRef } from 'react';
import { TextInput, StyleSheet, Platform } from 'react-native';
import { inputResetStyle } from '../constants/theme';

/**
 * AppTextInput
 * Standardized reusable TextInput component for TushuDiary.
 * Root-cause fix for unwanted browser/native focus outlines and underlines:
 * - Automatically applies outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent', boxShadow: 'none'
 * - Sets underlineColorAndroid="transparent"
 * - Preserves all TextInput props, ref forwarding, and custom styles
 */
const AppTextInput = forwardRef(({ style, underlineColorAndroid = 'transparent', ...props }, ref) => {
  return (
    <TextInput
      ref={ref}
      underlineColorAndroid={underlineColorAndroid}
      style={[styles.reset, style]}
      {...props}
    />
  );
});

const styles = StyleSheet.create({
  reset: {
    ...inputResetStyle,
  },
});

export default AppTextInput;
