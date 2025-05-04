import { View, Text, SafeAreaView } from 'react-native';
import { graphql, readFragment, type FragmentOf } from '@/graphql';
import { useSuspenseQuery } from '@apollo/client';
import { useSession } from '@/context/auth';
import { Button } from '@/components/form/button';
import { usePostHog } from 'posthog-react-native';
import { useCurrentConference } from '@/hooks/use-current-conference';

export const USER_PROFILE_FRAGMENT = graphql(`
  fragment UserProfile on User {
    id
    email
    fullName
    conferenceRoles(conferenceCode: $conferenceCode)
  }
`);

const USER_PROFILE_QUERY = graphql(
  `
  query UserProfile($conferenceCode: String!) {
    me {
      ...UserProfile
    }
  }
`,
  [USER_PROFILE_FRAGMENT],
);

const ProfileInfo = ({
  data,
}: { data: FragmentOf<typeof USER_PROFILE_FRAGMENT> }) => {
  const { signOut, isSigningOut } = useSession();
  const posthog = usePostHog();

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
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ProfileInfo data={data.me} />
    </SafeAreaView>
  );
}
