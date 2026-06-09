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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { ApiService } from '../services/api';

const { width } = Dimensions.get('window');

interface RegisterScreenProps {
  navigation: any;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'therapist' | 'admin'>('therapist');
  const [loading, setLoading] = useState(false);

  // Focus states
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !username || !password) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert('Validation Error', 'Username must be at least 3 characters');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.register({
        name: name.trim(),
        email: email.trim(),
        username: username.trim(),
        password,
        role,
      });

      if (response.data) {
        Alert.alert(
          'Registration Successful',
          'Your account has been created. Setting up your session...',
          [
            {
              text: 'OK',
              onPress: async () => {
                // If a token/session is returned, save it. Otherwise redirect to login.
                const user = response.data;
                const token = response.data.token;
                
                if (user && user.id) {
                  await SecureStore.setItemAsync('userId', user.id.toString());
                  await SecureStore.setItemAsync('userEmail', user.email);
                  
                  if (token) {
                    await SecureStore.setItemAsync('authToken', token);
                    ApiService.setAuthToken(token);
                    navigation.replace('MainTabs');
                    return;
                  }
                }
                
                // Fallback to Login if no direct session token is returned
                navigation.replace('Login');
              }
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', response.error || 'Failed to create account. Username/Email might be taken.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Network Error', 'Failed to connect to the server. Please check your internet connection.');
    } finally {
      setLoading(false);
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="shield-checkmark-outline" size={32} color="#8B5CF6" />
            </View>
            <Text style={styles.title}>Register Account</Text>
            <Text style={styles.subtitle}>ResilienceHub Professional Portal</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Role selector */}
            <Text style={styles.inputLabel}>PROFESSIONAL ROLE</Text>
            <View style={styles.roleToggleGroup}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setRole('therapist')}
                style={[styles.roleToggleBtn, role === 'therapist' && styles.roleToggleBtnActive]}
              >
                <Ionicons name="medical-outline" size={16} color={role === 'therapist' ? '#FFFFFF' : 'rgba(255,255,255,0.4)'} style={{ marginRight: 6 }} />
                <Text style={[styles.roleToggleText, role === 'therapist' && styles.textWhite]}>Therapist</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setRole('admin')}
                style={[styles.roleToggleBtn, role === 'admin' && styles.roleToggleBtnActive]}
              >
                <Ionicons name="shield-outline" size={16} color={role === 'admin' ? '#FFFFFF' : 'rgba(255,255,255,0.4)'} style={{ marginRight: 6 }} />
                <Text style={[styles.roleToggleText, role === 'admin' && styles.textWhite]}>Admin</Text>
              </TouchableOpacity>
            </View>

            {/* Name Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <View style={[styles.inputContainer, nameFocused && styles.inputContainerActive]}>
                <Feather name="user" size={16} color={nameFocused ? '#8B5CF6' : 'rgba(255,255,255,0.3)'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                />
              </View>
            </View>

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

            {/* Username Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>CHOOSE USERNAME</Text>
              <View style={[styles.inputContainer, usernameFocused && styles.inputContainerActive]}>
                <Feather name="at-sign" size={16} color={usernameFocused ? '#8B5CF6' : 'rgba(255,255,255,0.3)'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Choose a username"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
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
                  placeholder="Choose password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => passwordFocused && setPasswordFocused(false)}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Register Professional Account</Text>
                  <Feather name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Back Link */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Login')}
            style={styles.backLink}
          >
            <Feather name="arrow-left" size={14} color="#8B5CF6" style={{ marginRight: 6 }} />
            <Text style={styles.backLinkText}>Back to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
    justifyContent: 'center',
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
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
  fieldGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#8B5CF6',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  roleToggleGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  roleToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
  },
  roleToggleBtnActive: {
    backgroundColor: '#8B5CF6',
  },
  roleToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
  },
  textWhite: {
    color: '#FFFFFF',
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
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '800',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  backLinkText: {
    color: '#8B5CF6',
    fontSize: 13,
    fontWeight: '700',
  },
});
