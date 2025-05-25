/**
 * EmotionWheelMobile - Mobile-optimized emotion selection interface
 * 
 * This component provides a mobile-friendly interface for selecting emotions.
 * It uses a different UI approach than the desktop version to accommodate
 * smaller screen sizes and touch interactions.
 * 
 * Used by EmotionWheelResponsive when a mobile viewport is detected.
 */
import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { emotionGroups } from "@/lib/emotions";
import { CheckIcon, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EmotionWheelMobileProps {
  language?: string;
  direction?: "ltr" | "rtl";
  onEmotionSelect?: (selection: {
    coreEmotion: string;
    primaryEmotion: string;
    tertiaryEmotion: string;
  }) => void;
}

export default function EmotionWheelMobile({
  language = "en",
  direction = "ltr",
  onEmotionSelect,
}: EmotionWheelMobileProps) {
  // State for tracking selected emotions
  const [selectedCoreGroup, setSelectedCoreGroup] = useState<number | null>(null);
  const [selectedPrimaryGroup, setSelectedPrimaryGroup] = useState<number | null>(null);
  const [selectedTertiaryEmotion, setSelectedTertiaryEmotion] = useState<string | null>(null);
  
  // Reference to the wheel container for touch events
  const wheelContainerRef = useRef<HTMLDivElement>(null);
  
  // State for tracking touch/drag interactions
  const [touchActive, setTouchActive] = useState(false);
  const [viewMode, setViewMode] = useState<"core" | "primary" | "tertiary">("core");
  
  // Motion values for smooth animations
  const scale = useMotionValue(1);
  const opacity = useTransform(scale, [0.95, 1], [0.5, 1]);
  
  // Function to provide haptic feedback on selection when available
  const triggerHapticFeedback = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50); // 50ms vibration
    }
  };
  
  // Function to handle core emotion selection
  const handleCoreSelect = (groupIndex: number) => {
    triggerHapticFeedback();
    setSelectedCoreGroup(groupIndex);
    setSelectedPrimaryGroup(null);
    setSelectedTertiaryEmotion(null);
    setViewMode("primary");
  };
  
  // Function to handle primary emotion selection
  const handlePrimarySelect = (primaryGroup: number, primaryIndex: number) => {
    triggerHapticFeedback();
    setSelectedPrimaryGroup(primaryIndex);
    setSelectedTertiaryEmotion(null);
    setViewMode("tertiary");
  };
  
  // Function to handle tertiary emotion selection
  const handleTertiarySelect = (tertiaryEmotion: string) => {
    triggerHapticFeedback();
    setSelectedTertiaryEmotion(tertiaryEmotion);
    
    if (selectedCoreGroup !== null && selectedPrimaryGroup !== null) {
      const coreEmotion = emotionGroups[selectedCoreGroup].core;
      const primaryEmotion = emotionGroups[selectedCoreGroup].primary[selectedPrimaryGroup];
      
      // Don't auto-trigger onEmotionSelect - let user manually confirm
      // Store the selection in state and wait for user to press confirm
    }
  };
  
  // Function to confirm emotion selection
  const handleConfirmSelection = () => {
    if (selectedCoreGroup !== null && selectedPrimaryGroup !== null && selectedTertiaryEmotion) {
      const coreEmotion = emotionGroups[selectedCoreGroup].core;
      const primaryEmotion = emotionGroups[selectedCoreGroup].primary[selectedPrimaryGroup];
      
      triggerHapticFeedback();
      if (onEmotionSelect) {
        onEmotionSelect({
          coreEmotion,
          primaryEmotion,
          tertiaryEmotion: selectedTertiaryEmotion,
        });
      }
    }
  };

  // Function to go back to previous selection level
  const handleBack = () => {
    triggerHapticFeedback();
    if (viewMode === "tertiary") {
      setViewMode("primary");
      setSelectedTertiaryEmotion(null);
    } else if (viewMode === "primary") {
      setViewMode("core");
      setSelectedCoreGroup(null);
    }
  };
  
  // Color mapping for emotion groups
  const getEmotionColor = (emotion: string | null): string => {
    if (!emotion) return "bg-gray-200 text-gray-600";
    
    const lowerEmotion = emotion.toLowerCase();
    
    // Core emotions color mapping
    if (lowerEmotion.includes("anger")) return "bg-red-100 text-red-700";
    if (lowerEmotion.includes("sad")) return "bg-blue-100 text-blue-700";
    if (lowerEmotion.includes("fear")) return "bg-green-100 text-green-700";
    if (lowerEmotion.includes("joy") || lowerEmotion.includes("happy")) return "bg-yellow-100 text-yellow-700";
    if (lowerEmotion.includes("love")) return "bg-pink-100 text-pink-700";
    if (lowerEmotion.includes("surprise")) return "bg-purple-100 text-purple-700";
    
    // Default color if no match
    return "bg-gray-100 text-gray-700";
  };
  
  // Finding currently selected emotions
  const getSelectedEmotions = () => {
    let core = null;
    let primary = null;
    let tertiary = selectedTertiaryEmotion;
    
    if (selectedCoreGroup !== null) {
      core = emotionGroups[selectedCoreGroup].core;
      
      if (selectedPrimaryGroup !== null) {
        primary = emotionGroups[selectedCoreGroup].primary[selectedPrimaryGroup];
      }
    }
    
    return { core, primary, tertiary };
  };
  
  const { core: selectedCore, primary: selectedPrimary } = getSelectedEmotions();
  
  // Render the core emotions wheel
  const renderCoreWheel = () => {
    return (
      <motion.div 
        className="p-4 rounded-xl bg-white shadow-sm"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-center text-lg font-medium mb-4">Select a Core Emotion</h3>
        <div className="grid grid-cols-2 gap-3">
          {emotionGroups.map((group: any, index: number) => (
            <motion.button
              key={group.core}
              className={cn(
                "p-4 rounded-lg text-center font-medium transition-colors",
                getEmotionColor(group.core),
                selectedCoreGroup === index ? "ring-2 ring-offset-2 ring-blue-500" : ""
              )}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCoreSelect(index)}
            >
              {group.core}
            </motion.button>
          ))}
        </div>
        <div className="text-center mt-4 text-sm text-gray-500">
          Tap a core emotion to continue
        </div>
      </motion.div>
    );
  };
  
  // Render the primary emotions wheel based on selected core emotion
  const renderPrimaryWheel = () => {
    if (selectedCoreGroup === null) return null;
    
    const coreGroup = emotionGroups[selectedCoreGroup];
    
    return (
      <motion.div 
        className="p-4 rounded-xl bg-white shadow-sm"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={handleBack}
            className="text-blue-600 text-sm flex items-center"
          >
            ← Back
          </button>
          <h3 className="text-center text-lg font-medium">
            Variations of <span className={cn("px-2 py-1 rounded", getEmotionColor(coreGroup.core))}>
              {coreGroup.core}
            </span>
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {coreGroup.primary.map((primaryEmotion: string, primaryIndex: number) => (
            <motion.button
              key={primaryEmotion}
              className={cn(
                "p-3 rounded-lg text-center transition-colors",
                getEmotionColor(coreGroup.core),
                selectedPrimaryGroup === primaryIndex ? "ring-2 ring-offset-2 ring-blue-500" : ""
              )}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePrimarySelect(selectedCoreGroup, primaryIndex)}
            >
              {primaryEmotion}
            </motion.button>
          ))}
        </div>
        
        <div className="text-center mt-4 text-sm text-gray-500">
          Tap to select a more specific emotion
        </div>
      </motion.div>
    );
  };
  
  // Render the tertiary emotions list based on selected primary emotion
  const renderTertiaryWheel = () => {
    if (selectedCoreGroup === null || selectedPrimaryGroup === null) return null;
    
    const coreGroup = emotionGroups[selectedCoreGroup];
    const primaryEmotion = coreGroup.primary[selectedPrimaryGroup];
    const tertiaryEmotions = coreGroup.tertiary[selectedPrimaryGroup];
    
    return (
      <motion.div 
        className="p-4 rounded-xl bg-white shadow-sm"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={handleBack}
            className="text-blue-600 text-sm flex items-center"
          >
            ← Back
          </button>
          <h3 className="text-center text-lg font-medium">
            Specific forms of <span className={cn("px-2 py-1 rounded", getEmotionColor(primaryEmotion))}>
              {primaryEmotion}
            </span>
          </h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {tertiaryEmotions.map((tertiaryEmotion: string, tertiaryIndex: number) => (
            <motion.button
              key={tertiaryEmotion}
              className={cn(
                "p-2 rounded-lg text-center text-sm transition-colors",
                getEmotionColor(coreGroup.core),
                selectedTertiaryEmotion === tertiaryEmotion ? "ring-2 ring-offset-2 ring-blue-500 font-medium" : ""
              )}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTertiarySelect(tertiaryEmotion)}
            >
              {tertiaryEmotion}
              {selectedTertiaryEmotion === tertiaryEmotion && (
                <CheckIcon className="inline ml-1 h-4 w-4" />
              )}
            </motion.button>
          ))}
        </div>
        
        <div className="text-center mt-4 text-sm text-gray-500">
          Tap to make your final selection
        </div>
      </motion.div>
    );
  };
  
  // Render the final selection preview
  const renderSelectionPreview = () => {
    const { core, primary, tertiary } = getSelectedEmotions();
    
    if (!core) return null;
    
    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm font-medium text-gray-600 mb-2">Your selection:</div>
        <div className="flex flex-wrap gap-2 items-center">
          {core && (
            <span className={cn("px-2 py-1 rounded text-sm", getEmotionColor(core))}>
              {core}
            </span>
          )}
          
          {primary && (
            <>
              <span className="text-gray-400">→</span>
              <span className={cn("px-2 py-1 rounded text-sm", getEmotionColor(core))}>
                {primary}
              </span>
            </>
          )}
          
          {tertiary && (
            <>
              <span className="text-gray-400">→</span>
              <span className={cn("px-2 py-1 rounded text-sm font-medium", getEmotionColor(core))}>
                {tertiary}
              </span>
            </>
          )}
        </div>
      </div>
    );
  };
  
  // Render the main component
  return (
    <div 
      className="relative overflow-hidden rounded-xl bg-gray-50 py-4"
      ref={wheelContainerRef}
    >
      <TooltipProvider>
        <div className="absolute top-2 right-2 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-gray-400 hover:text-gray-600">
                <HelpCircle className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div>This emotion wheel helps you identify your feelings with increasing specificity. Start with a core emotion, then narrow it down.</div>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
      
      <div className="px-4">
        {/* Show the appropriate wheel based on selection state */}
        {viewMode === "core" && renderCoreWheel()}
        {viewMode === "primary" && renderPrimaryWheel()}
        {viewMode === "tertiary" && renderTertiaryWheel()}
        
        {/* Show selection preview if any emotion is selected */}
        {selectedCore && renderSelectionPreview()}
        
        {/* Confirm button for mobile users */}
        {selectedTertiaryEmotion && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleBack}
              className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium"
            >
              Back
            </button>
            <button
              onClick={handleConfirmSelection}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium"
            >
              Confirm Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}