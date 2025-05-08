import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ComponentProps, PropsWithChildren } from 'react';

// Define a more specific type for the style prop if it's intended for the View
interface UIButtonProps extends ComponentProps<typeof TouchableOpacity> {
  viewStyle?: ViewStyle;
}

export function Button({
  children,
  viewStyle, // Changed from className
  ...props
}: PropsWithChildren<UIButtonProps>) {
  return (
    <TouchableOpacity {...props}>
      <View
        style={[styles.baseView, viewStyle]} // Apply base styles and any passed-in viewStyle
        // {...props} // Consider if all TouchableOpacity props should also be on the View
      >
        <Text style={styles.text}>{children}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseView: {
    padding: 16, // p-4
    borderWidth: 4, // border-4
    borderColor: 'black', // border-black
  },
  text: {
    fontFamily: 'sans-semibold', // font-sans-semibold - Adjust if necessary
    fontSize: 18, // text-lg
    color: 'black', // text-black
    textAlign: 'center', // text-center
    textTransform: 'uppercase', // uppercase
    letterSpacing: 0.9, // tracking-widest (0.05em of 18px)
  },
});
