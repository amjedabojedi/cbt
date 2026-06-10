import React from 'react';
import { COLORS } from '../styles/theme';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  Notification,
} from '../hooks/queries/useNotifications';

export default function NotificationsScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data ?? [];

  const handleMarkAsRead = (id: number) => markRead.mutate(id);

  const handleMarkAllRead = () => {
    if (notifications.filter((n) => !n.isRead).length === 0) return;
    markAllRead.mutate();
  };

  const renderItem = ({ item }: { item: Notification }) => {
    return (
      <View style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
        <View style={styles.cardHeader}>
          <View style={[styles.bellBox, !item.isRead ? styles.unreadBellBox : styles.readBellBox]}>
            <Feather
              name={item.isRead ? "bell" : "bell-off"}
              size={16}
              color={!item.isRead ? COLORS.primaryGreen : "#94A3B8"}
            />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.titleText, !item.isRead && styles.unreadTitleText]}>
              {item.title}
            </Text>
            <Text style={styles.dateText}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now'}
            </Text>
          </View>
        </View>
        <Text style={styles.bodyText}>{item.body}</Text>
        {!item.isRead && (
          <TouchableOpacity
            style={styles.markReadButton}
            onPress={() => handleMarkAsRead(item.id)}
          >
            <Text style={styles.markReadButtonText}>Mark as Read</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color={COLORS.disabledBg} />
        <Text style={styles.emptyTitle}>Couldn't load notifications</Text>
        <Text style={styles.emptySubtitle}>Check your connection and try again.</Text>
        <TouchableOpacity style={styles.markReadButton} onPress={() => refetch()}>
          <Text style={styles.markReadButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={styles.container}>
      {/* Action Header */}
      <View style={styles.actionHeader}>
        <Text style={styles.countText}>
          {unreadCount > 0 ? `${unreadCount} unread notification(s)` : 'All caught up!'}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.readAllButton} onPress={handleMarkAllRead}>
            <Text style={styles.readAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={48} color={COLORS.disabledBg} />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySubtitle}>You'll see system reminders and alerts here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primaryGreen} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  countText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  readAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  readAllText: {
    fontSize: 13,
    color: COLORS.primaryGreen,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadCard: {
    borderColor: '#E9D5FF',
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primaryGreen,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bellBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  unreadBellBox: {
    backgroundColor: '#F3E8FF',
  },
  readBellBox: {
    backgroundColor: '#F1F5F9',
  },
  headerTextWrap: {
    flex: 1,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  unreadTitleText: {
    color: '#1E293B',
    fontWeight: '800',
  },
  dateText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  bodyText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  markReadButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ecfdf5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  markReadButtonText: {
    fontSize: 11,
    color: COLORS.primaryGreen,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 64,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
