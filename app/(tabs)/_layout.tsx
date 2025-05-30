import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSession } from '@/context/auth';

export default function TabLayout() {
  const { user } = useSession();

  const canSeeSponsorSection = user?.canSeeSponsorSection ?? false;

  return (
    <Tabs
      screenOptions={{
        freezeOnBlur: true,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
      }}
    >
      <Tabs.Screen name="index" options={{ href: null, title: 'Schedule' }} />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="event-note" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen name="profile/tickets" options={{ href: null }} />

      <Tabs.Screen
        name="sponsors/leads"
        options={{
          href: canSeeSponsorSection ? undefined : null,
          title: 'Leads',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="store" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="sponsors/scan"
        options={{
          href: canSeeSponsorSection ? undefined : null,
          title: 'Scan',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="qr-code" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="face-man-profile"
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
