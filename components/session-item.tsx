import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { graphql, type ResultOf } from '@/graphql';
import { Image, type ImageSource } from 'expo-image';

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
        id
        photo(size: "small")
      }
    }
  }
`);

export type Item = ResultOf<typeof ITEM_FRAGMENT>;

type SessionItemProps = {
  session: Item;
};

export function SessionItem({ session }: SessionItemProps) {
  const router = useRouter();
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
    <View style={styles.container}>
      <Text style={styles.titleText} numberOfLines={2}>
        {session.title}
      </Text>
      <Text style={styles.timeText}>
        {formattedStart} - {formattedEnd}
      </Text>

      <View style={styles.speakersRowContainer}>
        <View style={styles.speakerImagesAndNamesContainer}>
          <View style={styles.speakerImagesInnerContainer}>
            {session.speakers.map((speaker, index) => (
              <View key={speaker.id}>
                <Image
                  source={{ uri: speaker.participant?.photo || undefined }}
                  style={[
                    styles.speakerImage,
                    { marginLeft: index === 0 ? 0 : -16 },
                  ]}
                />
              </View>
            ))}
          </View>

          <Text style={styles.speakerNamesText}>
            {session.speakers.map((speaker) => speaker.fullName).join(', ')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  titleText: {
    fontFamily: 'sans-semibold',
    fontSize: 20,
  },
  timeText: {
    fontFamily: 'sans',
    marginBottom: 16,
  },
  speakersRowContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
  },
  speakerImagesAndNamesContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    alignItems: 'center',
  },
  speakerImagesInnerContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  speakerImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderColor: 'black',
    borderWidth: 1,
  },
  speakerNamesText: {
    fontFamily: 'sans-semibold',
    flex: 1,
  },
});
