import * as DropdownMenu from 'zeego/dropdown-menu';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';

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
        <View
          style={{
            padding: 8,
            backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
            borderRadius: 8,
            marginRight: 8,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: isDark ? '#fff' : '#000',
            }}
          >
            Select Day
          </Text>
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
