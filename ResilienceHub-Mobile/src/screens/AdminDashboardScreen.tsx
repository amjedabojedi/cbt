import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { ApiService } from '../services/api';

const { width } = Dimensions.get('window');

interface AdminDashboardScreenProps {
  navigation: any;
}

export default function AdminDashboardScreen({ navigation }: AdminDashboardScreenProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({});

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const fetchData = async () => {
        try {
          const [userRes, statsRes] = await Promise.all([
            ApiService.getCurrentUser(),
            ApiService.getAdminStats(),
          ]);
          if (!userRes.data || userRes.error) {
            navigation.navigate('Login');
            return;
          }
          if (isMounted) {
            setUser(userRes.data);
            setStats(statsRes.data || {});
          }
        } catch (error) {
          console.error('Error fetching admin dashboard:', error);
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      fetchData();
      return () => { isMounted = false; };
    }, [])
  );

  const displayName = user?.name ? user.name.split(' ')[0] : 'Admin';
  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading admin panel...</Text>
      </View>
    );
  }

  const statCards = [
    { icon: 'users', label: 'Total Users', value: stats.totalUsers ?? 0, sub: 'Registered accounts', color: '#059669' },
    { icon: 'user-check', label: 'Clients', value: stats.totalClients ?? 0, sub: 'Active client accounts', color: '#10B981' },
    { icon: 'briefcase', label: 'Therapists', value: stats.totalTherapists ?? 0, sub: 'Clinical staff', color: '#6366F1' },
    { icon: 'heart', label: 'Emotion Logs', value: stats.totalEmotions ?? 0, sub: 'All time entries', color: '#F59E0B' },
    { icon: 'cpu', label: 'Thought Records', value: stats.totalThoughts ?? 0, sub: 'All time records', color: '#059669' },
    { icon: 'target', label: 'Goals Created', value: stats.totalGoals ?? 0, sub: 'All time goals', color: '#EF4444' },
  ];

  const quickLinks = [
    { icon: 'users', label: 'User Management', desc: 'Create, edit, and manage all users', screen: 'UserManagement', color: '#059669' },
    { icon: 'book', label: 'Resource Library', desc: 'Manage clinical resources', screen: 'ResourceLibrary', color: '#6366F1' },
    { icon: 'settings', label: 'Settings', desc: 'System configuration', screen: 'Settings', color: '#64748B' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.heroTagRow}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#34d399" />
                <Text style={styles.heroTag}>ADMIN PANEL</Text>
              </View>
              <Text style={styles.heroGreeting}>{timeGreeting},</Text>
              <Text style={styles.heroName}>{displayName}</Text>
              <Text style={styles.heroSubtitle}>System overview and user management.</Text>
            </View>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{userInitials}</Text>
            </View>
          </View>

          {/* Top Stats Row */}
          <View style={styles.topStatsRow}>
            {[
              { value: stats.totalUsers ?? 0, label: 'Users' },
              { value: stats.totalClients ?? 0, label: 'Clients' },
              { value: stats.totalTherapists ?? 0, label: 'Therapists' },
            ].map((s, i) => (
              <View key={i} style={styles.topStatItem}>
                <Text style={styles.topStatValue}>{s.value}</Text>
                <Text style={styles.topStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* System Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="bar-chart-2" size={14} color="#581C87" />
            <Text style={styles.sectionTitle}>SYSTEM OVERVIEW</Text>
          </View>
          <View style={styles.statsGrid}>
            {statCards.map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: `${stat.color}15` }]}>
                  <Feather name={stat.icon as any} size={18} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statSub}>{stat.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Insights */}
        {(stats.clientsWithoutTherapist !== undefined || stats.therapistsWithoutClients !== undefined) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="alert-triangle" size={14} color="#581C87" />
              <Text style={styles.sectionTitle}>ATTENTION NEEDED</Text>
            </View>
            <View style={styles.insightCard}>
              {stats.clientsWithoutTherapist > 0 && (
                <View style={styles.insightRow}>
                  <View style={[styles.insightDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.insightText}>
                    <Text style={styles.insightBold}>{stats.clientsWithoutTherapist}</Text> clients without an assigned therapist
                  </Text>
                </View>
              )}
              {stats.therapistsWithoutClients > 0 && (
                <View style={styles.insightRow}>
                  <View style={[styles.insightDot, { backgroundColor: '#6366F1' }]} />
                  <Text style={styles.insightText}>
                    <Text style={styles.insightBold}>{stats.therapistsWithoutClients}</Text> therapists without any clients
                  </Text>
                </View>
              )}
              {stats.clientsWithoutTherapist === 0 && stats.therapistsWithoutClients === 0 && (
                <View style={styles.insightRow}>
                  <View style={[styles.insightDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.insightText}>All clients and therapists are properly assigned</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Quick Access */}
        <View style={[styles.section, { paddingBottom: 40 }]}>
          <View style={styles.sectionHeader}>
            <Feather name="zap" size={14} color="#581C87" />
            <Text style={styles.sectionTitle}>QUICK ACCESS</Text>
          </View>
          <View style={styles.quickGrid}>
            {quickLinks.map((item, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                style={styles.quickCard}
                onPress={() => navigation.navigate(item.screen)}
              >
                <View style={[styles.quickIconBox, { backgroundColor: `${item.color}12` }]}>
                  <Feather name={item.icon as any} size={18} color={item.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.quickLabel}>{item.label}</Text>
                  <Text style={styles.quickDesc}>{item.desc}</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '600' },

  heroBanner: {
    backgroundColor: '#052e16',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroTagRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  heroTag: { color: '#34d399', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginLeft: 6 },
  heroGreeting: { fontSize: 16, color: '#34d399', fontWeight: '600' },
  heroName: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginTop: 2 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6, lineHeight: 18 },
  avatarBox: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(5,150,105,0.15)',
    borderWidth: 1.5, borderColor: '#059669',
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  avatarText: { color: '#34d399', fontSize: 16, fontWeight: 'bold' },
  topStatsRow: {
    flexDirection: 'row', justifyContent: 'space-around', marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingVertical: 14,
  },
  topStatItem: { alignItems: 'center' },
  topStatValue: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  topStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  section: { paddingTop: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 1.5, marginLeft: 6, textTransform: 'uppercase' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9',
    padding: 16, marginBottom: 12,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  statIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#0F172A' },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginTop: 2 },
  statSub: { fontSize: 10, color: '#94A3B8', marginTop: 4, fontWeight: '500' },

  insightCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9',
    padding: 16,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  insightRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  insightDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  insightText: { fontSize: 13, color: '#475569', flex: 1 },
  insightBold: { fontWeight: '700', color: '#1E293B' },

  quickGrid: { gap: 8 },
  quickCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9',
    padding: 14, marginBottom: 8,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 1,
  },
  quickIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  quickDesc: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
});
