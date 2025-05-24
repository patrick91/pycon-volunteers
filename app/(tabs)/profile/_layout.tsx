import { Stack } from 'expo-router';

export default function ScheduleLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
      <Stack.Screen name="tickets" options={{ title: 'Tickets' }} />
    </Stack>
  );
}
