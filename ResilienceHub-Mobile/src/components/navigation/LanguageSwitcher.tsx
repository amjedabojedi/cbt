import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { COLORS, SPACING, RADII } from '../../styles/theme';

type Lang = 'en' | 'ar';

/** Language toggle shown in the client drawer footer. Arabic is "coming soon". */
export default function LanguageSwitcher() {
  const [selectedLanguage, setSelectedLanguage] = React.useState<Lang>('en');

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync('appLanguage');
        if (isMounted) setSelectedLanguage(saved === 'ar' ? 'ar' : 'en');
      } catch (e) {
        console.error('Failed to load language settings:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectLanguage = async (lang: Lang) => {
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
      Alert.alert('Language Saved', 'App language has been successfully updated to English.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save language settings.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Ionicons name="globe-outline" size={14} color={COLORS.accentGreen} style={{ marginRight: 6 }} />
        <Text style={styles.label}>Language</Text>
      </View>
      <View style={styles.toggle}>
        {(['en', 'ar'] as Lang[]).map((lang) => {
          const active = selectedLanguage === lang;
          return (
            <TouchableOpacity
              key={lang}
              activeOpacity={0.8}
              onPress={() => handleSelectLanguage(lang)}
              style={[styles.option, active && styles.optionActive]}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>
                {lang === 'en' ? 'English' : 'العربية'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.overlayBorder,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  label: {
    color: COLORS.overlayText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.overlaySubtle,
    borderRadius: RADII.lg,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.overlayBorder,
    width: 160,
    alignSelf: 'flex-start',
  },
  option: {
    flex: 1,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  optionActive: { backgroundColor: COLORS.primaryGreen },
  optionText: { color: COLORS.overlayText, fontSize: 11.5, fontWeight: 'bold', textAlign: 'center' },
  optionTextActive: { color: COLORS.textLight },
});
