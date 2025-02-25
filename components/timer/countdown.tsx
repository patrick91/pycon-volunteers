import clsx from 'clsx';
import { View, Text } from 'react-native';

export const Countdown = ({
  prefix,
  timer,
  status,
  delta,
  time,
  small = false,
}: {
  prefix?: string;
  timer: string;
  status: 'notStarted' | 'upcoming' | 'running' | 'runningQA' | 'qa' | 'over';
  delta: number;
  time: number;
  small?: boolean;
}) => {
  const statusText = {
    notStarted: 'Timer not started',
    upcoming: 'Upcoming',
    running: 'Time left',
    runningQA: 'Time left until Q&A',
    qa: 'Q&A',
    over: 'Over 🤬',
  }[status];

  const almostDone =
    (status === 'running' && delta < 5 * 60 * 1000) ||
    (status === 'qa' && delta < 1 * 60 * 1000);

  return (
    <View
      className={clsx('p-2 border-2 mb-2', {
        'bg-red-500': almostDone,
        'bg-pink': !small && !almostDone,
        'bg-kobi': small && !almostDone,
      })}
      key={time}
    >
      <Text
        className={clsx('uppercase font-bold text-center', {
          'text-white': almostDone,
          'text-lg': !small,
          'text-xs': small,
        })}
      >
        {prefix ? `(${prefix}) ` : null}
        {statusText}
      </Text>
      <Text
        className={clsx('mt-1 text-center font-bold tabular-nums', {
          'text-7xl': !small,
          'text-2xl': small,
          'text-white': almostDone,
        })}
      >
        {timer}
      </Text>
    </View>
  );
};
