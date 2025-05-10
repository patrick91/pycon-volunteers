import { Stack, Link } from 'expo-router';
import { DaySelector } from '@/components/day-selector';

import { type Item, SessionItem } from '@/components/session-item';
import { type ItemWithDuration, useSchedule } from '@/hooks/use-schedule';
import { LegendList } from '@legendapp/list';
import { parseISO } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { Text, TextInput, View, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button } from '@/components/ui/button';
import { Path } from 'react-native-svg';
import Svg from 'react-native-svg';

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

  const listHeader = useMemo(() => {
    return (
      <View className="border-b-2 border-black bg-white flex-row items-center pl-3">
        <FontAwesome name="search" size={24} color="black" />
        {searchInput}
      </View>
    );
  }, [searchInput]);

  return (
    <LegendList
      className="flex-1 bg-[#FAF5F3]"
      contentContainerStyle={{ paddingBottom: 86 }}
      ListEmptyComponent={
        <View className="flex-1 justify-center items-center pt-8">
          <Text>No results found for your search.</Text>
        </View>
      }
      data={flatScheduleItems} // Use the new flat list
      getEstimatedItemSize={(index, item) => {
        if (item.type === 'time_header') {
          return 60;
        }

        return 140;
      }}
      keyExtractor={keyExtractor}
      recycleItems
      ListHeaderComponent={listHeader}
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
  const [showOnlyManagedTalks, setShowOnlyManagedTalks] = useState(false);

  const allItems = useMemo(() => {
    return Object.values(schedule)
      .flatMap((daySchedule) => daySchedule.items)
      .filter((item): item is ItemWithDuration => !!item);
  }, [schedule]);

  const displayedItems = useMemo(() => {
    let itemsToDisplay = allItems;

    if (searchQuery.trim()) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      itemsToDisplay = itemsToDisplay.filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(lowerCaseQuery);
        const speakerMatch = item.speakers.some((speaker) =>
          speaker.fullName.toLowerCase().includes(lowerCaseQuery),
        );
        return titleMatch || speakerMatch;
      });
    }

    if (showOnlyManagedTalks) {
      itemsToDisplay = itemsToDisplay.filter((item) => item.userIsTalkManager);
    }

    if (!searchQuery.trim() && !showOnlyManagedTalks) {
      return schedule[day]?.items || [];
    }

    return itemsToDisplay;
  }, [searchQuery, allItems, schedule, day, showOnlyManagedTalks]);

  const handleShowOnlyManagedTalks = () => {
    setShowOnlyManagedTalks(!showOnlyManagedTalks);
  };

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
                  // setSearchQuery(''); // Optional: Clear search when changing day
                }}
                selectedDay={day}
              />
            </View>
          ),

          headerRight: () => (
            <TouchableOpacity
              className="flex-row items-center p-4"
              onPress={handleShowOnlyManagedTalks}
            >
              <Svg
                width={41 / 2}
                height={35 / 2}
                fill="none"
                viewBox="0 0 41 35"
              >
                <Path
                  fill={showOnlyManagedTalks ? '#007AFF' : '#000'}
                  d="M16.532 8.27c0-4.235 3.445-7.68 7.679-7.68s7.678 3.445 7.678 7.68c0 4.233-3.444 7.678-7.678 7.678s-7.679-3.445-7.679-7.679Zm7.679 9.648c-9.383 0-16.66 5.582-16.66 10.384 0 5.435 8.007 6.184 16.66 6.184s16.66-.749 16.66-6.184c0-4.802-7.278-10.384-16.66-10.384Zm-13.608.753c.4 0 .799-.125 1.139-.372a1.927 1.927 0 0 0 .771-1.897l-.448-2.612 1.898-1.85c.532-.519.72-1.28.49-1.988a1.928 1.928 0 0 0-1.565-1.32l-2.623-.38-1.172-2.377a1.929 1.929 0 0 0-1.74-1.08c-.743 0-1.41.413-1.739 1.08L4.442 8.251l-2.623.381a1.93 1.93 0 0 0-1.565 1.32 1.928 1.928 0 0 0 .49 1.989l1.898 1.85-.448 2.612c-.126.733.17 1.46.772 1.896a1.93 1.93 0 0 0 2.042.148l2.346-1.234 2.345 1.233c.287.15.596.225.904.225Z"
                />
              </Svg>
            </TouchableOpacity>
          ),
        }}
      />

      <ScheduleListView items={displayedItems} searchInput={searchInput} />
    </View>
  );
}
