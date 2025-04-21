import { View, Text, SafeAreaView } from 'react-native';
import { graphql, readFragment, type FragmentOf } from '@/graphql';
import { useSuspenseQuery } from '@apollo/client';
import { useSession } from '@/context/auth';
import { Button } from '@/components/ui/button';

export const USER_PROFILE_FRAGMENT = graphql(`
  fragment UserProfile on User {
    id
    email
    fullName
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
  const { signOut } = useSession();

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

      <Button className="mt-4" onPress={() => signOut()}>
        Sign Out
      </Button>
    </View>
  );
};

export default function Profile() {
  const { data } = useSuspenseQuery(USER_PROFILE_QUERY);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ProfileInfo data={data.me} />
    </SafeAreaView>
  );
}
