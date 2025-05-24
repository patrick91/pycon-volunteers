import {
  useContext,
  createContext,
  type PropsWithChildren,
  useEffect,
} from 'react';
import { useStorageState } from '@/hooks/use-storage-state';
import { usePostHog } from 'posthog-react-native';
import { graphql } from '@/graphql';
import { useApolloClient, useMutation } from '@apollo/client';

type User = {
  id: string;
  email: string;
  fullName: string;
  conferenceRoles: string[];
  canSeeSponsorSection: boolean;
  canSeeTalkTimer: boolean;
};

const AuthContext = createContext<{
  signIn: (
    user: Pick<User, 'id' | 'email' | 'fullName' | 'conferenceRoles'>,
  ) => void;
  signOut: () => void;
  user: User | null;
  isLoading: boolean;
  isSigningOut: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
  user: null,
  isLoading: false,
  isSigningOut: false,
});

// This hook can be used to access the user info.
export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSession must be wrapped in a <SessionProvider />');
    }
  }

  return value;
}

const SIGN_OUT_MUTATION = graphql(`
  mutation SignOut {
    logout {
      ok
    }
  }
`);

export function SessionProvider({
  children,
  onSignOut,
}: PropsWithChildren<{ onSignOut: () => void }>) {
  const [[isLoading, sessionData], setSession] = useStorageState('session');
  const [signOut, { loading: isSigningOut }] = useMutation(SIGN_OUT_MUTATION);

  const posthog = usePostHog();

  const session = sessionData ? (JSON.parse(sessionData) as User) : null;

  useEffect(() => {
    if (session) {
      console.log('[Auth] Identifying user', session);

      posthog.identify(session.id, {
        email: session.email,
        name: session.fullName,
        conferenceRoles: session.conferenceRoles,
      });
    } else {
      posthog.reset();
    }

    posthog.reloadFeatureFlags();
  }, [session, posthog]);

  const client = useApolloClient();

  return (
    <AuthContext.Provider
      value={{
        signIn: (
          user: Pick<User, 'id' | 'email' | 'fullName' | 'conferenceRoles'>,
        ) => {
          const userInfo = {
            ...user,
            canSeeSponsorSection:
              user.conferenceRoles.includes('SPONSOR') ||
              user.conferenceRoles.includes('STAFF'),
            canSeeTalkTimer: user.conferenceRoles.includes('STAFF'),
          };

          setSession(JSON.stringify(userInfo));

          // not fully sure why expo does this (if it is expo)
          // but the schedule query seems to be triggered when showing
          // the login screen, so it loads the data before the user is
          // logged in.
          client.resetStore();
        },
        signOut: async () => {
          console.log('[Auth] Signing out');

          await signOut();

          setSession(null);

          onSignOut();

          posthog.reset();
        },
        isLoading,
        isSigningOut,
        user: session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
