/**
 * Emotion Mapping Service
 * 
 * This service provides standardized mapping between emotions across different components
 * of the application, ensuring consistent emotion taxonomy and relationships.
 */

import { db } from '../db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';

// Core emotion families that define the major categories
export const CORE_EMOTION_FAMILIES = {
  'Joy': ['joy', 'happy', 'happiness', 'delight', 'content', 'pleased', 'satisfied', 'enthusiastic', 'excited', 'cheerful', 'ecstatic'],
  'Sadness': ['sad', 'sadness', 'depressed', 'depression', 'grief', 'sorrow', 'despair', 'melancholy', 'gloomy', 'miserable', 'discouraged'],
  'Fear': ['fear', 'afraid', 'scared', 'frightened', 'terrified', 'horror', 'panicked', 'apprehensive'],
  'Anxiety': ['anxiety', 'anxious', 'nervous', 'worried', 'stressed', 'tense', 'uneasy', 'distressed', 'overwhelmed'],
  'Anger': ['anger', 'angry', 'mad', 'frustrated', 'irritated', 'annoyed', 'furious', 'resentful', 'enraged', 'hostile', 'outraged'],
  'Disgust': ['disgust', 'disgusted', 'repulsed', 'revolted', 'aversion', 'loathing', 'contempt', 'dislike'],
  'Love': ['love', 'loving', 'affection', 'care', 'caring', 'fond', 'tenderness', 'compassion', 'warmth', 'adoration'],
  'Surprise': ['surprise', 'surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'startled', 'awe', 'wonder'],
};

// Secondary emotion groupings that map to core emotions
export const SECONDARY_EMOTIONS = {
  'Frustration': 'Anger',
  'Irritation': 'Anger',
  'Disappointment': 'Sadness',
  'Loneliness': 'Sadness',
  'Worry': 'Anxiety',
  'Stress': 'Anxiety',
  'Nervousness': 'Anxiety',
  'Dread': 'Fear',
  'Terror': 'Fear',
  'Contentment': 'Joy',
  'Excitement': 'Joy',
  'Amusement': 'Joy',
  'Pride': 'Joy',
  'Pleasure': 'Joy',
  'Satisfaction': 'Joy',
  'Peace': 'Joy',
  'Serenity': 'Joy',
  'Affection': 'Love',
  'Compassion': 'Love',
  'Empathy': 'Love',
  'Wonder': 'Surprise',
  'Awe': 'Surprise',
  'Amazement': 'Surprise',
  'Revulsion': 'Disgust',
  'Aversion': 'Disgust',
};

// Emotion colors for consistent visualization
export const EMOTION_COLORS: Record<string, string> = {
  'Joy': '#F9D71C',       // Yellow
  'Sadness': '#6D87C4',   // Blue
  'Fear': '#8A65AA',      // Purple
  'Anxiety': '#9C27B0',   // Purple
  'Anger': '#E43D40',     // Red
  'Disgust': '#7DB954',   // Green
  'Love': '#E91E63',      // Pink
  'Surprise': '#F47B20',  // Orange
  'Trust': '#8DC4BD',     // Teal
  'Worry': '#9932CC',     // Purple
  'Frustration': '#B22222', // Dark Red
  'Happiness': '#FFA07A', // Light Red
  'Depression': '#4682B4', // Blue
};

/**
 * Find the core emotion for a given emotion term
 * @param emotion The emotion term to categorize
 * @returns The matching core emotion or null if no match
 */
export function findCoreEmotion(emotion: string): string | null {
  const normalizedEmotion = emotion.toLowerCase().trim();
  
  // Direct match with a core emotion
  for (const [coreEmotion, variants] of Object.entries(CORE_EMOTION_FAMILIES)) {
    if (coreEmotion.toLowerCase() === normalizedEmotion) {
      return coreEmotion;
    }
    
    // Check if the emotion is a variant in this family
    if (variants.includes(normalizedEmotion)) {
      return coreEmotion;
    }
  }
  
  // Check if it's a secondary emotion
  for (const [secondaryEmotion, coreEmotion] of Object.entries(SECONDARY_EMOTIONS)) {
    if (secondaryEmotion.toLowerCase() === normalizedEmotion) {
      return coreEmotion;
    }
  }
  
  return null;
}

/**
 * Get all related emotion terms for a core emotion
 * @param coreEmotion The core emotion to get variants for
 * @returns Array of related emotion terms
 */
export function getRelatedEmotions(coreEmotion: string): string[] {
  const results: string[] = [coreEmotion];
  const coreEmotionLower = coreEmotion.toLowerCase();
  
  // Add variants from the core emotion family
  for (const [core, variants] of Object.entries(CORE_EMOTION_FAMILIES)) {
    if (core.toLowerCase() === coreEmotionLower) {
      results.push(...variants.map(v => v.charAt(0).toUpperCase() + v.slice(1)));
      break;
    }
  }
  
  // Add secondary emotions that map to this core emotion
  for (const [secondary, core] of Object.entries(SECONDARY_EMOTIONS)) {
    if (core === coreEmotion) {
      results.push(secondary);
    }
  }
  
  return Array.from(new Set(results)); // Remove duplicates
}

/**
 * Standardize a list of emotion tags, mapping variations to their core emotions
 * @param emotionTags Array of emotion tags from journal or other sources
 * @returns Object mapping core emotions to counts
 */
export function standardizeEmotionTags(emotionTags: string[]): Record<string, number> {
  const emotionCounts: Record<string, number> = {};
  
  emotionTags.forEach(tag => {
    const coreEmotion = findCoreEmotion(tag);
    if (coreEmotion) {
      emotionCounts[coreEmotion] = (emotionCounts[coreEmotion] || 0) + 1;
    }
  });
  
  return emotionCounts;
}

/**
 * Get the color for a specific emotion
 * @param emotion The emotion to get a color for
 * @returns The color code or a default color
 */
export function getEmotionColor(emotion: string): string {
  // First try direct match
  if (EMOTION_COLORS[emotion]) {
    return EMOTION_COLORS[emotion];
  }
  
  // Try to find core emotion
  const coreEmotion = findCoreEmotion(emotion);
  if (coreEmotion && EMOTION_COLORS[coreEmotion]) {
    return EMOTION_COLORS[coreEmotion];
  }
  
  // Return a default color
  return '#999999';
}

/**
 * Check if two emotions are related (part of the same family)
 * @param emotion1 First emotion
 * @param emotion2 Second emotion
 * @returns True if the emotions are related
 */
export function areEmotionsRelated(emotion1: string, emotion2: string): boolean {
  const core1 = findCoreEmotion(emotion1);
  const core2 = findCoreEmotion(emotion2);
  
  // Special case: Anxiety and Fear are considered related
  if ((core1 === 'Anxiety' && core2 === 'Fear') || 
      (core1 === 'Fear' && core2 === 'Anxiety')) {
    return true;
  }
  
  return core1 === core2 && core1 !== null;
}

/**
 * Find emotions that match a list of tags (for connecting journal entries to emotion records)
 * @param tags The tags to match against emotions
 * @returns Array of matching core emotions
 */
export function findMatchingEmotions(tags: string[]): string[] {
  const matches = new Set<string>();
  
  tags.forEach(tag => {
    const coreEmotion = findCoreEmotion(tag);
    if (coreEmotion) {
      matches.add(coreEmotion);
    }
  });
  
  return Array.from(matches);
}

/**
 * Enhance component connections by finding relationships between emotions, journals and thought records
 * @param emotionData Emotion records from the database
 * @param journalData Journal records with tags
 * @param thoughtRecordData Thought records with related information
 * @returns Enhanced data with connection information
 */
export async function enhanceComponentConnections(
  emotionData: any[], 
  journalData: any[], 
  thoughtRecordData: any[]
) {
  // Map of core emotions to their related data
  const emotionConnections: Record<string, {
    totalEntries: number;
    journalEntries: any[];
    thoughtRecords: any[];
    averageIntensity: number;
    averageImprovement: number;
  }> = {};
  
  // Initialize with core emotions
  Object.keys(CORE_EMOTION_FAMILIES).forEach(coreEmotion => {
    emotionConnections[coreEmotion] = {
      totalEntries: 0,
      journalEntries: [],
      thoughtRecords: [],
      averageIntensity: 0,
      averageImprovement: 0
    };
  });
  
  // Process emotion records
  emotionData.forEach(emotion => {
    const coreEmotion = emotion.coreEmotion;
    if (emotionConnections[coreEmotion]) {
      emotionConnections[coreEmotion].totalEntries++;
      emotionConnections[coreEmotion].averageIntensity += emotion.intensity || 0;
    }
  });
  
  // Process journal entries
  journalData.forEach(journal => {
    if (journal.tags && journal.tags.length > 0) {
      const foundEmotions = findMatchingEmotions(journal.tags);
      
      foundEmotions.forEach(emotion => {
        if (emotionConnections[emotion]) {
          emotionConnections[emotion].journalEntries.push(journal);
        }
      });
    }
  });
  
  // Process thought records
  thoughtRecordData.forEach(record => {
    // Find the associated emotion record
    const matchingEmotion = emotionData.find(e => e.id === record.emotionRecordId);
    
    if (matchingEmotion) {
      const coreEmotion = matchingEmotion.coreEmotion;
      if (emotionConnections[coreEmotion]) {
        emotionConnections[coreEmotion].thoughtRecords.push(record);
        
        // Calculate improvement if available
        if (record.reflectionRating) {
          const initialIntensity = matchingEmotion.intensity || 0;
          const improvement = initialIntensity - record.reflectionRating;
          emotionConnections[coreEmotion].averageImprovement += improvement;
        }
      }
    }
  });
  
  // Calculate averages
  Object.keys(emotionConnections).forEach(emotion => {
    const data = emotionConnections[emotion];
    
    if (data.totalEntries > 0) {
      data.averageIntensity = data.averageIntensity / data.totalEntries;
    }
    
    if (data.thoughtRecords.length > 0) {
      data.averageImprovement = data.averageImprovement / data.thoughtRecords.length;
    }
  });
  
  return emotionConnections;
}

/**
 * Generate insights based on the connected component data
 * @param connections The enhanced connection data
 * @returns Array of insight texts
 */
export function generateDataInsights(connections: Record<string, any>): string[] {
  const insights: string[] = [];
  
  // Most frequent emotions
  const sortedByFrequency = Object.entries(connections)
    .sort((a, b) => b[1].totalEntries - a[1].totalEntries)
    .filter(([_, data]) => data.totalEntries > 0);
  
  if (sortedByFrequency.length > 0) {
    const [topEmotion, topData] = sortedByFrequency[0];
    insights.push(`Your most frequently recorded emotion is ${topEmotion}, which appears in ${topData.totalEntries} entries.`);
    
    if (topData.journalEntries.length > 0) {
      insights.push(`You've written about ${topEmotion} in ${topData.journalEntries.length} journal entries.`);
    }
  }
  
  // Emotions with greatest improvement
  const sortedByImprovement = Object.entries(connections)
    .filter(([_, data]) => data.thoughtRecords.length > 0)
    .sort((a, b) => b[1].averageImprovement - a[1].averageImprovement);
  
  if (sortedByImprovement.length > 0) {
    const [bestEmotion, bestData] = sortedByImprovement[0];
    if (bestData.averageImprovement > 0) {
      insights.push(`You've shown the most improvement with ${bestEmotion}, with an average reduction of ${bestData.averageImprovement.toFixed(1)} points after using coping strategies.`);
    }
  }
  
  // Emotions needing more work
  const needsWork = Object.entries(connections)
    .filter(([_, data]) => 
      data.totalEntries > 0 && 
      data.thoughtRecords.length === 0 && 
      data.journalEntries.length > 0
    );
  
  if (needsWork.length > 0) {
    const [emotion] = needsWork[0];
    insights.push(`Consider creating thought records for ${emotion} to develop coping strategies for this emotion.`);
  }
  
  // Most frequently used cognitive distortions
  const distortionCounts: Record<string, number> = {};
  
  Object.values(connections).forEach(data => {
    data.thoughtRecords.forEach((record: any) => {
      if (record.cognitiveDistortions) {
        record.cognitiveDistortions.forEach((distortion: string) => {
          distortionCounts[distortion] = (distortionCounts[distortion] || 0) + 1;
        });
      }
    });
  });
  
  const sortedDistortions = Object.entries(distortionCounts)
    .sort((a, b) => b[1] - a[1]);
  
  if (sortedDistortions.length > 0) {
    const [topDistortion, count] = sortedDistortions[0];
    insights.push(`Your most common cognitive distortion is "${formatDistortionName(topDistortion)}", which appears in ${count} thought records.`);
  }
  
  return insights;
}

/**
 * Format a cognitive distortion name for display
 * @param distortionName The raw distortion name from the database
 * @returns Formatted distortion name
 */
function formatDistortionName(distortionName: string): string {
  return distortionName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}