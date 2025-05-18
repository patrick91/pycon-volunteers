import { useSession } from '@/context/auth';
import { useFeatureFlag } from 'posthog-react-native';
import { useEffect, useState } from 'react';
import { isLiveActivityRunning } from '@/modules/activity-controller';
import {
  startLiveActivity,
  stopLiveActivity,
  updateLiveActivity,
} from '@/modules/activity-controller';
import * as Notifications from 'expo-notifications';

const checkPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();

    finalStatus = status;
  }

  return finalStatus;
};

const setupNotifications = async ({
  talk,
  nextSession,
}: {
  talk: {
    id: string;
    title: string;
  };
  nextSession?: {
    title: string;
  } | null;
}) => {
  const status = await checkPermissions();

  if (status !== 'granted') {
    console.log('Failed to get push token for push notification!');

    return;
  }

  const now = new Date();

  const endTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
  const qaTime = new Date(now.getTime() + 0.5 * 60 * 1000); // 1 minute from now
  const roomChangeTime = new Date(now.getTime() + 1 * 60 * 1000); // 2 minutes from now

  // Ensure dates are properly formatted as ISO strings
  const formatDate = (date: Date) => {
    return `${date.toISOString().split('.')[0]}Z`;
  };

  // Check if a Live Activity is already running
  if (isLiveActivityRunning()) {
    // Update the existing activity
    await updateLiveActivity({
      sessionTitle: talk.title,
      endTime: formatDate(endTime),
      qaTime: formatDate(qaTime),
      roomChangeTime: formatDate(roomChangeTime),
      nextTalk: nextSession?.title,
    });
  } else {
    // Start a new activity
    await startLiveActivity({
      sessionTitle: talk.title,
      endTime: formatDate(endTime),
      qaTime: formatDate(qaTime),
      roomChangeTime: formatDate(roomChangeTime),
      nextTalk: nextSession?.title,
    });
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      data: {
        talkId: talk.id,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
};

export function useTalkManagerNotifications({
  talk,
  nextSession,
}: {
  talk: { id: string; title: string };
  nextSession?: { title: string } | null;
}) {
  const { user } = useSession();
  const enableLiveActivity = true; //useFeatureFlag('enable-live-activity');

  const canSeeNotifications = user?.canSeeTalkTimer && enableLiveActivity;

  useEffect(() => {
    if (!canSeeNotifications) {
      console.log('Notifications are disabled');

      return;
    }

    console.log('Notifications are enabled');

    setupNotifications({
      talk,
      nextSession,
    });
  }, [canSeeNotifications, talk, nextSession]);
}
