import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DashboardScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const quickActions = [
    {
      title: 'Track Emotions',
      description: 'Record how you feel right now',
      color: '#3B82F6',
      screen: 'EmotionTracking',
      icon: '😊',
    },
    {
      title: 'View History',
      description: 'See your emotional journey',
      color: '#10B981',
      screen: 'EmotionHistory',
      icon: '📊',
    },
    {
      title: 'Write Journal',
      description: 'Reflect on your thoughts',
      color: '#F59E0B',
      screen: 'Journal',
      icon: '📝',
    },
    {
      title: 'Thought Record',
      description: 'Challenge negative thoughts',
      color: '#8B5CF6',
      screen: 'ThoughtRecord',
      icon: '🧠',
    },
  ];

  const todayStats = {
    emotionsTracked: 3,
    journalEntries: 1,
    avgMood: 7.2,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Today's Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Progress</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{todayStats.emotionsTracked}</Text>
              <Text style={styles.statLabel}>Emotions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{todayStats.journalEntries}</Text>
              <Text style={styles.statLabel}>Journals</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{todayStats.avgMood}</Text>
              <Text style={styles.statLabel}>Avg Mood</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionCard, { backgroundColor: action.color }]}
                onPress={() => navigation.navigate(action.screen)}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityEmoji}>😊</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Tracked Joy</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityEmoji}>📝</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Morning Journal</Text>
                <Text style={styles.activityTime}>This morning</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Activity</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Motivational Message */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationText}>
            "Progress, not perfection. Every step forward counts on your wellness journey."
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
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#64748B',
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  activityTime: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  viewAllButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  motivationCard: {
    backgroundColor: '#3B82F6',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 40,
  },
  motivationText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
});