import { View, TouchableHighlight, Text } from 'react-native';
import { useEmojiLoading } from '@/hooks/use-emoji-loading';

export const Button = ({
  label,
  loading = false,
  disabled,
  ...props
}: {
  label: string;
  loading?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) => {
  const emoji = useEmojiLoading({ loading });

  return (
    <View className="mb-4">
      <TouchableHighlight {...props} disabled={disabled}>
        <View className="flex items-center border-4 border-black py-5 px-8 justify-center w-full bg-white">
          <Text className="font-sans-semibold text-lg text-black text-center uppercase tracking-widest">
            {loading ? emoji : label}
          </Text>
        </View>
      </TouchableHighlight>
    </View>
  );
};
