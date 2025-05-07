import {
  useContext,
  createContext,
  type PropsWithChildren,
  useEffect,
} from "react";
import { useStorageState } from "@/hooks/use-storage-state";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { graphql } from "@/graphql";
import { useMutation } from "@apollo/client";

type User = {
  id: string;
  email: string;
  fullName: string;
  conferenceRoles: string[];
  canSeeSponsorSection: boolean;
  canSeeTalkTimer: boolean;
};

const AuthContext = createContext<{
  signIn: (user: User) => void;
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
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
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
  const [[isLoading, sessionData], setSession] = useStorageState("session");
  const [signOut, { loading: isSigningOut }] = useMutation(SIGN_OUT_MUTATION);

  const posthog = usePostHog();

  const session = sessionData ? (JSON.parse(sessionData) as User) : null;

  useEffect(() => {
    if (session) {
      console.log("[Auth] Identifying user", session);

      // posthog.identify(session.id, {
      //   email: session.email,
      //   name: session.fullName,
      //   conferenceRoles: session.conferenceRoles,
      // });
    } else {
      // posthog.reset();
    }

    // posthog.reloadFeatureFlags();
  }, [session, posthog]);

  const router = useRouter();
  return (
    <AuthContext.Provider
      value={{
        signIn: (user: User) => {
          const userInfo = {
            ...user,
            canSeeSponsorSection: user.conferenceRoles.includes("SPONSOR"),
            canSeeTalkTimer: user.conferenceRoles.includes("STAFF"),
          };

          setSession(JSON.stringify(userInfo));
        },
        signOut: async () => {
          await signOut();

          setSession(null);

          router.push("/sign-in");

          onSignOut();

          // posthog.reset();
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
