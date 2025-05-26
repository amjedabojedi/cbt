import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import EmotionTrackingScreen from './src/screens/EmotionTrackingScreen';
import EmotionHistoryScreen from './src/screens/EmotionHistoryScreen';
import JournalScreen from './src/screens/JournalScreen';
import ThoughtRecordScreen from './src/screens/ThoughtRecordScreen';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Create query client for API calls (same as your web app)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// Tab Navigator Component
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'EmotionTracking') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'EmotionHistory') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Journal') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'ThoughtRecord') {
            iconName = focused ? 'bulb' : 'bulb-outline';
          } else {
            iconName = 'circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="EmotionTracking" 
        component={EmotionTrackingScreen}
        options={{ title: 'Track Emotion' }}
      />
      <Tab.Screen 
        name="EmotionHistory" 
        component={EmotionHistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen 
        name="Journal" 
        component={JournalScreen}
        options={{ title: 'Journal' }}
      />
      <Tab.Screen 
        name="ThoughtRecord" 
        component={ThoughtRecordScreen}
        options={{ title: 'CBT Tools' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
            />
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}