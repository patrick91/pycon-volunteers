import type * as types from './ActivityController.types';

export const startLiveActivity: types.StartLiveActivityFn = async () => {
  return Promise.resolve({ activityId: '' });
};

export const updateLiveActivity: types.UpdateLiveActivityFn = async () => {
  return Promise.resolve();
};

export const stopLiveActivity: types.StopLiveActivityFn = async () => {
  return;
};

export const isLiveActivityRunning: types.IsLiveActivityRunningFn = () => {
  return false;
};

export const areLiveActivitiesEnabled: boolean = false;
