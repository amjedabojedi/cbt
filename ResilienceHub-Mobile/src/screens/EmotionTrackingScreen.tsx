import React, { useState } from 'react';
import { COLORS } from '../styles/theme';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
  Dimensions,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useEmotions } from '../hooks/queries/useEmotions';
import Svg, { Path, Circle, G, Text as SvgText, Line, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';


interface EmotionTrackingScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

interface EmotionGroup {
  core: string;
  emoji: string;
  color: string;
  lightColor: string;
  textColor: string;
  primary: string[];
  tertiary: string[][];
}

const emotionGroups: EmotionGroup[] = [
  {
    core: "Joy",
    emoji: "😊",
    color: "#D69E2E", // Gold
    lightColor: "#FEF08A",
    textColor: "#854D0E",
    primary: ["Cheerfulness", "Contentment", "Pride", "Optimism", "Enthusiasm", "Love"],
    tertiary: [
      ["Amusement", "Bliss", "Delight", "Elation", "Happiness", "Jubilation"],
      ["Calmness", "Comfort", "Relaxation", "Relief", "Satisfaction", "Serenity"],
      ["Achievement", "Confidence", "Dignity", "Fulfillment", "Success", "Triumph"],
      ["Eagerness", "Hope", "Inspiration", "Motivation", "Positivity", "Trust"],
      ["Excitement", "Exhilaration", "Passion", "Pleasure", "Thrill", "Zeal"],
      ["Adoration", "Affection", "Attraction", "Caring", "Compassion", "Tenderness"]
    ]
  },
  {
    core: "Sadness",
    emoji: "😢",
    color: "#3182CE", // Blue
    lightColor: "#DBEAFE",
    textColor: "#1E40AF",
    primary: ["Neglect", "Loneliness", "Disappointment", "Shame", "Suffering", "Sadness"],
    tertiary: [
      ["Abandonment", "Alienation", "Exclusion", "Isolation", "Rejection", "Unwanted"],
      ["Defeat", "Dejection", "Gloom", "Hopelessness", "Hurt", "Unhappiness"],
      ["Embarrassment", "Guilt", "Humiliation", "Insecurity", "Regret", "Self-consciousness"],
      ["Agony", "Anguish", "Despair", "Grief", "Misery", "Pain"],
      ["Depression", "Despair", "Melancholy", "Sorrow", "Unhappiness", "Woe"],
      ["Disconnection", "Emptiness", "Homesickness", "Longing", "Missing", "Nostalgia"]
    ]
  },
  {
    core: "Fear",
    emoji: "😰",
    color: "#38A169", // Green
    lightColor: "#D1FAE5",
    textColor: "#065F46",
    primary: ["Horror", "Nervousness", "Insecurity", "Terror", "Worry", "Fear"],
    tertiary: [
      ["Alarm", "Dread", "Fright", "Panic", "Shock", "Startled"],
      ["Anxiety", "Apprehension", "Discomfort", "Edginess", "Restlessness", "Tension"],
      ["Distrust", "Helplessness", "Inadequacy", "Self-doubt", "Uncertainty", "Vulnerability"],
      ["Dread", "Horror", "Hysteria", "Mortification", "Panic", "Paralysis"],
      ["Apprehension", "Concern", "Distress", "Foreboding", "Nervousness", "Uneasiness"],
      ["Angst", "Disquiet", "Dread", "Nervousness", "Tenseness", "Unease"]
    ]
  },
  {
    core: "Anger",
    emoji: "😠",
    color: "#E53E3E", // Red
    lightColor: "#FEE2E2",
    textColor: "#991B1B",
    primary: ["Rage", "Exasperation", "Irritability", "Envy", "Disgust", "Anger"],
    tertiary: [
      ["Bitterness", "Ferocity", "Fury", "Hate", "Outrage", "Wrath"],
      ["Frustration", "Agitation", "Distress", "Impatience", "Stress", "Tension"],
      ["Aggravation", "Annoyance", "Contempt", "Grouchiness", "Grumpiness", "Irritation"],
      ["Covetousness", "Discontentment", "Jealousy", "Longing", "Resentment", "Rivalry"],
      ["Abhorrence", "Aversion", "Distaste", "Nausea", "Repugnance", "Revulsion"],
      ["Aggression", "Betrayal", "Hostility", "Indignation", "Offense", "Vengefulness"]
    ]
  },
  {
    core: "Surprise",
    emoji: "😲",
    color: "#6B46C1", // Purple
    lightColor: "#F3E8FF",
    textColor: "#064e3b",
    primary: ["Amazement", "Confusion", "Excitement", "Awe", "Shock", "Surprise"],
    tertiary: [
      ["Astonishment", "Bewilderment", "Fascination", "Intrigue", "Wonder", "Wow"],
      ["Bewilderment", "Disorientation", "Perplexity", "Puzzlement", "Uncertainty", "Unclarity"],
      ["Eagerness", "Elation", "Enthusiasm", "Exhilaration", "Stimulation", "Thrill"],
      ["Admiration", "Appreciation", "Esteem", "Regard", "Respect", "Reverence"],
      ["Disbelief", "Disturbance", "Jolted", "Stunned", "Stupefaction", "Unsettled"],
      ["Astonishment", "Disbelief", "Distraction", "Impressed", "Startled", "Wonder"]
    ]
  },
  {
    core: "Love",
    emoji: "😍",
    color: "#E6338F", // Pink
    lightColor: "#FCE7F3",
    textColor: "#9D174D",
    primary: ["Acceptance", "Trust", "Admiration", "Adoration", "Desire", "Peace"],
    tertiary: [
      ["Acknowledgment", "Appreciation", "Empathy", "Kindness", "Tolerance", "Understanding"],
      ["Assurance", "Belief", "Certainty", "Confidence", "Faith", "Reliability"],
      ["Approval", "Esteem", "Regard", "Respect", "Reverence", "Worship"],
      ["Affection", "Devotion", "Fondness", "Infatuation", "Liking", "Passion"],
      ["Attraction", "Craving", "Infatuation", "Longing", "Lust", "Yearning"],
      ["Bliss", "Contentment", "Harmony", "Serenity", "Tranquility", "Well-being"]
    ]
  }
];

const EXAMPLE_SITUATIONS = [
  "My boss criticized my work in front of the team",
  "My friend canceled plans at the last minute",
  "I received unexpected positive feedback today",
];

export default function EmotionTrackingScreen({ navigation }: EmotionTrackingScreenProps) {
  const insets = useSafeAreaInsets();
  // Wizard state
  const [step, setStep] = useState(0); // 0: Intro, 1: Select, 2: Rate, 3: Describe, 4: Context
  const [activeScreenTab, setActiveScreenTab] = useState<'record' | 'history' | 'insights'>('record');
  const { userId } = useAuth();
  const emotionsQ = useEmotions(userId);
  const emotionsHistory = emotionsQ.data ?? [];
  const historyLoading = emotionsQ.isLoading;
  const refreshing = emotionsQ.isRefetching;
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action Menu, Details, and Edit States
  const [selectedEmotion, setSelectedEmotion] = useState<any | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  // Edit fields state
  const [editIntensity, setEditIntensity] = useState<number>(5);
  const [editSituation, setEditSituation] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [updatingEmotion, setUpdatingEmotion] = useState(false);

  const loadHistoryData = () => emotionsQ.refetch();

  // Form selections
  const [selectedCoreIndex, setSelectedCoreIndex] = useState<number | null>(null);
  const [selectedPrimaryIndex, setSelectedPrimaryIndex] = useState<number | null>(null);
  const [selectedTertiaryName, setSelectedTertiaryName] = useState<string | null>(null);
  
  const [intensity, setIntensity] = useState<number>(5);
  const [situation, setSituation] = useState<string>('');
  
  const [location, setLocation] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  
  const [useCurrentTime, setUseCurrentTime] = useState<boolean>(true);
  const [timeOffset, setTimeOffset] = useState<number>(0); // in minutes ago
  
  const [loading, setLoading] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  // Helper getters
  const activeCore = selectedCoreIndex !== null ? emotionGroups[selectedCoreIndex] : null;
  const activePrimary = (activeCore && selectedPrimaryIndex !== null) ? activeCore.primary[selectedPrimaryIndex] : null;
  const activeTertiary = selectedTertiaryName;

  // Active emotion string for headings
  const getActiveEmotionName = () => {
    return activeTertiary || activePrimary || (activeCore ? activeCore.core : 'your emotion');
  };

  const getIntensityLabel = (value: number) => {
    if (value <= 2) return 'Mild';
    if (value <= 4) return 'Moderate';
    if (value <= 6) return 'Strong';
    if (value <= 8) return 'Intense';
    return 'Overwhelming';
  };

  const handlePresetTimeOffset = (mins: number) => {
    setTimeOffset(mins);
    setUseCurrentTime(false);
  };

  const getFormattedTime = () => {
    const d = new Date();
    if (!useCurrentTime) {
      d.setMinutes(d.getMinutes() - timeOffset);
    }
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const resetEmotionSelection = () => {
    setSelectedCoreIndex(null);
    setSelectedPrimaryIndex(null);
    setSelectedTertiaryName(null);
  };

  const validateStep = () => {
    if (step === 1 && !activeCore) return false;
    if (step === 3 && situation.trim().length < 10) return false;
    return true;
  };

  const handleNextStep = () => {
    if (validateStep() && step < 4) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSaveEmotion = async () => {
    if (!activeCore) {
      Alert.alert('Please select an emotion');
      return;
    }
    if (situation.trim().length < 10) {
      Alert.alert('Please describe the situation in at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      if (!userId) {
        Alert.alert('Error', 'Please log in again');
        return;
      }

      // Calculate timestamp
      const timestampDate = new Date();
      if (!useCurrentTime) {
        timestampDate.setMinutes(timestampDate.getMinutes() - timeOffset);
      }

      const emotionPayload = {
        coreEmotion: activeCore.core,
        primaryEmotion: activePrimary || undefined,
        tertiaryEmotion: activeTertiary || undefined,
        intensity,
        situation: situation.trim(),
        location: location || null,
        company: company || null,
        timestamp: timestampDate.toISOString(),
      };

      const response = await ApiService.createEmotion(userId, emotionPayload);

      if (response.data) {
        setShowSuccess(true);
        loadHistoryData();
      } else {
        Alert.alert('Error', response.error || 'Failed to save emotion');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setStep(0);
    resetEmotionSelection();
    setIntensity(5);
    setSituation('');
    setLocation('');
    setCompany('');
    setUseCurrentTime(true);
    setTimeOffset(0);
    setActiveScreenTab('history');
  };

  // --- RENDERS ---

  // Progress Bar Header (Compact)
  const renderProgressHeader = () => {
    if (step === 0) return null;
    const progressPercent = (step / 4) * 100;
    const stepNames = ['Intro', 'Select', 'Rate', 'Describe', 'Context'];

    return (
      <View style={styles.progressHeaderContainer}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressStepNum}>Step {step} of 4</Text>
          <Text style={styles.progressStepName}>{stepNames[step]}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>
    );
  };

  // Step 0: Onboarding Welcome Screen (Compressed, fits on screen)
  const renderIntroStep = () => {
    return (
      <View style={styles.introContainer}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroGradientCircle}>
            <MaterialCommunityIcons name="heart-pulse" size={32} color={COLORS.primaryGreen} />
          </View>
          <Text style={styles.heroTitle}>Track Your Mood</Text>
          <Text style={styles.heroSubtitle}>
            Naming your emotions helps reduce their impact and builds cognitive resilience.
          </Text>
        </View>

        {/* Vertical Features List (Compact) */}
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconWrapper}>
              <Feather name="git-merge" size={16} color={COLORS.primaryGreen} />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureLabel}>Identify Nuances</Text>
              <Text style={styles.featureDescription}>
                Drill down to find the exact primary and tertiary feeling.
              </Text>
            </View>
          </View>
          
          <View style={styles.featureDivider} />

          <View style={styles.featureItem}>
            <View style={styles.featureIconWrapper}>
              <Feather name="bar-chart-2" size={16} color={COLORS.primaryGreen} />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureLabel}>Measure Intensity</Text>
              <Text style={styles.featureDescription}>
                Quantify your feeling on a scale of 1 to 10.
              </Text>
            </View>
          </View>
          
          <View style={styles.featureDivider} />

          <View style={styles.featureItem}>
            <View style={styles.featureIconWrapper}>
              <Feather name="edit-3" size={16} color={COLORS.primaryGreen} />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureLabel}>Pinpoint Triggers</Text>
              <Text style={styles.featureDescription}>
                Log what happened to notice external triggers.
              </Text>
            </View>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity 
          style={styles.introStartButton}
          activeOpacity={0.85}
          onPress={() => setStep(1)}
        >
          <Text style={styles.introStartButtonText}>Begin Tracking</Text>
          <Feather name="arrow-right" size={18} color="white" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    );
  };

  // Helper to get variations of a base hex color by adjusting opacity/shade
  const getVariationColor = (hex: string, index: number, total: number, isTertiary: boolean = false) => {
    const opacities = ['FF', 'E6', 'CC', 'B3', '99', '80'];
    const idx = index % opacities.length;
    if (isTertiary) {
      const tertOpacities = ['E6', 'CC', 'B3', '99', '80', '66'];
      return hex + tertOpacities[idx];
    }
    return hex + opacities[idx];
  };

  const handleSectorPress = (index: number) => {
    if (selectedCoreIndex === null) {
      setSelectedCoreIndex(index);
      setSelectedPrimaryIndex(null);
      setSelectedTertiaryName(null);
    } else if (selectedPrimaryIndex === null) {
      setSelectedPrimaryIndex(index);
      setSelectedTertiaryName(null);
    } else {
      const core = emotionGroups[selectedCoreIndex];
      const tertOptions = core.tertiary[selectedPrimaryIndex] || [];
      const item = tertOptions[index];
      setSelectedTertiaryName(selectedTertiaryName === item ? null : item);
    }
  };

  const handleCenterPress = () => {
    if (selectedPrimaryIndex !== null) {
      setSelectedPrimaryIndex(null);
      setSelectedTertiaryName(null);
    } else if (selectedCoreIndex !== null) {
      setSelectedCoreIndex(null);
    }
  };

  // SVG Emotion Wheel (Sized down to 250 to fit without scrolling)
  const renderSvgWheel = () => {
    const size = 250;
    const center = size / 2;
    const r1 = 38; // Inner radius (for center circle)
    const r2 = 118; // Outer radius (for wheel segments)
    const rText = (r1 + r2) / 2; // Label center point

    // Determine current level options
    let items: { label: string; emoji?: string; color: string; textColor: string }[] = [];
    let centerLabel = "";
    let centerEmoji = "";
    let centerColor = COLORS.darkGreen;

    if (selectedCoreIndex === null) {
      // Core level
      items = emotionGroups.map(g => ({
        label: g.core,
        emoji: g.emoji,
        color: g.color,
        textColor: "white"
      }));
      centerLabel = "TAP EMOTION";
      centerEmoji = "👆";
      centerColor = COLORS.darkGreen;
    } else if (selectedPrimaryIndex === null) {
      // Primary level
      const core = emotionGroups[selectedCoreIndex];
      items = core.primary.map((p, idx) => ({
        label: p,
        color: getVariationColor(core.color, idx, 6),
        textColor: "white"
      }));
      centerLabel = core.core;
      centerEmoji = core.emoji;
      centerColor = core.color;
    } else {
      // Tertiary level
      const core = emotionGroups[selectedCoreIndex];
      const prim = core.primary[selectedPrimaryIndex];
      const tertOptions = core.tertiary[selectedPrimaryIndex] || [];
      items = tertOptions.map((t, idx) => ({
        label: t,
        color: getVariationColor(core.color, idx, 6, true),
        textColor: selectedTertiaryName === t ? COLORS.darkGreen : "white"
      }));
      centerLabel = prim;
      centerEmoji = core.emoji;
      centerColor = core.color;
    }

    const angle = Math.PI / 3; // 60 degrees

    return (
      <View style={styles.wheelWrapper}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Outer sectors */}
          {items.map((item, idx) => {
            const startAngle = idx * angle - Math.PI / 2;
            const endAngle = (idx + 1) * angle - Math.PI / 2;
            const midAngle = (startAngle + endAngle) / 2;

            const x1_in = center + r1 * Math.cos(startAngle);
            const y1_in = center + r1 * Math.sin(startAngle);
            const x1_out = center + r2 * Math.cos(startAngle);
            const y1_out = center + r2 * Math.sin(startAngle);
            const x2_out = center + r2 * Math.cos(endAngle);
            const y2_out = center + r2 * Math.sin(endAngle);
            const x2_in = center + r1 * Math.cos(endAngle);
            const y2_in = center + r1 * Math.sin(endAngle);

            const pathData = `M ${x1_in} ${y1_in} L ${x1_out} ${y1_out} A ${r2} ${r2} 0 0 1 ${x2_out} ${y2_out} L ${x2_in} ${y2_in} A ${r1} ${r1} 0 0 0 ${x1_in} ${y1_in} Z`;

            // Calculate rotation for text alignment
            let rotation = (midAngle * 180) / Math.PI;
            if (rotation > 90 && rotation < 270) {
              rotation += 180;
            }

            const xText = center + rText * Math.cos(midAngle);
            const yText = center + rText * Math.sin(midAngle);

            const isSelected = selectedCoreIndex !== null && selectedPrimaryIndex !== null && selectedTertiaryName === item.label;

            return (
              <G key={idx}>
                {/* Sector Path */}
                <Path
                  d={pathData}
                  fill={isSelected ? "#FFFFFF" : item.color}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                  onPress={() => handleSectorPress(idx)}
                />

                {/* Rotated text labels */}
                <G transform={`translate(${xText}, ${yText}) rotate(${rotation})`}>
                  {item.emoji ? (
                    <>
                      <SvgText
                        x={0}
                        y={-8}
                        fontSize={12}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                      >
                        {item.emoji}
                      </SvgText>
                      <SvgText
                        x={0}
                        y={8}
                        fontSize={9}
                        fontWeight="bold"
                        fill="white"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                      >
                        {item.label}
                      </SvgText>
                    </>
                  ) : (
                    <SvgText
                      x={0}
                      y={3}
                      fontSize={item.label.length > 10 ? 7.5 : 8.5}
                      fontWeight="bold"
                      fill={isSelected ? COLORS.darkGreen : "white"}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {item.label}
                    </SvgText>
                  )}
                </G>
              </G>
            );
          })}

          {/* Center Circle Button */}
          <Circle
            cx={center}
            cy={center}
            r={r1}
            fill={centerColor}
            stroke="#FFFFFF"
            strokeWidth={3}
            onPress={handleCenterPress}
          />
          
          {/* Center text / Icon */}
          <G transform={`translate(${center}, ${center})`}>
            {selectedCoreIndex !== null ? (
              <>
                <SvgText
                  x={0}
                  y={-8}
                  fontSize={12}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {centerEmoji}
                </SvgText>
                <SvgText
                  x={0}
                  y={10}
                  fontSize={8}
                  fontWeight="bold"
                  fill="white"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  ← BACK
                </SvgText>
              </>
            ) : (
              <>
                <SvgText
                  x={0}
                  y={-4}
                  fontSize={14}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {centerEmoji}
                </SvgText>
                <SvgText
                  x={0}
                  y={10}
                  fontSize={8}
                  fontWeight="bold"
                  fill="white"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {centerLabel}
                </SvgText>
              </>
            )}
          </G>
        </Svg>
      </View>
    );
  };

  // Step 1: Selection Screen
  const renderSelectionStep = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepHeading}>Track Your Emotion</Text>
        <Text style={styles.stepSubheading}>👉 Tap a segment on the wheel below to select your feelings</Text>

        {/* Selected Path Breadcrumbs (Compact) */}
        {renderSelectionPath()}

        {/* SVG Emotion Wheel */}
        {renderSvgWheel()}

        {/* Selection Instructions Guide (Compact) */}
        <View style={styles.selectionGuideBox}>
          <Feather name="info" size={14} color={COLORS.primaryGreen} style={{ marginRight: 6 }} />
          <Text style={styles.selectionGuideText}>
            {selectedCoreIndex === null 
              ? "👉 Tap any colored slice on the wheel above to select a core emotion."
              : selectedPrimaryIndex === null
              ? "👉 Tap an outer slice to choose a primary variation, or tap the center circle ↩️ to go back."
              : "👉 Tap an outer slice to choose a specific tertiary feeling, or tap the center circle ↩️ to go back."}
          </Text>
        </View>
      </View>
    );
  };

  // Selected Path Trail (Compact)
  const renderSelectionPath = () => {
    if (!activeCore) return null;
    return (
      <View style={styles.trailCard}>
        <View style={styles.trailHeaderRow}>
          <Text style={styles.trailLabel}>Selected Path:</Text>
          <TouchableOpacity onPress={resetEmotionSelection}>
            <Text style={styles.trailResetText}>Reset</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.trailRow}>
          <View style={[styles.trailChip, { backgroundColor: activeCore.lightColor }]}>
            <Text style={[styles.trailChipText, { color: activeCore.textColor }]}>{activeCore.emoji} {activeCore.core}</Text>
          </View>
          {activePrimary && (
            <>
              <Feather name="arrow-right" size={10} color="#94A3B8" style={{ marginHorizontal: 2 }} />
              <View style={[styles.trailChip, { backgroundColor: activeCore.lightColor }]}>
                <Text style={[styles.trailChipText, { color: activeCore.textColor }]}>{activePrimary}</Text>
              </View>
            </>
          )}
          {activeTertiary && (
            <>
              <Feather name="arrow-right" size={10} color="#94A3B8" style={{ marginHorizontal: 2 }} />
              <View style={[styles.trailChip, { backgroundColor: activeCore.color }]}>
                <Text style={[styles.trailChipText, { color: 'white', fontWeight: 'bold' }]}>{activeTertiary}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  // Step 2: Intensity Rating (Compact)
  const renderIntensityStep = () => {
    return (
      <View style={styles.stepContainer}>
        {renderSelectionPath()}

        <Text style={styles.stepHeading}>Rate Intensity</Text>
        <Text style={styles.stepSubheading}>How strongly did you feel {getActiveEmotionName().toLowerCase()}?</Text>

        <View style={styles.intensityCardBox}>
          <Text style={styles.intensityBigDisplay}>
            {intensity} <Text style={{ fontSize: 16, color: '#64748B' }}>/10</Text>
          </Text>
          <View style={[styles.intensityBadge, { backgroundColor: activeCore?.lightColor || '#F3E8FF' }]}>
            <Text style={[styles.intensityBadgeText, { color: activeCore?.textColor || '#064e3b' }]}>
              {getIntensityLabel(intensity)}
            </Text>
          </View>

          <View style={styles.sliderButtonsGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
              const isSelected = intensity === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.intensityCircleBtn,
                    isSelected && [styles.intensityCircleBtnActive, { backgroundColor: activeCore?.color || COLORS.primaryGreen }]
                  ]}
                  onPress={() => setIntensity(val)}
                >
                  <Text style={[
                    styles.intensityCircleBtnText,
                    isSelected && styles.intensityCircleBtnTextActive
                  ]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.intensityLabelRow}>
            <Text style={styles.intensityBoundText}>Mild (1)</Text>
            <Text style={styles.intensityBoundText}>Intense (10)</Text>
          </View>
        </View>
      </View>
    );
  };

  // Step 3: Describe Situation (Compact)
  const renderDescribeStep = () => {
    const isCharLimitMet = situation.trim().length >= 10;

    return (
      <View style={styles.stepContainer}>
        {renderSelectionPath()}

        <Text style={styles.stepHeading}>What triggered this?</Text>
        <Text style={styles.stepSubheading}>Describe the event or thoughts that triggered this feeling.</Text>

        <View style={styles.inputGroupBox}>
          <TextInput
            style={styles.situationTextInput}
            placeholder="Type context here... (e.g. My boss criticized my presentation during the team call...)"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={situation}
            onChangeText={setSituation}
            textAlignVertical="top"
          />

          <View style={styles.charCountRow}>
            {situation.trim().length > 0 && !isCharLimitMet ? (
              <Text style={styles.charWarningText}>
                Need {10 - situation.trim().length} more characters
              </Text>
            ) : (
              <Text style={styles.charSuccessText}>
                Minimum characters met
              </Text>
            )}
            <Text style={styles.charCounter}>{situation.length} chars</Text>
          </View>
        </View>

        {/* Horizontal scroll of templates (compact) */}
        <View style={styles.examplesPillsWrapper}>
          <Text style={styles.examplesPillHeading}>💡 Quick Examples (Tap to use):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {EXAMPLE_SITUATIONS.map((ex, i) => (
              <TouchableOpacity 
                key={i} 
                style={styles.examplePillChip}
                onPress={() => setSituation(ex)}
              >
                <Text style={styles.examplePillText} numberOfLines={1}>"{ex}"</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  // Step 4: Add Context (Highly compact horizontal rows)
  const renderContextStep = () => {
    const locations = ['Home', 'Work', 'School', 'Public Place', 'Other'];
    const companies = ['Alone', 'Family', 'Friends', 'Coworkers', 'Strangers', 'Other'];

    return (
      <View style={styles.stepContainer}>
        {renderSelectionPath()}

        <Text style={styles.stepHeading}>Additional Context</Text>
        <Text style={styles.stepSubheading}>Tap detail chips to add optional logging context</Text>

        {/* Location horizontal scroll */}
        <View style={styles.contextCardSectionCompact}>
          <Text style={styles.contextSectionHeadingCompact}>
            <Ionicons name="location-outline" size={14} color="#475569" style={{ marginRight: 4 }} />
            Location
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {locations.map((loc) => {
              const isSelected = location === loc;
              return (
                <TouchableOpacity
                  key={loc}
                  style={[styles.contextChipCompact, isSelected && styles.contextChipActive]}
                  onPress={() => setLocation(isSelected ? '' : loc)}
                >
                  <Text style={[styles.contextChipText, isSelected && styles.contextChipTextActive]}>
                    {loc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Company horizontal scroll */}
        <View style={styles.contextCardSectionCompact}>
          <Text style={styles.contextSectionHeadingCompact}>
            <Ionicons name="people-outline" size={14} color="#475569" style={{ marginRight: 4 }} />
            Company
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {companies.map((comp) => {
              const isSelected = company === comp;
              return (
                <TouchableOpacity
                  key={comp}
                  style={[styles.contextChipCompact, isSelected && styles.contextChipActive]}
                  onPress={() => setCompany(isSelected ? '' : comp)}
                >
                  <Text style={[styles.contextChipText, isSelected && styles.contextChipTextActive]}>
                    {comp}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time selection horizontal scroll */}
        <View style={styles.contextCardSectionCompact}>
          <View style={styles.timeHeaderRowCompact}>
            <Text style={styles.contextSectionHeadingCompact}>
              <Ionicons name="time-outline" size={14} color="#475569" style={{ marginRight: 4 }} />
              Log Time
            </Text>
            <TouchableOpacity
              style={styles.timeCheckboxRowCompact}
              onPress={() => {
                setUseCurrentTime(!useCurrentTime);
                if (!useCurrentTime) setTimeOffset(0);
              }}
            >
              <View style={[styles.checkboxBoxCompact, useCurrentTime && styles.checkboxBoxChecked]}>
                {useCurrentTime && <Feather name="check" size={10} color="white" />}
              </View>
              <Text style={styles.timeCheckboxLabelCompact}>Just Now</Text>
            </TouchableOpacity>
          </View>

          {!useCurrentTime ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {[
                { label: '15m ago', value: 15 },
                { label: '30m ago', value: 30 },
                { label: '1h ago', value: 60 },
                { label: '2h ago', value: 120 },
                { label: 'Yesterday', value: 1440 },
              ].map((preset) => {
                const isSelected = timeOffset === preset.value;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    style={[styles.offsetPresetChipCompact, isSelected && styles.offsetPresetChipActive]}
                    onPress={() => handlePresetTimeOffset(preset.value)}
                  >
                    <Text style={[styles.offsetPresetChipTextCompact, isSelected && styles.offsetPresetChipTextActive]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}

          <View style={styles.calculatedTimePreviewCardCompact}>
            <Feather name="calendar" size={12} color="#64748B" />
            <Text style={styles.calculatedTimePreviewTextCompact}>
              Logging at: <Text style={{ fontWeight: 'bold', color: '#1E293B' }}>{getFormattedTime()}</Text>
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Sticky bottom navigation (Dynamic next labels)
  const renderNavButtons = () => {
    if (step === 0) return null;
    const isNextDisabled = !validateStep();

    // Make Next button label descriptive in Step 1
    let nextLabel = "Next";
    if (step === 1 && activeCore) {
      nextLabel = `Use "${activeTertiary || activePrimary || activeCore.core}"`;
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

        {step < 4 ? (
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
            onPress={handleSaveEmotion}
          >
            <Text style={styles.navSubmitButtonText}>
              {loading ? 'Saving...' : 'Save Emotion'}
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

          <Text style={styles.successTitle}>Emotion Recorded!</Text>
          <Text style={styles.successDescription}>
            Your entry has been saved successfully.
          </Text>

          <View style={styles.summarySavedData}>
            <Text style={styles.summarySavedDataHeader}>Summary</Text>
            <View style={styles.summaryDataRow}>
              <Text style={styles.summaryDataLabel}>Feeling:</Text>
              <Text style={styles.summaryDataValue}>
                {activeCore?.emoji} {activeTertiary || activePrimary || activeCore?.core}
              </Text>
            </View>
            <View style={styles.summaryDataRow}>
              <Text style={styles.summaryDataLabel}>Intensity:</Text>
              <Text style={styles.summaryDataValue}>{intensity}/10 ({getIntensityLabel(intensity)})</Text>
            </View>
            {location ? (
              <View style={styles.summaryDataRow}>
                <Text style={styles.summaryDataLabel}>Location:</Text>
                <Text style={styles.summaryDataValue}>{location}</Text>
              </View>
            ) : null}
            {company ? (
              <View style={styles.summaryDataRow}>
                <Text style={styles.summaryDataLabel}>Company:</Text>
                <Text style={styles.summaryDataValue}>{company}</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity 
            style={styles.successConfirmBtn}
            onPress={handleCloseSuccess}
          >
            <Text style={styles.successConfirmBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const formatEmotionDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
      ' at ' + 
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleOpenEmotionMenu = (emotion: any) => {
    setSelectedEmotion(emotion);
    setMenuVisible(true);
  };

  const handleSaveEditEmotion = async () => {
    if (!selectedEmotion) return;
    setUpdatingEmotion(true);
    try {
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const response = await ApiService.updateEmotion(userId, selectedEmotion.id, {
        intensity: editIntensity,
        situation: editSituation.trim(),
        location: editLocation.trim() || null,
        company: editCompany.trim() || null,
      });

      if (response.error) {
        Alert.alert('Error', response.error);
      } else {
        setEditVisible(false);
        loadHistoryData();
        Alert.alert('Success', 'Emotion record updated successfully');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update emotion record');
    } finally {
      setUpdatingEmotion(false);
    }
  };

  const handleDeleteEmotionConfirm = (emotion: any) => {
    Alert.alert(
      'Delete Entry?',
      'Are you sure you want to permanently delete this emotion check-in? Any linked thoughts will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!userId) return;

              const res = await ApiService.deleteEmotion(userId, emotion.id);
              if (res.error) {
                Alert.alert('Error', res.error);
              } else {
                loadHistoryData();
                Alert.alert('Success', 'Emotion record deleted');
              }
            } catch (e) {
              Alert.alert('Error', 'Failed to delete emotion check-in');
            }
          }
        }
      ]
    );
  };

  const getEmotionColor = (emotion: string) => {
    const coreColors: Record<string, string> = {
      "Joy": "#D69E2E",
      "Sadness": "#3182CE",
      "Fear": "#38A169",
      "Anger": "#E53E3E",
      "Surprise": "#6B46C1",
      "Love": "#E6338F",
    };
    return coreColors[emotion] || "#64748B";
  };

  const getEmotionBgColor = (emotion: string) => {
    const lightColors: Record<string, string> = {
      "Joy": "#FEF08A",
      "Sadness": "#DBEAFE",
      "Fear": "#D1FAE5",
      "Anger": "#FEE2E2",
      "Surprise": "#F3E8FF",
      "Love": "#FCE7F3",
    };
    return lightColors[emotion] || "#F1F5F9";
  };

  const getEmotionTextColor = (emotion: string) => {
    const textColors: Record<string, string> = {
      "Joy": "#854D0E",
      "Sadness": "#1E40AF",
      "Fear": "#065F46",
      "Anger": "#991B1B",
      "Surprise": "#064e3b",
      "Love": "#9D174D",
    };
    return textColors[emotion] || "#475569";
  };

  const renderHistoryTab = () => {
    const filteredHistoryList = searchQuery
      ? emotionsHistory.filter(e => {
          const textToSearch = `${e.coreEmotion} ${e.primaryEmotion || ''} ${e.tertiaryEmotion || ''} ${e.situation || ''} ${e.location || ''} ${e.company || ''}`.toLowerCase();
          return textToSearch.includes(searchQuery.toLowerCase());
        })
      : emotionsHistory;

    if (historyLoading && emotionsHistory.length === 0) {
      return (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={COLORS.primaryGreen} />
        </View>
      );
    }

    const renderEmotionCard = ({ item: emotion, index }: { item: any; index: number }) => {
      const coreColor = getEmotionColor(emotion.coreEmotion);
      const bgLight = getEmotionBgColor(emotion.coreEmotion);
      const textColor = getEmotionTextColor(emotion.coreEmotion);

      return (
        <View key={emotion.id || index} style={[styles.emotionCard, { borderLeftColor: coreColor }]}>
          {/* Card Top Title Row */}
          <View style={styles.emotionHeader}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.emotionName}>
                {emotion.tertiaryEmotion || emotion.primaryEmotion || emotion.coreEmotion}
              </Text>
              <Text style={styles.emotionPath}>
                {emotion.coreEmotion}
                {emotion.primaryEmotion && ` ➔ ${emotion.primaryEmotion}`}
                {emotion.tertiaryEmotion && ` ➔ ${emotion.tertiaryEmotion}`}
              </Text>
            </View>

            <View style={styles.emotionHeaderRight}>
              <View style={[styles.intensityBadge, { backgroundColor: bgLight, marginRight: 8 }]}>
                <Text style={[styles.intensityText, { color: textColor }]}>
                  {emotion.intensity}/10
                </Text>
              </View>
              <TouchableOpacity
                style={styles.kebabButton}
                onPress={() => handleOpenEmotionMenu(emotion)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="more-vertical" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Created date/time */}
          <Text style={styles.emotionDate}>
            📅 {formatEmotionDate(emotion.timestamp || emotion.createdAt)}
          </Text>

          {/* Trigger situation context */}
          {emotion.situation ? (
            <View style={styles.situationContainer}>
              <Text style={styles.situationHeader}>SITUATION & TRIGGER</Text>
              <Text style={styles.situationText}>{emotion.situation}</Text>
            </View>
          ) : null}

          {/* Location and company metadata chips */}
          <View style={styles.metadataContainer}>
            {emotion.location ? (
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>📍 {emotion.location}</Text>
              </View>
            ) : null}
            {emotion.company ? (
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>👥 {emotion.company}</Text>
              </View>
            ) : null}
          </View>
        </View>
      );
    };

    return (
      <FlatList
        data={filteredHistoryList}
        keyExtractor={(item, index) => String(item.id ?? index)}
        renderItem={renderEmotionCard}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadHistoryData} colors={[COLORS.primaryGreen]} />
        }
        ListHeaderComponent={
          <View style={styles.searchSection}>
            <View style={styles.searchBox}>
              <Feather name="search" size={16} color="#64748B" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Filter logs by situation, emotion..."
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
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="book" size={28} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Emotion Records</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search query.' : 'Begin tracking emotions to view entries here.'}
            </Text>
          </View>
        }
      />
    );
  };

  const renderInsightsTab = () => {
    // Aggregations
    const totalLogs = emotionsHistory.length;
    const avgIntensity = totalLogs > 0
      ? (emotionsHistory.reduce((sum, e) => sum + e.intensity, 0) / totalLogs).toFixed(1)
      : '0.0';

    const POSITIVE_EMOTIONS = ['Joy', 'Love', 'Surprise'];
    const positiveCount = emotionsHistory.filter(e => POSITIVE_EMOTIONS.includes(e.coreEmotion)).length;
    const wellbeingScore = totalLogs > 0 ? Math.round((positiveCount / totalLogs) * 100) : 0;

    const emotionCounts = emotionsHistory.reduce((acc: Record<string, number>, e) => {
      acc[e.coreEmotion] = (acc[e.coreEmotion] || 0) + 1;
      return acc;
    }, {});

    const mostCommonEmotion = Object.entries(emotionCounts).length > 0
      ? Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0][0]
      : 'None';

    const EMOTION_COLORS_MAP: Record<string, string> = {
      'Joy': '#D69E2E', 'Sadness': '#3182CE', 'Fear': '#38A169',
      'Anger': '#E53E3E', 'Surprise': '#6B46C1', 'Love': '#E6338F',
    };
    const EMOTION_EMOJIS: Record<string, string> = {
      'Joy': '\ud83d\ude0a', 'Sadness': '\ud83d\ude22', 'Fear': '\ud83d\ude30',
      'Anger': '\ud83d\ude20', 'Surprise': '\ud83d\ude32', 'Love': '\ud83d\ude0d',
    };

    const sortedEmotionDistribution = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1]);
    const maxEmotionCount = sortedEmotionDistribution.length > 0 ? sortedEmotionDistribution[0][1] : 1;

    // Time Patterns (Morning, Afternoon, Evening, Night)
    const TIME_LABELS = ['\ud83c\udf05 Morning', '\u2600\ufe0f Afternoon', '\ud83c\udf06 Evening', '\ud83c\udf19 Night'];
    const timeCounts = [0, 0, 0, 0];
    emotionsHistory.forEach(e => {
      const h = new Date(e.timestamp || e.createdAt).getHours();
      if (h >= 6 && h < 12) timeCounts[0]++;
      else if (h >= 12 && h < 18) timeCounts[1]++;
      else if (h >= 18 && h < 24) timeCounts[2]++;
      else timeCounts[3]++;
    });
    const maxTimeCount = Math.max(...timeCounts, 1);

    // Weekly Heatmap - last 28 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const heatmapDays: { date: string; netScore: number; count: number; dayNum: number }[] = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayEmotions = emotionsHistory.filter(e => {
        const eDate = new Date(e.timestamp || e.createdAt);
        return eDate.toISOString().split('T')[0] === dayStr;
      });
      const pos = dayEmotions.filter(e => POSITIVE_EMOTIONS.includes(e.coreEmotion));
      const neg = dayEmotions.filter(e => !POSITIVE_EMOTIONS.includes(e.coreEmotion));
      const avgPos = pos.length > 0 ? pos.reduce((s, e) => s + e.intensity, 0) / pos.length : 0;
      const avgNeg = neg.length > 0 ? neg.reduce((s, e) => s + e.intensity, 0) / neg.length : 0;
      heatmapDays.push({ date: dayStr, netScore: avgPos - avgNeg, count: dayEmotions.length, dayNum: d.getDate() });
    }

    // Trend chart (last 7 logs)
    const trendData = [...emotionsHistory]
      .sort((a, b) => new Date(a.timestamp || a.createdAt).getTime() - new Date(b.timestamp || b.createdAt).getTime())
      .slice(-7);

    const renderInsightsTrendChart = () => {
      if (trendData.length === 0) {
        return (
          <View style={styles.chartEmptyBlock}>
            <Feather name="trending-up" size={24} color="#94A3B8" />
            <Text style={styles.chartEmptyText}>Not enough check-in data to plot trends</Text>
            <Text style={styles.chartEmptySub}>Complete emotion logs to activate charts</Text>
          </View>
        );
      }

      const chartWidth = width - 32;
      const chartHeight = 160;
      const paddingLeft = 30;
      const paddingRight = 15;
      const startY = 125;
      const endY = 25;
      const usableWidth = chartWidth - paddingLeft - paddingRight;
      const usableHeight = startY - endY;

      const points: { x: number; y: number; intensity: number; emoji: string }[] = [];

      trendData.forEach((e, idx) => {
        const x = paddingLeft + (idx / Math.max(trendData.length - 1, 1)) * usableWidth;
        const y = startY - ((e.intensity - 1) / 9) * usableHeight;
        const emoji = e.coreEmotion ? (EMOTION_EMOJIS[e.coreEmotion] || '\ud83d\ude10') : '\ud83d\ude10';
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
          pathD += ` C ${cpX1} ${prev.y}, ${cpX1} ${curr.y}, ${curr.x} ${curr.y}`;
        }
        fillD = `${pathD} L ${points[points.length - 1].x} ${startY + 15} L ${points[0].x} ${startY + 15} Z`;
      }

      const horizontalGridVals = [2, 5, 8, 10];

      const formatShortDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
      };

      return (
        <View style={styles.chartContainer}>
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <LinearGradient id="insightsChartGlow" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={COLORS.primaryGreen} stopOpacity="0.25" />
                <Stop offset="100%" stopColor={COLORS.primaryGreen} stopOpacity="0.00" />
              </LinearGradient>
            </Defs>
            {horizontalGridVals.map(val => {
              const y = startY - ((val - 1) / 9) * usableHeight;
              return (
                <G key={`grid-${val}`}>
                  <Line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
                  <SvgText x={12} y={y + 4} fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">{val}</SvgText>
                </G>
              );
            })}
            {points.length > 1 && fillD && (<Path d={fillD} fill="url(#insightsChartGlow)" />)}
            {points.length > 1 && pathD && (<Path d={pathD} fill="none" stroke={COLORS.primaryGreen} strokeWidth="3" />)}
            {points.length === 1 && (<Circle cx={points[0].x} cy={points[0].y} r="6" fill={COLORS.primaryGreen} />)}
            {points.map((pt, idx) => (
              <G key={`pt-${idx}`}>
                <Circle cx={pt.x} cy={pt.y} r="4" fill="#FFFFFF" stroke={COLORS.primaryGreen} strokeWidth="2.5" />
                <SvgText x={pt.x} y={pt.y - 12} fill="#4C1D95" fontSize="9" fontWeight="800" textAnchor="middle">{pt.intensity}</SvgText>
                <SvgText x={pt.x} y={startY + 15} fontSize={12} textAnchor="middle">{pt.emoji}</SvgText>
                <SvgText x={pt.x} y={startY + 27} fill="#94A3B8" fontSize="7" fontWeight="700" textAnchor="middle">
                  {formatShortDate(trendData[idx].timestamp || trendData[idx].createdAt)}
                </SvgText>
              </G>
            ))}
          </Svg>
        </View>
      );
    };

    const renderTimePatternsChart = () => {
      const chartWidth = width - 64;
      const barH = 24;
      return (
        <Svg width={chartWidth} height={TIME_LABELS.length * (barH + 14) + 10}>
          {TIME_LABELS.map((label, idx) => {
            const count = timeCounts[idx];
            const barWidth = (count / maxTimeCount) * (chartWidth - 110);
            const y = idx * (barH + 14);
            return (
              <G key={`time-${idx}`}>
                <SvgText x={0} y={y + barH / 2 + 5} fill="#475569" fontSize="10" fontWeight="600">{label}</SvgText>
                <Rect x={110} y={y} width={Math.max(barWidth, 4)} height={barH} rx={6} fill={COLORS.primaryGreen} opacity={0.8} />
                <SvgText x={110 + Math.max(barWidth, 4) + 7} y={y + barH / 2 + 5} fill="#475569" fontSize="11" fontWeight="700">{count}</SvgText>
              </G>
            );
          })}
        </Svg>
      );
    };

    const renderHeatmap = () => {
      const cellSize = Math.floor((width - 64) / 7);
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      const getHeatColor = (netScore: number, count: number) => {
        if (count === 0) return '#F1F5F9';
        if (netScore > 3) return COLORS.mediumGreen;
        if (netScore > 0) return '#86EFAC';
        if (netScore < -3) return '#EF4444';
        if (netScore < 0) return '#FCA5A5';
        return '#FDE68A';
      };

      return (
        <View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            {dayNames.map(d => (
              <View key={d} style={{ width: cellSize, alignItems: 'center' }}>
                <Text style={{ fontSize: 8, color: '#94A3B8', fontWeight: '700' }}>{d}</Text>
              </View>
            ))}
          </View>
          {Array.from({ length: 4 }).map((_, rowIdx) => (
            <View key={rowIdx} style={{ flexDirection: 'row', marginBottom: 3 }}>
              {Array.from({ length: 7 }).map((_, colIdx) => {
                const dayIndex = rowIdx * 7 + colIdx;
                const day = heatmapDays[dayIndex];
                if (!day) return <View key={colIdx} style={{ width: cellSize, height: cellSize }} />;
                const bgColor = getHeatColor(day.netScore, day.count);
                return (
                  <View key={colIdx} style={{ width: cellSize - 2, height: cellSize - 2, margin: 1, borderRadius: 6, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 8, color: day.count > 0 ? '#FFF' : COLORS.disabledBg, fontWeight: '700' }}>{day.dayNum}</Text>
                  </View>
                );
              })}
            </View>
          ))}
          <View style={{ flexDirection: 'row', marginTop: 8, gap: 10, flexWrap: 'wrap' }}>
            {[{ color: '#F1F5F9', label: 'No log' }, { color: '#86EFAC', label: 'Positive' }, { color: '#FDE68A', label: 'Balanced' }, { color: '#FCA5A5', label: 'Negative' }].map(item => (
              <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: item.color, borderWidth: 1, borderColor: '#E2E8F0' }} />
                <Text style={{ fontSize: 9, color: '#64748B' }}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    };

    return (
      <View style={{ padding: 16, paddingBottom: 40 }}>
        {/* KPI Grid - 2x2 */}
        <View style={styles.grid}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Feather name="heart" size={16} color="#3B82F6" />
            </View>
            <Text style={styles.kpiValue}>{totalLogs}</Text>
            <Text style={styles.kpiLabel}>Total Logs</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#FEF2F2' }]}>
              <Feather name="trending-up" size={16} color="#EF4444" />
            </View>
            <Text style={styles.kpiValue}>{avgIntensity}</Text>
            <Text style={styles.kpiLabel}>Avg Intensity</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Feather name="sun" size={16} color={COLORS.mediumGreen} />
            </View>
            <Text style={styles.kpiValue}>{wellbeingScore}%</Text>
            <Text style={styles.kpiLabel}>Wellbeing</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#ecfdf5' }]}>
              <Feather name="activity" size={16} color={COLORS.primaryGreen} />
            </View>
            <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>{mostCommonEmotion}</Text>
            <Text style={styles.kpiLabel}>Top Emotion</Text>
          </View>
        </View>

        {/* Emotion Trend Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Emotion Tracker Trend</Text>
          <Text style={styles.sectionSubtitle}>Intensity timeline (last 7 logs)</Text>
        </View>

        {renderInsightsTrendChart()}

        {/* Emotion Distribution */}
        {sortedEmotionDistribution.length > 0 && (
          <View style={styles.metricsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Emotion Distribution</Text>
              <Text style={styles.sectionSubtitle}>Frequency breakdown of your core emotions</Text>
            </View>
            {sortedEmotionDistribution.map(([emotion, count]) => {
              const pct = Math.round((count / maxEmotionCount) * 100);
              const color = EMOTION_COLORS_MAP[emotion] || '#64748B';
              const emoji = EMOTION_EMOJIS[emotion] || '\ud83d\ude10';
              return (
                <View key={emotion} style={{ marginTop: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, color: '#334155', fontWeight: '600' }}>{emoji} {emotion}</Text>
                    <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '700' }}>{count}x ({Math.round((count / totalLogs) * 100)}%)</Text>
                  </View>
                  <View style={[styles.rateBarBg, { height: 8 }]}>
                    <View style={[styles.rateBarFill, { width: `${pct}%`, backgroundColor: color, height: 8 }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Time Patterns */}
        {totalLogs > 0 && (
          <View style={styles.metricsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Time Patterns</Text>
              <Text style={styles.sectionSubtitle}>When you track emotions most</Text>
            </View>
            <View style={{ paddingTop: 8 }}>
              {renderTimePatternsChart()}
            </View>
          </View>
        )}

        {/* Weekly Intensity Heatmap */}
        {totalLogs > 0 && (
          <View style={styles.metricsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Weekly Intensity Heatmap</Text>
              <Text style={styles.sectionSubtitle}>Last 4 weeks of emotional balance</Text>
            </View>
            {renderHeatmap()}
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
              color={activeScreenTab === 'record' ? COLORS.darkGreen : '#64748B'} 
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
              color={activeScreenTab === 'history' ? COLORS.darkGreen : '#64748B'} 
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
              color={activeScreenTab === 'insights' ? COLORS.darkGreen : '#64748B'} 
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
            {step === 1 && renderSelectionStep()}
            {step === 2 && renderIntensityStep()}
            {step === 3 && renderDescribeStep()}
            {step === 4 && renderContextStep()}
          </ScrollView>

          {renderNavButtons()}
        </>
      ) : activeScreenTab === 'history' ? (
        renderHistoryTab()
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadHistoryData} colors={[COLORS.primaryGreen]} />
          }
        >
          {renderInsightsTab()}
        </ScrollView>
      )}

      {showSuccess && renderSuccessView()}

      {/* Action Menu Modal */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Actions</Text>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setDetailsVisible(true);
              }}
            >
              <Feather name="eye" size={16} color="#475569" style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                if (selectedEmotion) {
                  setEditIntensity(selectedEmotion.intensity);
                  setEditSituation(selectedEmotion.situation || '');
                  setEditLocation(selectedEmotion.location || '');
                  setEditCompany(selectedEmotion.company || '');
                }
                setEditVisible(true);
              }}
            >
              <Feather name="edit-2" size={16} color="#475569" style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('HomeTabs', {
                  screen: 'ThoughtRecord',
                  params: { emotionId: selectedEmotion?.id }
                });
              }}
            >
              <Feather name="arrow-right" size={16} color="#475569" style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Add Thought Record</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemDelete]}
              onPress={() => {
                setMenuVisible(false);
                handleDeleteEmotionConfirm(selectedEmotion);
              }}
            >
              <Feather name="trash-2" size={16} color="#EF4444" style={styles.menuItemIcon} />
              <Text style={[styles.menuItemText, styles.menuItemDeleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Details Modal */}
      <Modal
        visible={detailsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailsVisible(false)}
      >
        <View style={styles.modalOverlayDark}>
          <View style={styles.detailsModalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Emotion Details</Text>
              <TouchableOpacity onPress={() => setDetailsVisible(false)}>
                <Feather name="x" size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>

            {selectedEmotion && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollDetails}>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Date & Time</Text>
                  <Text style={styles.detailsVal}>{formatEmotionDate(selectedEmotion.timestamp || selectedEmotion.createdAt)}</Text>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Emotion</Text>
                  <View style={styles.emotionHierarchyContainer}>
                    <Text style={styles.emotionHierarchyText}>
                      {selectedEmotion.coreEmotion}
                      {selectedEmotion.primaryEmotion ? ` ➔ ${selectedEmotion.primaryEmotion}` : ''}
                      {selectedEmotion.tertiaryEmotion ? ` ➔ ${selectedEmotion.tertiaryEmotion}` : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Intensity</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <View style={[styles.intensityFillBar, { width: `${selectedEmotion.intensity * 10}%`, backgroundColor: getEmotionColor(selectedEmotion.coreEmotion) }]} />
                    <Text style={styles.intensityLabelVal}>{selectedEmotion.intensity}/10</Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Situation & Trigger</Text>
                  <Text style={styles.detailsTextContent}>{selectedEmotion.situation || 'None recorded'}</Text>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Location</Text>
                  <Text style={styles.detailsVal}>📍 {selectedEmotion.location || 'Not specified'}</Text>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Company</Text>
                  <Text style={styles.detailsVal}>👥 {selectedEmotion.company || 'Not specified'}</Text>
                </View>

                <TouchableOpacity
                  style={styles.detailsCtaButton}
                  onPress={() => {
                    setDetailsVisible(false);
                    navigation.navigate('HomeTabs', {
                      screen: 'ThoughtRecord',
                      params: { emotionId: selectedEmotion.id }
                    });
                  }}
                >
                  <Feather name="edit-3" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.detailsCtaText}>Add Thought Record</Text>
                </TouchableOpacity>

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalOverlayDark}>
          <View style={styles.editModalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Edit Emotion</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Feather name="x" size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>

            {selectedEmotion && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollDetails}>
                <View style={styles.detailsRow}>
                  <Text style={styles.inputLabel}>Intensity</Text>
                  <View style={styles.intensitySelectorGrid}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => {
                      const isSelected = editIntensity === val;
                      return (
                        <TouchableOpacity
                          key={val}
                          style={[styles.intensitySelectorCell, isSelected && { backgroundColor: COLORS.primaryGreen, borderColor: COLORS.primaryGreen }]}
                          onPress={() => setEditIntensity(val)}
                        >
                          <Text style={[styles.intensitySelectorCellText, isSelected && { color: '#FFFFFF' }]}>{val}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.inputLabel}>Situation</Text>
                  <TextInput
                    style={styles.detailsTextInput}
                    value={editSituation}
                    onChangeText={setEditSituation}
                    multiline
                    placeholder="Describe the situation..."
                    placeholderTextColor="#94A3B8"
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <TextInput
                    style={styles.detailsSingleInput}
                    value={editLocation}
                    onChangeText={setEditLocation}
                    placeholder="e.g. Home, Work..."
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.inputLabel}>Company</Text>
                  <TextInput
                    style={styles.detailsSingleInput}
                    value={editCompany}
                    onChangeText={setEditCompany}
                    placeholder="e.g. Alone, Friends..."
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.saveEditButton, { backgroundColor: updatingEmotion ? '#A78BFA' : COLORS.primaryGreen }]}
                  onPress={handleSaveEditEmotion}
                  disabled={updatingEmotion}
                >
                  <Text style={styles.saveEditText}>{updatingEmotion ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
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

  // Tab bar
  tabBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: COLORS.darkGreen,
    fontWeight: '700',
  },

  // Progress header
  progressHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressStepNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  progressStepName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryGreen,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 2,
  },

  // Intro / welcome step
  introContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 12,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroGradientCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.darkGreen,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
  featureList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  featureIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  featureTextCol: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  featureDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  introStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 16,
    paddingVertical: 15,
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  introStartButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Wheel
  wheelWrapper: {
    alignItems: 'center',
    marginVertical: 8,
  },

  // Step containers
  stepContainer: {
    padding: 16,
    paddingTop: 8,
  },
  stepHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkGreen,
    marginBottom: 4,
    marginTop: 8,
  },
  stepSubheading: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 18,
  },

  // Selection guide
  selectionGuideBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3E8FF',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  selectionGuideText: {
    fontSize: 12,
    color: '#064e3b',
    flex: 1,
    lineHeight: 17,
  },

  // Trail / breadcrumb
  trailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  trailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  trailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trailResetText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryGreen,
  },
  trailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  trailChip: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trailChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Intensity step
  intensityCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  intensityBigDisplay: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.darkGreen,
    lineHeight: 56,
  },
  intensityBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 4,
    marginBottom: 14,
  },
  intensityBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sliderButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  intensityCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  intensityCircleBtnActive: {
    borderColor: 'transparent',
  },
  intensityCircleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  intensityCircleBtnTextActive: {
    color: '#FFFFFF',
  },
  intensityLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  intensityBoundText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Describe step
  inputGroupBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  situationTextInput: {
    fontSize: 14,
    color: '#1E293B',
    minHeight: 100,
    lineHeight: 20,
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  charWarningText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  charSuccessText: {
    fontSize: 11,
    color: COLORS.mediumGreen,
    fontWeight: '600',
  },
  charCounter: {
    fontSize: 11,
    color: '#94A3B8',
  },
  examplesPillsWrapper: {
    marginBottom: 8,
  },
  examplesPillHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  examplePillChip: {
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    maxWidth: 220,
  },
  examplePillText: {
    fontSize: 12,
    color: '#064e3b',
    fontWeight: '600',
  },

  // Context step
  contextCardSectionCompact: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  contextSectionHeadingCompact: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  contextChipCompact: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  contextChipActive: {
    backgroundColor: COLORS.primaryGreen,
    borderColor: COLORS.primaryGreen,
  },
  contextChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  contextChipTextActive: {
    color: '#FFFFFF',
  },
  timeHeaderRowCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeCheckboxRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkboxBoxCompact: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.disabledBg,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: COLORS.primaryGreen,
    borderColor: COLORS.primaryGreen,
  },
  timeCheckboxLabelCompact: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  offsetPresetChipCompact: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  offsetPresetChipActive: {
    backgroundColor: COLORS.primaryGreen,
    borderColor: COLORS.primaryGreen,
  },
  offsetPresetChipTextCompact: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  offsetPresetChipTextActive: {
    color: '#FFFFFF',
  },
  calculatedTimePreviewCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
  },
  calculatedTimePreviewTextCompact: {
    fontSize: 12,
    color: '#64748B',
  },

  // Navigation buttons
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  navBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  navBackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 2,
  },
  navNextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
    maxWidth: 220,
  },
  navNextButtonDisabled: {
    backgroundColor: COLORS.lightGreen,
  },
  navNextButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  navSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.mediumGreen,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginLeft: 10,
  },
  navSubmitButtonLoading: {
    backgroundColor: '#6EE7B7',
  },
  navSubmitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Success screen
  successScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9,5,20,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 100,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  successIconOuterCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.mediumGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.darkGreen,
    marginBottom: 6,
  },
  successDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  summarySavedData: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginBottom: 20,
  },
  summarySavedDataHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  summaryDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryDataLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  summaryDataValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },
  successConfirmBtn: {
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
  },
  successConfirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // History tab
  searchSection: {
    marginBottom: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  clearBtn: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
  },
  emotionsList: {
    gap: 12,
  },
  emotionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  emotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  emotionName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.darkGreen,
    marginBottom: 2,
  },
  emotionPath: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  emotionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intensityText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emotionDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
  },
  situationContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  situationHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  situationText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },

  // Insights tab
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.darkGreen,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.darkGreen,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  chartEmptyBlock: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 14,
  },
  chartEmptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
    marginBottom: 4,
  },
  chartEmptySub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  rateBarBg: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  rateBarFill: {
    borderRadius: 4,
  },

  // Kebab menu button on cards
  kebabButton: {
    padding: 4,
    borderRadius: 6,
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
    color: COLORS.darkGreen,
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
  detailsSingleInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    fontSize: 13,
    color: '#1E293B',
    height: 44,
  },
  detailsCtaButton: {
    backgroundColor: COLORS.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    marginTop: 20,
    shadowColor: COLORS.primaryGreen,
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
    shadowColor: COLORS.primaryGreen,
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
  intensityFillBar: {
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    flex: 1,
  },
  intensityLabelVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  emotionHierarchyContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  emotionHierarchyText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  intensitySelectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  intensitySelectorCell: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensitySelectorCellText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});
