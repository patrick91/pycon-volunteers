import { differenceInMilliseconds } from 'date-fns';

const QA_DURATION = 5 * 60 * 1000;

export const getDeltaAndStatus = ({
  now,
  start,
  end,
  duration,
  includeQa,
}: {
  now: Date;
  start: Date;
  end: Date;
  duration: number;
  includeQa?: boolean;
}) => {
  let status: 'upcoming' | 'running' | 'runningQA' | 'qa' | 'over';

  const qaStart = new Date(start.getTime() + duration - QA_DURATION);

  const actualEnd = includeQa ? qaStart : end;

  let delta = 0;

  if (now < start) {
    status = 'upcoming';

    delta = differenceInMilliseconds(start, now);
  } else if (now < actualEnd) {
    status = includeQa ? 'runningQA' : 'running';
    delta = differenceInMilliseconds(actualEnd, now);
  } else {
    status = includeQa ? 'qa' : 'over';
    delta = differenceInMilliseconds(end, now);
  }

  if (delta < 0) {
    status = 'over';
  }

  return {
    delta,
    status,
    // for debug
    qaStart,
  };
};
