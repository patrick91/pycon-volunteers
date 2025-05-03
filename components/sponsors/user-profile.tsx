import { View, Text } from 'react-native';
import { Textarea } from '../form/textarea';
import { useForm } from 'react-hook-form';
import { Button } from '../form/button';
import { graphql } from '@/graphql';
import { useMutation } from '@apollo/client';

const UPDATE_BADGE_SCAN_MUTATION = graphql(`
mutation UpdateBadgeScan($input: UpdateBadgeScanInput!) {
  updateBadgeScan(input: $input) {
    __typename
    ... on BadgeScan {
      id
      notes
    }
    ... on ScanError {
      message
    }
  }
}
`);

export const UserProfile = ({
  badgeId,
  attendee,
  notes,
}: {
  badgeId: string;
  attendee: {
    fullName: string;
    email: string;
  };
  notes: string;
}) => {
  const [updateBadge, { loading, error, data }] = useMutation(
    UPDATE_BADGE_SCAN_MUTATION,
  );

  const { control, handleSubmit } = useForm<{
    notes: string;
  }>({
    defaultValues: {
      notes,
    },
  });

  const updateNotes = ({ notes }: { notes: string }) => {
    updateBadge({
      variables: {
        input: {
          id: badgeId,
          notes: notes || '',
        },
      },
    }).then(() => {
      console.log('Updated!');
    });
  };

  return (
    <View>
      <Text className="text-2xl font-bold text-gray-800 mt-4">Full name</Text>

      <Text className="text-gray-600 mt-2 text-xl">{attendee.fullName}</Text>

      <Text className="text-2xl font-bold text-gray-800 mt-4">Email</Text>

      <Text className="text-gray-600 mt-2 text-xl">{attendee.email}</Text>

      <Text className="text-2xl font-bold text-gray-800 mt-4">Notes</Text>

      <Textarea name="notes" control={control} defaultValue={notes} />

      <Button onPress={handleSubmit(updateNotes)} loading={loading}>
        Update notes
      </Button>

      {data && <Text className="text-green-700">Notes updated! 👍</Text>}
      {error && <Text className="text-red-500">{error.message}</Text>}
    </View>
  );
};
