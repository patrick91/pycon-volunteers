import { Text, StyleSheet } from 'react-native';

export const ErrorMessage = ({ children }: { children: string }) => {
  return <Text style={styles.errorText}>{children}</Text>;
};

const styles = StyleSheet.create({
  errorText: {
    color: '#E53E3E',
    marginBottom: 8,
  },
});
