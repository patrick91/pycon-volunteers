import React from 'react';
import {
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface InputProps extends TextInputProps {
  style?: TextStyle;
}

export function Input({ style, ...props }: InputProps) {
  return (
    <TextInput
      style={[styles.baseInput, style]}
      placeholderTextColor={styles.placeholder.color}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  baseInput: {
    fontFamily: 'sans-semibold',
    paddingVertical: 8,
    borderBottomWidth: 4,
    borderColor: '#000',
    fontSize: 18,
    lineHeight: 18 * 1.2,
  },
  placeholder: {
    color: '#9CA3AF',
  },
});
