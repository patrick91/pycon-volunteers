import { View, Text } from 'react-native';
import { useSchedule } from '@/hooks/use-schedule';

export function ScheduleListView() {
  const { schedule } = useSchedule(1);

  return (
    <View className="flex-1 p-4">
      <Text className="text-lg font-bold mb-4">Schedule List View</Text>
      <Text className="text-gray-500">
        List view implementation coming soon...
      </Text>
    </View>
  );
}
