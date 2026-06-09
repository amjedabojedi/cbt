import React from 'react';
import { TouchableOpacity, View, Text, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { ApiService } from './src/services/api';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import EmotionTrackingScreen from './src/screens/EmotionTrackingScreen';
import EmotionHistoryScreen from './src/screens/EmotionHistoryScreen';
import JournalScreen from './src/screens/JournalScreen';
import ThoughtRecordScreen from './src/screens/ThoughtRecordScreen';
import ResourceLibraryScreen from './src/screens/ResourceLibraryScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import ReframeCoachScreen from './src/screens/ReframeCoachScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TherapistDashboardScreen from './src/screens/TherapistDashboardScreen';
import ClientDirectoryScreen from './src/screens/ClientDirectoryScreen';
import ClientProfileScreen from './src/screens/ClientProfileScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import UserManagementScreen from './src/screens/UserManagementScreen';
import ClientDataViewScreen from './src/screens/ClientDataViewScreen';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Create query client for API calls
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// Tab Navigator Component (Bottom NavBar)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'EmotionTracking') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'ThoughtRecord') {
            iconName = focused ? 'bulb' : 'bulb-outline';
          } else if (route.name === 'ResourceLibrary') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'EmotionHistory') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else {
            iconName = 'circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8B5CF6', // Purple matching the redesigned dashboard theme
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#090514', // Dark purple AppBar background
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerLeft: () => (
          <TouchableOpacity onPress={() => (navigation as any).openDrawer()}>
            <Ionicons name="menu" size={26} color="#fff" style={{ marginLeft: 16 }} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={() => (navigation as any).navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#fff" style={{ marginRight: 16 }} />
          </TouchableOpacity>
        ),
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
        name="ThoughtRecord" 
        component={ThoughtRecordScreen}
        options={{ title: 'Thoughts' }}
      />
      <Tab.Screen 
        name="ResourceLibrary" 
        component={ResourceLibraryScreen}
        options={{ title: 'Resources' }}
      />
      <Tab.Screen 
        name="EmotionHistory" 
        component={EmotionHistoryScreen}
        options={{ title: 'Progress' }}
      />
    </Tab.Navigator>
  );
}

function CustomDrawerContent(props: any) {
  const [selectedLanguage, setSelectedLanguage] = React.useState<'en' | 'ar'>('en');

  React.useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const saved = await SecureStore.getItemAsync('appLanguage');
        if (saved === 'ar') {
          setSelectedLanguage('ar');
        } else {
          setSelectedLanguage('en');
        }
      } catch (e) {
        console.error('Failed to load language settings:', e);
      }
    };
    loadSavedLanguage();
  }, []);

  const handleSelectLanguage = async (lang: 'en' | 'ar') => {
    if (lang === 'ar') {
      Alert.alert(
        'Coming Soon',
        'Arabic version of the app is coming soon. We are working hard to bring you a fully localized experience.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedLanguage(lang);
    try {
      await SecureStore.setItemAsync('appLanguage', lang);
      Alert.alert(
        'Language Saved',
        'App language has been successfully updated to English.'
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to save language settings.');
    }
  };

  const handleLogout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userId');
      await SecureStore.deleteItemAsync('userEmail');
      await SecureStore.deleteItemAsync('userRole');
      props.navigation.replace('Login');
    }
  };

  return (
    <DrawerContentScrollView 
      {...props} 
      contentContainerStyle={{ flexGrow: 1, backgroundColor: '#090514' }}
      style={{ backgroundColor: '#090514' }}
    >
      {/* Drawer Header */}
      <View style={{ padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)', marginBottom: 16, alignItems: 'center' }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(192, 132, 252, 0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: '#C084FC' }}>
          <Ionicons name="person-outline" size={26} color="#C084FC" />
        </View>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>ResilienceHub</Text>
        <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 11, marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: '700' }}>Client Portal</Text>
      </View>

      {/* Drawer Items */}
      <View style={{ flex: 1 }}>
        <DrawerItemList {...props} />
      </View>

      {/* Language Switcher */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="globe-outline" size={14} color="#C084FC" style={{ marginRight: 6 }} />
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>Language</Text>
        </View>
        <View style={{ 
          flexDirection: 'row', 
          backgroundColor: 'rgba(255, 255, 255, 0.04)', 
          borderRadius: 20, 
          padding: 2, 
          borderWidth: 1, 
          borderColor: 'rgba(255, 255, 255, 0.08)',
          width: 160,
          alignSelf: 'flex-start'
        }}>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => handleSelectLanguage('en')}
            style={{ 
              flex: 1, 
              paddingVertical: 4, 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderRadius: 18, 
              backgroundColor: selectedLanguage === 'en' ? '#8B5CF6' : 'transparent' 
            }}
          >
            <Text style={{ color: selectedLanguage === 'en' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)', fontSize: 11.5, fontWeight: 'bold', textAlign: 'center' }}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => handleSelectLanguage('ar')}
            style={{ 
              flex: 1, 
              paddingVertical: 4, 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderRadius: 18, 
              backgroundColor: selectedLanguage === 'ar' ? '#8B5CF6' : 'transparent' 
            }}
          >
            <Text style={{ color: selectedLanguage === 'ar' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)', fontSize: 11.5, fontWeight: 'bold', textAlign: 'center' }}>العربية</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)' }}>
        <TouchableOpacity 
          onPress={handleLogout}
          activeOpacity={0.7}
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            paddingVertical: 12, 
            paddingHorizontal: 16, 
            borderRadius: 12, 
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            borderWidth: 1,
            borderColor: 'rgba(239, 68, 68, 0.2)'
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={{ color: '#EF4444', fontWeight: 'bold', marginLeft: 12, fontSize: 14 }}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

// Drawer Navigator Component (Sidebar Menu)
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: '#090514', // Dark purple AppBar background
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <TouchableOpacity onPress={() => (navigation as any).navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#fff" style={{ marginRight: 16 }} />
          </TouchableOpacity>
        ),
        drawerActiveTintColor: '#FFFFFF',
        drawerActiveBackgroundColor: 'rgba(192, 132, 252, 0.15)',
        drawerInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        drawerStyle: {
          backgroundColor: '#090514',
          width: 270,
        },
        drawerLabelStyle: {
          fontWeight: '700',
          fontSize: 14,
        }
      })}
    >
      {/* Tab Navigator nested inside the Drawer */}
      <Drawer.Screen 
        name="HomeTabs" 
        component={MainTabs}
        options={{ 
          headerShown: false, // Managed by individual tab screens
          title: 'ResilienceHub',
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="ThoughtRecordDrawer" 
        component={View}
        options={{ 
          title: 'Thoughts Records',
          drawerLabel: 'Thoughts Records',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="bulb-outline" size={size} color={color} />
          )
        }}
        listeners={({ navigation }) => ({
          drawerItemPress: (e) => {
            e.preventDefault();
            navigation.navigate('HomeTabs', { screen: 'ThoughtRecord' });
          },
        })}
      />
      <Drawer.Screen 
        name="Goals" 
        component={GoalsScreen}
        options={{ 
          title: 'SMART Goals',
          drawerLabel: 'SMART GOALS',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="flag-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Journal" 
        component={JournalScreen}
        options={{ 
          title: 'Journal',
          drawerLabel: 'Journal',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="ReframeCoach" 
        component={ReframeCoachScreen}
        options={{ 
          title: 'Reframe Coach',
          drawerLabel: 'Reframe Coach',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="flash-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: 'Settings',
          drawerLabel: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          )
        }}
      />
    </Drawer.Navigator>
  );
}

// ──────────────────────────────────────────────
// THERAPIST NAVIGATOR
// ──────────────────────────────────────────────

function TherapistTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'TherapistHome') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'ClientDirectory') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'ResourceLibrary') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
          else iconName = 'circle';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        headerStyle: { backgroundColor: '#090514' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerLeft: () => (
          <TouchableOpacity onPress={() => (navigation as any).openDrawer()}>
            <Ionicons name="menu" size={26} color="#fff" style={{ marginLeft: 16 }} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={() => (navigation as any).navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#fff" style={{ marginRight: 16 }} />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="TherapistHome" component={TherapistDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="ClientDirectory" component={ClientDirectoryScreen} options={{ title: 'Clients' }} />
      <Tab.Screen name="ResourceLibrary" component={ResourceLibraryScreen} options={{ title: 'Resources' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

function TherapistDrawerContent(props: any) {
  const handleLogout = async () => {
    try { await ApiService.logout(); } catch {}
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('userId');
    await SecureStore.deleteItemAsync('userEmail');
    await SecureStore.deleteItemAsync('userRole');
    props.navigation.replace('Login');
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1, backgroundColor: '#090514' }} style={{ backgroundColor: '#090514' }}>
      <View style={{ padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: 16, alignItems: 'center' }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(192,132,252,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: '#C084FC' }}>
          <Ionicons name="medical-outline" size={26} color="#C084FC" />
        </View>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>ResilienceHub</Text>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: '700' }}>Therapist Portal</Text>
      </View>
      <View style={{ flex: 1 }}>
        <DrawerItemList {...props} />
      </View>
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={{ color: '#EF4444', fontWeight: 'bold', marginLeft: 12, fontSize: 14 }}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

function TherapistDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <TherapistDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#090514' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        drawerActiveTintColor: '#FFFFFF',
        drawerActiveBackgroundColor: 'rgba(192,132,252,0.15)',
        drawerInactiveTintColor: 'rgba(255,255,255,0.6)',
        drawerStyle: { backgroundColor: '#090514', width: 270 },
        drawerLabelStyle: { fontWeight: '700', fontSize: 14 },
      }}
    >
      <Drawer.Screen name="TherapistHomeTabs" component={TherapistTabs} options={{ headerShown: false, drawerLabel: 'Dashboard', drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }} />
      <Drawer.Screen name="ClientDirectoryDrawer" component={View} options={{ drawerLabel: 'Clients', drawerIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> }} listeners={({ navigation }) => ({ drawerItemPress: (e) => { e.preventDefault(); navigation.navigate('TherapistHomeTabs', { screen: 'ClientDirectory' }); } })} />
      <Drawer.Screen name="ResourceLibraryDrawer" component={View} options={{ drawerLabel: 'Resources', drawerIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} /> }} listeners={({ navigation }) => ({ drawerItemPress: (e) => { e.preventDefault(); navigation.navigate('TherapistHomeTabs', { screen: 'ResourceLibrary' }); } })} />
      <Drawer.Screen name="SettingsDrawer" component={View} options={{ drawerLabel: 'Settings', drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }} listeners={({ navigation }) => ({ drawerItemPress: (e) => { e.preventDefault(); navigation.navigate('TherapistHomeTabs', { screen: 'Settings' }); } })} />
    </Drawer.Navigator>
  );
}

// ──────────────────────────────────────────────
// ADMIN NAVIGATOR
// ──────────────────────────────────────────────

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'AdminHome') iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          else if (route.name === 'UserManagement') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'ClientDirectory') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'ResourceLibrary') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
          else iconName = 'circle';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        headerStyle: { backgroundColor: '#090514' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerLeft: () => (
          <TouchableOpacity onPress={() => (navigation as any).openDrawer()}>
            <Ionicons name="menu" size={26} color="#fff" style={{ marginLeft: 16 }} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={() => (navigation as any).navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#fff" style={{ marginRight: 16 }} />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="AdminHome" component={AdminDashboardScreen} options={{ title: 'Admin' }} />
      <Tab.Screen name="UserManagement" component={UserManagementScreen} options={{ title: 'Users' }} />
      <Tab.Screen name="ClientDirectory" component={ClientDirectoryScreen} options={{ title: 'Clients' }} />
      <Tab.Screen name="ResourceLibrary" component={ResourceLibraryScreen} options={{ title: 'Resources' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

function AdminDrawerContent(props: any) {
  const handleLogout = async () => {
    try { await ApiService.logout(); } catch {}
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('userId');
    await SecureStore.deleteItemAsync('userEmail');
    await SecureStore.deleteItemAsync('userRole');
    props.navigation.replace('Login');
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1, backgroundColor: '#090514' }} style={{ backgroundColor: '#090514' }}>
      <View style={{ padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: 16, alignItems: 'center' }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(192,132,252,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: '#C084FC' }}>
          <Ionicons name="shield-checkmark-outline" size={26} color="#C084FC" />
        </View>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>ResilienceHub</Text>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: '700' }}>Admin Panel</Text>
      </View>
      <View style={{ flex: 1 }}>
        <DrawerItemList {...props} />
      </View>
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={{ color: '#EF4444', fontWeight: 'bold', marginLeft: 12, fontSize: 14 }}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

function AdminDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <AdminDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#090514' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        drawerActiveTintColor: '#FFFFFF',
        drawerActiveBackgroundColor: 'rgba(192,132,252,0.15)',
        drawerInactiveTintColor: 'rgba(255,255,255,0.6)',
        drawerStyle: { backgroundColor: '#090514', width: 270 },
        drawerLabelStyle: { fontWeight: '700', fontSize: 14 },
      }}
    >
      <Drawer.Screen name="AdminHomeTabs" component={AdminTabs} options={{ headerShown: false, drawerLabel: 'Dashboard', drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }} />
      <Drawer.Screen name="UserManagementDrawer" component={View} options={{ drawerLabel: 'User Management', drawerIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> }} listeners={({ navigation }) => ({ drawerItemPress: (e) => { e.preventDefault(); navigation.navigate('AdminHomeTabs', { screen: 'UserManagement' }); } })} />
      <Drawer.Screen name="ClientDirectoryAdmin" component={View} options={{ drawerLabel: 'Clients', drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} listeners={({ navigation }) => ({ drawerItemPress: (e) => { e.preventDefault(); navigation.navigate('AdminHomeTabs', { screen: 'ClientDirectory' }); } })} />
      <Drawer.Screen name="ResourceLibraryAdmin" component={View} options={{ drawerLabel: 'Resources', drawerIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} /> }} listeners={({ navigation }) => ({ drawerItemPress: (e) => { e.preventDefault(); navigation.navigate('AdminHomeTabs', { screen: 'ResourceLibrary' }); } })} />
      <Drawer.Screen name="SettingsAdmin" component={View} options={{ drawerLabel: 'Settings', drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }} listeners={({ navigation }) => ({ drawerItemPress: (e) => { e.preventDefault(); navigation.navigate('AdminHomeTabs', { screen: 'Settings' }); } })} />
    </Drawer.Navigator>
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
              name="Onboarding" 
              component={OnboardingScreen}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
            />
            {/* Client tabs */}
            <Stack.Screen name="MainTabs" component={DrawerNavigator} />
            {/* Therapist tabs */}
            <Stack.Screen name="TherapistTabs" component={TherapistDrawerNavigator} />
            {/* Admin tabs */}
            <Stack.Screen name="AdminTabs" component={AdminDrawerNavigator} />
            {/* Notifications Screen pushed onto stack */}
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{
                headerShown: true,
                title: 'Notifications',
                headerStyle: { backgroundColor: '#090514' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            {/* Client Profile — shared across therapist + admin navigators */}
            <Stack.Screen
              name="ClientProfile"
              component={ClientProfileScreen}
              options={({ route }: any) => ({
                headerShown: true,
                title: route.params?.clientName || 'Client Profile',
                headerStyle: { backgroundColor: '#090514' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              })}
            />
            {/* Client Data View — therapist/admin view of client's clinical data */}
            <Stack.Screen
              name="ClientDataView"
              component={ClientDataViewScreen}
              options={({ route }: any) => ({
                headerShown: true,
                title: route.params?.clientName || 'Client Data',
                headerStyle: { backgroundColor: '#090514' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              })}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}