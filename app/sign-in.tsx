import React from 'react';
import {
  View,
  Text,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { graphql, readFragment } from '@/graphql';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '@/components/logo';
import { useMutation } from '@apollo/client';
import { useRouter } from 'expo-router';
import { useSession } from '@/context/auth';
import { USER_PROFILE_FRAGMENT } from './(auth)/(tabs)/profile';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LOGIN_MUTATION = graphql(
  `
  mutation Login($email: String!, $password: String!) {
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

  const [login, { loading }] = useMutation(LOGIN_MUTATION);

  const onSubmit = async (data: LoginFormData) => {
    const result = await login({
      variables: { ...data },
    });

    if (result.data?.login.__typename === 'LoginSuccess') {
      const user = readFragment(USER_PROFILE_FRAGMENT, result.data.login.user);

      signIn(user);

      router.push('/(auth)/(tabs)');
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
      className="flex-1 bg-white"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerClassName="flex-1 p-6 justify-between"
          keyboardShouldPersistTaps="handled"
          style={{ paddingBottom: insets.bottom, paddingTop: insets.top }}
        >
          <View className="gap-6">
            <Logo width={150} />
            <Text className="font-sans-semibold text-black text-5xl">
              Login
            </Text>
          </View>

          <View>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <View className="mb-8">
                  <Label>Email</Label>
                  <Input
                    placeholder="guido@python.org"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onChangeText={onChange}
                    value={value}
                  />
                  {errors.email && (
                    <Text className="mt-2 text-red-500 font-sans-semibold text-sm">
                      {errors.email.message}
                    </Text>
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
                  />
                  {errors.password && (
                    <Text className="mt-2 text-red-500 font-sans-semibold text-sm">
                      {errors.password.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          <Button onPress={handleSubmit(onSubmit)} disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </Button>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
