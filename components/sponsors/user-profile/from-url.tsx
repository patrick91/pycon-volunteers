import { graphql } from '@/graphql';
import { View, Text } from 'react-native';

const SCAN_BADGE_MUTATION = graphql(`
  mutation ScanBadge($input: ScanBadgeInput!) {
    scanBadge(input: $input) {
      __typename

    ... on BadgeScan {
      id
      attendee {
        email
        fullName
      }

      notes
    }

    ... on ScanError {
      message
    }
    }
  }
`);

export const UserProfileFromUrl = ({ url }: { url: string }) => {
  return (
    <View className="flex-1 justify-center items-center h-[200px]">
      <Text>{url}</Text>
    </View>
  );

  // useEffect(() => {
  //   scanBadge({
  //     variables: {
  //       input: {
  //         url,
  //         conferenceCode: "pycon2023",
  //       },
  //     },
  //   });
  // }, [url]);

  // if (error) {
  //   return (
  //     <View style={tw`px-6 pb-4`}>
  //       <Text>Error: {error.message}</Text>
  //     </View>
  //   );
  // }

  // if (loading || !data) {
  //   return (
  //     <View style={tw`px-6 pb-4`}>
  //       <Text>Loading...</Text>
  //     </View>
  //   );
  // }

  // if (data?.scanBadge.__typename === "ScanError") {
  //   return (
  //     <View style={tw`px-6 pb-4`}>
  //       <Text>Error: {data.scanBadge.message}</Text>
  //     </View>
  //   );
  // }

  // return (
  //   <UserProfile
  //     attendee={data.scanBadge.attendee}
  //     badgeId={data.scanBadge.id}
  //     notes={data.scanBadge.notes}
  //   />
  // );
};
