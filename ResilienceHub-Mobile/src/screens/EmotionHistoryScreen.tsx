import React, { useState, useMemo } from 'react';
import { COLORS } from '../styles/theme';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle, Text as SvgText, Line, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useEmotions } from '../hooks/queries/useEmotions';
import { useThoughts } from '../hooks/queries/useThoughts';
import { useJournal } from '../hooks/queries/useJournal';
import { useGoals } from '../hooks/queries/useGoals';
import { useReframePractices } from '../hooks/queries/useReframe';

const { width } = Dimensions.get('window');

interface EmotionHistoryScreenProps {
  navigation: any;
}

export default function EmotionHistoryScreen({ navigation }: EmotionHistoryScreenProps) {
  const { userId } = useAuth();
  const emotionsQ = useEmotions(userId);
  const thoughtsQ = useThoughts(userId);
  const journalsQ = useJournal(userId);
  const goalsQ = useGoals(userId);
  const reframeQ = useReframePractices(userId);

  const emotions = emotionsQ.data ?? [];
  const thoughts = thoughtsQ.data ?? [];
  const journals = journalsQ.data ?? [];
  const goals = goalsQ.data ?? [];
  const reframeResults = reframeQ.data ?? [];

  const loading =
    !userId ||
    emotionsQ.isLoading || thoughtsQ.isLoading || journalsQ.isLoading || goalsQ.isLoading || reframeQ.isLoading;
  const refreshing =
    emotionsQ.isRefetching || thoughtsQ.isRefetching || journalsQ.isRefetching ||
    goalsQ.isRefetching || reframeQ.isRefetching;

  const onRefresh = () => {
    emotionsQ.refetch();
    thoughtsQ.refetch();
    journalsQ.refetch();
    goalsQ.refetch();
    reframeQ.refetch();
  };

  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [searchQuery, setSearchQuery] = useState('');

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  };

  // CBT Analytics Calculations
  const stats = useMemo(() => {
    const filterByTime = (data: any[], dateField: string = 'createdAt') => {
      if (timeRange === 'all') return data;
      const now = new Date();
      const limitDays = timeRange === 'week' ? 7 : 30;
      const threshold = new Date(now.getTime() - limitDays * 24 * 60 * 60 * 1000);
      return data.filter(item => {
        const itemDate = new Date(item[dateField] || item.timestamp || item.createdAt);
        return itemDate >= threshold;
      });
    };

    const filteredEmotions = filterByTime(emotions, 'timestamp');
    const filteredThoughts = filterByTime(thoughts);
    const filteredJournals = filterByTime(journals);
    const filteredGoals = filterByTime(goals);
    const filteredReframe = filterByTime(reframeResults);

    // Total activity count
    const totalActivities = filteredEmotions.length + filteredThoughts.length + 
                            filteredJournals.length + filteredGoals.length + 
                            filteredReframe.length;

    // Milestone percentage based on 50 activities limit
    const milestonePct = Math.min(100, Math.round((totalActivities / 50) * 100));

    // Emotional Balance (Separating Positive vs Negative Affect intensities)
    const POSITIVE_EMOTIONS = ["Joy", "Love"];
    const NEGATIVE_EMOTIONS = ["Sadness", "Fear", "Anger", "Disgust"];

    const calcBalance = () => {
      if (filteredEmotions.length === 0) {
        return {
          negativeIntensity: { current: 0, previous: 0, changePercent: 0 },
          positiveIntensity: { current: 0, previous: 0, changePercent: 0 },
        };
      }

      // Split current period in half to show change
      const midpoint = new Date();
      const limitDays = timeRange === 'week' ? 7 : 30;
      midpoint.setDate(midpoint.getDate() - (limitDays / 2));

      const recentEmotions = filteredEmotions.filter(e => 
        new Date(e.timestamp || e.createdAt) >= midpoint
      );
      const previousEmotions = filteredEmotions.filter(e => 
        new Date(e.timestamp || e.createdAt) < midpoint
      );

      const calcAvgIntensity = (emos: any[], type: "negative" | "positive") => {
        const list = type === "negative" ? NEGATIVE_EMOTIONS : POSITIVE_EMOTIONS;
        const filtered = emos.filter(e => list.includes(e.coreEmotion));
        if (filtered.length === 0) return 0;
        return filtered.reduce((sum, e) => sum + e.intensity, 0) / filtered.length;
      };

      const currentNegative = calcAvgIntensity(recentEmotions, "negative");
      const previousNegative = calcAvgIntensity(previousEmotions, "negative");
      const negativeChange = currentNegative - previousNegative;
      const negativeChangePercent = previousNegative > 0 
        ? Math.round((negativeChange / previousNegative) * 100) 
        : 0;

      const currentPositive = calcAvgIntensity(recentEmotions, "positive");
      const previousPositive = calcAvgIntensity(previousEmotions, "positive");
      const positiveChange = currentPositive - previousPositive;
      const positiveChangePercent = previousPositive > 0 
        ? Math.round((positiveChange / previousPositive) * 100) 
        : 0;

      return {
        negativeIntensity: {
          current: Math.round(currentNegative * 10) / 10,
          previous: Math.round(previousNegative * 10) / 10,
          changePercent: negativeChangePercent,
        },
        positiveIntensity: {
          current: Math.round(currentPositive * 10) / 10,
          previous: Math.round(previousPositive * 10) / 10,
          changePercent: positiveChangePercent,
        },
      };
    };

    // Cognitive Restructuring Challenge Rate
    const calculateChallengeRate = () => {
      if (filteredThoughts.length === 0) {
        return { rate: 0, challenged: 0, total: 0 };
      }
      const challenged = filteredThoughts.filter(t => 
        t.evidenceFor || t.evidenceAgainst || t.alternativePerspective
      ).length;
      const rate = Math.round((challenged / filteredThoughts.length) * 100);
      return { rate, challenged, total: filteredThoughts.length };
    };

    // Goal Progress
    const calculateGoalProgress = () => {
      if (filteredGoals.length === 0) {
        return { completionRate: 0, completed: 0, total: 0 };
      }
      const completed = filteredGoals.filter(g => g.status === 'completed' || g.status === 'approved').length;
      const rate = Math.round((completed / filteredGoals.length) * 100);
      return { completionRate: rate, completed, total: filteredGoals.length };
    };

    // Unified timeline construction for the history feed
    const buildTimeline = () => {
      const items: any[] = [];

      filteredEmotions.forEach(e => {
        items.push({
          id: `emotion-${e.id}`,
          type: "emotion",
          date: new Date(e.timestamp || e.createdAt),
          title: `Logged mood: ${e.coreEmotion}`,
          subtitle: e.situation || '',
          icon: "heart",
          iconFamily: "Feather",
          color: "#3B82F6",
          bgLight: "#EFF6FF",
          detail: `Intensity: ${e.intensity}/10`,
        });
      });

      filteredThoughts.forEach(t => {
        items.push({
          id: `thought-${t.id}`,
          type: "thought",
          date: new Date(t.createdAt),
          title: "Recorded thought record",
          subtitle: t.situation || '',
          icon: "brain",
          iconFamily: "MaterialCommunityIcons",
          color: "#9333EA",
          bgLight: "#ecfdf5",
          detail: t.cognitiveDistortions && t.cognitiveDistortions.length > 0
            ? `Distortions: ${t.cognitiveDistortions.join(', ')}`
            : '',
        });
      });

      filteredJournals.forEach(j => {
        items.push({
          id: `journal-${j.id}`,
          type: "journal",
          date: new Date(j.createdAt),
          title: j.title || 'Journal entry reflection',
          subtitle: j.content || '',
          icon: "book-open",
          iconFamily: "Feather",
          color: "#F59E0B",
          bgLight: "#FFFBEB",
          detail: j.userSelectedTags && j.userSelectedTags.length > 0
            ? `Tags: ${j.userSelectedTags.join(', ')}`
            : '',
        });
      });

      filteredGoals.forEach(g => {
        items.push({
          id: `goal-${g.id}`,
          type: "goal",
          date: new Date(g.createdAt),
          title: `Created Goal: ${g.title}`,
          subtitle: g.description || '',
          icon: "target",
          iconFamily: "Feather",
          color: "#6366F1",
          bgLight: "#EEF2FF",
          detail: `Status: ${g.status || 'pending'}`,
        });
      });

      filteredReframe.forEach(r => {
        items.push({
          id: `reframe-${r.id}`,
          type: "reframe",
          date: new Date(r.createdAt),
          title: `Practiced reframing`,
          subtitle: r.scenarioText || r.reframeText || '',
          icon: "lightbulb-on",
          iconFamily: "MaterialCommunityIcons",
          color: "#16A34A",
          bgLight: "#ECFDF5",
          detail: `Score: ${r.score || 0} pts`,
        });
      });

      return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 30);
    };

    // Distortion trap detection
    const distortionCounts: Record<string, number> = {};
    filteredThoughts.forEach(thought => {
      if (thought.cognitiveDistortions && Array.isArray(thought.cognitiveDistortions)) {
        thought.cognitiveDistortions.forEach((d: string) => {
          distortionCounts[d] = (distortionCounts[d] || 0) + 1;
        });
      }
    });

    const distortionEntries = Object.entries(distortionCounts);
    let topDistortion = null;
    if (distortionEntries.length > 0) {
      const sorted = distortionEntries.sort((a, b) => b[1] - a[1]);
      const [name, count] = sorted[0];
      const percentage = filteredThoughts.length > 0 ? Math.round((count / filteredThoughts.length) * 100) : 0;
      const formattedName = name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      topDistortion = { name: formattedName, count, percentage, key: name };
    }

    return {
      filteredEmotions,
      totalActivities,
      milestonePct,
      emotionalBalance: calcBalance(),
      thoughtChallengeRate: calculateChallengeRate(),
      goalProgress: calculateGoalProgress(),
      timeline: buildTimeline(),
      topDistortion,
    };
  }, [emotions, thoughts, journals, goals, reframeResults, timeRange]);

  // SVG Bezier graph calculations (last 7 emotions logs)
  const trendData = useMemo(() => {
    const sorted = [...stats.filteredEmotions].sort((a, b) => {
      const dateA = new Date(a.timestamp || a.createdAt).getTime();
      const dateB = new Date(b.timestamp || b.createdAt).getTime();
      return dateA - dateB;
    });
    return sorted.slice(-7);
  }, [stats.filteredEmotions]);

  // Unified Chronological Search Filter
  const filteredTimelineHistory = useMemo(() => {
    if (!searchQuery) return stats.timeline;
    return stats.timeline.filter(item => {
      const query = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(query) || 
             item.subtitle.toLowerCase().includes(query) ||
             item.detail.toLowerCase().includes(query);
    });
  }, [stats.timeline, searchQuery]);

  const renderTrendChart = () => {
    if (trendData.length === 0) {
      return (
        <View style={styles.chartEmptyBlock}>
          <Feather name="trending-up" size={24} color="#94A3B8" />
          <Text style={styles.chartEmptyText}>Not enough check-in data to plot trends</Text>
          <Text style={styles.chartEmptySub}>Complete emotion logs to activate charts</Text>
        </View>
      );
    }

    const chartWidth = width - 64;
    const chartHeight = 160;
    const paddingLeft = 30;
    const paddingRight = 15;
    const startY = 125;
    const endY = 25;
    const usableWidth = chartWidth - paddingLeft - paddingRight;
    const usableHeight = startY - endY;

    const points: { x: number; y: number; intensity: number; emoji: string }[] = [];
    const coreEmojis: Record<string, string> = {
      "Joy": "😊",
      "Sadness": "😢",
      "Fear": "😰",
      "Anger": "😠",
      "Surprise": "😲",
      "Love": "😍",
    };

    trendData.forEach((e, idx) => {
      const x = paddingLeft + (idx / Math.max(trendData.length - 1, 1)) * usableWidth;
      const y = startY - ((e.intensity - 1) / 9) * usableHeight;
      const emoji = e.coreEmotion ? (coreEmojis[e.coreEmotion] || "😐") : "😐";
      points.push({ x, y, intensity: e.intensity, emoji });
    });

    let pathD = '';
    let fillD = '';
    
    if (points.length > 1) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpX1 = prev.x + (curr.x - prev.x) / 2;
        const cpY1 = prev.y;
        const cpX2 = prev.x + (curr.x - prev.x) / 2;
        const cpY2 = curr.y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
      }
      fillD = `${pathD} L ${points[points.length - 1].x} ${startY + 15} L ${points[0].x} ${startY + 15} Z`;
    }

    const horizontalGridVals = [2, 5, 8, 10];

    return (
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={COLORS.primaryGreen} stopOpacity="0.25" />
              <Stop offset="100%" stopColor={COLORS.primaryGreen} stopOpacity="0.00" />
            </LinearGradient>
          </Defs>

          {horizontalGridVals.map(val => {
            const y = startY - ((val - 1) / 9) * usableHeight;
            return (
              <G key={`grid-${val}`}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <SvgText
                  x={12}
                  y={y + 4}
                  fill="#94A3B8"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {val}
                </SvgText>
              </G>
            );
          })}

          {points.length > 1 && fillD && (
            <Path d={fillD} fill="url(#chartGlow)" />
          )}

          {points.length > 1 && pathD && (
            <Path d={pathD} fill="none" stroke={COLORS.primaryGreen} strokeWidth="3" />
          )}

          {points.length === 1 && (
            <Circle cx={points[0].x} cy={points[0].y} r="6" fill={COLORS.primaryGreen} />
          )}

          {points.map((pt, idx) => (
            <G key={`pt-${idx}`}>
              <Circle
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill="#FFFFFF"
                stroke={COLORS.primaryGreen}
                strokeWidth="2.5"
              />
              <SvgText
                x={pt.x}
                y={pt.y - 12}
                fill="#4C1D95"
                fontSize="9"
                fontWeight="800"
                textAnchor="middle"
              >
                {pt.intensity}
              </SvgText>
              <SvgText
                x={pt.x}
                y={startY + 15}
                fontSize="12"
                textAnchor="middle"
              >
                {pt.emoji}
              </SvgText>
              <SvgText
                x={pt.x}
                y={startY + 27}
                fill="#94A3B8"
                fontSize="7"
                fontWeight="700"
                textAnchor="middle"
              >
                {formatShortDate(new Date(trendData[idx].timestamp || trendData[idx].createdAt))}
              </SvgText>
            </G>
          ))}
        </Svg>
      </View>
    );
  };

  const renderThinkingTrapDescription = (trapKey: string) => {
    const key = trapKey.toLowerCase();
    if (key.includes('catastroph')) {
      return "Expecting the worst possible outcome. Challenge this by examining the actual probability of the threat.";
    } else if (key.includes('nothing') || key.includes('black')) {
      return "Seeing situations in extreme black-and-white. Reframe by searching for partial success or middle grounds.";
    } else if (key.includes('reasoning')) {
      return "Confusing emotion with evidence. Remember that feelings are reactions, not facts.";
    } else if (key.includes('reading')) {
      return "Assuming you know others' negative motives without confirmation. Look for other viable explanations.";
    } else if (key.includes('overgeneral')) {
      return "Believing a single defeat represents a permanent pattern. View this event as an isolated incident.";
    } else if (key.includes('should')) {
      return "Enforcing strict internal rules about how things 'should' be. Try replacing 'should' with 'I prefer'.";
    } else if (key.includes('filter')) {
      return "Filtering out positive facts and dwelling solely on negative details. Force yourself to list positive elements.";
    } else if (key.includes('personal')) {
      return "Blaming yourself for events out of your control. Recognize external factors that played a role.";
    }
    return "An unhelpful habit of thinking. Try challenging the automatic thoughts with fact-based evidence.";
  };

  const renderTrendIndicator = (val: number, inverse = false) => {
    if (val === 0) return null;
    const isPositiveChange = inverse ? val < 0 : val > 0;
    const badgeColor = isPositiveChange ? COLORS.mediumGreen : '#EF4444';
    const bgLight = isPositiveChange ? '#ECFDF5' : '#FEF2F2';
    const iconName = val > 0 ? 'trending-up' : 'trending-down';

    return (
      <View style={[styles.trendBadge, { backgroundColor: bgLight, borderColor: `${badgeColor}30` }]}>
        <Feather name={iconName} size={9} color={badgeColor} style={{ marginRight: 2 }} />
        <Text style={[styles.trendBadgeText, { color: badgeColor }]}>{Math.abs(val)}%</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
        <Text style={styles.loadingText}>Opening Clinical Logs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Segmented Control Header */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'stats' && styles.activeTabButton]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('stats')}
          >
            <Feather 
              name="pie-chart" 
              size={14} 
              color={activeTab === 'stats' ? COLORS.darkGreen : '#64748B'} 
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>Progress Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'history' && styles.activeTabButton]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('history')}
          >
            <Feather 
              name="clock" 
              size={14} 
              color={activeTab === 'history' ? COLORS.darkGreen : '#64748B'} 
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Activity History</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primaryGreen]} />
        }
      >
        {activeTab === 'stats' ? (
          // --- STATS OVERVIEW TAB ---
          <View style={styles.tabContent}>
            {/* Time Filter Pill Row */}
            <View style={styles.filterRow}>
              {(['week', 'month', 'all'] as const).map(range => (
                <TouchableOpacity
                  key={range}
                  style={[styles.filterPill, timeRange === range && styles.activeFilterPill]}
                  onPress={() => setTimeRange(range)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterPillText, timeRange === range && styles.activeFilterPillText]}>
                    {range === 'week' ? 'Past Week' : range === 'month' ? 'Past Month' : 'All Time'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Visual Progress Milestone Header */}
            <View style={styles.milestoneCard}>
              <View style={styles.milestoneHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="trending-up" size={14} color={COLORS.primaryGreen} />
                  <Text style={styles.milestoneLabel}>CBT PROGRESS</Text>
                </View>
                <Text style={styles.milestonePercentageText}>{stats.milestonePct}% of first milestone</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${stats.milestonePct}%` }]} />
              </View>
              <Text style={styles.milestoneDetailText}>
                {stats.totalActivities} activities logged across all CBT modules — your data-driven path to wellbeing.
              </Text>
            </View>

            {/* CBTProgressSnapshot KPI Grid */}
            <View style={styles.grid}>
              {/* Card 1: Engagement Level */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiCardTitle}>ENGAGEMENT LEVEL</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#ecfdf5' }]}>
                    <Feather name="activity" size={14} color={COLORS.primaryGreen} />
                  </View>
                </View>
                <Text style={styles.kpiCardValue}>{stats.totalActivities}</Text>
                <Text style={styles.kpiCardDesc}>total activities completed</Text>
                <View style={styles.kpiCardFooter}>
                  <View style={styles.kpiFooterTextRow}>
                    <Text style={styles.kpiFooterLabel}>Behavioral Activation</Text>
                    <Text style={[styles.kpiFooterValue, { color: COLORS.primaryGreen }]}>Active</Text>
                  </View>
                  <View style={styles.kpiMiniProgressBarBg}>
                    <View style={[styles.kpiMiniProgressBarFill, { width: `${Math.min((stats.totalActivities / 20) * 100, 100)}%`, backgroundColor: COLORS.primaryGreen }]} />
                  </View>
                </View>
              </View>

              {/* Card 2: Emotional Balance */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiCardTitle}>EMOTIONAL BALANCE</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#FEF2F2' }]}>
                    <Feather name="heart" size={14} color="#EF4444" />
                  </View>
                </View>
                
                <View style={styles.balanceGrid}>
                  <View style={styles.balanceCol}>
                    <View style={styles.balanceColHeader}>
                      <Text style={styles.balanceLabel}>NEGATIVE</Text>
                      {renderTrendIndicator(stats.emotionalBalance.negativeIntensity.changePercent, true)}
                    </View>
                    <Text style={[styles.balanceValue, { color: '#EF4444' }]}>
                      {stats.emotionalBalance.negativeIntensity.current > 0 
                        ? stats.emotionalBalance.negativeIntensity.current.toFixed(1) 
                        : '—'}
                    </Text>
                  </View>

                  <View style={styles.balanceCol}>
                    <View style={styles.balanceColHeader}>
                      <Text style={styles.balanceLabel}>POSITIVE</Text>
                      {renderTrendIndicator(stats.emotionalBalance.positiveIntensity.changePercent, false)}
                    </View>
                    <Text style={[styles.balanceValue, { color: COLORS.mediumGreen }]}>
                      {stats.emotionalBalance.positiveIntensity.current > 0 
                        ? stats.emotionalBalance.positiveIntensity.current.toFixed(1) 
                        : '—'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.kpiCardFooter, { marginTop: 10 }]}>
                  <View style={styles.kpiFooterTextRow}>
                    <Text style={styles.kpiFooterLabel}>Affect Intensity</Text>
                    <Text style={[styles.kpiFooterValue, { color: '#64748B' }]}>1-10 Scale</Text>
                  </View>
                </View>
              </View>

              {/* Card 3: Cognitive Restructuring */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiCardTitle}>RESTRUCTURING</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#EFF6FF' }]}>
                    <MaterialCommunityIcons name="brain" size={14} color="#3B82F6" />
                  </View>
                </View>
                <Text style={styles.kpiCardValue}>{stats.thoughtChallengeRate.rate}%</Text>
                <Text style={styles.kpiCardDesc}>examined with evidence</Text>
                <View style={styles.kpiCardFooter}>
                  <View style={styles.kpiFooterTextRow}>
                    <Text style={styles.kpiFooterLabel}>Challenged Thoughts</Text>
                    <Text style={styles.kpiFooterValue}>{stats.thoughtChallengeRate.challenged}/{stats.thoughtChallengeRate.total}</Text>
                  </View>
                  <View style={styles.kpiMiniProgressBarBg}>
                    <View style={[styles.kpiMiniProgressBarFill, { width: `${stats.thoughtChallengeRate.rate}%`, backgroundColor: '#3B82F6' }]} />
                  </View>
                </View>
              </View>

              {/* Card 4: Goal Progress */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiCardTitle}>GOAL PROGRESS</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#FFFBEB' }]}>
                    <Feather name="target" size={14} color="#F59E0B" />
                  </View>
                </View>
                <Text style={styles.kpiCardValue}>{stats.goalProgress.completionRate}%</Text>
                <Text style={styles.kpiCardDesc}>goal completion rate</Text>
                <View style={styles.kpiCardFooter}>
                  <View style={styles.kpiFooterTextRow}>
                    <Text style={styles.kpiFooterLabel}>Completed Goals</Text>
                    <Text style={styles.kpiFooterValue}>{stats.goalProgress.completed}/{stats.goalProgress.total}</Text>
                  </View>
                  <View style={styles.kpiMiniProgressBarBg}>
                    <View style={[styles.kpiMiniProgressBarFill, { width: `${stats.goalProgress.completionRate}%`, backgroundColor: '#F59E0B' }]} />
                  </View>
                </View>
              </View>
            </View>

            {/* Trend Chart Title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Emotional Patterns Over Time</Text>
              <Text style={styles.sectionSubtitle}>Track your mood trends and intensity patterns (last 7 logs)</Text>
            </View>

            {/* Render chart */}
            {renderTrendChart()}

            {/* Primary Trap Distortion Card */}
            {stats.topDistortion ? (
              <View style={styles.distortionCard}>
                <View style={styles.distortionHeader}>
                  <View style={styles.distortionBadge}>
                    <Text style={styles.distortionBadgeText}>⚡ Primary Trap</Text>
                  </View>
                  <Text style={styles.distortionStats}>
                    {stats.topDistortion.count} records ({stats.topDistortion.percentage}%)
                  </Text>
                </View>
                <Text style={styles.distortionTitle}>{stats.topDistortion.name}</Text>
                <Text style={styles.distortionDesc}>
                  {renderThinkingTrapDescription(stats.topDistortion.key)}
                </Text>
              </View>
            ) : (
              <View style={styles.distortionEmptyCard}>
                <View style={styles.distortionEmptyIcon}>
                  <Feather name="shield" size={20} color={COLORS.primaryGreen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.distortionEmptyTitle}>Build CBT Skills</Text>
                  <Text style={styles.distortionEmptyText}>
                    Use the thought record tool to analyze cognitive distortions and track automatic thinking habits.
                  </Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          // --- CHRONOLOGICAL TIMELINE HISTORY TAB ---
          <View style={styles.tabContent}>
            {/* Search Box */}
            <View style={styles.searchSection}>
              <View style={styles.searchBox}>
                <Feather name="search" size={16} color="#64748B" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search timeline events..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                    <Feather name="x" size={16} color="#64748B" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {filteredTimelineHistory.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Feather name="list" size={28} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>No Activities Found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'Try adjusting your search queries.' : 'Begin tracking emotions, thoughts, or goals to build your timeline.'}
                </Text>
              </View>
            ) : (
              <View style={styles.timelineList}>
                {filteredTimelineHistory.map((item: any, idx: number) => {
                  return (
                    <View key={item.id} style={styles.timelineItemWrap}>
                      {/* Left timeline connector column */}
                      <View style={styles.timelineConnectorCol}>
                        <View style={[styles.timelineNode, { backgroundColor: item.color }]}>
                          {item.iconFamily === 'MaterialCommunityIcons' ? (
                            <MaterialCommunityIcons name={item.icon as any} size={11} color="#FFFFFF" />
                          ) : (
                            <Feather name={item.icon as any} size={11} color="#FFFFFF" />
                          )}
                        </View>
                        {idx < filteredTimelineHistory.length - 1 && (
                          <View style={styles.timelineLine} />
                        )}
                      </View>

                      {/* Right content card */}
                      <View style={[styles.timelineCard, { borderLeftColor: item.color }]}>
                        <View style={styles.timelineCardHeader}>
                          <Text style={styles.timelineItemTitle}>{item.title}</Text>
                          <Text style={styles.timelineItemDate}>
                            {formatShortDate(item.date)}
                          </Text>
                        </View>

                        {item.subtitle ? (
                          <Text style={styles.timelineItemSubtitle} numberOfLines={2}>
                            {item.subtitle}
                          </Text>
                        ) : null}

                        {item.detail ? (
                          <View style={[styles.timelineDetailBadge, { backgroundColor: item.bgLight }]}>
                            <Text style={[styles.timelineDetailBadgeText, { color: item.color }]}>
                              {item.detail}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Check-in Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('EmotionTracking')}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.floatingButtonText}>Track Mood</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: 'bold',
  },

  // Segmented Pill tab styling
  tabBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    height: 44,
    width: '100%',
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748B',
  },
  activeTabText: {
    color: COLORS.darkGreen,
  },

  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Stats - Time filters pill row
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  activeFilterPill: {
    backgroundColor: COLORS.darkGreen,
    borderColor: COLORS.darkGreen,
  },
  filterPillText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#64748B',
  },
  activeFilterPillText: {
    color: '#FFFFFF',
  },

  // Milestone Progress Card
  milestoneCard: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  milestoneHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(196,181,253,0.8)',
    letterSpacing: 1.5,
  },
  milestonePercentageText: {
    fontSize: 11,
    color: 'rgba(196,181,253,0.6)',
    fontWeight: '600',
  },
  progressBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primaryGreen, // Purple fill
    borderRadius: 3,
  },
  milestoneDetailText: {
    fontSize: 10.5,
    color: 'rgba(196,181,253,0.5)',
    lineHeight: 14,
  },

  // KPI Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 14,
    width: (width - 32 - 10) / 2, // half width grid
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
    justifyContent: 'space-between',
  },
  kpiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiCardTitle: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  kpiIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiCardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.darkGreen,
    marginBottom: 2,
  },
  kpiCardDesc: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 10,
  },
  kpiCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  kpiFooterTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kpiFooterLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  kpiFooterValue: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  kpiMiniProgressBarBg: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  kpiMiniProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Balance Grid inside emotional balance card
  balanceGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  balanceCol: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  balanceColHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#94A3B8',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  trendBadgeText: {
    fontSize: 7,
    fontWeight: '800',
  },

  // Section headers
  sectionHeader: {
    marginTop: 12,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.darkGreen,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },

  // SVG Chart Layout
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  chartEmptyBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  chartEmptyText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 8,
  },
  chartEmptySub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Distortion Card
  distortionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 16,
  },
  distortionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  distortionBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  distortionBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.primaryGreen,
  },
  distortionStats: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  distortionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.darkGreen,
    marginBottom: 6,
  },
  distortionDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  distortionEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  distortionEmptyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  distortionEmptyTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  distortionEmptyText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },

  // History tab - Search Box
  searchSection: {
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },

  // Unified timeline list styles
  timelineList: {
    paddingBottom: 60,
  },
  timelineItemWrap: {
    flexDirection: 'row',
  },
  timelineConnectorCol: {
    width: 30,
    alignItems: 'center',
  },
  timelineNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 2.5,
    borderColor: '#F8FAFC',
    marginTop: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: -4,
    zIndex: 1,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderLeftWidth: 4,
    padding: 12,
    marginLeft: 6,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  timelineItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.darkGreen,
    flex: 1,
    marginRight: 8,
  },
  timelineItemDate: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  timelineItemSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 6,
  },
  timelineDetailBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timelineDetailBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },

  emptyContainer: {
    paddingVertical: 56,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 17,
  },

  // Floating button
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.darkGreen,
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});