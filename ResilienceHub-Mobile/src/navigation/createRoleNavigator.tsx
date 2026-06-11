import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme';
import DrawerHeader from '../components/navigation/DrawerHeader';
import LogoutButton from '../components/navigation/LogoutButton';
import LanguageSwitcher from '../components/navigation/LanguageSwitcher';
import { useLogout } from '../hooks/useLogout';
import { useNotifications } from '../hooks/queries/useNotifications';

type IconName = keyof typeof Ionicons.glyphMap;

export interface TabConfig {
  name: string;
  component: React.ComponentType<any>;
  title: string;
  iconActive: IconName;
  iconInactive: IconName;
  /** Hide from the tab bar but keep it reachable via navigation. */
  hidden?: boolean;
}

export type DrawerItemConfig =
  /** The home entry whose component is the nested tab navigator. */
  | { kind: 'tabsHome'; label: string; icon: IconName; targetTab: string }
  /** A drawer row that simply jumps to one of the nested tabs. */
  | { kind: 'tabLink'; routeName: string; label: string; icon: IconName; targetTab: string }
  /** A drawer row backed by its own screen component (not present in the tab bar). */
  | { kind: 'screen'; routeName: string; label: string; title: string; icon: IconName; component: React.ComponentType<any> };

export interface RoleNavConfig {
  /** Route name of the nested tab navigator, e.g. "HomeTabs". */
  tabsRouteName: string;
  tabs: TabConfig[];
  drawerHeaderIcon: IconName;
  drawerSubtitle: string;
  drawerItems: DrawerItemConfig[];
  showLanguageSwitcher?: boolean;
}

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const headerLeftMenu = (navigation: any) => () =>
  (
    <TouchableOpacity onPress={() => navigation.openDrawer()}>
      <Ionicons name="menu" size={26} color={COLORS.textLight} style={{ marginLeft: 16 }} />
    </TouchableOpacity>
  );

function NotificationBell({ navigation }: { navigation: any }) {
  const { data } = useNotifications();
  const unreadCount = (data ?? []).filter((n) => !n.isRead).length;
  return (
    <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={{ marginRight: 16 }}>
      <Ionicons name="notifications-outline" size={24} color={COLORS.textLight} />
      {unreadCount > 0 && (
        <View style={navStyles.badge}>
          <Text style={navStyles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const navStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});

const headerRightNotifications = (navigation: any) => () => (
  <NotificationBell navigation={navigation} />
);

/**
 * Builds the Drawer-wrapping-Tabs navigator for a role from a declarative config.
 * Replaces the three near-identical client/therapist/admin navigators.
 */
export function createRoleNavigator(config: RoleNavConfig) {
  function RoleTabs() {
    return (
      <Tab.Navigator
        screenOptions={({ route, navigation }) => {
          const tab = config.tabs.find((t) => t.name === route.name);
          return {
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab?.iconActive ?? 'ellipse' : tab?.iconInactive ?? 'ellipse-outline'}
                size={size}
                color={color}
              />
            ),
            tabBarActiveTintColor: COLORS.primaryGreen,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarStyle: { backgroundColor: COLORS.textLight },
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.darkGreen },
            headerTintColor: COLORS.textLight,
            headerTitleStyle: { fontWeight: 'bold' },
            headerLeft: headerLeftMenu(navigation),
            headerRight: headerRightNotifications(navigation),
          };
        }}
      >
        {config.tabs.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{ title: tab.title, ...(tab.hidden ? { tabBarButton: () => null } : {}) }}
          />
        ))}
      </Tab.Navigator>
    );
  }

  function RoleDrawerContent(props: any) {
    const handleLogout = useLogout(props.navigation);
    return (
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ flexGrow: 1, backgroundColor: COLORS.darkGreen }}
        style={{ backgroundColor: COLORS.darkGreen }}
      >
        <DrawerHeader icon={config.drawerHeaderIcon} subtitle={config.drawerSubtitle} />
        <View style={{ flex: 1, paddingTop: 10 }}>
          {config.drawerItems.map((item, index) => {
            const state = props.state;
            const activeRoute = state.routes[state.index];
            const focusedName = activeRoute.name === config.tabsRouteName
              ? getFocusedRouteNameFromRoute(activeRoute) ?? config.tabs[0].name
              : activeRoute.name;
              
            let isFocused = false;
            if (item.kind === 'tabsHome' || item.kind === 'tabLink') {
              isFocused = focusedName === item.targetTab;
            } else {
              isFocused = focusedName === item.routeName;
            }

            return (
              <DrawerItem
                key={index}
                label={item.label}
                icon={({ color, size }) => (
                  <Ionicons name={item.icon as any} size={size} color={color} />
                )}
                focused={isFocused}
                activeTintColor={COLORS.textLight}
                activeBackgroundColor={COLORS.drawerActiveBg}
                inactiveTintColor={COLORS.overlayText}
                labelStyle={{ fontWeight: '700', fontSize: 14 }}
                onPress={() => {
                  if (item.kind === 'tabsHome' || item.kind === 'tabLink') {
                    props.navigation.navigate(config.tabsRouteName, { screen: item.targetTab });
                  } else {
                    props.navigation.navigate(item.routeName);
                  }
                }}
              />
            );
          })}
        </View>
        {config.showLanguageSwitcher && <LanguageSwitcher />}
        <LogoutButton onPress={handleLogout} />
      </DrawerContentScrollView>
    );
  }

  return function RoleNavigator() {
    return (
      <Drawer.Navigator
        drawerContent={(props) => <RoleDrawerContent {...props} />}
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: COLORS.darkGreen },
          headerTintColor: COLORS.textLight,
          headerTitleStyle: { fontWeight: 'bold' },
          headerRight: headerRightNotifications(navigation),
          drawerActiveTintColor: COLORS.textLight,
          drawerActiveBackgroundColor: COLORS.drawerActiveBg,
          drawerInactiveTintColor: COLORS.overlayText,
          drawerStyle: { backgroundColor: COLORS.darkGreen, width: 270 },
          drawerLabelStyle: { fontWeight: '700', fontSize: 14 },
        })}
      >
        {config.drawerItems.filter((i) => i.kind !== 'tabLink').map((item) => {
          const drawerIcon = ({ color, size }: { color: string; size: number }) => (
            <Ionicons name={item.icon} size={size} color={color} />
          );

          if (item.kind === 'tabsHome') {
            return (
              <Drawer.Screen
                key="tabsHome"
                name={config.tabsRouteName}
                component={RoleTabs}
                options={{ headerShown: false, drawerLabel: item.label, drawerIcon }}
              />
            );
          }

          if (item.kind === 'screen') {
            return (
              <Drawer.Screen
                key={item.routeName}
                name={item.routeName}
                component={item.component}
                options={{ title: item.title, drawerLabel: item.label, drawerIcon }}
              />
            );
          }

          return null;
        })}
      </Drawer.Navigator>
    );
  };
}
