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

import { graphql } from '@/graphql';
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
export default function ContactsFlashList() {
  const { data } = useSuspenseQuery(SCHEDULE_QUERY);

  type Item = (typeof data.conference.days)[0]['slots'][0]['items'][0];

  const day = data.conference.days[1];

  const sessionsByRoomId = day.slots.reduce(
    (acc, slot) => {
      for (const item of slot.items) {
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

  const rooms = day.rooms.flatMap((room) => {
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

  return (
    <ScrollView horizontal className="flex-1 bg-red-200 pb-24">
      <FlashList
        className="w-[2000px]"
        data={rooms}
        renderItem={({ item, target, index }) => {
          if (typeof item === 'string') {
            return (
              <Text
                className={clsx('font-sans-semibold bg-white border-b-4 p-4', {
                  'border-t-4': target === 'StickyHeader' || index === 0,
                })}
              >
                {item}
              </Text>
            );
          }

          return (
            <View className="flex-row h-36 border-b-4">
              {item.map((session, index) => (
                <View className="border-r-4 h-100 p-4" key={index}>
                  <Text className="font-sans">{session.title}</Text>
                </View>
              ))}
            </View>
          );
        }}
        stickyHeaderIndices={stickyHeaderIndices}
        getItemType={(item) => {
          // To achieve better performance, specify the type based on the item
          return typeof item === 'string' ? 'sectionHeader' : 'row';
        }}
        estimatedItemSize={100}
      />
    </ScrollView>
  );
}
