import { View, Text } from "react-native";
import tw from "../../../lib/tailwind";
import { Textarea } from "../../form/textarea";
import { useForm } from "react-hook-form";
import { Button } from "../../form/button";
import { useUpdateBadgeScanMutation } from "../../../generated/graphql";

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
  const [updateBadge, { loading, error, data }] = useUpdateBadgeScanMutation();

  const { control, handleSubmit } = useForm<{
    notes: string;
  }>();

  const updateNotes = ({ notes }: { notes: string }) => {
    updateBadge({
      variables: {
        input: {
          id: badgeId,
          notes: notes || "",
        },
      },
    }).then(() => {
      console.log("Updated!");
    });
  };

  return (
    <View style={tw`px-6 pb-4`}>
      <Text style={tw`text-2xl font-bold text-gray-800 mt-4`}>Full name</Text>

      <Text style={tw`text-gray-600 mt-2 text-xl`}>{attendee.fullName}</Text>

      <Text style={tw`text-2xl font-bold text-gray-800 mt-4`}>Email</Text>

      <Text style={tw`text-gray-600 mt-2 text-xl`}>{attendee.email}</Text>

      <Text style={tw`text-2xl font-bold text-gray-800 mt-4`}>Notes</Text>

      <Textarea name="notes" control={control} defaultValue={notes} />

      <Button onPress={handleSubmit(updateNotes)} loading={loading}>
        Update notes
      </Button>

      {data && <Text style={tw`text-green-700`}>Notes updated! 👍</Text>}
      {error && <Text style={tw`text-red-500`}>{error.message}</Text>}
    </View>
  );
};
