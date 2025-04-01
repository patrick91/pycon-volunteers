import { clsx } from 'clsx';
import { View, Text, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { graphql, readFragment, type ResultOf } from '@/graphql';
import { useSuspenseQuery } from '@apollo/client';

import {
  SessionItem,
  ITEM_FRAGMENT,
  type Item,
} from '@/components/session-item';

const SCHEDULE_QUERY = graphql(
  `
query Schedule {
  conference(code: "pycon2025") {
    days {
      rooms {
        id
        name
        type
      }
      id
      day
      slots {
        hour
        duration
        items {
          ...Item
        }
      }
    }
    }
  }
`,
  [ITEM_FRAGMENT],
);

type ItemWithDuration = Omit<Item, 'duration'> & { duration: number };

type Slot =
  | {
      type: 'break';
      start: string;
      title: string;
    }
  | {
      type: 'room-change';
      start: string;
    }
  | {
      type: 'sessions';
      start: string;
      duration: number;
      sessions: Array<ItemWithDuration>;
    };

type ScheduleSession = {
  id: string;
  width: number;
  left: number;
  session: Item;
};

const getSlotSize = (slot: Slot) => {
  switch (slot.type) {
    case 'break':
      return 150;
    case 'room-change':
      return 10;
    case 'sessions':
      return 250;
  }
};

const hourFromDatetime = (
  datetime: string,
): `${number}:${number}:${number}` => {
  const date = new Date(datetime);

  const [hours, minutes, seconds] = [
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ];

  return [hours, minutes, seconds]
    .map((part) => part.toString().padStart(2, '0'))
    .join(':') as `${number}:${number}:${number}`;
};

function getDailySchedule(data: ResultOf<typeof SCHEDULE_QUERY>, day: number) {
  const { slots, rooms: dayRooms } = data.conference.days[day];

  const daySlots: { [key: string]: Slot } = {};

  const dayItems: Array<ItemWithDuration> = [];

  for (const slot of slots) {
    const items = readFragment(ITEM_FRAGMENT, slot.items).map((item) => ({
      ...item,
      duration:
        item.duration ??
        (new Date(item.end).getTime() - new Date(item.start).getTime()) / 60000,
    }));

    dayItems.push(...items);

    const hasRoomChange = items.some((item) =>
      item.title.toLowerCase().includes('room change'),
    );
    const hasCoffeeOrLunch = items.some(
      (item) =>
        item.title.toLowerCase().includes('coffee') ||
        item.title.toLowerCase().includes('lunch'),
    );

    if (hasCoffeeOrLunch) {
      daySlots[slot.hour] = {
        type: 'break',
        start: slot.hour,
        title: items[0].title,
      };
    } else if (hasRoomChange) {
      daySlots[slot.hour] = {
        type: 'room-change',
        start: slot.hour,
      };
    } else {
      const existingSlot = daySlots[slot.hour];

      if (existingSlot && existingSlot.type !== 'sessions') {
        throw new Error('Slot is not a session');
      }

      const existingSessions = existingSlot?.sessions ?? [];

      const sessions = [...existingSessions, ...items];

      daySlots[slot.hour] = {
        type: 'sessions',
        start: slot.hour,
        duration: slot.duration,
        sessions,
      };
    }
  }

  const getLeft = (item: Item) => {
    let left = 0;

    const itemStartHour = hourFromDatetime(item.start);

    for (const slot of Object.values(daySlots)) {
      if (slot.start === itemStartHour) {
        break;
      }

      left += getSlotSize(slot);
    }

    return left;
  };

  const getWidth = (item: ItemWithDuration, slot: Slot) => {
    if (slot.type === 'sessions') {
      const pixelsPerMinute = getSlotSize(slot) / slot.duration;

      return item.duration * pixelsPerMinute;
    }

    return getSlotSize(slot);
  };

  let scheduleSize = 0;

  const sessionsByRoom = dayItems.reduce(
    (acc, item) => {
      const slot = daySlots[hourFromDatetime(item.start)];

      if (!slot) {
        throw new Error('Slot not found');
      }

      const width = getWidth(item, slot);
      const left = getLeft(item);

      scheduleSize = Math.max(scheduleSize, left + width);

      const scheduleSession = {
        id: item.id,
        session: item,
        width,
        left,
      };

      for (const room of item.rooms) {
        if (!acc[room.id]) {
          acc[room.id] = [];
        }
        acc[room.id].push(scheduleSession);
      }

      return acc;
    },
    {} as Record<string, Array<ScheduleSession>>,
  );

  const rooms = dayRooms.flatMap((room) => {
    return [room.name, sessionsByRoom[room.id]];
  });

  const roomTitleIndices = rooms
    .map((item, index) => {
      if (typeof item === 'string') {
        return index;
      }
      return null;
    })
    .filter((item) => item !== null) as number[];

  return { rooms, roomTitleIndices, scheduleSize };
}

export default function ContactsFlashList() {
  const { data } = useSuspenseQuery(SCHEDULE_QUERY);

  const schedule = getDailySchedule(data, 1);

  return (
    <ScrollView horizontal className="flex-1 bg-red-200 pb-24">
      <View
        className="flex-1 bg-blue-200"
        style={{ width: schedule.scheduleSize }}
      >
        <FlashList
          className={clsx('flex-1 bg-[#FAF5F3]')}
          data={schedule.rooms}
          renderItem={({ item, target, index }) => {
            if (typeof item === 'string') {
              return (
                <Text
                  className={clsx(
                    'font-sans-semibold bg-white border-b-4 p-4',
                    {
                      'border-t-4': target === 'StickyHeader' || index === 0,
                    },
                  )}
                >
                  {item}
                </Text>
              );
            }

            return (
              <View className="flex-row h-36 border-b-4 relative">
                {item.map(({ session, width, left }) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    width={width}
                    left={left}
                  />
                ))}
              </View>
            );
          }}
          // stickyHeaderIndices={schedule.roomTitleIndices}
          getItemType={(item) => {
            return typeof item === 'string' ? 'sectionHeader' : 'row';
          }}
          estimatedItemSize={100}
        />
      </View>
    </ScrollView>
  );
}
