import React, { useMemo } from 'react';
import { COLORS } from '../styles/theme';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCurrentUser } from '../hooks/queries/useProfile';
import { useEmotions } from '../hooks/queries/useEmotions';
import { useThoughts } from '../hooks/queries/useThoughts';
import { useJournal } from '../hooks/queries/useJournal';
import { useGoals } from '../hooks/queries/useGoals';
import { useReframePractices } from '../hooks/queries/useReframe';

interface DashboardScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { userId } = useAuth();
  const userQ = useCurrentUser();
  const emotionsQ = useEmotions(userId);
  const thoughtsQ = useThoughts(userId);
  const journalQ = useJournal(userId);
  const goalsQ = useGoals(userId);
  const reframeQ = useReframePractices(userId);

  const user = userQ.data;
  const loading =
    !userId ||
    userQ.isLoading || emotionsQ.isLoading || thoughtsQ.isLoading ||
    journalQ.isLoading || goalsQ.isLoading || reframeQ.isLoading;

  const stats = useMemo(() => {
          const emotions = emotionsQ.data || [];
          const thoughts = thoughtsQ.data || [];
          const journalEntries = journalQ.data || [];
          const goals = goalsQ.data || [];
          const reframePractices = reframeQ.data || [];

          // Mood calculation
          const emotionCounts = emotions.reduce((acc: any, e: any) => {
            const mood = e.coreEmotion || e.primaryEmotion || e.emotion || 'Unknown';
            acc[mood] = (acc[mood] || 0) + 1;
            return acc;
          }, {});
          const sortedEmotions = Object.entries(emotionCounts).sort((a: any, b: any) => b[1] - a[1]);
          const mostCommon = sortedEmotions.length > 0 ? sortedEmotions[0][0] : 'None';
          const avgIntensity = emotions.length > 0
            ? Math.round(emotions.reduce((sum: number, e: any) => sum + (e.intensity || 0), 0) / emotions.length)
            : 0;

          // ANT pattern calculation
          const thoughtCategoryLabels: Record<string, string> = {
            all_or_nothing: "All or Nothing",
            mental_filter: "Mental Filter",
            mind_reading: "Mind Reading",
            fortune_telling: "Fortune Telling",
            labelling: "Labelling",
            magnification: "Magnification",
            catastrophizing: "Catastrophizing",
            emotional_reasoning: "Emotional Reasoning",
            should_statements: "Should Statements",
            personalization: "Personalization",
            overgeneralization: "Overgeneralization",
            disqualifying_positive: "Disqualifying Positive",
          };
          const challengedThoughts = thoughts.filter((t: any) => t.evidenceFor || t.evidenceAgainst || t.alternativePerspective);
          const antCounts = thoughts.reduce((acc: any, thought: any) => {
            if (thought.thoughtCategory) {
              const categories = Array.isArray(thought.thoughtCategory)
                ? thought.thoughtCategory
                : typeof thought.thoughtCategory === 'string'
                  ? [thought.thoughtCategory]
                  : [];
              categories.forEach((category: string) => {
                const label = thoughtCategoryLabels[category] || category;
                acc[label] = (acc[label] || 0) + 1;
              });
            }
            return acc;
          }, {});
          const sortedANTs = Object.entries(antCounts).sort((a: any, b: any) => b[1] - a[1]);
          const topANT = sortedANTs.length > 0 ? sortedANTs[0][0] : 'None';

          const journalStats = {
            total: journalEntries.length,
            emotionsDetected: journalEntries.reduce((sum: number, entry: any) => {
              const tagCount = entry.userSelectedTags ? entry.userSelectedTags.length : 0;
              return sum + (tagCount > 0 ? 1 : 0);
            }, 0),
          };

          const completedGoals = goals.filter((g: any) => g.status === 'completed');
          const goalsStats = {
            total: goals.length,
            completed: completedGoals.length,
            completedPercentage: goals.length > 0
              ? Math.round((completedGoals.length / goals.length) * 100)
              : 0
          };

          const scores = reframePractices.filter((p: any) => p.score).map((p: any) => p.score);
          const reframeStats = {
            totalPractices: reframePractices.length,
            averageScore: scores.length > 0
              ? Math.round(scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length)
              : 0
          };

          return {
            emotions: { total: emotions.length, averageIntensity: avgIntensity, mostCommon },
            thoughts: { total: thoughts.length, challengedPercentage: thoughts.length > 0 ? Math.round((challengedThoughts.length / thoughts.length) * 100) : 0, topANT },
            journal: journalStats,
            goals: goalsStats,
            reframe: reframeStats,
          };
  }, [emotionsQ.data, thoughtsQ.data, journalQ.data, goalsQ.data, reframeQ.data]);

  const totalActivities =
    stats.emotions.total +
    stats.thoughts.total +
    stats.journal.total +
    stats.goals.total +
    stats.reframe.totalPractices;

  const engagementScore = Math.min(100, Math.round((totalActivities / 50) * 100));

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.name ? user.name.split(' ')[0] : 'there';
  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || 'RH';

  const motivationalLines = [
    "Every small step forward is progress worth celebrating.",
    "Your mental wellness journey is uniquely yours.",
    "Today is a new opportunity to understand yourself better.",
    "Consistency is the foundation of lasting change.",
    "Awareness is the first step to transformation.",
    "You have the strength to face what comes.",
  ];
  const motivationalLine = motivationalLines[new Date().getDay() % motivationalLines.length];

  // Today's Focus Action Steps
  const todayFocus = [
    { label: 'Track Emotion', screen: 'EmotionTracking', done: stats.emotions.total > 0, color: '#EF4444', icon: 'heart' },
    { label: 'Record Thought', screen: 'ThoughtRecord', done: stats.thoughts.total > 0, color: COLORS.primaryGreen, icon: 'brain' },
    { label: 'Reframe Coach', screen: 'ReframeCoach', done: stats.reframe.totalPractices > 0, color: COLORS.mediumGreen, icon: 'zap' },
    { label: 'Write Journal', screen: 'Journal', done: stats.journal.total > 0, color: '#F59E0B', icon: 'book-open' },
    { label: 'Set a Goal', screen: 'Goals', done: stats.goals.total > 0, color: '#6366F1', icon: 'target' },
  ];

  const completedSteps = todayFocus.filter(f => f.done).length;

  const handleActionPress = (screenName: string) => {
    navigation.navigate(screenName);
  };

  const clientModules = [
    {
      label: 'Emotion Tracker',
      screen: 'EmotionTracking',
      stat: `${stats.emotions.total} logs`,
      insight: stats.emotions.mostCommon !== 'None' ? `${stats.emotions.mostCommon}` : 'No pattern',
      iconColor: '#EF4444',
      bg: '#FEF2F2',
      border: '#FEE2E2',
      icon: 'heart',
      isFeather: true
    },
    {
      label: 'Thought Records',
      screen: 'ThoughtRecord',
      stat: `${stats.thoughts.total} logs`,
      insight: stats.thoughts.topANT !== 'None' ? `${stats.thoughts.topANT}` : 'No pattern',
      iconColor: COLORS.primaryGreen,
      bg: '#ecfdf5',
      border: '#d1fae5',
      icon: 'brain',
      isFeather: false
    },
    {
      label: 'Reframe Coach',
      screen: 'ReframeCoach',
      stat: `${stats.reframe.totalPractices} sessions`,
      insight: stats.reframe.averageScore > 0 ? `Avg: ${stats.reframe.averageScore}` : 'Start session',
      iconColor: COLORS.mediumGreen,
      bg: '#ECFDF5',
      border: '#D1FAE5',
      icon: 'zap',
      isFeather: true
    },
    {
      label: 'Journal Entry',
      screen: 'Journal',
      stat: `${stats.journal.total} entries`,
      insight: stats.journal.emotionsDetected > 0 ? `${stats.journal.emotionsDetected} emotions` : 'Process day',
      iconColor: '#F59E0B',
      bg: '#FFFBEB',
      border: '#FEF3C7',
      icon: 'book-open',
      isFeather: true
    },
    {
      label: 'SMART Goals',
      screen: 'Goals',
      stat: `${stats.goals.total} goals`,
      insight: stats.goals.total > 0 ? `${stats.goals.completedPercentage}% done` : 'Set milestone',
      iconColor: '#6366F1',
      bg: '#EEF2FF',
      border: '#E0E7FF',
      icon: 'target',
      isFeather: true
    },
    {
      label: 'CBT Library',
      screen: 'ResourceLibrary',
      stat: 'Guides & Tools',
      insight: 'Explore CBT',
      iconColor: '#0D9488',
      bg: '#F0FDFA',
      border: '#CCFBF1',
      icon: 'book',
      isFeather: true
    }
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
        <Text style={styles.loadingText}>Loading your space...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Sleek Mobile Hero Header */}
        <View style={styles.heroBanner}>
          <View style={styles.heroHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroGreeting}>{timeGreeting},</Text>
              <Text style={styles.heroName}>{displayName}</Text>
            </View>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>{userInitials}</Text>
            </View>
          </View>

          <Text style={styles.heroQuote}>"{motivationalLine}"</Text>

          {/* Simple Mobile Progress Bar */}
          <View style={styles.milestoneCard}>
            <View style={styles.milestoneMeta}>
              <View style={styles.milestoneTitleContainer}>
                <MaterialCommunityIcons name="fire" size={16} color="#F97316" />
                <Text style={styles.milestoneTitle}>Resilience Milestone</Text>
              </View>
              <Text style={styles.milestoneScore}>{totalActivities} activities</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressIndicator, { width: `${engagementScore}%` }]} />
            </View>
            <Text style={styles.milestoneDescription}>
              Streak Goal: 50 activities • {engagementScore}% complete
            </Text>
          </View>
        </View>

        {/* Swipeable "Today's Focus" — Native Mobile UI Pattern */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Focus</Text>
            <Text style={styles.sectionValue}>{completedSteps}/5 Completed</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {todayFocus.map((focus, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                style={[
                  styles.focusCard,
                  { borderTopColor: focus.done ? COLORS.mediumGreen : focus.color },
                  focus.done ? styles.focusCardCompleted : styles.focusCardPending
                ]}
                onPress={() => handleActionPress(focus.screen)}
              >
                <View style={styles.focusCardHeader}>
                  <View style={[
                    styles.focusIconBox,
                    { backgroundColor: focus.done ? 'rgba(16, 185, 129, 0.1)' : `${focus.color}10` }
                  ]}>
                    {focus.icon === 'brain' ? (
                      <MaterialCommunityIcons name="brain" size={16} color={focus.done ? COLORS.mediumGreen : focus.color} />
                    ) : (
                      <Feather name={focus.icon as any} size={16} color={focus.done ? COLORS.mediumGreen : focus.color} />
                    )}
                  </View>
                  {focus.done ? (
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.mediumGreen} />
                  ) : (
                    <Feather name="arrow-right-circle" size={18} color={focus.color} />
                  )}
                </View>
                
                <Text style={styles.focusCardLabel} numberOfLines={2}>
                  {focus.label}
                </Text>
                
                <Text style={[
                  styles.focusCardStatusText,
                  focus.done ? { color: COLORS.mediumGreen } : { color: '#64748B' }
                ]}>
                  {focus.done ? 'Completed' : 'Tap to start'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 2-Column Mobile Module Grid */}
        <View style={[styles.section, { paddingBottom: 24 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your CBT Studio</Text>
          </View>
          
          <View style={styles.modulesGrid}>
            {clientModules.map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.75}
                style={[styles.gridCard, { borderLeftColor: item.iconColor }]}
                onPress={() => handleActionPress(item.screen)}
              >
                <View style={styles.gridCardHeader}>
                  <View style={[styles.gridIconBox, { backgroundColor: item.bg }]}>
                    {item.isFeather ? (
                      <Feather name={item.icon as any} size={18} color={item.iconColor} />
                    ) : (
                      <MaterialCommunityIcons name={item.icon as any} size={18} color={item.iconColor} />
                    )}
                  </View>
                  <Feather name="arrow-up-right" size={14} color="#94A3B8" />
                </View>
                
                <View style={styles.gridCardBody}>
                  <Text style={styles.gridCardTitle} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text style={styles.gridCardStat}>
                    {item.stat}
                  </Text>
                </View>
                
                <View style={[styles.gridCardFooter, { backgroundColor: `${item.iconColor}08` }]}>
                  <Text style={[styles.gridCardInsight, { color: item.iconColor }]} numberOfLines={1}>
                    {item.insight}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Highly Visual Native Banner */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.nativeBanner}
          onPress={() => navigation.navigate('EmotionHistory')}
        >
          <View style={styles.bannerLeft}>
            <View style={styles.bannerBadge}>
              <Feather name="star" size={10} color="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={styles.bannerBadgeText}>INSIGHT WEEK</Text>
            </View>
            <Text style={styles.bannerHeading}>Explore Mood Insights</Text>
            <Text style={styles.bannerParagraph}>
              See your emotional trends and identify triggers over the last 30 days.
            </Text>
          </View>
          <View style={styles.bannerRightCircle}>
            <Feather name="arrow-right" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

      </ScrollView>
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
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },

  // Mobile Hero Header
  heroBanner: {
    backgroundColor: COLORS.darkGreen,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroGreeting: {
    fontSize: 16,
    color: '#34d399',
    fontWeight: '600',
  },
  heroName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1.5,
    borderColor: '#34d399',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34d399',
  },
  heroQuote: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  milestoneCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
  },
  milestoneMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  milestoneTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  milestoneScore: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 4,
  },
  milestoneDescription: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Sections
  section: {
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  sectionValue: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  sectionLinkText: {
    fontSize: 13,
    color: COLORS.primaryGreen,
    fontWeight: '700',
  },

  // Horizontal Scroll for Today's Focus
  horizontalScroll: {
    paddingLeft: 20,
    paddingRight: 10,
    paddingBottom: 8,
  },
  focusCard: {
    width: 130,
    height: 115,
    borderRadius: 16,
    borderWidth: 1,
    borderTopWidth: 4, // Top accent colored border line
    marginRight: 12,
    padding: 12,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  focusCardPending: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  focusCardCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: COLORS.lightGreen,
  },
  focusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  focusIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusCardLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 16,
  },
  focusCardStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // 2-Column Modules Grid
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  gridCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4, // Left accent colored border line
    borderColor: '#E2E8F0',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginBottom: 12,
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  gridIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gridCardBody: {
    marginBottom: 10,
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  gridCardStat: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  gridCardFooter: {
    marginHorizontal: -16,
    marginBottom: -12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardInsight: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Native Banner
  nativeBanner: {
    backgroundColor: COLORS.darkGreen,
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flex: 1,
    marginRight: 12,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  bannerBadgeText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  bannerHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  bannerParagraph: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    lineHeight: 16,
  },
  bannerRightCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});