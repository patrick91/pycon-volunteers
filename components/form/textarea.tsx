import React from 'react';
import { type Control, useController } from 'react-hook-form';
import { TextInput, type TextInputProps, View, StyleSheet } from 'react-native';

import { ErrorMessage } from './error-message';

export const Textarea = ({
  name,
  control,
  error,
  style,
  ...props
}: TextInputProps & {
  name: string;
  control: Control<any>;
  error?: { message: string }[] | null;
}) => {
  const { field } = useController({
    control,
    name,
  });

  return (
    <View style={styles.container}>
      <TextInput
        value={field.value}
        onChangeText={field.onChange}
        multiline={true}
        {...props}
        style={[styles.textInputBase, error && styles.textInputError, style]}
      />

      {error?.map((error, index) => (
        <ErrorMessage key={index}>{error.message}</ErrorMessage>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  textInputBase: {
    fontSize: 18,
    borderBottomWidth: 2,
    borderColor: 'black',
    paddingBottom: 8,
    lineHeight: 18 * 1.2,
    fontWeight: '500',
  },
  textInputError: {
    marginBottom: 8,
    color: '#E53E3E',
    borderColor: '#E53E3E',
  },
});
