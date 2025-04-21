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
  session: Item;
  variant?: 'list' | 'grid';
};

export function SessionItem({ session, variant = 'grid' }: SessionItemProps) {
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

  return (
    <View className="flex-1">
      <Text
        className={clsx('font-sans-semibold', {
          'text-xl': variant === 'list',
        })}
        numberOfLines={2}
      >
        {session.title}
      </Text>
      <Text
        className={clsx('font-sans', {
          'mb-4': variant === 'list',
        })}
      >
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

          <Text className="font-sans-semibold flex-1">
            {session.speakers.map((speaker) => speaker.fullName).join(', ')}
          </Text>
        </View>
      </View>
    </View>
  );
}
