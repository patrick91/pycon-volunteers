import { type FragmentOf, graphql, readFragment } from '@/graphql';
import { useSuspenseQuery } from '@apollo/client';
import { Link, useLocalSearchParams, Stack } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Timer } from '@/components/timer';

import { useSchedule } from '@/hooks/use-schedule';
import { parseISO, isAfter, isEqual } from 'date-fns';
import { SessionItem } from '@/components/session-item';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { useTalkConfiguration } from '@/context/talk-configuration';
import { isLiveActivityRunning } from '@/modules/activity-controller';
import {
  startLiveActivity,
  stopLiveActivity,
} from '@/modules/activity-controller';

export const SPEAKERS_FRAGMENT = graphql(
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
        <Link
          href={`./speaker/${speaker.id}`}
          key={speaker.id}
          relativeToDirectory
        >
          <View className="flex-row gap-2 pr-4 border-b-2">
            <View className="border-r-2">
              {speaker?.participant?.photo ? (
                <Image
                  source={{ uri: speaker.participant?.photo }}
                  style={{ width: 80, height: 80, backgroundColor: '#f0c674' }}
                  contentFit="cover"
                />
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

  return nextSession;
};

function UpNextView({
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
  const nextSession = useNextSession(current);

  if (!nextSession) {
    return null;
  }

  return (
    <View className="px-4 mt-4 border-t-2 pt-4 gap-2">
      <Text className="text-2xl font-bold">Up next:</Text>
      <Link href={`/schedule/${nextSession.session.slug}`}>
        <View className="border-2 border-black p-3 min-h-[110px] bg-[#FCE8DE] w-full">
          <SessionItem session={nextSession.session} />
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

import * as TaskManager from 'expo-task-manager';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  async ({ data, error, executionInfo }) => {
    console.log('Received a notification in the background!');
    // Do something with the notification data
  },
);

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
Notifications.addNotificationReceivedListener((notification) => {
  console.log('Received a notification in the foreground!');
  // Do something with the notification data
});

export default function SessionPage() {
  const slug = useLocalSearchParams().slug as string;
  const code = 'pycon2025';
  const language = 'en';

  const { data } = useSuspenseQuery(TALK_QUERY, {
    variables: { slug, code, language },
  });

  const { talk } = data.conference;

  if (!talk) {
    throw new Error('Talk not found');
  }

  const [activityIsRunning, setActivityIsRunning] = useState(
    () => isLiveActivityRunning,
  );

  const handleStopLiveActivity = () => {
    stopLiveActivity();
  };

  const nextSession = useNextSession(talk);

  useEffect(() => {
    const setupNotifications = async () => {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      const now = new Date();
      const endTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
      const qaTime = new Date(now.getTime() + 1 * 60 * 1000); // 1 minute from now
      const roomChangeTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now

      // Ensure dates are properly formatted as ISO strings
      const formatDate = (date: Date) => {
        return date.toISOString().split('.')[0] + 'Z';
      };

      startLiveActivity({
        customString: talk.title,
        customNumber: 1,
        eventName: 'Q&A',
        endTime: formatDate(endTime),
        qaTime: formatDate(qaTime),
        roomChangeTime: formatDate(roomChangeTime),
        nextTalk: nextSession?.session.title,
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          data: {
            talkId: talk.id,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      });
    };

    setupNotifications();
  }, [talk.id, talk.title, nextSession?.session.title]);

  return (
    <ScrollView
      className="flex-1"
      // TODO: figure out how to get these programmatically
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <Stack.Screen options={{ title: talk.title }} />

      <View className="mb-4 border-b-2">
        <Timer event={talk} />
      </View>

      <View className="border-b-2 pb-4 px-4">
        <Text className="text-4xl font-bold">{talk.title}</Text>
      </View>

      <SpeakersView data={talk} />

      <TalkConfigurationView talk={talk} />

      <View className="mb-4 px-4 mt-4">
        <Text className="text-2xl font-bold">Elevator Pitch</Text>
        <Markdown>{talk.elevatorPitch}</Markdown>
      </View>

      <View className="flex-row gap-2 px-4 flex-1">
        <SectionButton title="Abstract" />
        <SectionButton title="Checklist" />
        <SectionButton title="Notes" />
      </View>

      <UpNextView current={talk} />
    </ScrollView>
  );
}
