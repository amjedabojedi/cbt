import React, { useState, useMemo, useCallback } from 'react';
import { COLORS } from '../styles/theme';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Polyline,
  Circle,
  Line as SvgLine,
  Text as SvgText,
  Rect,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  G,
} from 'react-native-svg';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useReframePractices, useReframeProfile } from '../hooks/queries/useReframe';
import { useThoughts } from '../hooks/queries/useThoughts';

const { width } = Dimensions.get('window');

interface ReframeCoachScreenProps {
  navigation: any;
  route?: { params?: { practiceThoughtId?: number } };
}

// The Practice tab has its own internal state machine:
// browse → loading_scenarios → quiz → completed → browse
type PracticeState = 'browse' | 'loading_scenarios' | 'quiz' | 'completed';
type Tab = 'practice' | 'history' | 'insights';

export default function ReframeCoachScreen({ navigation, route }: ReframeCoachScreenProps) {
  // ── Data ──────────────────────────────────────────────────────────────────
  const { userId } = useAuth();
  const profileQ = useReframeProfile(userId);
  const practicesQ = useReframePractices(userId);
  const thoughtsQ = useThoughts(userId);
  const profile = profileQ.data ?? null;
  const practices = practicesQ.data ?? [];
  const thoughtRecords = useMemo(
    () => ((thoughtsQ.data ?? []) as any[]).filter((t: any) => t.automaticThoughts?.trim().length >= 10),
    [thoughtsQ.data]
  );
  const loading = !userId || profileQ.isLoading || practicesQ.isLoading || thoughtsQ.isLoading;
  const refreshing = profileQ.isRefetching || practicesQ.isRefetching || thoughtsQ.isRefetching;

  // ── Navigation ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('practice');
  const [practiceState, setPracticeState] = useState<PracticeState>('browse');

  // ── Practice session ──────────────────────────────────────────────────────
  const [selectedThought, setSelectedThought] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);

  // ── Quiz ──────────────────────────────────────────────────────────────────
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [userChoices, setUserChoices] = useState<{ optionIdx: number; isCorrect: boolean }[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  // ── Results ───────────────────────────────────────────────────────────────
  const [gameUpdates, setGameUpdates] = useState<any>(null);
  const [submittingResults, setSubmittingResults] = useState(false);

  // ── Insights tab ──────────────────────────────────────────────────────────
  const [insightTimeRange, setInsightTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA
  // ═══════════════════════════════════════════════════════════════════════════

  const loadData = () => {
    profileQ.refetch();
    practicesQ.refetch();
    thoughtsQ.refetch();
  };

  // Auto-start quiz when navigated from ThoughtRecordScreen
  useFocusEffect(
    useCallback(() => {
      const id = route?.params?.practiceThoughtId;
      if (!id) return;
      if (userId && thoughtRecords.length > 0 && practiceState === 'browse') {
        const target = thoughtRecords.find((t: any) => t.id === id);
        if (target) {
          setActiveTab('practice');
          startPractice(target);
        }
      }
    }, [route?.params?.practiceThoughtId, userId, thoughtRecords.length, practiceState])
  );

  const onRefresh = () => { loadData(); };

  // ═══════════════════════════════════════════════════════════════════════════
  // PRACTICE FLOW
  // ═══════════════════════════════════════════════════════════════════════════

  const startPractice = async (thought: any) => {
    setSelectedThought(thought);
    setPracticeState('loading_scenarios');

    try {
      const res = await ApiService.getReframeScenarios(userId!, thought.id);
      if (res.data?.scenarios?.length > 0) {
        setScenarios(res.data.scenarios);
        setQuestionIdx(0);
        setSelectedOptionIdx(null);
        setShowFeedback(false);
        setUserChoices([]);
        setTotalScore(0);
        setGameUpdates(null);
        setStartTime(Date.now());
        setPracticeState('quiz');
      } else {
        Alert.alert(
          'Setup Failed',
          res.error ||
            'Could not generate exercises. Make sure your thought record has cognitive distortions selected.',
          [{ text: 'OK', onPress: () => setPracticeState('browse') }]
        );
      }
    } catch {
      Alert.alert('Error', 'Failed to generate practice scenarios.');
      setPracticeState('browse');
    }
  };

  const handleSelectOption = (optIdx: number) => {
    if (showFeedback) return;
    const scenario = scenarios[questionIdx];
    const isCorrect = scenario.options?.[optIdx]?.isCorrect === true;
    const elapsed = Date.now() - startTime;
    const bonus = isCorrect ? Math.max(0, 50 - Math.floor(elapsed / 1000)) : 0;
    setTotalScore(prev => prev + (isCorrect ? 100 + bonus : 0));
    setSelectedOptionIdx(optIdx);
    setUserChoices(prev => [...prev, { optionIdx: optIdx, isCorrect }]);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (questionIdx < scenarios.length - 1) {
      setQuestionIdx(prev => prev + 1);
      setSelectedOptionIdx(null);
      setShowFeedback(false);
      setStartTime(Date.now());
    } else {
      submitResults();
    }
  };

  const submitResults = async () => {
    setSubmittingResults(true);
    try {
      const correctAnswers = userChoices.filter(c => c.isCorrect).length;
      const res = await ApiService.createReframeResult({
        thoughtRecordId: selectedThought.id,
        score: totalScore,
        correctAnswers,
        totalQuestions: scenarios.length,
        timeSpent: 2,
        scenarioData: scenarios,
        userChoices: userChoices.map((c, i) => ({
          scenarioIndex: i,
          selectedOptionIndex: c.optionIdx,
          isCorrect: c.isCorrect,
          timeSpent: 0,
        })),
      });
      if (res.data) {
        setGameUpdates(res.data.gameUpdates || null);
        setPracticeState('completed');
      } else {
        Alert.alert('Save Error', 'Could not save results.');
        setPracticeState('browse');
      }
    } catch {
      Alert.alert('Error', 'Failed to save practice results.');
      setPracticeState('browse');
    } finally {
      setSubmittingResults(false);
    }
  };

  const resetPractice = () => {
    setSelectedThought(null);
    setScenarios([]);
    setPracticeState('browse');
    loadData();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });

  const fmtDistortion = (d: string) =>
    d.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const fmtTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (days > 0)  return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (mins > 0)  return `${mins} minute${mins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ROOT RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
        <Text style={s.loadingTitle}>Opening Reframe Coach...</Text>
      </View>
    );
  }

  const totalSessions = profile?.stats?.totalPractices || 0;
  const avgScore = profile?.stats?.avgScore ? Math.round(profile.stats.avgScore) : 0;
  const streak = profile?.profile?.practiceStreak || 0;
  const masteryPct = Math.min(100, Math.round((totalSessions / 20) * 100));

  // During quiz/loading we keep header + tab bar visible but hide the bottom nav
  const inPracticeSession =
    practiceState === 'loading_scenarios' ||
    practiceState === 'quiz' ||
    practiceState === 'completed';

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>
      {/* ── Dark gradient header ──────────────────────────────── */}
      <View style={s.header}>
        {/* Title row */}
        <View style={s.headerTagRow}>
          <Feather name="zap" size={11} color="#34d399" />
          <Text style={s.headerTag}>COGNITIVE REFRAMING</Text>
        </View>
        <Text style={s.headerTitle}>Reframe Coach</Text>
        <Text style={s.headerSubtitle}>
          Practice balanced thinking with interactive exercises based on your thought records
        </Text>

        {/* Stats — horizontal row, shown only when there is data */}
        {totalSessions > 0 && (
          <View style={s.statsRow}>
            {[
              { v: `${totalSessions}`, l: 'Sessions' },
              { v: `${avgScore}`,      l: 'Avg Score',  c: '#34d399' },
              { v: `${streak}`,        l: 'Day Streak', c: '#34D399' },
            ].map((st, i) => (
              <View key={i} style={s.statItem}>
                <Text style={[s.statValue, st.c ? { color: st.c } : null]}>{st.v}</Text>
                <Text style={s.statLabel}>{st.l}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Mastery progress bar */}
        <View style={s.masteryBox}>
          <View style={s.masteryRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Feather name="zap" size={11} color="#34D399" />
              <Text style={s.masteryLabel}>REFRAME MASTERY</Text>
            </View>
            <Text style={s.masteryCount}>{totalSessions} of 20 sessions</Text>
          </View>
          <View style={s.masteryBarBg}>
            <View style={[s.masteryBarFill, { width: `${masteryPct}%` as any }]} />
          </View>
          <Text style={s.masteryFooter}>
            Each reframing session builds cognitive flexibility.
          </Text>
        </View>
      </View>

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <View style={s.tabBar}>
        {(['practice', 'history', 'insights'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[s.tabBtnText, activeTab === tab && s.tabBtnTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Tab content ──────────────────────────────────────── */}
      <View style={{ flex: 1 }}>
        {activeTab === 'practice' && renderPracticeTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'insights' && renderInsightsTab()}
      </View>

      {/* ── App bottom nav (hidden during active practice session) ── */}
      {!inPracticeSession && (
        <View style={s.bottomNav}>
          {[
            { screen: 'Dashboard', icon: 'home-outline', label: 'Home' },
            { screen: 'EmotionTracking', icon: 'heart-outline', label: 'Track' },
            { screen: 'ThoughtRecord', icon: 'bulb-outline', label: 'Thoughts' },
            { screen: 'ResourceLibrary', icon: 'book-outline', label: 'Resources' },
            { screen: 'EmotionHistory', icon: 'analytics-outline', label: 'Progress' },
          ].map(t => (
            <TouchableOpacity
              key={t.screen}
              style={s.bottomNavTab}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('HomeTabs', { screen: t.screen })}
            >
              <Ionicons name={t.icon as any} size={22} color="gray" />
              <Text style={s.bottomNavLabel}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB: PRACTICE
  // ═══════════════════════════════════════════════════════════════════════════

  function renderPracticeTab() {
    if (practiceState === 'loading_scenarios') return renderLoadingScenarios();
    if (practiceState === 'quiz') return renderQuiz();
    if (practiceState === 'completed') return renderCompleted();
    return renderBrowse();
  }

  function renderBrowse() {
    if (thoughtRecords.length === 0) {
      return (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryGreen} />
          }
        >
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Your Thought Records</Text>
              <Text style={s.cardDesc}>
                Select a thought record to practice cognitive reframing
              </Text>
            </View>
            <View style={s.emptyState}>
              <View style={s.emptyIconCircle}>
                <Feather name="shield" size={28} color={COLORS.primaryGreen} />
              </View>
              <Text style={s.emptyTitle}>No Thought Records Yet</Text>
              <Text style={s.emptyDesc}>
                Create a thought record first to begin practicing cognitive reframing.
              </Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => navigation.navigate('HomeTabs', { screen: 'ThoughtRecord' })}
              >
                <Text style={s.emptyBtnText}>Create Your First Thought Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      );
    }

    return (
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryGreen} />
        }
        data={thoughtRecords}
        keyExtractor={(item: any) => String(item.id)}
        ListHeaderComponent={
          <View style={[s.card, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 }]}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Your Thought Records</Text>
              <Text style={s.cardDesc}>
                Select a thought record to practice cognitive reframing
              </Text>
            </View>
            <View style={{ height: 12 }} />
          </View>
        }
        ListFooterComponent={
          <View style={[s.card, { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopWidth: 0, height: 12 }]} />
        }
        renderItem={({ item: thought }: { item: any }) => {
          const distortions: string[] = thought.thoughtCategory || thought.cognitiveDistortions || [];
          return (
            <View style={[s.card, { borderRadius: 0, borderTopWidth: 0, borderBottomWidth: 0, paddingHorizontal: 12, paddingVertical: 6 }]}>
              <View style={s.thoughtCard}>
                <Text style={s.thoughtQuote} numberOfLines={3}>
                  "{thought.automaticThoughts}"
                </Text>

                {distortions.length > 0 && (
                  <View style={s.pillRow}>
                    {distortions.slice(0, 3).map((d: string) => (
                      <View key={d} style={s.pill}>
                        <Text style={s.pillText}>{fmtDistortion(d)}</Text>
                      </View>
                    ))}
                    {distortions.length > 3 && (
                      <View style={s.pill}>
                        <Text style={s.pillText}>+{distortions.length - 3}</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={s.thoughtCardFooter}>
                  <Text style={s.thoughtDate}>{fmtDate(thought.createdAt)}</Text>
                  <TouchableOpacity
                    style={s.practiceBtn}
                    activeOpacity={0.8}
                    onPress={() => startPractice(thought)}
                  >
                    <Feather name="zap" size={13} color="#FFF" style={{ marginRight: 5 }} />
                    <Text style={s.practiceBtnText}>Practice</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />
    );
  }

  // ── Loading scenarios ──────────────────────────────────────────────────────
  function renderLoadingScenarios() {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
        <Text style={s.loadingTitle}>AI is generating reframing exercises...</Text>
        <Text style={s.loadingSubText}>
          Analysing your cognitive distortions to build custom scenarios.
        </Text>
      </View>
    );
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────
  function renderQuiz() {
    if (!scenarios.length) return null;
    const scenario = scenarios[questionIdx];
    if (!scenario) return null;

    const total = scenarios.length;
    const progress = ((questionIdx + (showFeedback ? 0.5 : 0)) / total) * 100;
    const options: any[] = scenario.options ?? [];

    return (
      <View style={{ flex: 1 }}>
        {/* Quiz progress bar + close */}
        <View style={s.quizBar}>
          <View style={{ flex: 1 }}>
            <View style={s.quizBarTopRow}>
              <Text style={s.quizStepText}>
                Scenario {questionIdx + 1} of {total}
              </Text>
              <View style={s.distortionBadge}>
                <Text style={s.distortionBadgeText} numberOfLines={1}>
                  {fmtDistortion(scenario.cognitiveDistortion ?? '')}
                </Text>
              </View>
            </View>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${progress}%` as any }]} />
            </View>
          </View>
          <TouchableOpacity
            style={s.closeBtn}
            onPress={() =>
              Alert.alert('Cancel Practice?', 'Your progress will not be saved.', [
                { text: 'Resume', style: 'cancel' },
                { text: 'Exit', style: 'destructive', onPress: () => setPracticeState('browse') },
              ])
            }
          >
            <Feather name="x" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Scenario text — dark card */}
          <View style={s.scenarioDark}>
            <Text style={s.scenarioDarkText}>"{scenario.scenario}"</Text>
          </View>

          {/* Question prompt */}
          <View style={s.questionRow}>
            <Feather name="zap" size={13} color={COLORS.primaryGreen} />
            <Text style={s.questionText}>HOW WOULD YOU REFRAME THIS THOUGHT?</Text>
          </View>

          {/* Answer options — click to answer immediately */}
          <View style={{ gap: 10 }}>
            {options.map((opt: any, idx: number) => {
              const isSelected = selectedOptionIdx === idx;
              const isCorrect = opt.isCorrect === true;

              let cardSt: any = s.optionCard;
              let radioSt: any = s.optionRadio;

              if (showFeedback) {
                if (isCorrect) {
                  cardSt = [s.optionCard, s.optionCorrect];
                  radioSt = s.optionRadioCorrect;
                } else if (isSelected) {
                  cardSt = [s.optionCard, s.optionWrong];
                  radioSt = s.optionRadioWrong;
                }
              } else if (isSelected) {
                cardSt = [s.optionCard, s.optionSelected];
                radioSt = s.optionRadioSelected;
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={cardSt}
                  activeOpacity={0.8}
                  onPress={() => handleSelectOption(idx)}
                  disabled={showFeedback}
                >
                  <View style={s.optionInner}>
                    {/* Radio indicator */}
                    <View style={radioSt}>
                      {showFeedback ? (
                        isCorrect ? (
                          <Feather name="check" size={11} color="#FFF" />
                        ) : isSelected ? (
                          <Feather name="x" size={11} color="#FFF" />
                        ) : null
                      ) : isSelected ? (
                        <View style={s.radioDot} />
                      ) : null}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={s.optionText}>{opt.text}</Text>
                      {showFeedback && (isSelected || isCorrect) && opt.explanation ? (
                        <Text
                          style={[
                            s.optionExpl,
                            isCorrect ? s.optionExplCorrect : s.optionExplWrong,
                          ]}
                        >
                          {opt.explanation}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Next / See Results button — appears only after selecting */}
        {showFeedback && (
          <View style={s.quizFooter}>
            <TouchableOpacity
              style={s.nextBtn}
              activeOpacity={0.8}
              onPress={handleNext}
              disabled={submittingResults}
            >
              {submittingResults ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Text style={s.nextBtnText}>
                    {questionIdx < scenarios.length - 1 ? 'Next Scenario' : 'See Results'}
                  </Text>
                  <Feather name="chevron-right" size={18} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  function renderCompleted() {
    const correct = userChoices.filter(c => c.isCorrect).length;
    const accuracy = scenarios.length > 0 ? Math.round((correct / scenarios.length) * 100) : 0;
    const newAchievements: string[] = gameUpdates?.newAchievements || [];
    const leveledUp = gameUpdates?.newLevel > gameUpdates?.prevLevel;

    return (
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Trophy header */}
        <View style={s.resultsHeader}>
          <View style={s.trophyCircle}>
            <MaterialCommunityIcons name="trophy-award" size={36} color="#F59E0B" />
          </View>
          <Text style={s.resultsTitle}>Practice Complete!</Text>
          <Text style={s.resultsSubtitle}>
            Fantastic job challenging and reframing these scenarios!
          </Text>
        </View>

        {/* Score cards */}
        <View style={s.scoreRow}>
          {[
            { label: 'Points Earned', value: `${totalScore}`, color: COLORS.primaryGreen, bg: '#ecfdf5', border: '#E9D5FF' },
            { label: 'Accuracy', value: `${accuracy}%`, color: COLORS.mediumGreen, bg: '#ECFDF5', border: COLORS.lightGreen },
            { label: 'Answers', value: `${correct}/${scenarios.length}`, color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
          ].map((sc, i) => (
            <View key={i} style={[s.scoreCard, { backgroundColor: sc.bg, borderColor: sc.border }]}>
              <Text style={s.scoreLabel}>{sc.label}</Text>
              <Text style={[s.scoreValue, { color: sc.color }]}>{sc.value}</Text>
            </View>
          ))}
        </View>

        {/* Achievements */}
        {newAchievements.length > 0 && (
          <View style={s.alertBox}>
            <MaterialCommunityIcons name="trophy" size={18} color="#F59E0B" />
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>New Achievements Unlocked!</Text>
              {newAchievements.map((a: string, i: number) => (
                <Text key={i} style={s.alertItem}>
                  • {a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Level up */}
        {leveledUp && (
          <View style={[s.alertBox, s.alertPurple]}>
            <Feather name="zap" size={18} color={COLORS.primaryGreen} />
            <View style={{ flex: 1 }}>
              <Text style={[s.alertTitle, { color: '#065f46' }]}>Level Up!</Text>
              <Text style={[s.alertItem, { color: '#047857' }]}>
                You reached Level {gameUpdates.newLevel}! Keep practicing to unlock more advanced exercises.
              </Text>
            </View>
          </View>
        )}

        {/* Progress saved */}
        <View style={[s.alertBox, s.alertGreen]}>
          <Feather name="check-circle" size={18} color={COLORS.mediumGreen} />
          <View style={{ flex: 1 }}>
            <Text style={[s.alertTitle, { color: '#065F46' }]}>Progress Recorded</Text>
            <Text style={[s.alertItem, { color: '#047857' }]}>
              Your restructuring statistics have been saved to your profile.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={s.secondaryBtn}
          onPress={() => navigation.navigate('HomeTabs', { screen: 'ThoughtRecord' })}
        >
          <Text style={s.secondaryBtnText}>Return to Thought Records</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.primaryBtn, { marginTop: 10 }]}
          onPress={() => {
            resetPractice();
            setActiveTab('history');
          }}
        >
          <Text style={s.primaryBtnText}>View Practice History</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB: HISTORY
  // ═══════════════════════════════════════════════════════════════════════════

  function renderHistoryTab() {
    // Practices per thought record
    const getThoughtPractices = (thoughtId: number) =>
      practices
        .filter(p => p.thoughtRecordId === thoughtId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const getLastPracticeInfo = (thoughtId: number) => {
      const tp = getThoughtPractices(thoughtId);
      if (!tp.length) return null;
      const last = tp[0];
      const hoursSince = (Date.now() - new Date(last.createdAt).getTime()) / 3600000;
      return { last, canPractice: hoursSince >= 24, hoursUntilNext: Math.ceil(24 - hoursSince) };
    };

    const sortedThoughts = [...thoughtRecords].sort((a, b) => {
      const aP = getThoughtPractices(a.id)[0];
      const bP = getThoughtPractices(b.id)[0];
      if (!aP && !bP) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (!aP) return 1; if (!bP) return -1;
      return new Date(bP.createdAt).getTime() - new Date(aP.createdAt).getTime();
    });

    const showActionsMenu = (thought: any) => {
      Alert.alert(
        'Options',
        `"${thought.automaticThoughts?.slice(0, 80)}${thought.automaticThoughts?.length > 80 ? '…' : ''}"`,
        [
          {
            text: 'Practice This Thought',
            onPress: () => { setActiveTab('practice'); startPractice(thought); },
          },
          {
            text: 'Delete Record',
            style: 'destructive',
            onPress: () => Alert.alert(
              'Delete Record',
              'Are you sure? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete', style: 'destructive',
                  onPress: async () => {
                    try { await ApiService.deleteThoughtRecord(userId!, thought.id); loadData(); }
                    catch { Alert.alert('Error', 'Could not delete the record.'); }
                  },
                },
              ]
            ),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    };

    return (
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryGreen} />
        }
        data={sortedThoughts}
        keyExtractor={(item: any) => String(item.id)}
        ListHeaderComponent={
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Thought Records</Text>
            <Text style={s.cardDesc}>Your thought records and practice history</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={s.emptyState}>
            <MaterialCommunityIcons name="brain" size={32} color="#34d399" />
            <Text style={s.emptyTitle}>No Thought Records Yet</Text>
            <Text style={s.emptyDesc}>Create a thought record to begin practicing.</Text>
          </View>
        }
        renderItem={({ item: thought }: { item: any }) => {
                const distortions: string[] = thought.thoughtCategory || thought.cognitiveDistortions || [];
                const info = getLastPracticeInfo(thought.id);
                const lastPractice = info?.last;
                const canPractice = !info || info.canPractice;

                return (
                  <View key={thought.id} style={s.histThoughtCard}>
                    {/* Header: date + menu */}
                    <View style={s.histThoughtHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={s.histDateIcon}>
                          <Feather name="calendar" size={11} color="#64748B" />
                        </View>
                        <Text style={s.histThoughtDate}>{fmtDate(thought.createdAt)}</Text>
                      </View>
                      <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => showActionsMenu(thought)}
                      >
                        <Feather name="more-vertical" size={16} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>

                    {/* Automatic Thoughts */}
                    <View style={{ paddingHorizontal: 14, paddingTop: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <View style={[s.histSectionIcon, { backgroundColor: '#EEF2FF' }]}>
                          <MaterialCommunityIcons name="brain" size={12} color="#6366F1" />
                        </View>
                        <Text style={s.histSectionLabel}>Automatic Thoughts</Text>
                      </View>
                      <Text style={s.histThoughtText} numberOfLines={2}>
                        {thought.automaticThoughts}
                      </Text>
                    </View>

                    {/* Distortions */}
                    {distortions.length > 0 && (
                      <View style={{ paddingHorizontal: 14, paddingTop: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <View style={[s.histSectionIcon, { backgroundColor: '#FFFBEB' }]}>
                            <Feather name="alert-triangle" size={11} color="#F59E0B" />
                          </View>
                          <Text style={s.histSectionLabel}>Distortions</Text>
                        </View>
                        <View style={s.pillRow}>
                          {distortions.slice(0, 3).map((d: string) => (
                            <View key={d} style={s.pill}>
                              <Text style={s.pillText}>{fmtDistortion(d)}</Text>
                            </View>
                          ))}
                          {distortions.length > 3 && (
                            <View style={s.pill}>
                              <Text style={s.pillText}>+{distortions.length - 3}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Last practice box */}
                    {lastPractice && (
                      <View style={{ paddingHorizontal: 14, paddingTop: 10 }}>
                        <View style={s.lastPracticeBox}>
                          <View>
                            <Text style={s.lastPracticeLabel}>Last practiced</Text>
                            <Text style={s.lastPracticeTime}>{fmtTimeAgo(lastPractice.createdAt)}</Text>
                          </View>
                          <View style={{ alignItems: 'center' }}>
                            <Text style={s.lastPracticeLabel}>Score</Text>
                            <Text style={s.lastPracticeScore}>{lastPractice.score ?? 0}</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Divider + Practice button */}
                    <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 10 }}>
                      {canPractice ? (
                        <TouchableOpacity
                          style={s.histPracticeBtn}
                          activeOpacity={0.8}
                          onPress={() => { setActiveTab('practice'); startPractice(thought); }}
                        >
                          <Feather name="zap" size={14} color="#FFF" style={{ marginRight: 6 }} />
                          <Text style={s.histPracticeBtnText}>Practice This Thought</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={s.histPracticedBtn}>
                          <Feather name="check-circle" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
                          <Text style={s.histPracticedBtnText}>
                            Practiced Today{info && info.hoursUntilNext > 0 ? `  (${info.hoursUntilNext}h until next)` : ''}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
        }}
        ListFooterComponent={
          practices.length > 0 ? (
            <View style={[s.card, { marginTop: 12 }]}>
              <View style={s.cardHeader}>
                <Text style={s.cardTitle}>Recent Sessions</Text>
                <Text style={s.cardDesc}>Your recent practice results</Text>
              </View>
              <View style={{ padding: 12, gap: 10 }}>
              {[...practices]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((p: any, idx: number) => {
                  const correct  = p.correctAnswers ?? p.correctCount ?? 0;
                  const total    = p.totalQuestions ?? p.totalCount ?? 1;
                  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

                  const sessionDistortions: string[] = [];
                  if (p.scenarioData && Array.isArray(p.scenarioData)) {
                    const seen = new Set<string>();
                    p.scenarioData.forEach((sc: any) => {
                      if (sc.cognitiveDistortion && !seen.has(sc.cognitiveDistortion)) {
                        seen.add(sc.cognitiveDistortion);
                        sessionDistortions.push(sc.cognitiveDistortion);
                      }
                    });
                  }

                  return (
                    <View key={p.id || idx} style={s.historyCard}>
                      <View style={s.historyCardTop}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                          <View style={[s.histSectionIcon, { backgroundColor: '#ecfdf5' }]}>
                            <Feather name="bar-chart-2" size={12} color={COLORS.primaryGreen} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={s.historyCardTitle}>Practice Session</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                              <Feather name="clock" size={9} color="#94A3B8" />
                              <Text style={s.historyCardDate}>{fmtDate(p.createdAt)}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={s.xpBadge}>
                          <Text style={s.xpBadgeText}>+{p.score ?? 0} XP</Text>
                        </View>
                      </View>

                      <View style={s.historyStatsRow}>
                        {[
                          { label: 'Score',    value: `${p.score ?? 0}`, color: COLORS.primaryGreen },
                          { label: 'Correct',  value: `${correct}/${total}`, color: '#6366F1' },
                          { label: 'Accuracy', value: `${accuracy}%`, color: '#047857' },
                        ].map((st, i) => (
                          <View key={i} style={s.historyStatCell}>
                            <Text style={s.historyStatLabel}>{st.label}</Text>
                            <Text style={[s.historyStatValue, { color: st.color }]}>{st.value}</Text>
                          </View>
                        ))}
                      </View>

                      {sessionDistortions.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                          {sessionDistortions.map((d, i) => (
                            <View key={i} style={s.histDistortionBadge}>
                              <MaterialCommunityIcons name="brain" size={10} color={COLORS.primaryGreen} style={{ marginRight: 3 }} />
                              <Text style={s.histDistortionBadgeText}>{fmtDistortion(d)}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {p.streakCount > 1 && (
                        <View style={s.histStreakBox}>
                          <Feather name="thumbs-up" size={12} color="#A855F7" style={{ marginRight: 6 }} />
                          <Text style={s.histStreakText}>
                            Streak: {p.streakCount} correct answers in a row!
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null
        }
      />
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB: INSIGHTS  (matches web ReframeInsights.tsx content exactly)
  // ═══════════════════════════════════════════════════════════════════════════

  function renderInsightsTab() {
    // ── Data helpers ────────────────────────────────────────────────────────

    const fmtDay  = (d: Date) => d.toISOString().slice(0, 10);
    const subDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() - n); return r; };
    const today   = new Date(); today.setHours(0, 0, 0, 0);

    // Key metrics (computed from practices array)
    const computeMetrics = () => {
      if (!practices.length) return { totalSessions: 0, avgScore: 0, avgAccuracy: 0, currentStreak: 0 };
      const totalSessions = practices.length;
      const avgScore = parseFloat(
        (practices.reduce((s, r) => s + (r.score || 0), 0) / totalSessions).toFixed(1)
      );
      const totC = practices.reduce((s, r) => s + (r.correctAnswers ?? r.correctCount ?? 0), 0);
      const totQ = practices.reduce((s, r) => s + (r.totalQuestions ?? r.totalCount ?? 1), 0);
      const avgAccuracy = parseFloat((totQ > 0 ? (totC / totQ) * 100 : 0).toFixed(1));

      // Consecutive-day streak
      const daySet = new Set(practices.map(r => fmtDay(new Date(r.createdAt))));
      let streak = 0;
      const todayStr = fmtDay(today);
      const yest = fmtDay(subDays(today, 1));
      if (daySet.has(todayStr) || daySet.has(yest)) {
        let i = 0;
        while (true) {
          if (daySet.has(fmtDay(subDays(today, i)))) { streak++; i++; } else break;
        }
      }
      return { totalSessions, avgScore, avgAccuracy, currentStreak: streak };
    };

    // Score trend data
    const getScoreTrend = (): { label: string; score: number; sessions: number }[] => {
      if (insightTimeRange === 'week') {
        return Array.from({ length: 7 }, (_, i) => {
          const day = subDays(today, 6 - i);
          const str = fmtDay(day);
          const rs = practices.filter(r => fmtDay(new Date(r.createdAt)) === str);
          const avg = rs.length ? rs.reduce((a, r) => a + (r.score || 0), 0) / rs.length : 0;
          return { label: day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0,3), score: parseFloat(avg.toFixed(1)), sessions: rs.length };
        });
      }
      if (insightTimeRange === 'month') {
        // 4 weeks
        return Array.from({ length: 4 }, (_, i) => {
          const wStart = subDays(today, (3 - i) * 7 + 6);
          const wEnd   = subDays(today, (3 - i) * 7);
          wStart.setHours(0,0,0,0); wEnd.setHours(23,59,59,999);
          const rs = practices.filter(r => { const d = new Date(r.createdAt); return d >= wStart && d <= wEnd; });
          const avg = rs.length ? rs.reduce((a, r) => a + (r.score || 0), 0) / rs.length : 0;
          return { label: `Wk ${i + 1}`, score: parseFloat(avg.toFixed(1)), sessions: rs.length };
        });
      }
      // year — 12 months
      return Array.from({ length: 12 }, (_, i) => {
        const mStart = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1);
        const mEnd   = new Date(today.getFullYear(), today.getMonth() - 11 + i + 1, 0, 23, 59, 59);
        const rs = practices.filter(r => { const d = new Date(r.createdAt); return d >= mStart && d <= mEnd; });
        const avg = rs.length ? rs.reduce((a, r) => a + (r.score || 0), 0) / rs.length : 0;
        return { label: mStart.toLocaleDateString('en-US', { month: 'short' }), score: parseFloat(avg.toFixed(1)), sessions: rs.length };
      });
    };

    // Accuracy trend data
    const getAccuracyTrend = (): { label: string; accuracy: number; sessions: number }[] => {
      const calcAcc = (rs: any[]) => {
        if (!rs.length) return 0;
        const c = rs.reduce((a, r) => a + (r.correctAnswers ?? r.correctCount ?? 0), 0);
        const q = rs.reduce((a, r) => a + (r.totalQuestions ?? r.totalCount ?? 1), 0);
        return parseFloat((q > 0 ? (c / q) * 100 : 0).toFixed(1));
      };
      if (insightTimeRange === 'week') {
        return Array.from({ length: 7 }, (_, i) => {
          const day = subDays(today, 6 - i);
          const str = fmtDay(day);
          const rs = practices.filter(r => fmtDay(new Date(r.createdAt)) === str);
          return { label: day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0,3), accuracy: calcAcc(rs), sessions: rs.length };
        });
      }
      if (insightTimeRange === 'month') {
        return Array.from({ length: 4 }, (_, i) => {
          const wStart = subDays(today, (3 - i) * 7 + 6);
          const wEnd   = subDays(today, (3 - i) * 7);
          wStart.setHours(0,0,0,0); wEnd.setHours(23,59,59,999);
          const rs = practices.filter(r => { const d = new Date(r.createdAt); return d >= wStart && d <= wEnd; });
          return { label: `Wk ${i + 1}`, accuracy: calcAcc(rs), sessions: rs.length };
        });
      }
      return Array.from({ length: 12 }, (_, i) => {
        const mStart = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1);
        const mEnd   = new Date(today.getFullYear(), today.getMonth() - 11 + i + 1, 0, 23, 59, 59);
        const rs = practices.filter(r => { const d = new Date(r.createdAt); return d >= mStart && d <= mEnd; });
        return { label: mStart.toLocaleDateString('en-US', { month: 'short' }), accuracy: calcAcc(rs), sessions: rs.length };
      });
    };

    // Distortions practiced (top 8)
    const getDistortions = () => {
      const counts: Record<string, number> = {};
      practices.forEach(r => {
        (r.scenarioData || []).forEach((sc: any) => {
          if (sc.cognitiveDistortion) {
            const k = String(sc.cognitiveDistortion);
            counts[k] = (counts[k] || 0) + 1;
          }
        });
      });
      return Object.entries(counts)
        .map(([raw, count]) => ({
          name: raw.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    };

    // 30-day calendar
    const getCalendar = () =>
      Array.from({ length: 30 }, (_, i) => {
        const day   = subDays(today, 29 - i);
        const str   = fmtDay(day);
        const rs    = practices.filter(r => fmtDay(new Date(r.createdAt)) === str);
        const avg   = rs.length ? rs.reduce((a, r) => a + (r.score || 0), 0) / rs.length : 0;
        return { dayNum: day.getDate(), sessions: rs.length, score: avg };
      });

    // ── Chart helpers ────────────────────────────────────────────────────────
    const CARD_PAD    = 16;
    const CHART_W     = width - 32 - CARD_PAD * 2; // usable width inside card
    const Y_LABEL_W   = 38;
    const DATA_W      = CHART_W - Y_LABEL_W - 4;
    const CHART_H     = 150;
    const TOP_PAD     = 8;  // room for top dot
    const X_LABEL_H   = 18;
    const SVG_H       = TOP_PAD + CHART_H + X_LABEL_H + 4;
    const GRID_LINES  = 4;

    // SVG line chart (reused for both score and accuracy)
    const renderLineChart = (
      data: { label: string; value: number }[],
      maxY: number,
      color: string,
      yTickFmt: (v: number) => string
    ) => {
      if (!data.length) return null;
      const clampedMax = maxY || 1;

      // grid line Y positions — i=0 is bottom (value=0), i=GRID_LINES is top (value=max)
      const gridYs = Array.from({ length: GRID_LINES + 1 }, (_, i) =>
        TOP_PAD + CHART_H - (i / GRID_LINES) * CHART_H
      );

      // data points
      const pts = data.map((d, i) => {
        const x = Y_LABEL_W + (i / Math.max(data.length - 1, 1)) * DATA_W;
        const y = TOP_PAD + CHART_H - (Math.min(d.value, clampedMax) / clampedMax) * CHART_H;
        return { x, y, ...d };
      });

      const polyPoints = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

      return (
        <Svg width={CHART_W} height={SVG_H} style={{ overflow: 'visible' }}>
          <Defs>
            <SvgLinearGradient id={`line_${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.15" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>

          {/* horizontal grid lines + Y labels */}
          {gridYs.map((gy, i) => {
            const val = (i / GRID_LINES) * clampedMax; // i=0 → 0 (bottom), i=GRID_LINES → max (top)
            return (
              <G key={i}>
                <SvgLine x1={Y_LABEL_W} y1={gy} x2={Y_LABEL_W + DATA_W} y2={gy}
                  stroke="#F1F5F9" strokeWidth="1" />
                <SvgText x={Y_LABEL_W - 4} y={gy + 4} fontSize="9" fill="#94A3B8"
                  textAnchor="end" fontWeight="600">
                  {yTickFmt(Math.round(val))}
                </SvgText>
              </G>
            );
          })}

          {/* Line */}
          <Polyline
            points={polyPoints}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Dots + X labels */}
          {pts.map((p, i) => (
            <G key={i}>
              <Circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke={color} strokeWidth="2" />
              <SvgText
                x={p.x}
                y={SVG_H - 2}
                fontSize="9"
                fill="#94A3B8"
                textAnchor="middle"
                fontWeight="600"
              >
                {p.label}
              </SvgText>
            </G>
          ))}
        </Svg>
      );
    };

    // SVG horizontal bar chart
    const renderBarChart = (data: { name: string; count: number }[]) => {
      if (!data.length) return null;
      const maxCount = Math.max(...data.map(d => d.count), 1);
      const BAR_H    = 18;
      const GAP      = 10;
      const LABEL_W  = 130;
      const BAR_AREA = CHART_W - LABEL_W - 36; // 36 for count label
      const totalH   = data.length * (BAR_H + GAP);

      return (
        <Svg width={CHART_W} height={totalH} style={{ overflow: 'visible' }}>
          <Defs>
            <SvgLinearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#818CF8" stopOpacity="1" />
              <Stop offset="1" stopColor="#4F46E5" stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          {data.map((d, i) => {
            const barW = Math.max(4, (d.count / maxCount) * BAR_AREA);
            const y    = i * (BAR_H + GAP);
            return (
              <G key={i}>
                {/* Label */}
                <SvgText
                  x={0} y={y + BAR_H - 4}
                  fontSize="10" fill="#475569" fontWeight="600"
                >
                  {d.name.length > 18 ? d.name.slice(0, 17) + '.' : d.name}
                </SvgText>
                {/* Bar background */}
                <Rect
                  x={LABEL_W} y={y + 2}
                  width={BAR_AREA} height={BAR_H - 4}
                  fill="#F1F5F9" rx="4"
                />
                {/* Bar fill */}
                <Rect
                  x={LABEL_W} y={y + 2}
                  width={barW} height={BAR_H - 4}
                  fill="url(#barGrad)" rx="4"
                />
                {/* Count */}
                <SvgText
                  x={LABEL_W + BAR_AREA + 4} y={y + BAR_H - 4}
                  fontSize="10" fill="#6366F1" fontWeight="800"
                >
                  {d.count}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      );
    };

    // ── Computed data ────────────────────────────────────────────────────────
    const metrics      = computeMetrics();
    const scoreTrend   = getScoreTrend();
    const accTrend     = getAccuracyTrend();
    const distortions  = getDistortions();
    const calendar     = getCalendar();
    const maxScore     = Math.max(...scoreTrend.map(d => d.score), 1);
    const scoreChartData  = scoreTrend.map(d => ({ label: d.label, value: d.score }));
    const accChartData    = accTrend.map(d => ({ label: d.label, value: d.accuracy }));

    // Empty state
    if (!practices.length) {
      return (
        <View style={s.centered}>
          <View style={s.emptyIconCircle}>
            <MaterialCommunityIcons name="trophy-outline" size={32} color={COLORS.primaryGreen} />
          </View>
          <Text style={s.emptyTitle}>Reframe Training</Text>
          <Text style={[s.emptyDesc, { maxWidth: 280 }]}>
            No reframing sessions completed yet. Complete a practice module to activate analytics.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryGreen} />
        }
      >
        {/* ── 1. Key Metric Cards ── */}
        <View style={s.metricsRow}>
          {[
            { icon: 'award' as const, iconColor: COLORS.primaryGreen, bg: '#ecfdf5',
              label: 'Total Sessions', value: `${metrics.totalSessions}`, sub: 'Trainings completed' },
            { icon: 'trending-up' as const, iconColor: '#6366F1', bg: '#EEF2FF',
              label: 'Avg Score', value: `${metrics.avgScore}`, sub: 'Points per module' },
            { icon: 'check-circle' as const, iconColor: COLORS.mediumGreen, bg: '#ECFDF5',
              label: 'Accuracy', value: `${metrics.avgAccuracy}%`, sub: 'Correct selections' },
            { icon: 'zap' as const, iconColor: '#A855F7', bg: '#FAF5FF',
              label: 'Current Streak', value: `${metrics.currentStreak}`, sub: 'Days in a row' },
          ].map((m, i) => (
            <View key={i} style={s.metricCard}>
              <View style={[s.metricIconBox, { backgroundColor: m.bg }]}>
                <Feather name={m.icon} size={18} color={m.iconColor} />
              </View>
              <Text style={s.metricLabel}>{m.label}</Text>
              <Text style={[s.metricValue, { color: m.iconColor }]}>{m.value}</Text>
              <Text style={s.metricSub}>{m.sub}</Text>
            </View>
          ))}
        </View>

        {/* ── 2. Score Trends ── */}
        <View style={[s.insightCard, { marginBottom: 14 }]}>
          <View style={s.insightCardHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[s.insightIconBox, { backgroundColor: '#ecfdf5' }]}>
                  <Feather name="trending-up" size={14} color={COLORS.primaryGreen} />
                </View>
                <Text style={s.insightCardTitle}>Score Trends</Text>
              </View>
              <Text style={s.insightCardDesc}>
                Timeline tracing points and score parameters achieved per session
              </Text>
            </View>
            {/* Time range selector */}
            <View style={s.timeRangePicker}>
              {(['week', 'month', 'year'] as const).map(r => (
                <TouchableOpacity
                  key={r}
                  style={[s.timeRangeBtn, insightTimeRange === r && s.timeRangeBtnActive]}
                  onPress={() => setInsightTimeRange(r)}
                >
                  <Text style={[s.timeRangeBtnText, insightTimeRange === r && s.timeRangeBtnTextActive]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={s.insightCardBody}>
            {renderLineChart(scoreChartData, maxScore, COLORS.primaryGreen, v => `${v}`)}
          </View>
        </View>

        {/* ── 3. Accuracy Trends ── */}
        <View style={[s.insightCard, { marginBottom: 14 }]}>
          <View style={s.insightCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[s.insightIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Feather name="target" size={14} color={COLORS.mediumGreen} />
              </View>
              <View>
                <Text style={s.insightCardTitle}>Accuracy Trends</Text>
                <Text style={s.insightCardDesc}>
                  Percentage of correct scenario selections over time
                </Text>
              </View>
            </View>
          </View>
          <View style={s.insightCardBody}>
            {renderLineChart(accChartData, 100, COLORS.mediumGreen, v => `${v}%`)}
          </View>
        </View>

        {/* ── 4. Cognitive Distortions Reframed ── */}
        <View style={[s.insightCard, { marginBottom: 14 }]}>
          <View style={s.insightCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[s.insightIconBox, { backgroundColor: '#EEF2FF' }]}>
                <Feather name="bar-chart-2" size={14} color="#6366F1" />
              </View>
              <View>
                <Text style={s.insightCardTitle}>Cognitive Distortions Reframed</Text>
                <Text style={s.insightCardDesc}>
                  Unhelpful thinking styles practiced most frequently
                </Text>
              </View>
            </View>
          </View>
          <View style={s.insightCardBody}>
            {distortions.length > 0 ? (
              renderBarChart(distortions)
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Feather name="alert-circle" size={22} color={COLORS.disabledBg} />
                <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>
                  No scenario data available.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── 5. 30-Day Practice Calendar ── */}
        <View style={s.insightCard}>
          <View style={s.insightCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[s.insightIconBox, { backgroundColor: '#FAF5FF' }]}>
                <Feather name="calendar" size={14} color="#A855F7" />
              </View>
              <View>
                <Text style={s.insightCardTitle}>30-Day Practice Calendar</Text>
                <Text style={s.insightCardDesc}>
                  Reframing consistency and training frequency
                </Text>
              </View>
            </View>
          </View>
          <View style={s.insightCardBody}>
            <View style={s.calendarGrid}>
              {calendar.map((day, i) => {
                let bg = '#F8FAFC', border = '#F1F5F9', txtColor = COLORS.disabledBg;
                if (day.sessions > 0) {
                  if (day.score < 80)       { bg = '#F3E8FF'; border = COLORS.lightGreen; txtColor = '#047857'; }
                  else if (day.score < 150) { bg = COLORS.lightGreen; border = '#C4B5FD'; txtColor = '#065f46'; }
                  else if (day.score < 220) { bg = '#A78BFA'; border = COLORS.primaryGreen; txtColor = '#FFFFFF'; }
                  else                      { bg = COLORS.primaryGreen; border = '#047857'; txtColor = '#FFFFFF'; }
                }
                return (
                  <View key={i} style={[s.calendarCell, { backgroundColor: bg, borderColor: border }]}>
                    <Text style={[s.calendarCellText, { color: txtColor }]}>{day.dayNum}</Text>
                  </View>
                );
              })}
            </View>
            {/* Legend */}
            <View style={s.calendarLegend}>
              <Text style={s.calendarLegendLabel}>Inactive</Text>
              <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                {['#F8FAFC', '#F3E8FF', COLORS.lightGreen, '#A78BFA', COLORS.primaryGreen].map((c, i) => (
                  <View key={i} style={[s.calendarLegendDot, { backgroundColor: c,
                    borderColor: i === 0 ? '#E2E8F0' : c }]} />
                ))}
              </View>
              <Text style={s.calendarLegendLabel}>High Score</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F8FAFC',
  },
  loadingTitle: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  loadingSubText: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    backgroundColor: COLORS.darkGreen,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  headerTag: {
    color: '#34d399',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 5,
  },
  headerSubtitle: {
    color: 'rgba(196,181,253,0.7)',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: { alignItems: 'center' },
  statValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  statLabel: { color: 'rgba(196,181,253,0.65)', fontSize: 9, fontWeight: '700', marginTop: 1 },

  masteryBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
  },
  masteryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  masteryLabel: { color: '#E2E8F0', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  masteryCount: { color: 'rgba(196,181,253,0.55)', fontSize: 10, fontWeight: '600' },
  masteryBarBg: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginBottom: 5,
    overflow: 'hidden',
  },
  masteryBarFill: { height: 5, backgroundColor: COLORS.mediumGreen, borderRadius: 3 },
  masteryFooter: { color: 'rgba(196,181,253,0.45)', fontSize: 10 },

  // ── Tab bar ──────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabBtnActive: { borderBottomColor: COLORS.primaryGreen },
  tabBtnText: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  tabBtnTextActive: { color: COLORS.darkGreen },

  // ── Cards ────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  cardTitle: { fontSize: 14.5, fontWeight: '800', color: COLORS.darkGreen, marginBottom: 2 },
  cardDesc: { fontSize: 12, color: '#64748B' },

  // ── Empty state ──────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24 },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: COLORS.darkGreen, marginBottom: 6, textAlign: 'center' },
  emptyDesc: { fontSize: 12.5, color: '#64748B', textAlign: 'center', lineHeight: 18, marginBottom: 18 },
  emptyBtn: { backgroundColor: COLORS.darkGreen, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
  emptyBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // ── Thought record cards ─────────────────────────────────────────────────
  thoughtCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  thoughtQuote: { fontSize: 13.5, color: COLORS.darkGreen, fontStyle: 'italic', lineHeight: 20, marginBottom: 10 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  pill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillText: { fontSize: 9, fontWeight: '800', color: '#047857' },
  thoughtCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  thoughtDate: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  practiceBtn: {
    backgroundColor: COLORS.darkGreen,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  practiceBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },

  // ── Quiz bar ─────────────────────────────────────────────────────────────
  quizBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  quizBarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  quizStepText: { fontSize: 10, fontWeight: '800', color: COLORS.primaryGreen, letterSpacing: 0.4 },
  distortionBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 170,
  },
  distortionBadgeText: { fontSize: 9, fontWeight: '800', color: '#047857' },
  progressBg: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: COLORS.primaryGreen, borderRadius: 2 },
  closeBtn: { padding: 4 },

  // ── Scenario dark card ────────────────────────────────────────────────────
  scenarioDark: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  scenarioDarkText: { color: '#d1fae5', fontSize: 14, fontStyle: 'italic', lineHeight: 21, fontWeight: '600' },

  // ── Question / Options ────────────────────────────────────────────────────
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  questionText: { fontSize: 10, fontWeight: '800', color: '#334155', letterSpacing: 0.4, flex: 1 },

  optionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
  },
  optionSelected: { borderColor: COLORS.primaryGreen, backgroundColor: '#ecfdf5' },
  optionCorrect:  { borderColor: COLORS.mediumGreen, backgroundColor: '#ECFDF5' },
  optionWrong:    { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },

  optionInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },

  optionRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1.5,
    borderColor: COLORS.disabledBg, alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  optionRadioSelected: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1.5,
    borderColor: COLORS.primaryGreen, backgroundColor: COLORS.primaryGreen,
    alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0,
  },
  optionRadioCorrect: {
    width: 20, height: 20, borderRadius: 10,
    borderColor: COLORS.mediumGreen, backgroundColor: COLORS.mediumGreen,
    alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0,
  },
  optionRadioWrong: {
    width: 20, height: 20, borderRadius: 10,
    borderColor: '#EF4444', backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0,
  },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },

  optionText: { fontSize: 13, fontWeight: '600', color: '#334155', lineHeight: 19 },
  optionExpl: { fontSize: 11.5, lineHeight: 16, marginTop: 6, fontWeight: '500', borderRadius: 8, padding: 8 },
  optionExplCorrect: { backgroundColor: 'rgba(16,185,129,0.08)', color: '#065F46' },
  optionExplWrong:   { backgroundColor: 'rgba(239,68,68,0.08)', color: '#991B1B' },

  // ── Quiz footer ───────────────────────────────────────────────────────────
  quizFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  nextBtn: {
    backgroundColor: COLORS.darkGreen,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  nextBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // ── Results ───────────────────────────────────────────────────────────────
  resultsHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.darkGreen,
    borderRadius: 20,
    marginBottom: 14,
  },
  trophyCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(5,150,105,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  resultsTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 5 },
  resultsSubtitle: { fontSize: 12, color: 'rgba(196,181,253,0.7)', textAlign: 'center', lineHeight: 17 },

  scoreRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  scoreCard: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  scoreLabel: { fontSize: 8.5, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.3, marginBottom: 4, textAlign: 'center' },
  scoreValue: { fontSize: 19, fontWeight: '900' },

  alertBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: 14, padding: 12, marginBottom: 10,
  },
  alertPurple: { backgroundColor: '#ecfdf5', borderColor: COLORS.lightGreen },
  alertGreen:  { backgroundColor: '#ECFDF5', borderColor: COLORS.lightGreen },
  alertTitle: { fontSize: 12.5, fontWeight: '800', color: '#92400E', marginBottom: 2 },
  alertItem:  { fontSize: 11.5, fontWeight: '500', color: '#B45309', lineHeight: 17 },

  primaryBtn: {
    height: 50, borderRadius: 16, backgroundColor: COLORS.darkGreen,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.darkGreen, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  secondaryBtn: {
    height: 50, borderRadius: 16, borderWidth: 1.5,
    borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: '#334155' },

  // ── History tab ───────────────────────────────────────────────────────────
  historyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1.5, borderColor: '#F1F5F9', padding: 14,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  historyCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  historyCardTitle: { fontSize: 13, fontWeight: '800', color: COLORS.darkGreen, marginBottom: 2 },
  historyCardDate: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  xpBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  xpBadgeText: { fontSize: 10, fontWeight: '900', color: COLORS.primaryGreen },
  historyStatsRow: { flexDirection: 'row', gap: 8 },
  historyStatCell: {
    flex: 1, backgroundColor: '#F8FAFC', borderRadius: 10,
    paddingVertical: 8, alignItems: 'center',
  },
  historyStatValue: { fontSize: 14, fontWeight: '900', color: COLORS.darkGreen },
  historyStatLabel: { fontSize: 9.5, fontWeight: '700', color: '#94A3B8', marginTop: 1 },

  // ── History tab — thought record cards ───────────────────────────────────
  histThoughtCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  histThoughtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  histDateIcon: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  histThoughtDate: { fontSize: 11.5, fontWeight: '600', color: '#475569' },
  histSectionIcon: {
    width: 22, height: 22, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  histSectionLabel: { fontSize: 11.5, fontWeight: '700', color: '#475569' },
  histThoughtText: {
    fontSize: 13, color: '#334155', lineHeight: 18,
    paddingLeft: 28,
  },
  lastPracticeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(5,150,105,0.06)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(5,150,105,0.12)',
  },
  lastPracticeLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginBottom: 2 },
  lastPracticeTime: { fontSize: 12.5, fontWeight: '700', color: '#4C1D95' },
  lastPracticeScore: { fontSize: 26, fontWeight: '900', color: COLORS.primaryGreen },
  histPracticeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primaryGreen, borderRadius: 12,
    paddingVertical: 12,
  },
  histPracticeBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  histPracticedBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F1F5F9', borderRadius: 12,
    paddingVertical: 12,
  },
  histPracticedBtnText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  histDistortionBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ecfdf5', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: COLORS.lightGreen,
  },
  histDistortionBadgeText: { fontSize: 10, fontWeight: '700', color: '#047857' },
  histStreakBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FDF4FF', borderRadius: 10,
    padding: 10, marginTop: 8,
    borderWidth: 1, borderColor: '#E9D5FF',
  },
  histStreakText: { fontSize: 11.5, fontWeight: '700', color: '#7E22CE' },

  // ── Insights tab ──────────────────────────────────────────────────────────
  insightGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, paddingBottom: 14, paddingTop: 12, gap: 10,
  },
  insightCell: {
    width: (width - 32 - 10 - 24) / 2,
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, alignItems: 'center',
  },
  insightValue: { fontSize: 22, fontWeight: '900' },
  insightCellLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginTop: 2 },

  levelText: { fontSize: 22, fontWeight: '900', color: COLORS.darkGreen, marginBottom: 10 },
  xpBarBg: {
    height: 8, backgroundColor: '#E2E8F0', borderRadius: 4,
    marginBottom: 6, overflow: 'hidden',
  },
  xpBarFill: { height: 8, backgroundColor: COLORS.primaryGreen, borderRadius: 4 },
  xpFooter: { fontSize: 10.5, color: '#94A3B8', fontWeight: '700' },

  achievementRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, paddingHorizontal: 4,
  },
  achievementIcon: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  achievementIconEarned: { backgroundColor: '#FEF3C7' },
  achievementIconLocked: { backgroundColor: '#F1F5F9' },
  achievementLabel: { fontSize: 13, fontWeight: '600', color: '#334155', flex: 1 },

  // ── Insights tab ──────────────────────────────────────────────────────────
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  metricCard: {
    width: (width - 32 - 10) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  metricIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },

  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  insightCardHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  insightIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.darkGreen,
  },
  insightCardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    lineHeight: 15,
  },
  insightCardBody: {
    padding: 16,
  },

  // Time range selector
  timeRangePicker: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 2,
    gap: 1,
  },
  timeRangeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timeRangeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  timeRangeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  timeRangeBtnTextActive: {
    color: COLORS.darkGreen,
  },

  // 30-day calendar
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  calendarCell: {
    width: Math.floor((width - 32 - 32 - 9 * 5) / 10), // 10 per row, floor prevents wrapping
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCellText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  calendarLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  calendarLegendLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  calendarLegendDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
  },

  // ── App bottom nav ────────────────────────────────────────────────────────
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    height: 56,
  },
  bottomNavTab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  bottomNavLabel: { fontSize: 9.5, color: 'gray', fontWeight: '600' },
});
