import { type FragmentOf, graphql, readFragment } from '@/graphql';
import { useSuspenseQuery } from '@apollo/client';
import { useLocalSearchParams, Stack } from 'expo-router';
import { View, Text, ScrollView } from 'react-native';
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
    <ScrollView className="flex-1">
      <View className="px-4 py-4">
        <Text className="text-2xl font-bold mb-4">{talk.title}</Text>
        <Markdown>{talk.abstract}</Markdown>
      </View>
    </ScrollView>
  );
}
