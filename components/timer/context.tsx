import { useInterval } from '@/hooks/use-interval';
import { parseISO } from 'date-fns';
import { useContext, createContext, useReducer } from 'react';

type OffsetUpdater = number | ((prev: number) => number);
type DebugConfig = { start: string } | false;

type NowContextValue = {
  now: Date;
  setOffsetSeconds: (offset: OffsetUpdater) => void;
  setDebug: (debug: DebugConfig) => void;
  debug: boolean;
};

type NowState = {
  now: Date;
  offsetSeconds: number;
  debug: boolean;
  debugStart: string;
  counter: number;
};

type NowAction =
  | { type: 'tick' }
  | { type: 'set-offset'; payload: OffsetUpdater }
  | { type: 'set-debug'; payload: DebugConfig };

const NowContext = createContext<NowContextValue>({
  now: new Date(),
  setOffsetSeconds: () => {},
  setDebug: () => {},
  debug: false,
});

const getCurrentDate = (offsetSeconds: number) => {
  return new Date(Date.now() - offsetSeconds * 1000);
};

const getDebugDate = ({
  debugStart,
  offsetSeconds,
  counter,
}: Pick<NowState, 'debugStart' | 'offsetSeconds' | 'counter'>) => {
  return new Date(
    parseISO(debugStart).getTime() - offsetSeconds * 1000 + counter * 1000,
  );
};

const createInitialState = (): NowState => ({
  now: new Date(),
  offsetSeconds: 0,
  debug: false,
  debugStart: '',
  counter: 0,
});

const nowReducer = (state: NowState, action: NowAction): NowState => {
  switch (action.type) {
    case 'tick': {
      if (!state.debug) {
        return {
          ...state,
          now: getCurrentDate(state.offsetSeconds),
        };
      }

      const nextCounter = state.counter + 1;
      return {
        ...state,
        counter: nextCounter,
        now: getDebugDate({
          debugStart: state.debugStart,
          offsetSeconds: state.offsetSeconds,
          counter: nextCounter,
        }),
      };
    }
    case 'set-offset': {
      const nextOffset =
        typeof action.payload === 'function'
          ? action.payload(state.offsetSeconds)
          : action.payload;

      return {
        ...state,
        offsetSeconds: nextOffset,
        now: state.debug
          ? getDebugDate({
              debugStart: state.debugStart,
              offsetSeconds: nextOffset,
              counter: state.counter,
            })
          : getCurrentDate(nextOffset),
      };
    }
    case 'set-debug': {
      if (!action.payload) {
        return {
          ...state,
          debug: false,
          debugStart: '',
          counter: 0,
          now: getCurrentDate(state.offsetSeconds),
        };
      }

      return {
        ...state,
        debug: true,
        debugStart: action.payload.start,
        offsetSeconds: 0,
        counter: 0,
        now: parseISO(action.payload.start),
      };
    }
    default: {
      return state;
    }
  }
};

export const NowProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(nowReducer, undefined, createInitialState);

  useInterval(() => {
    dispatch({ type: 'tick' });
  }, 1000, { enabled: true });

  return (
    <NowContext.Provider
      value={{
        now: state.now,
        setOffsetSeconds: (offset) =>
          dispatch({ type: 'set-offset', payload: offset }),
        setDebug: (debug) => {
          dispatch({ type: 'set-debug', payload: debug });
        },
        debug: state.debug,
      }}
    >
      {children}
    </NowContext.Provider>
  );
};

export const useNow = () => {
  const { now, setOffsetSeconds, setDebug, debug } = useContext(NowContext);

  return { now, setOffsetSeconds, setDebug, debug };
};
