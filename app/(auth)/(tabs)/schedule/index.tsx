import { TouchableOpacity, View, Text, Platform } from 'react-native';
import { ScheduleGridView } from './grid-view';
import { ScheduleListView } from './list-view';
import { Stack } from 'expo-router';
import { DaySelector } from '@/app/components/day-selector';
import { useState } from 'react';
import { useSchedule } from '@/hooks/use-schedule';
import Feather from '@expo/vector-icons/Feather';
import type { DaySchedule } from '@/hooks/use-schedule';

const ViewModeSelector = ({
  viewMode,
  onViewModeChange,
}: {
  viewMode: 'grid' | 'list';
  onViewModeChange: (viewMode: 'grid' | 'list') => void;
}) => {
  if (viewMode === 'grid') {
    return (
      <TouchableOpacity onPress={() => onViewModeChange('list')}>
        <Feather name="list" size={24} color="black" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={() => onViewModeChange('grid')}>
      <Feather name="grid" size={24} color="black" />
    </TouchableOpacity>
  );
};

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [day, setDay] = useState('2025-05-28');

  const { days, schedule, searchAllTalks } = useSchedule();

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
                onDayChange={(newDay) => {
                  setDay(newDay);
                }}
                selectedDay={day}
              />
            </View>
          ),
          headerRight: () => (
            <ViewModeSelector
              onViewModeChange={setViewMode}
              viewMode={viewMode}
            />
          ),
        }}
      />
      {daySchedule ? (
        viewMode === 'grid' ? (
          <ScheduleGridView schedule={daySchedule} />
        ) : (
          <ScheduleListView
            schedule={daySchedule}
            searchAllTalks={searchAllTalks}
          />
        )
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text>No schedule data available.</Text>
        </View>
      )}
    </View>
  );
}
