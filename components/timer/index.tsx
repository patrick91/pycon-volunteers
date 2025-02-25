import { differenceInHours, format, parse, parseISO } from 'date-fns';
import { View, Text, TouchableHighlight, TouchableOpacity } from "react-native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useNow } from "./context";
import { Countdown } from "./countdown";
import { getTimer } from "./get-timer";
import { getDeltaAndStatus } from "./get-delta-and-status";
import * as SecureStore from 'expo-secure-store';
import { Button } from '@/components/ui/button';

export const Timer = ({
  event,
  liveEvent,
  onGoToNextTalk,
}: {
  event: {
    start: string;
    end: string;
    id: string;
  };
  liveEvent: {
    id: string;
  };
  onGoToNextTalk?: () => void;
}) => {
  const { now } = useNow();
  const start = parseISO(event.start);
  const end = parseISO(event.end);
  const [userTimerStart, setUserTimerStart] = useState<Date | null>(null);
  const duration = end.getTime() - start.getTime();

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

  const userTimerState = userTimerStart
    ? getDeltaAndStatus({
        now: new Date(),
        start: userTimerStart,
        end: new Date(userTimerStart.getTime() + duration),
        duration,
        includeQa: event.hasQa,
      })
    : null;

  const timer = getTimer({ delta });
  const userTimer = userTimerState ? getTimer(userTimerState) : null;

  const [time, setTime] = useState(Date.now());

  const stopTimer =async () => {
    await SecureStore.deleteItemAsync(storageKey);
    setUserTimerStart(null);
  };

  const startTimer = async () => {
    const date = new Date();

    await SecureStore.setItemAsync(storageKey, date.toISOString());

    setUserTimerStart(date);
  };

  useLayoutEffect(() => {
    SecureStore.getItemAsync(storageKey).then((value) => {
      if (value) {
        setUserTimerStart(new Date(value));
      }
    });
  }, [storageKey]);

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleCountdownPress = async () => {
    if (userTimerStart) {
      const newTime = new Date(userTimerStart.getTime() - 1 * 60 * 1000 - 1000);

      setUserTimerStart(newTime);

      await SecureStore.setItemAsync(storageKey, newTime.toISOString());
    }
  };

  // if ended show this event was at ...

  if (inDistantFuture) {
    return (
      <View className="border-4 border-black bg-[#FEFFD3] p-2 flex-row justify-center items-center">
        <Text>Event starts at {format(event.start, "HH:mm 'on' dd MMM")}</Text>
      </View>
    );
  }

  return (
    <>
            <Countdown
              timer={userTimer || "0:00"}
              status={userTimerState ? userTimerState.status : "notStarted"}
              time={time}
              delta={userTimerState?.delta || 0}
            />

          <View className="mb-2">
            {isLive ? (
              <Button
                onPress={() => {
                  if (userTimerStart) {
                    stopTimer();
                  } else {
                    startTimer();
                  }
                }}
              >
                {userTimerStart ? "Stop and reset" : "Start"}
              </Button>
            ) : (
              <TouchableHighlight
                onPress={() => {
                  if (userTimerStart) {
                    stopTimer();
                  }

                  onGoToNextTalk?.();
                }}
              >
                <View className="p-2 border-2 bg-red-300">
                  <Text className="uppercase font-bold text-center">
                    Go to live talk
                  </Text>

                  <Text className="text-center text-xs">
                    ({liveEvent?.title})
                  </Text>
                </View>
              </TouchableHighlight>
            )}
          </View>

      {inDistantFuture ? (
        <View>
          <Text>
            Event starts at {format(event.start, "HH:mm 'on' dd MMM")}
          </Text>
        </View>
      ) : (
        <Countdown
          prefix="Official"
          timer={timer}
          status={status}
          time={time}
          delta={delta}
          small
        />
      )}
    </>
  );
};