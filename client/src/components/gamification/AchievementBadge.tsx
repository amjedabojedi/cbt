import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, 
  Medal, 
  Trophy, 
  Zap, 
  Fire, 
  Target, 
  Star, 
  BookOpen, 
  Brain, 
  Heart, 
  Smile,
  Shield,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  id: number;
  name: string;
  description: string;
  type: "streak" | "count" | "milestone" | "diversity";
  category: "emotion_tracking" | "thought_records" | "journaling" | "goals" | "engagement";
  isNew?: boolean;
  isLocked?: boolean;
  level?: number; // 1, 2, 3 for bronze, silver, gold
  className?: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export default function AchievementBadge({
  name,
  description,
  type,
  category,
  isNew = false,
  isLocked = false,
  level = 1,
  className,
  size = "md",
  onClick
}: AchievementBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Icon based on category
  const getIcon = () => {
    switch (category) {
      case "emotion_tracking":
        return <Heart className={cn(
          size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8",
        )} />;
      case "thought_records":
        return <Brain className={cn(
          size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8",
        )} />;
      case "journaling":
        return <BookOpen className={cn(
          size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8",
        )} />;
      case "goals":
        return <Target className={cn(
          size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8",
        )} />;
      case "engagement":
        return <Zap className={cn(
          size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8",
        )} />;
      default:
        return <Star className={cn(
          size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8",
        )} />;
    }
  };
  
  // Border and color based on type and level
  const getBadgeStyles = () => {
    // Base styles
    let styles = "transition-all duration-300 ease-in-out rounded-full flex items-center justify-center";
    
    // Locked state
    if (isLocked) {
      return cn(styles, "bg-gray-200 text-gray-400");
    }
    
    // Set colors based on level (bronze, silver, gold)
    if (level === 1) {
      styles = cn(styles, "bg-amber-100 text-amber-800 border-amber-300");
    } else if (level === 2) {
      styles = cn(styles, "bg-slate-100 text-slate-800 border-slate-300");
    } else if (level === 3) {
      styles = cn(styles, "bg-yellow-100 text-yellow-800 border-yellow-400");
    }
    
    // Add specific styling based on badge type
    switch (type) {
      case "streak":
        return cn(styles, "border-2");
      case "count":
        return cn(styles, "border");
      case "milestone":
        return cn(styles, "border-2 shadow-md");
      case "diversity":
        return cn(styles, "border border-dashed");
      default:
        return styles;
    }
  };
  
  // Size based on prop
  const getBadgeSize = () => {
    switch (size) {
      case "sm":
        return "h-10 w-10";
      case "md":
        return "h-14 w-14";
      case "lg":
        return "h-20 w-20";
      default:
        return "h-14 w-14";
    }
  };
  
  // Handle badge click
  const handleClick = () => {
    setShowDetails(!showDetails);
    if (onClick) onClick();
  };
  
  return (
    <div className="relative inline-block">
      <motion.div
        className={cn(
          getBadgeStyles(),
          getBadgeSize(),
          className,
          "cursor-pointer"
        )}
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={isNew ? { scale: 0.8, opacity: 0 } : { scale: 1 }}
        animate={isNew ? { scale: 1, opacity: 1 } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Icon */}
        {isLocked ? (
          <span className="opacity-50">{getIcon()}</span>
        ) : (
          getIcon()
        )}
        
        {/* New badge indicator */}
        {isNew && !isLocked && (
          <motion.div
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            !
          </motion.div>
        )}
        
        {/* Level indicator for unlocked badges */}
        {!isLocked && level > 1 && (
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full border shadow-sm p-0.5">
            {level === 2 ? (
              <Medal className="h-3 w-3 text-slate-600" />
            ) : (
              <Trophy className="h-3 w-3 text-yellow-600" />
            )}
          </div>
        )}
      </motion.div>
      
      {/* Details tooltip on hover/click */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg p-3 text-left w-48"
            style={{ top: "100%", left: "50%", transform: "translateX(-50%)" }}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="font-medium text-sm">{name}</div>
            <div className="text-xs text-gray-600 mt-1">{description}</div>
            
            {isLocked && (
              <div className="text-xs italic text-gray-500 mt-1">
                Keep using the app to unlock this achievement!
              </div>
            )}
            
            <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
              <span>
                {level === 1 ? "Bronze" : level === 2 ? "Silver" : "Gold"}
              </span>
              <span className="flex items-center">
                {type === "streak" && <Fire className="h-3 w-3 mr-1" />}
                {type === "count" && <Hash className="h-3 w-3 mr-1" />}
                {type === "milestone" && <Award className="h-3 w-3 mr-1" />}
                {type === "diversity" && <Palette className="h-3 w-3 mr-1" />}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </div>
            
            {/* Arrow pointing to badge */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-transparent border-b-8 border-b-white"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Additional icons for the badge details
const Hash = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

const Palette = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="13.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="10.5" r="2.5" />
    <circle cx="8.5" cy="7.5" r="2.5" />
    <circle cx="6.5" cy="12.5" r="2.5" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);