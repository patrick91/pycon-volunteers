import { type FragmentOf, graphql, readFragment } from '@/graphql';
import { useSuspenseQuery } from '@apollo/client';
import { Link, useLocalSearchParams, Stack } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Timer } from '@/components/timer';
import { useFeatureFlag } from 'posthog-react-native';

import { useSchedule } from '@/hooks/use-schedule';
import { parseISO, isAfter, isEqual } from 'date-fns';
import { SessionItem } from '@/components/session-item';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import { Suspense, useEffect, useState } from 'react';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { useTalkConfiguration } from '@/context/talk-configuration';
import { isLiveActivityRunning } from '@/modules/activity-controller';
import {
  startLiveActivity,
  stopLiveActivity,
  updateLiveActivity,
} from '@/modules/activity-controller';
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
          <View style={styles.speakerItemContainer}>
            <View style={styles.speakerImageOuterContainer}>
              {speaker?.participant?.photoSmall ? (
                <Image
                  source={{ uri: speaker.participant?.photoSmall || undefined }}
                  style={styles.speakerImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.speakerImagePlaceholder} />
              )}
            </View>

            <View style={styles.speakerInfoContainer}>
              <Text style={styles.speakerName}>{speaker.fullName}</Text>
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
      style={styles.abstractButtonLink}
    >
      <Text style={styles.abstractButtonText}>Abstract</Text>
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
    <TouchableOpacity style={styles.sectionButtonTouchableOpacity}>
      <Text style={styles.sectionButtonText}>{title}</Text>
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

  const room = day.rooms.find(
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
    <View style={styles.upNextContainer}>
      <Text style={styles.upNextTitle}>Up next:</Text>
      <Link href={`/schedule/${nextSession.session.slug}`}>
        <View style={styles.upNextSessionItemWrapper}>
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
    <View style={styles.talkConfigContainer}>
      <TouchableOpacity onPress={() => setIsOpen(!isOpen)}>
        <View style={styles.talkConfigHeader}>
          <Text style={styles.talkConfigTitle}>Talk Configuration</Text>
          <View style={styles.flexOne} />
          <Text style={styles.talkConfigToggleText}>
            {isOpen ? '👆' : '👇'}
          </Text>
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.talkConfigContent}>
          <BouncyCheckbox
            size={25}
            fillColor="black"
            text="Has Q&A"
            textStyle={styles.bouncyCheckboxText}
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
import { useSession } from '@/context/auth';
import { NowProvider } from '@/components/timer/context';

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

export function Session() {
  const slug = useLocalSearchParams().slug as string;
  const { code } = useCurrentConference();
  const language = 'en';
  const enableLiveActivity = useFeatureFlag('enable-live-activity');

  const { user } = useSession();

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
    if (enableLiveActivity === undefined) {
      return;
    }

    if (!enableLiveActivity) {
      console.log('Live activity is disabled');

      return;
    }

    console.log('Live activity is enabled');

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
      const qaTime = new Date(now.getTime() + 0.5 * 60 * 1000); // 1 minute from now
      const roomChangeTime = new Date(now.getTime() + 1 * 60 * 1000); // 2 minutes from now

      // Ensure dates are properly formatted as ISO strings
      const formatDate = (date: Date) => {
        return `${date.toISOString().split('.')[0]}Z`;
      };

      // Check if a Live Activity is already running
      if (isLiveActivityRunning()) {
        // Update the existing activity
        await updateLiveActivity({
          sessionTitle: talk.title,
          endTime: formatDate(endTime),
          qaTime: formatDate(qaTime),
          roomChangeTime: formatDate(roomChangeTime),
          nextTalk: nextSession?.session.title,
        });
      } else {
        // Start a new activity
        await startLiveActivity({
          sessionTitle: talk.title,
          endTime: formatDate(endTime),
          qaTime: formatDate(qaTime),
          roomChangeTime: formatDate(roomChangeTime),
          nextTalk: nextSession?.session.title,
        });
      }

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
  }, [talk.id, talk.title, nextSession?.session.title, enableLiveActivity]);

  return (
    <ScrollView
      style={styles.flexOne}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <Stack.Screen options={{ title: talk.title }} />

      <View style={styles.timerContainer}>
        <NowProvider>
          <Timer event={talk} />
        </NowProvider>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.mainTitleText}>{talk.title}</Text>
      </View>

      <SpeakersView data={talk} />

      {user?.canSeeTalkTimer && <TalkConfigurationView talk={talk} />}

      <View style={styles.elevatorPitchContainer}>
        <Text style={styles.elevatorPitchTitle}>Elevator Pitch</Text>
        <Markdown>{talk.elevatorPitch}</Markdown>
      </View>

      <View style={styles.abstractButtonContainer}>
        <AbstractButton abstract={talk.abstract} />
      </View>

      <UpNextView current={talk} />
    </ScrollView>
  );
}

function Skeleton() {
  const { user } = useSession();

  return (
    <View style={styles.flexOne}>
      <Stack.Screen options={{ title: 'Loading...' }} />

      <View style={styles.skeletonBorderBottom}>
        <View style={styles.skeletonTimerBar} />
      </View>

      {/* Speakers skeleton */}
      <View style={styles.skeletonBorderBottom}>
        {[1, 2].map((i) => (
          <View key={i} style={styles.skeletonSpeakerItem}>
            <View style={styles.skeletonSpeakerImageContainer}>
              <View style={styles.skeletonSpeakerImage} />
            </View>
            <View style={styles.skeletonSpeakerInfo}>
              <View style={styles.skeletonTextShort} />
              <View style={styles.skeletonTextLong} />
            </View>
          </View>
        ))}
      </View>

      {/* Talk Configuration skeleton */}
      {user?.canSeeTalkTimer && (
        <View style={styles.skeletonTalkConfigContainer}>
          <View style={styles.skeletonHeaderTitle} />
        </View>
      )}

      {/* Elevator Pitch skeleton */}
      <View style={styles.skeletonElevatorPitchContainer}>
        <View style={styles.skeletonElevatorPitchTitle} />
        <View style={styles.skeletonTextFull} />
        <View style={styles.skeletonTextMedium} />
        <View style={styles.skeletonTextShorter} />
      </View>

      {/* Section buttons skeleton */}
      <View style={styles.skeletonSectionButtonsContainer}>
        <View style={styles.skeletonSectionButton} />
        <View style={styles.skeletonSectionButton} />
        <View style={styles.skeletonSectionButton} />
      </View>

      {/* Up Next skeleton */}
      <View style={styles.skeletonUpNextContainer}>
        <View style={styles.skeletonUpNextTitle} />
        <View style={styles.skeletonUpNextCard}>
          <View style={styles.skeletonTextMediumBold} />
          <View style={styles.skeletonTextShort} />
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

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  speakerItemContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
    borderBottomWidth: 2,
  },
  speakerImageOuterContainer: {
    borderRightWidth: 2,
  },
  speakerImage: {
    width: 80,
    height: 80,
    backgroundColor: '#f0c674',
  },
  speakerImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#f0c674',
  },
  speakerInfoContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  speakerName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  abstractButtonLink: {
    backgroundColor: '#FCE8DE',
    padding: 16,
    borderWidth: 2,
    borderColor: 'black',
  },
  abstractButtonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionButtonTouchableOpacity: {
    backgroundColor: '#FCE8DE',
    padding: 16,
    borderWidth: 2,
    borderColor: 'black',
  },
  sectionButtonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  upNextContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    borderTopWidth: 2,
    paddingTop: 16,
    gap: 8,
  },
  upNextTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  upNextSessionItemWrapper: {
    borderWidth: 2,
    borderColor: 'black',
    padding: 12,
    minHeight: 110,
    backgroundColor: '#FCE8DE',
    width: '100%',
  },
  talkConfigContainer: {
    borderBottomWidth: 2,
    paddingBottom: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  talkConfigHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  talkConfigTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  talkConfigToggleText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  talkConfigContent: {
    marginTop: 16,
  },
  bouncyCheckboxText: {
    color: 'black',
    textDecorationLine: 'none',
    fontSize: 16,
  },
  timerContainer: {
    marginBottom: 16,
    borderBottomWidth: 2,
  },
  titleContainer: {
    borderBottomWidth: 2,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  mainTitleText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  elevatorPitchContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  elevatorPitchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  abstractButtonContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  skeletonBorderBottom: {
    borderBottomWidth: 2,
  },
  skeletonTimerBar: {
    height: 64,
    backgroundColor: '#E5E7EB',
  },
  skeletonSpeakerItem: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
    borderBottomWidth: 2,
  },
  skeletonSpeakerImageContainer: {
    borderRightWidth: 2,
  },
  skeletonSpeakerImage: {
    width: 80,
    height: 80,
    backgroundColor: '#E5E7EB',
  },
  skeletonSpeakerInfo: {
    flex: 1,
    paddingVertical: 8,
  },
  skeletonTextShort: {
    height: 24,
    width: '50%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTextLong: {
    height: 16,
    width: '75%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonTalkConfigContainer: {
    borderBottomWidth: 2,
    paddingBottom: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  skeletonHeaderTitle: {
    height: 32,
    width: '50%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonElevatorPitchContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  skeletonElevatorPitchTitle: {
    height: 32,
    width: '33.3333%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 16,
  },
  skeletonTextFull: {
    height: 16,
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTextMedium: {
    height: 16,
    width: '83.3333%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTextShorter: {
    height: 16,
    width: '66.6667%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonSectionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    flex: 1,
  },
  skeletonSectionButton: {
    height: 48,
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonUpNextContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    borderTopWidth: 2,
    paddingTop: 16,
    gap: 8,
  },
  skeletonUpNextTitle: {
    height: 32,
    width: '25%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonUpNextCard: {
    borderWidth: 2,
    borderColor: 'black',
    padding: 12,
    minHeight: 110,
    backgroundColor: '#F3F4F6',
    width: '100%',
  },
  skeletonTextMediumBold: {
    height: 24,
    width: '75%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
});
