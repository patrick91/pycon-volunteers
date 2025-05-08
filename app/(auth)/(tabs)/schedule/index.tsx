import { Stack, Link } from 'expo-router';
import { DaySelector } from '@/components/day-selector';

import { type Item, SessionItem } from '@/components/session-item';
import { useSchedule, type DaySchedule } from '@/hooks/use-schedule';
import { LegendList } from '@legendapp/list';
import { parseISO } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { Text, TextInput, View, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

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

function ScheduleListView({ schedule }: { schedule: DaySchedule }) {
  const [searchQuery, setSearchQuery] = useState('');

  const { searchAllTalks } = useSchedule();

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
        <View style={styles.timeHeaderContainer}>
          <Text style={styles.timeHeaderText}>
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
      <Link href={`/schedule/${session.slug}`} style={styles.sessionLink}>
        <SessionItem session={session} />
      </Link>
    );
  }, []);

  return (
    <LegendList
      style={styles.legendList}
      contentContainerStyle={{ paddingBottom: 86 }}
      data={flatScheduleItems}
      getEstimatedItemSize={(index, item) => {
        if (item.type === 'time_header') {
          return 60;
        }

        return 140;
      }}
      keyExtractor={keyExtractor}
      recycleItems
      ListHeaderComponent={
        <View style={styles.listHeaderContainer}>
          <FontAwesome name="search" size={24} color="black" />
          <TextInput
            placeholder="Search talks and speakers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
        </View>
      }
      renderItem={renderItem}
    />
  );
}
export default function SchedulePage() {
  const defaultDay = '2025-05-29';

  const { days, schedule } = useSchedule();

  const today = new Date().toISOString().split('T')[0];

  const isTodayAConference = days.map((day) => day.dayString).includes(today);

  const [day, setDay] = useState(isTodayAConference ? today : defaultDay);

  const daySchedule = schedule[day];

  return (
    <View style={styles.schedulePageContainer}>
      <Stack.Screen
        options={{
          title: 'Schedule',
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              <DaySelector
                days={days}
                onDayChange={(newDay) => {
                  setDay(newDay);
                }}
                selectedDay={day}
              />
            </View>
          ),
        }}
      />
      {daySchedule ? (
        <ScheduleListView schedule={daySchedule} />
      ) : (
        <View style={styles.noScheduleContainer}>
          <Text>No schedule data available.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  timeHeaderContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'black',
  },
  timeHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sessionLink: {
    padding: 16,
    minHeight: 120,
    borderBottomWidth: 2,
    borderBottomColor: 'black',
    width: '100%',
  },
  legendList: {
    flex: 1,
    backgroundColor: '#FAF5F3',
  },
  listHeaderContainer: {
    borderBottomWidth: 2,
    borderBottomColor: 'black',
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 12,
    paddingVertical: 16,
    flex: 1,
  },
  schedulePageContainer: {
    flex: 1,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noScheduleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
