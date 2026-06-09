import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';

import { Feather, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiService } from '../services/api';

const { width: W, height: H } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
interface Goal {
  id: number;
  title: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timebound: string;
  deadline?: string;
  status: 'pending' | 'in_progress' | 'approved' | 'completed';
  therapistComments?: string;
  createdAt: string;
}

interface Milestone {
  id: number;
  goalId: number;
  title: string;
  description?: string;
  dueDate?: string;
  isCompleted: boolean;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  completed: '#10B981', approved: '#10B981', in_progress: '#059669', pending: '#F59E0B',
};
const STATUS_BG: Record<string, string> = {
  completed: '#ECFDF5', approved: '#ECFDF5', in_progress: '#ecfdf5', pending: '#FFFBEB',
};
const STATUS_LABEL: Record<string, string> = {
  completed: 'Completed', approved: 'Approved', in_progress: 'In Progress', pending: 'Pending Review',
};

const SMART_META = [
  { key: 'specific',   letter: 'S', label: 'Specific',   color: '#EF4444', bg: '#FEF2F2' },
  { key: 'measurable', letter: 'M', label: 'Measurable', color: '#3B82F6', bg: '#EFF6FF' },
  { key: 'achievable', letter: 'A', label: 'Achievable', color: '#10B981', bg: '#ECFDF5' },
  { key: 'relevant',   letter: 'R', label: 'Relevant',   color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'timebound',  letter: 'T', label: 'Time-bound', color: '#059669', bg: '#ecfdf5' },
] as const;

// ─── Insights Panel ───────────────────────────────────────────────────────────
function InsightsPanel({ goals, allMilestones }: { goals: Goal[]; allMilestones: Milestone[] }) {
  const total       = goals.length;
  const completed   = goals.filter(g => g.status === 'completed' || g.status === 'approved').length;
  const inProgress  = goals.filter(g => g.status === 'in_progress').length;
  const pending     = goals.filter(g => g.status === 'pending').length;
  const rate        = total > 0 ? Math.round((completed / total) * 100) : 0;
  const msCompleted = allMilestones.filter(m => m.isCompleted).length;
  const msPending   = allMilestones.filter(m => !m.isCompleted).length;
  const msTotal     = allMilestones.length;
  const msRate      = msTotal > 0 ? Math.round((msCompleted / msTotal) * 100) : 0;

  const RING = 110; const STROKE = 11; const R = (RING - STROKE) / 2;
  const CIRC = 2 * Math.PI * R; const dash = (rate / 100) * CIRC;

  const segments = [
    { label: 'Completed',   count: completed,  color: '#10B981', pct: total > 0 ? (completed  / total) * 100 : 0 },
    { label: 'In Progress', count: inProgress, color: '#059669', pct: total > 0 ? (inProgress / total) * 100 : 0 },
    { label: 'Pending',     count: pending,    color: '#F59E0B', pct: total > 0 ? (pending    / total) * 100 : 0 },
  ];

  if (!total) return (
    <View style={ins.empty}>
      <View style={ins.emptyIcon}><Feather name="bar-chart-2" size={28} color="#059669" /></View>
      <Text style={ins.emptyTitle}>No Data Yet</Text>
      <Text style={ins.emptyBody}>Create SMART goals to unlock visual insights.</Text>
    </View>
  );

  return (
    <View style={ins.wrap}>
      {/* Hero ring card */}
      <View style={ins.heroCard}>
        <View style={ins.heroBlob1} /><View style={ins.heroBlob2} />
        <View style={ins.heroRow}>
          <View style={ins.ringWrap}>
            <Svg width={RING} height={RING} style={StyleSheet.absoluteFillObject}>
              <Circle cx={RING/2} cy={RING/2} r={R} stroke="rgba(255,255,255,0.10)" strokeWidth={STROKE} fill="none" />
              <Circle cx={RING/2} cy={RING/2} r={R} stroke="#059669" strokeWidth={STROKE} fill="none"
                strokeLinecap="round" strokeDasharray={`${CIRC}`} strokeDashoffset={CIRC - dash}
                rotation={-90} origin={`${RING/2},${RING/2}`} />
            </Svg>
            <Text style={ins.ringPct}>{rate}%</Text>
            <Text style={ins.ringLbl}>DONE</Text>
          </View>
          <View style={ins.heroStats}>
            <Text style={ins.heroTitle}>Goal Progress</Text>
            <Text style={ins.heroSub}>Your SMART Goals overview</Text>
            {[{ c: completed, l: 'Completed', col: '#10B981' }, { c: inProgress, l: 'In Progress', col: '#059669' }, { c: pending, l: 'Pending', col: '#F59E0B' }].map(x => (
              <View key={x.l} style={ins.statRow}>
                <View style={[ins.dot, { backgroundColor: x.col }]} />
                <Text style={ins.statLbl}>{x.l}</Text>
                <View style={{ flex: 1 }} />
                <Text style={[ins.statVal, { color: x.col }]}>{x.c}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={ins.pill}>
          <Feather name="target" size={11} color="#E2D9FD" />
          <Text style={ins.pillText}>{total} total SMART goals</Text>
        </View>
      </View>

      {/* Distribution */}
      <View style={ins.card}>
        <View style={ins.cardHeader}>
          <View style={[ins.cardIcon, { backgroundColor: '#ecfdf5' }]}><Feather name="pie-chart" size={13} color="#059669" /></View>
          <Text style={ins.cardTitle}>Status Distribution</Text>
        </View>
        <View style={ins.segBar}>
          {segments.filter(s => s.pct > 0).map((s, i, arr) => (
            <View key={s.label} style={[ins.segFill, { width: `${s.pct}%` as any, backgroundColor: s.color,
              borderTopLeftRadius: i === 0 ? 8 : 0, borderBottomLeftRadius: i === 0 ? 8 : 0,
              borderTopRightRadius: i === arr.length-1 ? 8 : 0, borderBottomRightRadius: i === arr.length-1 ? 8 : 0 }]} />
          ))}
        </View>
        {segments.map(s => (
          <View key={s.label} style={ins.segRow}>
            <View style={[ins.dot, { backgroundColor: s.color }]} />
            <Text style={ins.segLbl}>{s.label}</Text>
            <View style={{ flex: 1 }} />
            <Text style={[ins.segVal, { color: s.color }]}>{s.count}</Text>
            <Text style={ins.segPct}>{Math.round(s.pct)}%</Text>
          </View>
        ))}
      </View>

      {/* Milestones */}
      <View style={ins.card}>
        <View style={ins.cardHeader}>
          <View style={[ins.cardIcon, { backgroundColor: '#EFF6FF' }]}><Feather name="flag" size={13} color="#3B82F6" /></View>
          <Text style={ins.cardTitle}>Milestone Tracker</Text>
        </View>
        <View style={ins.msRow}>
          {[{ v: msTotal, l: 'Total', col: '#475569', bg: '#F8FAFC' }, { v: msCompleted, l: 'Achieved', col: '#10B981', bg: '#ECFDF5' }, { v: msPending, l: 'Remaining', col: '#F59E0B', bg: '#FFFBEB' }].map(x => (
            <View key={x.l} style={[ins.msBox, { backgroundColor: x.bg }]}>
              <Text style={[ins.msVal, { color: x.col }]}>{x.v}</Text>
              <Text style={ins.msLbl}>{x.l}</Text>
            </View>
          ))}
        </View>
        <View style={{ gap: 4 }}>
          <View style={ins.msProgRow}>
            <Text style={ins.msProgLbl}>Milestone Completion</Text>
            <Text style={[ins.msProgPct, { color: '#3B82F6' }]}>{msRate}%</Text>
          </View>
          <View style={ins.msProgBg}>
            <View style={[ins.msProgFill, { width: `${msRate}%` as any, backgroundColor: msRate === 100 ? '#10B981' : '#3B82F6' }]} />
          </View>
          <Text style={ins.msProgCaption}>{msCompleted} of {msTotal} milestones achieved</Text>
        </View>
      </View>

      <View style={ins.chips}>
        {[{ i: 'check-circle' as const, l: `${rate}% Done`, col: '#10B981', bg: '#ECFDF5' }, { i: 'trending-up' as const, l: `${inProgress} Active`, col: '#059669', bg: '#ecfdf5' }, { i: 'award' as const, l: `${msCompleted} Achieved`, col: '#3B82F6', bg: '#EFF6FF' }].map(x => (
          <View key={x.l} style={[ins.chip, { backgroundColor: x.bg }]}>
            <Feather name={x.i} size={12} color={x.col} />
            <Text style={[ins.chipText, { color: x.col }]}>{x.l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const ins = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#475569' },
  emptyBody: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 18 },
  heroCard: { backgroundColor: '#0F0720', borderRadius: 24, padding: 20, overflow: 'hidden' },
  heroBlob1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(5,150,105,0.12)', top: -40, right: -40 },
  heroBlob2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(59,130,246,0.08)', bottom: -20, left: 20 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 16 },
  ringWrap: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
  ringPct: { fontSize: 22, fontWeight: '800', color: '#FFF', lineHeight: 26 },
  ringLbl: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.8 },
  heroStats: { flex: 1, gap: 6 },
  heroTitle: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  heroSub: { fontSize: 9.5, color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginBottom: 8 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  statLbl: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  statVal: { fontSize: 13, fontWeight: '800' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  pillText: { fontSize: 10.5, fontWeight: '700', color: 'rgba(255,255,255,0.55)' },
  card: { backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', padding: 16, gap: 12, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#052e16' },
  segBar: { flexDirection: 'row', height: 10, borderRadius: 8, overflow: 'hidden', backgroundColor: '#F1F5F9', gap: 2 },
  segFill: { height: '100%' },
  segRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  segLbl: { fontSize: 12.5, fontWeight: '600', color: '#475569' },
  segVal: { fontSize: 14, fontWeight: '800', minWidth: 20, textAlign: 'right' },
  segPct: { fontSize: 11, fontWeight: '700', color: '#94A3B8', minWidth: 34, textAlign: 'right' },
  msRow: { flexDirection: 'row', gap: 8 },
  msBox: { flex: 1, borderRadius: 14, alignItems: 'center', paddingVertical: 12, gap: 3 },
  msVal: { fontSize: 22, fontWeight: '800' },
  msLbl: { fontSize: 9.5, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.3 },
  msProgRow: { flexDirection: 'row', justifyContent: 'space-between' },
  msProgLbl: { fontSize: 11.5, fontWeight: '700', color: '#475569' },
  msProgPct: { fontSize: 12, fontWeight: '800' },
  msProgBg: { height: 8, backgroundColor: '#EFF6FF', borderRadius: 4, overflow: 'hidden' },
  msProgFill: { height: '100%', borderRadius: 4 },
  msProgCaption: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  chips: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  chipText: { fontSize: 11.5, fontWeight: '700' },
});

// ─── Goal Detail Modal ────────────────────────────────────────────────────────
function GoalDetailModal({
  goal,
  milestones,
  msLoading,
  togglingId,
  onClose,
  onToggleMilestone,
  onAddMilestone,
  addMsVisible,
  msSaving,
  onCloseMsModal,
  onSaveMilestone,
}: {
  goal: Goal | null;
  milestones: Milestone[];
  msLoading: boolean;
  togglingId: number | null;
  onClose: () => void;
  onToggleMilestone: (id: number, current: boolean) => void;
  onAddMilestone: () => void;
  addMsVisible: boolean;
  msSaving: boolean;
  onCloseMsModal: () => void;
  onSaveMilestone: (data: { title: string; description: string; dueDate: Date | null }) => void;
}) {
  if (!goal) return null;
  const sc = STATUS_COLOR[goal.status] ?? '#94A3B8';
  const sb = STATUS_BG[goal.status]   ?? '#F8FAFC';
  const msDone = milestones.filter(m => m.isCompleted).length;
  const msPct  = milestones.length > 0 ? Math.round((msDone / milestones.length) * 100) : 0;
  const insets = useSafeAreaInsets();

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={gd.safeArea} edges={['bottom']}>
        {/* Header — manual top inset so Dynamic Island / notch is always cleared */}
        <View style={[gd.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity style={gd.backBtn} onPress={onClose} activeOpacity={0.8}>
            <Feather name="arrow-left" size={20} color="#052e16" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={gd.headerTitle} numberOfLines={2}>{goal.title}</Text>
          </View>
          <View style={[gd.statusBadge, { backgroundColor: sb }]}>
            <Text style={[gd.statusBadgeText, { color: sc }]}>{STATUS_LABEL[goal.status] ?? goal.status}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Milestone progress strip (if any) */}
          {milestones.length > 0 && (
            <View style={gd.progressStrip}>
              <View style={gd.progressStripTop}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="flag" size={13} color={sc} />
                  <Text style={gd.progressStripLabel}>Milestone Progress</Text>
                </View>
                <Text style={[gd.progressStripPct, { color: sc }]}>{msDone}/{milestones.length} ({msPct}%)</Text>
              </View>
              <View style={gd.progressBg}>
                <View style={[gd.progressFill, { width: `${msPct}%` as any, backgroundColor: sc }]} />
              </View>
            </View>
          )}

          {/* SMART criteria */}
          <View style={gd.section}>
            <Text style={gd.sectionLabel}>SMART CRITERIA</Text>
            <View style={gd.smartGrid}>
              {SMART_META.map(m => (
                <View key={m.key} style={[gd.smartCard, { borderLeftColor: m.color }]}>
                  <View style={[gd.smartLetterBox, { backgroundColor: m.bg }]}>
                    <Text style={[gd.smartLetter, { color: m.color }]}>{m.letter}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[gd.smartLabel, { color: m.color }]}>{m.label}</Text>
                    <Text style={gd.smartText}>{(goal as any)[m.key]}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Therapist comments */}
          {goal.therapistComments ? (
            <View style={gd.section}>
              <Text style={gd.sectionLabel}>THERAPIST FEEDBACK</Text>
              <View style={gd.feedbackCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <View style={gd.feedbackIcon}><Feather name="message-square" size={14} color="#D97706" /></View>
                  <Text style={gd.feedbackTitle}>Therapist Comments</Text>
                </View>
                <Text style={gd.feedbackText}>{goal.therapistComments}</Text>
              </View>
            </View>
          ) : null}

          {/* Milestones */}
          <View style={gd.section}>
            <View style={gd.milestoneHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={gd.sectionLabel}>MILESTONES</Text>
                {milestones.length > 0 && (
                  <View style={gd.msBadge}>
                    <Text style={gd.msBadgeText}>{msDone}/{milestones.length}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={gd.addMsBtn} onPress={onAddMilestone} activeOpacity={0.8}>
                <Feather name="plus" size={14} color="#059669" />
                <Text style={gd.addMsBtnText}>Add Milestone</Text>
              </TouchableOpacity>
            </View>

            {msLoading ? (
              <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 16 }} />
            ) : milestones.length === 0 ? (
              <View style={gd.msEmpty}>
                <View style={gd.msEmptyIcon}><Feather name="flag" size={22} color="#CBD5E1" /></View>
                <Text style={gd.msEmptyTitle}>No milestones yet</Text>
                <Text style={gd.msEmptyBody}>Break this goal into smaller, trackable steps.</Text>
                <TouchableOpacity style={gd.msEmptyBtn} onPress={onAddMilestone} activeOpacity={0.85}>
                  <Feather name="plus" size={14} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={gd.msEmptyBtnText}>Add First Milestone</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={gd.msList}>
                {milestones.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={[gd.msCard, m.isCompleted && gd.msCardDone]}
                    onPress={() => onToggleMilestone(m.id, m.isCompleted)}
                    activeOpacity={0.8}
                    disabled={togglingId === m.id}
                  >
                    <View style={[gd.msCheck, m.isCompleted && gd.msCheckDone]}>
                      {togglingId === m.id
                        ? <ActivityIndicator size="small" color="#FFF" />
                        : m.isCompleted && <Feather name="check" size={12} color="#FFF" />
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[gd.msTitle, m.isCompleted && gd.msTitleDone]}>{m.title}</Text>
                      {m.description ? <Text style={gd.msDesc}>{m.description}</Text> : null}
                      {m.dueDate ? (
                        <View style={gd.msDueDateRow}>
                          <Feather name="calendar" size={10} color="#94A3B8" />
                          <Text style={gd.msDueDate}>{new Date(m.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                        </View>
                      ) : null}
                    </View>
                    {m.isCompleted && (
                      <View style={gd.msCompletedBadge}>
                        <Text style={gd.msCompletedBadgeText}>Done</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Add Milestone sheet — nested here so it renders on top of this modal */}
        <AddMilestoneModal
          visible={addMsVisible}
          saving={msSaving}
          onClose={onCloseMsModal}
          onSave={onSaveMilestone}
        />
      </SafeAreaView>
    </Modal>
  );
}

const gd = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#052e16', flexShrink: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginLeft: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  progressStrip: { marginHorizontal: 16, marginTop: 14, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', padding: 14, gap: 8 },
  progressStripTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressStripLabel: { fontSize: 12, fontWeight: '700', color: '#475569' },
  progressStripPct: { fontSize: 12, fontWeight: '800' },
  progressBg: { height: 7, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionLabel: { fontSize: 9.5, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.2, marginBottom: 10 },
  smartGrid: { gap: 10 },
  smartCard: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', borderLeftWidth: 4, flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  smartLetterBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  smartLetter: { fontSize: 15, fontWeight: '900' },
  smartLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 3 },
  smartText: { fontSize: 13.5, color: '#1E293B', lineHeight: 20 },
  feedbackCard: { backgroundColor: '#FFFBEB', borderRadius: 16, borderWidth: 1, borderColor: '#FDE68A', padding: 14 },
  feedbackIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  feedbackTitle: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  feedbackText: { fontSize: 13, color: '#92400E', lineHeight: 19 },
  milestoneHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  msBadge: { backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  msBadgeText: { fontSize: 10, fontWeight: '800', color: '#047857' },
  addMsBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#d1fae5' },
  addMsBtnText: { fontSize: 12.5, fontWeight: '800', color: '#059669' },
  msEmpty: { alignItems: 'center', paddingVertical: 36, gap: 8 },
  msEmptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  msEmptyTitle: { fontSize: 15, fontWeight: '800', color: '#475569' },
  msEmptyBody: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 17 },
  msEmptyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#052e16', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 6 },
  msEmptyBtnText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  msList: { gap: 8 },
  msCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', padding: 14, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  msCardDone: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  msCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  msCheckDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  msTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', lineHeight: 20 },
  msTitleDone: { textDecorationLine: 'line-through', color: '#94A3B8' },
  msDesc: { fontSize: 12, color: '#64748B', lineHeight: 17, marginTop: 3 },
  msDueDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  msDueDate: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  msCompletedBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  msCompletedBadgeText: { fontSize: 10, fontWeight: '800', color: '#16A34A' },
});

// ─── Add Milestone Modal ──────────────────────────────────────────────────────
function AddMilestoneModal({
  visible,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (data: { title: string; description: string; dueDate: Date | null }) => void;
}) {
  const [msTitle, setMsTitle]       = useState('');
  const [msDesc, setMsDesc]         = useState('');
  const [dueDate, setDueDate]       = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!visible) { setMsTitle(''); setMsDesc(''); setDueDate(null); setShowPicker(false); }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={ms.backdrop}>
        <View style={ms.sheet}>
          {/* Handle */}
          <View style={ms.handle} />

          {/* Header */}
          <View style={ms.header}>
            <View style={ms.headerIcon}><Feather name="flag" size={16} color="#059669" /></View>
            <View style={{ flex: 1 }}>
              <Text style={ms.headerTitle}>Add Milestone</Text>
              <Text style={ms.headerSub}>Break your goal into a smaller, trackable step</Text>
            </View>
            <TouchableOpacity style={ms.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Feather name="x" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={ms.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={ms.fieldGroup}>
              <Text style={ms.fieldLabel}>TITLE <Text style={{ color: '#EF4444' }}>*</Text></Text>
              <TextInput
                style={ms.input}
                placeholder="E.g., Complete first breathing session"
                placeholderTextColor="#94A3B8"
                value={msTitle}
                onChangeText={setMsTitle}
                returnKeyType="next"
              />
            </View>

            {/* Description */}
            <View style={ms.fieldGroup}>
              <Text style={ms.fieldLabel}>DESCRIPTION <Text style={ms.optional}>(optional)</Text></Text>
              <TextInput
                style={ms.textArea}
                placeholder="Any additional context or notes…"
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
                value={msDesc}
                onChangeText={setMsDesc}
              />
            </View>

            {/* Due date */}
            <View style={ms.fieldGroup}>
              <Text style={ms.fieldLabel}>DUE DATE <Text style={ms.optional}>(optional)</Text></Text>
              <TouchableOpacity
                style={ms.dateBtn}
                activeOpacity={0.8}
                onPress={() => setShowPicker(v => !v)}
              >
                <View style={ms.dateBtnIcon}>
                  <Feather name="calendar" size={16} color={dueDate ? '#059669' : '#94A3B8'} />
                </View>
                <Text style={[ms.dateBtnText, dueDate && ms.dateBtnTextSel]}>
                  {dueDate
                    ? dueDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Select a due date…'
                  }
                </Text>
                {dueDate
                  ? <TouchableOpacity onPress={() => { setDueDate(null); setShowPicker(false); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Feather name="x-circle" size={16} color="#CBD5E1" /></TouchableOpacity>
                  : <Feather name="chevron-down" size={16} color="#CBD5E1" />
                }
              </TouchableOpacity>

              {showPicker && (
                <View style={ms.pickerWrap}>
                  <DateTimePicker
                    value={dueDate ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    minimumDate={new Date()}
                    themeVariant="light"
                    accentColor="#059669"
                    onChange={(_e: any, sel?: Date) => {
                      if (Platform.OS !== 'ios') setShowPicker(false);
                      if (sel) setDueDate(sel);
                    }}
                  />
                  {Platform.OS === 'ios' && (
                    <View style={ms.pickerActions}>
                      <TouchableOpacity style={ms.pickerClear} onPress={() => { setDueDate(null); setShowPicker(false); }}>
                        <Text style={ms.pickerClearText}>Clear</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={ms.pickerDone} onPress={() => setShowPicker(false)}>
                        <Text style={ms.pickerDoneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Tip card */}
            <View style={ms.tipCard}>
              <Feather name="info" size={13} color="#047857" style={{ marginTop: 1 }} />
              <Text style={ms.tipText}>Good milestones are specific, measurable actions that move you closer to your goal.</Text>
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={[ms.saveBtn, (!msTitle.trim() || saving) && ms.saveBtnDisabled]}
              onPress={() => onSave({ title: msTitle, description: msDesc, dueDate })}
              disabled={!msTitle.trim() || saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator size="small" color="#FFF" />
                : <><Feather name="check-circle" size={16} color="#FFF" style={{ marginRight: 8 }} /><Text style={ms.saveBtnText}>Save Milestone</Text></>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(9,5,20,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#F8FAFC', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: H * 0.92, overflow: 'hidden' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FFF' },
  headerIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#052e16' },
  headerSub: { fontSize: 11.5, color: '#94A3B8', marginTop: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20, gap: 16, paddingBottom: 36 },
  fieldGroup: { gap: 7 },
  fieldLabel: { fontSize: 9.5, fontWeight: '800', color: '#64748B', letterSpacing: 1 },
  optional: { fontSize: 9, fontWeight: '600', color: '#94A3B8' },
  input: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#1E293B', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  textArea: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 13, fontSize: 14, color: '#1E293B', minHeight: 100, lineHeight: 21, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  dateBtnIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' },
  dateBtnText: { flex: 1, fontSize: 14, color: '#94A3B8', fontWeight: '500' },
  dateBtnTextSel: { color: '#1E293B', fontWeight: '600' },
  pickerWrap: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', marginTop: 4 },
  pickerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  pickerClear: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F1F5F9' },
  pickerClearText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  pickerDone: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, backgroundColor: '#052e16' },
  pickerDoneText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  tipCard: { flexDirection: 'row', gap: 10, backgroundColor: 'rgba(237,233,254,0.35)', borderRadius: 14, borderWidth: 1, borderColor: '#d1fae5', padding: 13 },
  tipText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 18 },
  saveBtn: { backgroundColor: '#052e16', borderRadius: 16, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#052e16', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  saveBtnDisabled: { backgroundColor: '#CBD5E1' },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});

// ─── SMART Goal Wizard Modal ──────────────────────────────────────────────────
const STEPS = [
  { step: 1, letter: null,  letterStyle: null,           title: 'Goal Summary',  desc: 'Give your goal a short, action-oriented title. You\'ll detail the SMART criteria in the next steps.', placeholder: 'E.g., Morning Deep Breathing Routine',     field: 'title',      multiline: false },
  { step: 2, letter: 'S',   letterStyle: 'S' as const,   title: 'Specific',      desc: 'What exactly will you do? Define the action, place, and details clearly.',                             placeholder: 'E.g., I will practice deep diaphragmatic breathing in my bedroom.', field: 'specific',   multiline: true  },
  { step: 3, letter: 'M',   letterStyle: 'M' as const,   title: 'Measurable',    desc: 'How will you track progress or know when it is completed?',                                            placeholder: 'E.g., 10 minutes every morning, logged in my journal.',             field: 'measurable', multiline: true  },
  { step: 4, letter: 'A',   letterStyle: 'A' as const,   title: 'Achievable',    desc: 'Is this realistic? Consider your resources and time.',                                                  placeholder: 'E.g., Yes, I can wake up 15 minutes earlier to sit quietly.',        field: 'achievable', multiline: true  },
  { step: 5, letter: 'R',   letterStyle: 'R' as const,   title: 'Relevant',      desc: 'Why is this goal important to your CBT and wellness journey?',                                         placeholder: 'E.g., It helps lower baseline anxiety and regulates tension.',        field: 'relevant',   multiline: true  },
  { step: 6, letter: 'T',   letterStyle: 'T' as const,   title: 'Time-bound',    desc: 'What is the timeline or deadline for this goal?',                                                      placeholder: 'E.g., Daily for the next 2 weeks',                                  field: 'timebound',  multiline: false },
];

const LETTER_COLORS: Record<string, string> = { S: '#EF4444', M: '#3B82F6', A: '#10B981', R: '#F59E0B', T: '#059669' };
const LETTER_BG:    Record<string, string> = { S: '#FEF2F2', M: '#EFF6FF', A: '#ECFDF5', R: '#FFFBEB', T: '#ecfdf5' };

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function GoalsScreen({ navigation }: { navigation: any }) {
  const [goals, setGoals]               = useState<Goal[]>([]);
  const [allMilestones, setAllMilestones] = useState<Milestone[]>([]);
  const [goalMilestones, setGoalMilestones] = useState<Record<number, Milestone[]>>({});
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [userId, setUserId]             = useState<number | null>(null);
  const [activeTab, setActiveTab]       = useState<'goals' | 'insights'>('goals');

  // Goal Detail modal
  const [selectedGoal, setSelectedGoal]         = useState<Goal | null>(null);
  const [loadingMsFor, setLoadingMsFor]         = useState<number | null>(null);
  const [togglingMilestone, setTogglingMilestone] = useState<number | null>(null);

  // Add Milestone modal
  const [addMsGoalId, setAddMsGoalId]   = useState<number | null>(null);
  const [msSaving, setMsSaving]         = useState(false);

  // SMART Goal creation modal
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [currentStep, setCurrentStep]   = useState(1);
  const [saving, setSaving]             = useState(false);
  const [form, setForm] = useState({ title: '', specific: '', measurable: '', achievable: '', relevant: '', timebound: '' });

  // ── Load ─────────────────────────────────────────────────────────────────
  const loadGoals = async () => {
    try {
      const userRes = await ApiService.getCurrentUser();
      if (!userRes.data) return;
      const uid = userRes.data.id; setUserId(uid);
      const [goalsRes, msRes] = await Promise.all([ApiService.getGoals(uid), ApiService.getAllMilestones(uid)]);
      if (goalsRes.data) setGoals(goalsRes.data);
      if (msRes.data)    setAllMilestones(msRes.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadGoals(); }, []);
  const onRefresh = () => { setRefreshing(true); loadGoals(); };

  // ── Open Goal Detail ──────────────────────────────────────────────────────
  const openGoal = async (g: Goal) => {
    setSelectedGoal(g);
    if (!goalMilestones[g.id]) {
      setLoadingMsFor(g.id);
      try {
        const res = await ApiService.getGoalMilestones(g.id);
        if (res.data) setGoalMilestones(prev => ({ ...prev, [g.id]: res.data! }));
      } catch {}
      finally { setLoadingMsFor(null); }
    }
  };

  // ── Toggle Milestone ──────────────────────────────────────────────────────
  const handleToggleMilestone = async (milestoneId: number, current: boolean) => {
    if (!selectedGoal) return;
    setTogglingMilestone(milestoneId);
    try {
      const res = await ApiService.toggleMilestoneCompletion(milestoneId, !current);
      if (res.data) {
        setGoalMilestones(prev => ({ ...prev, [selectedGoal.id]: (prev[selectedGoal.id] || []).map(m => m.id === milestoneId ? { ...m, isCompleted: !current } : m) }));
        setAllMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, isCompleted: !current } : m));
      }
    } catch { Alert.alert('Error', 'Could not update milestone.'); }
    finally { setTogglingMilestone(null); }
  };

  // ── Save Milestone ────────────────────────────────────────────────────────
  const handleSaveMilestone = async (data: { title: string; description: string; dueDate: Date | null }) => {
    if (!addMsGoalId || !data.title.trim()) { Alert.alert('Required', 'Please enter a milestone title.'); return; }
    setMsSaving(true);
    try {
      const res = await ApiService.createMilestone(addMsGoalId, {
        title: data.title.trim(),
        description: data.description.trim() || undefined,
        dueDate: data.dueDate ? data.dueDate.toISOString().split('T')[0] : undefined,
      });
      if (res.data) {
        const newMs: Milestone = res.data;
        setGoalMilestones(prev => ({ ...prev, [addMsGoalId]: [...(prev[addMsGoalId] || []), newMs] }));
        setAllMilestones(prev => [...prev, newMs]);
        setAddMsGoalId(null);
      } else { Alert.alert('Error', res.error || 'Failed to add milestone.'); }
    } catch { Alert.alert('Error', 'Could not save milestone.'); }
    finally { setMsSaving(false); }
  };

  // ── Create Goal ───────────────────────────────────────────────────────────
  const closeGoalModal = () => { setGoalModalVisible(false); setCurrentStep(1); setForm({ title:'', specific:'', measurable:'', achievable:'', relevant:'', timebound:'' }); };
  const currentField = STEPS[currentStep - 1]?.field ?? 'title';
  const currentValue = (form as any)[currentField] ?? '';
  const isValid = currentValue.trim().length > 0;

  const handleCreateGoal = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const res = await ApiService.createGoal(userId, { ...form, status: 'pending' });
      if (res.data) { Alert.alert('Success', 'SMART Goal created!'); closeGoalModal(); loadGoals(); }
      else Alert.alert('Error', res.error || 'Failed to create goal.');
    } catch { Alert.alert('Error', 'An error occurred.'); }
    finally { setSaving(false); }
  };

  // ── Grouped Goals ─────────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const r = { inProgress: [] as Goal[], pending: [] as Goal[], completed: [] as Goal[] };
    goals.forEach(g => {
      if (g.status === 'completed' || g.status === 'approved') r.completed.push(g);
      else if (g.status === 'in_progress') r.inProgress.push(g);
      else r.pending.push(g);
    });
    return r;
  }, [goals]);

  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed' || g.status === 'approved').length;
  const completionPct = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  if (loading) return (
    <View style={s.loadingBox}><ActivityIndicator size="large" color="#059669" /></View>
  );

  // ── Goal Card ─────────────────────────────────────────────────────────────
  const renderCard = (g: Goal) => {
    const sc = STATUS_COLOR[g.status] ?? '#94A3B8';
    const sb = STATUS_BG[g.status]   ?? '#F8FAFC';
    const ms = allMilestones.filter(m => m.goalId === g.id);
    const msDone = ms.filter(m => m.isCompleted).length;
    const msPct  = ms.length > 0 ? Math.round((msDone / ms.length) * 100) : 0;

    return (
      <TouchableOpacity key={g.id} style={[s.goalCard, { borderLeftColor: sc }]} onPress={() => openGoal(g)} activeOpacity={0.88}>
        {/* Top row: title + status */}
        <View style={s.goalCardTop}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={s.goalCardTitle}>{g.title}</Text>
            <Text style={s.goalCardSpecific} numberOfLines={2}>{g.specific}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: sb }]}>
            <Text style={[s.statusBadgeText, { color: sc }]}>{STATUS_LABEL[g.status]}</Text>
          </View>
        </View>

        {/* Timebound */}
        <View style={s.goalCardMeta}>
          <Feather name="clock" size={11} color="#94A3B8" />
          <Text style={s.goalCardMetaText}>{g.timebound}</Text>
        </View>

        {/* Milestone progress bar */}
        {ms.length > 0 && (
          <View style={s.miniProgWrap}>
            <View style={s.miniProgBg}>
              <View style={[s.miniProgFill, { width: `${msPct}%` as any, backgroundColor: sc }]} />
            </View>
            <Text style={[s.miniProgText, { color: sc }]}>{msDone}/{ms.length}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={s.goalCardFooter}>
          <View style={s.smartPills}>
            {SMART_META.slice(0, 3).map(m => (
              <View key={m.key} style={[s.smartPill, { backgroundColor: m.bg }]}>
                <Text style={[s.smartPillText, { color: m.color }]}>{m.letter}</Text>
              </View>
            ))}
            <Text style={s.smartPillMore}>+2</Text>
          </View>
          <View style={s.viewBtn}>
            <Text style={s.viewBtnText}>View Details</Text>
            <Feather name="chevron-right" size={13} color="#059669" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['bottom']}>
      <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
      >
        {/* ── Hero Header ── */}
        <View style={s.hero}>
          <View style={s.heroBlob1} pointerEvents="none" />
          <View style={s.heroBlob2} pointerEvents="none" />
          <View style={s.heroInner}>
            <View style={s.heroTag}>
              <Feather name="target" size={12} color="#A78BFA" />
              <Text style={s.heroTagText}>BEHAVIORAL THERAPY</Text>
            </View>
            <Text style={s.heroTitle}>SMART Goals</Text>
            <Text style={s.heroSub}>Structure goals to build therapeutic focus and track clinical progress</Text>

            {totalGoals > 0 && (
              <View style={s.heroStats}>
                <View style={s.heroStat}>
                  <Text style={s.heroStatVal}>{totalGoals}</Text>
                  <Text style={s.heroStatLabel}>Total Goals</Text>
                </View>
                <View style={s.heroStatDivider} />
                <View style={s.heroStat}>
                  <Text style={s.heroStatVal}>{completedGoals}</Text>
                  <Text style={s.heroStatLabel}>Completed</Text>
                </View>
                <View style={s.heroStatDivider} />
                <View style={s.heroStat}>
                  <Text style={s.heroStatVal}>{completionPct}%</Text>
                  <Text style={s.heroStatLabel}>Success Rate</Text>
                </View>
              </View>
            )}

            {totalGoals > 0 && (
              <View style={s.heroProgressStrip}>
                <View style={s.heroProgressTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="check-circle" size={12} color="#34D399" />
                    <Text style={s.heroProgressLabel}>OVERALL PROGRESS</Text>
                  </View>
                  <Text style={s.heroProgressPct}>{completionPct}%</Text>
                </View>
                <View style={s.heroProgressBg}>
                  <View style={[s.heroProgressFill, { width: `${completionPct}%` as any }]} />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Tab bar (only if goals exist) ── */}
        {totalGoals > 0 && (
          <View style={s.tabWrap}>
            <View style={s.tabBar}>
              {(['goals', 'insights'] as const).map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  <Feather name={tab === 'goals' ? 'target' : 'bar-chart-2'} size={13} color={activeTab === tab ? '#FFF' : '#64748B'} style={{ marginRight: 5 }} />
                  <Text style={[s.tabBtnText, activeTab === tab && s.tabBtnTextActive]}>
                    {tab === 'goals' ? `Goals (${totalGoals})` : 'Insights'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Content ── */}
        {totalGoals === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}><Feather name="target" size={32} color="#94A3B8" /></View>
            <Text style={s.emptyTitle}>No Goals Set Yet</Text>
            <Text style={s.emptySub}>Structured SMART goals help focus behavioral activation and clinical progress.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => setGoalModalVisible(true)} activeOpacity={0.85}>
              <Feather name="plus" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={s.emptyBtnText}>Create Your First Goal</Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'insights' ? (
          <InsightsPanel goals={goals} allMilestones={allMilestones} />
        ) : (
          <View style={s.list}>
            {grouped.inProgress.length > 0 && (
              <View style={s.group}>
                <Text style={s.groupLabel}>IN PROGRESS ({grouped.inProgress.length})</Text>
                {grouped.inProgress.map(renderCard)}
              </View>
            )}
            {grouped.pending.length > 0 && (
              <View style={s.group}>
                <Text style={s.groupLabel}>PENDING REVIEW ({grouped.pending.length})</Text>
                {grouped.pending.map(renderCard)}
              </View>
            )}
            {grouped.completed.length > 0 && (
              <View style={s.group}>
                <Text style={s.groupLabel}>COMPLETED ({grouped.completed.length})</Text>
                {grouped.completed.map(renderCard)}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      {totalGoals > 0 && (
        <TouchableOpacity style={s.fab} onPress={() => setGoalModalVisible(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color="#FFF" />
          <Text style={s.fabText}>New Goal</Text>
        </TouchableOpacity>
      )}
      </View>

      {/* ── Bottom Navbar ── */}
      <View style={s.bottomNav}>
        {([
          { name: 'Dashboard',       icon: 'home-outline',      label: 'Home'      },
          { name: 'EmotionTracking', icon: 'heart-outline',     label: 'Emotions'  },
          { name: 'ThoughtRecord',   icon: 'bulb-outline',      label: 'Thoughts'  },
          { name: 'ResourceLibrary', icon: 'book-outline',      label: 'Resources' },
          { name: 'EmotionHistory',  icon: 'analytics-outline', label: 'Progress'  },
        ] as const).map(tab => (
          <TouchableOpacity key={tab.name} style={s.bottomNavItem} onPress={() => navigation.navigate('HomeTabs', { screen: tab.name })} activeOpacity={0.7}>
            <Ionicons name={tab.icon} size={22} color="#9CA3AF" />
            <Text style={s.bottomNavLabel}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Goal Detail Modal (AddMilestoneModal is nested inside) ── */}
      <GoalDetailModal
        goal={selectedGoal}
        milestones={selectedGoal ? (goalMilestones[selectedGoal.id] ?? []) : []}
        msLoading={selectedGoal !== null && loadingMsFor === selectedGoal.id}
        togglingId={togglingMilestone}
        onClose={() => setSelectedGoal(null)}
        onToggleMilestone={handleToggleMilestone}
        onAddMilestone={() => { if (selectedGoal) setAddMsGoalId(selectedGoal.id); }}
        addMsVisible={addMsGoalId !== null}
        msSaving={msSaving}
        onCloseMsModal={() => setAddMsGoalId(null)}
        onSaveMilestone={handleSaveMilestone}
      />

      {/* ── SMART Goal Creation Modal ── */}
      <Modal visible={goalModalVisible} animationType="slide" transparent onRequestClose={closeGoalModal}>
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            {/* Header */}
            <View style={s.modalHeader}>
              <View style={s.modalHeaderIcon}><Feather name="target" size={16} color="#059669" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.modalTitle}>Set SMART Goal</Text>
                <Text style={s.modalSub}>Step {currentStep} of {STEPS.length}</Text>
              </View>
              <TouchableOpacity style={s.modalCloseBtn} onPress={closeGoalModal} activeOpacity={0.8}>
                <Feather name="x" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
            {/* Progress */}
            <View style={s.modalProgressWrap}>
              <View style={s.modalProgressBg}>
                <View style={[s.modalProgressFill, { width: `${(currentStep / STEPS.length) * 100}%` as any }]} />
              </View>
              <View style={s.modalStepDots}>
                {STEPS.map((_, i) => (
                  <View key={i} style={[s.stepDot, i < currentStep && s.stepDotDone, i === currentStep - 1 && s.stepDotActive]} />
                ))}
              </View>
            </View>
            {/* Step content */}
            <ScrollView contentContainerStyle={s.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {STEPS.map(stepDef => {
                if (stepDef.step !== currentStep) return null;
                return (
                  <View key={stepDef.step}>
                    <View style={s.stepHeaderRow}>
                      {stepDef.letter
                        ? <View style={[s.stepLetterBox, { backgroundColor: LETTER_BG[stepDef.letter] }]}>
                            <Text style={[s.stepLetter, { color: LETTER_COLORS[stepDef.letter] }]}>{stepDef.letter}</Text>
                          </View>
                        : <View style={s.stepIconBox}><Feather name="target" size={18} color="#059669" /></View>
                      }
                      <Text style={s.stepTitle}>{stepDef.title}</Text>
                    </View>
                    <Text style={s.stepDesc}>{stepDef.desc}</Text>
                    {stepDef.multiline
                      ? <TextInput
                          style={s.modalTextArea}
                          placeholder={stepDef.placeholder}
                          placeholderTextColor="#94A3B8"
                          multiline
                          textAlignVertical="top"
                          value={currentValue}
                          onChangeText={v => setForm(f => ({ ...f, [currentField]: v }))}
                        />
                      : <TextInput
                          style={s.modalInput}
                          placeholder={stepDef.placeholder}
                          placeholderTextColor="#94A3B8"
                          value={currentValue}
                          onChangeText={v => setForm(f => ({ ...f, [currentField]: v }))}
                          returnKeyType="next"
                          onSubmitEditing={() => { if (isValid && currentStep < STEPS.length) setCurrentStep(p => p + 1); }}
                        />
                    }

                    <View style={s.navRow}>
                      {currentStep > 1 && (
                        <TouchableOpacity style={s.prevBtn} onPress={() => setCurrentStep(p => p - 1)} activeOpacity={0.8}>
                          <Feather name="chevron-left" size={16} color="#475569" style={{ marginRight: 4 }} />
                          <Text style={s.prevBtnText}>Back</Text>
                        </TouchableOpacity>
                      )}
                      {currentStep < STEPS.length
                        ? <TouchableOpacity style={[s.nextBtn, !isValid && s.nextBtnDisabled, currentStep === 1 && { flex: 1 }]} onPress={() => { if (isValid) setCurrentStep(p => p + 1); else Alert.alert('Required', 'Please fill in this field.'); }} activeOpacity={0.85}>
                            <Text style={s.nextBtnText}>Next Step</Text>
                            <Feather name="chevron-right" size={16} color="#FFF" style={{ marginLeft: 4 }} />
                          </TouchableOpacity>
                        : <TouchableOpacity style={[s.nextBtn, (!isValid || saving) && s.nextBtnDisabled]} onPress={handleCreateGoal} disabled={!isValid || saving} activeOpacity={0.85}>
                            {saving ? <ActivityIndicator size="small" color="#FFF" /> : <><Feather name="check-circle" size={15} color="#FFF" style={{ marginRight: 6 }} /><Text style={s.nextBtnText}>Create Goal</Text></>}
                          </TouchableOpacity>
                      }
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea:   { flex: 1, backgroundColor: '#F8FAFC' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },

  // Hero
  hero:    { backgroundColor: '#052e16', paddingBottom: 22, overflow: 'hidden' },
  heroBlob1: { position: 'absolute', top: -40, right: 20, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(5,150,105,0.10)' },
  heroBlob2: { position: 'absolute', bottom: 0, left: 40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(52,211,153,0.07)' },
  heroInner: { paddingHorizontal: 20, paddingTop: 20 },
  heroTag:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  heroTagText: { color: 'rgba(52,211,153,0.85)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { fontSize: 30, fontWeight: '900', color: '#FFF', letterSpacing: -0.5, marginBottom: 4 },
  heroSub:   { color: 'rgba(167,243,208,0.7)', fontSize: 13, lineHeight: 18, marginBottom: 16 },
  heroStats: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 14 },
  heroStat:  { alignItems: 'center' },
  heroStatVal:   { fontSize: 20, fontWeight: '900', color: '#FFF' },
  heroStatLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(167,243,208,0.65)', marginTop: 1 },
  heroStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' },
  heroProgressStrip: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 12 },
  heroProgressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  heroProgressLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(167,243,208,0.8)', letterSpacing: 1.5 },
  heroProgressPct: { fontSize: 11, fontWeight: '800', color: 'rgba(167,243,208,0.9)' },
  heroProgressBg: { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  heroProgressFill: { height: '100%', borderRadius: 3, backgroundColor: '#34D399' },

  // Tabs
  tabWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  tabBar:  { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4, gap: 4 },
  tabBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 11 },
  tabBtnActive: { backgroundColor: '#052e16', shadowColor: '#052e16', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabBtnText:   { fontSize: 12.5, fontWeight: '700', color: '#64748B' },
  tabBtnTextActive: { color: '#FFF' },

  // Empty
  empty:     { paddingVertical: 72, alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle:{ fontSize: 18, fontWeight: '800', color: '#475569', marginBottom: 6 },
  emptySub:  { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 19, marginBottom: 22 },
  emptyBtn:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#052e16', paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14 },
  emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  // Goals list
  list:  { paddingHorizontal: 16, paddingTop: 12, gap: 16 },
  group: { gap: 10 },
  groupLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 2 },

  // Goal Card
  goalCard: { backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', borderLeftWidth: 5, padding: 16, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  goalCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  goalCardTitle: { fontSize: 15, fontWeight: '800', color: '#052e16', marginBottom: 4 },
  goalCardSpecific: { fontSize: 12.5, color: '#64748B', lineHeight: 18 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexShrink: 0 },
  statusBadgeText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.3 },
  goalCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  goalCardMetaText: { fontSize: 11.5, color: '#94A3B8', fontWeight: '600' },
  miniProgWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  miniProgBg: { flex: 1, height: 5, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  miniProgFill: { height: '100%', borderRadius: 3 },
  miniProgText: { fontSize: 10, fontWeight: '800', minWidth: 32 },
  goalCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 10 },
  smartPills: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  smartPill: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  smartPillText: { fontSize: 10, fontWeight: '900' },
  smartPillMore: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginLeft: 2 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  viewBtnText: { fontSize: 12, fontWeight: '700', color: '#059669' },

  // FAB
  fab: { position: 'absolute', bottom: 16, right: 20, backgroundColor: '#052e16', borderRadius: 28, height: 50, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 6, shadowColor: '#052e16', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  fabText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  // Bottom nav
  bottomNav:     { flexDirection: 'row', backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, paddingBottom: 4 },
  bottomNavItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 2 },
  bottomNavLabel:{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' },

  // Goal creation modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(5,46,22,0.65)', justifyContent: 'flex-end' },
  modalSheet:    { backgroundColor: '#F8FAFC', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: H * 0.90, overflow: 'hidden' },
  modalHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginTop: 10 },
  modalHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FFF' },
  modalHeaderIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' },
  modalTitle:    { fontSize: 17, fontWeight: '800', color: '#052e16' },
  modalSub:      { fontSize: 11.5, color: '#94A3B8', marginTop: 1 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modalProgressWrap: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalProgressBg:   { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  modalProgressFill: { height: '100%', backgroundColor: '#059669', borderRadius: 3 },
  modalStepDots: { flexDirection: 'row', gap: 6 },
  stepDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E2E8F0' },
  stepDotDone:   { backgroundColor: '#059669' },
  stepDotActive: { width: 18, backgroundColor: '#059669' },
  modalBody:     { padding: 20, paddingBottom: 36 },
  stepHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  stepLetterBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepLetter:    { fontSize: 18, fontWeight: '900' },
  stepIconBox:   { width: 38, height: 38, borderRadius: 12, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' },
  stepTitle:     { fontSize: 18, fontWeight: '800', color: '#052e16' },
  stepDesc:      { fontSize: 13, color: '#64748B', lineHeight: 19, marginBottom: 16 },
  modalInput:    { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#1E293B', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  modalTextArea: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 13, fontSize: 14, color: '#1E293B', minHeight: 120, lineHeight: 21, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  navRow:  { flexDirection: 'row', gap: 10, marginTop: 22 },
  prevBtn: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  prevBtnText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  nextBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: '#052e16', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  nextBtnDisabled: { backgroundColor: '#CBD5E1' },
  nextBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
});
