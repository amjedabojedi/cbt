import React, { useMemo } from 'react';

interface JournalWordCloudProps {
  words: Record<string, number>;
  height?: number;
  className?: string;
  maxTags?: number;
}

/**
 * A simple word cloud component for journal tags.
 * Displays tags with varying sizes based on their frequency.
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

  // Generate color based on frequency
  const getTagColor = (count: number) => {
    const { min, max } = frequencies;
    if (min === max) return 'text-blue-500';
    
    // Normalize the count to a value between 0 and 1
    const normalizedValue = (count - min) / (max - min);
    
    // Color palette from blue to red through purple
    if (normalizedValue < 0.33) {
      return 'text-blue-500';
    } else if (normalizedValue < 0.66) {
      return 'text-purple-500';
    } else {
      return 'text-red-500';
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

  return (
    <div className={`flex flex-wrap justify-center items-center gap-3 p-4 overflow-hidden ${className}`} style={{ height, maxHeight: height }}>
      {sortedTags.map(([tag, count]) => (
        <span
          key={tag}
          className={`${getTagColor(count as number)} font-medium px-2 py-1 inline-block rounded-md`}
          style={{ 
            fontSize: 12 + Math.floor(((count as number - frequencies.min) / (frequencies.max - frequencies.min || 1)) * 20),
            maxWidth: '100%',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}
          title={`${tag}: mentioned ${count} times`}
        >
          {tag}
        </span>
      ))}
      {sortedTags.length === 0 && (
        <div className="text-gray-400 italic text-sm">No tags available</div>
      )}
    </div>
  );
};

export default JournalWordCloud;