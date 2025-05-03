import { Text } from 'react-native';

export const ErrorMessage = ({ children }: { children: string }) => {
  return <Text className="text-red-500 mb-2">{children}</Text>;
};
