import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
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

export const USER_PROFILE_QUERY = graphql(
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
    <View style={styles.profileInfoContainer}>
      <Text style={styles.greetingText}>Hello {fullName}</Text>

      <View style={styles.infoSection}>
        <Text style={styles.infoLabel}>Email</Text>
        <Text>{email}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoLabel}>Conference Roles</Text>
        <Text>
          {conferenceRoles.length > 0 ? conferenceRoles.join(', ') : 'None'}
        </Text>
      </View>

      {conferenceRoles.includes('STAFF') && (
        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>Feature Flags</Text>
          <Text>{JSON.stringify(posthog.getFeatureFlags())}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
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
    <SafeAreaView style={styles.safeArea}>
      <ProfileInfo data={data.me} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  profileInfoContainer: {
    padding: 16,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoSection: {
    gap: 8,
    marginTop: 16,
  },
  infoLabel: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 16,
  },
  // Other styles will be added later
});
