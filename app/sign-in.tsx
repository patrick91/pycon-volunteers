import React from 'react';
import {
  View,
  Text,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/form/button';
import { graphql, readFragment } from '@/graphql';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '@/components/logo';
import { useMutation } from '@apollo/client';
import { useRouter } from 'expo-router';
import { useSession } from '@/context/auth';
import { USER_PROFILE_FRAGMENT } from './(auth)/(tabs)/profile';
import { useCurrentConference } from '@/hooks/use-current-conference';
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LOGIN_MUTATION = graphql(
  `
    mutation Login(
      $email: String!
      $password: String!
      $conferenceCode: String!
    ) {
      login(input: { email: $email, password: $password }) {
        __typename
        ... on LoginSuccess {
          user {
            ...UserProfile
          }
        }
        ... on WrongEmailOrPassword {
          message
        }
        ... on LoginErrors {
          errors {
            email
            password
          }
        }
      }
    }
  `,
  [USER_PROFILE_FRAGMENT],
);

export default function SignIn() {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useSession();
  const { code } = useCurrentConference();

  const [login, { loading }] = useMutation(LOGIN_MUTATION);

  const onSubmit = async (data: LoginFormData) => {
    const result = await login({
      variables: { ...data, conferenceCode: code },
    });

    if (result.data?.login.__typename === 'LoginSuccess') {
      const user = readFragment(USER_PROFILE_FRAGMENT, result.data.login.user);

      signIn(user);

      router.replace('/(auth)/(tabs)');
    } else if (result.data?.login.__typename === 'LoginErrors') {
      if (result.data.login.errors.email) {
        setError('email', {
          message: result.data.login.errors.email.join(', '),
        });
      }
      if (result.data.login.errors.password) {
        setError('password', {
          message: result.data.login.errors.password.join(', '),
        });
      }
    } else if (result.data?.login.__typename === 'WrongEmailOrPassword') {
      setError('password', {
        message: result.data.login.message,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardAvoidingView}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollViewContentContainer}
          keyboardShouldPersistTaps="handled"
          style={[
            styles.scrollView,
            { paddingBottom: insets.bottom, paddingTop: insets.top },
          ]}
        >
          <View style={styles.logoContainer}>
            <Logo width={150} />
            <Text style={styles.loginTitle}>Login</Text>
          </View>

          <View>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Label>Email</Label>
                  <Input
                    placeholder="guido@python.org"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onChangeText={onChange}
                    value={value}
                    textContentType="emailAddress"
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email.message}</Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <View>
                  <Label>Password</Label>
                  <Input
                    placeholder="ilovepyconit"
                    secureTextEntry
                    onChangeText={onChange}
                    value={value}
                    onSubmitEditing={handleSubmit(onSubmit)}
                    returnKeyType="done"
                    textContentType="password"
                  />
                  {errors.password && (
                    <Text style={styles.errorText}>
                      {errors.password.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            loading={loading}
          >
            Login
          </Button>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollViewContentContainer: {
    flex: 1,
    padding: 24, // p-6
    justifyContent: 'space-between',
  },
  scrollView: {
    // Existing inline styles for paddingBottom and paddingTop will be merged
  },
  logoContainer: {
    gap: 24, // gap-6
  },
  loginTitle: {
    fontFamily: 'sans-semibold', // font-sans-semibold - Note: React Native requires specific font family names. 'sans-semibold' might need adjustment based on actual font setup.
    color: 'black',
    fontSize: 48, // text-5xl
    lineHeight: 1 * 48, // Assuming default line height multiple
  },
  inputContainer: {
    marginBottom: 32, // mb-8
  },
  errorText: {
    marginTop: 8, // mt-2
    color: '#F56565', // text-red-500
    fontFamily: 'sans-semibold', // font-sans-semibold
    fontSize: 14, // text-sm
  },
});
