import React, { useMemo } from 'react';

// Import the getEmotionInfo function to get colors for emotions
import { getEmotionInfo } from '@/utils/emotionUtils';

interface JournalWordCloudProps {
  words: Record<string, number>;
  height?: number;
  className?: string;
  maxTags?: number;
}

/**
 * A simple word cloud component for journal tags and emotions.
 * Displays words with varying sizes based on their frequency.
 */
const JournalWordCloud: React.FC<JournalWordCloudProps> = ({ words = {}, height = 300, className = '', maxTags = 30 }) => {
  // Calculate the min and max frequencies
  const frequencies = useMemo(() => {
    const values = Object.values(words);
    if (values.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }, [words]);

  // Generate color based on emotion or frequency
  const getTagColor = (tag: string, count: number) => {
    // Try to get emotion color first
    try {
      const { color } = getEmotionInfo(tag);
      if (color) return color.replace('bg-', 'bg-opacity-80 ');
    } catch (e) {
      // If not an emotion or error, fall back to frequency-based color
    }
    
    // Fallback to frequency-based coloring
    const { min, max } = frequencies;
    if (min === max) return 'bg-blue-100 border-blue-300 text-blue-800';
    
    // Normalize the count to a value between 0 and 1
    const normalizedValue = (count - min) / (max - min);
    
    // Color palette based on frequency
    if (normalizedValue < 0.33) {
      return 'bg-blue-100 border-blue-300 text-blue-800';
    } else if (normalizedValue < 0.66) {
      return 'bg-purple-100 border-purple-300 text-purple-800';
    } else {
      return 'bg-red-100 border-red-300 text-red-800';
    }
  };

  // Calculate font size based on frequency
  const getTagSize = (count: number) => {
    const { min, max } = frequencies;
    if (min === max) return 'text-base'; // Default size if all tags have the same frequency
    
    // Normalize the count to a value between 0 and 1
    const normalizedValue = (count - min) / (max - min);
    
    // Map to font sizes from 12px to 32px
    const size = 12 + Math.floor(normalizedValue * 20);
    return `text-[${size}px]`;
  };

  // Sort the words by frequency (highest first) and limit to maxTags
  const sortedTags = useMemo(() => {
    return Object.entries(words)
      .sort((a, b) => (b[1] as number) - (a[1] as number)) // Sort by frequency (highest first)
      .slice(0, maxTags); // Limit to maxTags
  }, [words, maxTags]);

  // Get tooltip description for a tag
  const getTooltipDescription = (tag: string, count: number) => {
    try {
      const { description } = getEmotionInfo(tag);
      return `${description} (${count} times)`;
    } catch (e) {
      return `${tag}: mentioned ${count} times`;
    }
  };

  return (
    <div className={`flex flex-wrap justify-center items-center gap-3 p-4 overflow-hidden ${className}`} style={{ height, maxHeight: height }}>
      {sortedTags.map(([tag, count]) => (
        <span
          key={tag}
          className={`${getTagColor(tag, count as number)} font-medium px-2.5 py-1 inline-block rounded-md border`}
          style={{ 
            fontSize: 12 + Math.floor(((count as number - frequencies.min) / (frequencies.max - frequencies.min || 1)) * 20),
            maxWidth: '100%',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}
          title={getTooltipDescription(tag, count as number)}
        >
          {tag}
        </span>
      ))}
      {sortedTags.length === 0 && (
        <div className="text-gray-400 italic text-sm">No emotions tracked yet</div>
      )}
    </div>
  );
};

export default JournalWordCloud;