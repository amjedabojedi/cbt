import React, { useState } from 'react';
import { COLORS } from '../styles/theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

interface OnboardingScreenProps {
  navigation: any;
}

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const [selectedRole, setSelectedRole] = useState<'client' | 'therapist'>('client');
  const [currentStep, setCurrentStep] = useState(0);

  // Dynamic slides based on chosen role
  const getSlides = () => {
    if (selectedRole === 'client') {
      return [
        {
          title: "Track & Understand",
          subtitle: "Emotion & Thought Logs",
          description: "Log daily emotions and challenge negative thoughts using clinical CBT records to notice patterns and growth.",
          icon: "heart-outline",
          iconFamily: "Ionicons",
          color: "#3B82F6",
        },
        {
          title: "Cognitive Reframe",
          subtitle: "Restructure Automatic Thoughts",
          description: "Identify common thinking traps (distortions) and learn to structure healthy, balanced alternative perspectives.",
          icon: "brain",
          iconFamily: "MaterialCommunityIcons",
          color: "#EC4899",
        },
        {
          title: "Guided Support",
          subtitle: "Clinical Worksheets & Notes",
          description: "Access coping strategies, protective factors, and worksheets assigned directly by your therapist with custom instructions.",
          icon: "book-outline",
          iconFamily: "Ionicons",
          color: "#34d399",
        }
      ];
    } else {
      return [
        {
          title: "Monitor Progress",
          subtitle: "Client Progression Tracking",
          description: "Get real-time insights into your clients' journals, thought records, goals, and CBT restructuring practices.",
          icon: "analytics-outline",
          iconFamily: "Ionicons",
          color: COLORS.mediumGreen,
        },
        {
          title: "Resource Control",
          subtitle: "Clinical Worksheet Authoring",
          description: "Create and publish customized protective factors, coping strategies, and educational sheets for your clients.",
          icon: "copy-outline",
          iconFamily: "Ionicons",
          color: "#F59E0B",
        },
        {
          title: "Direct Assignments",
          subtitle: "Assign Worksheets Instantly",
          description: "Assign worksheets directly to clients with personalized clinical notes and monitor their completion rates.",
          icon: "people-outline",
          iconFamily: "Ionicons",
          color: "#6366F1",
        }
      ];
    }
  };

  const slides = getSlides();
  const totalSteps = 2 + slides.length; // Step 0 (Selector), Step 1-3 (Slides), Step 4 (Final screen)

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await finishOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    Alert.alert(
      'Skip Onboarding',
      'Are you sure you want to skip the onboarding? You can always check features inside the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: finishOnboarding }
      ]
    );
  };

  const finishOnboarding = async () => {
    try {
      await SecureStore.setItemAsync('hasSeenOnboarding', 'true');
      await SecureStore.setItemAsync('preferredRole', selectedRole);
      navigation.replace('Login');
    } catch (e) {
      console.error('Failed to save onboarding completion state:', e);
      navigation.replace('Login');
    }
  };

  // Render Step 0: Role Selection Screen
  const renderRoleSelector = () => {
    return (
      <View style={styles.stepContent}>
        <View style={styles.iconHeaderBg}>
          <Ionicons name="star" size={32} color="#34d399" />
        </View>
        <Text style={styles.mainTitle}>Choose Your Role</Text>
        <Text style={styles.mainSubtitle}>Select how you will be using ResilienceHub to customize your walkthrough</Text>

        <View style={styles.roleCardContainer}>
          {/* Client Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setSelectedRole('client')}
            style={[
              styles.roleCard,
              selectedRole === 'client' && styles.roleCardActive,
            ]}
          >
            <View style={[styles.roleCardIconBox, selectedRole === 'client' && { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: '#3B82F6' }]}>
              <Ionicons name="person-outline" size={26} color={selectedRole === 'client' ? '#3B82F6' : 'rgba(255,255,255,0.4)'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.roleCardTitle, selectedRole === 'client' && styles.textWhite]}>I am a Client</Text>
              <Text style={styles.roleCardDesc}>
                I want to log my emotions, restructuring thought entries, SMART goals, and receive guidelines from my clinician.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Therapist Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setSelectedRole('therapist')}
            style={[
              styles.roleCard,
              selectedRole === 'therapist' && styles.roleCardActive,
            ]}
          >
            <View style={[styles.roleCardIconBox, selectedRole === 'therapist' && { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: COLORS.mediumGreen }]}>
              <Ionicons name="medical-outline" size={26} color={selectedRole === 'therapist' ? COLORS.mediumGreen : 'rgba(255,255,255,0.4)'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.roleCardTitle, selectedRole === 'therapist' && styles.textWhite]}>I am a Therapist</Text>
              <Text style={styles.roleCardDesc}>
                I want to track client activities, author custom worksheets, and assign exercises directly to clinical accounts.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render Step 1-3: Dynamic Walkthrough Slides
  const renderSlideContent = () => {
    const slideIdx = currentStep - 1;
    const slide = slides[slideIdx];
    if (!slide) return null;

    return (
      <View style={styles.stepContent}>
        <View style={[styles.slideIconBg, { borderColor: slide.color }]}>
          {slide.iconFamily === 'MaterialCommunityIcons' ? (
            <MaterialCommunityIcons name={slide.icon as any} size={48} color={slide.color} />
          ) : (
            <Ionicons name={slide.icon as any} size={48} color={slide.color} />
          )}
        </View>
        <Text style={styles.slideSubtitle}>{slide.subtitle.toUpperCase()}</Text>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideDesc}>{slide.description}</Text>
      </View>
    );
  };

  // Render Step 4: Final Screen
  const renderFinalScreen = () => {
    return (
      <View style={styles.stepContent}>
        <View style={styles.iconHeaderBgFinal}>
          <Ionicons name="checkmark-circle-outline" size={56} color={COLORS.mediumGreen} />
        </View>
        <Text style={styles.mainTitle}>You're All Set!</Text>
        <Text style={styles.mainSubtitle}>
          Your ResilienceHub portal is ready. Sign in to begin your mental wellness experience as a{' '}
          <Text style={{ color: selectedRole === 'client' ? '#3B82F6' : COLORS.mediumGreen, fontWeight: 'bold' }}>
            {selectedRole === 'client' ? 'Client' : 'Clinician Therapist'}
          </Text>.
        </Text>

        <View style={styles.finalGuidanceCard}>
          <Feather name="shield" size={18} color="#34d399" style={{ marginRight: 12, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.finalGuidanceText}>
              All clinical check-ins, worksheets, goals, and records are fully encrypted and kept secure.
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Pagination Indicator & Skip */}
      <View style={styles.topBar}>
        {currentStep > 0 ? (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}

        <View style={styles.progressContainer}>
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressBarDot,
                idx === currentStep && styles.progressBarDotActive,
                idx < currentStep && styles.progressBarDotCompleted,
              ]}
            />
          ))}
        </View>

        {currentStep < totalSteps - 1 ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Main Slide Content */}
      <View style={styles.mainContent}>
        {currentStep === 0 && renderRoleSelector()}
        {currentStep > 0 && currentStep < totalSteps - 1 && renderSlideContent()}
        {currentStep === totalSteps - 1 && renderFinalScreen()}
      </View>

      {/* Footer Navigation Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          style={[
            styles.actionButton,
            currentStep === totalSteps - 1 && { backgroundColor: COLORS.mediumGreen },
          ]}
        >
          <Text style={styles.actionButtonText}>
            {currentStep === totalSteps - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name={currentStep === totalSteps - 1 ? 'rocket-outline' : 'chevron-forward-outline'}
            size={18}
            color="#FFFFFF"
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkGreen, // Premium dark theme background
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  progressBarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBarDotActive: {
    width: 18,
    backgroundColor: COLORS.primaryGreen,
  },
  progressBarDotCompleted: {
    backgroundColor: 'rgba(5, 150, 105, 0.4)',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stepContent: {
    alignItems: 'center',
  },
  iconHeaderBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  iconHeaderBgFinal: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 32,
  },
  roleCardContainer: {
    width: '100%',
    gap: 16,
  },
  roleCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    gap: 14,
  },
  roleCardActive: {
    borderColor: COLORS.primaryGreen,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
  },
  roleCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  roleCardDesc: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.4)',
    lineHeight: 16,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  slideIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
  },
  slideSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryGreen,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  slideDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  finalGuidanceCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(52, 211, 153, 0.05)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.15)',
    marginTop: 12,
    width: '100%',
  },
  finalGuidanceText: {
    fontSize: 11.5,
    color: '#34d399',
    lineHeight: 17,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  actionButton: {
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
