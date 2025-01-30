import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface InputProps extends TextInputProps {
    className?: string;
}

export function Input({ className, ...props }: InputProps) {
    return (
        <TextInput
            className={twMerge(
                'font-sans-semibold py-2 border-0 border-b-4 placeholder:text-gray-400 text-lg leading-[1.2]',
                className
            )}
            {...props}
        />
    );
}