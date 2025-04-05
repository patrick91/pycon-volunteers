import { type FragmentOf, graphql, readFragment } from '@/graphql';
import { useSuspenseQuery } from '@apollo/client';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Timer } from '@/components/timer';

import { SpeakerImage } from '@/components/speaker-image';
import { useSchedule } from '@/hooks/use-schedule';
import { parseISO, isAfter, isEqual } from 'date-fns';

const SPEAKERS_FRAGMENT = graphql(
  `fragment SpeakersFragment on ScheduleItem {
      speakers {
          id
          fullName
          participant {
            id
            photo
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
  `,
);

function SpeakersView({
  data,
}: { data: FragmentOf<typeof SPEAKERS_FRAGMENT> }) {
  const { speakers } = readFragment(SPEAKERS_FRAGMENT, data);

  return (
    <>
      {speakers.map((speaker) => (
        <View key={speaker.id} className="flex-row gap-2 pr-4 border-b-2">
          <View className="border-r-2">
            {speaker?.participant?.photo ? (
              <SpeakerImage imageUri={speaker.participant?.photo} size={80} />
            ) : (
              <View
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: '#f0c674',
                }}
              />
            )}
          </View>

          <View className="flex-1 py-2">
            <Text className="text-xl font-bold">{speaker.fullName}</Text>
            <Text numberOfLines={2}>{speaker.participant?.bio}</Text>
          </View>
        </View>
      ))}
    </>
  );
}

const TALK_QUERY = graphql(
  `query Talk($slug: String!, $code: String!, $language: String!) {
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
  
          materials {
            id
            name
            url
            fileUrl
            fileMimeType
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

function NextSessionView({
  current,
}: {
  current: {
    start: string;
    end: string;
    rooms: {
      name: string;
    }[];
  };
}) {
  // TODO: get the day from the session
  const { schedule } = useSchedule(1);

  const currentRoom = current.rooms[0].name;

  const room = schedule.rooms.find(
    (room) => !(room instanceof String) && room.name === currentRoom,
  );

  const currentEnd = parseISO(current.end);

  const nextSession = room?.sessions.find(({ session }) => {
    if (session.title.toLowerCase().includes('room change')) {
      return false;
    }

    const sessionStart = parseISO(session.start);

    return (
      isAfter(sessionStart, currentEnd) || isEqual(sessionStart, currentEnd)
    );
  });

  if (!nextSession) {
    return null;
  }

  return (
    <View className="px-4 mt-4">
      <Text className="text-2xl font-bold">Up next:</Text>
      <Text>{nextSession?.session.title}</Text>
    </View>
  );
}

export default function SessionPage() {
  const slug = useLocalSearchParams().slug as string;
  const code = 'pycon2025';
  const language = 'en';

  const { data } = useSuspenseQuery(TALK_QUERY, {
    variables: { slug, code, language },
  });

  if (!data.conference.talk) {
    return <Text>Talk not found</Text>;
  }

  const talk = data.conference.talk;

  return (
    <ScrollView
      className="flex-1"
      // TODO: figure out how to get these programmatically
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View className="mb-4 border-b-2">
        <Timer
          event={talk}
          liveEvent={{ id: 'dummy-id' }}
          onGoToNextTalk={() => {}}
        />
      </View>

      <View className="border-b-2 pb-4 px-4">
        <Text className="text-4xl font-bold">{talk.title}</Text>
      </View>

      <SpeakersView data={talk} />

      <View className="mb-4 px-4 mt-4">
        <Text className="text-2xl font-bold">Elevator Pitch</Text>
        <Markdown>{talk.elevatorPitch}</Markdown>
      </View>

      <View className="flex-row gap-2 px-4 flex-1">
        <SectionButton title="Abstract" />
        <SectionButton title="Checklist" />
        <SectionButton title="Notes" />
      </View>

      <NextSessionView current={talk} />
    </ScrollView>
  );
}
