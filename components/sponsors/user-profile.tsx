import { View, Text, StyleSheet } from 'react-native';
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
      <Text style={styles.headerText}>Full name</Text>

      <Text style={styles.valueText}>{attendee.fullName}</Text>

      <Text style={styles.headerText}>Email</Text>

      <Text style={styles.valueText}>{attendee.email}</Text>

      <Text style={styles.headerText}>Notes</Text>

      <Textarea name="notes" control={control} defaultValue={notes} />

      <Button onPress={handleSubmit(updateNotes)} loading={loading}>
        Update notes
      </Button>

      {data && <Text style={styles.successText}>Notes updated! 👍</Text>}
      {error && <Text style={styles.errorText}>{error.message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 16,
  },
  valueText: {
    color: '#718096',
    marginTop: 8,
    fontSize: 20,
  },
  successText: {
    color: '#2F855A',
  },
  errorText: {
    color: '#E53E3E',
  },
});
