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
import * as Sentry from '@sentry/react-native';

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
}: PropsWithChildren<{ onSignOut: () => Promise<void> | void }>) {
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

  const clearCurrentUserFromCache = () => {
    client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'me' });
    client.cache.gc();
  };

  const addAuthApolloBreadcrumb = (
    message: string,
    level: 'info' | 'error' = 'info',
  ) => {
    Sentry.addBreadcrumb({
      category: 'auth.apollo',
      message,
      level,
    });
  };

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

          // Avoid resetStore/clearStore here: both cancel in-flight queries
          // and can surface Apollo invariant 42 as an unhandled rejection.
          clearCurrentUserFromCache();

          addAuthApolloBreadcrumb(
            'Starting observable query refetch after sign in',
          );
          void client
            .reFetchObservableQueries()
            .then(() => {
              addAuthApolloBreadcrumb(
                'Finished observable query refetch after sign in',
              );
            })
            .catch((error) => {
              addAuthApolloBreadcrumb(
                'Failed observable query refetch after sign in',
                'error',
              );
              console.error(
                '[Apollo] Error refetching queries after sign in:',
                error,
              );
            });
        },
        signOut: async () => {
          console.log('[Auth] Signing out');

          await signOut();

          clearCurrentUserFromCache();
          setSession(null);

          await onSignOut();

          addAuthApolloBreadcrumb(
            'Starting observable query refetch after sign out',
          );
          void client
            .reFetchObservableQueries()
            .then(() => {
              addAuthApolloBreadcrumb(
                'Finished observable query refetch after sign out',
              );
            })
            .catch((error) => {
              addAuthApolloBreadcrumb(
                'Failed observable query refetch after sign out',
                'error',
              );
              console.error(
                '[Apollo] Error refetching queries after sign out:',
                error,
              );
            });

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
