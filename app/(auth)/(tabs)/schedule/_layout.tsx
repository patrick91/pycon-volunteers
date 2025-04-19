import { Stack } from 'expo-router';
import { DaySelector } from '../../../components/day-selector';

export default function ScheduleLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Schedule',
          headerRight: () => <DaySelector />,
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
