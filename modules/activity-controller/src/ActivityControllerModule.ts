import { requireNativeModule } from 'expo';

import type * as types from './ActivityController.types';

const nativeModule = requireNativeModule('ActivityController');

export const startLiveActivity: types.StartLiveActivityFn = async (params) => {
  const stringParams = JSON.stringify(params);
  return nativeModule.startLiveActivity(stringParams);
};

export const updateLiveActivity: types.UpdateLiveActivityFn = async (
  params,
) => {
  const stringParams = JSON.stringify(params);
  return nativeModule.updateLiveActivity(stringParams);
};

export const stopLiveActivity: types.StopLiveActivityFn = async () => {
  return nativeModule.stopLiveActivity();
};

export const isLiveActivityRunning: types.IsLiveActivityRunningFn = () => {
  return nativeModule.isLiveActivityRunning();
};

export const areLiveActivitiesEnabled: boolean =
  nativeModule.areLiveActivitiesEnabled;
