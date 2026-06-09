import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { ApiService } from '../services/api';

const { width } = Dimensions.get('window');

function getInitials(name?: string, username?: string) {
  const display = name || username || '';
  const parts = display.split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return display.slice(0, 2).toUpperCase() || '?';
}

type Tab = 'overview' | 'progress' | 'activity';

export default function ClientProfileScreen({ route, navigation }: { route: any; navigation: any }) {
  const { clientId, clientName } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [emotions, setEmotions] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [thoughts, setThoughts] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const fetchAll = async () => {
        try {
          const [emotionsRes, journalsRes, thoughtsRes, goalsRes, clientsRes] = await Promise.all([
            ApiService.getEmotions(clientId),
            ApiService.getJournalEntries(clientId),
            ApiService.getThoughtRecords(clientId),
            ApiService.getGoals(clientId),
            ApiService.getTherapistClients(),
          ]);
          if (!isMounted) return;
          const found = (clientsRes.data || []).find((c: any) => c.id === clientId);
          setClient(found || { id: clientId, name: clientName });
          setEmotions(emotionsRes.data || []);
          setJournals(journalsRes.data || []);
          setThoughts(thoughtsRes.data || []);
          setGoals(goalsRes.data || []);
        } catch (e) {
          console.error(e);
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      fetchAll();
      return () => { isMounted = false; };
    }, [clientId])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading client profile…</Text>
      </View>
    );
  }

  const isActive = client?.status === 'active';
  const initials = getInitials(client?.name, client?.username);
  const joinedDate = client?.createdAt
    ? new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;
  const daysAsClient = client?.createdAt
    ? Math.floor((Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const completedGoals = goals.filter((g: any) => g.status === 'completed').length;
  const totalActivities = emotions.length + journals.length + thoughts.length + goals.length;

  const modules = [
    {
      code: 'M01', icon: 'heart' as const, title: 'Mood & Triggers',
      desc: 'Emotion fluctuations & trigger events',
      count: emotions.length, unit: 'records', color: '#3B82F6', bg: '#EFF6FF',
      tab: 'emotions',
    },
    {
      code: 'M02', icon: 'cpu' as const, title: 'Thought Records',
      desc: 'Cognitive distortions & reframing',
      count: thoughts.length, unit: 'records', color: '#8B5CF6', bg: '#F5F3FF',
      tab: 'thoughts',
    },
    {
      code: 'M03', icon: 'book-open' as const, title: 'Journal Entries',
      desc: 'Self-reflections & session notes',
      count: journals.length, unit: 'entries', color: '#F59E0B', bg: '#FFFBEB',
      tab: 'journal',
    },
    {
      code: 'M04', icon: 'target' as const, title: 'Goals & Objectives',
      desc: 'SMART objectives & milestones',
      count: goals.length, unit: 'goals', color: '#10B981', bg: '#F0FDF4',
      tab: 'goals',
    },
  ];

  const activityItems = [
    ...emotions.map((e: any) => ({ type: 'emotion', icon: 'heart' as const, color: '#3B82F6', bg: '#EFF6FF', title: e.coreEmotion || 'Emotion recorded', sub: e.specificEmotion, date: new Date(e.createdAt), label: 'Emotion' })),
    ...journals.map((j: any) => ({ type: 'journal', icon: 'book-open' as const, color: '#F59E0B', bg: '#FFFBEB', title: j.title || 'Journal entry', sub: undefined, date: new Date(j.createdAt), label: 'Journal' })),
    ...thoughts.map((t: any) => ({ type: 'thought', icon: 'cpu' as const, color: '#8B5CF6', bg: '#F5F3FF', title: t.situation || t.automaticThought || 'Thought record', sub: undefined, date: new Date(t.createdAt), label: 'Thought' })),
    ...goals.map((g: any) => ({ type: 'goal', icon: 'target' as const, color: '#10B981', bg: '#F0FDF4', title: g.title || g.goal || 'Goal', sub: g.status, date: new Date(g.createdAt), label: 'Goal' })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 20);

  return (
    <View style={styles.container}>

      {/* ── HERO HEADER ── */}
      <View style={styles.hero}>
        {/* Decorative circles */}
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />

        {/* Avatar + name */}
        <View style={styles.heroContent}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>

          <View style={styles.heroText}>
            <Text style={styles.heroName}>{client?.name || client?.username}</Text>
            <View style={styles.heroMeta}>
              <View style={[styles.heroBadge, isActive ? styles.heroBadgeActive : styles.heroBadgeInactive]}>
                {isActive && <View style={styles.heroBadgeDot} />}
                <Text style={[styles.heroBadgeText, isActive ? styles.heroBadgeTextActive : styles.heroBadgeTextInactive]}>
                  {client?.status || 'active'}
                </Text>
              </View>
              {joinedDate && (
                <Text style={styles.heroMetaText}>
                  <Text style={{ color: 'rgba(255,255,255,0.4)' }}>Since </Text>
                  {joinedDate}
                </Text>
              )}
              <Text style={styles.heroMetaText}>
                <Text style={{ color: 'rgba(255,255,255,0.4)' }}>ID </Text>
                #{clientId}
              </Text>
            </View>
            <Text style={styles.heroEmail}>{client?.email}</Text>
          </View>
        </View>

        {/* Summary counts */}
        <View style={styles.heroStats}>
          {[
            { val: emotions.length, label: 'Emotions' },
            { val: thoughts.length, label: 'Thoughts' },
            { val: journals.length, label: 'Journals' },
            { val: goals.length, label: 'Goals' },
          ].map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.heroStatDivider} />}
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatVal}>{s.val}</Text>
                <Text style={styles.heroStatLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ── TAB BAR ── */}
      <View style={styles.tabBar}>
        {([
          { key: 'overview' as const, icon: 'user' as const, label: 'Overview' },
          { key: 'progress' as const, icon: 'trending-up' as const, label: 'Progress' },
          { key: 'activity' as const, icon: 'activity' as const, label: 'Activity' },
        ]).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <Feather name={tab.icon} size={13} color={activeTab === tab.key ? '#FFFFFF' : '#94A3B8'} />
            <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── BODY ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
      >

        {/* ════ OVERVIEW ════ */}
        {activeTab === 'overview' && (
          <>
            {/* Section label */}
            <View style={styles.sectionRow}>
              <Ionicons name="sparkles-outline" size={13} color="#8B5CF6" />
              <Text style={styles.sectionLabel}>CLINICAL MODULES</Text>
              <Text style={styles.sectionHint}>tap to open</Text>
            </View>

            {/* Module cards */}
            {modules.map((mod) => (
              <TouchableOpacity
                key={mod.code}
                style={styles.moduleCard}
                activeOpacity={0.82}
                onPress={() =>
                  navigation.navigate('ClientDataView', {
                    clientId,
                    clientName: client?.name || client?.username || clientName,
                    initialTab: mod.tab,
                  })
                }
              >
                {/* Left icon */}
                <View style={[styles.moduleIcon, { backgroundColor: mod.bg }]}>
                  <Feather name={mod.icon} size={20} color={mod.color} />
                </View>

                {/* Info */}
                <View style={styles.moduleBody}>
                  <View style={styles.moduleCodeRow}>
                    <Text style={[styles.moduleCodeTag, { color: mod.color, backgroundColor: mod.bg }]}>
                      {mod.code}
                    </Text>
                    <Text style={styles.moduleTitle}>{mod.title}</Text>
                  </View>
                  <Text style={styles.moduleDesc} numberOfLines={1}>{mod.desc}</Text>
                </View>

                {/* Count badge */}
                <View style={[styles.moduleCountBadge, { borderColor: `${mod.color}25`, backgroundColor: mod.bg }]}>
                  <Text style={[styles.moduleCountVal, { color: mod.color }]}>{mod.count}</Text>
                  <Text style={[styles.moduleCountUnit, { color: mod.color }]}>{mod.unit}</Text>
                </View>

                <Feather name="chevron-right" size={15} color="#CBD5E1" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ))}

            {/* Action row */}
            <TouchableOpacity
              style={styles.actionFill}
              onPress={() => setActiveTab('progress')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionFillText}>Open Analytics</Text>
              <Feather name="external-link" size={14} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Recent two-col previews */}
            <View style={styles.previewGrid}>
              <RecentPreview
                icon="heart"
                title="RECENT EMOTIONS"
                items={emotions.slice(0, 4).map((e: any) => ({
                  title: e.coreEmotion || 'Emotion',
                  sub: e.specificEmotion,
                  date: e.createdAt,
                }))}
                accentColor="#3B82F6"
                onViewAll={() => setActiveTab('activity')}
              />
              <RecentPreview
                icon="book-open"
                title="RECENT JOURNAL"
                items={journals.slice(0, 4).map((j: any) => ({
                  title: j.title || 'Journal entry',
                  date: j.createdAt,
                }))}
                accentColor="#F59E0B"
                onViewAll={() => setActiveTab('activity')}
              />
            </View>
          </>
        )}

        {/* ════ PROGRESS ════ */}
        {activeTab === 'progress' && (
          <>
            <View style={styles.sectionRow}>
              <Feather name="bar-chart-2" size={13} color="#8B5CF6" />
              <Text style={styles.sectionLabel}>ACTIVITY SUMMARY</Text>
            </View>

            {/* Stats 2×2 grid */}
            <View style={styles.statsGrid}>
              {[
                { icon: 'heart' as const, label: 'Emotion Records', value: emotions.length, color: '#3B82F6', bg: '#EFF6FF' },
                { icon: 'cpu' as const, label: 'Thought Records', value: thoughts.length, color: '#8B5CF6', bg: '#F5F3FF' },
                { icon: 'book-open' as const, label: 'Journal Entries', value: journals.length, color: '#F59E0B', bg: '#FFFBEB' },
                { icon: 'target' as const, label: 'Goals Set', value: goals.length, color: '#10B981', bg: '#F0FDF4' },
              ].map((s, i) => (
                <View key={i} style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: s.bg }]}>
                    <Feather name={s.icon} size={20} color={s.color} />
                  </View>
                  <Text style={[styles.statCardVal, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statCardLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Totals row */}
            <View style={styles.totalsRow}>
              {[
                { val: String(totalActivities), label: 'Total Activities', sub: 'Across all modules', color: '#0F172A' },
                { val: String(completedGoals), label: 'Goals Done', sub: goals.length > 0 ? `${Math.round((completedGoals / goals.length) * 100)}% rate` : 'No goals yet', color: '#10B981' },
                { val: daysAsClient != null ? String(daysAsClient) : '—', label: 'Days Active', sub: 'Since registration', color: '#8B5CF6' },
              ].map((t, i) => (
                <View key={i} style={[styles.totalCard, i === 1 && styles.totalCardMiddle]}>
                  <Text style={[styles.totalCardVal, { color: t.color }]}>{t.val}</Text>
                  <Text style={styles.totalCardLabel}>{t.label}</Text>
                  <Text style={styles.totalCardSub}>{t.sub}</Text>
                </View>
              ))}
            </View>

            {/* Goals list */}
            {goals.length > 0 && (
              <>
                <View style={[styles.sectionRow, { marginTop: 14 }]}>
                  <Feather name="target" size={13} color="#8B5CF6" />
                  <Text style={styles.sectionLabel}>GOALS</Text>
                </View>
                <View style={styles.goalsCard}>
                  {goals.slice(0, 6).map((g: any, i: number) => {
                    const done = g.status === 'completed';
                    const inProg = g.status === 'in_progress';
                    return (
                      <View
                        key={g.id}
                        style={[styles.goalRow, i < Math.min(goals.length, 6) - 1 && styles.goalRowBorder]}
                      >
                        <View style={[
                          styles.goalDot,
                          done ? styles.goalDotDone : inProg ? styles.goalDotProg : styles.goalDotPending,
                        ]}>
                          <Feather
                            name={done ? 'check' : 'clock'}
                            size={10}
                            color={done ? '#059669' : inProg ? '#2563EB' : '#94A3B8'}
                          />
                        </View>
                        <Text style={styles.goalTitle} numberOfLines={1}>{g.title || g.goal || 'Goal'}</Text>
                        <View style={[
                          styles.goalPill,
                          done ? styles.goalPillDone : inProg ? styles.goalPillProg : styles.goalPillPending,
                        ]}>
                          <Text style={[
                            styles.goalPillText,
                            { color: done ? '#059669' : inProg ? '#2563EB' : '#94A3B8' },
                          ]}>
                            {g.status || 'active'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}

        {/* ════ ACTIVITY ════ */}
        {activeTab === 'activity' && (
          <>
            <View style={styles.sectionRow}>
              <Feather name="activity" size={13} color="#8B5CF6" />
              <Text style={styles.sectionLabel}>LATEST ENTRIES</Text>
            </View>

            {activityItems.length === 0 ? (
              <View style={styles.emptyActivity}>
                <View style={styles.emptyActivityIcon}>
                  <Feather name="activity" size={32} color="#CBD5E1" />
                </View>
                <Text style={styles.emptyActivityTitle}>No activity yet</Text>
                <Text style={styles.emptyActivitySub}>Client hasn't recorded any entries.</Text>
              </View>
            ) : (
              <View style={styles.timelineCard}>
                <View style={styles.timelineAccent} />
                {activityItems.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.timelineRow, i < activityItems.length - 1 && styles.timelineRowBorder]}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.timelineIconBox, { backgroundColor: item.bg, borderColor: `${item.color}30` }]}>
                      <Feather name={item.icon} size={13} color={item.color} />
                    </View>
                    <View style={styles.timelineInfo}>
                      <Text style={styles.timelineTitle} numberOfLines={1}>{item.title}</Text>
                      {item.sub && (
                        <Text style={styles.timelineSub} numberOfLines={1}>{item.sub}</Text>
                      )}
                    </View>
                    <View style={styles.timelineRight}>
                      <Text style={styles.timelineDate}>
                        {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                      <Text style={[styles.timelineType, { color: item.color }]}>{item.label}</Text>
                    </View>
                    <Feather name="chevron-right" size={13} color="#E2E8F0" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Inline sub-component for recent previews ──────────────────────────────────
function RecentPreview({
  icon, title, items, accentColor, onViewAll,
}: {
  icon: any;
  title: string;
  items: { title: string; sub?: string; date?: string }[];
  accentColor: string;
  onViewAll: () => void;
}) {
  return (
    <View style={preview.card}>
      <View style={[preview.accent, { backgroundColor: accentColor }]} />
      <View style={preview.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Feather name={icon} size={12} color={accentColor} />
          <Text style={preview.title}>{title}</Text>
        </View>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={[preview.viewAll, { color: accentColor }]}>All →</Text>
        </TouchableOpacity>
      </View>
      {items.length > 0 ? items.map((item, i) => (
        <View key={i} style={[preview.row, i > 0 && preview.rowBorder]}>
          <View style={{ flex: 1 }}>
            <Text style={preview.rowTitle} numberOfLines={1}>{item.title}</Text>
            {item.sub && <Text style={preview.rowSub} numberOfLines={1}>{item.sub}</Text>}
          </View>
          {item.date && (
            <Text style={preview.rowDate}>
              {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          )}
        </View>
      )) : (
        <Text style={preview.empty}>No records yet</Text>
      )}
    </View>
  );
}

const preview = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9',
    overflow: 'hidden', marginBottom: 12,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  accent: { height: 3 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 13, paddingBottom: 10 },
  title: { fontSize: 9, fontWeight: '800', color: '#64748B', letterSpacing: 1.2, textTransform: 'uppercase' },
  viewAll: { fontSize: 11, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11 },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  rowTitle: { fontSize: 12, fontWeight: '600', color: '#334155' },
  rowSub: { fontSize: 10, color: '#94A3B8', marginTop: 1 },
  rowDate: { fontSize: 10, color: '#CBD5E1', marginLeft: 8 },
  empty: { fontSize: 12, color: '#CBD5E1', textAlign: 'center', paddingVertical: 14, paddingHorizontal: 14 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '600' },

  // ── Hero ──
  hero: {
    backgroundColor: '#090514',
    paddingBottom: 0,
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(139,92,246,0.12)',
    top: -80, right: -60,
  },
  heroCircle2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(99,102,241,0.08)',
    bottom: 10, left: -40,
  },
  heroContent: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16, gap: 14,
  },
  avatarRing: {
    padding: 2.5,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.5)',
  },
  avatar: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  heroText: { flex: 1, paddingTop: 2 },
  heroName: { fontSize: 19, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 7, letterSpacing: -0.3 },
  heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6, alignItems: 'center' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  heroBadgeActive: { backgroundColor: 'rgba(16,185,129,0.18)' },
  heroBadgeInactive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  heroBadgeDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#34D399' },
  heroBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  heroBadgeTextActive: { color: '#34D399' },
  heroBadgeTextInactive: { color: 'rgba(255,255,255,0.5)' },
  heroMetaText: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  heroEmail: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },

  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 14,
  },
  heroStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroStatItem: { flex: 1, alignItems: 'center' },
  heroStatVal: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  heroStatLabel: { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.6 },

  // ── Tabs ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    paddingHorizontal: 12, paddingVertical: 8, gap: 8,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 12, gap: 5,
  },
  tabBtnActive: { backgroundColor: '#090514' },
  tabBtnText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  tabBtnTextActive: { color: '#FFFFFF' },

  // ── Body ──
  body: { padding: 20, paddingBottom: 56 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  sectionLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.5, textTransform: 'uppercase' },
  sectionHint: { fontSize: 9, color: '#CBD5E1', marginLeft: 'auto', fontWeight: '600' },

  // Module cards
  moduleCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9',
    padding: 16, marginBottom: 12,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  moduleIcon: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  moduleBody: { flex: 1, marginLeft: 12 },
  moduleCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  moduleCodeTag: {
    fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase',
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5,
  },
  moduleTitle: { fontSize: 12, fontWeight: '800', color: '#1E293B', textTransform: 'uppercase', letterSpacing: 0.4 },
  moduleDesc: { fontSize: 10, color: '#94A3B8', lineHeight: 14 },
  moduleCountBadge: {
    alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1,
  },
  moduleCountVal: { fontSize: 15, fontWeight: 'bold' },
  moduleCountUnit: { fontSize: 8, fontWeight: '700', textTransform: 'lowercase', marginTop: 1, opacity: 0.7 },

  actionFill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
    backgroundColor: '#090514', borderRadius: 14,
    marginTop: 6, marginBottom: 24,
    shadowColor: '#090514', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  actionFillText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  // Recent previews
  previewGrid: {},

  // Progress stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9',
    padding: 16, alignItems: 'center',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  statIconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statCardVal: { fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  statCardLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', textAlign: 'center' },

  // Totals
  totalsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  totalCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9',
    padding: 14, alignItems: 'center',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  totalCardMiddle: { borderColor: '#E9D5FF', backgroundColor: '#FAFAFF' },
  totalCardVal: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  totalCardLabel: { fontSize: 10, fontWeight: '700', color: '#475569', textAlign: 'center' },
  totalCardSub: { fontSize: 9, color: '#94A3B8', marginTop: 3, textAlign: 'center' },

  // Goals
  goalsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  goalRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  goalRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  goalDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  goalDotDone: { backgroundColor: '#DCFCE7' },
  goalDotProg: { backgroundColor: '#DBEAFE' },
  goalDotPending: { backgroundColor: '#F1F5F9' },
  goalTitle: { flex: 1, fontSize: 13, fontWeight: '600', color: '#334155' },
  goalPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  goalPillDone: { backgroundColor: '#DCFCE7' },
  goalPillProg: { backgroundColor: '#DBEAFE' },
  goalPillPending: { backgroundColor: '#F1F5F9' },
  goalPillText: { fontSize: 9, fontWeight: '800', textTransform: 'capitalize' },

  // Activity timeline
  emptyActivity: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  emptyActivityIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyActivityTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 5 },
  emptyActivitySub: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },

  timelineCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  timelineAccent: { height: 3, backgroundColor: '#090514' },
  timelineRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  timelineRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  timelineIconBox: {
    width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  timelineInfo: { flex: 1 },
  timelineTitle: { fontSize: 13, fontWeight: '600', color: '#334155' },
  timelineSub: { fontSize: 10, color: '#94A3B8', marginTop: 2, textTransform: 'capitalize' },
  timelineRight: { alignItems: 'flex-end' },
  timelineDate: { fontSize: 11, color: '#94A3B8' },
  timelineType: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
});
