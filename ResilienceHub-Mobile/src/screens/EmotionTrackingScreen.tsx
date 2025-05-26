import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EmotionTrackingScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

const coreEmotions = [
  { name: 'Joy', color: '#FFD700', emoji: '😊' },
  { name: 'Sadness', color: '#4682B4', emoji: '😢' },
  { name: 'Fear', color: '#228B22', emoji: '😰' },
  { name: 'Anger', color: '#FF4500', emoji: '😠' },
  { name: 'Surprise', color: '#9932CC', emoji: '😲' },
  { name: 'Love', color: '#FF69B4', emoji: '😍' },
];

export default function EmotionTrackingScreen({ navigation }: EmotionTrackingScreenProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<number>(5);
  const [loading, setLoading] = useState(false);

  const handleSaveEmotion = async () => {
    if (!selectedEmotion) {
      Alert.alert('Please select an emotion');
      return;
    }

    setLoading(true);
    try {
      // Save emotion to your backend
      const response = await fetch('/api/emotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coreEmotion: selectedEmotion,
          intensity: intensity,
          specificEmotions: [selectedEmotion],
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Emotion recorded successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to save emotion');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>How are you feeling?</Text>
          <Text style={styles.subtitle}>Select the emotion that best describes how you feel right now</Text>
        </View>

        {/* Emotion Wheel */}
        <View style={styles.emotionGrid}>
          {coreEmotions.map((emotion, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.emotionCard,
                { backgroundColor: emotion.color },
                selectedEmotion === emotion.name && styles.selectedEmotion
              ]}
              onPress={() => setSelectedEmotion(emotion.name)}
            >
              <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
              <Text style={styles.emotionName}>{emotion.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Intensity Slider */}
        {selectedEmotion && (
          <View style={styles.intensitySection}>
            <Text style={styles.intensityTitle}>
              How intense is your {selectedEmotion.toLowerCase()}?
            </Text>
            <Text style={styles.intensityValue}>{intensity}/10</Text>
            
            <View style={styles.sliderContainer}>
              <View style={styles.sliderTrack}>
                <View 
                  style={[
                    styles.sliderFill,
                    { width: `${(intensity / 10) * 100}%` }
                  ]} 
                />
              </View>
              <View style={styles.sliderButtons}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.sliderButton,
                      intensity === value && styles.selectedSliderButton
                    ]}
                    onPress={() => setIntensity(value)}
                  >
                    <Text style={[
                      styles.sliderButtonText,
                      intensity === value && styles.selectedSliderButtonText
                    ]}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.intensityLabels}>
              <Text style={styles.intensityLabel}>Very Low</Text>
              <Text style={styles.intensityLabel}>Very High</Text>
            </View>
          </View>
        )}

        {/* Current Selection Summary */}
        {selectedEmotion && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Your Selection</Text>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryEmotion}>
                {coreEmotions.find(e => e.name === selectedEmotion)?.emoji} {selectedEmotion}
              </Text>
              <Text style={styles.summaryIntensity}>Intensity: {intensity}/10</Text>
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            !selectedEmotion && styles.saveButtonDisabled,
            loading && styles.saveButtonLoading
          ]}
          onPress={handleSaveEmotion}
          disabled={!selectedEmotion || loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Emotion'}
          </Text>
        </TouchableOpacity>

        {/* Quick Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Quick Tip</Text>
          <Text style={styles.tipsText}>
            Regular emotion tracking helps you understand patterns and triggers in your mental wellness journey.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
  },
  emotionCard: {
    width: (width - 60) / 3,
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedEmotion: {
    transform: [{ scale: 1.05 }],
    borderWidth: 3,
    borderColor: '#1E293B',
  },
  emotionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emotionName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  intensitySection: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  intensityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  intensityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 20,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: 16,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSliderButton: {
    backgroundColor: '#3B82F6',
  },
  sliderButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  selectedSliderButtonText: {
    color: 'white',
  },
  intensityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  intensityLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryEmotion: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  summaryIntensity: {
    fontSize: 16,
    color: '#64748B',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    margin: 20,
    marginTop: 0,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveButtonLoading: {
    backgroundColor: '#1E40AF',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#FEF3C7',
    margin: 20,
    marginTop: 0,
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
});