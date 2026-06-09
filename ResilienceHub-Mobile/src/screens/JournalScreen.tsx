import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  Modal,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Line, Text as SvgText } from 'react-native-svg';
import { ApiService } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
interface JournalEntry {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  userSelectedTags?: string[];
  emotions?: string[];
  topics?: string[];
  sentimentPositive?: number;
  sentimentNegative?: number;
  sentimentNeutral?: number;
  aiAnalysis?: string;
  comments?: { id: number }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PROMPTS = [
  'What am I grateful for today?',
  'What challenged me and how did I handle it?',
  'What did I learn about myself today?',
  'How am I feeling right now and why?',
  'What would I tell my past self?',
  'What small win can I celebrate today?',
];

const PRESET_TAGS = [
  'grateful', 'anxious', 'hopeful', 'calm', 'stressed',
  'proud', 'sad', 'excited', 'overwhelmed', 'motivated',
];

const EMOTION_COLORS: Record<string, string> = {
  Joy: '#EAB308', Love: '#EC4899', Fear: '#10B981',
  Anger: '#EF4444', Sadness: '#3B82F6', Surprise: '#F59E0B',
};

const CORE_EMOTION_KEYWORDS: Record<string, string[]> = {
  Anger: ['anger','angry','rage','furious','mad','hostile','hate','frustrated','irritated','annoyed','bitter','outraged'],
  Sadness: ['sadness','sad','unhappy','depressed','sorrow','grief','hurt','disappointed','shame','guilty','lonely','hopeless','miserable','heartbroken','empty'],
  Fear: ['fear','afraid','scared','panic','insecure','nervous','worried','anxious','stressed','overwhelmed','uneasy','apprehensive','dread'],
  Surprise: ['surprise','surprised','stunned','shocked','confused','amazed','astonished','bewildered'],
  Joy: ['joy','happy','happiness','glad','content','pleased','satisfied','delighted','cheerful','proud','hopeful','excited','euphoric','grateful','elated'],
  Love: ['love','affectionate','fondness','caring','compassionate','peaceful','calm','connected','warmth','cherished'],
};

function mapToCoreEmotion(raw: string): string {
  const word = raw.toLowerCase().trim();
  for (const [name, keywords] of Object.entries(CORE_EMOTION_KEYWORDS)) {
    if (keywords.some(k => word.includes(k) || k.includes(word))) return name;
  }
  return 'Surprise';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ─── SVG Gauge ───────────────────────────────────────────────────────────────
function SentimentGauge({ value, color, label }: { value: number; color: string; label: string }) {
  const SIZE = 80;
  const STROKE = 8;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const dash = (value / 100) * CIRC;
  return (
    <View style={gauge.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="#F1F5F9" strokeWidth={STROKE} fill="none" />
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          stroke={color} strokeWidth={STROKE} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${CIRC}`}
          strokeDashoffset={CIRC - dash}
          rotation={-90} origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={gauge.center}>
        <Text style={[gauge.val, { color }]}>{value}%</Text>
      </View>
      <Text style={gauge.label}>{label}</Text>
    </View>
  );
}
const gauge = StyleSheet.create({
  wrap:   { alignItems: 'center', gap: 4 },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 20, alignItems: 'center', justifyContent: 'center' },
  val:    { fontSize: 13, fontWeight: '800' },
  label:  { fontSize: 9.5, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4 },
});

// ─── SVG Area Chart ──────────────────────────────────────────────────────────
interface ChartPoint { label: string; positive: number; negative: number; neutral: number; }

function SentimentAreaChart({ data }: { data: ChartPoint[] }) {
  const W = SCREEN_WIDTH - 64;
  const H = 160;
  const PAD = { top: 10, right: 8, bottom: 24, left: 28 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxVal = 100;

  if (data.length < 2) return null;

  const xScale = (i: number) => PAD.left + (i / (data.length - 1)) * innerW;
  const yScale = (v: number) => PAD.top + innerH - (v / maxVal) * innerH;

  const buildPath = (key: 'positive' | 'negative' | 'neutral') => {
    const pts = data.map((d, i) => `${xScale(i)},${yScale(d[key])}`);
    const last = data.length - 1;
    return `M${pts[0]} ` +
      pts.slice(1).map(p => `L${p}`).join(' ') +
      ` L${xScale(last)},${yScale(0) + PAD.bottom} L${xScale(0)},${yScale(0) + PAD.bottom} Z`;
  };

  const buildLine = (key: 'positive' | 'negative' | 'neutral') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d[key])}`).join(' ');

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <Svg width={W} height={H}>
      {yTicks.map(t => (
        <Line
          key={t}
          x1={PAD.left} y1={yScale(t)}
          x2={PAD.left + innerW} y2={yScale(t)}
          stroke="#F1F5F9" strokeWidth={1}
        />
      ))}
      {yTicks.filter(t => t > 0).map(t => (
        <SvgText key={t} x={PAD.left - 4} y={yScale(t) + 4} fontSize={9} fill="#94A3B8" textAnchor="end">{t}</SvgText>
      ))}
      <Path d={buildPath('positive')} fill="#10B981" opacity={0.15} />
      <Path d={buildPath('neutral')} fill="#64748B" opacity={0.12} />
      <Path d={buildPath('negative')} fill="#EF4444" opacity={0.15} />
      <Path d={buildLine('positive')} stroke="#10B981" strokeWidth={2} fill="none" />
      <Path d={buildLine('neutral')} stroke="#64748B" strokeWidth={1.5} fill="none" />
      <Path d={buildLine('negative')} stroke="#EF4444" strokeWidth={2} fill="none" />
      {data.map((d, i) => (
        <SvgText key={i} x={xScale(i)} y={H - 4} fontSize={9} fill="#94A3B8" textAnchor="middle">{d.label}</SvgText>
      ))}
    </Svg>
  );
}

// ─── SVG Pie Chart ───────────────────────────────────────────────────────────
interface PieSlice { name: string; value: number; color: string; }

function EmotionPieChart({ data }: { data: PieSlice[] }) {
  const SIZE = 160;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 60;
  const INNER_R = 36;

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  let cumAngle = -Math.PI / 2;
  const slices = data.map(d => {
    const angle = (d.value / total) * 2 * Math.PI;
    const startAngle = cumAngle;
    cumAngle += angle;
    return { ...d, startAngle, endAngle: cumAngle, angle };
  });

  const polarToCart = (cx: number, cy: number, r: number, angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <Svg width={SIZE} height={SIZE}>
        {slices.map((sl, i) => {
          const start = polarToCart(CX, CY, R, sl.startAngle);
          const end = polarToCart(CX, CY, R, sl.endAngle);
          const iStart = polarToCart(CX, CY, INNER_R, sl.startAngle);
          const iEnd = polarToCart(CX, CY, INNER_R, sl.endAngle);
          const largeArc = sl.angle > Math.PI ? 1 : 0;
          const d = [
            `M ${iStart.x} ${iStart.y}`,
            `L ${start.x} ${start.y}`,
            `A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`,
            `L ${iEnd.x} ${iEnd.y}`,
            `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${iStart.x} ${iStart.y}`,
            'Z',
          ].join(' ');
          return <Path key={i} d={d} fill={sl.color} opacity={0.9} />;
        })}
      </Svg>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {data.map(d => (
          <View key={d.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.color }} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#475569' }}>{d.name} ({d.value})</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Entry Card ──────────────────────────────────────────────────────────────
function EntryCard({ entry, onView, onEdit, onDelete }: {
  entry: JournalEntry;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const tags = entry.userSelectedTags ?? [];
  const commentCount = entry.comments?.length ?? 0;

  const showMenu = () => {
    Alert.alert(entry.title, undefined, [
      { text: 'View Details', onPress: onView },
      { text: 'Edit', onPress: onEdit },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={ec.card}>
      {/* Header */}
      <View style={ec.headerRow}>
        <Text style={ec.title} numberOfLines={1}>{entry.title}</Text>
        <TouchableOpacity onPress={showMenu} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={ec.moreBtn}>⋮</Text>
        </TouchableOpacity>
      </View>
      {/* Date */}
      <View style={ec.dateRow}>
        <Feather name="calendar" size={11} color="#8B5CF6" />
        <Text style={ec.dateText}>{fmtDate(entry.createdAt)}</Text>
      </View>
      {/* Content preview */}
      <TouchableOpacity onPress={onView} activeOpacity={0.8}>
        <Text style={ec.preview} numberOfLines={3}>{entry.content}</Text>
      </TouchableOpacity>
      {/* Tags */}
      {tags.length > 0 && (
        <View style={ec.tagsRow}>
          {tags.slice(0, 3).map(t => (
            <View key={t} style={ec.tag}>
              <Text style={ec.tagText}>#{t}</Text>
            </View>
          ))}
          {tags.length > 3 && (
            <View style={ec.moreTagBadge}>
              <Text style={ec.moreTagText}>+{tags.length - 3} more</Text>
            </View>
          )}
        </View>
      )}
      {/* Footer */}
      <View style={ec.footer}>
        <TouchableOpacity onPress={onView} activeOpacity={0.8}>
          <Text style={ec.viewLink}>View Details</Text>
        </TouchableOpacity>
        {commentCount > 0 && (
          <View style={ec.commentBadge}>
            <Feather name="message-circle" size={10} color="#94A3B8" />
            <Text style={ec.commentCount}>{commentCount}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const ec = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9',
    padding: 16, gap: 8,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  headerRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:         { fontSize: 15, fontWeight: '800', color: '#090514', flex: 1, marginRight: 8 },
  moreBtn:       { fontSize: 20, color: '#94A3B8', lineHeight: 22 },
  dateRow:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateText:      { fontSize: 11, fontWeight: '600', color: '#8B5CF6' },
  preview:       { fontSize: 13, color: '#64748B', lineHeight: 19, fontWeight: '400' },
  tagsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:           { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  tagText:       { fontSize: 10, fontWeight: '600', color: '#475569' },
  moreTagBadge:  { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  moreTagText:   { fontSize: 10, fontWeight: '700', color: '#6366F1' },
  footer:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  viewLink:      { fontSize: 12, fontWeight: '700', color: '#8B5CF6' },
  commentBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentCount:  { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
});

// ─── Insights Panel ──────────────────────────────────────────────────────────
function InsightsPanel({ entries }: { entries: JournalEntry[] }) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const total = entries.length;

  if (total === 0) {
    return (
      <View style={ip.empty}>
        <View style={ip.emptyIconRing}>
          <Feather name="book-open" size={26} color="#8B5CF6" />
        </View>
        <Text style={ip.emptyTitle}>No Insights Yet</Text>
        <Text style={ip.emptyBody}>Write your first journal entry to unlock sentiment trends, emotion patterns and topic analysis.</Text>
      </View>
    );
  }

  const avgPos = Math.round(entries.reduce((s, e) => s + (e.sentimentPositive ?? 0), 0) / total);
  const avgNeg = Math.round(entries.reduce((s, e) => s + (e.sentimentNegative ?? 0), 0) / total);
  const avgNeu = Math.round(entries.reduce((s, e) => s + (e.sentimentNeutral ?? 0), 0) / total);

  const emotionMap: Record<string, number> = {};
  entries.forEach(e => {
    (e.emotions ?? []).forEach(em => {
      const core = mapToCoreEmotion(em);
      emotionMap[core] = (emotionMap[core] || 0) + 1;
    });
  });
  const emotionData: PieSlice[] = Object.entries(emotionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value, color: EMOTION_COLORS[name] ?? '#8B5CF6' }));
  const topEmotion = emotionData[0]?.name ?? 'None';

  const topicMap: Record<string, number> = {};
  entries.forEach(e => (e.topics ?? []).forEach(t => { topicMap[t] = (topicMap[t] || 0) + 1; }));
  const topics = Object.entries(topicMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxTopicCount = topics[0]?.[1] ?? 1;

  const sentimentTrends = useMemo((): ChartPoint[] => {
    const now = new Date();
    if (timeRange === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        const ds = d.toISOString().split('T')[0];
        const dayEntries = entries.filter(e => e.createdAt.split('T')[0] === ds);
        const n = dayEntries.length || 1;
        return {
          label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
          positive: Math.round(dayEntries.reduce((s, e) => s + (e.sentimentPositive ?? 0), 0) / n),
          negative: Math.round(dayEntries.reduce((s, e) => s + (e.sentimentNegative ?? 0), 0) / n),
          neutral:  Math.round(dayEntries.reduce((s, e) => s + (e.sentimentNeutral  ?? 0), 0) / n),
        };
      });
    }
    if (timeRange === 'month') {
      return Array.from({ length: 4 }, (_, i) => {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (3 - i) * 7 - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const we = entries.filter(e => { const d = new Date(e.createdAt); return d >= weekStart && d <= weekEnd; });
        const n = we.length || 1;
        return {
          label: `W${i + 1}`,
          positive: Math.round(we.reduce((s, e) => s + (e.sentimentPositive ?? 0), 0) / n),
          negative: Math.round(we.reduce((s, e) => s + (e.sentimentNegative ?? 0), 0) / n),
          neutral:  Math.round(we.reduce((s, e) => s + (e.sentimentNeutral  ?? 0), 0) / n),
        };
      });
    }
    return Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(now.getFullYear(), i, 1);
      const me = entries.filter(e => new Date(e.createdAt).getMonth() === i && new Date(e.createdAt).getFullYear() === now.getFullYear());
      const n = me.length || 1;
      return {
        label: monthDate.toLocaleString('en-US', { month: 'short' }).slice(0, 3),
        positive: Math.round(me.reduce((s, e) => s + (e.sentimentPositive ?? 0), 0) / n),
        negative: Math.round(me.reduce((s, e) => s + (e.sentimentNegative ?? 0), 0) / n),
        neutral:  Math.round(me.reduce((s, e) => s + (e.sentimentNeutral  ?? 0), 0) / n),
      };
    });
  }, [entries, timeRange]);

  const calendarDays = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (29 - i));
      const ds = d.toISOString().split('T')[0];
      const count = entries.filter(e => e.createdAt.split('T')[0] === ds).length;
      return { day: d.getDate(), count };
    });
  }, [entries]);

  const streak = useMemo(() => {
    const now = new Date();
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (entries.some(e => e.createdAt.split('T')[0] === ds)) s++;
      else break;
    }
    return s;
  }, [entries]);

  return (
    <View style={ip.container}>
      <View style={ip.statRow}>
        {[
          { icon: 'book-open' as const, label: 'Total Entries', value: `${total}`, sub: 'Logs recorded', color: '#8B5CF6', bg: '#F5F3FF' },
          { icon: 'heart' as const,     label: 'Avg Positivity', value: `${avgPos}%`, sub: 'Positive sentiment', color: '#10B981', bg: '#ECFDF5' },
          { icon: 'trending-up' as const, label: 'Top Emotion', value: topEmotion, sub: 'Most common vibe', color: '#EC4899', bg: '#FDF2F8' },
        ].map(({ icon, label, value, sub, color, bg }) => (
          <View key={label} style={[ip.statBox, { backgroundColor: bg }]}>
            <View style={[ip.statIconWrap, { backgroundColor: `${color}20` }]}>
              <Feather name={icon} size={14} color={color} />
            </View>
            <Text style={[ip.statVal, { color }]} numberOfLines={1}>{value}</Text>
            <Text style={ip.statLbl}>{label}</Text>
            <Text style={ip.statSub}>{sub}</Text>
          </View>
        ))}
      </View>

      <View style={ip.sectionCard}>
        <View style={ip.sectionHeader}>
          <View style={[ip.sectionIcon, { backgroundColor: '#F5F3FF' }]}>
            <Feather name="activity" size={13} color="#8B5CF6" />
          </View>
          <View>
            <Text style={ip.sectionTitle}>Overall Sentiment</Text>
            <Text style={ip.sectionSub}>Average scores across all entries</Text>
          </View>
        </View>
        <View style={ip.gaugesRow}>
          <SentimentGauge value={avgPos} color="#10B981" label="Positive" />
          <View style={ip.gaugeDivider} />
          <SentimentGauge value={avgNeg} color="#EF4444" label="Negative" />
          <View style={ip.gaugeDivider} />
          <SentimentGauge value={avgNeu} color="#64748B" label="Neutral" />
        </View>
      </View>

      <View style={ip.sectionCard}>
        <View style={[ip.sectionHeader, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[ip.sectionIcon, { backgroundColor: '#EEF2FF' }]}>
              <Feather name="trending-up" size={13} color="#6366F1" />
            </View>
            <View>
              <Text style={ip.sectionTitle}>Sentiment Composition</Text>
              <Text style={ip.sectionSub}>Positivity vs. distress over time</Text>
            </View>
          </View>
          <View style={ip.rangePills}>
            {(['week', 'month', 'year'] as const).map(r => (
              <TouchableOpacity
                key={r} onPress={() => setTimeRange(r)} activeOpacity={0.8}
                style={[ip.rangePill, timeRange === r && ip.rangePillActive]}
              >
                <Text style={[ip.rangePillText, timeRange === r && ip.rangePillTextActive]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <SentimentAreaChart data={sentimentTrends} />
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
          {[['#10B981', 'Positive'], ['#64748B', 'Neutral'], ['#EF4444', 'Negative']].map(([color, label]) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {emotionData.length > 0 && (
        <View style={ip.sectionCard}>
          <View style={ip.sectionHeader}>
            <View style={[ip.sectionIcon, { backgroundColor: '#FDF2F8' }]}>
              <Feather name="book-open" size={13} color="#EC4899" />
            </View>
            <View>
              <Text style={ip.sectionTitle}>Detected Emotions</Text>
              <Text style={ip.sectionSub}>Core feelings found in your journals</Text>
            </View>
          </View>
          <EmotionPieChart data={emotionData} />
        </View>
      )}

      {topics.length > 0 && (
        <View style={ip.sectionCard}>
          <View style={ip.sectionHeader}>
            <View style={[ip.sectionIcon, { backgroundColor: '#F0FDFA' }]}>
              <Feather name="tag" size={13} color="#14B8A6" />
            </View>
            <View>
              <Text style={ip.sectionTitle}>Topic Analysis</Text>
              <Text style={ip.sectionSub}>Frequently addressed topics</Text>
            </View>
          </View>
          <View style={{ gap: 8 }}>
            {topics.map(([topic, count]) => {
              const pct = Math.round((count / maxTopicCount) * 100);
              return (
                <View key={topic} style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>{capitalize(topic)}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#14B8A6' }}>{count}</Text>
                  </View>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                    <View style={{ width: `${pct}%` as any, height: '100%', borderRadius: 3, backgroundColor: '#14B8A6' }} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {emotionData.length > 0 && (
        <View style={ip.sectionCard}>
          <View style={ip.sectionHeader}>
            <View style={[ip.sectionIcon, { backgroundColor: '#EEF2FF' }]}>
              <Feather name="cpu" size={13} color="#6366F1" />
            </View>
            <View>
              <Text style={ip.sectionTitle}>Emotion Word Canvas</Text>
              <Text style={ip.sectionSub}>Visual map of emotional weights</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16 }}>
            {emotionData.map(em => {
              const maxV = emotionData[0].value;
              const scale = 0.85 + (em.value / maxV) * 0.8;
              return (
                <View
                  key={em.name}
                  style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}
                >
                  <Text style={{ fontSize: Math.round(scale * 13), fontWeight: '700', color: em.color }}>
                    {em.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={ip.sectionCard}>
        <View style={ip.sectionHeader}>
          <View style={[ip.sectionIcon, { backgroundColor: '#ECFDF5' }]}>
            <Feather name="calendar" size={13} color="#10B981" />
          </View>
          <View>
            <Text style={ip.sectionTitle}>30-Day Writing Calendar</Text>
            <Text style={ip.sectionSub}>Consistency over the past month · {streak}d streak</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {calendarDays.map((d, i) => {
            let bg = '#F1F5F9';
            let textColor = '#CBD5E1';
            if (d.count === 1) { bg = '#EDE9FE'; textColor = '#7C3AED'; }
            else if (d.count === 2) { bg = '#C4B5FD'; textColor = '#4C1D95'; }
            else if (d.count >= 3) { bg = '#8B5CF6'; textColor = '#FFFFFF'; }
            const cellSize = (SCREEN_WIDTH - 64 - 9 * 4) / 10;
            return (
              <View key={i} style={{ width: cellSize, height: cellSize, borderRadius: 6, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: textColor }}>{d.day}</Text>
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
          {[['#F1F5F9', '#CBD5E1', 'None'], ['#EDE9FE', '#7C3AED', '1 Entry'], ['#C4B5FD', '#4C1D95', '2 Entries'], ['#8B5CF6', '#FFFFFF', '3+ Entries']].map(([bg, tc, label]) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: bg }} />
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#64748B' }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const ip = StyleSheet.create({
  container:      { gap: 12, paddingHorizontal: 16, paddingBottom: 24 },
  empty:          { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 12 },
  emptyIconRing:  { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' },
  emptyTitle:     { fontSize: 16, fontWeight: '800', color: '#475569' },
  emptyBody:      { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 18 },

  statRow:        { flexDirection: 'row', gap: 8 },
  statBox:        { flex: 1, borderRadius: 16, padding: 12, gap: 3 },
  statIconWrap:   { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statVal:        { fontSize: 13, fontWeight: '800' },
  statLbl:        { fontSize: 8.5, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.3 },
  statSub:        { fontSize: 8, fontWeight: '600', color: '#CBD5E1' },

  sectionCard:    { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1.5, borderColor: '#F1F5F9', padding: 16, gap: 14 },
  sectionHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  sectionIcon:    { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:   { fontSize: 13, fontWeight: '800', color: '#090514' },
  sectionSub:     { fontSize: 10, color: '#94A3B8', fontWeight: '500', marginTop: 1 },

  gaugesRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  gaugeDivider:   { width: 1, height: 60, backgroundColor: '#F1F5F9' },

  rangePills:     { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 2, gap: 2 },
  rangePill:      { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  rangePillActive:{ backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
  rangePillText:  { fontSize: 10, fontWeight: '700', color: '#64748B' },
  rangePillTextActive: { color: '#090514' },
});

// ─── Entry Detail Modal ───────────────────────────────────────────────────────
interface EntryDetailModalProps {
  entry: JournalEntry | null;
  onClose: () => void;
  onUpdated: (updated: JournalEntry) => void;
  onDeleted: (id: number) => void;
  onEditRequest: () => void;
}

function EntryDetailModal({ entry, onClose, onUpdated, onDeleted, onEditRequest }: EntryDetailModalProps) {
  if (!entry) return null;

  const handleDelete = () => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this journal entry? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const res = await ApiService.deleteJournalEntry(entry.id);
          if (res.error) {
            Alert.alert('Error', res.error);
          } else {
            onDeleted(entry.id);
            onClose();
          }
        },
      },
    ]);
  };

  const tags = entry.userSelectedTags ?? [];
  const emotions = entry.emotions ?? [];
  const topics = entry.topics ?? [];

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={dm.container}>
        {/* Dark gradient header */}
        <View style={dm.header}>
          {/* Glow orbs */}
          <View style={dm.orb1} />
          <View style={dm.orb2} />
          {/* Close button */}
          <TouchableOpacity style={dm.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Feather name="x" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          {/* Book icon container */}
          <View style={dm.bookIconWrap}>
            <Feather name="book-open" size={22} color="#FFFFFF" />
          </View>
          <Text style={dm.headerTitle} numberOfLines={2}>{entry.title}</Text>
          <Text style={dm.headerDate}>{fmtDate(entry.createdAt)} · {fmtTime(entry.createdAt)}</Text>
        </View>

        {/* Body */}
        <ScrollView contentContainerStyle={dm.body} showsVerticalScrollIndicator={false}>
          {/* Content section */}
          <View style={dm.section}>
            <View style={dm.sectionLabelRow}>
              <Feather name="message-circle" size={14} color="#3B82F6" />
              <Text style={[dm.sectionLabel, { color: '#3B82F6' }]}>Content</Text>
            </View>
            <View style={dm.blueBox}>
              <Text style={dm.blueBoxText}>{entry.content}</Text>
            </View>
          </View>

          {/* Tags section */}
          {tags.length > 0 && (
            <View style={dm.section}>
              <View style={dm.sectionLabelRow}>
                <Feather name="tag" size={14} color="#3B82F6" />
                <Text style={[dm.sectionLabel, { color: '#3B82F6' }]}>Tags</Text>
              </View>
              <View style={dm.pillRow}>
                {tags.map(t => (
                  <View key={t} style={dm.bluePill}>
                    <Text style={dm.bluePillText}>#{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* AI Insights section */}
          {entry.aiAnalysis ? (
            <View style={dm.section}>
              <View style={dm.sectionLabelRow}>
                <Feather name="zap" size={14} color="#F59E0B" />
                <Text style={[dm.sectionLabel, { color: '#F59E0B' }]}>AI Insights</Text>
              </View>
              <View style={dm.amberBox}>
                <Text style={dm.amberBoxText}>{entry.aiAnalysis}</Text>
              </View>
            </View>
          ) : null}

          {/* Detected Emotions */}
          {emotions.length > 0 && (
            <View style={dm.section}>
              <View style={dm.sectionLabelRow}>
                <Feather name="heart" size={14} color="#F43F5E" />
                <Text style={[dm.sectionLabel, { color: '#F43F5E' }]}>Detected Emotions</Text>
              </View>
              <View style={dm.pillRow}>
                {emotions.map(em => (
                  <View key={em} style={dm.rosePill}>
                    <Text style={dm.rosePillText}>{capitalize(em)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Detected Topics */}
          {topics.length > 0 && (
            <View style={dm.section}>
              <View style={dm.sectionLabelRow}>
                <Feather name="tag" size={14} color="#6366F1" />
                <Text style={[dm.sectionLabel, { color: '#6366F1' }]}>Detected Topics</Text>
              </View>
              <View style={dm.pillRow}>
                {topics.map(tp => (
                  <View key={tp} style={dm.indigoPill}>
                    <Text style={dm.indigoPillText}>{capitalize(tp)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer actions */}
        <View style={dm.footer}>
          <TouchableOpacity style={dm.editBtn} onPress={onEditRequest} activeOpacity={0.85}>
            <Feather name="edit-2" size={14} color="#8B5CF6" />
            <Text style={dm.editBtnText}>Edit Entry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dm.deleteBtn} onPress={handleDelete} activeOpacity={0.85}>
            <Feather name="trash-2" size={14} color="#FFFFFF" />
            <Text style={dm.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const dm = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F8FAFC' },
  header:       {
    backgroundColor: '#090514', paddingTop: 56, paddingBottom: 24,
    paddingHorizontal: 20, gap: 10, overflow: 'hidden', position: 'relative',
    alignItems: 'flex-start',
  },
  orb1:         { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(139,92,246,0.15)', top: -80, right: -60 },
  orb2:         { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(99,102,241,0.1)', bottom: -30, left: 20 },
  closeBtn:     { position: 'absolute', top: 54, right: 20, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  bookIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  headerTitle:  { fontSize: 20, fontWeight: '800', color: '#FFFFFF', maxWidth: SCREEN_WIDTH - 80 },
  headerDate:   { fontSize: 12, fontWeight: '500', color: 'rgba(147,197,253,0.8)' },
  body:         { padding: 20, gap: 20, paddingBottom: 40 },
  section:      { gap: 8 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  blueBox:      { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#BFDBFE' },
  blueBoxText:  { fontSize: 14, color: '#1E3A5F', lineHeight: 22 },
  amberBox:     { backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FDE68A' },
  amberBoxText: { fontSize: 13, color: '#78350F', lineHeight: 20 },
  pillRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bluePill:     { backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#BFDBFE' },
  bluePillText: { fontSize: 11, fontWeight: '600', color: '#1D4ED8' },
  rosePill:     { backgroundColor: '#FFF1F2', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#FECDD3' },
  rosePillText: { fontSize: 11, fontWeight: '600', color: '#BE123C' },
  indigoPill:   { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#C7D2FE' },
  indigoPillText:{ fontSize: 11, fontWeight: '600', color: '#4338CA' },
  footer:       { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FFFFFF' },
  editBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, borderRadius: 14, borderWidth: 1.5, borderColor: '#8B5CF6' },
  editBtnText:  { fontSize: 14, fontWeight: '700', color: '#8B5CF6' },
  deleteBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, borderRadius: 14, backgroundColor: '#EF4444' },
  deleteBtnText:{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

// ─── Edit Entry Modal ─────────────────────────────────────────────────────────
interface EditEntryModalProps {
  entry: JournalEntry | null;
  onClose: () => void;
  onUpdated: (updated: JournalEntry) => void;
}

function EditEntryModal({ entry, onClose, onUpdated }: EditEntryModalProps) {
  const [editTitle, setEditTitle]     = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    if (entry) {
      setEditTitle(entry.title);
      setEditContent(entry.content);
    }
  }, [entry]);

  if (!entry) return null;

  const handleSave = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      Alert.alert('Required', 'Title and content cannot be empty.');
      return;
    }
    setSaving(true);
    const res = await ApiService.updateJournalEntry(entry.id, {
      title: editTitle.trim(),
      content: editContent.trim(),
    });
    setSaving(false);
    if (res.error) {
      Alert.alert('Error', res.error);
    } else {
      onUpdated({ ...entry, title: editTitle.trim(), content: editContent.trim() });
      onClose();
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={em.container}>
        <View style={em.header}>
          <TouchableOpacity style={em.backBtn} onPress={onClose} activeOpacity={0.8}>
            <Feather name="arrow-left" size={18} color="#090514" />
          </TouchableOpacity>
          <Text style={em.headerTitle}>Edit Entry</Text>
          <TouchableOpacity style={em.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            {saving
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={em.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={em.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={em.fieldGroup}>
            <Text style={em.fieldLabel}>Title</Text>
            <TextInput
              style={em.titleInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Entry title"
              placeholderTextColor="#94A3B8"
            />
          </View>
          <View style={em.fieldGroup}>
            <Text style={em.fieldLabel}>Content</Text>
            <TextInput
              style={em.contentInput}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              textAlignVertical="top"
              placeholder="Write your entry…"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const em = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F8FAFC' },
  header:       { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, gap: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtn:      { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle:  { flex: 1, fontSize: 17, fontWeight: '800', color: '#090514' },
  saveBtn:      { backgroundColor: '#8B5CF6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  saveBtnText:  { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  body:         { padding: 20, gap: 20, paddingBottom: 60 },
  fieldGroup:   { gap: 8 },
  fieldLabel:   { fontSize: 12, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
  titleInput:   { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#090514', fontWeight: '600' },
  contentInput: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 13, fontSize: 14, color: '#1E293B', minHeight: 220, lineHeight: 22 },
});

// ─── Journal Wizard ──────────────────────────────────────────────────────────
function WriteWizard({ userId, onComplete }: { userId: number | null; onComplete: () => void }) {
  const TOTAL_STEPS = 4;
  const [step, setStep]             = useState(0);
  const [wTitle, setWTitle]         = useState('');
  const [wContent, setWContent]     = useState('');
  const [analyzing, setAnalyzing]   = useState(false);
  const [createdEntry, setCreatedEntry] = useState<any>(null);
  const [selTags, setSelTags]       = useState<string[]>([]);
  const [customTag, setCustomTag]   = useState('');
  const [savingTags, setSavingTags] = useState(false);
  const [done, setDone]             = useState(false);

  const titleErr  = wTitle.trim().length > 0 && wTitle.trim().length < 3;
  const contentErr = wContent.trim().length > 0 && wContent.trim().length < 20;

  const toggleTag = (tag: string) =>
    setSelTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]);

  const addCustomTag = () => {
    if (customTag.trim()) { toggleTag(customTag.trim()); setCustomTag(''); }
  };

  const handleAnalyze = async () => {
    if (wTitle.trim().length < 3) { Alert.alert('Title too short', 'Please write at least 3 characters.'); return; }
    if (wContent.trim().length < 20) { Alert.alert('Entry too short', 'Please write at least 20 characters.'); return; }
    if (!userId) return;
    setAnalyzing(true);
    try {
      const res = await ApiService.createJournalEntry(userId, { title: wTitle.trim(), content: wContent.trim() });
      if (res.error) { Alert.alert('Error', res.error); setAnalyzing(false); return; }
      setCreatedEntry(res.data);
      const aiTags = [...(res.data?.emotions ?? []), ...(res.data?.topics ?? [])];
      setSelTags(aiTags);
      setStep(3);
    } catch { Alert.alert('Error', 'Could not create entry.'); }
    finally { setAnalyzing(false); }
  };

  const handleSaveTags = async () => {
    if (!createdEntry) return;
    setSavingTags(true);
    try {
      await ApiService.updateJournalTags(createdEntry.id, selTags);
      setDone(true);
    } catch { Alert.alert('Error', 'Could not save tags.'); }
    finally { setSavingTags(false); }
  };

  const handleReset = () => {
    setStep(0); setWTitle(''); setWContent(''); setCreatedEntry(null);
    setSelTags([]); setCustomTag(''); setDone(false);
    onComplete();
  };

  const progress = step === 0 ? 0 : (step / (TOTAL_STEPS - 1)) * 100;

  // ── Success screen ──
  if (done && createdEntry) {
    return (
      <View style={wz.card}>
        <View style={wz.successHeader}>
          <View style={wz.successIconRing}>
            <Feather name="check" size={28} color="#10B981" />
          </View>
          <Text style={wz.successTitle}>Journal Entry Saved!</Text>
          <Text style={wz.successSub}>
            {selTags.length === 1
              ? 'Your entry has been saved with 1 tag.'
              : `Your entry has been saved with ${selTags.length} tags.`}
          </Text>
        </View>
        <View style={wz.summaryCard}>
          <Text style={wz.summaryLabel}>ENTRY SUMMARY</Text>
          <Text style={wz.summaryTitle}>{createdEntry.title}</Text>
          <Text style={wz.summaryContent} numberOfLines={2}>{createdEntry.content}</Text>
        </View>
        {selTags.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <Text style={wz.sectionLabel}>Selected Tags:</Text>
            <View style={wz.tagWrap}>
              {selTags.map((tag, i) => (
                <View key={i} style={wz.tagPill}>
                  <Text style={wz.tagPillText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <View style={wz.successBtns}>
          <TouchableOpacity style={wz.outlineBtn} onPress={handleReset} activeOpacity={0.85}>
            <Text style={wz.outlineBtnText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity style={wz.primaryBtn} onPress={() => {
            setStep(0); setWTitle(''); setWContent(''); setCreatedEntry(null);
            setSelTags([]); setCustomTag(''); setDone(false);
          }} activeOpacity={0.85}>
            <Text style={wz.primaryBtnText}>Write Another Entry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={wz.card}>
      {/* ── Progress header ── */}
      <View style={wz.progressHeader}>
        <View style={wz.progressTitleRow}>
          <Text style={wz.progressTitle}>Journal Entry Wizard</Text>
          <Text style={wz.progressStep}>
            {step === 0 ? 'Quick intro — about 2 minutes' : `Step ${step} of ${TOTAL_STEPS - 1}`}
          </Text>
        </View>
        {/* Progress bar */}
        <View style={wz.progressBarBg}>
          <View style={[wz.progressBarFill, { width: `${progress}%` as any }]} />
        </View>
        {/* Step labels */}
        <View style={wz.stepLabelsRow}>
          {['1. Title', '2. Write', '3. Review'].map((label, idx) => (
            <Text key={label} style={[wz.stepLabel, step > idx && wz.stepLabelActive]}>
              {label}
            </Text>
          ))}
        </View>
      </View>

      {/* ── Step 0: Introduction ── */}
      {step === 0 && (
        <View style={wz.body}>
          <View style={wz.introCenter}>
            <Feather name="send" size={22} color="#8B5CF6" />
            <Text style={wz.introTitle}>Welcome to Journaling</Text>
            <Text style={wz.introSub}>
              Express your thoughts and feelings in a safe, private space. Our AI will help identify patterns and provide insights.
            </Text>
          </View>
          <View style={wz.introGrid}>
            {([
              [
                { icon: 'heart' as const, label: 'Process Emotions', desc: 'Reduce emotional intensity and gain clarity.' },
                { icon: 'zap' as const,   label: 'AI Insights',      desc: 'Detect emotions, topics, and cognitive patterns.' },
              ],
              [
                { icon: 'tag' as const,   label: 'Track Patterns',   desc: 'Discover recurring themes in your wellness journey.' },
                { icon: 'shield' as const,label: 'Private & Secure', desc: 'Visible only to you and your therapist.' },
              ],
            ] as const).map((row, ri) => (
              <View key={ri} style={wz.introRow}>
                {row.map(item => (
                  <View key={item.label} style={wz.introCard}>
                    <View style={wz.introCardIcon}>
                      <Feather name={item.icon} size={15} color="#7C3AED" />
                    </View>
                    <Text style={wz.introCardLabel}>{item.label}</Text>
                    <Text style={wz.introCardDesc}>{item.desc}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
          <View style={wz.nextStepsCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Feather name="help-circle" size={14} color="#7C3AED" />
              <Text style={wz.nextStepsTitle}>What You'll Do Next</Text>
            </View>
            {[
              'Create a title that captures the main theme of your entry.',
              'Write freely about your thoughts, feelings, and experiences.',
              'Review AI-detected emotions and topics, customize your tags.',
            ].map((step, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                <Text style={wz.nextStepNum}>{i + 1}.</Text>
                <Text style={wz.nextStepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Step 1: Title ── */}
      {step === 1 && (
        <View style={wz.body}>
          <View style={wz.stepRow}>
            <View style={wz.stepMain}>
              <Text style={wz.fieldLabel}>Entry Title <Text style={{ color: '#EF4444' }}>*</Text></Text>
              <TextInput
                style={[wz.textInput, titleErr && wz.inputError]}
                placeholder="e.g., A Challenging Day at Work, Weekend Reflections..."
                placeholderTextColor="#94A3B8"
                value={wTitle}
                onChangeText={setWTitle}
                returnKeyType="next"
              />
              {titleErr
                ? <Text style={wz.errorText}>Title must be at least 3 characters</Text>
                : <Text style={wz.hintText}>Give your entry a descriptive title (at least 3 characters)</Text>
              }
            </View>
            <View style={wz.tipCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Feather name="help-circle" size={13} color="#7C3AED" />
                <Text style={wz.tipTitle}>Why Title Your Entry?</Text>
              </View>
              <Text style={wz.tipText}>
                A clear title helps you quickly identify and find entries later. Think of it as a headline that captures the main theme of your day.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Step 2: Content ── */}
      {step === 2 && (
        <View style={wz.body}>
          <View style={wz.stepRow}>
            <View style={wz.stepMain}>
              <Text style={wz.fieldLabel}>What's on your mind? <Text style={{ color: '#EF4444' }}>*</Text></Text>
              <TextInput
                style={[wz.textArea, contentErr && wz.inputError]}
                placeholder="Write about your thoughts, feelings, experiences... Be as detailed as you like."
                placeholderTextColor="#94A3B8"
                value={wContent}
                onChangeText={setWContent}
                multiline
                textAlignVertical="top"
              />
              {contentErr
                ? <Text style={wz.errorText}>Write at least 20 characters ({wContent.length}/20)</Text>
                : wContent.length > 0 && wContent.length < 20
                  ? <Text style={wz.warnText}>Keep writing... ({wContent.length}/20 characters minimum)</Text>
                  : <Text style={wz.hintText}>Write at least 20 characters to capture your thoughts</Text>
              }
            </View>
            <View style={wz.tipCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Feather name="help-circle" size={13} color="#7C3AED" />
                <Text style={wz.tipTitle}>Why Journal?</Text>
              </View>
              <Text style={wz.tipText}>
                Writing helps you process emotions, understand patterns, and gain insights. Express yourself freely — this is your safe space.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Step 3: AI Analysis & Tags ── */}
      {step === 3 && (
        <View style={wz.body}>
          {analyzing ? (
            <View style={wz.analyzingBox}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={wz.analyzingTitle}>AI is analyzing your entry...</Text>
              <Text style={wz.analyzingSubText}>Detecting emotions and themes</Text>
            </View>
          ) : createdEntry ? (
            <View style={wz.reviewGrid}>
              {/* Left: AI Insights + Custom Tag */}
              <View style={wz.reviewLeft}>
                {createdEntry.aiAnalysis ? (
                  <View style={wz.aiInsightCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Feather name="zap" size={13} color="#7C3AED" />
                      <Text style={wz.aiInsightTitle}>AI Insights</Text>
                    </View>
                    <Text style={wz.aiInsightText}>{createdEntry.aiAnalysis}</Text>
                  </View>
                ) : (
                  <View style={wz.aiInsightCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Feather name="zap" size={13} color="#7C3AED" />
                      <Text style={wz.aiInsightTitle}>AI Insights</Text>
                    </View>
                    <Text style={[wz.aiInsightText, { fontStyle: 'italic', color: '#94A3B8' }]}>Processing insights for your entry...</Text>
                  </View>
                )}
                {/* Custom tag input */}
                <View style={wz.customTagCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Feather name="plus" size={13} color="#7C3AED" />
                    <Text style={wz.aiInsightTitle}>Add Custom Tag</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={wz.customTagInput}
                      placeholder="Enter a custom tag..."
                      placeholderTextColor="#94A3B8"
                      value={customTag}
                      onChangeText={setCustomTag}
                      returnKeyType="done"
                      onSubmitEditing={addCustomTag}
                    />
                    <TouchableOpacity
                      style={[wz.addTagBtn, !customTag.trim() && { opacity: 0.4 }]}
                      onPress={addCustomTag}
                      disabled={!customTag.trim()}
                      activeOpacity={0.8}
                    >
                      <Text style={wz.addTagBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Right: Tag selection */}
              <View style={wz.tagSelectCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Feather name="tag" size={13} color="#7C3AED" />
                  <Text style={wz.aiInsightTitle}>Review & Select Tags</Text>
                </View>

                {/* Detected Emotions */}
                {(createdEntry.emotions?.length ?? 0) > 0 && (
                  <View style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                      <Feather name="heart" size={11} color="#F43F5E" />
                      <Text style={wz.tagGroupLabel}>Detected Emotions</Text>
                    </View>
                    <View style={wz.tagWrap}>
                      {createdEntry.emotions.map((em: string, i: number) => (
                        <TouchableOpacity
                          key={i}
                          style={[wz.tagChip, selTags.includes(em) && wz.tagChipSel]}
                          onPress={() => toggleTag(em)}
                          activeOpacity={0.8}
                        >
                          {selTags.includes(em) && <Feather name="check" size={10} color="#FFF" style={{ marginRight: 3 }} />}
                          <Text style={[wz.tagChipText, selTags.includes(em) && wz.tagChipTextSel]}>
                            {em}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Topics */}
                {(createdEntry.topics?.length ?? 0) > 0 && (
                  <View style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                      <Feather name="tag" size={11} color="#3B82F6" />
                      <Text style={wz.tagGroupLabel}>Topics & Themes</Text>
                    </View>
                    <View style={wz.tagWrap}>
                      {createdEntry.topics.map((tp: string, i: number) => (
                        <TouchableOpacity
                          key={i}
                          style={[wz.tagChip, selTags.includes(tp) && wz.tagChipSel]}
                          onPress={() => toggleTag(tp)}
                          activeOpacity={0.8}
                        >
                          {selTags.includes(tp) && <Feather name="check" size={10} color="#FFF" style={{ marginRight: 3 }} />}
                          <Text style={[wz.tagChipText, selTags.includes(tp) && wz.tagChipTextSel]}>
                            {tp}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Selected tags summary */}
                <View style={{ borderTopWidth: 1, borderTopColor: '#EDE9FE', paddingTop: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    <Feather name="check-square" size={11} color="#7C3AED" />
                    <Text style={wz.tagGroupLabel}>Selected Tags ({selTags.length})</Text>
                  </View>
                  {selTags.length > 0 ? (
                    <View style={wz.tagWrap}>
                      {selTags.map((tag, i) => (
                        <TouchableOpacity
                          key={i}
                          style={wz.selTagPill}
                          onPress={() => toggleTag(tag)}
                          activeOpacity={0.8}
                        >
                          <Text style={wz.selTagPillText}>{tag}</Text>
                          <Feather name="x" size={10} color="#6D28D9" style={{ marginLeft: 3 }} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={[wz.aiInsightText, { fontStyle: 'italic', color: '#94A3B8' }]}>
                      No tags selected yet. Tap emotions or topics above to select.
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ) : null}
        </View>
      )}

      {/* ── Nav buttons ── */}
      <View style={[wz.navRow, step === 0 && { justifyContent: 'center' }]}>
        {step > 0 && (
          <TouchableOpacity style={wz.prevBtn} onPress={() => setStep(s => s - 1)} activeOpacity={0.8} disabled={analyzing || savingTags}>
            <Feather name="chevron-left" size={16} color="#334155" style={{ marginRight: 4 }} />
            <Text style={wz.prevBtnText}>Previous</Text>
          </TouchableOpacity>
        )}
        {step < 2 && (
          <TouchableOpacity
            style={wz.primaryBtn}
            onPress={() => {
              if (step === 0) { setStep(1); return; }
              if (step === 1) {
                if (wTitle.trim().length < 3) { Alert.alert('Title too short', 'Please write at least 3 characters.'); return; }
                setStep(2);
              }
            }}
            activeOpacity={0.85}
          >
            <Text style={wz.primaryBtnText}>{step === 0 ? 'Get Started' : 'Next Step'}</Text>
            <Feather name="chevron-right" size={16} color="#FFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        )}
        {step === 2 && (
          <TouchableOpacity
            style={[wz.primaryBtn, (wContent.trim().length < 20 || analyzing) && { opacity: 0.5 }]}
            onPress={handleAnalyze}
            disabled={wContent.trim().length < 20 || analyzing}
            activeOpacity={0.85}
          >
            {analyzing
              ? <ActivityIndicator size="small" color="#FFF" />
              : <><Text style={wz.primaryBtnText}>Analyze Entry</Text><Feather name="chevron-right" size={16} color="#FFF" style={{ marginLeft: 4 }} /></>
            }
          </TouchableOpacity>
        )}
        {step === 3 && !analyzing && createdEntry && (
          <TouchableOpacity
            style={[wz.primaryBtn, savingTags && { opacity: 0.6 }]}
            onPress={handleSaveTags}
            disabled={savingTags}
            activeOpacity={0.85}
          >
            {savingTags
              ? <ActivityIndicator size="small" color="#FFF" />
              : <><Feather name="check" size={15} color="#FFF" style={{ marginRight: 4 }} /><Text style={wz.primaryBtnText}>Save Entry</Text></>
            }
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const wz = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  progressHeader: { backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 14 },
  progressTitleRow: { marginBottom: 10 },
  progressTitle: { fontSize: 16, fontWeight: '800', color: '#090514' },
  progressStep: { fontSize: 12, color: '#64748B', marginTop: 1 },
  progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: 6, backgroundColor: '#8B5CF6', borderRadius: 3 },
  stepLabelsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  stepLabelActive: { color: '#8B5CF6', fontWeight: '700' },
  body: { padding: 16, gap: 12 },
  // Intro step
  introCenter: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  introTitle: { fontSize: 18, fontWeight: '800', color: '#090514', textAlign: 'center' },
  introSub: { fontSize: 12.5, color: '#64748B', textAlign: 'center', lineHeight: 18, maxWidth: 280 },
  introGrid: { gap: 8 },
  introRow: { flexDirection: 'row', gap: 8 },
  introCard: { flex: 1, backgroundColor: '#FAF5FF', borderRadius: 14, borderWidth: 1, borderColor: '#EDE9FE', padding: 12 },
  introCardIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  introCardLabel: { fontSize: 12, fontWeight: '800', color: '#1E1B4B', marginBottom: 3 },
  introCardDesc: { fontSize: 10.5, color: '#64748B', lineHeight: 15 },
  nextStepsCard: { backgroundColor: 'rgba(237,233,254,0.3)', borderRadius: 14, borderWidth: 1, borderColor: '#EDE9FE', padding: 14 },
  nextStepsTitle: { fontSize: 12.5, fontWeight: '800', color: '#090514' },
  nextStepNum: { fontSize: 12, fontWeight: '700', color: '#7C3AED', width: 14 },
  nextStepText: { fontSize: 12, color: '#475569', flex: 1, lineHeight: 17 },
  // Step row layout
  stepRow: { gap: 12 },
  stepMain: { gap: 6 },
  tipCard: { backgroundColor: 'rgba(237,233,254,0.3)', borderRadius: 14, borderWidth: 1, borderColor: '#EDE9FE', padding: 13 },
  tipTitle: { fontSize: 12, fontWeight: '700', color: '#090514' },
  tipText: { fontSize: 11.5, color: '#64748B', lineHeight: 17 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#090514' },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#1E293B' },
  textArea: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontSize: 14, color: '#1E293B', minHeight: 160, lineHeight: 21, textAlignVertical: 'top' },
  inputError: { borderColor: '#FCA5A5' },
  errorText: { fontSize: 11.5, color: '#EF4444', fontWeight: '600' },
  hintText: { fontSize: 11.5, color: '#94A3B8' },
  warnText: { fontSize: 11.5, color: '#D97706', fontWeight: '600' },
  // Step 3 — review grid
  reviewGrid: { gap: 10 },
  reviewLeft: { gap: 10 },
  aiInsightCard: { backgroundColor: 'rgba(237,233,254,0.3)', borderRadius: 14, borderWidth: 1, borderColor: '#EDE9FE', padding: 13 },
  aiInsightTitle: { fontSize: 12.5, fontWeight: '700', color: '#090514' },
  aiInsightText: { fontSize: 12, color: '#475569', lineHeight: 17 },
  customTagCard: { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 13 },
  customTagInput: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#1E293B' },
  addTagBtn: { backgroundColor: '#090514', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  addTagBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  tagSelectCard: { backgroundColor: 'rgba(237,233,254,0.2)', borderRadius: 14, borderWidth: 1, borderColor: '#EDE9FE', padding: 13 },
  tagGroupLabel: { fontSize: 11, fontWeight: '700', color: '#475569' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#CBD5E1' },
  tagChipSel: { backgroundColor: '#090514', borderColor: '#090514' },
  tagChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  tagChipTextSel: { color: '#FFFFFF' },
  selTagPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE9FE', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: '#DDD6FE' },
  selTagPillText: { fontSize: 11.5, fontWeight: '600', color: '#6D28D9' },
  tagPill: { backgroundColor: '#EDE9FE', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  tagPillText: { fontSize: 11.5, fontWeight: '600', color: '#6D28D9' },
  // Analyzing
  analyzingBox: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  analyzingTitle: { fontSize: 15, fontWeight: '800', color: '#090514' },
  analyzingSubText: { fontSize: 12, color: '#94A3B8' },
  // Nav row
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  prevBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  prevBtnText: { fontSize: 13.5, fontWeight: '700', color: '#334155' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#090514', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 },
  primaryBtnText: { fontSize: 13.5, fontWeight: '700', color: '#FFFFFF' },
  outlineBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  outlineBtnText: { fontSize: 14, fontWeight: '700', color: '#334155' },
  // Success screen
  successHeader: { alignItems: 'center', paddingTop: 28, paddingBottom: 18, paddingHorizontal: 20 },
  successIconRing: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#090514', marginBottom: 4 },
  successSub: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  summaryCard: { marginHorizontal: 16, marginBottom: 14, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  summaryLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 6 },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#090514', marginBottom: 4 },
  summaryContent: { fontSize: 12.5, color: '#64748B', lineHeight: 18 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 8 },
  successBtns: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
interface JournalScreenProps { navigation: any; }

export default function JournalScreen({ navigation }: JournalScreenProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'entries' | 'insights'>('write');

  const [entries, setEntries]         = useState<JournalEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [editEntry, setEditEntry]     = useState<JournalEntry | null>(null);
  const [userId, setUserId]           = useState<number | null>(null);
  const editMode = editEntry !== null;

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    try {
      const userRes = await ApiService.getCurrentUser();
      if (!userRes.data) return;
      setUserId(userRes.data.id);
      const res = await ApiService.getJournalEntries(userRes.data.id);
      if (res.data) {
        setEntries([...res.data].sort((a: JournalEntry, b: JournalEntry) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch {}
    finally { setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  const handleEntryUpdated = (updated: JournalEntry) => {
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
    setSelectedEntry(updated);
  };

  const handleEntryDeleted = (id: number) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  // ── Computed stats ──
  const totalEntries = entries.length;
  const uniqueEmotions = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => (e.emotions ?? []).forEach(em => set.add(mapToCoreEmotion(em))));
    return set.size;
  }, [entries]);
  const commonEmotion = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach(e => (e.emotions ?? []).forEach(em => {
      const core = mapToCoreEmotion(em);
      map[core] = (map[core] || 0) + 1;
    }));
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? 'None';
  }, [entries]);

  const habitProgress = Math.min(totalEntries, 30);
  const habitPct = (habitProgress / 30) * 100;

  return (
    <SafeAreaView style={s.safeArea} edges={['bottom']}>
      <View style={s.container}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[1]}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Hero Header ── */}
          <View style={s.header}>
            {/* Glow orbs */}
            <View style={s.orb1} />
            <View style={s.orb2} />

            {/* Tag row */}
            <View style={s.tagRow}>
              <Feather name="zap" size={11} color="#C084FC" />
              <Text style={s.tagLabel}>SELF REFLECTION</Text>
            </View>

            {/* Title */}
            <Text style={s.heroTitle}>Journal</Text>
            <Text style={s.heroSubtitle}>
              Process your emotions and experiences: Reflect on your thoughts and feelings through daily journaling
            </Text>

            {/* Stats row — only when entries exist */}
            {totalEntries > 0 && (
              <View style={s.statsRow}>
                <View style={s.statItem}>
                  <Text style={s.statNumber}>{totalEntries}</Text>
                  <Text style={s.statLabel}>Total Entries</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={s.statNumber}>{commonEmotion}</Text>
                  <Text style={s.statLabel}>Common Emotion</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={s.statNumber}>{uniqueEmotions}</Text>
                  <Text style={s.statLabel}>Unique Emotions</Text>
                </View>
              </View>
            )}

            {/* Journaling Habit progress */}
            <View style={s.habitBox}>
              <View style={s.habitHeader}>
                <View style={s.habitIconWrap}>
                  <Feather name="book" size={13} color="#F59E0B" />
                </View>
                <Text style={s.habitLabel}>JOURNALING HABIT</Text>
                <Text style={s.habitCount}>{habitProgress} of 30 entries</Text>
              </View>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${habitPct}%` as any }]} />
              </View>
              <Text style={s.habitFooter}>Keep writing daily to build a strong journaling habit</Text>
            </View>
          </View>

          {/* ── Tab Bar (sticky) ── */}
          <View style={s.tabBarWrap}>
            <View style={s.tabBar}>
              {[
                { id: 'write' as const,    icon: 'edit-2' as const,      label: 'Write Entry' },
                { id: 'entries' as const,  icon: 'tag' as const,          label: 'My Journal' },
                { id: 'insights' as const, icon: 'trending-up' as const,  label: 'Insights' },
              ].map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  style={[s.tabItem, activeTab === tab.id && s.tabItemActive]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={tab.icon}
                    size={12}
                    color={activeTab === tab.id ? '#FFFFFF' : '#94A3B8'}
                  />
                  <Text style={[s.tabLabel, activeTab === tab.id && s.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Write Tab ── */}
          {activeTab === 'write' && (
            <WriteWizard
              userId={userId}
              onComplete={() => { loadEntries(); setActiveTab('entries'); }}
            />
          )}

          {/* ── My Journal Tab ── */}
          {activeTab === 'entries' && (
            loading ? (
              <View style={s.center}><ActivityIndicator size="large" color="#8B5CF6" /></View>
            ) : entries.length === 0 ? (
              <View style={s.emptyState}>
                <View style={s.emptyIconRing}>
                  <Feather name="book-open" size={28} color="#94A3B8" />
                </View>
                <Text style={s.emptyTitle}>No Entries Yet</Text>
                <Text style={s.emptySub}>Switch to Write Entry tab to create your first journal entry.</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={() => setActiveTab('write')} activeOpacity={0.85}>
                  <Text style={s.emptyBtnText}>Write Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={s.entriesList}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
              >
                {entries.map(entry => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onView={() => setSelectedEntry(entry)}
                    onEdit={() => setEditEntry(entry)}
                    onDelete={() => {
                      Alert.alert('Delete Entry', 'Are you sure?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete', style: 'destructive',
                          onPress: async () => {
                            const res = await ApiService.deleteJournalEntry(entry.id);
                            if (res.error) Alert.alert('Error', res.error);
                            else handleEntryDeleted(entry.id);
                          },
                        },
                      ]);
                    }}
                  />
                ))}
              </ScrollView>
            )
          )}

          {/* ── Insights Tab ── */}
          {activeTab === 'insights' && (
            loading ? (
              <View style={s.center}><ActivityIndicator size="large" color="#8B5CF6" /></View>
            ) : (
              <View style={{ paddingTop: 16, paddingBottom: 24 }}>
                <InsightsPanel entries={entries} />
              </View>
            )
          )}
        </ScrollView>

        {/* Modals */}
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onUpdated={handleEntryUpdated}
          onDeleted={handleEntryDeleted}
          onEditRequest={() => {
            setEditEntry(selectedEntry);
            setSelectedEntry(null);
          }}
        />
        <EditEntryModal
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onUpdated={(updated) => {
            handleEntryUpdated(updated);
            setEditEntry(null);
          }}
        />
      </View>

      {/* ── Bottom Navbar ── */}
      <View style={s.bottomNav}>
        {([
          { name: 'Dashboard',       icon: 'home-outline',      activeIcon: 'home',           label: 'Home'      },
          { name: 'EmotionTracking', icon: 'heart-outline',     activeIcon: 'heart',          label: 'Emotions'  },
          { name: 'ThoughtRecord',   icon: 'bulb-outline',      activeIcon: 'bulb',           label: 'Thoughts'  },
          { name: 'ResourceLibrary', icon: 'book-outline',      activeIcon: 'book',           label: 'Resources' },
          { name: 'EmotionHistory',  icon: 'analytics-outline', activeIcon: 'analytics',      label: 'Progress'  },
        ] as const).map(tab => (
          <TouchableOpacity
            key={tab.name}
            style={s.bottomNavItem}
            onPress={() => navigation.navigate('HomeTabs', { screen: tab.name })}
            activeOpacity={0.7}
          >
            <Ionicons name={tab.icon} size={22} color="#9CA3AF" />
            <Text style={s.bottomNavLabel}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── Screen Styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: '#F8FAFC' },
  container:   { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header:      {
    backgroundColor: '#090514',
    paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20,
    gap: 12, overflow: 'hidden', position: 'relative',
  },
  orb1:        { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(139,92,246,0.12)', top: -80, right: -50 },
  orb2:        { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(99,102,241,0.08)', bottom: -40, left: 10 },
  tagRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagLabel:    { fontSize: 11, fontWeight: '700', color: '#C084FC', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle:   { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
  heroSubtitle:{ fontSize: 13, color: 'rgba(196,181,253,0.7)', lineHeight: 19, fontWeight: '400' },

  statsRow:    { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 4 },
  statItem:    { alignItems: 'center', gap: 2 },
  statNumber:  { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  statLabel:   { fontSize: 10, fontWeight: '500', color: 'rgba(196,181,253,0.7)', textAlign: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' },

  habitBox:    { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, gap: 8, marginTop: 4 },
  habitHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  habitIconWrap:{ width: 24, height: 24, borderRadius: 7, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center' },
  habitLabel:  { flex: 1, fontSize: 10, fontWeight: '700', color: '#F59E0B', letterSpacing: 0.8, textTransform: 'uppercase' },
  habitCount:  { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  progressTrack:{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#A855F7' },
  habitFooter: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '400' },

  // Tab bar
  tabBarWrap:  { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tabBar:      { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 4, gap: 2 },
  tabItem:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10 },
  tabItemActive:{ backgroundColor: '#090514' },
  tabLabel:    { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  tabLabelActive:{ color: '#FFFFFF' },

  // Write form
  writeContent:   { padding: 16, gap: 12, paddingBottom: 40 },
  formCard:       { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', padding: 14, gap: 10 },
  fieldLabel:     { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6 },
  titleInput:     { fontSize: 16, color: '#090514', fontWeight: '600', paddingVertical: 4 },
  contentInput:   { fontSize: 14, color: '#1E293B', minHeight: 140, lineHeight: 22 },
  charCount:      { fontSize: 10, color: '#CBD5E1', fontWeight: '600', textAlign: 'right' },
  promptsScroll:  { gap: 8, paddingBottom: 2 },
  promptChip:     { backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#DDD6FE', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  promptChipText: { fontSize: 11, fontWeight: '600', color: '#7C3AED', maxWidth: 180 },
  tagsWrap:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip:        { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#FFFFFF' },
  tagChipActive:  { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  tagChipText:    { fontSize: 11, fontWeight: '700', color: '#475569' },
  tagChipTextActive:{ color: '#FFFFFF' },
  customTagInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#090514' },
  saveBtn:        { backgroundColor: '#8B5CF6', height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  saveBtnDisabled:{ backgroundColor: '#CBD5E1' },
  saveBtnText:    { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },

  // Entries
  entriesList:    { padding: 16, gap: 12, paddingBottom: 40 },
  center:         { paddingVertical: 60, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyState:     { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 12 },
  emptyIconRing:  { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  emptyTitle:     { fontSize: 17, fontWeight: '800', color: '#475569' },
  emptySub:       { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 19 },
  emptyBtn:       { backgroundColor: '#8B5CF6', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 },
  emptyBtnText:   { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  // Bottom Navbar
  bottomNav:      { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, paddingBottom: 4 },
  bottomNavItem:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 2 },
  bottomNavLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
});
