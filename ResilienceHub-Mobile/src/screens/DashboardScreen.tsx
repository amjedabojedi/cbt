import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { ApiService } from '../services/api';

interface DashboardScreenProps {
  navigation: any;
}

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const [user, setUser] = useState<any>(null);
  const [recentEmotions, setRecentEmotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      // Get current user
      const userResponse = await ApiService.getCurrentUser();
      if (userResponse.data) {
        setUser(userResponse.data);
        
        // Get recent emotions
        const emotionsResponse = await ApiService.getEmotions(userResponse.data.id);
        if (emotionsResponse.data) {
          setRecentEmotions(emotionsResponse.data.slice(0, 3)); // Show latest 3
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    await ApiService.logout();
    navigation.replace('Login');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{user?.name || 'User'}</Text>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('EmotionTracking')}
          >
            <Text style={styles.actionButtonText}>Track Emotions</Text>
            <Text style={styles.actionButtonSubtext}>Log your current feelings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {/* Navigate to Journal */}}
          >
            <Text style={styles.actionButtonText}>Write Journal</Text>
            <Text style={styles.actionButtonSubtext}>Reflect on your day</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {/* Navigate to Thought Records */}}
          >
            <Text style={styles.actionButtonText}>Thought Record</Text>
            <Text style={styles.actionButtonSubtext}>Challenge negative thoughts</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Recent Emotions</Text>
          {recentEmotions.length > 0 ? (
            recentEmotions.map((emotion, index) => (
              <View key={index} style={styles.emotionCard}>
                <Text style={styles.emotionName}>{emotion.emotion}</Text>
                <Text style={styles.emotionIntensity}>
                  Intensity: {emotion.intensity}/10
                </Text>
                <Text style={styles.emotionDate}>
                  {new Date(emotion.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No recent emotions tracked</Text>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748b',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 4,
  },
  quickActions: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  actionButtonSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  recentActivity: {
    padding: 24,
    paddingTop: 0,
  },
  emotionCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emotionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  emotionIntensity: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  emotionDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  noDataText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 20,
  },
  logoutButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});