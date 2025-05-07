import { useInterval } from "@/hooks/use-interval";
import { parseISO } from "date-fns";
import { useEffect, useState, useContext, createContext } from "react";

export const NowContext = createContext({
  now: new Date(),
  setOffsetSeconds: (offset: number | ((prev: number) => number)) => {},
  setDebug: (debug: { start: string } | false) => {},
  debug: false,
});

export const NowProvider = ({ children }: { children: React.ReactNode }) => {
  const [debug, setDebug] = useState(false);
  const [debugStart, setDebugStart] = useState("");
  const baseDate = debug ? parseISO(debugStart) : new Date();

  const [now, setNow] = useState(new Date());
  const [offsetSeconds, setOffsetSeconds] = useState(0);
  const [counter, setCounter] = useState(0);

  const updateNow = () => {
    if (debug) {
      const date = new Date(
        baseDate.getTime() - offsetSeconds * 1000 + counter * 1000,
      );
      setNow(date);
      setCounter(counter + 1);
    } else {
      const date = new Date(Date.now() - offsetSeconds * 1000);
      setNow(date);
    }
  };

  useInterval(updateNow, 1000, { enabled: debug });

  useEffect(() => {
    if (debug) {
      setOffsetSeconds(0);
    }
  }, [debug]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to update the now when the debug or offsetMinutes change
  useEffect(updateNow, [debug, offsetSeconds]);

  return (
    <NowContext.Provider
      value={{
        now,
        setOffsetSeconds,
        setDebug: (debug: { start: string } | false) => {
          if (debug) {
            setDebug(true);
            setDebugStart(debug.start);
          } else {
            setDebug(false);
          }
        },
        debug,
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
