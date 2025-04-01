import { View, Text } from 'react-native';
import { clsx } from 'clsx';
import { Link } from 'expo-router';
import { graphql, type ResultOf } from '@/graphql';
import { Image } from 'expo-image';

export const ITEM_FRAGMENT = graphql(`
  fragment Item on ScheduleItem {
    id
    duration
    start
    end
    title
    slug
    rooms {
      id
    }
    type
    speakers {
      id
      fullName
      participant {
        photo
      }
    }
  }
`);

export type Item = ResultOf<typeof ITEM_FRAGMENT>;

type SessionItemProps = {
  width: number;
  left: number;
  session: Item;
};

export function SessionItem({ session, width, left }: SessionItemProps) {
  const start = new Date(session.start);
  const formattedStart = start.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const end = new Date(session.end);
  const formattedEnd = end.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isRoomChange = session.title.toLowerCase().includes('room change');

  return (
    <Link
      href={`/schedule/${session.slug}`}
      style={{
        width,
        left,
        position: 'absolute',
        transform: [{ translateX: -4 }],
      }}
    >
      <View
        className={clsx('border-l-4 h-full', {
          'p-4 bg-[#FCE8DE]': !isRoomChange,
        })}
        style={{
          width,
          position: 'absolute',
          transform: [{ translateX: -4 }],
        }}
      >
        {isRoomChange ? null : (
          <View className="flex-1">
            <Text className="font-sans-semibold" numberOfLines={2}>
              {session.title}
            </Text>
            <Text className="font-sans">
              {session.type}
              {left} - {formattedStart} - {formattedEnd}
            </Text>

            <View className="flex-row gap-2 mt-auto">
              <View className="flex-row gap-2 flex-1 items-center">
                <View className="flex-row gap-2">
                  {session.speakers.map((speaker, index) => (
                    <View key={speaker.id}>
                      <Image
                        source={{ uri: speaker.participant?.photo }}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '100%',
                          borderColor: 'black',
                          borderWidth: 1,
                          marginLeft: index === 0 ? 0 : -16,
                        }}
                      />
                    </View>
                  ))}
                </View>

                <Text className="font-sans-semibold">
                  {session.speakers
                    .map((speaker) => speaker.fullName)
                    .join(', ')}
                </Text>
              </View>
            </View>
          </View>
        )}
        <View className="w-1 bg-black absolute -right-1 top-0 bottom-0" />
      </View>
    </Link>
  );
}
