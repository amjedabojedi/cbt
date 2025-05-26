import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens (we'll create these next)
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import EmotionTrackingScreen from './src/screens/EmotionTrackingScreen';

// Create stack navigator
const Stack = createStackNavigator();

// Create query client for API calls (same as your web app)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Login"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#3B82F6',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ title: 'ResilienceHub' }}
            />
            <Stack.Screen 
              name="EmotionTracking" 
              component={EmotionTrackingScreen}
              options={{ title: 'Track Emotions' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}