import { TouchableOpacity, View, Text } from 'react-native';
import { ScheduleGridView } from './grid-view';
import { ScheduleListView } from './list-view';
import { Stack } from 'expo-router';
import { DaySelector } from '@/app/components/day-selector';
import { useState } from 'react';

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          title: 'Schedule',
          headerTitle: () => (
            <View className="flex-1 flex flex-row justify-center items-center">
              <DaySelector />
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
      {viewMode === 'grid' ? <ScheduleGridView /> : <ScheduleListView />}
    </View>
  );
}
