import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { ApiService } from '../services/api';

const { width } = Dimensions.get('window');

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Forgot password modal state
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetEmailFocused, setResetEmailFocused] = useState(false);

  React.useEffect(() => {
    const checkState = async () => {
      try {
        // 1. Check if user needs onboarding first
        const hasSeenOnboarding = await SecureStore.getItemAsync('hasSeenOnboarding');
        if (hasSeenOnboarding !== 'true') {
          navigation.replace('Onboarding');
          return;
        }

        // 2. Check if user is already logged in
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          ApiService.setAuthToken(token);
          navigation.replace('MainTabs');
        }
      } catch (e) {
        console.log('Error verifying launch state:', e);
      }
    };
    checkState();
  }, [navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.login(email.trim(), password);

      if (response.data && response.data.user) {
        // Store user data securely
        await SecureStore.setItemAsync('userId', response.data.user.id.toString());
        await SecureStore.setItemAsync('userEmail', response.data.user.email);
        
        // Set auth token if provided (stored securely)
        if (response.data.token) {
          await SecureStore.setItemAsync('authToken', response.data.token);
          ApiService.setAuthToken(response.data.token);
        }
        
        // Navigate to main app tabs
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Login Failed', response.error || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Network Error', 'Failed to connect to the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      Alert.alert('Validation Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    setResetLoading(true);
    try {
      const response = await ApiService.forgotPassword(resetEmail.trim());
      if (response.error) {
        Alert.alert('Error', response.error);
      } else {
        Alert.alert(
          'Email Sent',
          response.data?.message || 'If your email is in our system, you will receive a password reset link.'
        );
        setForgotModalVisible(false);
        setResetEmail('');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert('Error', 'Failed to request password reset. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative Blobs */}
      <View style={styles.blob1} pointerEvents="none" />
      <View style={styles.blob2} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="globe-outline" size={36} color="#8B5CF6" />
            </View>
            <Text style={styles.title}>ResilienceHub</Text>
            <Text style={styles.subtitle}>Your Clinical CBT Companion</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeader}>SIGN IN TO YOUR PORTAL</Text>

            {/* Email Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={[styles.inputContainer, emailFocused && styles.inputContainerActive]}>
                <Feather name="mail" size={16} color={emailFocused ? '#8B5CF6' : 'rgba(255,255,255,0.3)'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={[styles.inputContainer, passwordFocused && styles.inputContainerActive]}>
                <Feather name="lock" size={16} color={passwordFocused ? '#8B5CF6' : 'rgba(255,255,255,0.3)'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setForgotModalVisible(true)}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Log In Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Sign In</Text>
                  <Feather name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Registration Link */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Register')}
            style={styles.registerLink}
          >
            <Feather name="user-plus" size={14} color="#8B5CF6" style={{ marginRight: 6 }} />
            <Text style={styles.registerLinkText}>Register as Professional (Therapist/Admin)</Text>
          </TouchableOpacity>

          {/* Footer Guide Replay Link */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Onboarding')}
            style={styles.guideLink}
          >
            <Ionicons name="star-outline" size={14} color="#C084FC" style={{ marginRight: 6 }} />
            <Text style={styles.guideLinkText}>View Features Onboarding Guide</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={forgotModalVisible}
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => setForgotModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={20} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Enter your email address below. If you have an account, we will send you a recovery link to reset your password.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={[styles.inputContainer, resetEmailFocused && styles.inputContainerActive]}>
                <Feather name="mail" size={16} color={resetEmailFocused ? '#8B5CF6' : 'rgba(255,255,255,0.3)'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter recovery email"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setResetEmailFocused(true)}
                  onBlur={() => setResetEmailFocused(false)}
                />
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleForgotPassword}
                disabled={resetLoading}
                style={[styles.modalSendBtn, resetLoading && { opacity: 0.6 }]}
              >
                {resetLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSendBtnText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090514', // Matching dark theme background
  },
  keyboardView: {
    flex: 1,
  },
  blob1: {
    position: 'absolute',
    top: -60,
    right: -20,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  blob2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 24,
    shadowColor: '#090514',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#8B5CF6',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputContainerActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  eyeBtn: {
    padding: 8,
  },
  button: {
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  guideLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  guideLinkText: {
    color: '#C084FC',
    fontSize: 13,
    fontWeight: '700',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#8B5CF6',
    fontSize: 13,
    fontWeight: '700',
  },
  registerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  registerLinkText: {
    color: '#8B5CF6',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 5, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1C1926',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalActionRow: {
    marginTop: 8,
  },
  modalSendBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSendBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});