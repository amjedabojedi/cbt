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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { ApiService } from '../services/api';

const { width } = Dimensions.get('window');

type ModuleTab = 'emotions' | 'thoughts' | 'journal' | 'goals';

const TAB_CONFIG: { key: ModuleTab; icon: any; label: string; color: string; bg: string }[] = [
  { key: 'emotions', icon: 'heart',     label: 'Emotions', color: '#3B82F6', bg: '#EFF6FF' },
  { key: 'thoughts', icon: 'cpu',       label: 'Thoughts', color: '#059669', bg: '#ecfdf5' },
  { key: 'journal',  icon: 'book-open', label: 'Journal',  color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'goals',    icon: 'target',    label: 'Goals',    color: '#10B981', bg: '#F0FDF4' },
];

const INTENSITY_COLOR = (n: number) => {
  if (n <= 3) return '#10B981';
  if (n <= 6) return '#F59E0B';
  return '#EF4444';
};

const GOAL_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Pending',     color: '#94A3B8', bg: '#F1F5F9' },
  in_progress: { label: 'In Progress', color: '#2563EB', bg: '#DBEAFE' },
  approved:    { label: 'Approved',    color: '#047857', bg: '#d1fae5' },
  completed:   { label: 'Completed',   color: '#059669', bg: '#DCFCE7' },
};

function fmtDate(d: string | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtShort(d: string | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// EMOTION CARD
// ─────────────────────────────────────────────────────────────────────────────
function EmotionCard({ item }: { item: any }) {
  const intensity = item.intensity ?? item.intensityLevel ?? 0;
  const ic = INTENSITY_COLOR(intensity);

  return (
    <View style={card.wrap}>
      {/* Header row */}
      <View style={card.header}>
        <View style={[card.iconBox, { backgroundColor: '#EFF6FF' }]}>
          <Feather name="heart" size={16} color="#3B82F6" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={card.primary}>{item.coreEmotion || 'Emotion'}</Text>
          {item.specificEmotion && (
            <Text style={card.secondary}>{item.specificEmotion}</Text>
          )}
        </View>
        <Text style={card.date}>{fmtShort(item.createdAt)}</Text>
      </View>

      {/* Intensity bar */}
      {intensity > 0 && (
        <View style={card.intensityWrap}>
          <Text style={card.intensityLabel}>Intensity</Text>
          <View style={card.intensityTrack}>
            <View style={[card.intensityFill, { width: `${(intensity / 10) * 100}%`, backgroundColor: ic }]} />
          </View>
          <Text style={[card.intensityVal, { color: ic }]}>{intensity}/10</Text>
        </View>
      )}

      {/* Triggers */}
      {item.triggers && item.triggers.length > 0 && (
        <View style={card.tagsWrap}>
          <Text style={card.tagLabel}>Triggers</Text>
          <View style={card.tagsRow}>
            {(Array.isArray(item.triggers) ? item.triggers : [item.triggers]).slice(0, 4).map((t: string, i: number) => (
              <View key={i} style={[card.tag, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[card.tagText, { color: '#92400E' }]}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Context */}
      {item.context && (
        <Text style={card.bodyText} numberOfLines={2}>{item.context}</Text>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THOUGHT CARD
// ─────────────────────────────────────────────────────────────────────────────
function ThoughtCard({ item }: { item: any }) {
  const [expanded, setExpanded] = useState(false);
  const distortions: string[] = Array.isArray(item.distortions)
    ? item.distortions
    : item.distortions
    ? JSON.parse(item.distortions)
    : [];

  return (
    <TouchableOpacity activeOpacity={0.85} style={card.wrap} onPress={() => setExpanded((v) => !v)}>
      {/* Header */}
      <View style={card.header}>
        <View style={[card.iconBox, { backgroundColor: '#ecfdf5' }]}>
          <Feather name="cpu" size={16} color="#059669" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={card.primary} numberOfLines={expanded ? undefined : 2}>
            {item.automaticThought || item.situation || 'Thought record'}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={card.date}>{fmtShort(item.createdAt)}</Text>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color="#CBD5E1" />
        </View>
      </View>

      {/* Situation */}
      {item.situation && item.automaticThought && (
        <View style={[card.infoBox, { borderLeftColor: '#059669' }]}>
          <Text style={card.infoBoxLabel}>Situation</Text>
          <Text style={card.infoBoxText} numberOfLines={expanded ? undefined : 1}>{item.situation}</Text>
        </View>
      )}

      {/* Distortions */}
      {distortions.length > 0 && (
        <View style={card.tagsWrap}>
          <Text style={card.tagLabel}>Distortions</Text>
          <View style={card.tagsRow}>
            {distortions.slice(0, expanded ? 99 : 3).map((d, i) => (
              <View key={i} style={[card.tag, { backgroundColor: '#d1fae5' }]}>
                <Text style={[card.tagText, { color: '#064e3b' }]}>{d}</Text>
              </View>
            ))}
            {!expanded && distortions.length > 3 && (
              <View style={[card.tag, { backgroundColor: '#ecfdf5' }]}>
                <Text style={[card.tagText, { color: '#94A3B8' }]}>+{distortions.length - 3}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Expanded detail */}
      {expanded && (
        <View style={card.expandedSection}>
          {item.evidenceFor && (
            <View style={[card.infoBox, { borderLeftColor: '#EF4444' }]}>
              <Text style={card.infoBoxLabel}>Evidence For</Text>
              <Text style={card.infoBoxText}>{item.evidenceFor}</Text>
            </View>
          )}
          {item.evidenceAgainst && (
            <View style={[card.infoBox, { borderLeftColor: '#10B981' }]}>
              <Text style={card.infoBoxLabel}>Evidence Against</Text>
              <Text style={card.infoBoxText}>{item.evidenceAgainst}</Text>
            </View>
          )}
          {item.alternativePerspective && (
            <View style={[card.infoBox, { borderLeftColor: '#3B82F6' }]}>
              <Text style={card.infoBoxLabel}>Alternative Perspective</Text>
              <Text style={card.infoBoxText}>{item.alternativePerspective}</Text>
            </View>
          )}
          {item.insightsGained && (
            <View style={[card.infoBox, { borderLeftColor: '#F59E0B' }]}>
              <Text style={card.infoBoxLabel}>Insights Gained</Text>
              <Text style={card.infoBoxText}>{item.insightsGained}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JOURNAL CARD
// ─────────────────────────────────────────────────────────────────────────────
function JournalCard({ item }: { item: any }) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity activeOpacity={0.85} style={card.wrap} onPress={() => setModalVisible(true)}>
        <View style={card.header}>
          <View style={[card.iconBox, { backgroundColor: '#FFFBEB' }]}>
            <Feather name="book-open" size={16} color="#F59E0B" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={card.primary} numberOfLines={1}>{item.title || 'Journal entry'}</Text>
            <Text style={card.secondary} numberOfLines={2}>{item.content}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={card.date}>{fmtShort(item.createdAt)}</Text>
            <Feather name="external-link" size={13} color="#CBD5E1" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Full-screen read modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={jm.container}>
          <View style={jm.header}>
            <View style={{ flex: 1 }}>
              <Text style={jm.title} numberOfLines={2}>{item.title || 'Journal entry'}</Text>
              <Text style={jm.date}>{fmtDate(item.createdAt)}</Text>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={jm.closeBtn}>
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView style={jm.body} showsVerticalScrollIndicator={false}>
            <View style={jm.contentBox}>
              <Text style={jm.content}>{item.content}</Text>
            </View>
            {item.tags && item.tags.length > 0 && (
              <View style={jm.tagsWrap}>
                {item.tags.map((t: string, i: number) => (
                  <View key={i} style={jm.tag}><Text style={jm.tagText}>{t}</Text></View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GOAL CARD
// ─────────────────────────────────────────────────────────────────────────────
function GoalCard({ item }: { item: any }) {
  const [expanded, setExpanded] = useState(false);
  const s = GOAL_STATUS[item.status] ?? GOAL_STATUS.pending;
  const milestones: any[] = item.milestones || [];
  const doneMs = milestones.filter((m) => m.isCompleted).length;

  const smartFields = [
    { key: 'S', label: 'Specific',    val: item.specific },
    { key: 'M', label: 'Measurable',  val: item.measurable },
    { key: 'A', label: 'Achievable',  val: item.achievable },
    { key: 'R', label: 'Relevant',    val: item.relevant },
    { key: 'T', label: 'Time-bound',  val: item.timebound },
  ].filter((f) => f.val);

  return (
    <TouchableOpacity activeOpacity={0.85} style={card.wrap} onPress={() => setExpanded((v) => !v)}>
      {/* Header */}
      <View style={card.header}>
        <View style={[card.iconBox, { backgroundColor: '#F0FDF4' }]}>
          <Feather name="target" size={16} color="#10B981" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={card.primary} numberOfLines={1}>{item.title || item.goal || 'Goal'}</Text>
          {milestones.length > 0 && (
            <Text style={card.secondary}>{doneMs}/{milestones.length} milestones</Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={[card.pill, { backgroundColor: s.bg }]}>
            <Text style={[card.pillText, { color: s.color }]}>{s.label}</Text>
          </View>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color="#CBD5E1" />
        </View>
      </View>

      {/* Milestone mini-bar */}
      {milestones.length > 0 && (
        <View style={card.msBar}>
          <View style={[card.msTrack]}>
            <View style={[card.msFill, { width: `${(doneMs / milestones.length) * 100}%` }]} />
          </View>
        </View>
      )}

      {/* Expanded */}
      {expanded && (
        <View style={card.expandedSection}>
          {/* SMART fields */}
          {smartFields.map((f) => (
            <View key={f.key} style={[card.infoBox, { borderLeftColor: '#10B981' }]}>
              <Text style={card.infoBoxLabel}>{f.key} — {f.label}</Text>
              <Text style={card.infoBoxText}>{f.val}</Text>
            </View>
          ))}
          {/* Milestones */}
          {milestones.length > 0 && (
            <View style={card.msSection}>
              <Text style={card.msSectionTitle}>Milestones</Text>
              {milestones.map((m: any, i: number) => (
                <View key={i} style={card.msRow}>
                  <View style={[card.msDot, m.isCompleted ? card.msDotDone : card.msDotPending]}>
                    <Feather name={m.isCompleted ? 'check' : 'circle'} size={10}
                      color={m.isCompleted ? '#059669' : '#CBD5E1'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[card.msTitle, m.isCompleted && { textDecorationLine: 'line-through', color: '#94A3B8' }]}>
                      {m.title}
                    </Text>
                    {m.description && <Text style={card.msDesc}>{m.description}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}
          {item.timebound && <Text style={card.dateLine}><Feather name="clock" size={10} /> Timebound: {item.timebound}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function ClientDataViewScreen({ route }: { route: any }) {
  const { clientId, clientName, initialTab } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ModuleTab>(initialTab || 'emotions');
  const [emotions, setEmotions] = useState<any[]>([]);
  const [thoughts, setThoughts] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const fetch = async () => {
        try {
          const [eRes, tRes, jRes, gRes] = await Promise.all([
            ApiService.getEmotions(clientId),
            ApiService.getThoughtRecords(clientId),
            ApiService.getJournalEntries(clientId),
            ApiService.getGoals(clientId),
          ]);
          if (!isMounted) return;
          const sort = (arr: any[]) =>
            [...arr].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setEmotions(sort(eRes.data || []));
          setThoughts(sort(tRes.data || []));
          setJournals(sort(jRes.data || []));
          setGoals(sort(gRes.data || []));
        } catch (e) {
          console.error(e);
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      fetch();
      return () => { isMounted = false; };
    }, [clientId])
  );

  const counts: Record<ModuleTab, number> = {
    emotions: emotions.length,
    thoughts: thoughts.length,
    journal:  journals.length,
    goals:    goals.length,
  };

  const activeConfig = TAB_CONFIG.find((t) => t.key === activeTab)!;

  const renderEmptyState = (label: string, icon: any) => (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Feather name={icon} size={32} color="#CBD5E1" />
      </View>
      <Text style={styles.emptyTitle}>No {label} yet</Text>
      <Text style={styles.emptySub}>This client hasn't recorded any {label.toLowerCase()} entries.</Text>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        <View style={styles.headerContent}>
          <View style={[styles.headerIconBox, { backgroundColor: activeConfig.bg }]}>
            <Feather name={activeConfig.icon} size={18} color={activeConfig.color} />
          </View>
          <View>
            <Text style={styles.headerName}>{clientName}</Text>
            <Text style={styles.headerSub}>Read-only clinical view</Text>
          </View>
          <View style={styles.readOnlyBadge}>
            <Feather name="eye" size={10} color="#34d399" />
            <Text style={styles.readOnlyText}>View Only</Text>
          </View>
        </View>
      </View>

      {/* ── Tab Bar ── */}
      <View style={styles.tabBar}>
        {TAB_CONFIG.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, active && { backgroundColor: tab.color }]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Feather name={tab.icon} size={13} color={active ? '#FFFFFF' : '#94A3B8'} />
              <Text style={[styles.tabBtnText, active && { color: '#FFFFFF' }]}>{tab.label}</Text>
              <View style={[styles.tabCount, active && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <Text style={[styles.tabCountText, active && { color: '#FFFFFF' }]}>{counts[tab.key]}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Body ── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={activeConfig.color} />
          <Text style={styles.loadingText}>Loading {activeConfig.label.toLowerCase()}…</Text>
        </View>
      ) : (
        <FlatList
          key={activeTab}
          data={
            activeTab === 'emotions' ? emotions :
            activeTab === 'thoughts' ? thoughts :
            activeTab === 'journal'  ? journals :
            goals
          }
          keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState(activeConfig.label, activeConfig.icon)}
          renderItem={({ item }) => {
            if (activeTab === 'emotions') return <EmotionCard item={item} />;
            if (activeTab === 'thoughts') return <ThoughtCard item={item} />;
            if (activeTab === 'journal')  return <JournalCard item={item} />;
            return <GoalCard item={item} />;
          }}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED CARD STYLES
// ─────────────────────────────────────────────────────────────────────────────
const card = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  primary: { fontSize: 14, fontWeight: '700', color: '#0F172A', lineHeight: 20 },
  secondary: { fontSize: 12, color: '#64748B', marginTop: 2, lineHeight: 16 },
  date: { fontSize: 10, color: '#CBD5E1', fontWeight: '600' },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  pillText: { fontSize: 9, fontWeight: '800', textTransform: 'capitalize' },

  // Intensity
  intensityWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  intensityLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', width: 56 },
  intensityTrack: { flex: 1, height: 5, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  intensityFill: { height: '100%', borderRadius: 3 },
  intensityVal: { fontSize: 11, fontWeight: '800', width: 34, textAlign: 'right' },

  // Tags
  tagsWrap: { marginTop: 10 },
  tagLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagText: { fontSize: 10, fontWeight: '700' },

  // Body text
  bodyText: { fontSize: 12, color: '#64748B', marginTop: 10, lineHeight: 18 },

  // Info box (side-bordered)
  infoBox: {
    borderLeftWidth: 2.5,
    paddingLeft: 10,
    marginTop: 10,
    paddingVertical: 4,
  },
  infoBoxLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  infoBoxText: { fontSize: 12, color: '#334155', lineHeight: 18 },

  // Expanded section
  expandedSection: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 8 },

  // Goal milestone bar
  msBar: { marginTop: 10 },
  msTrack: { height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden' },
  msFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 2 },

  // Goal milestone list
  msSection: { marginTop: 10 },
  msSectionTitle: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  msRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  msDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  msDotDone: { backgroundColor: '#DCFCE7' },
  msDotPending: { backgroundColor: '#F1F5F9' },
  msTitle: { fontSize: 12, fontWeight: '600', color: '#334155' },
  msDesc: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  dateLine: { fontSize: 10, color: '#94A3B8', marginTop: 10, fontWeight: '500' },
});

// ─────────────────────────────────────────────────────────────────────────────
// JOURNAL MODAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const jm = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  title: { fontSize: 17, fontWeight: 'bold', color: '#0F172A', lineHeight: 24 },
  date: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  body: { flex: 1, paddingHorizontal: 20 },
  contentBox: {
    backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9',
    padding: 18, marginTop: 16, marginBottom: 16,
  },
  content: { fontSize: 15, color: '#334155', lineHeight: 26 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 40 },
  tag: { backgroundColor: '#ecfdf5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  tagText: { fontSize: 12, fontWeight: '600', color: '#065f46' },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },

  // Header
  header: {
    backgroundColor: '#052e16',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18,
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(5,150,105,0.1)', top: -60, right: -50,
  },
  headerCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(99,102,241,0.07)', bottom: -30, left: -20,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconBox: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  headerName: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  readOnlyBadge: {
    marginLeft: 'auto',
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  readOnlyText: { fontSize: 9, fontWeight: '700', color: '#34d399', textTransform: 'uppercase', letterSpacing: 0.8 },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    paddingHorizontal: 10, paddingVertical: 8, gap: 6,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: 12, gap: 4,
    backgroundColor: 'transparent',
  },
  tabBtnText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  tabCount: {
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tabCountText: { fontSize: 9, fontWeight: '800', color: '#94A3B8' },

  // List
  list: { padding: 16, paddingBottom: 48 },

  // Loading
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },

  // Empty
  empty: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 40 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
});
