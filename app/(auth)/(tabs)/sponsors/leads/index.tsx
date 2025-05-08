import React, { useEffect } from 'react';
import { View, Text, SafeAreaView, Button, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Link, useNavigation } from 'expo-router';
import { graphql } from '@/graphql';
import { useQuery } from '@apollo/client';
import { useCurrentConference } from '@/hooks/use-current-conference';
const MY_LEADS_QUERY = graphql(`
  query MyLeads($conferenceCode: String!) {
    badgeScans(conferenceCode: $conferenceCode) {
      items {
        attendee {
          fullName
        }
        id
      }
    }
  }
`);

const Item = ({
  item,
}: {
  item: {
    id: string;
    attendee: { fullName: string };
  };
}) => {
  return (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.attendee.fullName}</Text>
    </View>
  );
};

export default function LeadsPage() {
  const navigation = useNavigation();
  const { code } = useCurrentConference();

  const { data, loading, error, refetch } = useQuery(MY_LEADS_QUERY, {
    variables: {
      conferenceCode: code,
    },
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    return navigation.addListener('focus', () => {
      refetch();
    });
  }, [refetch, navigation]);

  if (error) {
    return (
      <SafeAreaView style={styles.centeredFlexContainer}>
        <Text>Error: {error.message}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.mainSafeArea}>
      <View style={styles.flexOne}>
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {data ? 'Loading new scans...' : 'Loading...'}
            </Text>
          </View>
        )}

        {data?.badgeScans.items.length === 0 && (
          <Text style={styles.noScansText}>No scans yet!</Text>
        )}

        <FlashList
          data={data?.badgeScans.items}
          renderItem={({ item }) => (
            <Link
              href={{
                pathname: '/sponsors/leads/[id]',
                params: {
                  id: item.id,
                },
              }}
            >
              <Item item={item} />
            </Link>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 2,
  },
  itemText: {
    marginLeft: 8,
    fontSize: 28,
  },
  centeredFlexContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainSafeArea: {
    flex: 1,
    paddingBottom: 100,
  },
  flexOne: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 2,
    backgroundColor: '#fce8de',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  noScansText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 16,
    textAlign: 'center',
  },
});
