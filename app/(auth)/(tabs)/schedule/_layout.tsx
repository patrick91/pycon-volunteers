import { Stack } from 'expo-router';
import { DaySelector } from '../../../components/day-selector';
import { View } from 'react-native';

export default function ScheduleLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Schedule',
          headerTitle: () => (
            <View className="flex-1 flex flex-row justify-center items-center">
              <DaySelector />
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="[slug]/index"
        options={{ title: '', headerBackButtonDisplayMode: 'minimal' }}
      />
      <Stack.Screen
        name="[slug]/speaker/[id]"
        options={{
          title: '',
          headerBackButtonDisplayMode: 'minimal',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
