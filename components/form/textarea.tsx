import React from 'react';
import { type Control, useController } from 'react-hook-form';
import { TextInput, type TextInputProps, View } from 'react-native';

import { ErrorMessage } from './error-message';
import clsx from 'clsx';

export const Textarea = ({
  name,
  control,
  error,
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
    <View className="mb-8">
      <TextInput
        value={field.value}
        onChangeText={field.onChange}
        multiline={true}
        {...props}
        className={clsx(
          'text-lg border-b-2 border-black pb-2 leading-[1.2] font-medium border-black',
          {
            'mb-2 text-red-500 border-red-500': !!error,
          },
        )}
      />

      {error?.map((error, index) => (
        <ErrorMessage key={index}>{error.message}</ErrorMessage>
      ))}
    </View>
  );
};
