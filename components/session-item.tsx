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
  const borderWidth = isRoomChange ? 0 : 4;

  return (
    <Link
      href={`/schedule/${session.slug}`}
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
          <View className="flex-1">
            <Text className="font-sans-semibold" numberOfLines={2}>
              {session.title}
            </Text>
            <Text className="font-sans">
              {formattedStart} - {formattedEnd}
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
      </View>
    </Link>
  );
}
