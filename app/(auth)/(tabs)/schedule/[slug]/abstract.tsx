import { type FragmentOf, graphql, readFragment } from '@/graphql';
import { useSuspenseQuery } from '@apollo/client';
import { useLocalSearchParams, Stack } from 'expo-router';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useCurrentConference } from '@/hooks/use-current-conference';
const TALK_QUERY = graphql(
  `query Talk($slug: String!, $code: String!) {
    conference(code: $code) {
      id
      talk(slug: $slug) {
        id
        title
        abstract
      }
    }
  }
  `,
);

export default function Abstract() {
  const slug = useLocalSearchParams().slug as string;
  const { code } = useCurrentConference();

  const { data } = useSuspenseQuery(TALK_QUERY, {
    variables: { slug, code },
  });

  const { talk } = data.conference;

  if (!talk) {
    throw new Error('Talk not found');
  }

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.contentView}>
        <Text style={styles.titleText}>{talk.title}</Text>
        <Markdown>{talk.abstract}</Markdown>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentView: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});
