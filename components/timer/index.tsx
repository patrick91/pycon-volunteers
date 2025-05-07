import { differenceInHours, format, parseISO } from "date-fns";
import { View, Text } from "react-native";
import React, { useEffect, useRef } from "react";
import { useNow } from "./context";
import { getTimer } from "./get-timer";
import { getDeltaAndStatus } from "./get-delta-and-status";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTalkConfiguration } from "@/context/talk-configuration";
import clsx from "clsx";
import * as Haptics from "expo-haptics";
import { useSession } from "@/context/auth";

function TimeLeft({ title, timeLeft }: { title: string; timeLeft: string }) {
  return (
    <>
      <Text className="text-xl font-bold">{title}</Text>
      <Text className="text-7xl" style={{ fontVariant: ["tabular-nums"] }}>
        {timeLeft}
      </Text>
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
      <View className="bg-[#FEFFD3] p-4 justify-center items-center gap-2">
        <Text>
          Event starts at {format(event.start, "HH:mm 'on' dd MMM yyyy")}
        </Text>
      </View>
    );
  }

  const timer = getTimer({ delta });

  const statusText = {
    notStarted: "Timer not started",
    upcoming: "Upcoming",
    running: "Time left",
    runningQA: "Time left until Q&A",
    qa: "Q&A",
    over: "Over 🤬",
  }[status];

  const almostDone =
    (status === "running" && delta < 5 * 60 * 1000) ||
    (status === "qa" && delta < 1 * 60 * 1000);

  return (
    <View
      className={clsx("p-4 justify-center items-center gap-2", {
        "bg-[#FEFFD3]": !almostDone && status !== "over",
        "bg-red-400": almostDone || status === "over",
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
            <View className="absolute top-1 right-1 w-3 h-3 rounded-full bg-purple-500" />
            <View className="border-t-2 w-full p-2 bg-purple-200">
              <Text>Current time: {format(now, "HH:mm:ss")}</Text>
              <Text>Talk starts at: {format(start, "HH:mm:ss")}</Text>
              <Text>Talk ends at: {format(end, "HH:mm:ss")}</Text>
              <Text>Has Q&A: {hasQa ? "Yes" : "No"}</Text>
            </View>
          </>
        )}
      </View>
    </GestureDetector>
  );
};
