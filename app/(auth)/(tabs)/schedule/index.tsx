import { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { ScheduleGridView } from './grid-view';
import { ScheduleListView } from './list-view';

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <View className="flex-1">
      <View className="flex-row justify-center p-2 bg-white border-b">
        <TouchableOpacity
          className={`px-4 py-2 rounded-l ${
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
          className={`px-4 py-2 rounded-r ${
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
      {viewMode === 'grid' ? <ScheduleGridView /> : <ScheduleListView />}
    </View>
  );
}
