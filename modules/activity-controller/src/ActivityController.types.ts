export type LiveActivityParams = {
  customString: string;
  customNumber: number;
  eventName: string;
  endTime: string; // ISO string of the end time
  qaTime: string; // ISO string of when Q&A starts
  roomChangeTime: string; // ISO string of when room change happens
  nextTalk?: string;
};

export type StartLiveActivityFn = (
  params: LiveActivityParams,
) => Promise<{ activityId: string }>;

export type StopLiveActivityFn = () => Promise<void>;

export type IsLiveActivityRunningFn = () => boolean;
