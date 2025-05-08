import { View, Text, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { graphql, readFragment } from "@/graphql";
import { useSuspenseQuery } from "@apollo/client";
import { SPEAKERS_FRAGMENT } from "..";
import { Image } from "expo-image";
import { useCurrentConference } from "@/hooks/use-current-conference";

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
      className="flex-1"
      // TODO: figure out how to get these programmatically
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <Stack.Screen options={{ title: speaker.fullName }} />
      {speaker.participant?.photo && (
        <View className="border-b-2 border-black">
          <Image
            source={{ uri: speaker.participant?.photo }}
            style={{
              width: "100%",
              aspectRatio: 1,
            }}
          />
        </View>
      )}
      <Text className="text-4xl font-bold p-4 border-b-2 border-black">
        {speaker.fullName}
      </Text>
      {speaker.participant?.bio && (
        <Text className="p-4">{speaker.participant?.bio}</Text>
      )}
    </ScrollView>
  );
}
