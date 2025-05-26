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

const emotions = [
  'happy', 'sad', 'angry', 'anxious', 'excited', 'frustrated',
  'calm', 'overwhelmed', 'grateful', 'lonely', 'content', 'stressed'
];

export default function EmotionTrackingScreen({ navigation }: EmotionTrackingScreenProps) {
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [location, setLocation] = useState('');
  const [company, setCompany] = useState('');
  const [situation, setSituation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!selectedEmotion) {
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
        emotion: selectedEmotion,
        intensity,
        location: location || null,
        company: company || null,
        situation: situation || null,
        time: new Date().toISOString(),
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How are you feeling?</Text>
            <View style={styles.emotionGrid}>
              {emotions.map((emotion) => (
                <TouchableOpacity
                  key={emotion}
                  style={[
                    styles.emotionButton,
                    selectedEmotion === emotion && styles.emotionButtonSelected
                  ]}
                  onPress={() => setSelectedEmotion(emotion)}
                >
                  <Text style={[
                    styles.emotionButtonText,
                    selectedEmotion === emotion && styles.emotionButtonTextSelected
                  ]}>
                    {emotion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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