import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { ApiService } from '../services/api';

const { width } = Dimensions.get('window');

const AVATAR_PALETTES = [
  { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  { bg: '#EEF2FF', text: '#3730A3', border: '#C7D2FE' },
  { bg: '#FDF4FF', text: '#86198F', border: '#F0ABFC' },
  { bg: '#F0FDF4', text: '#166534', border: '#86EFAC' },
  { bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA' },
  { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
];

function getPalette(id: number) {
  return AVATAR_PALETTES[id % AVATAR_PALETTES.length];
}

function getInitials(name: string, username: string) {
  const display = name || username || '';
  const parts = display.split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return display.slice(0, 2).toUpperCase() || '?';
}

function timeAgo(dateStr: string | undefined) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const ACTIVITY_CHIPS = [
  { key: 'emotionsCount', icon: 'heart',     color: '#3B82F6', bg: '#EFF6FF' },
  { key: 'thoughtsCount', icon: 'cpu',       color: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'journalsCount', icon: 'book-open', color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'goalsCount',    icon: 'target',    color: '#10B981', bg: '#F0FDF4' },
] as const;

export default function ClientDirectoryScreen({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'directory' | 'invitations'>('directory');
  const [resendingId, setResendingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [clientsRes, invitationsRes] = await Promise.all([
        ApiService.getTherapistClients(),
        ApiService.getInvitations(),
      ]);
      setClients(clientsRes.data || []);
      setInvitations(invitationsRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  const pendingInvitations = (invitations || []).filter((inv: any) => {
    if (inv.status !== 'pending' && inv.status !== 'email_sent') return false;
    return !clients.some((c: any) => c.email === inv.email);
  });
  const uniqueInvitations = pendingInvitations.reduce((acc: any[], inv: any) => {
    const existing = acc.find((i) => i.email === inv.email);
    if (!existing) acc.push(inv);
    else if (inv.id > existing.id) acc[acc.findIndex((i) => i.email === inv.email)] = inv;
    return acc;
  }, []);

  const filteredClients = clients.filter((c: any) =>
    !searchTerm ||
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClients = clients.length;
  const activeClients = clients.filter((c: any) => c.status === 'active').length;
  const inactiveClients = totalClients - activeClients;
  const activeRate = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;
  const pendingCount = uniqueInvitations.length;

  const handleResend = async (invitationId: number) => {
    setResendingId(invitationId);
    try {
      const res = await ApiService.resendInvitation(invitationId);
      if (res.error) Alert.alert('Error', res.error);
      else Alert.alert('Resent!', 'Invitation has been sent again.');
      fetchData();
    } catch {
      Alert.alert('Error', 'Failed to resend invitation.');
    } finally {
      setResendingId(null);
    }
  };

  // ─── CLIENT CARD ───────────────────────────────────────────────────────────
  const renderClientRow = ({ item: client }: { item: any }) => {
    const palette = getPalette(client.id);
    const isActive = client.status !== 'inactive';
    const lastActivity = timeAgo(client.lastActivityAt || client.updatedAt || client.createdAt);
    const hasActivity = ACTIVITY_CHIPS.some((chip) => (client[chip.key] ?? 0) > 0);

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.clientCard}
        onPress={() => navigation.navigate('ClientProfile', { clientId: client.id, clientName: client.name || client.username })}
      >
        {/* Left: avatar */}
        <View style={[styles.avatarWrap, { backgroundColor: palette.bg, borderColor: palette.border }]}>
          <Text style={[styles.avatarText, { color: palette.text }]}>
            {getInitials(client.name, client.username)}
          </Text>
          {/* Online/offline indicator on avatar */}
          <View style={[styles.avatarStatus, isActive ? styles.avatarStatusActive : styles.avatarStatusInactive]} />
        </View>

        {/* Middle: info */}
        <View style={styles.cardBody}>
          {/* Name + status pill */}
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName} numberOfLines={1}>{client.name || client.username}</Text>
            <View style={[styles.statusPill, isActive ? styles.statusPillActive : styles.statusPillInactive]}>
              <Text style={[styles.statusPillText, isActive ? styles.statusPillTextActive : styles.statusPillTextInactive]}>
                {isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {/* Email */}
          <Text style={styles.cardEmail} numberOfLines={1}>{client.email}</Text>

          {/* Last activity */}
          {lastActivity && (
            <View style={styles.lastActivityRow}>
              <Feather name="clock" size={10} color="#CBD5E1" />
              <Text style={styles.lastActivityText}>{lastActivity}</Text>
            </View>
          )}

          {/* Activity chips: emotions / thoughts / journals / goals */}
          {hasActivity && (
            <View style={styles.chipsRow}>
              {ACTIVITY_CHIPS.map((chip) => {
                const count = client[chip.key] ?? 0;
                if (count === 0) return null;
                return (
                  <View key={chip.key} style={[styles.chip, { backgroundColor: chip.bg }]}>
                    <Feather name={chip.icon} size={9} color={chip.color} />
                    <Text style={[styles.chipText, { color: chip.color }]}>{count}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Right: chevron */}
        <Feather name="chevron-right" size={16} color="#CBD5E1" />
      </TouchableOpacity>
    );
  };

  // ─── INVITATION ROW ────────────────────────────────────────────────────────
  const renderInvitationRow = ({ item: inv }: { item: any }) => {
    const initials = (inv.name || inv.email || '?').slice(0, 2).toUpperCase();
    const sentAgo = timeAgo(inv.createdAt);
    return (
      <View style={styles.invRow}>
        <View style={styles.invAvatar}>
          <Text style={styles.invAvatarText}>{initials}</Text>
        </View>
        <View style={styles.invInfo}>
          <Text style={styles.invName} numberOfLines={1}>{inv.name || 'Anonymous'}</Text>
          <Text style={styles.invEmail} numberOfLines={1}>{inv.email}</Text>
          <View style={styles.invMeta}>
            <View style={styles.invStatusPill}>
              <View style={styles.invStatusDot} />
              <Text style={styles.invStatusText}>Pending</Text>
            </View>
            {sentAgo && (
              <View style={styles.invTimeChip}>
                <Feather name="clock" size={9} color="#94A3B8" />
                <Text style={styles.invTimeText}>{sentAgo}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.resendBtn, resendingId === inv.id && { opacity: 0.6 }]}
          onPress={() => handleResend(inv.id)}
          disabled={resendingId === inv.id}
          activeOpacity={0.75}
        >
          {resendingId === inv.id
            ? <ActivityIndicator size="small" color="#8B5CF6" />
            : <><Feather name="send" size={12} color="#8B5CF6" /><Text style={styles.resendBtnText}>Resend</Text></>
          }
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>

      {/* ── STATS HERO HEADER ──────────────────────────────────────── */}
      <View style={styles.hero}>
        {/* Decorative blurred circles */}
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />
        <View style={styles.heroCircle3} />

        {/* Top label row */}
        <View style={styles.heroTopRow}>
          <View style={styles.heroLabelBadge}>
            <Feather name="users" size={11} color="#C084FC" />
            <Text style={styles.heroLabelText}>CLIENT ROSTER</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { value: totalClients,    label: 'Clients' },
            { value: `${activeRate}%`, label: 'Active'  },
            { value: pendingCount,    label: 'Pending'  },
          ].map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ── TAB BAR ───────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {[
          { key: 'directory' as const, icon: 'users', label: 'Directory', count: totalClients },
          { key: 'invitations' as const, icon: 'mail', label: 'Pending', count: pendingCount },
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Feather name={tab.icon as any} size={13} color={active ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{tab.label}</Text>
              <View style={[styles.tabCount, active && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>{tab.count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── BODY ──────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Syncing practice data…</Text>
        </View>
      ) : activeTab === 'directory' ? (
        <>
          {/* Search */}
          <View style={styles.searchWrap}>
            <View style={styles.searchBox}>
              <Feather name="search" size={15} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or email…"
                placeholderTextColor="#94A3B8"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <View style={styles.clearBtn}>
                    <Feather name="x" size={10} color="#64748B" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Results count / hint */}
          <View style={styles.hintRow}>
            <Feather name="info" size={10} color="#CBD5E1" />
            <Text style={styles.hintText}>
              {searchTerm
                ? `${filteredClients.length} result${filteredClients.length !== 1 ? 's' : ''} for "${searchTerm}"`
                : 'Tap a client to open their workspace'}
            </Text>
          </View>

          {filteredClients.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}><Feather name="users" size={30} color="#CBD5E1" /></View>
              <Text style={styles.emptyTitle}>No clients found</Text>
              <Text style={styles.emptyDesc}>Try a different search or send an invite.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredClients}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderClientRow}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          )}
        </>
      ) : (
        <>
          <View style={styles.pendingHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="clock" size={14} color="#8B5CF6" />
              <Text style={styles.pendingTitle}>Pending Connections</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
              </View>
            </View>
            <Text style={styles.pendingSubtitle}>Invitations awaiting client registration</Text>
          </View>

          {uniqueInvitations.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={[styles.emptyIcon, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                <Feather name="check-circle" size={30} color="#16A34A" />
              </View>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyDesc}>No pending invitations right now.</Text>
            </View>
          ) : (
            <FlatList
              data={uniqueInvitations}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderInvitationRow}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },

  // ── Hero header ──────────────────────────────────────────────────
  hero: {
    backgroundColor: '#090514',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(139,92,246,0.08)', top: -80, right: -50,
  },
  heroCircle2: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(99,102,241,0.06)', bottom: -40, left: -30,
  },
  heroCircle3: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(16,185,129,0.05)', top: 10, left: width * 0.4,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  heroLabelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(192,132,252,0.1)',
    borderWidth: 1, borderColor: 'rgba(192,132,252,0.18)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  heroLabelText: { fontSize: 9, fontWeight: '800', color: '#C084FC', letterSpacing: 1.2, textTransform: 'uppercase' },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 6 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  // ── Tab bar ──────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    paddingHorizontal: 12, paddingVertical: 8, gap: 8,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 12, gap: 6,
  },
  tabBtnActive: { backgroundColor: '#090514' },
  tabBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  tabBtnTextActive: { color: '#FFFFFF' },
  tabCount: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: '#F1F5F9' },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabCountText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  tabCountTextActive: { color: '#FFFFFF' },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },

  // ── Search ───────────────────────────────────────────────────────
  searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 11,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },
  clearBtn: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center',
  },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 },
  hintText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },

  // ── Client card ──────────────────────────────────────────────────
  listContent: { paddingHorizontal: 16, paddingBottom: 48, paddingTop: 6 },
  clientCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9',
    paddingHorizontal: 14, paddingVertical: 14,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },

  // Avatar with status badge
  avatarWrap: {
    width: 48, height: 48, borderRadius: 15, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginRight: 12,
  },
  avatarText: { fontSize: 15, fontWeight: 'bold' },
  avatarStatus: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#FFFFFF',
  },
  avatarStatusActive: { backgroundColor: '#10B981' },
  avatarStatusInactive: { backgroundColor: '#CBD5E1' },

  // Card body
  cardBody: { flex: 1, gap: 3 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#0F172A', flexShrink: 1 },

  statusPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, flexShrink: 0 },
  statusPillActive: { backgroundColor: '#DCFCE7' },
  statusPillInactive: { backgroundColor: '#F1F5F9' },
  statusPillText: { fontSize: 9, fontWeight: '800' },
  statusPillTextActive: { color: '#059669' },
  statusPillTextInactive: { color: '#94A3B8' },

  cardEmail: { fontSize: 11, color: '#94A3B8' },

  lastActivityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  lastActivityText: { fontSize: 10, color: '#CBD5E1', fontWeight: '500' },

  chipsRow: { flexDirection: 'row', gap: 5, marginTop: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  chipText: { fontSize: 10, fontWeight: '700' },

  // ── Pending invitations ──────────────────────────────────────────
  pendingHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  pendingTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  pendingBadge: { backgroundColor: '#F5F3FF', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  pendingBadgeText: { fontSize: 11, fontWeight: '700', color: '#7C3AED' },
  pendingSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 4 },

  invRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9',
    paddingHorizontal: 14, paddingVertical: 14,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  invAvatar: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: '#F5F3FF', borderWidth: 1.5, borderColor: '#DDD6FE',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  invAvatarText: { fontSize: 13, fontWeight: 'bold', color: '#6D28D9' },
  invInfo: { flex: 1, gap: 2 },
  invName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  invEmail: { fontSize: 11, color: '#94A3B8' },
  invMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  invStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF7ED', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  invStatusDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#F59E0B' },
  invStatusText: { fontSize: 9, fontWeight: '800', color: '#B45309' },
  invTimeChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  invTimeText: { fontSize: 10, color: '#94A3B8', fontWeight: '500' },
  resendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: '#DDD6FE', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7,
    backgroundColor: '#F5F3FF',
  },
  resendBtnText: { fontSize: 11, fontWeight: '700', color: '#7C3AED' },

  // ── Empty state ──────────────────────────────────────────────────
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { width: 68, height: 68, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 18 },
});
