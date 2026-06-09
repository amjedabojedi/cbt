import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { ApiService } from '../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.48;

interface TherapistDashboardScreenProps {
  navigation: any;
}

export default function TherapistDashboardScreen({ navigation }: TherapistDashboardScreenProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [journalCount, setJournalCount] = useState(0);
  const [thoughtCount, setThoughtCount] = useState(0);
  const [goalCount, setGoalCount] = useState(0);

  // Invite client
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const fetchData = async () => {
        try {
          const userRes = await ApiService.getCurrentUser();
          if (!userRes.data || userRes.error) {
            navigation.navigate('Login');
            return;
          }
          if (isMounted) setUser(userRes.data);

          const [clientsRes, journalRes, thoughtRes, goalRes] = await Promise.all([
            ApiService.getTherapistClients(),
            ApiService.getTherapistJournalStats(),
            ApiService.getTherapistThoughtStats(),
            ApiService.getTherapistGoalStats(),
          ]);

          if (!isMounted) return;

          setClients(clientsRes.data || []);
          setJournalCount((journalRes.data as any)?.totalCount ?? 0);
          setThoughtCount((thoughtRes.data as any)?.totalCount ?? 0);
          setGoalCount((goalRes.data as any)?.totalCount ?? 0);
        } catch (error) {
          console.error('Error fetching therapist dashboard:', error);
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      fetchData();
      return () => { isMounted = false; };
    }, [])
  );

  const totalClients = clients.length;
  const activeClients = clients.filter((c: any) => c.status === 'active').length;
  const newClients = clients.filter((c: any) => {
    if (!c.createdAt) return false;
    const d = new Date(c.createdAt);
    const ago = new Date();
    ago.setDate(ago.getDate() - 14);
    return d > ago;
  }).length;
  const activeRate = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;

  const displayName = user?.name ? user.name.split(' ')[0] : 'Doctor';
  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'DR';

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const getInitials = (name: string, username: string) => {
    const displayName = name || username || '';
    const parts = displayName.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  };

  const handleInviteClient = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      Alert.alert('Validation', 'Please enter both name and email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      Alert.alert('Validation', 'Please enter a valid email address.');
      return;
    }
    setInviting(true);
    try {
      const res = await ApiService.inviteClient({ name: inviteName.trim(), email: inviteEmail.trim() });
      if (res.error) {
        Alert.alert('Error', res.error);
      } else {
        Alert.alert('Invitation Sent!', 'The client invitation has been sent successfully.');
        setInviteName('');
        setInviteEmail('');
        setInviteModalVisible(false);
      }
    } catch {
      Alert.alert('Error', 'Failed to send invitation.');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading your practice...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.heroTagRow}>
                <Ionicons name="medical-outline" size={14} color="#34d399" />
                <Text style={styles.heroTag}>CLINICAL WORKSPACE</Text>
              </View>
              <Text style={styles.heroGreeting}>{timeGreeting},</Text>
              <Text style={styles.heroName}>{displayName}</Text>
              <Text style={styles.heroSubtitle}>Manage your practice and view client insights.</Text>
            </View>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{userInitials}</Text>
            </View>
          </View>

          {/* Top Stats Row */}
          <View style={styles.topStatsRow}>
            {[
              { value: totalClients, label: 'Clients' },
              { value: `${activeRate}%`, label: 'Engagement' },
              { value: newClients, label: 'New (14d)' },
            ].map((s, i) => (
              <View key={i} style={styles.topStatItem}>
                <Text style={styles.topStatValue}>{s.value}</Text>
                <Text style={styles.topStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Practice Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="bar-chart-2" size={14} color="#581C87" />
            <Text style={styles.sectionTitle}>PRACTICE OVERVIEW</Text>
          </View>
          <View style={styles.statsGrid}>
            {[
              { icon: 'users', label: 'Total Clients', value: totalClients, sub: `${newClients} new in 14 days`, color: '#059669' },
              { icon: 'user-check', label: 'Active Clients', value: activeClients, sub: `${activeRate}% engagement`, color: '#10B981' },
              { icon: 'user-plus', label: 'New Clients', value: newClients, sub: 'Last 14 days', color: '#6366F1' },
              { icon: 'book-open', label: 'Journal Entries', value: journalCount, sub: 'Across all clients', color: '#F59E0B' },
              { icon: 'cpu', label: 'Thought Records', value: thoughtCount, sub: 'Across all clients', color: '#059669' },
              { icon: 'target', label: 'Active Goals', value: goalCount, sub: 'Across all clients', color: '#EF4444' },
            ].map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: `${stat.color}15` }]}>
                  <Feather name={stat.icon as any} size={18} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statSub}>{stat.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Clients Carousel */}
        {clients.length > 0 && (
          <View style={styles.carouselSection}>
            <View style={[styles.sectionHeader, { justifyContent: 'space-between', paddingHorizontal: 20 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="sparkles" size={14} color="#581C87" />
                <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>RECENT CLIENTS</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('ClientDirectory')}>
                <Text style={styles.viewAllLink}>View all →</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={clients.slice(0, 8)}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              snapToInterval={CARD_WIDTH + 14}
              decelerationRate="fast"
              renderItem={({ item: client }) => {
                const isActive = client.status === 'active';
                const joinedDate = client.createdAt
                  ? new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : null;
                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.clientCard}
                    onPress={() => navigation.navigate('ClientDirectory')}
                  >
                    {/* Status pill */}
                    <View style={[styles.statusPill, isActive ? styles.statusPillActive : styles.statusPillInactive]}>
                      <View style={[styles.statusDot, { backgroundColor: isActive ? '#10B981' : '#CBD5E1' }]} />
                      <Text style={[styles.statusPillText, { color: isActive ? '#059669' : '#94A3B8' }]}>
                        {client.status || 'unknown'}
                      </Text>
                    </View>

                    {/* Avatar */}
                    <View style={styles.cardAvatar}>
                      <Text style={styles.cardAvatarText}>{getInitials(client.name, client.username)}</Text>
                    </View>

                    {/* Name & email */}
                    <Text style={styles.cardName} numberOfLines={1}>
                      {client.name || client.username}
                    </Text>
                    <Text style={styles.cardEmail} numberOfLines={1}>{client.email}</Text>

                    {/* Divider */}
                    <View style={styles.cardDivider} />

                    {/* Footer */}
                    <View style={styles.cardFooter}>
                      <Feather name="calendar" size={11} color="#94A3B8" />
                      <Text style={styles.cardFooterText}>
                        {joinedDate ? `Joined ${joinedDate}` : 'Client'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* Empty state */}
        {!loading && clients.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="sparkles" size={32} color="#581C87" />
            </View>
            <Text style={styles.emptyTitle}>No clients yet</Text>
            <Text style={styles.emptyDesc}>Invite clients to start building your practice and tracking progress.</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.emptyButton}
              onPress={() => navigation.navigate('ClientDirectory')}
            >
              <Feather name="user-plus" size={16} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Invite Your First Client</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* FAB — Invite Client */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setInviteModalVisible(true)}
        activeOpacity={0.85}
      >
        <Feather name="user-plus" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Invite Client Modal */}
      <Modal visible={inviteModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Invite Client</Text>
                <Text style={styles.modalSub}>Send a secure invitation link via email</Text>
              </View>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Client Name</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Jane Smith"
              placeholderTextColor="#94A3B8"
              value={inviteName}
              onChangeText={setInviteName}
            />

            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="client@example.com"
              placeholderTextColor="#94A3B8"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TouchableOpacity
              style={[styles.sendBtn, inviting && { opacity: 0.7 }]}
              onPress={handleInviteClient}
              disabled={inviting}
              activeOpacity={0.8}
            >
              {inviting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="send" size={16} color="#FFFFFF" />
                  <Text style={styles.sendBtnText}>Send Invitation</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '600' },

  // Hero
  heroBanner: {
    backgroundColor: '#052e16',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroTagRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  heroTag: { color: '#34d399', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginLeft: 6 },
  heroGreeting: { fontSize: 16, color: '#34d399', fontWeight: '600' },
  heroName: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginTop: 2 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6, lineHeight: 18 },
  avatarBox: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(5,150,105,0.15)',
    borderWidth: 1.5, borderColor: '#059669',
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  avatarText: { color: '#34d399', fontSize: 16, fontWeight: 'bold' },
  topStatsRow: {
    flexDirection: 'row', justifyContent: 'space-around', marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingVertical: 14,
  },
  topStatItem: { alignItems: 'center' },
  topStatValue: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  topStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Section
  section: { paddingTop: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 1.5, marginLeft: 6, textTransform: 'uppercase' },

  // Stat Cards
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9',
    padding: 16, marginBottom: 12,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  statIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#0F172A' },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginTop: 2 },
  statSub: { fontSize: 10, color: '#94A3B8', marginTop: 4, fontWeight: '500' },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#052e16',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#052e16',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  // Invite Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#94A3B8', marginTop: 3 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 14 },
  fieldInput: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: '#1E293B', backgroundColor: '#F8FAFC',
  },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#052e16', borderRadius: 14,
    paddingVertical: 14, marginTop: 20,
  },
  sendBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15, marginLeft: 8 },

  // Recent Clients Carousel
  viewAllLink: { fontSize: 12, fontWeight: '700', color: '#059669' },
  carouselSection: { paddingTop: 24 },
  carouselContent: { paddingHorizontal: 20, paddingBottom: 8, gap: 14 },

  clientCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  statusPillActive: { backgroundColor: '#ECFDF5' },
  statusPillInactive: { backgroundColor: '#F8FAFC' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusPillText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },

  cardAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardAvatarText: { fontSize: 18, fontWeight: 'bold', color: '#581C87' },
  cardName: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 3 },
  cardEmail: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  cardDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardFooterText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },

  // Empty State
  emptyState: { alignItems: 'center', paddingTop: 40, paddingBottom: 60, paddingHorizontal: 40 },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: '#ecfdf5',
    borderWidth: 1, borderColor: '#d1fae5',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  emptyButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#052e16', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14,
    shadowColor: '#052e16', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  emptyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginLeft: 8 },
});
