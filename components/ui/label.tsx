import React from 'react';
import { Text, TextProps, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface LabelProps extends TextProps {
    className?: string;
}

export function Label({ className, ...props }: LabelProps) {
    return (
        <Text
            className={twMerge(
                'font-sans-semibold text-black uppercase tracking-widest text-lg',
                className
            )}
            {...props}
        />
    );
}