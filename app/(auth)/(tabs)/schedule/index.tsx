import { Stack, Link } from 'expo-router';
import { DaySelector } from '@/components/day-selector';

import { type Item, SessionItem } from '@/components/session-item';
import { type ItemWithDuration, useSchedule } from '@/hooks/use-schedule';
import { LegendList } from '@legendapp/list';
import { parseISO } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button } from '@/components/ui/button';

// Define types for the flattened list items
interface TimeHeaderItem {
  type: 'time_header';
  time: Date;
  id: string;
}

interface SessionDisplayItem {
  type: 'session_item';
  session: Item; // Item is already defined from '@/components/session-item'
  id: string;
}

type ScheduleFlatListItem = TimeHeaderItem | SessionDisplayItem;

function ScheduleListView({
  items,
  searchInput,
}: { items: ItemWithDuration[]; searchInput: React.ReactNode }) {
  // Group sessions by time
  const sessionsByTime = useMemo(() => {
    return items.reduce(
      (acc, session) => {
        const startTime = parseISO(session.start);
        const timeKey = startTime.toISOString();

        if (!acc[timeKey]) {
          acc[timeKey] = {
            time: startTime,
            sessions: [],
          };
        }

        // Check if this session is already in the time slot
        // This deduplication might be more relevant for daily view than search results
        const isDuplicate = acc[timeKey].sessions.some(
          (existingSession) => existingSession.id === session.id,
        );

        if (!isDuplicate) {
          acc[timeKey].sessions.push(session);
        }
        return acc;
      },
      {} as Record<string, { time: Date; sessions: Item[] }>,
    );
  }, [items]);

  // Sort time slots
  const sortedTimeSlots = useMemo(() => {
    return Object.values(sessionsByTime).sort(
      (a, b) => a.time.getTime() - b.time.getTime(),
    );
  }, [sessionsByTime]);

  // Create the flat list for FlashList
  const flatScheduleItems = useMemo(() => {
    const newFlatList: ScheduleFlatListItem[] = [];
    for (const slot of sortedTimeSlots) {
      newFlatList.push({
        type: 'time_header',
        time: slot.time,
        id: slot.time.toISOString(),
      });

      for (const session of slot.sessions) {
        newFlatList.push({
          type: 'session_item',
          session: session,
          id: `session-${session.id}`,
        });
      }
    }
    return newFlatList;
  }, [sortedTimeSlots]);

  const keyExtractor = useCallback((item: ScheduleFlatListItem) => item.id, []);
  const renderItem = useCallback(({ item }: { item: ScheduleFlatListItem }) => {
    if (item.type === 'time_header') {
      return (
        <View className="bg-white p-4 border-b-2 border-black">
          <Text className="text-lg font-bold">
            {item.time.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      );
    }

    const { session } = item;

    return (
      <Link
        href={`/schedule/${session.slug}`}
        className="p-4 min-h-[120px] border-b-2 border-black w-full bg-[#FCE8DE]"
      >
        <SessionItem session={session} />
      </Link>
    );
  }, []);

  return (
    <LegendList
      className="flex-1 bg-[#FAF5F3]"
      contentContainerStyle={{ paddingBottom: 86 }}
      data={flatScheduleItems} // Use the new flat list
      getEstimatedItemSize={(index, item) => {
        if (item.type === 'time_header') {
          return 60;
        }

        return 140;
      }}
      keyExtractor={keyExtractor}
      recycleItems
      ListHeaderComponent={
        <View className="border-b-2 border-black bg-white flex-row items-center pl-3">
          <FontAwesome name="search" size={24} color="black" />
          {searchInput}
        </View>
      }
      renderItem={renderItem}
    />
  );
}
export default function SchedulePage() {
  const defaultDay = '2025-05-29';
  const today = new Date().toISOString().split('T')[0];

  const { days, schedule } = useSchedule();

  const isTodayAConference = days.map((day) => day.dayString).includes(today);

  const [day, setDay] = useState(isTodayAConference ? today : defaultDay);

  const [searchQuery, setSearchQuery] = useState('');

  const { items } = schedule[day];

  console.log(searchQuery);

  const searchInput = (
    <TextInput
      placeholder="Search talks and speakers..."
      value={searchQuery}
      onChangeText={setSearchQuery}
      className="bg-white p-3 py-4 flex-1"
      clearButtonMode="while-editing"
    />
  );

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
            <View className="flex-row items-center">
              <Button
                title="Add Session"
                onPress={() => console.log('Add Session')}
              />
            </View>
          ),
        }}
      />
      {items ? (
        <ScheduleListView items={items} searchInput={searchInput} />
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text>No schedule data available.</Text>
        </View>
      )}
    </View>
  );
}
