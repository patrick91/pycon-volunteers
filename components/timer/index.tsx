import { differenceInHours, format, parseISO } from 'date-fns';
import { View, Text, StyleSheet } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { useNow } from './context';
import { getTimer } from './get-timer';
import { getDeltaAndStatus } from './get-delta-and-status';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTalkConfiguration } from '@/context/talk-configuration';
import clsx from 'clsx';
import * as Haptics from 'expo-haptics';
import { useSession } from '@/context/auth';

function TimeLeft({ title, timeLeft }: { title: string; timeLeft: string }) {
  return (
    <>
      <Text style={styles.timeLeftTitle}>{title}</Text>
      <Text style={styles.timeLeftText}>{timeLeft}</Text>
    </>
  );
}

const vibrateSequence = async () => {
  const runs = 5;

  for (let i = 0; i < runs; i++) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
};

function TimerContent({
  event,
}: {
  event: {
    start: string;
    end: string;
    id: string;
  };
}) {
  const { user } = useSession();

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

  // Track previous status to detect changes
  const previousStatus = useRef(status);

  // Trigger vibration when status changes
  useEffect(() => {
    if (previousStatus.current !== status) {
      vibrateSequence();
      previousStatus.current = status;
    }
  }, [status]);

  if (inDistantFuture || !user?.canSeeTalkTimer) {
    return (
      <View style={styles.eventStartsContainer}>
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
      style={[
        styles.timerContentBase,
        !almostDone && status !== 'over' && styles.timerContentNormal,
        (almostDone || status === 'over') && styles.timerContentAlmostDone,
      ]}
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
  const { user } = useSession();
  const { setDebug, now, setOffsetSeconds, debug } = useNow();

  const handleDebugToggle = () => {
    if (!user?.canSeeTalkTimer) {
      return;
    }

    if (debug) {
      setDebug(false);
    } else {
      setDebug({
        start: event.start,
      });
    }
  };

  const start = parseISO(event.start);
  const end = parseISO(event.end);
  const previousTranslateX = useRef<number | null>(null);

  const tripleTapGesture = Gesture.Tap()
    .numberOfTaps(3)
    .onEnd(() => {
      handleDebugToggle();
    })
    .runOnJS(true);

  const panGesture = Gesture.Pan()
    .onStart((e) => {
      previousTranslateX.current = e.translationX;
    })
    .onUpdate((e) => {
      if (previousTranslateX.current === null) {
        return;
      }
      const delta = e.translationX - previousTranslateX.current;
      previousTranslateX.current = e.translationX;
      setOffsetSeconds((prevOffset) => prevOffset + delta);
    })
    .onEnd(() => {
      previousTranslateX.current = null;
    })
    .runOnJS(true);

  const combinedGestures = Gesture.Race(tripleTapGesture, panGesture);

  return (
    <GestureDetector gesture={combinedGestures}>
      <View>
        <TimerContent event={event} />

        {debug && (
          <>
            <View style={styles.debugIndicatorDot} />
            <View style={styles.debugInfoContainer}>
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

const styles = StyleSheet.create({
  timeLeftTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  timeLeftText: {
    fontSize: 60,
    fontVariant: ['tabular-nums'],
  },
  eventStartsContainer: {
    backgroundColor: '#FEFFD3',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  timerContentBase: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  timerContentNormal: {
    backgroundColor: '#FEFFD3',
  },
  timerContentAlmostDone: {
    backgroundColor: '#F87171',
  },
  debugIndicatorDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#A78BFA',
  },
  debugInfoContainer: {
    borderTopWidth: 2,
    width: '100%',
    padding: 8,
    backgroundColor: '#DDD6FE',
  },
});
