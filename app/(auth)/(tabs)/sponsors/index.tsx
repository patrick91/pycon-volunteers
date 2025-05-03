import React, { useEffect } from 'react';
import { View, Text, SafeAreaView, Button } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from 'expo-router';
import { graphql } from '@/graphql';
import { useQuery } from '@apollo/client';

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

  const { data, loading, error, refetch } = useQuery(MY_LEADS_QUERY, {
    variables: {
      conferenceCode: 'pycon2025',
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
      <View>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 pb-[100px] bg-red-200">
      <Button title="Refresh" onPress={() => refetch()} />
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
          data={new Array(100).fill(null).map((_, index) => ({
            id: index.toString(),
            attendee: { fullName: 'Loading...' },
          }))}
          renderItem={({ item }) => <Item item={item} />}
          estimatedItemSize={50}
          ListFooterComponent={
            <Button title="Refresh" onPress={() => refetch()} />
          }
        />
      </View>
    </SafeAreaView>
  );
}
