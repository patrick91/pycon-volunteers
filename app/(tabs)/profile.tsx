import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { graphql, readFragment, type FragmentOf } from '@/graphql';
import { useSuspenseQuery } from '@apollo/client';
import { useSession } from '@/context/auth';
import { Button } from '@/components/form/button';
import { usePostHog } from 'posthog-react-native';
import { useCurrentConference } from '@/hooks/use-current-conference';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

export const USER_PROFILE_FRAGMENT = graphql(`
  fragment UserProfile on User {
    id
    email
    fullName
    conferenceRoles(conferenceCode: $conferenceCode)
  }
`);

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
  query UserProfile($conferenceCode: String!) {
    me {
      ...UserProfile
      ...UserTickets
    }
  }
`,
  [USER_PROFILE_FRAGMENT, USER_TICKETS_FRAGMENT],
);

const NotLoggedIn = () => {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center p-4">
      <Text className="text-2xl font-bold">Hi there!</Text>

      <Text className="text-sm text-gray-800 mb-4">
        You're not logged in. Please sign in to view your profile.
      </Text>

      <Button onPress={() => router.push('/sign-in')}>Sign In</Button>
    </View>
  );
};

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
      <Text className="font-bold">Tickets</Text>

      {tickets.map((ticket) => (
        <View key={ticket.id} className="flex gap-2">
          <Text>{getAttendeeName(ticket.attendeeName)}</Text>
          <Text>{ticket.item.name}</Text>

          <QRCode value={ticket.secret} size={200} />
        </View>
      ))}
    </View>
  );
};

const ProfileInfo = ({
  data,
}: {
  data?: FragmentOf<typeof USER_PROFILE_FRAGMENT> &
    FragmentOf<typeof USER_TICKETS_FRAGMENT>;
}) => {
  const { signOut, isSigningOut } = useSession();
  const posthog = usePostHog();

  if (!data) {
    return <NotLoggedIn />;
  }

  const { fullName, email, conferenceRoles } = readFragment(
    USER_PROFILE_FRAGMENT,
    data,
  );

  return (
    <View className="p-4">
      <Text className="text-2xl font-bold">Hello {fullName}</Text>

      <View className="flex gap-2 mt-4">
        <Text className="font-bold">Email</Text>
        <Text>{email}</Text>
      </View>

      <View className="flex gap-2 mt-4">
        <Text className="font-bold">Conference Roles</Text>
        <Text>
          {conferenceRoles.length > 0 ? conferenceRoles.join(', ') : 'None'}
        </Text>
      </View>

      {conferenceRoles.includes('STAFF') && (
        <View className="flex gap-2 mt-4">
          <Text className="font-bold">Feature Flags</Text>
          <Text>{JSON.stringify(posthog.getFeatureFlags())}</Text>
        </View>
      )}

      <TicketList data={data} />

      <View className="mt-4">
        <Text className="font-bold">
          App version: {Application.nativeApplicationVersion}
        </Text>
      </View>

      <View className="mt-4">
        <Button
          onPress={() => signOut()}
          disabled={isSigningOut}
          loading={isSigningOut}
        >
          Sign Out
        </Button>
      </View>
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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <ProfileInfo data={data?.me} />
      </ScrollView>
    </SafeAreaView>
  );
}
