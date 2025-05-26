import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { ApiService } from '../services/api';

interface ThoughtRecordScreenProps {
  navigation: any;
}

export default function ThoughtRecordScreen({ navigation }: ThoughtRecordScreenProps) {
  const [automaticThoughts, setAutomaticThoughts] = useState('');
  const [evidenceFor, setEvidenceFor] = useState('');
  const [evidenceAgainst, setEvidenceAgainst] = useState('');
  const [alternativePerspective, setAlternativePerspective] = useState('');
  const [insightsGained, setInsightsGained] = useState('');
  const [selectedDistortions, setSelectedDistortions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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

  const toggleDistortion = (distortion: string) => {
    setSelectedDistortions(prev => 
      prev.includes(distortion)
        ? prev.filter(d => d !== distortion)
        : [...prev, distortion]
    );
  };

  const handleSave = async () => {
    if (!automaticThoughts.trim()) {
      Alert.alert('Missing Information', 'Please describe your automatic thoughts');
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
        emotionRecordId: null, // Can be linked to emotions later
      };

      const response = await ApiService.createThoughtRecord(userResponse.data.id, thoughtData);
      
      if (response.error) {
        Alert.alert('Error', response.error);
      } else {
        Alert.alert('Success', 'Thought record saved successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save thought record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Thought Record</Text>
          <Text style={styles.subtitle}>Challenge and reframe your thinking patterns</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Automatic Thoughts *</Text>
            <Text style={styles.helperText}>What thoughts went through your mind?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Describe the thoughts that came to mind automatically..."
              value={automaticThoughts}
              onChangeText={setAutomaticThoughts}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cognitive Distortions</Text>
            <Text style={styles.helperText}>Which thinking patterns might be affecting you?</Text>
            <View style={styles.distortionsGrid}>
              {cognitiveDistortions.map((distortion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.distortionChip,
                    selectedDistortions.includes(distortion) && styles.distortionChipSelected
                  ]}
                  onPress={() => toggleDistortion(distortion)}
                >
                  <Text style={[
                    styles.distortionText,
                    selectedDistortions.includes(distortion) && styles.distortionTextSelected
                  ]}>
                    {distortion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidence For</Text>
            <Text style={styles.helperText}>What evidence supports these thoughts?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="List facts that support your automatic thoughts..."
              value={evidenceFor}
              onChangeText={setEvidenceFor}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidence Against</Text>
            <Text style={styles.helperText}>What evidence contradicts these thoughts?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="List facts that contradict your automatic thoughts..."
              value={evidenceAgainst}
              onChangeText={setEvidenceAgainst}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alternative Perspective</Text>
            <Text style={styles.helperText}>What would you tell a friend in this situation?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Write a more balanced, realistic perspective..."
              value={alternativePerspective}
              onChangeText={setAlternativePerspective}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights Gained</Text>
            <Text style={styles.helperText}>What did you learn from this exercise?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Reflect on what you've learned about your thinking..."
              value={insightsGained}
              onChangeText={setInsightsGained}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Thought Record'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
    minHeight: 80,
  },
  distortionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  distortionChip: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  distortionChipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  distortionText: {
    fontSize: 12,
    color: '#475569',
  },
  distortionTextSelected: {
    color: 'white',
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
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});