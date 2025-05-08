import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { graphql, readFragment } from '@/graphql';
import { useSuspenseQuery } from '@apollo/client';
import { SPEAKERS_FRAGMENT } from '..';
import { Image } from 'expo-image';
import { useCurrentConference } from '@/hooks/use-current-conference';

const SPEAKERS_QUERY = graphql(
  `
    query Talk($slug: String!, $code: String!) {
      conference(code: $code) {
        id
        talk(slug: $slug) {
          id
          ...SpeakersFragment
        }
      }
    }
  `,
  [SPEAKERS_FRAGMENT],
);

export default function SpeakerPage() {
  const { slug, id } = useLocalSearchParams();
  const { code } = useCurrentConference();
  const { data } = useSuspenseQuery(SPEAKERS_QUERY, {
    variables: { slug: slug as string, code },
  });

  if (!data.conference.talk) {
    return <Text>Talk not found</Text>;
  }

  const { speakers } = readFragment(SPEAKERS_FRAGMENT, data.conference.talk);

  const speaker = speakers.find((speaker) => speaker.id === (id as string));

  if (!speaker) {
    return <Text>Speaker not found</Text>;
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <Stack.Screen options={{ title: speaker.fullName }} />
      {speaker.participant?.photo && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: speaker.participant?.photo || undefined }}
            style={styles.speakerImage}
          />
        </View>
      )}
      <Text style={styles.fullNameText}>{speaker.fullName}</Text>
      {speaker.participant?.bio && (
        <Text style={styles.bioText}>{speaker.participant?.bio}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    borderBottomWidth: 2,
    borderColor: 'black',
  },
  speakerImage: {
    width: '100%',
    aspectRatio: 1,
  },
  fullNameText: {
    fontSize: 36,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 2,
    borderColor: 'black',
  },
  bioText: {
    padding: 16,
  },
});
