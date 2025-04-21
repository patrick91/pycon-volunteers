import { View, Text } from 'react-native';
import { graphql, readFragment, type FragmentOf } from '@/graphql';
import { useSuspenseQuery } from '@apollo/client';
import { useSession } from '@/context/auth';
import { Button } from '@/components/ui/button';

export const USER_PROFILE_FRAGMENT = graphql(`
  fragment UserProfile on User {
    id
    email
    conferenceRoles(conferenceCode: "pycon2025")
  }
`);

const USER_PROFILE_QUERY = graphql(
  `
  query UserProfile {
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
  const { email, conferenceRoles } = readFragment(USER_PROFILE_FRAGMENT, data);

  return (
    <View>
      <Text>{email}</Text>
      <Text>{conferenceRoles.join(', ')}</Text>
    </View>
  );
};

export default function Profile() {
  const { data } = useSuspenseQuery(USER_PROFILE_QUERY);
  const { signOut } = useSession();

  return (
    <View className="flex-1 bg-white">
      <Text>Profile</Text>
      <ProfileInfo data={data.me} />
      <Button onPress={() => signOut()}>Sign Out</Button>
    </View>
  );
}
