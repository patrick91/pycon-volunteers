import { clsx } from 'clsx';
import {
  StyleSheet,
  View,
  Platform,
  Text,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { graphql, type ResultOf } from '@/graphql';
import { useSuspenseQuery } from '@apollo/client';

const SCHEDULE_QUERY = graphql(`
query Schedule {
  conference(code: "pycon2024") {
    days {
      rooms {
        id
        name
        type
      }
      id
      day
      slots {
        hour
        items {
          id
          duration
          start
          end
          title
          rooms {
            id
          }
        }
      }
    }
  }
}  
`);

function dateToMinutes(dateString: string) {
  const date = new Date(dateString);

  return date.getHours() * 60 + date.getMinutes();
}

function getDailySchedule(data: ResultOf<typeof SCHEDULE_QUERY>, day: number) {
  // TODO: get min start time
  const { slots, rooms: dayRooms } = data.conference.days[day];

  type Item = (typeof data.conference.days)[0]['slots'][0]['items'][0];

  let minStart = dateToMinutes(slots[0].items[0].start);
  let maxEnd = dateToMinutes(slots[0].items[0].end);

  const sessionsByRoomId = slots.reduce(
    (acc, slot) => {
      for (const originalItem of slot.items) {
        const item = { ...originalItem };

        minStart = Math.min(minStart, dateToMinutes(item.start));

        if (!item.duration) {
          // TODO: diff in minutes based on start and end instead of converting to minutes first
          item.duration = dateToMinutes(item.end) - dateToMinutes(item.start);

          console.log(
            'No duration for item',
            dateToMinutes(item.start),
            dateToMinutes(item.end),
          );
        }

        maxEnd = Math.max(maxEnd, dateToMinutes(item.start) + item.duration);

        for (const room of item.rooms) {
          if (!acc[room.id]) {
            acc[room.id] = [];
          }
          acc[room.id].push(item);
        }
      }
      return acc;
    },
    {} as Record<string, Array<Item>>,
  );

  const rooms = dayRooms.flatMap((room) => {
    return [room.name, sessionsByRoomId[room.id]];
  });

  const stickyHeaderIndices = rooms
    .map((item, index) => {
      if (typeof item === 'string') {
        return index;
      }
      return null;
    })
    .filter((item) => item !== null) as number[];

  const duration = maxEnd - minStart;

  return { rooms, stickyHeaderIndices, duration };
}

export default function ContactsFlashList() {
  const { data } = useSuspenseQuery(SCHEDULE_QUERY);

  const schedule = getDailySchedule(data, 1);

  const minutesToPixel = (minutes: number) => {
    return minutes * 8;
  };

  return (
    <ScrollView horizontal className="flex-1 bg-red-200 pb-24">
      <View
        className="flex-1 bg-blue-200"
        style={{ width: minutesToPixel(schedule.duration) }}
      >
        <FlashList
          className={clsx('flex-1 bg-blue-200')}
          data={schedule.rooms}
          renderItem={({ item, target, index }) => {
            if (typeof item === 'string') {
              return (
                <Text
                  className={clsx(
                    'font-sans-semibold bg-white border-b-4 p-4',
                    {
                      'border-t-4': target === 'StickyHeader' || index === 0,
                    },
                  )}
                >
                  {item}
                </Text>
              );
            }

            return (
              <View className="flex-row h-36 border-b-4">
                {item.map((session, index) => {
                  const start = new Date(session.start);
                  const formattedStart = start.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <View
                      className="border-r-4 h-100 p-4"
                      key={session.id}
                      style={{ width: minutesToPixel(session.duration) }}
                    >
                      <Text className="font-sans-semibold">
                        {session.title}
                      </Text>
                      <Text className="font-sans">{formattedStart}</Text>
                    </View>
                  );
                })}
              </View>
            );
          }}
          stickyHeaderIndices={schedule.stickyHeaderIndices}
          getItemType={(item) => {
            return typeof item === 'string' ? 'sectionHeader' : 'row';
          }}
          estimatedItemSize={100}
        />
      </View>
    </ScrollView>
  );
}
