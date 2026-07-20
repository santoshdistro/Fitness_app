import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  BarChart3,
  Compass,
  Dumbbell,
  Home as HomeIcon,
  Users,
} from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';

const Tab = createBottomTabNavigator();

function homeTabIcon({ color, size }: { color: string; size: number }) {
  return <HomeIcon color={color} size={size} strokeWidth={2.5} />;
}
function statsTabIcon({ color, size }: { color: string; size: number }) {
  return <BarChart3 color={color} size={size} strokeWidth={2.5} />;
}
function discoverTabIcon({ color, size }: { color: string; size: number }) {
  return <Compass color={color} size={size} strokeWidth={2.5} />;
}
function communityTabIcon({ color, size }: { color: string; size: number }) {
  return <Users color={color} size={size} strokeWidth={2.5} />;
}
function workoutsTabIcon({ color, size }: { color: string; size: number }) {
  return <Dumbbell color={color} size={size} strokeWidth={2.5} />;
}

function DiscoverScreen() {
  return <PlaceholderScreen title="Discover" />;
}
function CommunityScreen() {
  return <PlaceholderScreen title="Community" />;
}
function WorkoutsScreen() {
  return <PlaceholderScreen title="Workouts" />;
}

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderTopColor: '#f3f4f6',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: homeTabIcon }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ tabBarIcon: statsTabIcon }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ tabBarIcon: discoverTabIcon }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{ tabBarIcon: communityTabIcon }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutsScreen}
        options={{ tabBarIcon: workoutsTabIcon }}
      />
    </Tab.Navigator>
  );
}
