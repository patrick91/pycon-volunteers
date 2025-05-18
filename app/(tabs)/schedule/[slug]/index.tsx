import { Timer } from '@/components/timer';
import { type FragmentOf, graphql, readFragment } from '@/graphql';
import { useSuspenseQuery } from '@apollo/client';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { SessionItem } from '@/components/session-item';
import { NowProvider } from '@/components/timer/context';
import { useSession } from '@/context/auth';
import { useTalkConfiguration } from '@/context/talk-configuration';
import { useSchedule } from '@/hooks/use-schedule';
import { useTalkManagerNotifications } from '@/hooks/use-talk-manager-notifications';
import { getRoomText } from '@/utils/schedule/get-room-text';
import { isAfter, isEqual, parseISO } from 'date-fns';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import { Suspense, useState } from 'react';
import BouncyCheckbox from 'react-native-bouncy-checkbox';

import { useCurrentConference } from '@/hooks/use-current-conference';

export const SPEAKERS_FRAGMENT = graphql(`
  fragment SpeakersFragment on ScheduleItem {
    speakers {
      id
      fullName
      participant {
        id
        photo
        photoSmall: photo(size: "small")
        bio
        twitterHandle
        instagramHandle
        linkedinUrl
        facebookUrl
        mastodonHandle
        website
      }
    }
  }
`);

function SpeakersView({
  data,
}: {
  data: FragmentOf<typeof SPEAKERS_FRAGMENT>;
}) {
  const { speakers } = readFragment(SPEAKERS_FRAGMENT, data);

  return (
    <>
      {speakers.map((speaker) => (
        <Link
          href={`./speaker/${speaker.id}`}
          key={speaker.id}
          relativeToDirectory
        >
          <View className="flex-row pr-4 border-b-2">
            <View className="border-r-2 bg-red-500 w-[82px] h-[80px]">
              {speaker?.participant?.photoSmall ? (
                <Image
                  source={{ uri: speaker.participant?.photoSmall }}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                  contentFit="cover"
                />
              ) : (
                <View className="size-full bg-[#f0c674]" />
              )}
            </View>

            <View className="flex-1 pl-2 py-2 h-[80px]">
              <Text className="text-xl font-bold">{speaker.fullName}</Text>
              <Text numberOfLines={2}>
                {speaker.participant?.bio || 'No bio available'}
              </Text>
            </View>
          </View>
        </Link>
      ))}
    </>
  );
}

function AbstractButton({ abstract }: { abstract: string }) {
  return (
    <Link
      href="./abstract"
      relativeToDirectory
      className="bg-[#FCE8DE] p-4 border-2 border-black"
    >
      <Text className="text-black text-lg font-bold">Abstract</Text>
    </Link>
  );
}

const TALK_QUERY = graphql(
  `
    query Talk($slug: String!, $code: String!, $language: String!) {
      conference(code: $code) {
        id
        talk(slug: $slug) {
          id
          title
          type
          image
          highlightColor
          description
          elevatorPitch
          hasLimitedCapacity
          spacesLeft
          hasSpacesLeft
          slidoUrl
          youtubeVideoId

          abstract
          elevatorPitch

          start
          end

          rooms {
            id
            name
            type
          }

          language {
            code
          }

          submission {
            id
            abstract(language: $language)
            elevatorPitch(language: $language)

            duration {
              id
              duration
            }

            audienceLevel {
              id
              name
            }

            topic {
              name
            }

            tags {
              name
              id
            }
          }

          ...SpeakersFragment
        }
      }
    }
  `,
  [SPEAKERS_FRAGMENT],
);

const SectionButton = ({ title }: { title: string }) => {
  return (
    <TouchableOpacity className="bg-[#FCE8DE] p-4 border-2 border-black">
      <Text className="text-black text-lg font-bold">{title}</Text>
    </TouchableOpacity>
  );
};

const useNextSession = (current: {
  start: string;
  end: string;
  rooms: {
    name: string;
  }[];
}) => {
  const { schedule } = useSchedule();

  const dayString = current.start.split('T')[0];

  const day = schedule[dayString];

  const currentRoom = current.rooms[0].name;

  const currentEnd = parseISO(current.end);

  const nextSession = day.items.find((item) => {
    if (item.title.toLowerCase().includes('room change')) {
      return false;
    }

    const sessionStart = parseISO(item.start);

    // next talk should be in the same room
    if (item.rooms.length > 0 && item.rooms[0].name !== currentRoom) {
      return false;
    }

    return (
      isAfter(sessionStart, currentEnd) || isEqual(sessionStart, currentEnd)
    );
  });

  return nextSession;
};

function UpNextView({
  current,
  rooms,
}: {
  current: {
    start: string;
    end: string;
    rooms: {
      name: string;
    }[];
  };
  rooms: {
    name: string;
    type: string;
  }[];
}) {
  const nextSession = useNextSession(current);

  if (!nextSession) {
    return null;
  }

  return (
    <View className="px-4 mt-4 border-t-2 pt-4 gap-2">
      <Text className="text-2xl font-bold">Up next:</Text>
      <Link href={`/schedule/${nextSession.slug}`}>
        <View className="border-2 border-black p-3 min-h-[110px] bg-[#FCE8DE] w-full">
          <SessionItem session={nextSession} rooms={rooms} />
        </View>
      </Link>
    </View>
  );
}

function TalkConfigurationView({ talk }: { talk: { id: string } }) {
  const [isOpen, setIsOpen] = useState(false);
  const { hasQa, setHasQa } = useTalkConfiguration(talk.id);

  return (
    <View className="border-b-2 pb-4 pt-4 px-4">
      <TouchableOpacity onPress={() => setIsOpen(!isOpen)}>
        <View className="flex-row gap-2">
          <Text className="text-2xl font-bold">Talk Configuration</Text>
          <View className="flex-1" />
          <Text className="text-black text-lg font-bold">
            {isOpen ? '👆' : '👇'}
          </Text>
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View className="mt-4">
          <BouncyCheckbox
            size={25}
            fillColor="black"
            text="Has Q&A"
            textStyle={{
              color: 'black',
              textDecorationLine: 'none',
              fontSize: 16,
            }}
            isChecked={hasQa}
            useBuiltInState={false}
            innerIconStyle={{ borderWidth: 2 }}
            onPress={() => {
              setHasQa(!hasQa);
            }}
          />
        </View>
      )}
    </View>
  );
}

export function Session() {
  const slug = useLocalSearchParams().slug as string;
  const { code } = useCurrentConference();
  const language = 'en';

  const { user } = useSession();

  const { schedule } = useSchedule();

  const { data } = useSuspenseQuery(TALK_QUERY, {
    variables: { slug, code, language },
  });

  const { talk } = data.conference;

  if (!talk) {
    throw new Error('Talk not found');
  }

  const dayString = talk.start.split('T')[0];

  const day = schedule[dayString];

  const rooms = day?.rooms ?? [];

  const nextSession = useNextSession(talk);

  useTalkManagerNotifications({
    talk,
    nextSession,
  });

  return (
    <ScrollView
      className="flex-1"
      // TODO: figure out how to get these programmatically
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <Stack.Screen options={{ title: talk.title }} />

      <View className="mb-4 border-b-2">
        <NowProvider>
          <Timer event={talk} />
        </NowProvider>
      </View>

      <View className="border-b-2 pb-4 px-4 flex gap-2">
        <Text className="text-3xl font-bold">{talk.title}</Text>
        <Text className="text-md text-gray-800">
          Room: {getRoomText(talk, rooms)}
        </Text>
      </View>

      <SpeakersView data={talk} />

      {user?.canSeeTalkTimer && <TalkConfigurationView talk={talk} />}

      <View className="px-4 mt-4">
        <Text className="text-2xl font-bold">Elevator Pitch</Text>
        <Markdown>{talk.elevatorPitch}</Markdown>
      </View>

      <View className="px-4 mt-4 flex-row gap-2">
        <AbstractButton abstract={talk.abstract} />
      </View>

      <UpNextView current={talk} rooms={rooms} />
    </ScrollView>
  );
}

function Skeleton() {
  const { user } = useSession();

  return (
    <View className="flex-1">
      <Stack.Screen options={{ title: 'Loading...' }} />

      <View className="border-b-2">
        <View className="h-16 bg-gray-200" />
      </View>

      {/* Speakers skeleton */}
      <View className="border-b-2">
        {[1, 2].map((i) => (
          <View key={i} className="flex-row gap-2 pr-4 border-b-2">
            <View className="border-r-2">
              <View className="w-20 h-20 bg-gray-200" />
            </View>
            <View className="flex-1 py-2">
              <View className="h-6 w-1/2 bg-gray-200 rounded mb-2" />
              <View className="h-4 w-3/4 bg-gray-200 rounded" />
            </View>
          </View>
        ))}
      </View>

      {/* Talk Configuration skeleton */}
      {user?.canSeeTalkTimer && (
        <View className="border-b-2 pb-4 pt-4 px-4">
          <View className="h-8 w-1/2 bg-gray-200 rounded" />
        </View>
      )}

      {/* Elevator Pitch skeleton */}
      <View className="mb-4 px-4 mt-4">
        <View className="h-8 w-1/3 bg-gray-200 rounded mb-4" />
        <View className="h-4 w-full bg-gray-200 rounded mb-2" />
        <View className="h-4 w-5/6 bg-gray-200 rounded mb-2" />
        <View className="h-4 w-4/6 bg-gray-200 rounded" />
      </View>

      {/* Section buttons skeleton */}
      <View className="flex-row gap-2 px-4 flex-1">
        <View className="h-12 flex-1 bg-gray-200 rounded" />
        <View className="h-12 flex-1 bg-gray-200 rounded" />
        <View className="h-12 flex-1 bg-gray-200 rounded" />
      </View>

      {/* Up Next skeleton */}
      <View className="px-4 mt-4 border-t-2 pt-4 gap-2">
        <View className="h-8 w-1/4 bg-gray-200 rounded mb-2" />
        <View className="border-2 border-black p-3 min-h-[110px] bg-gray-100 w-full">
          <View className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
          <View className="h-4 w-1/2 bg-gray-200 rounded" />
        </View>
      </View>
    </View>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Session />
    </Suspense>
  );
}
