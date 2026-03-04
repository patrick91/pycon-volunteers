import React from 'react';
import { Text, TextProps } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface LabelProps extends Omit<TextProps, 'children'> {
  className?: string;
  text: string;
}

export function Label({ className, text, ...props }: LabelProps) {
  return (
    <Text
      className={twMerge(
        'font-sans-semibold text-black uppercase tracking-widest text-lg',
        className,
      )}
      {...props}
    >
      {text}
    </Text>
  );
}
