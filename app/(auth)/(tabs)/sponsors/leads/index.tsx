import React, { useEffect } from 'react';
import { View, Text, SafeAreaView, Button } from 'react-native';
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
    <View className="flex-row items-center px-4 py-4 border-b-2">
      <Text className="ml-2 text-3xl">{item.attendee.fullName}</Text>
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
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Error: {error.message}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 pb-[100px]">
      <View className="flex-1">
        {loading && (
          <View className="flex-row items-center justify-center px-2 py-2 border-b-2 bg-[#fce8de]">
            <Text className="text-sm font-bold">
              {data ? 'Loading new scans...' : 'Loading...'}
            </Text>
          </View>
        )}

        {data?.badgeScans.items.length === 0 && (
          <Text className="text-2xl font-bold text-gray-800 mt-4">
            No scans yet!
          </Text>
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
