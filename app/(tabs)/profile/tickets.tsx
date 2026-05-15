import { type FragmentOf, graphql, readFragment } from '@/graphql';
import { useCurrentConference } from '@/hooks/use-current-conference';
import { useSuspenseQuery } from '@apollo/client';
import { ScrollView, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

const USER_TICKETS_FRAGMENT = graphql(`
  fragment UserTickets on User {
    tickets(conference: $conferenceCode, language: "en") {
      id
      hashid
      attendeeName {
        scheme
        parts
      }
      attendeeEmail
      secret
      variation
      role
      item {
        id
        name
        language
        description
        category
        admission
        variations {
          id
          value
        }
        questions {
          id
          hidden
          answer {
            answer
            options
          }
          name
          options {
            id
            name
          }
        }
      }
    }
  }
`);

const USER_PROFILE_QUERY = graphql(
  `
  query UserTickets($conferenceCode: String!) {
    me {
      ...UserTickets
    }
  }
`,
  [USER_TICKETS_FRAGMENT],
);

const getAttendeeName = (
  attendeeName: {
    scheme: string;
    // biome-ignore lint/suspicious/noExplicitAny: pretix api :)
    parts: any;
  } | null,
) => {
  if (!attendeeName) {
    return 'Unknown';
  }

  if (attendeeName.scheme !== 'given_family') {
    return 'Unknown';
  }

  return `${attendeeName.parts.given_name} ${attendeeName.parts.family_name}`;
};

const TicketList = ({
  data,
}: { data: FragmentOf<typeof USER_TICKETS_FRAGMENT> }) => {
  const { tickets } = readFragment(USER_TICKETS_FRAGMENT, data);

  return (
    <View className="mt-4">
      <Text className="font-bold text-4xl mb-2">Your tickets:</Text>

      {tickets.map((ticket) => (
        <View key={ticket.id} className="flex">
          <Text className="text-2xl font-bold">
            {getAttendeeName(ticket.attendeeName)}
          </Text>
          <Text className="text-2xl mb-2">{ticket.item.name}</Text>

          <QRCode value={ticket.secret} size={200} />
        </View>
      ))}
    </View>
  );
};

export default function Profile() {
  const { code } = useCurrentConference();

  const { data } = useSuspenseQuery(USER_PROFILE_QUERY, {
    variables: {
      conferenceCode: code,
    },
    errorPolicy: 'ignore',
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <ScrollView className="flex-1 px-4" contentContainerClassName="pt-4">
        {data?.me ? (
          <TicketList data={data.me} />
        ) : (
          <Text className="mt-4 text-lg">No tickets available.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
