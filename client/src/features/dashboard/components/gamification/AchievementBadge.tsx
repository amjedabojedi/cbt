import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Award, 
  Medal, 
  Target,
  Calendar,
  BarChart4,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AchievementBadgeProps {
  id: number;
  name: string;
  description: string;
  type: "milestone" | "count" | "streak" | "diversity";
  category: "emotion_tracking" | "thought_records" | "journaling" | "goals" | "engagement";
  level: 1 | 2 | 3; // 1 = bronze, 2 = silver, 3 = gold
  isLocked?: boolean;
  isNew?: boolean;
}

export default function AchievementBadge({
  id,
  name,
  description,
  type,
  category,
  level = 1,
  isLocked = false,
  isNew = false,
}: AchievementBadgeProps) {
  const [hover, setHover] = useState(false);
  
  // Get the badge color based on level
  const getBadgeColor = () => {
    if (isLocked) return "bg-gray-200 text-gray-400";
    
    switch (level) {
      case 1:
        return "bg-amber-100 border-amber-300 text-amber-900";
      case 2:
        return "bg-gray-100 border-gray-300 text-gray-900";
      case 3:
        return "bg-yellow-100 border-yellow-300 text-yellow-900";
      default:
        return "bg-amber-100 border-amber-300 text-amber-900";
    }
  };
  
  // Get the icon based on achievement type
  const getIcon = () => {
    if (isLocked) {
      return <Target className="h-6 w-6 mb-1 text-gray-400" />;
    }
    
    switch (type) {
      case "milestone":
        return <Award className="h-6 w-6 mb-1 text-amber-500" />;
      case "count":
        return <BarChart4 className="h-6 w-6 mb-1 text-blue-500" />;
      case "streak":
        return <Calendar className="h-6 w-6 mb-1 text-green-500" />;
      case "diversity":
        return <Sparkles className="h-6 w-6 mb-1 text-purple-500" />;
      default:
        return <Award className="h-6 w-6 mb-1 text-amber-500" />;
    }
  };
  
  // Get the badge with animation
  const badge = (
    <motion.div
      className={cn(
        "rounded-lg border p-3 flex flex-col items-center text-center relative", 
        getBadgeColor(),
        hover && !isLocked ? "shadow-md" : "shadow-sm"
      )}
      whileHover={{ 
        scale: isLocked ? 1 : 1.05,
        y: isLocked ? 0 : -5
      }}
      whileTap={{ scale: isLocked ? 1 : 0.95 }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      transition={{ duration: 0.2 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* New badge indicator */}
      {isNew && !isLocked && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
          NEW
        </div>
      )}
      
      {/* Level indicator */}
      {!isLocked && (
        <div className="absolute top-1 left-1">
          {Array.from({ length: level }).map((_, i) => (
            <Medal key={i} className="h-3 w-3 inline-block text-amber-500" />
          ))}
        </div>
      )}
      
      {/* Icon */}
      {getIcon()}
      
      {/* Title */}
      <div className={cn(
        "text-xs font-medium line-clamp-2 min-h-[2rem] flex items-center",
        isLocked && "opacity-70"
      )}>
        {name}
      </div>
    </motion.div>
  );
  
  // Wrap the badge in a tooltip for details
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="cursor-pointer">
            {badge}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-medium">{name}</div>
            <p className="text-xs text-gray-500">{description}</p>
            {isLocked && (
              <p className="text-xs text-amber-500 font-medium mt-1">Complete this achievement to unlock it</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}