import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { graphql } from '@/graphql';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LOGIN_MUTATION = graphql(
    `mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
        __typename
        ... on LoginSuccess {
        user {
            id
            email
            }
            }
        ... on LoginErrors {
        errors {
            email
            password
            }
        
        }
    }
}
    `
)

export default function SignIn() {
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = (data: LoginFormData) => {
        console.log(data);
        // Handle login logic here
    };
    //https://stackoverflow.com/questions/58119124/best-order-for-keyboardavoidingview-safeareaview-and-scrollview
    return (
        <ScrollView contentContainerClassName='flex-1 p-6 justify-between' className='bg-white'>

            <Text className='font-sans-semibold text-black text-5xl'>Login</Text>

            <View>

                <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, value } }) => (
                        <View className='mb-8'>
                            <Label>Email</Label>
                            <Input
                                placeholder="guido@python.org"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                onChangeText={onChange}
                                value={value}
                            />
                            {errors.email && (
                                <Text className='mt-2 text-red-500 font-sans-semibold text-sm'
                                >{errors.email.message}</Text>
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
                                <Text
                                    className='mt-2 text-red-500 font-sans-semibold text-sm'
                                >{errors.password.message}</Text>
                            )}
                        </View>
                    )}
                />


            </View>

            <Button
                onPress={handleSubmit(onSubmit)}
            >
                Login
            </Button>
        </ScrollView>
    );
}

