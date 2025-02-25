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
import { NowContext, NowProvider } from '@/components/timer/context';

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
    <NowProvider>
      <KeyboardProvider>
        <APIProvider>
          <SessionProvider>
          <ThemeProvider
            value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen name="(app)" options={{ headerShown: false }} />
              <Stack.Screen name="sign-in" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
          </SessionProvider>
        </APIProvider>
      </KeyboardProvider>
    </NowProvider>
  );
}
