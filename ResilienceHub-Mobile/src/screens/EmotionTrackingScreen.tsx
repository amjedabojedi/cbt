import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { ApiService } from '../services/api';

interface EmotionTrackingScreenProps {
  navigation: any;
}

// Complete emotion wheel data matching your web application
const emotionGroups = [
  {
    core: "Joy",
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

export default function EmotionTrackingScreen({ navigation }: EmotionTrackingScreenProps) {
  const [selectedCore, setSelectedCore] = useState('');
  const [selectedPrimary, setSelectedPrimary] = useState('');
  const [selectedTertiary, setSelectedTertiary] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [location, setLocation] = useState('');
  const [company, setCompany] = useState('');
  const [situation, setSituation] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: core, 2: primary, 3: tertiary, 4: details

  // Get emotion colors matching web app
  const getEmotionColor = (emotion: string) => {
    const coreColors: Record<string, string> = {
      "Joy": "#FFD700",
      "Sadness": "#4682B4", 
      "Fear": "#228B22",
      "Anger": "#FF4500",
      "Surprise": "#9932CC",
      "Love": "#FF69B4",
    };
    return coreColors[emotion] || "#808080";
  };

  const handleCoreSelect = (coreEmotion: string) => {
    setSelectedCore(coreEmotion);
    setSelectedPrimary('');
    setSelectedTertiary('');
    setStep(2);
  };

  const handlePrimarySelect = (primaryEmotion: string) => {
    setSelectedPrimary(primaryEmotion);
    setSelectedTertiary('');
    setStep(3);
  };

  const handleTertiarySelect = (tertiaryEmotion: string) => {
    setSelectedTertiary(tertiaryEmotion);
    setStep(4);
  };

  const resetSelection = () => {
    setSelectedCore('');
    setSelectedPrimary('');
    setSelectedTertiary('');
    setStep(1);
  };

  const handleSave = async () => {
    if (!selectedCore) {
      Alert.alert('Missing Information', 'Please select an emotion');
      return;
    }

    setLoading(true);
    try {
      // Get current user first
      const userResponse = await ApiService.getCurrentUser();
      if (!userResponse.data) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const emotionData = {
        coreEmotion: selectedCore,
        primaryEmotion: selectedPrimary || null,
        tertiaryEmotion: selectedTertiary || null,
        intensity,
        location: location || null,
        company: company || null,
        situation: situation || null,
        timestamp: new Date().toISOString(),
      };

      const response = await ApiService.createEmotion(userResponse.data.id, emotionData);
      
      if (response.error) {
        Alert.alert('Error', response.error);
      } else {
        Alert.alert('Success', 'Emotion tracked successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save emotion');
    } finally {
      setLoading(false);
    }
  };

  // Get current emotion group
  const currentGroup = emotionGroups.find(group => group.core === selectedCore);
  const primaryIndex = currentGroup?.primary.indexOf(selectedPrimary) || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>
              Step {step} of 4: {
                step === 1 ? 'Core Emotion' :
                step === 2 ? 'Primary Emotion' :
                step === 3 ? 'Specific Emotion' : 'Details'
              }
            </Text>
            {step > 1 && (
              <TouchableOpacity onPress={resetSelection} style={styles.resetButton}>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Core emotions selection */}
          {step === 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select a Core Emotion</Text>
              <View style={styles.emotionGrid}>
                {emotionGroups.map((group) => (
                  <TouchableOpacity
                    key={group.core}
                    style={[
                      styles.coreEmotionButton,
                      { backgroundColor: getEmotionColor(group.core) + '40' }
                    ]}
                    onPress={() => handleCoreSelect(group.core)}
                  >
                    <Text style={styles.emotionText}>{group.core}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Primary emotions selection */}
          {step === 2 && currentGroup && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Selected: {selectedCore} → Choose Primary Emotion
              </Text>
              <View style={styles.emotionGrid}>
                {currentGroup.primary.map((primary) => (
                  <TouchableOpacity
                    key={primary}
                    style={[
                      styles.primaryEmotionButton,
                      { backgroundColor: getEmotionColor(selectedCore) + '60' }
                    ]}
                    onPress={() => handlePrimarySelect(primary)}
                  >
                    <Text style={styles.emotionText}>{primary}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Tertiary emotions selection */}
          {step === 3 && currentGroup && currentGroup.tertiary[primaryIndex] && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {selectedCore} → {selectedPrimary} → Choose Specific Emotion
              </Text>
              <View style={styles.emotionGrid}>
                {currentGroup.tertiary[primaryIndex].map((tertiary) => (
                  <TouchableOpacity
                    key={tertiary}
                    style={[
                      styles.tertiaryEmotionButton,
                      { backgroundColor: getEmotionColor(selectedCore) + '80' }
                    ]}
                    onPress={() => handleTertiarySelect(tertiary)}
                  >
                    <Text style={styles.emotionText}>{tertiary}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Details form - only show when emotion is selected */}
          {step === 4 && (
            <>
              <View style={styles.selectedEmotionSummary}>
                <Text style={styles.summaryTitle}>Selected Emotion:</Text>
                <Text style={styles.summaryPath}>
                  {selectedCore} → {selectedPrimary} → {selectedTertiary}
                </Text>
              </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Intensity (1-10)</Text>
            <View style={styles.intensityContainer}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.intensityButton,
                    intensity === value && styles.intensityButtonSelected
                  ]}
                  onPress={() => setIntensity(value)}
                >
                  <Text style={[
                    styles.intensityButtonText,
                    intensity === value && styles.intensityButtonTextSelected
                  ]}>
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Where are you?</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Home, Work, School"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who are you with?</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Alone, Family, Friends"
              value={company}
              onChangeText={setCompany}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's happening?</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the situation or what triggered this emotion"
              value={situation}
              onChangeText={setSituation}
              multiline
              numberOfLines={4}
            />
          </View>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save Emotion'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emotionButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  emotionButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  emotionButtonText: {
    fontSize: 14,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  emotionButtonTextSelected: {
    color: '#ffffff',
  },
  intensityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intensityButton: {
    backgroundColor: '#ffffff',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  intensityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  intensityButtonTextSelected: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});