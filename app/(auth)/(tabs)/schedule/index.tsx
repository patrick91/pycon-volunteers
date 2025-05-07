import { View, Text } from "react-native";
import { ScheduleListView } from "./list-view";
import { Stack } from "expo-router";
import { DaySelector } from "@/components/day-selector";
import { useState } from "react";
import { useSchedule } from "@/hooks/use-schedule";

export default function SchedulePage() {
  const [day, setDay] = useState("2025-05-28");

  const { days, schedule } = useSchedule();

  const daySchedule = schedule[day];

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          title: "Schedule",
          headerTitle: () => (
            <View className="flex-1 flex flex-row justify-center items-center">
              <DaySelector
                days={days}
                onDayChange={(newDay) => {
                  setDay(newDay);
                }}
                selectedDay={day}
              />
            </View>
          ),
        }}
      />
      {daySchedule ? (
        <ScheduleListView schedule={daySchedule} />
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text>No schedule data available.</Text>
        </View>
      )}
    </View>
  );
}
