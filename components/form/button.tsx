import { View, TouchableHighlight, Text, StyleSheet } from 'react-native';
import { useEmojiLoading } from '@/hooks/use-emoji-loading';

export const Button = ({
  children,
  loading,
  disabled,
  ...props
}: {
  children: string;
  loading: boolean;
  onPress: () => void;
  disabled?: boolean;
}) => {
  const emoji = useEmojiLoading({ loading });

  return (
    <View style={styles.outerView}>
      <TouchableHighlight {...props} disabled={disabled}>
        <View style={styles.innerView}>
          <Text style={styles.text}>{loading ? emoji : children}</Text>
        </View>
      </TouchableHighlight>
    </View>
  );
};

const styles = StyleSheet.create({
  outerView: {
    marginBottom: 16, // mb-4
  },
  innerView: {
    alignItems: 'center', // items-center
    borderWidth: 4, // border-4
    borderColor: 'black', // border-black
    paddingVertical: 20, // py-5
    paddingHorizontal: 32, // px-8
    justifyContent: 'center', // justify-center
    width: '100%', // w-full
    backgroundColor: 'white', // bg-white
    // NativeWind 'flex' might imply flex: 1 or specific flex behavior depending on context.
    // Here, combined with items-center and justify-center on a View that wraps Text,
    // it primarily serves to make the container honor these alignment props for its children.
    // The default flexDirection is 'column'.
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
