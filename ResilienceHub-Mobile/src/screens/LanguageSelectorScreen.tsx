import React, { useState, useEffect } from 'react';
import { COLORS } from '../styles/theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

export default function LanguageSelectorScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar'>('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const saved = await SecureStore.getItemAsync('appLanguage');
        if (saved === 'ar') {
          setSelectedLanguage('ar');
        } else {
          setSelectedLanguage('en');
        }
      } catch (e) {
        console.error('Failed to load language settings:', e);
      } finally {
        setLoading(false);
      }
    };
    loadSavedLanguage();
  }, []);

  const handleSelectLanguage = async (lang: 'en' | 'ar') => {
    if (lang === 'ar') {
      Alert.alert(
        'Coming Soon',
        'Arabic version of the app is coming soon. We are working hard to bring you a fully localized experience.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedLanguage(lang);
    try {
      await SecureStore.setItemAsync('appLanguage', lang);
      Alert.alert(
        'Language Saved',
        'App language has been successfully updated to English.'
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to save language settings.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Language / اللغة</Text>
        <Text style={styles.subtitle}>Select your preferred interface language</Text>
      </View>

      <View style={styles.listContainer}>
        {/* English option */}
        <TouchableOpacity
          style={[styles.optionRow, selectedLanguage === 'en' && styles.activeOptionRow]}
          activeOpacity={0.8}
          onPress={() => handleSelectLanguage('en')}
        >
          <View style={styles.labelContainer}>
            <Text style={styles.nativeLabel}>English</Text>
            <Text style={styles.translatedLabel}>English</Text>
          </View>
          {selectedLanguage === 'en' && (
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primaryGreen} />
          )}
        </TouchableOpacity>

        {/* Arabic option */}
        <TouchableOpacity
          style={[styles.optionRow, selectedLanguage === 'ar' && styles.activeOptionRow]}
          activeOpacity={0.8}
          onPress={() => handleSelectLanguage('ar')}
        >
          <View style={styles.labelContainer}>
            <Text style={styles.nativeLabel}>العربية</Text>
            <Text style={styles.translatedLabel}>Arabic</Text>
          </View>
          {selectedLanguage === 'ar' && (
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primaryGreen} />
          )}
        </TouchableOpacity>
      </View>

      {/* Guidance box */}
      <View style={styles.guidanceBox}>
        <Feather name="info" size={16} color={COLORS.primaryGreen} style={{ marginRight: 10, marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.guidanceText}>
            Local translations apply to navigation tabs, dashboards, and instructions. Custom user logs remain in the text input language.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  listContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  activeOptionRow: {
    borderColor: COLORS.primaryGreen,
  },
  labelContainer: {
    flex: 1,
  },
  nativeLabel: {
    fontSize: 15.5,
    fontWeight: '800',
    color: COLORS.darkGreen,
  },
  translatedLabel: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  guidanceBox: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  guidanceText: {
    fontSize: 12,
    color: '#064e3b',
    lineHeight: 18,
  },
});
