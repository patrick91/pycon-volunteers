import * as DropdownMenu from 'zeego/dropdown-menu';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import Feather from '@expo/vector-icons/Feather';

const DAYS = [
  { id: 'day1', label: 'Day 1' },
  { id: 'day2', label: 'Day 2' },
  { id: 'day3', label: 'Day 3' },
];

export function DaySelector() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <View className="flex-row items-center justify-center h-12 gap-1 mr-[-24px]">
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: isDark ? '#fff' : '#000',
            }}
          >
            28 Apr 2025
          </Text>
          <Feather name="chevron-down" size={22} color="black" />
        </View>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {DAYS.map((day) => (
          <DropdownMenu.Item
            key={day.id}
            onSelect={() => router.setParams({ day: day.id })}
          >
            <DropdownMenu.ItemTitle>{day.label}</DropdownMenu.ItemTitle>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
