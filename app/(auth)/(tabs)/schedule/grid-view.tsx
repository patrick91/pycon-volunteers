import { clsx } from 'clsx';
import { View, Text, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SessionItem } from '@/components/session-item';
import { Link } from 'expo-router';
import type { DaySchedule } from '@/hooks/use-schedule';

export function ScheduleGridView({
  schedule,
}: {
  schedule: DaySchedule;
}) {
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
                {item.map(({ session, width, left }) => {
                  const isRoomChange = session.title
                    .toLowerCase()
                    .includes('room change');
                  const borderWidth = isRoomChange ? 0 : 2;

                  return (
                    <Link
                      href={`/schedule/${session.slug}`}
                      key={session.id}
                      style={{
                        width: width + 4,
                        left: left - 4,
                        height: '100%',
                        borderLeftWidth: borderWidth,
                        borderRightWidth: borderWidth,
                        marginRight: -4,
                        borderColor: 'black',
                        position: 'absolute',
                        backgroundColor: '#fce8de',
                      }}
                    >
                      <View
                        className={clsx('h-full w-full', {
                          'p-4': !isRoomChange,
                        })}
                      >
                        {isRoomChange ? null : (
                          <SessionItem session={session} />
                        )}
                      </View>
                    </Link>
                  );
                })}
              </View>
            );
          }}
          getItemType={(item) => {
            return typeof item === 'string' ? 'sectionHeader' : 'row';
          }}
          estimatedItemSize={100}
        />
      </View>
    </ScrollView>
  );
}
