import { graphql } from '@/graphql';
import { useSuspenseQuery } from '@apollo/client';
import { useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import Markdown from 'react-native-markdown-display';

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
    <TouchableOpacity style={styles.sectionButton}>
      <Text style={styles.sectionButtonText}>{title}</Text>
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
    <ScrollView className="flex-1 p-4">
      <View className="mb-4">
        <Text>Timer here</Text>
      </View>
      <View className="mb-4">
        <Text className="text-4xl font-bold">{talk.title}</Text>
      </View>

      <View className="flex-row gap-2 mb-4">
        {talk.speakers.map((speaker) => (
          <View key={speaker.id} className="flex-row items-center gap-2">
            {speaker?.participant?.photo ? (
              <Image
                source={{ uri: speaker?.participant?.photo }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
              />
            ) : (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#f0c674',
                }}
              />
            )}

            <Text className="text-2xl font-bold">{speaker.fullName}</Text>
          </View>
        ))}
      </View>

      <View className="mb-4">
        <Text className="text-2xl">Elevator Pitch</Text>
        <Markdown>{talk.elevatorPitch}</Markdown>
      </View>

      {/* Section buttons */}
      <View style={styles.sectionButtonsContainer}>
        <SectionButton title="ABSTRACT" />
        <SectionButton title="CHECKLIST" />
        <SectionButton title="NOTES" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    marginTop: 10,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontWeight: '600',
    fontSize: 14,
  },
  titleContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 44,
    color: '#000',
  },
  speakerContainer: {
    backgroundColor: '#f8f0e3',
    padding: 20,
    borderRadius: 0,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#000',
  },
  speakerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  speakerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  descriptionContainer: {
    marginBottom: 30,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000',
  },
  sectionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    gap: 10,
  },
  sectionButton: {
    backgroundColor: '#f0c674',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#000',
    flex: 1,
    alignItems: 'center',
  },
  sectionButtonText: {
    fontWeight: 'bold',
    color: '#000',
  },
});
