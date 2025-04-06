import { Stack } from 'expo-router';

export default function ScheduleLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Schedule' }} />
      <Stack.Screen name="[slug]/index" options={{ title: '', headerBackButtonDisplayMode: 'minimal' }} />
      <Stack.Screen name="[slug]/speaker/[id]" options={{ title: '', headerBackButtonDisplayMode: 'minimal', presentation: 'modal' }} />
    </Stack>
  );
}
