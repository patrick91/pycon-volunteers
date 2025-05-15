import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionProvider, useSession } from '@/context/auth';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
  NormalizedCacheObject,
  ApolloLink,
} from '@apollo/client';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { loadErrorMessages, loadDevMessages } from '@apollo/client/dev';
import { onError } from '@apollo/client/link/error';
import { AsyncStorageWrapper, CachePersistor } from 'apollo3-cache-persist';
import '../global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TalkConfigurationProvider } from '@/context/talk-configuration';
import { PostHogProvider } from 'posthog-react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://04b3849882e246c3a3252f0d09d5b9bf@o296856.ingest.us.sentry.io/4505223715946496',

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const cache = new InMemoryCache();

const APIProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [client, setClient] = useState<ApolloClient<any> | null>(null);

  const [persistor, setPersistor] =
    useState<CachePersistor<NormalizedCacheObject>>();

  // Initialize cache persistence and create Apollo client
  // biome-ignore lint/correctness/useExhaustiveDependencies: not needed
  useEffect(() => {
    const initCache = async () => {
      console.log('[Apollo] Initializing cache persistence');

      try {
        // const persistor = new CachePersistor({
        //   cache,
        //   storage: new AsyncStorageWrapper(AsyncStorage),
        //   debug: __DEV__,
        // });

        // await persistor.restore();

        const responseLogger = new ApolloLink((operation, forward) => {
          return forward(operation).map((result) => {
            console.info(operation);
            return result;
          });
        });

        const apolloClient = new ApolloClient({
          cache,
          link: responseLogger.concat(
            new HttpLink({
              uri: 'https://2025.pycon.it/graphql',
              credentials: 'include',
            }),
          ),
        });

        // setPersistor(persistor);
        setClient(apolloClient);
        console.log('[Apollo] Client created and initialized');
      } catch (error) {
        console.error('[Apollo] Error initializing cache:', error);
      }
    };

    initCache();
  }, []);

  if (!client) {
    return null; // or a loading spinner
  }

  return (
    <ApolloProvider client={client}>
      <SessionProvider
        onSignOut={() => {
          console.log('[Apollo] Signing out');

          persistor?.remove();
          persistor?.purge();
          client.resetStore();
        }}
      >
        {children}
      </SessionProvider>
    </ApolloProvider>
  );
};

if (__DEV__) {
  console.log('Loading dev messages');
  loadDevMessages();
  loadErrorMessages();
}

const AppStack = ({ fontsLoaded }: { fontsLoaded: boolean }) => {
  const { user, isLoading } = useSession();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
      setIsReady(true);
    }
  }, [fontsLoaded, isLoading]);

  if (!isReady) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)/sponsors" />
      </Stack.Protected>

      <Stack.Screen
        name="sign-in"
        options={{ headerShown: false, presentation: 'modal' }}
      />

      <Stack.Screen name="+not-found" />
    </Stack>
  );
};

export default function RootLayout() {
  const [loaded] = useFonts({
    GeneralSans: require('../assets/fonts/GeneralSans-Regular.otf'),
    GeneralSansSemibold: require('../assets/fonts/GeneralSans-Semibold.otf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <PostHogProvider
      apiKey="phc_fsvj5ZUObZDpYQ4ggQgHt1lG8UY3E2z683TqjOeLDEr"
      options={{
        host: 'https://eu.i.posthog.com',
        enableSessionReplay: true,
        preloadFeatureFlags: true,
        persistence: 'memory',
        sessionReplayConfig: {
          // Whether text inputs are masked. Default is true.
          // Password inputs are always masked regardless
          maskAllTextInputs: true,
          // Whether images are masked. Default is true.
          maskAllImages: true,
          // Capture logs automatically. Default is true.
          // Android only (Native Logcat only)
          captureLog: true,
          // Whether network requests are captured in recordings. Default is true
          // Only metric-like data like speed, size, and response code are captured.
          // No data is captured from the request or response body.
          // iOS only
          captureNetworkTelemetry: true,
          // Deboucer delay used to reduce the number of snapshots captured and reduce performance impact. Default is 500ms
          androidDebouncerDelayMs: 500,
          // Deboucer delay used to reduce the number of snapshots captured and reduce performance impact. Default is 1000ms
          iOSdebouncerDelayMs: 1000,
        },
      }}
    >
      <APIProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <KeyboardProvider>
              <TalkConfigurationProvider>
                <AppStack fontsLoaded={loaded} />
                <StatusBar style="auto" />
              </TalkConfigurationProvider>
            </KeyboardProvider>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </APIProvider>
    </PostHogProvider>
  );
}
