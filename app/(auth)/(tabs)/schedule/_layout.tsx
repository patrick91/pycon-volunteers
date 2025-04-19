import { Stack } from 'expo-router';
import { DaySelector } from '../../../components/day-selector';
import { View, TouchableOpacity, Text } from 'react-native';
import { useState } from 'react';

export default function ScheduleLayout() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <Stack>
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
