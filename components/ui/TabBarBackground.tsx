import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';

export default function TabBarBackground() {
  if (Platform.OS !== 'ios') {
    // On Android/web the tab bar is already opaque.
    return undefined;
  }

  return (
    <BlurView
      tint="systemChromeMaterial"
      intensity={100}
      style={StyleSheet.absoluteFill}
    />
  );
}
