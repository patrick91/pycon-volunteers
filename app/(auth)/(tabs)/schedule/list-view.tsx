import { View, Text, ScrollView } from 'react-native';
import type { DaySchedule } from '@/hooks/use-schedule';
import { SessionItem, type Item } from '@/components/session-item';
import { Link } from 'expo-router';
import { parseISO } from 'date-fns';
import clsx from 'clsx';

export function ScheduleListView({
  schedule,
}: {
  schedule: DaySchedule;
}) {
  // Group sessions by time
  const sessionsByTime = schedule.rooms.reduce(
    (acc, room) => {
      if (typeof room === 'string') return acc;

      for (const { session } of room.sessions) {
        const startTime = parseISO(session.start);
        const timeKey = startTime.toISOString();

        if (!acc[timeKey]) {
          acc[timeKey] = {
            time: startTime,
            sessions: [],
          };
        }

        // Check if this session is already in the time slot
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
      }

      return acc;
    },
    {} as Record<string, { time: Date; sessions: Item[] }>,
  );

  // Sort time slots
  const sortedTimeSlots = Object.values(sessionsByTime).sort(
    (a, b) => a.time.getTime() - b.time.getTime(),
  );

  return (
    <ScrollView
      className="flex-1 bg-[#FAF5F3]"
      contentContainerClassName="pb-[86px]"
    >
      {sortedTimeSlots.map((slot, index) => (
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
      ))}
    </ScrollView>
  );
}
