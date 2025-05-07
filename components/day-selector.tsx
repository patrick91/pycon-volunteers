import * as DropdownMenu from "zeego/dropdown-menu";
import { Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

export function DaySelector({
  days,
  onDayChange,
  selectedDay,
}: {
  days: { id: string; label: string }[];
  onDayChange: (day: string) => void;
  selectedDay: string;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <View className="flex-row items-center justify-center h-12 gap-1 mr-[-24px]">
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#000",
            }}
          >
            {days.find((day) => day.id === selectedDay)?.label}
          </Text>
          <Feather name="chevron-down" size={22} color="black" />
        </View>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {days.map((day) => (
          <DropdownMenu.Item key={day.id} onSelect={() => onDayChange(day.id)}>
            <DropdownMenu.ItemTitle>{day.label}</DropdownMenu.ItemTitle>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
