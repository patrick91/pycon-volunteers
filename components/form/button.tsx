import { View, TouchableHighlight, Text } from 'react-native';
import { useEmojiLoading } from '@/hooks/use-emoji-loading';

export const Button = ({
  children,
  loading,
  ...props
}: {
  children: string;
  loading: boolean;
  onPress: () => void;
}) => {
  const emoji = useEmojiLoading({ loading });

  return (
    <View className="mb-4">
      <TouchableHighlight {...props}>
        <View className="flex items-center border-2 border-black bg-[#fce8de] py-5 px-8 justify-center w-full">
          <Text className="text-black font-bold text-lg uppercase">
            {loading ? emoji : children}
          </Text>
        </View>
      </TouchableHighlight>
    </View>
  );
};
