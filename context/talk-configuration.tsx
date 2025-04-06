import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useStorageState } from '@/hooks/use-storage-state';

type TalkConfiguration = {
  hasQa: boolean;
};

type TalkConfigurations = {
  [talkId: string]: TalkConfiguration;
};

type TalkConfigurationContextType = {
  getConfiguration: (talkId: string) => TalkConfiguration;
  setHasQa: (talkId: string, hasQa: boolean) => void;
};

const TalkConfigurationContext =
  createContext<TalkConfigurationContextType | null>(null);

export function TalkConfigurationProvider({
  children,
}: { children: ReactNode }) {
  const [[isLoading, state], setState] = useStorageState('talk-configurations');
  const [configurations, setConfigurations] = useState<TalkConfigurations>(
    state ? JSON.parse(state) : {},
  );

  // Update local state when storage changes
  useEffect(() => {
    if (state) {
      setConfigurations(JSON.parse(state));
    }
  }, [state]);

  const getConfiguration = (talkId: string): TalkConfiguration => {
    return configurations[talkId] || { hasQa: true };
  };

  const setHasQa = (talkId: string, hasQa: boolean) => {
    const newConfigurations = {
      ...configurations,
      [talkId]: {
        ...getConfiguration(talkId),
        hasQa,
      },
    };

    setState(JSON.stringify(newConfigurations));
    setConfigurations(newConfigurations);
  };

  const value = { getConfiguration, setHasQa };

  return (
    <TalkConfigurationContext.Provider value={value}>
      {children}
    </TalkConfigurationContext.Provider>
  );
}

export function useTalkConfiguration(talkId: string) {
  const context = useContext(TalkConfigurationContext);
  if (!context) {
    throw new Error(
      'useTalkConfiguration must be used within a TalkConfigurationProvider',
    );
  }

  const { getConfiguration, setHasQa } = context;
  const configuration = getConfiguration(talkId);

  return {
    hasQa: configuration.hasQa,
    setHasQa: (hasQa: boolean) => setHasQa(talkId, hasQa),
  };
}
