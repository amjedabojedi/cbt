import React, { useMemo } from 'react';

interface JournalWordCloudProps {
  words: Record<string, number>;
  height?: number;
  className?: string;
}

/**
 * A simple word cloud component for journal tags.
 * Displays tags with varying sizes based on their frequency.
 */
const JournalWordCloud: React.FC<JournalWordCloudProps> = ({ words = {}, height = 300, className = '' }) => {
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

  return (
    <div className={`flex flex-wrap justify-center items-center gap-3 p-4 ${className}`} style={{ height }}>
      {Object.entries(words)
        .sort(() => Math.random() - 0.5) // Randomize order for visual interest
        .map(([tag, count]) => (
          <span
            key={tag}
            className={`${getTagColor(count as number)} font-medium px-2 py-1 inline-block`}
            style={{ fontSize: 12 + Math.floor(((count as number - frequencies.min) / (frequencies.max - frequencies.min || 1)) * 20) }}
            title={`${tag}: mentioned ${count} times`}
          >
            {tag}
          </span>
        ))}
    </div>
  );
};

export default JournalWordCloud;