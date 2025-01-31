import { Text, TouchableOpacity, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

export function Button({
  children,
  className,
  ...props
}: React.PropsWithChildren<React.ComponentProps<typeof TouchableOpacity>>) {
  return (
    <TouchableOpacity {...props}>
      <View
        className={twMerge('p-4 border-4 border-black', className)}
        {...props}
      >
        <Text className="font-sans-semibold text-lg text-black text-center uppercase tracking-widest">
          {children}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
