import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface LabelProps extends TextProps {
  style?: TextProps['style']; // Use TextProps['style'] for better type safety
}

export function Label({ style, ...props }: LabelProps) {
  return (
    <Text
      style={[styles.baseLabel, style]} // Apply base styles and any passed-in styles
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  baseLabel: {
    fontFamily: 'sans-semibold', // font-sans-semibold - Adjust if necessary
    color: 'black', // text-black
    textTransform: 'uppercase', // uppercase
    letterSpacing: 0.05 * 18, // tracking-widest (0.05em), assuming text-lg (18px) context for em calculation
    fontSize: 18, // text-lg (approximate)
  },
});
