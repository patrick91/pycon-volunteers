import { differenceInHours, format, parse, parseISO } from 'date-fns';
import { View, Text, TouchableHighlight, TouchableOpacity } from 'react-native';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { NowProvider, useNow } from './context';
import { Countdown } from './countdown';
import { getTimer } from './get-timer';
import { getDeltaAndStatus } from './get-delta-and-status';
import * as SecureStore from 'expo-secure-store';
import { Button } from '@/components/ui/button';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTalkConfiguration } from '@/context/talk-configuration';
import clsx from 'clsx';

function TimeLeft({
  title,
  timeLeft,
}: {
  title: string;
  timeLeft: string;
}) {
  return (
    <>
      <Text className="text-xl font-bold">{title}</Text>
      <Text className="tabular-nums text-7xl">{timeLeft}</Text>
    </>
  );
}

function TimerContent({
  event,
}: {
  event: {
    start: string;
    end: string;
    id: string;
  };
}) {
  const { now } = useNow();
  const start = parseISO(event.start);
  const end = parseISO(event.end);
  const duration = end.getTime() - start.getTime();
  const diffInHours = differenceInHours(now, start);
  const inDistantFuture = diffInHours < -24;

  const { hasQa } = useTalkConfiguration(event.id);

  const { delta, status } = getDeltaAndStatus({
    now,
    start,
    end,
    duration,
    includeQa: hasQa,
  });

  if (inDistantFuture) {
    return (
      <View className="bg-[#FEFFD3] p-4 justify-center items-center gap-2">
        <Text>
          Event starts at {format(event.start, "HH:mm 'on' dd MMM yyyy")}
        </Text>
      </View>
    );
  }

  const timer = getTimer({ delta });

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
      className={clsx('p-4 justify-center items-center gap-2', {
        'bg-[#FEFFD3]': !almostDone && status !== 'over',
        'bg-red-400': almostDone || status === 'over',
      })}
    >
      <TimeLeft title={statusText} timeLeft={timer} />
    </View>
  );
}

export const Timer = ({
  event,
}: {
  event: {
    start: string;
    end: string;
    id: string;
  };
}) => {
  const { hasQa } = useTalkConfiguration(event.id);
  const { setDebug } = useNow();

  const handleDebugToggle = () => {
    if (debug) {
      setDebug(false);
    } else {
      setDebug({
        start: event.start,
      });
    }
  };

  const { now, setOffsetSeconds, debug } = useNow();
  const start = parseISO(event.start);
  const end = parseISO(event.end);

  const tripleTapGesture = Gesture.Tap()
    .numberOfTaps(3)
    .onEnd(() => {
      handleDebugToggle();
    })
    .runOnJS(true);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const secondsOffset = Math.round(e.translationX * 10);
      setOffsetSeconds(secondsOffset);
    })
    .runOnJS(true);

  const combinedGestures = Gesture.Race(tripleTapGesture, panGesture);

  return (
    <GestureDetector gesture={combinedGestures}>
      <View>
        <TimerContent event={event} />

        {debug && (
          <>
            <View className="absolute top-1 right-1 w-3 h-3 rounded-full bg-purple-500" />
            <View className="border-t-2 w-full p-2 bg-purple-200">
              <Text>Current time: {format(now, 'HH:mm:ss')}</Text>
              <Text>Talk starts at: {format(start, 'HH:mm:ss')}</Text>
              <Text>Talk ends at: {format(end, 'HH:mm:ss')}</Text>
              <Text>Has Q&A: {hasQa ? 'Yes' : 'No'}</Text>
            </View>
          </>
        )}
      </View>
    </GestureDetector>
  );
};
