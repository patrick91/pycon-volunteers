import { View, Text, TextInput } from 'react-native';
import type { DaySchedule } from '@/hooks/use-schedule';
import { SessionItem, type Item } from '@/components/session-item';
import { Link } from 'expo-router';
import { parseISO } from 'date-fns';
import clsx from 'clsx';
import { FlashList } from '@shopify/flash-list';
import { useState, useMemo } from 'react';

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

        // Check if this session is already in the time slot (based on title and speakers)
        // This deduplication might be more relevant for daily view than search results
        const isDuplicate = acc[timeKey].sessions.some(
          (existingSession) =>
            existingSession.title === session.title &&
            existingSession.speakers?.every((speaker) =>
              session.speakers?.some((s) => s.id === speaker.id),
            ),
        );

        if (!isDuplicate) {
          acc[timeKey].sessions.push(session);
        }
        return acc;
      },
      {} as Record<string, { time: Date; sessions: Item[] }>,
    );
  }, [itemsToDisplay]);

  // Sort time slots and flatten for FlashList
  const sortedTimeSlots = useMemo(() => {
    return Object.values(sessionsByTime).sort(
      (a, b) => a.time.getTime() - b.time.getTime(),
    );
  }, [sessionsByTime]);

  return (
    <FlashList
      className="flex-1 bg-[#FAF5F3]"
      contentContainerStyle={{ paddingBottom: 86 }}
      data={sortedTimeSlots}
      estimatedItemSize={120}
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
      renderItem={({ item: slot }) => (
        <View key={slot.time.toISOString()} className="border-b-2 border-black">
          <View className="bg-white p-4 border-b-2 border-black">
            <Text className="text-lg font-bold">
              {slot.time.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          {slot.sessions.map((session, index) => (
            <Link key={session.id} href={`/schedule/${session.slug}`}>
              <View
                className={clsx('p-4 bg-[#FCE8DE] w-full  border-black', {
                  'border-b-2': index !== slot.sessions.length - 1,
                  'border-b-0': index === slot.sessions.length - 1,
                })}
              >
                <SessionItem session={session} variant="list" />
              </View>
            </Link>
          ))}
        </View>
      )}
    />
  );
}
