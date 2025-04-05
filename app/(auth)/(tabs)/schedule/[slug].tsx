import { graphql } from '@/graphql';
import { useSuspenseQuery } from '@apollo/client';
import { useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import Markdown from 'react-native-markdown-display';
import { Timer } from '@/components/timer';
import { useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { SpeakerImage } from '@/components/speaker-image';

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
    }
  }
  `,
);

const SectionButton = ({ title }: { title: string }) => {
  return (
    <TouchableOpacity className="bg-orange-800 p-4 rounded-md">
      <Text className="text-white text-lg font-bold">{title}</Text>
    </TouchableOpacity>
  );
};

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
    <ScrollView className="flex-1">
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

      {talk.speakers.map((speaker) => (
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

      <View className="mb-4 px-4 mt-4">
        <Text className="text-2xl font-bold">Elevator Pitch</Text>
        <Markdown>{talk.elevatorPitch}</Markdown>
      </View>

      {/* Section buttons */}
      <View className="flex-row gap-2">
        <SectionButton title="ABSTRACT" />
        <SectionButton title="CHECKLIST" />
        <SectionButton title="NOTES" />
      </View>
    </ScrollView>
  );
}
