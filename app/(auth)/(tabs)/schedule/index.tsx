import { TouchableOpacity, View, Text } from 'react-native';
import { ScheduleGridView } from './grid-view';
import { ScheduleListView } from './list-view';
import { Stack } from 'expo-router';
import { DaySelector } from '@/app/components/day-selector';
import { useState } from 'react';
import { useSchedule } from '@/hooks/use-schedule';

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [day, setDay] = useState('2025-05-28');

  const { days, schedule } = useSchedule();

  const daySchedule = schedule[day];

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          title: 'Schedule',
          headerTitle: () => (
            <View className="flex-1 flex flex-row justify-center items-center">
              <DaySelector
                days={days}
                onDayChange={(day) => setDay(day)}
                selectedDay={day}
              />
            </View>
          ),
          headerRight: () => (
            <View className="flex-row mr-4">
              <TouchableOpacity
                className={`px-3 py-1 rounded-l ${
                  viewMode === 'grid' ? 'bg-blue-500' : 'bg-gray-200'
                }`}
                onPress={() => setViewMode('grid')}
              >
                <Text
                  className={`font-medium ${
                    viewMode === 'grid' ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  Grid
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-3 py-1 rounded-r ${
                  viewMode === 'list' ? 'bg-blue-500' : 'bg-gray-200'
                }`}
                onPress={() => setViewMode('list')}
              >
                <Text
                  className={`font-medium ${
                    viewMode === 'list' ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  List
                </Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      {viewMode === 'grid' ? (
        <ScheduleGridView schedule={daySchedule} />
      ) : (
        <ScheduleListView schedule={daySchedule} />
      )}
    </View>
  );
}
