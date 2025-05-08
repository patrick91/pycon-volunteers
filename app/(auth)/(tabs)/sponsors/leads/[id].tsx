import { UserProfile } from '@/components/sponsors/user-profile';
import { graphql } from '@/graphql';
import { useQuery } from '@apollo/client';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native';

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
    <SafeAreaView style={styles.flexOne}>
      <ScrollView style={styles.scrollView}>
        <UserProfile
          badgeId={data.badgeScan.id}
          attendee={data?.badgeScan?.attendee}
          notes={data?.badgeScan?.notes || ''}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
});
