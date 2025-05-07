import { useEffect, useRef } from "react";

export function useInterval(
  callback: () => void,
  delay: number | null,
  options?: { enabled?: boolean },
) {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }
    if (delay !== null && options?.enabled !== false) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay, options?.enabled]);
}
