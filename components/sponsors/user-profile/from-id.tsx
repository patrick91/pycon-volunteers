import { View, Text } from "react-native";
import { UserProfile } from ".";

import { useGetBadgeScanQuery } from "../../../generated/graphql";
import tw from "../../../lib/tailwind";

export const UserProfileFromId = ({ id }: { id: string }) => {
  const { loading, data, error } = useGetBadgeScanQuery({
    variables: {
      id,
    },
  });

  if (error) {
    return (
      <View style={tw`px-6 pb-4`}>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }

  if (loading || !data) {
    return (
      <View style={tw`px-6 pb-4`}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!data.badgeScan) {
    return (
      <View style={tw`px-6 pb-4`}>
        <Text>Not found</Text>
      </View>
    );
  }

  return (
    <UserProfile
      attendee={data.badgeScan.attendee}
      badgeId={data.badgeScan.id}
      notes={data.badgeScan.notes}
    />
  );
};
