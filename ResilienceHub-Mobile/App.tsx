import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from './src/styles/theme';
import { AuthProvider } from './src/context/AuthContext';

// Auth / entry screens
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import RegisterScreen from './src/screens/RegisterScreen';
// Shared pushed screens
import NotificationsScreen from './src/screens/NotificationsScreen';
import ClientProfileScreen from './src/screens/ClientProfileScreen';
import ClientDataViewScreen from './src/screens/ClientDataViewScreen';
// Role navigators (config-driven — see src/navigation)
import { createRoleNavigator } from './src/navigation/createRoleNavigator';
import { clientNavConfig, therapistNavConfig, adminNavConfig } from './src/navigation/roleConfigs';

const Stack = createNativeStackNavigator();

// One drawer-wrapping-tabs navigator per role, generated from a declarative config.
const ClientNavigator = createRoleNavigator(clientNavConfig);
const TherapistNavigator = createRoleNavigator(therapistNavConfig);
const AdminNavigator = createRoleNavigator(adminNavConfig);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

const pushedScreenOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: COLORS.darkGreen },
  headerTintColor: COLORS.textLight,
  headerTitleStyle: { fontWeight: 'bold' as const },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />

            {/* Role home navigators */}
            <Stack.Screen name="MainTabs" component={ClientNavigator} />
            <Stack.Screen name="TherapistTabs" component={TherapistNavigator} />
            <Stack.Screen name="AdminTabs" component={AdminNavigator} />

            {/* Shared screens pushed onto the root stack */}
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ ...pushedScreenOptions, title: 'Notifications' }}
            />
            <Stack.Screen
              name="ClientProfile"
              component={ClientProfileScreen}
              options={({ route }: any) => ({
                ...pushedScreenOptions,
                title: route.params?.clientName || 'Client Profile',
              })}
            />
            <Stack.Screen
              name="ClientDataView"
              component={ClientDataViewScreen}
              options={({ route }: any) => ({
                ...pushedScreenOptions,
                title: route.params?.clientName || 'Client Data',
              })}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
