import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, NavigatorScreenParams } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import Ionicons

import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import ImageGenScreen from '../screens/ImageGenScreen';
import LiveAudioScreen from '../screens/LiveAudioScreen';

// Define types for the bottom tab navigator
export type RootTabParamList = {
  Home: undefined;
  Chat: { conversationId?: string } | undefined;
  ImageGen: undefined;
  LiveAudio: undefined;
  History: undefined;
};

// Update RootStackParamList to include the bottom tab navigator and other stack screens
export type RootStackParamList = {
  RootTab: NavigatorScreenParams<RootTabParamList>; // Use NavigatorScreenParams for nested navigator types
  Settings: undefined;
  About: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

// Component for the bottom tab navigator
const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true, // Show the label with the icon
        tabBarPosition: 'bottom', // Position the tab bar at the bottom
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'ImageGen') {
            iconName = focused ? 'image' : 'image-outline';
          } else if (route.name === 'LiveAudio') {
            iconName = focused ? 'mic' : 'mic-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          }

          // You can return any component here as the icon
          return <Ionicons name={iconName!} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563EB', // Active tab color
        tabBarInactiveTintColor: 'gray', // Inactive tab color
        tabBarLabelStyle: { textTransform: 'none' }, // Prevent uppercase transformation
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'בית' }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarLabel: 'צ׳אט' }} />
      <Tab.Screen name="ImageGen" component={ImageGenScreen} options={{ tabBarLabel: 'תמונות' }} />
      <Tab.Screen name="LiveAudio" component={LiveAudioScreen} options={{ tabBarLabel: 'הקלטה' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'היסטוריה' }} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const scheme = useColorScheme();
  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator initialRouteName="RootTab" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RootTab" component={BottomTabNavigator} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
