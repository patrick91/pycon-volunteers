import { useContext, createContext, type PropsWithChildren } from 'react';
import { useStorageState } from '@/hooks/use-storage-state';
import { useRouter } from 'expo-router';
type User = {
  id: string;
  email: string;
  conferenceRoles: string[];
};

const AuthContext = createContext<{
  signIn: (user: User) => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
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

export function SessionProvider({ children }: PropsWithChildren) {
  let [[isLoading, session], setSession] = useStorageState('session');

  session = session ? JSON.parse(session) : null;

  console.log('session', session);

  const router = useRouter();

  return (
    <AuthContext.Provider
      value={{
        signIn: (user: User) => {
          console.log('signIn', user);
          setSession(JSON.stringify(user));
        },
        signOut: () => {
          setSession(null);
          router.push('/sign-in');
        },
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
