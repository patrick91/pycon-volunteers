import { Stack } from 'expo-router';

export default function ScheduleLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[slug]/index"
        options={{ title: 'Schedule', headerBackButtonDisplayMode: 'minimal' }}
      />
      <Stack.Screen
        name="[slug]/speaker/[id]"
        options={{
          title: '',
          headerBackButtonDisplayMode: 'minimal',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[slug]/abstract"
        options={{
          title: 'Abstract',
          headerBackButtonDisplayMode: 'minimal',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
