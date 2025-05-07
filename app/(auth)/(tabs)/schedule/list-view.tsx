import { type Item, SessionItem } from '@/components/session-item';
import type { DaySchedule } from '@/hooks/use-schedule';
import { LegendList } from '@legendapp/list';
import clsx from 'clsx';
import { parseISO } from 'date-fns';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

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

export function ScheduleListView({
  schedule,
  searchAllTalks,
}: {
  schedule: DaySchedule;
  searchAllTalks: (query: string) => Item[];
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const itemsToDisplay = useMemo(() => {
    if (searchQuery.trim()) {
      return searchAllTalks(searchQuery.trim());
    }
    // If no search query, extract all items from the daily schedule
    const dailyItems: Item[] = [];
    for (const room of schedule.rooms) {
      if (typeof room !== 'string') {
        for (const scheduleSession of room.sessions) {
          dailyItems.push(scheduleSession.session);
        }
      }
    }
    return dailyItems;
  }, [searchQuery, schedule, searchAllTalks]);

  // Group sessions by time
  const sessionsByTime = useMemo(() => {
    return itemsToDisplay.reduce(
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
  }, [itemsToDisplay]);

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
      // Add time header item
      newFlatList.push({
        type: 'time_header',
        time: slot.time,
        id: slot.time.toISOString(),
      });

      // Add session items for this time slot
      for (const session of slot.sessions) {
        newFlatList.push({
          type: 'session_item',
          session: session,
          id: `session-${session.id}`, // Prefix to ensure uniqueness across types
        });
      }
    }
    return newFlatList;
  }, [sortedTimeSlots]);

  return (
    <LegendList
      className="flex-1 bg-[#FAF5F3]"
      contentContainerStyle={{ paddingBottom: 86 }}
      data={flatScheduleItems} // Use the new flat list
      estimatedItemSize={80} // Adjusted for average item height (header or session)
      keyExtractor={(item: ScheduleFlatListItem) => item.id}
      ListHeaderComponent={
        <View className="border-b-2 border-black">
          <TextInput
            placeholder="Search talks and speakers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="bg-white p-3"
            clearButtonMode="while-editing"
          />
        </View>
      }
      renderItem={({ item }: { item: ScheduleFlatListItem }) => {
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
        if (item.type === 'session_item') {
          const { session } = item;
          return (
            <Link key={session.id} href={`/schedule/${session.slug}`}>
              <View
                className={clsx(
                  'p-4 bg-[#FCE8DE] w-full border-black',
                  'border-b-2', // All session items get a bottom border
                )}
              >
                <SessionItem session={session} variant="list" />
              </View>
            </Link>
          );
        }
        return null; // Should not happen with defined types
      }}
    />
  );
}
