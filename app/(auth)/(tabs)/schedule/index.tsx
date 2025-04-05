import { clsx } from 'clsx';
import { View, Text, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSchedule } from '@/hooks/use-schedule';
import { SessionItem } from '@/components/session-item';

export default function ContactsFlashList() {
  const { schedule } = useSchedule(1);

  const listOfRoomsAndSessions = schedule.rooms.flatMap((room) => {
    return [room.name, room.sessions];
  });

  return (
    <ScrollView horizontal className="flex-1 bg-red-200 pb-24">
      <View
        className="flex-1 bg-blue-200"
        style={{ width: schedule.scheduleSize }}
      >
        <FlashList
          className={clsx('flex-1 bg-[#FAF5F3]')}
          data={listOfRoomsAndSessions}
          renderItem={({ item, target, index }) => {
            if (typeof item === 'string') {
              return (
                <Text
                  className={clsx(
                    'font-sans-semibold bg-white border-b-2 p-4',
                    {
                      'border-t-2': target === 'StickyHeader' || index === 0,
                    },
                  )}
                >
                  {item}
                </Text>
              );
            }

            return (
              <View className="flex-row h-36 border-b-2 relative">
                {item.map(({ session, width, left }) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    width={width}
                    left={left}
                  />
                ))}
              </View>
            );
          }}
          // stickyHeaderIndices={schedule.roomTitleIndices}
          getItemType={(item) => {
            return typeof item === 'string' ? 'sectionHeader' : 'row';
          }}
          estimatedItemSize={100}
        />
      </View>
    </ScrollView>
  );
}
