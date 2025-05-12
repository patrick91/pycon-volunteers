import { View, Text } from 'react-native';
import { graphql, type ResultOf } from '@/graphql';
import { Image } from 'expo-image';
import { getRoomText } from '@/utils/schedule/get-room-text';

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
      name
      type
    }
    type
    userIsTalkManager
    speakers {
      id
      fullName
      participant {
        id
        photo(size: "small")
      }
    }
  }
`);

export type Item = ResultOf<typeof ITEM_FRAGMENT>;

type SessionItemProps = {
  session: Item;
  rooms?: {
    name: string;
    type: string;
  }[];
};

export function SessionItem({ session, rooms }: SessionItemProps) {
  const start = new Date(session.start);

  const isTalkManager = session.userIsTalkManager;

  const roomText = getRoomText(session, rooms);

  return (
    <View className="w-full">
      {isTalkManager && (
        <View className="rounded-full bg-purple-400 absolute right-0 top-0 size-4" />
      )}

      {roomText && (
        <View className="flex-row gap-1 py-1">
          <Text className="font-light">{roomText}</Text>
        </View>
      )}
      <Text className="font-sans-semibold text-xl pr-8" numberOfLines={2}>
        {session.title}
      </Text>

      <View className="flex-row gap-2 mt-8">
        <View className="flex-row gap-2 flex-1 items-center">
          <View className="flex-row gap-2">
            {session.speakers.map((speaker, index) => (
              <View key={speaker.id}>
                {speaker.participant?.photo ? (
                  <Image
                    source={{
                      uri: speaker.participant?.photo,
                    }}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '100%',
                      borderColor: 'black',
                      borderWidth: 1,
                      marginLeft: index === 0 ? 0 : -16,
                    }}
                  />
                ) : (
                  <View className="size-8 rounded-full bg-gray-200 border-[1px] border-black" />
                )}
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
