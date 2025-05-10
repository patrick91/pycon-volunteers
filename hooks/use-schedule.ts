import { graphql, readFragment, type ResultOf } from '@/graphql';
import { useSuspenseQuery } from '@apollo/client';
import { useCurrentConference } from '@/hooks/use-current-conference';
import { ITEM_FRAGMENT, type Item } from '@/components/session-item';
import { parseISO, format, isSameDay } from 'date-fns';

export type ItemWithDuration = Omit<Item, 'duration'> & { duration: number };

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

const SCHEDULE_QUERY = graphql(
  `
  query Schedule($conferenceCode: String!) {
    conference(code: $conferenceCode) {
      id
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

function getDailySchedule(data: ResultOf<typeof SCHEDULE_QUERY>, day: Date) {
  // biome-ignore lint/style/noNonNullAssertion: this is guaranteed to exist
  const { slots, rooms: dayRooms } = data.conference.days.find((d) =>
    isSameDay(parseISO(d.day), day),
  )!;

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

  return { items: dayItems };
}

export type DaySchedule = ReturnType<typeof getDailySchedule>;

export const useSchedule = () => {
  const { code } = useCurrentConference();

  const { data } = useSuspenseQuery(SCHEDULE_QUERY, {
    variables: {
      conferenceCode: code,
    },
  });

  const days = data.conference.days.map((day) => ({
    label: format(parseISO(day.day), 'dd MMM yyyy'),
    id: day.day,
    day: parseISO(day.day),
    dayString: day.day,
  }));

  const schedule: Record<string, DaySchedule> = Object.fromEntries(
    days.map((day) => [day.dayString, getDailySchedule(data, day.day)]),
  );

  return {
    schedule,
    days,
  };
};
