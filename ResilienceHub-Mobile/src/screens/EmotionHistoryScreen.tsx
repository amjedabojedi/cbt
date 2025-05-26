import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { ApiService } from '../services/api';

interface EmotionHistoryScreenProps {
  navigation: any;
}

export default function EmotionHistoryScreen({ navigation }: EmotionHistoryScreenProps) {
  const [emotions, setEmotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEmotions = async () => {
    try {
      const userResponse = await ApiService.getCurrentUser();
      if (userResponse.data) {
        const emotionsResponse = await ApiService.getUserEmotions(userResponse.data.id);
        if (emotionsResponse.data) {
          setEmotions(emotionsResponse.data);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load emotion history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEmotions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadEmotions();
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading your emotions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>Emotion History</Text>
          <Text style={styles.subtitle}>Track your emotional journey</Text>
          
          {emotions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No emotions recorded yet</Text>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => navigation.navigate('EmotionTracking')}
              >
                <Text style={styles.buttonText}>Record Your First Emotion</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emotionsList}>
              {emotions.map((emotion: any, index: number) => (
                <View key={index} style={styles.emotionCard}>
                  <View style={styles.emotionHeader}>
                    <View style={styles.emotionInfo}>
                      <View style={[
                        styles.emotionColorDot, 
                        { backgroundColor: getEmotionColor(emotion.coreEmotion) }
                      ]} />
                      <View>
                        <Text style={styles.emotionName}>
                          {emotion.tertiaryEmotion || emotion.primaryEmotion || emotion.coreEmotion}
                        </Text>
                        <Text style={styles.emotionPath}>
                          {emotion.coreEmotion}
                          {emotion.primaryEmotion && ` → ${emotion.primaryEmotion}`}
                          {emotion.tertiaryEmotion && ` → ${emotion.tertiaryEmotion}`}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.intensityBadge}>
                      <Text style={styles.intensityText}>{emotion.intensity}/10</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.emotionDate}>
                    {formatDate(emotion.timestamp || emotion.createdAt)}
                  </Text>
                  
                  {emotion.situation && (
                    <Text style={styles.emotionSituation}>{emotion.situation}</Text>
                  )}
                  
                  <View style={styles.emotionDetails}>
                    {emotion.location && (
                      <Text style={styles.detailText}>📍 {emotion.location}</Text>
                    )}
                    {emotion.company && (
                      <Text style={styles.detailText}>👥 {emotion.company}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('EmotionTracking')}
          >
            <Text style={styles.buttonText}>+ Track New Emotion</Text>
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
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 100,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  emotionsList: {
    gap: 16,
  },
  emotionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  emotionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emotionColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  emotionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  emotionPath: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  intensityBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  intensityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emotionDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  emotionSituation: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  emotionDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});