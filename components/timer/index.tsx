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

export const Timer = ({
  event,
  liveEvent,
}: {
  event: {
    start: string;
    end: string;
    id: string;
  };
  liveEvent: {
    id: string;
  };
}) => {
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
  const duration = end.getTime() - start.getTime();
  const [showDebugMessage, setShowDebugMessage] = useState(false);

  const diffInHours = differenceInHours(now, start);
  const inDistantFuture = diffInHours < -24;

  const storageKey = `user-timer-start-${event.id}`;

  const isLive = liveEvent?.id === event.id;

  const { delta, status, qaStart } = getDeltaAndStatus({
    now,
    start,
    end,
    duration,
    includeQa: false,
  });

  const timer = getTimer({ delta });

  useEffect(() => {
    if (debug) {
      setShowDebugMessage(true);
      setTimeout(() => {
        setShowDebugMessage(false);
      }, 2000);
    }
  }, [debug]);

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

  // if ended show this event was at ...

  if (inDistantFuture) {
    return (
      <GestureDetector gesture={combinedGestures}>
        <View className="border-4 border-black bg-[#FEFFD3] p-2 justify-center items-center">
          <Text>
            Event starts at {format(event.start, "HH:mm 'on' dd MMM")}
          </Text>
          <Text>{format(now, 'dd MM yyyy - HH:mm:ss')}</Text>
        </View>
      </GestureDetector>
    );
  }

  return (
    <>
      <View className="mb-2">
        <GestureDetector gesture={combinedGestures}>
          <View className="relative">
            <Countdown
              prefix="Official"
              timer={timer}
              status={status}
              time={100}
              delta={delta}
            />
            {showDebugMessage && (
              <View className="absolute top-0 left-0 right-0 bg-purple-600 bg-opacity-70 p-1">
                <Text className="text-white text-xs text-center">
                  Debug mode {debug ? 'enabled' : 'disabled'}
                </Text>
              </View>
            )}
            {debug && (
              <View className="absolute top-1 right-1 w-3 h-3 rounded-full bg-purple-500" />
            )}
          </View>
        </GestureDetector>
      </View>
    </>
  );
};
