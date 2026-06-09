import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch, ActivityIndicator,
  TouchableOpacity, Alert, TextInput, Dimensions, Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { ApiService } from '../services/api';

const { width: W } = Dimensions.get('window');

type TabId = 'profile' | 'password' | 'notifications' | 'appearance' | 'account';

// ─── helpers ─────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  const parts = (name || '').split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (name || 'U').slice(0, 2).toUpperCase();
}

function roleLabel(role: string) {
  if (role === 'therapist') return 'Clinical Therapist';
  if (role === 'admin')     return 'Administrator';
  return 'Client';
}

// ─── Section card header ──────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle, danger = false }: {
  icon: React.ReactNode; title: string; subtitle: string; danger?: boolean;
}) {
  return (
    <View style={[sh.row, danger && sh.dangerRow]}>
      <View style={[sh.iconBox, danger && sh.dangerIconBox]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[sh.title, danger && sh.dangerTitle]}>{title}</Text>
        <Text style={sh.sub}>{subtitle}</Text>
      </View>
    </View>
  );
}
const sh = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dangerRow:    { borderBottomColor: '#FEE2E2' },
  iconBox:      { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' },
  dangerIconBox:{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  title:        { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  dangerTitle:  { color: '#DC2626' },
  sub:          { fontSize: 11.5, color: '#94A3B8', marginTop: 1 },
});

// ─── Field label ─────────────────────────────────────────────────────────────
function FieldLabel({ text }: { text: string }) {
  return <Text style={s.fieldLabel}>{text}</Text>;
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function SettingsScreen({ navigation }: { navigation: any }) {
  const [profile, setProfile]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  // Profile form
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [username, setUsername] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [curPwd, setCurPwd]   = useState('');
  const [newPwd, setNewPwd]   = useState('');
  const [confPwd, setConfPwd] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // Notifications
  const [emailNotifs, setEmailNotifs]   = useState(true);
  const [reminderEmails, setReminderEmails] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [reminderFreq, setReminderFreq] = useState<'daily'|'every-other-day'|'twice-weekly'|'weekly'>('daily');
  const freqOptions: { key: typeof reminderFreq; label: string }[] = [
    { key: 'daily',           label: 'Daily' },
    { key: 'every-other-day', label: 'Every Other Day' },
    { key: 'twice-weekly',    label: 'Twice Weekly' },
    { key: 'weekly',          label: 'Weekly' },
  ];

  // Appearance
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  useEffect(() => {
    (async () => {
      try {
        const res = await ApiService.getCurrentUser();
        if (res.data) {
          setProfile(res.data);
          setName(res.data.name || '');
          setEmail(res.data.email || '');
          setUsername(res.data.username || '');
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const handleSaveProfile = async () => {
    if (name.trim().length < 2)     { Alert.alert('Validation', 'Name must be at least 2 characters.'); return; }
    if (username.trim().length < 3) { Alert.alert('Validation', 'Username must be at least 3 characters.'); return; }
    setSavingProfile(true);
    await new Promise(r => setTimeout(r, 600));
    setSavingProfile(false);
    Alert.alert('Profile Updated', 'Your profile information has been updated.');
  };

  const handleSavePassword = async () => {
    if (curPwd.length < 6) { Alert.alert('Validation', 'Current password must be at least 6 characters.'); return; }
    if (newPwd.length < 6) { Alert.alert('Validation', 'New password must be at least 6 characters.'); return; }
    if (newPwd !== confPwd) { Alert.alert('Validation', 'Passwords do not match.'); return; }
    setSavingPwd(true);
    await new Promise(r => setTimeout(r, 600));
    setSavingPwd(false);
    setCurPwd(''); setNewPwd(''); setConfPwd('');
    Alert.alert('Password Updated', 'Your password has been changed successfully.');
  };

  const handleSaveNotifications = () => {
    Alert.alert('Preferences Saved', 'Your notification preferences have been saved.');
  };

  const handleLanguageChange = (lang: 'en' | 'ar') => {
    if (lang === 'ar') {
      Alert.alert(
        'Coming Soon',
        'Arabic version of the app is coming soon. We are working hard to bring you a fully localized experience.',
        [{ text: 'OK' }]
      );
      return;
    }
    setLanguage(lang);
    Alert.alert('Language Changed', 'Display language set to English.');
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        try { await ApiService.logout(); } catch {}
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('userId');
        await SecureStore.deleteItemAsync('userEmail');
        navigation.replace('Login');
      }},
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. This will permanently delete your account and remove all your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: async () => {
          try { await ApiService.logout(); } catch {}
          await SecureStore.deleteItemAsync('authToken');
          await SecureStore.deleteItemAsync('userId');
          await SecureStore.deleteItemAsync('userEmail');
          navigation.replace('Login');
        }},
      ]
    );
  };

  const TABS: { id: TabId; icon: string; label: string }[] = [
    { id: 'profile',       icon: 'user',       label: 'Profile'       },
    { id: 'password',      icon: 'lock',        label: 'Password'      },
    { id: 'notifications', icon: 'bell',        label: 'Notifications' },
    { id: 'appearance',    icon: 'globe',       label: 'Appearance'    },
    { id: 'account',       icon: 'shield',      label: 'Account'       },
  ];

  if (loading) {
    return (
      <View style={s.loadingBox}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  const role = roleLabel(profile?.role || 'client');
  const isClinical = profile?.role === 'admin' || profile?.role === 'therapist';

  return (
    <SafeAreaView style={s.safeArea} edges={['bottom']}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        {/* ── Hero banner ── */}
        <View style={s.hero}>
          {/* decorative blobs */}
          <View style={s.blob1} pointerEvents="none" />
          <View style={s.blob2} pointerEvents="none" />

          <View style={s.heroInner}>
            {/* tag + title */}
            <View style={s.heroTag}>
              <Feather name="star" size={12} color="#A78BFA" />
              <Text style={s.heroTagText}>{isClinical ? 'CLINICAL ACCOUNT' : 'MY ACCOUNT'}</Text>
            </View>
            <Text style={s.heroTitle}>Settings</Text>
            <Text style={s.heroSub}>Manage your account, security, and preferences</Text>

            {/* role + status stats */}
            <View style={s.heroStats}>
              <View style={s.heroStat}>
                <Text style={s.heroStatVal}>{role}</Text>
                <Text style={s.heroStatLabel}>Role</Text>
              </View>
              <View style={s.heroStatDivider} />
              <View style={s.heroStat}>
                <Text style={s.heroStatVal}>Active</Text>
                <Text style={s.heroStatLabel}>Status</Text>
              </View>
            </View>

            {/* account status strip */}
            <View style={s.statusStrip}>
              <View style={s.statusStripTop}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="check-circle" size={13} color="#34D399" />
                  <Text style={s.statusStripLabel}>ACCOUNT STATUS</Text>
                </View>
                <Text style={s.statusStripRight}>Active &amp; Secure</Text>
              </View>
              <View style={s.progressBg}>
                <View style={s.progressFill} />
              </View>
              <Text style={s.statusStripHint}>
                Your account is active and in good standing — keep your security settings up to date.
              </Text>
            </View>
          </View>
        </View>

        <View style={s.body}>
          {/* ── Tab bar ── */}
          <View style={s.tabCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabScroll}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  style={[s.tabBtn, activeTab === tab.id && s.tabBtnActive]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.8}
                >
                  <Feather name={tab.icon as any} size={13} color={activeTab === tab.id ? '#FFFFFF' : '#64748B'} style={{ marginRight: 5 }} />
                  <Text style={[s.tabBtnText, activeTab === tab.id && s.tabBtnTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── PROFILE tab ── */}
          {activeTab === 'profile' && (
            <View style={s.card}>
              {/* user card header */}
              <View style={s.profileHeader}>
                <View style={s.blob3} pointerEvents="none" />
                <View style={s.profileHeaderInner}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{getInitials(profile?.name || '')}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.profileName}>{profile?.name || 'User'}</Text>
                    <View style={s.rolePill}>
                      <Feather name="check-circle" size={10} color="#C4B5FD" style={{ marginRight: 3 }} />
                      <Text style={s.rolePillText}>{role.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={s.formBody}>
                <Text style={s.sectionMini}>PROFILE INFORMATION</Text>
                <View style={s.fieldGroup}>
                  <FieldLabel text="FULL NAME" />
                  <TextInput
                    style={s.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Your full name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={s.fieldGroup}>
                  <FieldLabel text="USERNAME" />
                  <TextInput
                    style={s.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Your username"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                </View>
                <View style={s.fieldGroup}>
                  <FieldLabel text="EMAIL ADDRESS" />
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Your email address"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity
                  style={[s.saveBtn, savingProfile && { opacity: 0.7 }]}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                  activeOpacity={0.85}
                >
                  {savingProfile
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <Text style={s.saveBtnText}>Save Changes</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── PASSWORD tab ── */}
          {activeTab === 'password' && (
            <View style={s.card}>
              <SectionHeader
                icon={<Feather name="lock" size={18} color="#052e16" />}
                title="Change Password"
                subtitle="Keep your account secure with a strong password"
              />
              <View style={s.formBody}>
                <View style={s.fieldGroup}>
                  <FieldLabel text="CURRENT PASSWORD" />
                  <View style={s.pwdRow}>
                    <TextInput
                      style={s.pwdInput}
                      value={curPwd}
                      onChangeText={setCurPwd}
                      placeholder="Enter your current password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showCur}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowCur(v => !v)} style={s.eyeBtn} activeOpacity={0.7}>
                      <Feather name={showCur ? 'eye-off' : 'eye'} size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={s.fieldGroup}>
                  <FieldLabel text="NEW PASSWORD" />
                  <View style={s.pwdRow}>
                    <TextInput
                      style={s.pwdInput}
                      value={newPwd}
                      onChangeText={setNewPwd}
                      placeholder="New password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showNew}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowNew(v => !v)} style={s.eyeBtn} activeOpacity={0.7}>
                      <Feather name={showNew ? 'eye-off' : 'eye'} size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <Text style={s.hint}>Minimum 6 characters</Text>
                </View>
                <View style={s.fieldGroup}>
                  <FieldLabel text="CONFIRM PASSWORD" />
                  <View style={s.pwdRow}>
                    <TextInput
                      style={s.pwdInput}
                      value={confPwd}
                      onChangeText={setConfPwd}
                      placeholder="Confirm new password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showConf}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowConf(v => !v)} style={s.eyeBtn} activeOpacity={0.7}>
                      <Feather name={showConf ? 'eye-off' : 'eye'} size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  {confPwd.length > 0 && confPwd !== newPwd && (
                    <Text style={s.errorText}>Passwords do not match</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[s.saveBtn, savingPwd && { opacity: 0.7 }]}
                  onPress={handleSavePassword}
                  disabled={savingPwd}
                  activeOpacity={0.85}
                >
                  {savingPwd
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <Text style={s.saveBtnText}>Update Password</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── NOTIFICATIONS tab ── */}
          {activeTab === 'notifications' && (
            <View style={s.card}>
              <SectionHeader
                icon={<Feather name="bell" size={18} color="#052e16" />}
                title="Notification Preferences"
                subtitle="Control how and when you receive notifications"
              />
              <View style={s.formBody}>
                {([
                  { state: emailNotifs,    set: setEmailNotifs,    label: 'Email Notifications',  desc: 'Receive notifications via email' },
                  { state: reminderEmails, set: setReminderEmails, label: 'Reminder Emails',       desc: 'Reminders to log emotions and complete exercises' },
                  { state: weeklyDigest,   set: setWeeklyDigest,   label: 'Weekly Digest',         desc: 'A weekly summary of your progress' },
                ] as const).map(item => (
                  <View key={item.label} style={s.toggleRow}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={s.toggleLabel}>{item.label}</Text>
                      <Text style={s.toggleDesc}>{item.desc}</Text>
                    </View>
                    <Switch
                      value={item.state}
                      onValueChange={item.set}
                      trackColor={{ false: '#CBD5E1', true: '#A78BFA' }}
                      thumbColor={item.state ? '#059669' : '#F1F5F9'}
                    />
                  </View>
                ))}

                <Text style={[s.sectionMini, { marginTop: 12 }]}>REMINDER FREQUENCY</Text>
                <View style={s.freqGrid}>
                  {freqOptions.map(opt => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[s.freqBtn, reminderFreq === opt.key && s.freqBtnActive]}
                      onPress={() => setReminderFreq(opt.key)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.freqBtnText, reminderFreq === opt.key && s.freqBtnTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={s.hint}>How often you'll receive reminder notifications</Text>

                <TouchableOpacity style={s.saveBtn} onPress={handleSaveNotifications} activeOpacity={0.85}>
                  <Text style={s.saveBtnText}>Save Preferences</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── APPEARANCE tab ── */}
          {activeTab === 'appearance' && (
            <View style={s.card}>
              <SectionHeader
                icon={<Feather name="globe" size={18} color="#052e16" />}
                title="Appearance"
                subtitle="Customize language and display settings"
              />
              <View style={s.formBody}>
                <Text style={s.sectionMini}>LANGUAGE</Text>
                <View style={s.langCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.toggleLabel}>Application Language</Text>
                    <Text style={s.toggleDesc}>Select your preferred display language</Text>
                  </View>
                </View>
                <View style={s.langBtns}>
                  {([{ key: 'en', label: 'English' }, { key: 'ar', label: 'Arabic (العربية)' }] as const).map(opt => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[s.langBtn, language === opt.key && s.langBtnActive]}
                      onPress={() => handleLanguageChange(opt.key)}
                      activeOpacity={0.8}
                    >
                      <Feather name="globe" size={14} color={language === opt.key ? '#FFF' : '#64748B'} style={{ marginRight: 6 }} />
                      <Text style={[s.langBtnText, language === opt.key && s.langBtnTextActive]}>{opt.label}</Text>
                      {language === opt.key && <Feather name="check" size={13} color="#FFF" style={{ marginLeft: 'auto' }} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ── ACCOUNT tab ── */}
          {activeTab === 'account' && (
            <View style={{ gap: 12 }}>
              {/* Account info */}
              <View style={s.card}>
                <SectionHeader
                  icon={<Feather name="shield" size={18} color="#052e16" />}
                  title="Account Information"
                  subtitle="Details about your account and membership"
                />
                <View style={s.infoBody}>
                  {[
                    { label: 'Account Type',   value: role,      green: false },
                    { label: 'Account Status', value: 'Active',  green: true  },
                  ].map(row => (
                    <View key={row.label} style={s.infoRow}>
                      <Text style={s.infoLabel}>{row.label}</Text>
                      <Text style={[s.infoVal, row.green && { color: '#059669' }]}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Sign out */}
              <View style={s.card}>
                <SectionHeader
                  icon={<Feather name="log-out" size={18} color="#052e16" />}
                  title="Session"
                  subtitle="Manage your current login session"
                />
                <View style={s.infoBody}>
                  <TouchableOpacity style={s.outlineBtn} onPress={handleLogout} activeOpacity={0.85}>
                    <Feather name="log-out" size={16} color="#64748B" style={{ marginRight: 10 }} />
                    <Text style={s.outlineBtnText}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Danger zone */}
              <View style={[s.card, { borderColor: '#FECACA' }]}>
                <SectionHeader
                  icon={<Feather name="alert-triangle" size={18} color="#DC2626" />}
                  title="Danger Zone"
                  subtitle="Irreversible actions — proceed with caution"
                  danger
                />
                <View style={s.infoBody}>
                  <TouchableOpacity style={s.dangerBtn} onPress={handleDeleteAccount} activeOpacity={0.85}>
                    <Feather name="alert-triangle" size={16} color="#DC2626" style={{ marginRight: 10 }} />
                    <Text style={s.dangerBtnText}>Delete Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea:   { flex: 1, backgroundColor: '#F8FAFC' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },

  // Hero
  hero: { backgroundColor: '#052e16', paddingBottom: 20, overflow: 'hidden', position: 'relative' },
  blob1: { position: 'absolute', top: -40, right: 20, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(124,58,237,0.08)' },
  blob2: { position: 'absolute', bottom: 0, left: 40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(99,102,241,0.07)' },
  heroInner: { paddingHorizontal: 20, paddingTop: 20 },
  heroTag:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  heroTagText: { color: 'rgba(167,139,250,0.8)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 4 },
  heroSub:   { color: 'rgba(196,181,253,0.7)', fontSize: 13, lineHeight: 18, marginBottom: 16 },
  heroStats: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 16 },
  heroStat:  { alignItems: 'center' },
  heroStatVal:   { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
  heroStatLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(196,181,253,0.65)', marginTop: 1 },
  heroStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' },
  statusStrip: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 14 },
  statusStripTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  statusStripLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(196,181,253,0.8)', letterSpacing: 1.5 },
  statusStripRight: { fontSize: 10, color: 'rgba(196,181,253,0.6)' },
  progressBg:   { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { width: '100%', height: 6, borderRadius: 3, backgroundColor: '#34D399' },
  statusStripHint: { fontSize: 10, color: 'rgba(196,181,253,0.5)', lineHeight: 14 },

  // Body
  body: { padding: 16, gap: 12 },

  // Tab bar
  tabCard:   { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9', padding: 6, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  tabScroll: { gap: 4, paddingHorizontal: 2 },
  tabBtn:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  tabBtnActive: { backgroundColor: '#052e16' },
  tabBtnText:   { fontSize: 13, fontWeight: '700', color: '#64748B' },
  tabBtnTextActive: { color: '#FFFFFF' },

  // Card
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },

  // Profile header
  profileHeader: { backgroundColor: '#052e16', paddingHorizontal: 16, paddingVertical: 18, overflow: 'hidden' },
  blob3: { position: 'absolute', top: -30, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(124,58,237,0.15)' },
  profileHeaderInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  profileName: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  rolePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(167,139,250,0.15)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 5 },
  rolePillText: { fontSize: 9, fontWeight: '900', color: '#C4B5FD', letterSpacing: 0.5 },

  // Form
  formBody:   { padding: 16, gap: 10 },
  sectionMini:{ fontSize: 9.5, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 2 },
  fieldGroup: { gap: 5 },
  fieldLabel: { fontSize: 9.5, fontWeight: '800', color: '#64748B', letterSpacing: 0.8, textTransform: 'uppercase' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1E293B' },
  hint:  { fontSize: 11, color: '#94A3B8' },
  errorText: { fontSize: 11.5, color: '#EF4444', fontWeight: '600' },
  saveBtn: { backgroundColor: '#052e16', borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  // Password
  pwdRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12 },
  pwdInput:{ flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1E293B' },
  eyeBtn:  { paddingHorizontal: 12, paddingVertical: 12 },

  // Notifications toggles
  toggleRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 13, marginBottom: 4 },
  toggleLabel: { fontSize: 13.5, fontWeight: '700', color: '#1E293B' },
  toggleDesc:  { fontSize: 11, color: '#64748B', marginTop: 1 },
  freqGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  freqBtn:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  freqBtnActive: { backgroundColor: '#052e16', borderColor: '#052e16' },
  freqBtnText:   { fontSize: 12.5, fontWeight: '700', color: '#475569' },
  freqBtnTextActive: { color: '#FFFFFF' },

  // Language
  langCard:  { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 13, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  langBtns:  { gap: 8 },
  langBtn:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 12 },
  langBtnActive: { backgroundColor: '#052e16', borderColor: '#052e16' },
  langBtnText:   { fontSize: 13.5, fontWeight: '700', color: '#475569' },
  langBtnTextActive: { color: '#FFFFFF' },

  // Account info
  infoBody: { padding: 14, gap: 8 },
  infoRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 12 },
  infoLabel:{ fontSize: 13, color: '#64748B', fontWeight: '500' },
  infoVal:  { fontSize: 13, fontWeight: '700', color: '#1E293B' },

  // Buttons in account tab
  outlineBtn:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 13, paddingVertical: 13, paddingHorizontal: 16 },
  outlineBtnText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  dangerBtn:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#FECACA', borderRadius: 13, paddingVertical: 13, paddingHorizontal: 16, backgroundColor: '#FFF5F5' },
  dangerBtnText: { fontSize: 14, fontWeight: '700', color: '#DC2626' },

  // Bottom nav
});
