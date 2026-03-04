import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useSession } from '@/context/auth';
import { AppIcon } from '@/components/ui/AppIcon';

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
            <AppIcon name="calendar" size={24} color={color} />
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
            <AppIcon name="storefront" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="sponsors/scan"
        options={{
          href: canSeeSponsorSection ? undefined : null,
          title: 'Scan',
          tabBarIcon: ({ color }) => (
            <AppIcon name="qrcode" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <AppIcon name="person.crop.circle" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
