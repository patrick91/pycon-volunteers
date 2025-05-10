import { UserProfile } from '@/components/sponsors/user-profile';
import { graphql } from '@/graphql';
import { useQuery } from '@apollo/client';
import { useLocalSearchParams, Stack } from 'expo-router';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';

const BADGE_SCAN_QUERY = graphql(`
  query BadgeScan($id: ID!) {
    badgeScan(id: $id) {
      id
      attendee {
        fullName
        email
      }
      notes
    }
  }
`);
export default function ScanPage() {
  const { id } = useLocalSearchParams();
  const { data, loading } = useQuery(BADGE_SCAN_QUERY, {
    variables: {
      id: id as string,
    },
  });

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!data || !data.badgeScan) {
    return <Text>No data</Text>;
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1 px-6">
        <Stack.Screen options={{ title: data.badgeScan.attendee.fullName }} />
        <UserProfile
          badgeId={data.badgeScan.id}
          attendee={data?.badgeScan?.attendee}
          notes={data?.badgeScan?.notes}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
