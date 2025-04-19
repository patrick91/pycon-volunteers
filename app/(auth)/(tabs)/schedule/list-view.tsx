import { View, Text, ScrollView } from 'react-native';
import { useSchedule } from '@/hooks/use-schedule';
import { SessionItem } from '@/components/session-item';
import { Link } from 'expo-router';
import { parseISO } from 'date-fns';
import type { Item } from '@/components/session-item';

export function ScheduleListView() {
  const { schedule } = useSchedule(1);

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
    <ScrollView className="flex-1 bg-[#FAF5F3]">
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
          {slot.sessions.map((session) => (
            <Link
              key={session.id}
              href={`/schedule/${session.slug}`}
              className="border-b border-gray-200 last:border-b-0"
            >
              <View className="p-4 bg-[#FCE8DE]">
                <SessionItem session={session} />
              </View>
            </Link>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
