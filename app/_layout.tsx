import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SessionProvider } from '@/context/auth';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
} from '@apollo/client';
import { useColorScheme } from '@/hooks/useColorScheme';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { loadErrorMessages, loadDevMessages } from '@apollo/client/dev';
import { onError } from '@apollo/client/link/error';
import '../global.css';
import { NowProvider } from '@/components/timer/context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TalkConfigurationProvider } from '@/context/talk-configuration';
import { usePostHog, PostHogProvider } from 'posthog-react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const APIProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  const errorLink = onError(({ graphQLErrors }) => {
    if (graphQLErrors) {
      console.log('graphQLErrors', graphQLErrors);
      const hasPermissionError = graphQLErrors.some(
        (error) => error.message === 'User not logged in',
      );

      if (hasPermissionError) {
        router.replace('/sign-in');
      }
    }
  });

  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: errorLink.concat(
      new HttpLink({
        uri: 'https://2025.pycon.it/graphql',
        credentials: 'include',
      }),
    ),
  });

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

if (__DEV__) {
  console.log('Loading dev messages');
  loadDevMessages();
  loadErrorMessages();
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    GeneralSans: require('../assets/fonts/GeneralSans-Regular.otf'),
    GeneralSansSemibold: require('../assets/fonts/GeneralSans-Semibold.otf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <PostHogProvider
      apiKey="phc_fsvj5ZUObZDpYQ4ggQgHt1lG8UY3E2z683TqjOeLDEr"
      options={{
        host: 'https://eu.i.posthog.com',
        enableSessionReplay: true,
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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NowProvider>
          <KeyboardProvider>
            <APIProvider>
              <SessionProvider>
                <TalkConfigurationProvider>
                  <ThemeProvider
                    value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
                  >
                    <Stack>
                      <Stack.Screen
                        name="(auth)"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="sign-in"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen name="+not-found" />
                    </Stack>
                    <StatusBar style="auto" />
                  </ThemeProvider>
                </TalkConfigurationProvider>
              </SessionProvider>
            </APIProvider>
          </KeyboardProvider>
        </NowProvider>
      </GestureHandlerRootView>
    </PostHogProvider>
  );
}
