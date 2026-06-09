import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { ApiService } from '../services/api';
import Svg, { Path, Rect, G, Text as SvgText, Line, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface ThoughtRecordScreenProps {
  navigation: any;
}

export default function ThoughtRecordScreen({ navigation }: ThoughtRecordScreenProps) {
  const insets = useSafeAreaInsets();
  // Tabs and general screen state
  const [activeScreenTab, setActiveScreenTab] = useState<'record' | 'history' | 'insights'>('record');
  const [thoughtRecordsHistory, setThoughtRecordsHistory] = useState<any[]>([]);
  const [recentEmotions, setRecentEmotions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Thought card action state
  const [selectedThought, setSelectedThought] = useState<any>(null);
  const [thoughtMenuVisible, setThoughtMenuVisible] = useState(false);
  const [thoughtDetailsVisible, setThoughtDetailsVisible] = useState(false);
  const [thoughtEditVisible, setThoughtEditVisible] = useState(false);
  const [updatingThought, setUpdatingThought] = useState(false);

  // Challenge wizard state
  const [challengeVisible, setChallengeVisible] = useState(false);
  const [challengeStep, setChallengeStep] = useState(0); // 0: evidenceFor, 1: evidenceAgainst, 2: reframe
  const [challengeEvidenceFor, setChallengeEvidenceFor] = useState('');
  const [challengeEvidenceAgainst, setChallengeEvidenceAgainst] = useState('');
  const [challengeAlternative, setChallengeAlternative] = useState('');
  const [savingChallenge, setSavingChallenge] = useState(false);

  // Edit modal form state
  const [editThoughtText, setEditThoughtText] = useState('');
  const [editDistortions, setEditDistortions] = useState<string[]>([]);
  const [editEvidenceFor, setEditEvidenceFor] = useState('');
  const [editEvidenceAgainst, setEditEvidenceAgainst] = useState('');
  const [editAlternative, setEditAlternative] = useState('');
  const [editInsights, setEditInsights] = useState('');

  // Wizard form state
  const [step, setStep] = useState(0); // 0: Intro, 1: Thoughts, 2: Distortions, 3: Evidence, 4: Reframing, 5: Link Emotion
  const [automaticThoughts, setAutomaticThoughts] = useState('');
  const [selectedDistortions, setSelectedDistortions] = useState<string[]>([]);
  const [evidenceFor, setEvidenceFor] = useState('');
  const [evidenceAgainst, setEvidenceAgainst] = useState('');
  const [alternativePerspective, setAlternativePerspective] = useState('');
  const [insightsGained, setInsightsGained] = useState('');
  const [linkedEmotionId, setLinkedEmotionId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const cognitiveDistortions = [
    'All-or-Nothing Thinking',
    'Overgeneralization',
    'Mental Filter',
    'Discounting the Positive',
    'Jumping to Conclusions',
    'Magnification/Minimization',
    'Emotional Reasoning',
    'Should Statements',
    'Labeling',
    'Personalization'
  ];

  const loadData = async () => {
    setHistoryLoading(true);
    try {
      const userResponse = await ApiService.getCurrentUser();
      if (userResponse.data) {
        const userId = userResponse.data.id;
        const [thoughtsRes, emotionsRes] = await Promise.all([
          ApiService.getThoughtRecords(userId),
          ApiService.getUserEmotions(userId)
        ]);
        if (thoughtsRes.data) {
          // Sort thoughts: newest first
          setThoughtRecordsHistory(
            thoughtsRes.data.sort(
              (a: any, b: any) =>
                new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime()
            )
          );
        }
        if (emotionsRes.data) {
          setRecentEmotions(emotionsRes.data);
        }
      }
    } catch (error) {
      console.error('Failed to load thought record history & emotions:', error);
    } finally {
      setHistoryLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeScreenTab === 'history' || activeScreenTab === 'insights') {
      loadData();
    }
  }, [activeScreenTab]);

  const toggleDistortion = (distortion: string) => {
    setSelectedDistortions(prev => 
      prev.includes(distortion)
        ? prev.filter(d => d !== distortion)
        : [...prev, distortion]
    );
  };

  const validateStep = () => {
    if (step === 1 && automaticThoughts.trim().length < 10) return false;
    if (step === 2 && selectedDistortions.length === 0) return false;
    return true;
  };

  const handleNextStep = () => {
    if (validateStep() && step < 5) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSave = async () => {
    if (!automaticThoughts.trim() || automaticThoughts.trim().length < 10) {
      Alert.alert('Missing Information', 'Please describe your automatic thoughts in at least 10 characters.');
      return;
    }

    setLoading(true);
    try {
      const userResponse = await ApiService.getCurrentUser();
      if (!userResponse.data) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const thoughtData = {
        automaticThoughts: automaticThoughts.trim(),
        evidenceFor: evidenceFor.trim() || null,
        evidenceAgainst: evidenceAgainst.trim() || null,
        alternativePerspective: alternativePerspective.trim() || null,
        insightsGained: insightsGained.trim() || null,
        cognitiveDistortions: selectedDistortions,
        emotionRecordId: linkedEmotionId,
      };

      const response = await ApiService.createThoughtRecord(userResponse.data.id, thoughtData);
      
      if (response.error) {
        Alert.alert('Error', response.error);
      } else {
        setShowSuccess(true);
        loadData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save thought record');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setStep(0);
    setAutomaticThoughts('');
    setSelectedDistortions([]);
    setEvidenceFor('');
    setEvidenceAgainst('');
    setAlternativePerspective('');
    setInsightsGained('');
    setLinkedEmotionId(null);
    setActiveScreenTab('history');
  };

  // --- RENDERS ---

  // Progress Bar Header (Wizard step tracker)
  const renderProgressHeader = () => {
    if (step === 0) return null;
    const progressPercent = (step / 5) * 100;
    const stepNames = ['Intro', 'Thoughts', 'Distortions', 'Fact-Check', 'Reframe', 'Link Emotion'];

    return (
      <View style={styles.progressHeaderContainer}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressStepNum}>Step {step} of 5</Text>
          <Text style={styles.progressStepName}>{stepNames[step]}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>
    );
  };

  // Step 0: Welcome / CBT Introduction
  const renderIntroStep = () => {
    return (
      <View style={styles.introContainer}>
        <View style={styles.heroSection}>
          <View style={styles.heroGradientCircle}>
            <MaterialCommunityIcons name="brain" size={32} color="#8B5CF6" />
          </View>
          <Text style={styles.heroTitle}>CBT Thought Record</Text>
          <Text style={styles.heroSubtitle}>
            Challenging and restructuring unhelpful thoughts helps you cultivate a more balanced perspective.
          </Text>
        </View>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconWrapper}>
              <Feather name="edit-3" size={16} color="#8B5CF6" />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureLabel}>Identify Automatic Thoughts</Text>
              <Text style={styles.featureDescription}>
                Log the negative thoughts that pop up in stressful situations.
              </Text>
            </View>
          </View>
          
          <View style={styles.featureDivider} />

          <View style={styles.featureItem}>
            <View style={styles.featureIconWrapper}>
              <Feather name="shield" size={16} color="#8B5CF6" />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureLabel}>Spot Cognitive Distortions</Text>
              <Text style={styles.featureDescription}>
                Recognize common thinking patterns affecting your judgment.
              </Text>
            </View>
          </View>
          
          <View style={styles.featureDivider} />

          <View style={styles.featureItem}>
            <View style={styles.featureIconWrapper}>
              <Feather name="check-circle" size={16} color="#8B5CF6" />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureLabel}>Reflect and Reframe</Text>
              <Text style={styles.featureDescription}>
                Fact-check assumptions to build rational reframed outcomes.
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.introStartButton}
          activeOpacity={0.85}
          onPress={() => setStep(1)}
        >
          <Text style={styles.introStartButtonText}>Begin Reframing</Text>
          <Feather name="arrow-right" size={18} color="white" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    );
  };

  // Step 1: Capture Thoughts
  const renderThoughtsStep = () => {
    const isCharLimitMet = automaticThoughts.trim().length >= 10;
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepHeading}>Automatic Thoughts</Text>
        <Text style={styles.stepSubheading}>Write down the thoughts that went through your mind automatically.</Text>

        <View style={styles.inputGroupBox}>
          <TextInput
            style={styles.textareaInput}
            placeholder="What went through your head? (e.g. I am going to fail this task and lose my job...)"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={automaticThoughts}
            onChangeText={setAutomaticThoughts}
            textAlignVertical="top"
          />
          <View style={styles.charCountRow}>
            {!isCharLimitMet && automaticThoughts.trim().length > 0 ? (
              <Text style={styles.charWarningText}>
                Need {10 - automaticThoughts.trim().length} more characters
              </Text>
            ) : (
              <Text style={styles.charSuccessText}>
                {automaticThoughts.trim().length > 0 ? 'Minimum characters met' : ''}
              </Text>
            )}
            <Text style={styles.charCounter}>{automaticThoughts.length} chars</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Feather name="info" size={14} color="#8B5CF6" style={{ marginRight: 6 }} />
          <Text style={styles.infoBoxText}>
            Notice and simply log the raw thought without judging its accuracy. We will challenge it next.
          </Text>
        </View>
      </View>
    );
  };

  // Step 2: Selected Cognitive Distortions
  const renderDistortionsStep = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepHeading}>Cognitive Distortions</Text>
        <Text style={styles.stepSubheading}>Select the unhelpful patterns affecting your thoughts (Choose at least one):</Text>

        <View style={styles.distortionsGrid}>
          {cognitiveDistortions.map((distortion, index) => {
            const isSelected = selectedDistortions.includes(distortion);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.distortionChip,
                  isSelected && styles.distortionChipSelected
                ]}
                activeOpacity={0.8}
                onPress={() => toggleDistortion(distortion)}
              >
                <Text style={[
                  styles.distortionText,
                  isSelected && styles.distortionTextSelected
                ]}>
                  {distortion}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <Feather name="info" size={14} color="#8B5CF6" style={{ marginRight: 6 }} />
          <Text style={styles.infoBoxText}>
            Cognitive distortions are mental traps that make us believe false or exaggerated negative conclusions.
          </Text>
        </View>
      </View>
    );
  };

  // Step 3: Fact-Checking Dual inputs
  const renderEvidenceStep = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepHeading}>Evidence Check</Text>
        <Text style={styles.stepSubheading}>Let's fact-check your automatic thoughts objectively.</Text>

        <View style={styles.inputGroupBox}>
          <Text style={styles.inputLabel}>Evidence Supporting Thought</Text>
          <TextInput
            style={styles.evidenceTextInput}
            placeholder="List objective facts that support this thought..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={evidenceFor}
            onChangeText={setEvidenceFor}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroupBox}>
          <Text style={styles.inputLabel}>Evidence Contradicting Thought</Text>
          <TextInput
            style={styles.evidenceTextInput}
            placeholder="List objective facts that contradict this thought..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={evidenceAgainst}
            onChangeText={setEvidenceAgainst}
            textAlignVertical="top"
          />
        </View>
      </View>
    );
  };

  // Step 4: Reframe & Insights
  const renderReframingStep = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepHeading}>Reframing & Learnings</Text>
        <Text style={styles.stepSubheading}>Develop a balanced perspective based on objective facts.</Text>

        <View style={styles.inputGroupBox}>
          <Text style={styles.inputLabel}>Alternative Perspective</Text>
          <TextInput
            style={styles.evidenceTextInput}
            placeholder="Write down a realistic, healthy alternative perspective..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={alternativePerspective}
            onChangeText={setAlternativePerspective}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroupBox}>
          <Text style={styles.inputLabel}>Insights Gained</Text>
          <TextInput
            style={styles.evidenceTextInput}
            placeholder="What did you learn about your thinking patterns?"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={insightsGained}
            onChangeText={setInsightsGained}
            textAlignVertical="top"
          />
        </View>
      </View>
    );
  };

  // Step 5: Link to Emotion (Optional)
  const renderLinkEmotionStep = () => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
        ' ' + 
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepHeading}>Link Recent Emotion</Text>
        <Text style={styles.stepSubheading}>Connect this thought record to a logged mood check-in (optional):</Text>

        {recentEmotions.length === 0 ? (
          <View style={styles.emptyContainerSmall}>
            <Feather name="heart" size={20} color="#94A3B8" style={{ marginBottom: 6 }} />
            <Text style={styles.emptySubtitle}>No recent emotions found.</Text>
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
            {recentEmotions.slice(0, 5).map((emotion: any) => {
              const isSelected = linkedEmotionId === emotion.id;
              return (
                <TouchableOpacity
                  key={emotion.id}
                  style={[
                    styles.linkedEmotionCard,
                    isSelected && styles.linkedEmotionCardActive
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setLinkedEmotionId(isSelected ? null : emotion.id)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 20, marginRight: 8 }}>
                        {emotion.coreEmotion === 'Joy' ? '😊' :
                         emotion.coreEmotion === 'Sadness' ? '😢' :
                         emotion.coreEmotion === 'Fear' ? '😰' :
                         emotion.coreEmotion === 'Anger' ? '😠' :
                         emotion.coreEmotion === 'Surprise' ? '😲' : '😍'}
                      </Text>
                      <View>
                        <Text style={styles.linkedEmotionText}>
                          {emotion.tertiaryEmotion || emotion.primaryEmotion || emotion.coreEmotion} (Intensity: {emotion.intensity}/10)
                        </Text>
                        <Text style={styles.linkedEmotionSub}>{formatDate(emotion.timestamp || emotion.createdAt)}</Text>
                      </View>
                    </View>
                    <View style={[styles.checkboxBoxCompact, isSelected && styles.checkboxBoxChecked]}>
                      {isSelected && <Feather name="check" size={10} color="white" />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  };

  // Sticky bottom navigation for Wizard
  const renderNavButtons = () => {
    if (step === 0) return null;
    const isNextDisabled = !validateStep();

    let nextLabel = "Next";
    if (step === 1 && automaticThoughts.trim().length >= 10) {
      nextLabel = "Identify Traps";
    } else if (step === 2 && selectedDistortions.length > 0) {
      nextLabel = "Fact-Check";
    }

    return (
      <View style={[styles.navigationRow, { paddingBottom: Math.max(12, insets.bottom) }]}>
        <TouchableOpacity 
          style={styles.navBackButton}
          onPress={handlePrevStep}
        >
          <Feather name="chevron-left" size={20} color="#64748B" />
          <Text style={styles.navBackButtonText}>Back</Text>
        </TouchableOpacity>

        {step < 5 ? (
          <TouchableOpacity 
            style={[styles.navNextButton, isNextDisabled && styles.navNextButtonDisabled]}
            disabled={isNextDisabled}
            onPress={handleNextStep}
          >
            <Text style={styles.navNextButtonText} numberOfLines={1}>
              {nextLabel}
            </Text>
            <Feather name="chevron-right" size={18} color="white" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[
              styles.navSubmitButton,
              loading && styles.navSubmitButtonLoading
            ]}
            disabled={loading}
            onPress={handleSave}
          >
            <Text style={styles.navSubmitButtonText}>
              {loading ? 'Saving...' : 'Save Record'}
            </Text>
            {!loading && <Feather name="check-circle" size={18} color="white" style={{ marginLeft: 8 }} />}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSuccessView = () => {
    return (
      <View style={styles.successScreenOverlay}>
        <View style={styles.successCard}>
          <View style={styles.successIconOuterCircle}>
            <View style={styles.successIconCircle}>
              <Feather name="check" size={36} color="white" />
            </View>
          </View>

          <Text style={styles.successTitle}>Thought Record Saved!</Text>
          <Text style={styles.successDescription}>
            Great job challenging your unhelpful thinking.
          </Text>

          <View style={styles.summarySavedData}>
            <Text style={styles.summarySavedDataHeader}>Reframed Summary</Text>
            <View style={{ marginVertical: 4 }}>
              <Text style={styles.summaryDataLabel}>Thought Captured:</Text>
              <Text style={[styles.summaryDataValue, { marginTop: 2 }]} numberOfLines={2}>"{automaticThoughts}"</Text>
            </View>
            <View style={{ marginVertical: 4, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 6 }}>
              <Text style={styles.summaryDataLabel}>Alternative Reframe:</Text>
              <Text style={[styles.summaryDataValue, { color: '#8B5CF6', marginTop: 2 }]} numberOfLines={2}>"{alternativePerspective || 'Not reframed yet'}"</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.successConfirmBtn}
            onPress={handleCloseSuccess}
          >
            <Text style={styles.successConfirmBtnText}>View Thought History</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // --- THOUGHT CARD ACTIONS ---

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' at ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleOpenThoughtMenu = (thought: any) => {
    setSelectedThought(thought);
    setThoughtMenuVisible(true);
  };

  const handleDeleteThoughtConfirm = (thought: any) => {
    Alert.alert(
      'Delete Thought Record?',
      'This will permanently delete this CBT record and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = await SecureStore.getItemAsync('userId');
              if (!userId) return;
              const res = await ApiService.deleteThoughtRecord(parseInt(userId), thought.id);
              if (res.error) {
                Alert.alert('Error', res.error);
              } else {
                loadData();
                Alert.alert('Deleted', 'Thought record has been removed.');
              }
            } catch (e) {
              Alert.alert('Error', 'Failed to delete thought record.');
            }
          }
        }
      ]
    );
  };

  const handleSaveEditThought = async () => {
    if (!selectedThought) return;
    setUpdatingThought(true);
    try {
      const userId = await SecureStore.getItemAsync('userId');
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      const response = await ApiService.updateThoughtRecord(parseInt(userId), selectedThought.id, {
        automaticThoughts: editThoughtText.trim(),
        cognitiveDistortions: editDistortions,
        evidenceFor: editEvidenceFor.trim() || null,
        evidenceAgainst: editEvidenceAgainst.trim() || null,
        alternativePerspective: editAlternative.trim() || null,
        insightsGained: editInsights.trim() || null,
      });
      if (response.error) {
        Alert.alert('Error', response.error);
      } else {
        setThoughtEditVisible(false);
        loadData();
        Alert.alert('Success', 'Thought record updated successfully.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update thought record.');
    } finally {
      setUpdatingThought(false);
    }
  };

  const isThoughtChallenged = (thought: any) =>
    !!(thought.evidenceFor || thought.evidenceAgainst || thought.alternativePerspective);

  const openChallengeWizard = (thought: any) => {
    setSelectedThought(thought);
    setChallengeEvidenceFor(thought.evidenceFor || '');
    setChallengeEvidenceAgainst(thought.evidenceAgainst || '');
    setChallengeAlternative(thought.alternativePerspective || '');
    setChallengeStep(0);
    setChallengeVisible(true);
  };

  const handleSaveChallenge = async () => {
    if (!selectedThought) return;
    setSavingChallenge(true);
    try {
      const userId = await SecureStore.getItemAsync('userId');
      if (!userId) { Alert.alert('Error', 'Not authenticated'); return; }
      const response = await ApiService.updateThoughtRecord(parseInt(userId), selectedThought.id, {
        automaticThoughts: selectedThought.automaticThoughts,
        cognitiveDistortions: selectedThought.cognitiveDistortions || [],
        evidenceFor: challengeEvidenceFor.trim() || null,
        evidenceAgainst: challengeEvidenceAgainst.trim() || null,
        alternativePerspective: challengeAlternative.trim() || null,
        insightsGained: selectedThought.insightsGained || null,
      });
      if (response.error) {
        Alert.alert('Error', response.error);
      } else {
        setChallengeVisible(false);
        loadData();
        Alert.alert('Thought Challenged!', 'Your evidence check and reframe have been saved.');
      }
    } catch {
      Alert.alert('Error', 'Failed to save challenge.');
    } finally {
      setSavingChallenge(false);
    }
  };

  // --- TABS RENDERS ---

  // Tab 2: History
  const renderHistoryTab = () => {
    const filteredThoughts = searchQuery
      ? thoughtRecordsHistory.filter(t => {
          const content = `${t.automaticThoughts} ${t.alternativePerspective || ''} ${t.insightsGained || ''} ${(t.cognitiveDistortions || []).join(' ')}`.toLowerCase();
          return content.includes(searchQuery.toLowerCase());
        })
      : thoughtRecordsHistory;

    if (historyLoading && thoughtRecordsHistory.length === 0) {
      return (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#8B5CF6" />
        </View>
      );
    }

    return (
      <View style={{ padding: 16 }}>
        {/* Search Box */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search thought records..."
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

        {filteredThoughts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="bulb-outline" size={28} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Thought Records</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Adjust your search keywords.' : 'Begin logging thoughts to restructure them.'}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12, paddingBottom: 40 }}>
            {filteredThoughts.map((thought, idx) => (
              <View key={thought.id || idx} style={styles.thoughtCard}>
                {/* Header Row with date, traps badge, and kebab menu */}
                <View style={styles.thoughtCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.thoughtCardDate}>📅 {formatDate(thought.createdAt || thought.timestamp)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {thought.cognitiveDistortions && thought.cognitiveDistortions.length > 0 && (
                      <View style={styles.trapBadge}>
                        <Text style={styles.trapBadgeText}>⚡ {thought.cognitiveDistortions.length} Traps</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.kebabButton}
                      onPress={() => handleOpenThoughtMenu(thought)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Feather name="more-vertical" size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Automatic Thought */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.cardHeaderLabel}>AUTOMATIC THOUGHT</Text>
                  <Text style={styles.cardThoughtText}>"{thought.automaticThoughts}"</Text>
                </View>

                {/* Distortions chips */}
                {thought.cognitiveDistortions && thought.cognitiveDistortions.length > 0 && (
                  <View style={styles.historyChipsRow}>
                    {thought.cognitiveDistortions.map((dist: string, dIdx: number) => (
                      <View key={dIdx} style={styles.historyDistortionChip}>
                        <Text style={styles.historyDistortionChipText}>{dist}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Reframed perspective */}
                {thought.alternativePerspective ? (
                  <View style={styles.cardReframeContainer}>
                    <Text style={styles.cardReframeHeaderLabel}>BALANCED REFRAME</Text>
                    <Text style={styles.cardReframeText}>"{thought.alternativePerspective}"</Text>
                  </View>
                ) : (
                  <View>
                    <View style={styles.cardReframeContainerEmpty}>
                      <Text style={styles.cardReframeHeaderLabelEmpty}>NOT CHALLENGED YET</Text>
                      <Text style={styles.cardReframeTextEmpty}>No evidence check or alternative perspective provided.</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.challengeCardButton}
                      onPress={() => openChallengeWizard(thought)}
                    >
                      <MaterialCommunityIcons name="brain" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.challengeCardButtonText}>Challenge This Thought</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Tab 3: Insights
  const renderInsightsTab = () => {
    const totalThoughts = thoughtRecordsHistory.length;
    const challengedThoughts = thoughtRecordsHistory.filter(t => t.evidenceFor || t.evidenceAgainst).length;
    const reframedThoughts = thoughtRecordsHistory.filter(t => t.alternativePerspective).length;
    const challengeRate = totalThoughts > 0 ? Math.round((challengedThoughts / totalThoughts) * 100) : 0;
    const restructuringRate = totalThoughts > 0 ? Math.round((reframedThoughts / totalThoughts) * 100) : 0;

    // Calculate cognitive distortion breakdown
    const distortionCounts: Record<string, number> = {};
    thoughtRecordsHistory.forEach(thought => {
      if (thought.cognitiveDistortions && Array.isArray(thought.cognitiveDistortions)) {
        thought.cognitiveDistortions.forEach((d: string) => {
          distortionCounts[d] = (distortionCounts[d] || 0) + 1;
        });
      }
    });

    const distortionEntries = Object.entries(distortionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    
    const maxDistortionCount = distortionEntries.length > 0 ? distortionEntries[0][1] : 1;
    let topDistortion = distortionEntries.length > 0 ? {
      name: distortionEntries[0][0],
      count: distortionEntries[0][1],
      percentage: totalThoughts > 0 ? Math.round((distortionEntries[0][1] / totalThoughts) * 100) : 0,
    } : null;

    const ANT_COLORS = ['#a78bfa', '#6366f1', '#ec4899', '#14b8a6', '#3b82f6', '#f59e0b'];

    // Render ANT Patterns bar chart
    const renderANTChart = () => {
      if (distortionEntries.length === 0) {
        return (
          <View style={styles.chartEmptyBlock}>
            <MaterialCommunityIcons name="brain" size={24} color="#94A3B8" />
            <Text style={styles.chartEmptyText}>No distortion data yet</Text>
            <Text style={styles.chartEmptySub}>Log thoughts with distortions to see your patterns</Text>
          </View>
        );
      }

      const chartWidth = width - 64;
      const barHeight = 22;
      const barGap = 10;
      const chartHeight = distortionEntries.length * (barHeight + barGap);
      const labelWidth = 130;
      const barAreaWidth = chartWidth - labelWidth - 40;

      return (
        <Svg width={chartWidth} height={chartHeight + 10}>
          {distortionEntries.map(([name, count], idx) => {
            const barWidth = (count / maxDistortionCount) * barAreaWidth;
            const y = idx * (barHeight + barGap);
            const color = ANT_COLORS[idx % ANT_COLORS.length];
            const shortName = name.length > 16 ? name.substring(0, 14) + '…' : name;
            return (
              <G key={`ant-${idx}`}>
                <SvgText
                  x={0}
                  y={y + barHeight / 2 + 5}
                  fill="#475569"
                  fontSize="9"
                  fontWeight="600"
                >
                  {shortName}
                </SvgText>
                <Rect
                  x={labelWidth}
                  y={y}
                  width={Math.max(barWidth, 4)}
                  height={barHeight}
                  rx={5}
                  fill={color}
                  opacity={0.85}
                />
                <SvgText
                  x={labelWidth + Math.max(barWidth, 4) + 6}
                  y={y + barHeight / 2 + 5}
                  fill="#475569"
                  fontSize="10"
                  fontWeight="700"
                >
                  {count}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      );
    };

    // Compact challenge rate ring (used as a badge in the title row)
    const renderChallengeRing = () => {
      const size = 72;
      const r = 26;
      const cx = size / 2;
      const cy = size / 2;
      const circumference = 2 * Math.PI * r;
      const filled = (challengeRate / 100) * circumference;

      return (
        <View style={{ alignItems: 'center' }}>
          <Svg width={size} height={size}>
            <Circle cx={cx} cy={cy} r={r} stroke="#E2E8F0" strokeWidth={8} fill="none" />
            <Circle
              cx={cx}
              cy={cy}
              r={r}
              stroke="#8B5CF6"
              strokeWidth={8}
              fill="none"
              strokeDasharray={`${filled} ${circumference - filled}`}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
            />
            <SvgText x={cx} y={cy + 4} textAnchor="middle" fill="#1E293B" fontSize="12" fontWeight="800">
              {`${challengeRate}%`}
            </SvgText>
          </Svg>
          <Text style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Challenge Rate</Text>
        </View>
      );
    };

    return (
      <View style={{ padding: 16, paddingBottom: 48 }}>
        {/* KPI Grid */}
        <View style={styles.grid}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#F5F3FF' }]}>
              <MaterialCommunityIcons name="brain" size={16} color="#8B5CF6" />
            </View>
            <Text style={styles.kpiValue}>{totalThoughts}</Text>
            <Text style={styles.kpiLabel}>CBT Logs</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Feather name="check-circle" size={16} color="#10B981" />
            </View>
            <Text style={styles.kpiValue}>{reframedThoughts}</Text>
            <Text style={styles.kpiLabel}>Reframed</Text>
          </View>
        </View>

        {/* Challenge Rate + Restructuring Rate */}
        <View style={styles.metricsCard}>
          {/* Top row: text on left, ring badge on right */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
              <Text style={styles.metricsTitle}>Thought Restructuring</Text>
              <Text style={styles.metricsSub}>
                Thoughts successfully reframed with alternative perspective
              </Text>
            </View>
            {renderChallengeRing()}
          </View>

          {/* Full-width bar — no width competition with the ring */}
          <View style={styles.rateBarBg}>
            <View
              style={{
                height: 8,
                width: `${Math.min(restructuringRate, 100)}%`,
                backgroundColor: '#10B981',
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 }} />
            <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '700' }}>
              {`${restructuringRate}% reframed`}
            </Text>
          </View>
        </View>

        {/* ANT Patterns Bar Chart */}
        {distortionEntries.length > 0 && (
          <View style={styles.metricsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ANT Patterns</Text>
              <Text style={styles.sectionSubtitle}>Your top cognitive distortions</Text>
            </View>
            <View style={{ paddingTop: 8 }}>
              {renderANTChart()}
            </View>
          </View>
        )}

        {/* Distortion Breakdown list */}
        {distortionEntries.length > 0 ? (
          <View style={styles.metricsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Distortion Breakdown</Text>
              <Text style={styles.sectionSubtitle}>Frequency of each cognitive trap</Text>
            </View>
            {distortionEntries.map(([name, count], idx) => {
              const pct = totalThoughts > 0 ? Math.min(Math.round((count / maxDistortionCount) * 100), 100) : 0;
              const color = ANT_COLORS[idx % ANT_COLORS.length];
              return (
                <View key={`dist-${idx}`} style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <Text style={{ fontSize: 12, color: '#334155', fontWeight: '600', flex: 1 }}>{name}</Text>
                    <View style={{ backgroundColor: '#F8FAFC', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700' }}>{count}x</Text>
                    </View>
                  </View>
                  <View style={[styles.rateBarBg, { height: 7 }]}>
                    <View style={[styles.rateBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.distortionEmptyCard}>
            <View style={styles.distortionEmptyIcon}>
              <Feather name="shield" size={20} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.distortionEmptyTitle}>Build CBT Skills</Text>
              <Text style={styles.distortionEmptyText}>
                Identify distortions and use the restructuring wizard to challenge unhelpful thinking traps.
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>

      {/* Segmented Tab Bar */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.tabButton, activeScreenTab === 'record' && styles.activeTabButton]}
            activeOpacity={0.8}
            onPress={() => setActiveScreenTab('record')}
          >
            <Feather 
              name="edit-3" 
              size={13} 
              color={activeScreenTab === 'record' ? '#090514' : '#64748B'} 
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.tabText, activeScreenTab === 'record' && styles.activeTabText]}>Record</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeScreenTab === 'history' && styles.activeTabButton]}
            activeOpacity={0.8}
            onPress={() => setActiveScreenTab('history')}
          >
            <Feather 
              name="clock" 
              size={13} 
              color={activeScreenTab === 'history' ? '#090514' : '#64748B'} 
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.tabText, activeScreenTab === 'history' && styles.activeTabText]}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeScreenTab === 'insights' && styles.activeTabButton]}
            activeOpacity={0.8}
            onPress={() => setActiveScreenTab('insights')}
          >
            <Feather 
              name="trending-up" 
              size={13} 
              color={activeScreenTab === 'insights' ? '#090514' : '#64748B'} 
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.tabText, activeScreenTab === 'insights' && styles.activeTabText]}>Insights</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeScreenTab === 'record' ? (
        <>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {renderProgressHeader()}

            {step === 0 && renderIntroStep()}
            {step === 1 && renderThoughtsStep()}
            {step === 2 && renderDistortionsStep()}
            {step === 3 && renderEvidenceStep()}
            {step === 4 && renderReframingStep()}
            {step === 5 && renderLinkEmotionStep()}
          </ScrollView>

          {renderNavButtons()}
        </>
      ) : activeScreenTab === 'history' ? (
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={['#8B5CF6']} />
          }
        >
          {renderHistoryTab()}
        </ScrollView>
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={['#8B5CF6']} />
          }
        >
          {renderInsightsTab()}
        </ScrollView>
      )}

      {showSuccess && renderSuccessView()}

      {/* Thought Action Menu Modal */}
      <Modal
        visible={thoughtMenuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setThoughtMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setThoughtMenuVisible(false)}
        >
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Thought Actions</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setThoughtMenuVisible(false);
                setThoughtDetailsVisible(true);
              }}
            >
              <Feather name="eye" size={16} color="#475569" style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>View Details</Text>
            </TouchableOpacity>

            {/* Challenge This Thought — only for unchallenged thoughts */}
            {selectedThought && !isThoughtChallenged(selectedThought) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setThoughtMenuVisible(false);
                  openChallengeWizard(selectedThought);
                }}
              >
                <MaterialCommunityIcons name="brain" size={16} color="#8B5CF6" style={styles.menuItemIcon} />
                <Text style={[styles.menuItemText, { color: '#8B5CF6' }]}>Challenge This Thought</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setThoughtMenuVisible(false);
                if (selectedThought) {
                  setEditThoughtText(selectedThought.automaticThoughts || '');
                  setEditDistortions(selectedThought.cognitiveDistortions || []);
                  setEditEvidenceFor(selectedThought.evidenceFor || '');
                  setEditEvidenceAgainst(selectedThought.evidenceAgainst || '');
                  setEditAlternative(selectedThought.alternativePerspective || '');
                  setEditInsights(selectedThought.insightsGained || '');
                }
                setThoughtEditVisible(true);
              }}
            >
              <Feather name="edit-2" size={16} color="#475569" style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setThoughtMenuVisible(false);
                navigation.navigate('ReframeCoach', {
                  practiceThoughtId: selectedThought?.id
                });
              }}
            >
              <Feather name="zap" size={16} color="#475569" style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Practice Reframing</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemDelete]}
              onPress={() => {
                setThoughtMenuVisible(false);
                handleDeleteThoughtConfirm(selectedThought);
              }}
            >
              <Feather name="trash-2" size={16} color="#EF4444" style={styles.menuItemIcon} />
              <Text style={[styles.menuItemText, styles.menuItemDeleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Thought Details Modal */}
      <Modal
        visible={thoughtDetailsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setThoughtDetailsVisible(false)}
      >
        <View style={styles.modalOverlayDark}>
          <View style={styles.detailsModalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Thought Record Details</Text>
              <TouchableOpacity onPress={() => setThoughtDetailsVisible(false)}>
                <Feather name="x" size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>

            {selectedThought && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollDetails}>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Date & Time</Text>
                  <Text style={styles.detailsVal}>{formatDate(selectedThought.createdAt || selectedThought.timestamp)}</Text>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Automatic Thought</Text>
                  <Text style={styles.detailsTextContent}>"{selectedThought.automaticThoughts}"</Text>
                </View>

                {selectedThought.cognitiveDistortions && selectedThought.cognitiveDistortions.length > 0 && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Cognitive Distortions</Text>
                    <View style={[styles.historyChipsRow, { marginTop: 6 }]}>
                      {selectedThought.cognitiveDistortions.map((d: string, i: number) => (
                        <View key={i} style={styles.historyDistortionChip}>
                          <Text style={styles.historyDistortionChipText}>{d}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {selectedThought.evidenceFor && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Evidence For</Text>
                    <Text style={styles.detailsTextContent}>{selectedThought.evidenceFor}</Text>
                  </View>
                )}

                {selectedThought.evidenceAgainst && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Evidence Against</Text>
                    <Text style={styles.detailsTextContent}>{selectedThought.evidenceAgainst}</Text>
                  </View>
                )}

                {selectedThought.alternativePerspective && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Balanced Reframe</Text>
                    <View style={[styles.cardReframeContainer, { marginTop: 6 }]}>
                      <Text style={styles.cardReframeText}>"{selectedThought.alternativePerspective}"</Text>
                    </View>
                  </View>
                )}

                {selectedThought.insightsGained && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Insights Gained</Text>
                    <Text style={styles.detailsTextContent}>{selectedThought.insightsGained}</Text>
                  </View>
                )}

                {!selectedThought.alternativePerspective && (
                  <TouchableOpacity
                    style={styles.detailsCtaButton}
                    onPress={() => {
                      setThoughtDetailsVisible(false);
                      navigation.navigate('ReframeCoach', {
                        practiceThoughtId: selectedThought.id
                      });
                    }}
                  >
                    <Feather name="zap" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.detailsCtaText}>Challenge This Thought</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Thought Edit Modal */}
      <Modal
        visible={thoughtEditVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setThoughtEditVisible(false)}
      >
        <View style={styles.modalOverlayDark}>
          <View style={styles.editModalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Edit Thought Record</Text>
              <TouchableOpacity onPress={() => setThoughtEditVisible(false)}>
                <Feather name="x" size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollDetails}>
              <View style={styles.detailsRow}>
                <Text style={styles.inputLabel}>Automatic Thought</Text>
                <TextInput
                  style={styles.detailsTextInput}
                  multiline
                  numberOfLines={3}
                  value={editThoughtText}
                  onChangeText={setEditThoughtText}
                  placeholder="Describe your automatic thought..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.inputLabel}>Cognitive Distortions</Text>
                <View style={styles.distortionsGrid}>
                  {cognitiveDistortions.map((d, i) => {
                    const isSelected = editDistortions.includes(d);
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.distortionChip,
                          isSelected && styles.distortionChipSelected
                        ]}
                        onPress={() => {
                          setEditDistortions(prev =>
                            prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
                          );
                        }}
                      >
                        <Text style={[
                          styles.distortionText,
                          isSelected && styles.distortionTextSelected
                        ]}>{d}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.inputLabel}>Evidence For</Text>
                <TextInput
                  style={styles.detailsTextInput}
                  multiline
                  numberOfLines={3}
                  value={editEvidenceFor}
                  onChangeText={setEditEvidenceFor}
                  placeholder="Facts supporting this thought..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.inputLabel}>Evidence Against</Text>
                <TextInput
                  style={styles.detailsTextInput}
                  multiline
                  numberOfLines={3}
                  value={editEvidenceAgainst}
                  onChangeText={setEditEvidenceAgainst}
                  placeholder="Facts contradicting this thought..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.inputLabel}>Balanced Reframe</Text>
                <TextInput
                  style={styles.detailsTextInput}
                  multiline
                  numberOfLines={3}
                  value={editAlternative}
                  onChangeText={setEditAlternative}
                  placeholder="A more balanced perspective..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.inputLabel}>Insights Gained</Text>
                <TextInput
                  style={styles.detailsTextInput}
                  multiline
                  numberOfLines={2}
                  value={editInsights}
                  onChangeText={setEditInsights}
                  placeholder="What did you learn?"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <TouchableOpacity
                style={[styles.saveEditButton, { backgroundColor: '#8B5CF6' }]}
                onPress={handleSaveEditThought}
                disabled={updatingThought}
              >
                {updatingThought ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveEditText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Challenge This Thought Wizard Modal */}
      <Modal
        visible={challengeVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChallengeVisible(false)}
      >
        <View style={styles.modalOverlayDark}>
          <View style={styles.editModalContent}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.modalHeaderTitle}>Challenge This Thought</Text>
                <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                  Step {challengeStep + 1} of 3
                </Text>
              </View>
              <TouchableOpacity onPress={() => setChallengeVisible(false)}>
                <Feather name="x" size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>

            {/* Progress dots */}
            <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingBottom: 12 }}>
              {[0, 1, 2].map(i => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: i <= challengeStep ? '#8B5CF6' : '#E2E8F0',
                  }}
                />
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollDetails}>
              {/* Thought being challenged */}
              {selectedThought && (
                <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 16 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    Automatic Thought
                  </Text>
                  <Text style={{ fontSize: 13, color: '#334155', fontStyle: 'italic', lineHeight: 18 }}>
                    "{selectedThought.automaticThoughts}"
                  </Text>
                </View>
              )}

              {/* Step 0 — Evidence For */}
              {challengeStep === 0 && (
                <View>
                  <Text style={styles.inputLabel}>Evidence FOR this thought</Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 8, lineHeight: 17 }}>
                    What facts or observations support this thought being true?
                  </Text>
                  <TextInput
                    style={[styles.detailsTextInput, { minHeight: 100 }]}
                    multiline
                    placeholder="e.g. My boss did seem frustrated in the meeting..."
                    placeholderTextColor="#94A3B8"
                    value={challengeEvidenceFor}
                    onChangeText={setChallengeEvidenceFor}
                    textAlignVertical="top"
                  />
                </View>
              )}

              {/* Step 1 — Evidence Against */}
              {challengeStep === 1 && (
                <View>
                  <Text style={styles.inputLabel}>Evidence AGAINST this thought</Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 8, lineHeight: 17 }}>
                    What facts or observations challenge or contradict this thought?
                  </Text>
                  <TextInput
                    style={[styles.detailsTextInput, { minHeight: 100 }]}
                    multiline
                    placeholder="e.g. He praised my work last week and said nothing after the meeting..."
                    placeholderTextColor="#94A3B8"
                    value={challengeEvidenceAgainst}
                    onChangeText={setChallengeEvidenceAgainst}
                    textAlignVertical="top"
                  />
                </View>
              )}

              {/* Step 2 — Balanced Reframe */}
              {challengeStep === 2 && (
                <View>
                  <Text style={styles.inputLabel}>Balanced Alternative Perspective</Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 8, lineHeight: 17 }}>
                    Based on all the evidence, what is a more balanced and realistic way to view this situation?
                  </Text>
                  <TextInput
                    style={[styles.detailsTextInput, { minHeight: 120 }]}
                    multiline
                    placeholder="e.g. While my boss may be stressed, there's no clear evidence he's upset with me specifically..."
                    placeholderTextColor="#94A3B8"
                    value={challengeAlternative}
                    onChangeText={setChallengeAlternative}
                    textAlignVertical="top"
                  />
                </View>
              )}

              {/* Navigation buttons */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                {challengeStep > 0 && (
                  <TouchableOpacity
                    style={[styles.saveEditButton, { flex: 1, backgroundColor: '#F1F5F9' }]}
                    onPress={() => setChallengeStep(s => s - 1)}
                  >
                    <Text style={[styles.saveEditText, { color: '#475569' }]}>Back</Text>
                  </TouchableOpacity>
                )}

                {challengeStep < 2 ? (
                  <TouchableOpacity
                    style={[styles.saveEditButton, { flex: 1, backgroundColor: '#8B5CF6' }]}
                    onPress={() => setChallengeStep(s => s + 1)}
                  >
                    <Text style={styles.saveEditText}>Next</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.saveEditButton, { flex: 1, backgroundColor: savingChallenge ? '#A78BFA' : '#10B981' }]}
                    onPress={handleSaveChallenge}
                    disabled={savingChallenge}
                  >
                    {savingChallenge ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveEditText}>Save Challenge</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  appHeaderBar: {
    height: 56,
    backgroundColor: '#090514',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeftBtn: {
    width: 32,
    alignItems: 'flex-start',
  },
  headerRightBtn: {
    width: 32,
    alignItems: 'flex-end',
  },
  headerBarTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Tab Pill Bar styling
  tabBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
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
    color: '#090514',
  },

  // Progress Bar Styles
  progressHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressStepNum: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  progressStepName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },

  // Welcome Step (Step 0)
  introContainer: {
    padding: 20,
    alignItems: 'stretch',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  heroGradientCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F3FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#090514',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.25,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  featureList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  featureIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  featureTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  featureDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },
  introStartButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 10,
  },
  introStartButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Steps common wrapper
  stepContainer: {
    padding: 16,
  },
  stepHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#090514',
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  stepSubheading: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },

  // Text inputs & layouts
  inputGroupBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  textareaInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    fontSize: 13,
    color: '#1E293B',
    height: 100,
  },
  evidenceTextInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    fontSize: 13,
    color: '#1E293B',
    height: 80,
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  charWarningText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '600',
  },
  charSuccessText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  charCounter: {
    fontSize: 10,
    color: '#94A3B8',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  infoBoxText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#5B21B6',
    lineHeight: 16,
  },

  // Cognitive Distortions grid
  distortionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  distortionChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  distortionChipSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  distortionText: {
    fontSize: 12,
    color: '#475569',
  },
  distortionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },

  // Linked Emotions Screen
  linkedEmotionCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  linkedEmotionCardActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#8B5CF6',
  },
  linkedEmotionText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  linkedEmotionSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  emptyContainerSmall: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Navigation rows
  navigationRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  navBackButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748B',
    marginLeft: 2,
  },
  navNextButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
  },
  navNextButtonDisabled: {
    backgroundColor: '#C4B5FD',
  },
  navNextButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  navSubmitButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  navSubmitButtonLoading: {
    backgroundColor: '#059669',
  },
  navSubmitButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Success Screen overlay
  successScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(9, 5, 20, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  successCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconOuterCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#090514',
    marginBottom: 4,
  },
  successDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  summarySavedData: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  summarySavedDataHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
  },
  summaryDataLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  summaryDataValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  successConfirmBtn: {
    backgroundColor: '#8B5CF6',
    height: 44,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  successConfirmBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // History Tab Styles
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
  checkboxBoxChecked: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  checkboxBoxCompact: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Thought History Cards
  thoughtCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderLeftWidth: 5,
    borderLeftColor: '#8B5CF6',
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  thoughtCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  thoughtCardDate: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  trapBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trapBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#8B5CF6',
  },
  cardHeaderLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardThoughtText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    fontWeight: 'bold',
  },
  historyChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  historyDistortionChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  historyDistortionChipText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  cardReframeContainer: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  cardReframeHeaderLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#8B5CF6',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardReframeText: {
    fontSize: 12,
    color: '#5B21B6',
    lineHeight: 18,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  cardReframeContainerEmpty: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  cardReframeHeaderLabelEmpty: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardReframeTextEmpty: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
  },
  challengeCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    paddingVertical: 9,
    marginTop: 8,
  },
  challengeCardButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Insights / Analytics tab
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 12,
    width: (width - 32 - 10) / 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  kpiIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#090514',
  },
  kpiLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  metricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricsTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#090514',
  },
  metricsRateNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#8B5CF6',
  },
  metricsSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 3,
    marginBottom: 0,
  },
  rateBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  rateBarFill: {
    height: 8,
    backgroundColor: '#8B5CF6',
  },
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
  },
  distortionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  distortionBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  distortionBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#8B5CF6',
  },
  distortionStats: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  distortionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#090514',
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
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  distortionEmptyTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#090514',
    marginBottom: 4,
  },
  distortionEmptyText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },

  // Kebab menu button on cards
  kebabButton: {
    padding: 4,
    borderRadius: 6,
  },

  // Section headers (insights)
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#090514',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Chart empty states
  chartEmptyBlock: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  chartEmptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 8,
  },
  chartEmptySub: {
    fontSize: 11,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 4,
  },

  // Action Menu Modal (fade overlay, bottom-sheet style)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  menuContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuItemIcon: {
    marginRight: 14,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  menuItemDelete: {
    borderBottomWidth: 0,
  },
  menuItemDeleteText: {
    color: '#EF4444',
  },

  // Details / Edit Modals (slide-up panels)
  modalOverlayDark: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailsModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
  },
  editModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#090514',
  },
  scrollDetails: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  detailsRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  detailsLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  detailsVal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  detailsTextContent: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  detailsTextInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    fontSize: 13,
    color: '#1E293B',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  detailsCtaButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    marginTop: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  detailsCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  saveEditButton: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveEditText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});