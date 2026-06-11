import React, { useState, useRef } from 'react';
import { COLORS } from '../styles/theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrentUser } from '../hooks/queries/useProfile';
import { useResources } from '../hooks/queries/useResources';
import { useProtectiveFactors, useCopingStrategies } from '../hooks/queries/useClinical';
import { useTherapistClients, useTherapistAssignments } from '../hooks/queries/useTherapist';

const { width, height } = Dimensions.get('window');

// Helper to parse and render simple HTML text fields cleanly in native React Native screens
function renderHTMLContent(html: string) {
  if (!html) return null;

  // Normalize block tags
  const cleanHtml = html
    .trim()
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '');

  const blocks: { type: string; content: string }[] = [];
  const blockRegex = /<(p|h1|h2|h3|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  let lastIndex = 0;

  while ((match = blockRegex.exec(cleanHtml)) !== null) {
    const textBefore = cleanHtml.slice(lastIndex, match.index).trim();
    if (textBefore) {
      blocks.push({ type: 'p', content: textBefore });
    }
    blocks.push({
      type: match[1].toLowerCase(),
      content: match[2],
    });
    lastIndex = blockRegex.lastIndex;
  }

  const textAfter = cleanHtml.slice(lastIndex).trim();
  if (textAfter) {
    blocks.push({ type: 'p', content: textAfter });
  }

  if (blocks.length === 0 && cleanHtml) {
    blocks.push({ type: 'p', content: cleanHtml });
  }

  return (
    <View style={styles.htmlContainer}>
      {blocks.map((block, blockIdx) => {
        const inlineElements: React.ReactNode[] = [];
        const inlineRegex = /(<[^>]+>)/g;
        const parts = block.content.split(inlineRegex);
        
        const currentStyles: any = {};
        
        parts.forEach((part, partIdx) => {
          if (part.startsWith('<')) {
            const tagName = part.replace(/[<>/]/g, '').toLowerCase().trim().split(' ')[0];
            const isClosing = part.startsWith('</');
            
            if (tagName === 'strong' || tagName === 'b') {
              currentStyles.fontWeight = isClosing ? undefined : 'bold';
            } else if (tagName === 'em' || tagName === 'i') {
              currentStyles.fontStyle = isClosing ? undefined : 'italic';
            } else if (tagName === 'u') {
              currentStyles.textDecorationLine = isClosing ? undefined : 'underline';
            } else if (tagName === 'br') {
              inlineElements.push(<Text key={`br-${blockIdx}-${partIdx}`}>{'\n'}</Text>);
            }
          } else {
            if (part) {
              const decodedText = part
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");
              
              inlineElements.push(
                <Text key={`text-${blockIdx}-${partIdx}`} style={{ ...currentStyles }}>
                  {decodedText}
                </Text>
              );
            }
          }
        });

        switch (block.type) {
          case 'h1':
            return (
              <Text key={`block-${blockIdx}`} style={styles.htmlH1}>
                {inlineElements}
              </Text>
            );
          case 'h2':
            return (
              <Text key={`block-${blockIdx}`} style={styles.htmlH2}>
                {inlineElements}
              </Text>
            );
          case 'h3':
            return (
              <Text key={`block-${blockIdx}`} style={styles.htmlH3}>
                {inlineElements}
              </Text>
            );
          case 'li':
            return (
              <View key={`block-${blockIdx}`} style={styles.htmlLiRow}>
                <Text style={styles.htmlBullet}>• </Text>
                <Text style={styles.htmlLiText}>{inlineElements}</Text>
              </View>
            );
          case 'p':
          default:
            return (
              <Text key={`block-${blockIdx}`} style={styles.htmlParagraph}>
                {inlineElements}
              </Text>
            );
        }
      })}
    </View>
  );
}

// Strip HTML tags for plain-text card previews
function stripHTML(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// ALL RESOURCES TAB — unified searchable list of every resource type
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_META = {
  educational: { label: 'Educational', color: COLORS.primaryGreen, bg: '#ecfdf5', icon: 'book-open' as const },
  protective:  { label: 'Protective Factor', color: COLORS.mediumGreen, bg: '#ECFDF5', icon: 'shield' as const },
  coping:      { label: 'Coping Strategy', color: '#3B82F6', bg: '#EFF6FF', icon: 'zap' as const },
};

const DEFAULT_CATEGORIES = [
  'CBT Basics', 'Anxiety', 'Depression', 'Stress Management',
  'Mindfulness', 'Emotional Regulation', 'Relationships', 'Trauma', 'Self Care',
];

function AllResourcesTab({
  resources, protectiveFactors, copingStrategies,
  getCategoryTheme, renderIcon, onSelectResource, onSelectClinical,
}: {
  resources: any[]; protectiveFactors: any[]; copingStrategies: any[];
  getCategoryTheme: (c: string) => any; renderIcon: (t: any, s: number) => any;
  onSelectResource: (r: any) => void;
  onSelectClinical: (item: any, type: 'factor' | 'strategy') => void;
}) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Build category list from defaults + any extra categories present in data
  const categories = [
    'All',
    ...Array.from(new Set([
      ...DEFAULT_CATEGORIES,
      ...resources.map((r) => r.category).filter(Boolean),
    ])),
  ];

  const combined = [
    ...resources.map((r) => ({ ...r, _type: 'educational' as const })),
    ...protectiveFactors.map((f) => ({
      ...f, id: `pf-${f.id}`, title: f.name,
      category: null, _type: 'protective' as const,
    })),
    ...copingStrategies.map((s) => ({
      ...s, id: `cs-${s.id}`, title: s.name,
      category: null, _type: 'coping' as const,
    })),
  ];

  const filtered = combined.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || (item.title || '').toLowerCase().includes(q)
      || (item.description || '').toLowerCase().includes(q);
    // Category filter only applies to educational resources; PF/CS always show
    const matchCat = activeCategory === 'All'
      || item._type !== 'educational'
      || item.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Search */}
      <View style={allStyles.searchWrap}>
        <View style={allStyles.searchBox}>
          <Feather name="search" size={15} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={allStyles.searchInput}
            placeholder="Search all resources…"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <View style={allStyles.clearBtn}><Feather name="x" size={10} color="#64748B" /></View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category pills — horizontally scrollable, matching web app */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={allStyles.pillsScroll}
        style={allStyles.pillsContainer}
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const theme = cat !== 'All' ? getCategoryTheme(cat) : null;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                allStyles.pill,
                isActive
                  ? { backgroundColor: theme?.color ?? COLORS.darkGreen, borderColor: theme?.color ?? COLORS.darkGreen }
                  : { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
              ]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.8}
            >
              {cat !== 'All' && theme && (
                <View style={{ marginRight: 5 }}>{renderIcon(theme, 11)}</View>
              )}
              {cat === 'All' && (
                <Feather name="layers" size={11} color={isActive ? '#fff' : '#64748B'} style={{ marginRight: 5 }} />
              )}
              <Text style={[allStyles.pillText, isActive && { color: '#FFFFFF' }]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Count hint */}
      <View style={allStyles.hintRow}>
        <Text style={allStyles.hintText}>{filtered.length} resource{filtered.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={allStyles.empty}>
          <Feather name="layers" size={32} color={COLORS.disabledBg} />
          <Text style={allStyles.emptyTitle}>No resources found</Text>
          <Text style={allStyles.emptyDesc}>Try a different search or category.</Text>
        </View>
      ) : (
        filtered.map((item) => {
          const meta = TYPE_META[item._type as keyof typeof TYPE_META];
          const theme = item._type === 'educational' ? getCategoryTheme(item.category) : null;
          return (
            <TouchableOpacity
              key={item.id}
              style={allStyles.card}
              activeOpacity={0.8}
              onPress={() => {
                if (item._type === 'educational') onSelectResource(item);
                else if (item._type === 'protective') onSelectClinical(item, 'factor');
                else if (item._type === 'coping') onSelectClinical(item, 'strategy');
              }}
            >
              {/* Type badge */}
              <View style={[allStyles.typeBadge, { backgroundColor: meta.bg }]}>
                <Feather name={meta.icon} size={11} color={meta.color} />
                <Text style={[allStyles.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
              </View>

              {/* Content row */}
              <View style={allStyles.cardContent}>
                <View style={[allStyles.cardIconBox, { backgroundColor: theme?.lightBg ?? meta.bg }]}>
                  {theme ? renderIcon(theme, 18) : <Feather name={meta.icon} size={18} color={meta.color} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={allStyles.cardTitle} numberOfLines={1}>{item.title || '—'}</Text>
                  {item.description ? (
                    <Text style={allStyles.cardDesc} numberOfLines={2}>{stripHTML(item.description)}</Text>
                  ) : null}
                  {item.category ? (
                    <Text style={[allStyles.cardCategory, { color: theme?.color ?? meta.color }]}>{item.category}</Text>
                  ) : null}
                </View>
                <Feather name="chevron-right" size={16} color={COLORS.disabledBg} />
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

const allStyles = StyleSheet.create({
  searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 11,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },
  clearBtn: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  pillsContainer: { maxHeight: 48 },
  pillsScroll: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: 'center' },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF',
    flexShrink: 0,
  },
  pillText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  hintRow: { paddingHorizontal: 20, paddingBottom: 8 },
  hintText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  card: {
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
    padding: 14,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 10 },
  typeBadgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 3 },
  cardDesc: { fontSize: 12, color: '#64748B', lineHeight: 17 },
  cardCategory: { fontSize: 10, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  emptyDesc: { fontSize: 13, color: '#94A3B8' },
});

export default function ResourceLibraryScreen() {
  const { userId, role } = useAuth();
  const profileQ = useCurrentUser();
  const resourcesQ = useResources();
  const pfQ = useProtectiveFactors(userId);
  const csQ = useCopingStrategies(userId);
  const isTherapistRole = role === 'therapist' || role === 'admin';
  const assignmentsQ = useTherapistAssignments(isTherapistRole);
  const clientsQ = useTherapistClients(isTherapistRole);

  const profile = profileQ.data?.user ?? profileQ.data;
  const userRole = role;
  const loading = profileQ.isLoading || resourcesQ.isLoading || pfQ.isLoading || csQ.isLoading;
  const [activeTab, setActiveTab] = useState<string>('all-resources');

  // Educational resources
  const resources = resourcesQ.data ?? [];
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [selectedClinicalItem, setSelectedClinicalItem] = useState<{ item: any; type: 'factor' | 'strategy' } | null>(null);

  // Protective Factors & Coping Strategies
  const protectiveFactors = pfQ.data ?? [];
  const copingStrategies = csQ.data ?? [];

  // Client assignments (for therapists)
  const assignments = assignmentsQ.data ?? [];
  const clients = clientsQ.data ?? [];

    // Modal form states for CRUD operations
  const [resourceModalVisible, setResourceModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const richTextRef = useRef<RichEditor>(null);

  // Monkey-patch the RichEditor to prevent it from stealing focus on Android
  React.useEffect(() => {
    if (richTextRef.current && Platform.OS === 'android') {
      richTextRef.current.showAndroidKeyboard = function() {
        this.webviewBridge?.requestFocus?.();
      };
    }
  }, [currentStep, resourceModalVisible]);
  
  const [resourceType, setResourceType] = useState<'factor' | 'strategy' | 'educational'>('factor');
  const [editingResource, setEditingResource] = useState<any>(null);
  const [resourceName, setResourceName] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [resourceContent, setResourceContent] = useState('');
  const [resourceIsGlobal, setResourceIsGlobal] = useState(false);
  const [submittingResource, setSubmittingResource] = useState(false);

  // Assign resource states
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignResourceItem, setAssignResourceItem] = useState<any>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [assignNotes, setAssignNotes] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const isTherapist =
    profile?.role === 'therapist' || profile?.role === 'admin' ||
    userRole === 'therapist' || userRole === 'admin';

  // Refetch aliases — mutation handlers call these after create/update/delete.
  const fetchProtectiveFactors = (_userId?: number) => pfQ.refetch();
  const fetchCopingStrategies = (_userId?: number) => csQ.refetch();
  const fetchAssignments = () => assignmentsQ.refetch();

  // Theme mapper helper based on clinical categories
  const getCategoryTheme = (cat: string) => {
    const category = cat?.toLowerCase() || '';
    if (category.includes('cbt basics')) {
      return { color: COLORS.primaryGreen, icon: 'brain', iconFamily: 'MaterialCommunityIcons', lightBg: '#ecfdf5', textColor: '#064e3b' };
    } else if (category.includes('anxiety')) {
      return { color: '#EF4444', icon: 'activity', iconFamily: 'Feather', lightBg: '#FEF2F2', textColor: '#991B1B' };
    } else if (category.includes('depression')) {
      return { color: '#3B82F6', icon: 'heart', iconFamily: 'Feather', lightBg: '#EFF6FF', textColor: '#1E40AF' };
    } else if (category.includes('stress')) {
      return { color: COLORS.mediumGreen, icon: 'shield', iconFamily: 'Feather', lightBg: '#ECFDF5', textColor: '#065F46' };
    } else if (category.includes('mindfulness')) {
      return { color: '#F59E0B', icon: 'sun', iconFamily: 'Feather', lightBg: '#FFFBEB', textColor: '#854D0E' };
    } else if (category.includes('self care')) {
      return { color: COLORS.mediumGreen, icon: 'smile', iconFamily: 'Feather', lightBg: '#ECFDF5', textColor: '#065F46' };
    } else if (category.includes('relationship')) {
      return { color: '#EC4899', icon: 'users', iconFamily: 'Feather', lightBg: '#FDF2F8', textColor: '#9D174D' };
    } else if (category.includes('regulation') || category.includes('emotional regulation')) {
      return { color: '#EC4899', icon: 'smile', iconFamily: 'Feather', lightBg: '#FDF2F8', textColor: '#9D174D' };
    } else if (category.includes('trauma')) {
      return { color: '#64748B', icon: 'activity', iconFamily: 'Feather', lightBg: '#F1F5F9', textColor: '#334155' };
    } else {
      return { color: '#64748B', icon: 'book-open', iconFamily: 'Feather', lightBg: '#F8FAFC', textColor: '#334155' };
    }
  };

  const defaultCategories = [
    'CBT Basics',
    'Anxiety',
    'Depression',
    'Stress Management',
    'Mindfulness',
    'Emotional Regulation',
    'Relationships',
    'Trauma',
    'Self Care'
  ];

  const categories = [
    'All',
    ...Array.from(new Set([
      ...defaultCategories,
      ...resources.map(r => r.category).filter(Boolean)
    ]))
  ];

  const filteredResources = resources.filter(r => {
    const matchesSearch =
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === 'All' || (r.category || 'General') === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredResource = resources.length > 0 ? resources[0] : null;

  const renderIcon = (theme: any, size: number = 20) => {
    if (theme.iconFamily === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={theme.icon as any} size={size} color={theme.color} />;
    } else if (theme.iconFamily === 'Ionicons') {
      return <Ionicons name={theme.icon as any} size={size} color={theme.color} />;
    } else {
      return <Feather name={theme.icon as any} size={size} color={theme.color} />;
    }
  };

    // CRUD handlers for Resources
  const handleAddResource = (defaultType: 'factor' | 'strategy' | 'educational' = 'factor') => {
    setCurrentStep(1);
    setResourceType(defaultType);
    setEditingResource(null);
    setResourceName('');
    setResourceDescription('');
    setResourceContent('');
    setResourceIsGlobal(false);
    setResourceModalVisible(true);
  };

  const handleEditEducational = (item: any) => {
    setCurrentStep(2);
    setResourceType('educational');
    setEditingResource(item);
    setResourceName(item.title);
    setResourceDescription(item.description || '');
    setResourceContent(item.content || item.description || '');
    setResourceIsGlobal(false);
    setResourceModalVisible(true);
  };

  const handleEditPf = (item: any) => {
    setCurrentStep(2);
    setResourceType('factor');
    setEditingResource(item);
    setResourceName(item.name);
    setResourceDescription(item.description || '');
    setResourceContent(item.content || '');
    setResourceIsGlobal(item.isGlobal || false);
    setResourceModalVisible(true);
  };

  const handleEditCs = (item: any) => {
    setCurrentStep(2);
    setResourceType('strategy');
    setEditingResource(item);
    setResourceName(item.name);
    setResourceDescription(item.description || '');
    setResourceContent(item.content || '');
    setResourceIsGlobal(item.isGlobal || false);
    setResourceModalVisible(true);
  };

  const handleSaveResource = async () => {
    if (!resourceName.trim()) {
      Alert.alert('Validation Error', 'Please enter a name.');
      return;
    }
    try {
      setSubmittingResource(true);

      if (resourceType === 'factor') {
        const data = { name: resourceName, description: resourceDescription, isGlobal: resourceIsGlobal };
        if (editingResource) {
          await ApiService.updateProtectiveFactor(profile.id, editingResource.id, data);
          Alert.alert('Success', 'Protective factor updated successfully.');
        } else {
          await ApiService.createProtectiveFactor(profile.id, data);
          Alert.alert('Success', 'Protective factor added successfully.');
        }
        await fetchProtectiveFactors(profile.id);
      } else if (resourceType === 'educational') {
        const eduData = {
          title: resourceName,
          description: resourceDescription,
          content: resourceContent || '<p>Placeholder content</p>',
          type: 'article',
          category: 'General',
        };
        if (editingResource) {
          await ApiService.updateResource(editingResource.id, eduData);
          Alert.alert('Success', 'Educational resource updated successfully.');
        } else {
          await ApiService.createResource(eduData);
          Alert.alert('Success', 'Educational resource added successfully.');
        }
        await resourcesQ.refetch();
      } else {
        const data = { name: resourceName, description: resourceDescription, isGlobal: resourceIsGlobal };
        if (editingResource) {
          await ApiService.updateCopingStrategy(profile.id, editingResource.id, data);
          Alert.alert('Success', 'Coping strategy updated successfully.');
        } else {
          await ApiService.createCopingStrategy(profile.id, data);
          Alert.alert('Success', 'Coping strategy added successfully.');
        }
        await fetchCopingStrategies(profile.id);
      }
      setResourceModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save resource.');
    } finally {
      setSubmittingResource(false);
    }
  };

  const handleDeletePf = (factorId: number) => {
    Alert.alert(
      'Delete Protective Factor?',
      'Are you sure you want to delete this protective factor? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.deleteProtectiveFactor(profile.id, factorId);
              setSelectedClinicalItem(null);
              Alert.alert('Success', 'Protective factor deleted.');
              await fetchProtectiveFactors(profile.id);
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to delete protective factor.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteCs = (strategyId: number) => {
    Alert.alert(
      'Delete Coping Strategy?',
      'Are you sure you want to delete this coping strategy? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.deleteCopingStrategy(profile.id, strategyId);
              setSelectedClinicalItem(null);
              Alert.alert('Success', 'Coping strategy deleted.');
              await fetchCopingStrategies(profile.id);
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to delete coping strategy.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteEducational = (resourceId: number) => {
    Alert.alert(
      'Delete Resource?',
      'Are you sure you want to delete this educational resource? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.deleteResource(resourceId);
              setSelectedResource(null);
              Alert.alert('Success', 'Resource deleted.');
              await resourcesQ.refetch();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to delete resource.');
            }
          },
        },
      ]
    );
  };

  // Assignments Handlers
  const handleAssignResource = async () => {
    if (!selectedClientId) {
      Alert.alert('Selection Required', 'Please select a client to assign this resource.');
      return;
    }
    try {
      setSubmittingAssign(true);
      await ApiService.assignResource(assignResourceItem.id, selectedClientId, assignNotes);
      Alert.alert('Success', 'Resource assigned successfully.');
      setAssignModalVisible(false);
      setSelectedClientId(null);
      setAssignNotes('');
      await fetchAssignments();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to assign resource.');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleDeleteAssignment = (assignmentId: number) => {
    Alert.alert(
      'Unassign Client?',
      'Are you sure you want to unassign this resource from the client?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unassign',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.deleteResourceAssignment(assignmentId);
              Alert.alert('Success', 'Client unassigned.');
              await fetchAssignments();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to unassign client.');
            }
          },
        },
      ]
    );
  };

  const renderTabs = () => {
    const pfCount = protectiveFactors.filter(f => !f.isGlobal || f.userId === profile?.id).length;
    const csCount = copingStrategies.filter(s => !s.isGlobal || s.userId === profile?.id).length;

    const totalAll = resources.length + pfCount + csCount;
    const tabs = [
      { id: 'all-resources', label: `All Resources (${totalAll})`, icon: 'layers' },
      { id: 'educational-resources', label: `Educational (${resources.length})`, icon: 'book-open' },
      { id: 'protective-factors', label: `Protective Factors (${pfCount})`, icon: 'shield' },
      { id: 'coping-strategies', label: `Coping Strategies (${csCount})`, icon: 'brain' },
      ...(isTherapist ? [{ id: 'client-assignments', label: `Assignments (${assignments.length})`, icon: 'users' }] : []),
    ];

    return (
      <View style={styles.tabCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab(tab.id);
                setSearch('');
              }}
              activeOpacity={0.8}
            >
              {tab.icon === 'brain' ? (
                <MaterialCommunityIcons name="brain" size={13} color={activeTab === tab.id ? '#FFFFFF' : '#64748B'} style={{ marginRight: 5 }} />
              ) : (
                <Feather name={tab.icon as any} size={13} color={activeTab === tab.id ? '#FFFFFF' : '#64748B'} style={{ marginRight: 5 }} />
              )}
              <Text style={[styles.tabBtnText, activeTab === tab.id && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderResourceItem = ({ item }: { item: any }) => {
    const theme = getCategoryTheme(item.category);

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: theme.color }]}
        activeOpacity={0.8}
        onPress={() => setSelectedResource(item)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.lightBg }]}>
            {renderIcon(theme, 18)}
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.categoryText, { color: theme.color }]}>{item.category || 'General'}</Text>
            <Text style={styles.titleText}>{item.title}</Text>
          </View>
        </View>

        <Text style={styles.descriptionText} numberOfLines={2}>
          {stripHTML(item.description)}
        </Text>

        <View style={styles.cardFooter}>
          <View style={[styles.typeBadge, { backgroundColor: `${theme.color}15` }]}>
            <Text style={[styles.typeText, { color: theme.color }]}>{item.type?.toUpperCase()}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {isTherapist && (
              <TouchableOpacity
                style={styles.cardActionBtnMini}
                onPress={() => {
                  setAssignResourceItem(item);
                  setAssignModalVisible(true);
                }}
              >
                <Feather name="user-check" size={13} color={COLORS.primaryGreen} />
                <Text style={styles.cardActionBtnMiniText}>Assign</Text>
              </TouchableOpacity>
            )}
            <View style={styles.actionLinkRow}>
              <Text style={styles.readMoreText}>Open Tool</Text>
              <Feather name="chevron-right" size={14} color={COLORS.primaryGreen} style={{ marginLeft: 2 }} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItemCard = (item: any, type: 'factor' | 'strategy') => {
    const isGlobal = item.isGlobal;
    const canEdit = item.userId === profile?.id || (isTherapist && !isGlobal);
    const accentColor = isGlobal ? COLORS.mediumGreen : COLORS.primaryGreen;
    const lightBg = isGlobal ? '#ECFDF5' : '#ecfdf5';

    return (
      <TouchableOpacity
        style={[styles.itemCard, { borderLeftColor: accentColor }]}
        key={item.id}
        activeOpacity={0.75}
        onPress={() => setSelectedClinicalItem({ item, type })}
      >
        <View style={styles.itemCardHeader}>
          <Text style={styles.itemCardTitle}>{item.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isGlobal && (
              <View style={[styles.sharedBadge, { backgroundColor: lightBg }]}>
                <Feather name="globe" size={10} color={accentColor} style={{ marginRight: 3 }} />
                <Text style={[styles.sharedBadgeText, { color: accentColor }]}>Shared</Text>
              </View>
            )}
            {canEdit && (
              <View style={styles.itemCardActions}>
                <TouchableOpacity
                  onPress={() => { type === 'factor' ? handleEditPf(item) : handleEditCs(item); }}
                  style={styles.itemActionBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="edit-2" size={13} color="#64748B" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { type === 'factor' ? handleDeletePf(item.id) : handleDeleteCs(item.id); }}
                  style={styles.itemActionBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="trash-2" size={13} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.itemCardDesc} numberOfLines={3}>
          {stripHTML(item.description) || 'No description provided.'}
        </Text>
        <View style={styles.itemCardFooter}>
          <Text style={[styles.itemCardViewHint, { color: accentColor }]}>Tap to view full details</Text>
          <Feather name="chevron-right" size={12} color={accentColor} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderAssignmentCard = (assignment: any) => {
    const status = assignment.status || 'assigned';
    let statusColor = '#D97706';
    let statusBg = '#FEF3C7';
    if (status === 'completed') {
      statusColor = COLORS.primaryGreen;
      statusBg = '#D1FAE5';
    } else if (status === 'in_progress') {
      statusColor = '#2563EB';
      statusBg = '#DBEAFE';
    }

    return (
      <View style={styles.assignmentCard} key={assignment.id}>
        <View style={styles.assignmentHeader}>
          <Text style={styles.assignmentTitle}>{assignment.resource?.title || 'Resource'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.assignmentMetaRow}>
          <View style={styles.clientLabelRow}>
            <View style={styles.clientAvatarMini}>
              <Feather name="user" size={11} color={COLORS.darkGreen} />
            </View>
            <Text style={styles.clientNameText}>
              {assignment.client?.name || assignment.client?.username || 'Client'}
            </Text>
          </View>
          <Text style={styles.assignedDateText}>
            {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : ''}
          </Text>
        </View>

        {assignment.notes ? (
          <View style={styles.assignmentNotesBubble}>
            <Text style={styles.assignmentNotesTitle}>Notes:</Text>
            <Text style={styles.assignmentNotesText}>{assignment.notes}</Text>
          </View>
        ) : null}

        <View style={styles.assignmentFooter}>
          <TouchableOpacity
            style={styles.unassignBtn}
            onPress={() => handleDeleteAssignment(assignment.id)}
            activeOpacity={0.8}
          >
            <Feather name="user-minus" size={13} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={styles.unassignBtnText}>Unassign Client</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
        <Text style={styles.loadingText}>Opening Resource Library...</Text>
      </View>
    );
  }

  const personalFactors = protectiveFactors.filter(f => !f.isGlobal || f.userId === profile?.id);
  const globalFactors = protectiveFactors.filter(f => f.isGlobal && f.userId !== profile?.id);

  const personalStrategies = copingStrategies.filter(s => !s.isGlobal || s.userId === profile?.id);
  const globalStrategies = copingStrategies.filter(s => s.isGlobal && s.userId !== profile?.id);

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      {renderTabs()}

      {/* Scrollable Contents */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* TAB 0: ALL RESOURCES */}
        {activeTab === 'all-resources' && (
          <AllResourcesTab
            resources={resources}
            protectiveFactors={[...protectiveFactors]}
            copingStrategies={[...copingStrategies]}
            getCategoryTheme={getCategoryTheme}
            renderIcon={renderIcon}
            onSelectResource={setSelectedResource}
            onSelectClinical={(item, type) => setSelectedClinicalItem({ item, type })}
          />
        )}

        {/* TAB 1: EDUCATIONAL RESOURCES */}
        {activeTab === 'educational-resources' && (
          <>
            {/* Visual Hero Banner (Featured Resource) */}
            {featuredResource && !search && activeCategory === 'All' && (
              <View style={styles.heroWrapper}>
                <TouchableOpacity
                  style={styles.heroCard}
                  activeOpacity={0.9}
                  onPress={() => setSelectedResource(featuredResource)}
                >
                  <View style={styles.heroGradientOverlay} />
                  
                  <View style={styles.heroHeader}>
                    <View style={styles.heroBadge}>
                      <Text style={styles.heroBadgeText}>⚡ Suggested Tool</Text>
                    </View>
                    <Text style={styles.heroCategory}>{featuredResource.category || 'General'}</Text>
                  </View>

                  <Text style={styles.heroTitle}>{featuredResource.title}</Text>
                  <Text style={styles.heroSubtitle} numberOfLines={2}>
                    {featuredResource.description}
                  </Text>

                  <View style={styles.heroFooter}>
                    <View style={styles.heroActionBtn}>
                      <Text style={styles.heroActionText}>Read Guide</Text>
                      <Feather name="arrow-right" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Search Bar Container */}
            <View style={styles.searchSection}>
              <View style={styles.searchBox}>
                <Feather name="search" size={16} color="#64748B" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search therapeutic worksheets..."
                  placeholderTextColor="#94A3B8"
                  value={search}
                  onChangeText={setSearch}
                />
                {search ? (
                  <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
                    <Feather name="x" size={16} color="#64748B" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Category Horizontal Filter Slider */}
            <View style={styles.sliderContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {categories.map((cat: any) => {
                  const isSelected = activeCategory === cat;
                  const theme = getCategoryTheme(cat);
                  
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        isSelected 
                          ? { backgroundColor: COLORS.darkGreen, borderColor: COLORS.darkGreen }
                          : { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }
                      ]}
                      onPress={() => setActiveCategory(cat)}
                    >
                      {cat !== 'All' ? (
                        <View style={styles.categoryIconWrap}>
                          {renderIcon(theme, 12)}
                        </View>
                      ) : (
                        <View style={styles.categoryIconWrap}>
                          <Feather name="layers" size={11} color={isSelected ? 'white' : '#64748B'} />
                        </View>
                      )}
                      <Text
                        style={[
                          styles.categoryButtonText,
                          isSelected ? { color: '#FFFFFF' } : { color: '#64748B' }
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Resource Grid List */}
            {filteredResources.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Feather name="book-open" size={28} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>No Resources Found</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your search queries or category filters.</Text>
              </View>
            ) : (
              <View style={styles.cardsGrid}>
                {filteredResources.map((item) => (
                  <View key={item.id}>
                    {renderResourceItem({ item })}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* TAB 2: PROTECTIVE FACTORS */}
        {activeTab === 'protective-factors' && (
          <View style={{ paddingTop: 10 }}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.tabTitleText}>Protective Factors</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => handleAddResource('factor')} activeOpacity={0.8}>
                <Feather name="plus" size={14} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Factor</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.tabSubtitleText}>
              Strengths, relationships, and assets in your life that support your mental wellbeing.
            </Text>

            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionHeaderText}>My Protective Factors</Text>
            </View>
            {personalFactors.length === 0 ? (
              <View style={[styles.emptyContainer, { paddingVertical: 24 }]}>
                <Text style={styles.emptyTitle}>No Personal Factors</Text>
                <Text style={styles.emptySubtitle}>Click "Add Factor" to document your strengths.</Text>
              </View>
            ) : (
              personalFactors.map(f => renderItemCard(f, 'factor'))
            )}

            {globalFactors.length > 0 && (
              <>
                <View style={[styles.sectionHeaderContainer, { marginTop: 20 }]}>
                  <Text style={styles.sectionHeaderText}>Shared Protective Factors</Text>
                </View>
                {globalFactors.map(f => renderItemCard(f, 'factor'))}
              </>
            )}
          </View>
        )}

        {/* TAB 3: COPING STRATEGIES */}
        {activeTab === 'coping-strategies' && (
          <View style={{ paddingTop: 10 }}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.tabTitleText}>Coping Strategies</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => handleAddResource('strategy')} activeOpacity={0.8}>
                <Feather name="plus" size={14} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Strategy</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.tabSubtitleText}>
              Specific actions and exercises you practice to manage anxiety, stress, or sadness.
            </Text>

            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionHeaderText}>My Coping Strategies</Text>
            </View>
            {personalStrategies.length === 0 ? (
              <View style={[styles.emptyContainer, { paddingVertical: 24 }]}>
                <Text style={styles.emptyTitle}>No Personal Strategies</Text>
                <Text style={styles.emptySubtitle}>Click "Add Strategy" to list your coping skills.</Text>
              </View>
            ) : (
              personalStrategies.map(s => renderItemCard(s, 'strategy'))
            )}

            {globalStrategies.length > 0 && (
              <>
                <View style={[styles.sectionHeaderContainer, { marginTop: 20 }]}>
                  <Text style={styles.sectionHeaderText}>Shared Coping Strategies</Text>
                </View>
                {globalStrategies.map(s => renderItemCard(s, 'strategy'))}
              </>
            )}
          </View>
        )}

        {/* TAB 4: CLIENT ASSIGNMENTS (THERAPISTS ONLY) */}
        {activeTab === 'client-assignments' && isTherapist && (
          <View style={{ paddingTop: 10 }}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.tabTitleText}>Client Assignments</Text>
            </View>
            <Text style={styles.tabSubtitleText}>
              Browse, monitor, and manage educational resources you have assigned to your clients.
            </Text>

            {assignments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Feather name="users" size={28} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>No Assigned Resources</Text>
                <Text style={styles.emptySubtitle}>Go to the "Resources" tab to assign worksheets to clients.</Text>
              </View>
            ) : (
              assignments.map(a => renderAssignmentCard(a))
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: RESOURCE READER BOTTOM SHEET */}
      <Modal
        visible={selectedResource !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedResource(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {selectedResource && (
              <>
                {/* Drag Indicator */}
                <View style={styles.dragIndicator} />

                {/* Modal Top Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1, marginRight: 16 }}>
                    <View style={styles.modalMetaRow}>
                      <View style={[styles.modalTypeBadge, { backgroundColor: `${getCategoryTheme(selectedResource.category).color}15` }]}>
                        <Text style={[styles.modalTypeText, { color: getCategoryTheme(selectedResource.category).color }]}>
                          {selectedResource.type?.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.modalCategoryText}>
                        {selectedResource.category || 'General'}
                      </Text>
                    </View>
                    <Text style={styles.modalTitle}>{selectedResource.title}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    {isTherapist && (
                      <>
                        <TouchableOpacity
                          style={[styles.closeButton, { backgroundColor: '#F0FDF4' }]}
                          onPress={() => { setSelectedResource(null); handleEditEducational(selectedResource); }}
                        >
                          <Feather name="edit-2" size={15} color={COLORS.primaryGreen} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.closeButton, { backgroundColor: '#FEF2F2' }]}
                          onPress={() => handleDeleteEducational(selectedResource.id)}
                        >
                          <Feather name="trash-2" size={15} color="#EF4444" />
                        </TouchableOpacity>
                      </>
                    )}
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setSelectedResource(null)}
                    >
                      <Feather name="x" size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Modal Body Reading View */}
                <ScrollView 
                  style={styles.modalBody} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 40 }}
                >
                  <Text style={styles.modalDesc}>{selectedResource.description}</Text>
                  <View style={styles.divider} />
                  
                  {/* Styled body content for premium clinical reading */}
                  {renderHTMLContent(selectedResource.content)}
                </ScrollView>

                {/* Modal Footer (Assign Button for Therapists) */}
                {isTherapist && (
                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.modalAssignBtn}
                      onPress={() => {
                        setAssignResourceItem(selectedResource);
                        setAssignModalVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Feather name="user-check" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.modalAssignBtnText}>Assign to Client</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL: CLINICAL ITEM DETAIL (Protective Factor / Coping Strategy) */}
      <Modal
        visible={selectedClinicalItem !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedClinicalItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {selectedClinicalItem && (() => {
              const { item, type } = selectedClinicalItem;
              const isGlobal = item.isGlobal;
              const canEdit = item.userId === profile?.id || (isTherapist && !isGlobal);
              const accentColor = type === 'factor' ? COLORS.mediumGreen : '#3B82F6';
              const lightBg = type === 'factor' ? '#ECFDF5' : '#EFF6FF';
              const icon = type === 'factor' ? 'shield' : 'activity';
              const typeLabel = type === 'factor' ? 'Protective Factor' : 'Coping Strategy';
              return (
                <>
                  <View style={styles.dragIndicator} />
                  <View style={styles.modalHeader}>
                    <View style={{ flex: 1, marginRight: 16 }}>
                      <View style={styles.modalMetaRow}>
                        <View style={[styles.modalTypeBadge, { backgroundColor: lightBg }]}>
                          <Feather name={icon} size={10} color={accentColor} />
                          <Text style={[styles.modalTypeText, { color: accentColor, marginLeft: 4 }]}>{typeLabel.toUpperCase()}</Text>
                        </View>
                        {isGlobal && (
                          <View style={[styles.modalTypeBadge, { backgroundColor: '#F1F5F9', marginLeft: 6 }]}>
                            <Feather name="globe" size={10} color="#64748B" />
                            <Text style={[styles.modalTypeText, { color: '#64748B', marginLeft: 4 }]}>SHARED</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.modalTitle}>{item.name}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      {canEdit && (
                        <>
                          <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: '#F0FDF4' }]}
                            onPress={() => { setSelectedClinicalItem(null); type === 'factor' ? handleEditPf(item) : handleEditCs(item); }}
                          >
                            <Feather name="edit-2" size={15} color={COLORS.primaryGreen} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: '#FEF2F2' }]}
                            onPress={() => { type === 'factor' ? handleDeletePf(item.id) : handleDeleteCs(item.id); }}
                          >
                            <Feather name="trash-2" size={15} color="#EF4444" />
                          </TouchableOpacity>
                        </>
                      )}
                      <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedClinicalItem(null)}>
                        <Feather name="x" size={18} color="#64748B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <ScrollView
                    style={styles.modalBody}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                  >
                    {item.description ? (
                      <>
                        <Text style={[styles.modalDesc, { fontStyle: 'normal', fontWeight: '600', color: '#475569', marginBottom: 4 }]}>Summary</Text>
                        <Text style={styles.modalDesc}>{stripHTML(item.description)}</Text>
                        {item.content && <View style={styles.divider} />}
                      </>
                    ) : null}
                    {item.content
                      ? renderHTMLContent(item.content.includes('<') ? item.content : `<p>${item.content}</p>`)
                      : (!item.description && <Text style={styles.modalDesc}>No description provided.</Text>)
                    }
                  </ScrollView>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* MODAL 2 & 3: ADD/EDIT RESOURCE DIALOG */}
      <Modal
        visible={resourceModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setResourceModalVisible(false)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialogContainer}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>
                {editingResource
                  ? (resourceType === 'factor' ? 'Edit Protective Factor' : resourceType === 'strategy' ? 'Edit Coping Strategy' : 'Edit Educational Resource')
                  : 'Add Resource'}
              </Text>
              <TouchableOpacity onPress={() => setResourceModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Step Header */}
            {(() => {
              const isEdu = resourceType === 'educational';
              const totalSteps = isEdu ? (isTherapist ? 5 : 4) : (isTherapist ? 4 : 3);
              // For PF/CS, step 5 (Settings) is logically step 4 — map display number
              const displayStep = (!isEdu && currentStep === 5) ? 4 : currentStep;
              const stepLabel: Record<number, string> = { 1: 'Type', 2: 'Title', 3: 'Description', 4: isEdu ? 'Content' : 'Settings', 5: 'Settings' };
              return (
                <View style={{ marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '600' }}>
                      Step {displayStep} of {totalSteps}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#064e3b', fontWeight: '700' }}>
                      {stepLabel[currentStep] ?? ''}
                    </Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ height: '100%', backgroundColor: '#059669', width: `${(displayStep / totalSteps) * 100}%` }} />
                  </View>
                </View>
              );
            })()}

            {/* Step 1: Type */}
            {currentStep === 1 && (
              <View style={styles.dialogField}>
                <Text style={styles.dialogLabel}>What type of resource are you adding?</Text>
                <View style={{ gap: 10 }}>
                  <TouchableOpacity
                    style={{ padding: 15, borderRadius: 12, borderWidth: 2, borderColor: resourceType === 'factor' ? '#059669' : '#E2E8F0', backgroundColor: resourceType === 'factor' ? '#ECFDF5' : '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 12 }}
                    onPress={() => setResourceType('factor')}
                    activeOpacity={0.8}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: resourceType === 'factor' ? '#059669' : '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
                      <Feather name="shield" size={20} color={resourceType === 'factor' ? '#FFFFFF' : '#64748B'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, color: '#064e3b', fontWeight: '700', marginBottom: 2 }}>Protective Factor</Text>
                      <Text style={{ fontSize: 13, color: '#64748B' }}>Personal strengths and positive supports.</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ padding: 15, borderRadius: 12, borderWidth: 2, borderColor: resourceType === 'strategy' ? '#059669' : '#E2E8F0', backgroundColor: resourceType === 'strategy' ? '#ECFDF5' : '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 12 }}
                    onPress={() => setResourceType('strategy')}
                    activeOpacity={0.8}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: resourceType === 'strategy' ? '#059669' : '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
                      <Feather name="activity" size={20} color={resourceType === 'strategy' ? '#FFFFFF' : '#64748B'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, color: '#064e3b', fontWeight: '700', marginBottom: 2 }}>Coping Strategy</Text>
                      <Text style={{ fontSize: 13, color: '#64748B' }}>Techniques and actions to manage distress.</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ padding: 15, borderRadius: 12, borderWidth: 2, borderColor: resourceType === 'educational' ? '#059669' : '#E2E8F0', backgroundColor: resourceType === 'educational' ? '#ECFDF5' : '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 12 }}
                    onPress={() => setResourceType('educational')}
                    activeOpacity={0.8}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: resourceType === 'educational' ? '#059669' : '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
                      <Feather name="book-open" size={20} color={resourceType === 'educational' ? '#FFFFFF' : '#64748B'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, color: '#064e3b', fontWeight: '700', marginBottom: 2 }}>Educational Resource</Text>
                      <Text style={{ fontSize: 13, color: '#64748B' }}>Articles, guides, and informative materials.</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Step 2: Title */}
            {currentStep === 2 && (
              <View style={styles.dialogField}>
                <Text style={styles.dialogLabel}>{resourceType === 'factor' ? 'Factor Name' : resourceType === 'strategy' ? 'Strategy Name' : 'Resource Title'}</Text>
                <TextInput
                  style={styles.dialogInput}
                  placeholder={resourceType === 'factor' ? "E.g., Supportive family" : resourceType === 'strategy' ? "E.g., Box breathing" : "E.g., Intro to CBT"}
                  placeholderTextColor="#94A3B8"
                  value={resourceName}
                  onChangeText={setResourceName}
                  autoFocus
                />
              </View>
            )}

            {/* Step 3: Short Description */}
            {currentStep === 3 && (
              <View style={styles.dialogField}>
                <Text style={styles.dialogLabel}>
                  {resourceType === 'factor' ? 'Factor Description' : resourceType === 'strategy' ? 'Strategy Description' : 'Short Description'}
                </Text>
                <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>
                  A brief summary shown on the resource card.
                </Text>
                <TextInput
                  style={[styles.dialogInput, styles.dialogTextArea, { height: 100 }]}
                  placeholder={
                    resourceType === 'factor' ? "Briefly describe this protective factor..."
                    : resourceType === 'strategy' ? "Briefly describe this coping strategy..."
                    : "A short summary shown in the resource card..."
                  }
                  placeholderTextColor="#94A3B8"
                  value={resourceDescription}
                  onChangeText={setResourceDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  autoFocus
                />
              </View>
            )}

            {/* Step 4: Full Content (Rich Text — Educational only) */}
            {currentStep === 4 && resourceType === 'educational' && (
              <View style={[styles.dialogField, { marginBottom: 20 }]}>
                <Text style={styles.dialogLabel}>Full Content</Text>
                <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>
                  The complete body shown when the resource is opened.
                </Text>
                <View style={{ height: 240, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden', backgroundColor: '#FFFFFF', flexDirection: 'column-reverse' }}>
                  <RichEditor
                    ref={richTextRef}
                    initialContentHTML={resourceContent}
                    onChange={setResourceContent}
                    placeholder={
                      resourceType === 'factor' ? "Describe in detail how this factor helps you..."
                      : resourceType === 'strategy' ? "Provide step-by-step instructions or detailed guidance..."
                      : "Write the full educational content here..."
                    }
                    containerStyle={{ flex: 1, backgroundColor: '#FFFFFF' }}
                    editorStyle={{
                      backgroundColor: '#FFFFFF',
                      color: '#1E293B',
                      placeholderColor: '#94A3B8',
                      cssText: 'ul, ol { padding-left: 24px; margin-left: 10px; }',
                    }}
                    initialHeight={190}
                    useContainer={false}
                    scrollEnabled={true}
                  />
                  <RichToolbar
                    editor={richTextRef}
                    actions={[
                      actions.setBold,
                      actions.setItalic,
                      actions.setUnderline,
                      actions.insertBulletsList,
                      actions.insertOrderedList,
                      actions.removeFormat,
                      actions.keyboard,
                    ]}
                    onPress={() => richTextRef.current?.focusContentEditor()}
                    style={{ backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', height: 44 }}
                    iconTint="#64748B"
                    selectedIconTint="#059669"
                  />
                </View>
              </View>
            )}

            {/* Step 5: Settings (Global Share — therapist only) */}
            {currentStep === 5 && isTherapist && (
              <View style={styles.switchRow}>
                <View style={styles.switchTextWrap}>
                  <Text style={styles.switchLabel}>Share with all clients</Text>
                  <Text style={styles.switchDesc}>Make available as a shared resource for clients.</Text>
                </View>
                <Switch
                  value={resourceIsGlobal}
                  onValueChange={setResourceIsGlobal}
                  trackColor={{ false: '#CBD5E1', true: '#A78BFA' }}
                  thumbColor={resourceIsGlobal ? '#059669' : '#F1F5F9'}
                />
              </View>
            )}

            <View style={[styles.dialogFooter, { justifyContent: 'space-between', width: '100%' }]}>
              <TouchableOpacity
                style={[styles.dialogCancelBtn, { paddingHorizontal: 20 }]}
                onPress={() => setResourceModalVisible(false)}
                disabled={submittingResource}
              >
                <Text style={styles.dialogCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              {(() => {
                const isEdu = resourceType === 'educational';
                const lastStep = isTherapist ? 5 : (isEdu ? 4 : 3);
                const isLastStep = currentStep === lastStep || (!isEdu && currentStep === 3 && !isTherapist);

                const handleNext = () => {
                  // PF/CS: skip step 4 (Content), jump straight to 5 (Settings) or save
                  if (!isEdu && currentStep === 3) {
                    if (isTherapist) setCurrentStep(5);
                    else handleSaveResource();
                  } else {
                    setCurrentStep(prev => prev + 1);
                  }
                };

                const handleBack = () => {
                  // PF/CS: skip step 4 when going back from step 5
                  if (!isEdu && currentStep === 5) setCurrentStep(3);
                  else setCurrentStep(prev => prev - 1);
                };

                const showSave = currentStep === 5 || (!isEdu && currentStep === 3 && !isTherapist);

                return (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {currentStep > 1 && (
                      <TouchableOpacity
                        style={[styles.dialogCancelBtn, { paddingHorizontal: 20 }]}
                        onPress={handleBack}
                        disabled={submittingResource}
                      >
                        <Text style={styles.dialogCancelBtnText}>Back</Text>
                      </TouchableOpacity>
                    )}
                    {showSave ? (
                      <TouchableOpacity
                        style={[styles.dialogSaveBtn, { paddingHorizontal: 20 }]}
                        onPress={handleSaveResource}
                        disabled={submittingResource}
                      >
                        {submittingResource
                          ? <ActivityIndicator size="small" color="#FFFFFF" />
                          : <Text style={styles.dialogSaveBtnText}>Save</Text>}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.dialogSaveBtn, { paddingHorizontal: 20, opacity: (currentStep === 2 && !resourceName.trim()) ? 0.5 : 1 }]}
                        onPress={handleNext}
                        disabled={currentStep === 2 && !resourceName.trim()}
                      >
                        <Text style={styles.dialogSaveBtnText}>Next</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })()}
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: ASSIGN RESOURCE TO CLIENT DIALOG */}
      <Modal
        visible={assignModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialogContainer}>
            <View style={styles.dialogHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.dialogTitle}>Assign Resource</Text>
                <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }} numberOfLines={1}>
                  Tool: {assignResourceItem?.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.clientSelectLabel}>Select Client</Text>
            {clients.length === 0 ? (
              <View style={{ paddingVertical: 15, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#94A3B8' }}>No clients found</Text>
              </View>
            ) : (
              <ScrollView style={styles.clientSelectScroll} nestedScrollEnabled>
                {clients.map(client => {
                  const isSelected = selectedClientId === client.id;
                  return (
                    <TouchableOpacity
                      key={client.id}
                      style={[styles.clientSelectRow, isSelected && styles.clientSelectRowSelected]}
                      onPress={() => setSelectedClientId(client.id)}
                    >
                      <View style={[styles.clientAvatarCircle, isSelected && styles.clientAvatarCircleSelected]}>
                        <Text style={[styles.clientAvatarCircleText, isSelected && styles.clientAvatarCircleTextSelected]}>
                          {(client.name || client.username || 'C').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.clientSelectName, isSelected && styles.clientSelectNameSelected]}>
                          {client.name || client.username}
                        </Text>
                        <Text style={styles.clientSelectUsername}>@{client.username}</Text>
                      </View>
                      {isSelected && <Feather name="check-circle" size={16} color={COLORS.primaryGreen} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.dialogField}>
              <Text style={styles.dialogLabel}>Assignment Notes / Instructions</Text>
              <TextInput
                style={[styles.dialogInput, styles.dialogTextArea]}
                placeholder="Include custom reminders or guidance for this client..."
                placeholderTextColor="#94A3B8"
                value={assignNotes}
                onChangeText={setAssignNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.dialogFooter}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setAssignModalVisible(false)}
                disabled={submittingAssign}
              >
                <Text style={styles.dialogCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogSaveBtn}
                onPress={handleAssignResource}
                disabled={submittingAssign}
              >
                {submittingAssign ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.dialogSaveBtnText}>Assign</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FAB — visible on all tabs for therapists/admins */}
      {isTherapist && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => {
            if (activeTab === 'coping-strategies') handleAddResource('strategy');
            else if (activeTab === 'protective-factors') handleAddResource('factor');
            else handleAddResource('factor');
          }}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: COLORS.darkGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: 'bold',
  },

  // Hero Card Styles
  heroWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  heroCard: {
    height: 170,
    borderRadius: 24,
    backgroundColor: COLORS.darkGreen, // Brand deep purple
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: COLORS.darkGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  heroGradientOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 29, 149, 0.25)', // Tinted violet accent glow
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroBadgeText: {
    color: COLORS.darkGreen,
    fontSize: 10,
    fontWeight: 'bold',
  },
  heroCategory: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    lineHeight: 17,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 6,
  },
  heroActionBtn: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  heroActionText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Search Bar Styles
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },

  // Slider styles
  sliderContainer: {
    marginVertical: 4,
  },
  categoryScroll: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 6,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1.5,
  },
  categoryIconWrap: {
    marginRight: 6,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Cards Grid Layout
  cardsGrid: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderLeftWidth: 5,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 1,
  },
  descriptionText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 10,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.25,
  },
  actionLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 12,
    color: COLORS.primaryGreen,
    fontWeight: 'bold',
  },
  cardActionBtnMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  cardActionBtnMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryGreen,
    marginLeft: 4,
  },

  // Empty State Layout
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 17,
  },

  // Modal styled bottom sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 5, 20, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: height * 0.82,
  },
  dragIndicator: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 8,
  },
  modalTypeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.25,
  },
  modalCategoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 22,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalDesc: {
    fontSize: 13.5,
    color: '#64748B',
    lineHeight: 19,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  htmlContainer: {
    paddingBottom: 40,
  },
  htmlParagraph: {
    fontSize: 14.5,
    color: '#1E293B',
    lineHeight: 22,
    marginBottom: 12,
  },
  htmlH1: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.darkGreen,
    lineHeight: 26,
    marginTop: 18,
    marginBottom: 10,
  },
  htmlH2: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.darkGreen,
    lineHeight: 23,
    marginTop: 14,
    marginBottom: 8,
  },
  htmlH3: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.darkGreen,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 6,
  },
  htmlLiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 8,
  },
  htmlBullet: {
    fontSize: 14.5,
    color: COLORS.primaryGreen,
    lineHeight: 22,
    marginRight: 6,
  },
  htmlLiText: {
    flex: 1,
    fontSize: 14.5,
    color: '#1E293B',
    lineHeight: 22,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  modalAssignBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.darkGreen,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAssignBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Tab Card Styles
  tabCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 6,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  tabScroll: {
    gap: 4,
    paddingHorizontal: 2,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: COLORS.darkGreen,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },

  // Factors/Strategies Styles
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
  },
  tabTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkGreen,
  },
  tabSubtitleText: {
    fontSize: 12.5,
    color: '#64748B',
    paddingHorizontal: 16,
    lineHeight: 18,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkGreen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  sectionHeaderContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderLeftWidth: 5,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: 10,
  },
  itemCardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  itemCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  itemCardViewHint: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  itemActionBtn: {
    padding: 4,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sharedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },

  // Assignments Styles
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assignmentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    flex: 1,
    marginRight: 10,
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  assignmentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clientLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatarMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  clientNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  assignedDateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  assignmentNotesBubble: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  assignmentNotesTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.darkGreen,
    marginBottom: 2,
  },
  assignmentNotesText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  assignmentFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  unassignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unassignBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },

  // Form Dialog Styles
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 5, 20, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: width * 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.darkGreen,
  },
  dialogField: {
    marginBottom: 14,
  },
  dialogLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  dialogInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1E293B',
  },
  dialogTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGreen,
    marginBottom: 16,
  },
  switchTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  switchDesc: {
    fontSize: 10,
    color: '#047857',
    marginTop: 1,
  },
  dialogFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  dialogCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  dialogSaveBtn: {
    backgroundColor: COLORS.darkGreen,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  dialogSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Client Selection Styles
  clientSelectLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  clientSelectScroll: {
    maxHeight: 140,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 14,
  },
  clientSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  clientSelectRowSelected: {
    backgroundColor: '#ecfdf5',
  },
  clientAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  clientAvatarCircleSelected: {
    backgroundColor: COLORS.primaryGreen,
  },
  clientAvatarCircleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  clientAvatarCircleTextSelected: {
    color: '#FFFFFF',
  },
  clientSelectName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  clientSelectNameSelected: {
    color: COLORS.primaryGreen,
    fontWeight: '700',
  },
  clientSelectUsername: {
    fontSize: 10,
    color: '#94A3B8',
  },
});
