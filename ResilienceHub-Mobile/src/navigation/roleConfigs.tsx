import { RoleNavConfig } from './createRoleNavigator';

// Client screens
import DashboardScreen from '../screens/DashboardScreen';
import EmotionTrackingScreen from '../screens/EmotionTrackingScreen';
import ThoughtRecordScreen from '../screens/ThoughtRecordScreen';
import ResourceLibraryScreen from '../screens/ResourceLibraryScreen';
import EmotionHistoryScreen from '../screens/EmotionHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import GoalsScreen from '../screens/GoalsScreen';
import JournalScreen from '../screens/JournalScreen';
import ReframeCoachScreen from '../screens/ReframeCoachScreen';
// Therapist / Admin screens
import TherapistDashboardScreen from '../screens/TherapistDashboardScreen';
import ClientDirectoryScreen from '../screens/ClientDirectoryScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import UserManagementScreen from '../screens/UserManagementScreen';

export const clientNavConfig: RoleNavConfig = {
  tabsRouteName: 'HomeTabs',
  drawerHeaderIcon: 'person-outline',
  drawerSubtitle: 'Client Portal',
  showLanguageSwitcher: true,
  tabs: [
    { name: 'Dashboard', component: DashboardScreen, title: 'Home', iconActive: 'home', iconInactive: 'home-outline' },
    { name: 'EmotionTracking', component: EmotionTrackingScreen, title: 'Track Emotion', iconActive: 'heart', iconInactive: 'heart-outline' },
    { name: 'ThoughtRecord', component: ThoughtRecordScreen, title: 'Thoughts', iconActive: 'bulb', iconInactive: 'bulb-outline' },
    { name: 'ResourceLibrary', component: ResourceLibraryScreen, title: 'Resources', iconActive: 'book', iconInactive: 'book-outline' },
    { name: 'EmotionHistory', component: EmotionHistoryScreen, title: 'Progress', iconActive: 'analytics', iconInactive: 'analytics-outline' },
    { name: 'Settings', component: SettingsScreen, title: 'Settings', iconActive: 'settings', iconInactive: 'settings-outline', hidden: true },
  ],
  drawerItems: [
    { kind: 'tabsHome', label: 'Home', icon: 'home-outline', targetTab: 'Dashboard' },
    { kind: 'tabLink', routeName: 'ThoughtRecordDrawer', label: 'Thoughts Records', icon: 'bulb-outline', targetTab: 'ThoughtRecord' },
    { kind: 'screen', routeName: 'Goals', label: 'SMART GOALS', title: 'SMART Goals', icon: 'flag-outline', component: GoalsScreen },
    { kind: 'screen', routeName: 'Journal', label: 'Journal', title: 'Journal', icon: 'book-outline', component: JournalScreen },
    { kind: 'screen', routeName: 'ReframeCoach', label: 'Reframe Coach', title: 'Reframe Coach', icon: 'flash-outline', component: ReframeCoachScreen },
    { kind: 'tabLink', routeName: 'Settings', label: 'Settings', icon: 'settings-outline', targetTab: 'Settings' },
  ],
};

export const therapistNavConfig: RoleNavConfig = {
  tabsRouteName: 'TherapistHomeTabs',
  drawerHeaderIcon: 'medical-outline',
  drawerSubtitle: 'Therapist Portal',
  tabs: [
    { name: 'TherapistHome', component: TherapistDashboardScreen, title: 'Dashboard', iconActive: 'home', iconInactive: 'home-outline' },
    { name: 'ClientDirectory', component: ClientDirectoryScreen, title: 'Clients', iconActive: 'people', iconInactive: 'people-outline' },
    { name: 'ResourceLibrary', component: ResourceLibraryScreen, title: 'Resources', iconActive: 'book', iconInactive: 'book-outline' },
    { name: 'Settings', component: SettingsScreen, title: 'Settings', iconActive: 'settings', iconInactive: 'settings-outline' },
  ],
  drawerItems: [
    { kind: 'tabsHome', label: 'Dashboard', icon: 'home-outline', targetTab: 'TherapistHome' },
    { kind: 'tabLink', routeName: 'ClientDirectoryDrawer', label: 'Clients', icon: 'people-outline', targetTab: 'ClientDirectory' },
    { kind: 'tabLink', routeName: 'ResourceLibraryDrawer', label: 'Resources', icon: 'book-outline', targetTab: 'ResourceLibrary' },
    { kind: 'tabLink', routeName: 'SettingsDrawer', label: 'Settings', icon: 'settings-outline', targetTab: 'Settings' },
  ],
};

export const adminNavConfig: RoleNavConfig = {
  tabsRouteName: 'AdminHomeTabs',
  drawerHeaderIcon: 'shield-checkmark-outline',
  drawerSubtitle: 'Admin Panel',
  tabs: [
    { name: 'AdminHome', component: AdminDashboardScreen, title: 'Admin', iconActive: 'shield-checkmark', iconInactive: 'shield-checkmark-outline' },
    { name: 'UserManagement', component: UserManagementScreen, title: 'Users', iconActive: 'people', iconInactive: 'people-outline' },
    { name: 'ClientDirectory', component: ClientDirectoryScreen, title: 'Clients', iconActive: 'person', iconInactive: 'person-outline' },
    { name: 'ResourceLibrary', component: ResourceLibraryScreen, title: 'Resources', iconActive: 'book', iconInactive: 'book-outline' },
    { name: 'Settings', component: SettingsScreen, title: 'Settings', iconActive: 'settings', iconInactive: 'settings-outline' },
  ],
  drawerItems: [
    { kind: 'tabsHome', label: 'Dashboard', icon: 'home-outline', targetTab: 'AdminHome' },
    { kind: 'tabLink', routeName: 'UserManagementDrawer', label: 'User Management', icon: 'people-outline', targetTab: 'UserManagement' },
    { kind: 'tabLink', routeName: 'ClientDirectoryAdmin', label: 'Clients', icon: 'person-outline', targetTab: 'ClientDirectory' },
    { kind: 'tabLink', routeName: 'ResourceLibraryAdmin', label: 'Resources', icon: 'book-outline', targetTab: 'ResourceLibrary' },
    { kind: 'tabLink', routeName: 'SettingsAdmin', label: 'Settings', icon: 'settings-outline', targetTab: 'Settings' },
  ],
};
