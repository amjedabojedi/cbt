import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { ApiService } from '../services/api';

interface JournalScreenProps {
  navigation: any;
}

export default function JournalScreen({ navigation }: JournalScreenProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing Information', 'Please add a title and write your journal entry');
      return;
    }

    setLoading(true);
    try {
      const userResponse = await ApiService.getCurrentUser();
      if (!userResponse.data) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const journalData = {
        title: title.trim(),
        content: content.trim(),
        userSelectedTags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        timestamp: new Date().toISOString(),
      };

      const response = await ApiService.createJournal(userResponse.data.id, journalData);
      
      if (response.error) {
        Alert.alert('Error', response.error);
      } else {
        Alert.alert('Success', 'Journal entry saved successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save journal entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Write Journal Entry</Text>
          <Text style={styles.subtitle}>Reflect on your day and thoughts</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Give your entry a title..."
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Thoughts</Text>
            <TextInput
              style={styles.contentInput}
              placeholder="Write about your day, thoughts, feelings, or anything on your mind..."
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={15}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags (Optional)</Text>
            <Text style={styles.helperText}>Add tags separated by commas (e.g., grateful, work, family)</Text>
            <TextInput
              style={styles.tagsInput}
              placeholder="grateful, work, family, etc."
              value={tags}
              onChangeText={setTags}
            />
          </View>

          <View style={styles.promptsSection}>
            <Text style={styles.sectionTitle}>Writing Prompts</Text>
            <Text style={styles.promptsSubtitle}>Need inspiration? Try these prompts:</Text>
            
            <TouchableOpacity 
              style={styles.promptCard}
              onPress={() => setContent(content + "\nWhat am I grateful for today?\n")}
            >
              <Text style={styles.promptText}>What am I grateful for today?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.promptCard}
              onPress={() => setContent(content + "\nWhat challenged me today and how did I handle it?\n")}
            >
              <Text style={styles.promptText}>What challenged me today and how did I handle it?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.promptCard}
              onPress={() => setContent(content + "\nWhat did I learn about myself today?\n")}
            >
              <Text style={styles.promptText}>What did I learn about myself today?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.promptCard}
              onPress={() => setContent(content + "\nHow am I feeling right now and why?\n")}
            >
              <Text style={styles.promptText}>How am I feeling right now and why?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Journal Entry'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  contentInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
    minHeight: 200,
  },
  tagsInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  promptsSection: {
    marginBottom: 32,
  },
  promptsSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  promptCard: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 14,
    color: '#475569',
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});