import { parse } from 'date-fns';
import React, { useEffect } from 'react';

export const NowContext = React.createContext({
  now: new Date(),
  setOffsetMinutes: (offset: number) => {},
});

export const NowProvider = ({
  children,
  day,
  debug,
}: {
  children: React.ReactNode;
  day?: string;
  debug?: boolean;
}) => {
  const baseDate =
    debug && day ? parse(day, "yyyy-MM-dd", new Date()) : new Date();

  const [now, setNow] = React.useState(new Date());
  const [offsetMinutes, setOffsetMinutes] = React.useState(0);

  const updateNow = () => {
    if (debug) {
      const date = new Date(new Date().getTime() - offsetMinutes * 60 * 1000);

      date.setDate(baseDate.getDate());
      date.setMonth(baseDate.getMonth());
      date.setFullYear(baseDate.getFullYear());

      setNow(date);
    } else {
      setNow(new Date());
    }
  };

  useEffect(() => {
    const interval = setInterval(updateNow, 1000);

    return () => clearInterval(interval);
  });

  useEffect(updateNow, []);

  return (
    <NowContext.Provider
      value={{
        now,
        setOffsetMinutes,
      }}
    >
      {children}
    </NowContext.Provider>
  );
};

export const useNow = () => {
  const { now, setOffsetMinutes } = React.useContext(NowContext);

  return { now, setOffsetMinutes };
};