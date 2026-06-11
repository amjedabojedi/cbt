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
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useClearAllNotifications,
  Notification,
} from '../hooks/queries/useNotifications';

export default function NotificationsScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteOne = useDeleteNotification();
  const clearAll = useClearAllNotifications();

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: number) => markRead.mutate(id);
  const handleMarkAllRead = () => { if (unreadCount > 0) markAllRead.mutate(); };

  const handleDelete = (id: number) => deleteOne.mutate(id);

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      'Clear All Notifications?',
      'This will permanently delete all your notifications.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearAll.mutate(),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
      <View style={styles.cardHeader}>
        <View style={[styles.bellBox, !item.isRead ? styles.unreadBellBox : styles.readBellBox]}>
          <Feather
            name={item.isRead ? 'bell' : 'bell-off'}
            size={16}
            color={!item.isRead ? COLORS.primaryGreen : '#94A3B8'}
          />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.titleText, !item.isRead && styles.unreadTitleText]}>
            {item.title}
          </Text>
          <Text style={styles.dateText}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
          </Text>
        </View>
        {/* Delete button */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="x" size={14} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <Text style={styles.bodyText}>{item.body}</Text>

      {!item.isRead && (
        <TouchableOpacity style={styles.markReadButton} onPress={() => handleMarkAsRead(item.id)}>
          <Feather name="check" size={11} color={COLORS.primaryGreen} style={{ marginRight: 4 }} />
          <Text style={styles.markReadButtonText}>Mark as Read</Text>
        </TouchableOpacity>
      )}
    </View>
  );

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
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.markReadButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Action Header */}
      <View style={styles.actionHeader}>
        <Text style={styles.countText}>
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
        </Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.headerActionBtn} onPress={handleMarkAllRead}>
              <Feather name="check-circle" size={13} color={COLORS.primaryGreen} style={{ marginRight: 4 }} />
              <Text style={styles.headerActionText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity style={[styles.headerActionBtn, styles.clearBtn]} onPress={handleClearAll}>
              <Feather name="trash-2" size={13} color="#EF4444" style={{ marginRight: 4 }} />
              <Text style={[styles.headerActionText, { color: '#EF4444' }]}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '600' },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  countText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  clearBtn: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  headerActionText: { fontSize: 12, color: COLORS.primaryGreen, fontWeight: '700' },
  listContainer: { padding: 16 },
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
    borderColor: '#D1FAE5',
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primaryGreen,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  bellBox: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  unreadBellBox: { backgroundColor: '#ECFDF5' },
  readBellBox: { backgroundColor: '#F1F5F9' },
  headerTextWrap: { flex: 1 },
  titleText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  unreadTitleText: { color: '#1E293B', fontWeight: '800' },
  dateText: { fontSize: 10, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  deleteBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  bodyText: { fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 12 },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  markReadButtonText: { fontSize: 11, color: COLORS.primaryGreen, fontWeight: '700' },
  retryBtn: {
    marginTop: 12,
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, paddingBottom: 64,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#475569', marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
});
