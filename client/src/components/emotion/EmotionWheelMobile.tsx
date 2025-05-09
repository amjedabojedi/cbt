import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { emotionData } from "@/data/emotions";
import { InfoIcon } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
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
  const [selectedCore, setSelectedCore] = useState<string | null>(null);
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedTertiary, setSelectedTertiary] = useState<string | null>(null);
  const [hoveredEmotion, setHoveredEmotion] = useState<string | null>(null);
  const [wheelSize, setWheelSize] = useState<number>(320);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle touch events
  const [touchStartPoint, setTouchStartPoint] = useState({ x: 0, y: 0 });
  const [touchEndPoint, setTouchEndPoint] = useState({ x: 0, y: 0 });
  const [pinchStartDistance, setPinchStartDistance] = useState<number | null>(null);
  const [isPinching, setIsPinching] = useState(false);
  
  // Effect to handle language direction
  useEffect(() => {
    const svg = svgRef.current;
    if (svg) {
      if (direction === "rtl") {
        svg.setAttribute("dir", "rtl");
      } else {
        svg.removeAttribute("dir");
      }
    }
  }, [direction]);
  
  // Effect to handle container size
  useEffect(() => {
    const updateWheelSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setWheelSize(Math.min(width - 20, 400)); // Maximum size 400px, with 10px padding on each side
      }
    };
    
    updateWheelSize();
    window.addEventListener('resize', updateWheelSize);
    
    return () => window.removeEventListener('resize', updateWheelSize);
  }, []);
  
  // Simple translation function
  const translate = (text: string | null) => {
    if (!text) return "";
    // In the future, implement full localization
    return text;
  };
  
  // Calculate the center of the wheel
  const centerX = wheelSize / 2;
  const centerY = wheelSize / 2;
  
  // Calculate the radii for each ring
  const outerRadius = wheelSize / 2;
  const middleRadius = outerRadius * 0.7;
  const innerRadius = outerRadius * 0.4;
  
  // Handle touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch for selection
      setTouchStartPoint({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setPinchStartDistance(distance);
      setIsPinching(true);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPinching && e.touches.length === 2 && pinchStartDistance && containerRef.current) {
      // Handle pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const scale = currentDistance / pinchStartDistance;
      const containerWidth = containerRef.current.clientWidth;
      
      // Adjust wheel size based on pinch, keeping within limits
      let newSize = wheelSize * scale;
      newSize = Math.max(containerWidth * 0.7, Math.min(newSize, containerWidth * 1.5));
      
      setWheelSize(newSize);
    } else if (e.touches.length === 1) {
      // Single touch - prepare for selection on end
      setTouchEndPoint({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isPinching) {
      setIsPinching(false);
      setPinchStartDistance(null);
      return;
    }
    
    // Provide haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(20); // 20ms vibration for tactile feedback
    }
    
    // Process touch for emotion selection
    const targetElement = e.target as Element;
    if (targetElement.tagName === 'path' && targetElement.hasAttribute('data-emotion')) {
      const emotion = targetElement.getAttribute('data-emotion') || '';
      const emotionLayer = targetElement.getAttribute('data-layer') || '';
      
      handleEmotionSelect(emotion, emotionLayer);
    }
  };
  
  // Handle emotion selection
  const handleEmotionSelect = (emotion: string, layer: string) => {
    if (layer === "core") {
      setSelectedCore(emotion);
      setSelectedPrimary(null);
      setSelectedTertiary(null);
    } else if (layer === "primary") {
      // Find the core emotion for this primary emotion
      const coreEmotion = Object.keys(emotionData).find(core => 
        emotionData[core].some(group => group.name === emotion)
      ) || null;
      
      setSelectedCore(coreEmotion);
      setSelectedPrimary(emotion);
      setSelectedTertiary(null);
    } else if (layer === "tertiary") {
      // Find the primary group that contains this tertiary emotion
      let foundCore = null;
      let foundPrimary = null;
      
      for (const core in emotionData) {
        for (const group of emotionData[core]) {
          if (group.tertiaries && group.tertiaries.includes(emotion)) {
            foundCore = core;
            foundPrimary = group.name;
            break;
          }
        }
        if (foundCore) break;
      }
      
      setSelectedCore(foundCore);
      setSelectedPrimary(foundPrimary);
      setSelectedTertiary(emotion);
    }
    
    // Call the provided callback with the selection
    if (onEmotionSelect) {
      onEmotionSelect({
        coreEmotion: layer === "core" ? emotion : (
          layer === "primary" ? 
            Object.keys(emotionData).find(core => 
              emotionData[core].some(group => group.name === emotion)
            ) || "" : 
            (foundCore || "")
        ),
        primaryEmotion: layer === "primary" ? emotion : (
          layer === "tertiary" ? foundPrimary || "" : ""
        ),
        tertiaryEmotion: layer === "tertiary" ? emotion : "",
      });
    }
  };
  
  // Create the segments for the core emotions (inner ring)
  const coreSegments = Object.keys(emotionData).map((emotion, index) => {
    const totalEmotions = Object.keys(emotionData).length;
    const anglePerEmotion = (Math.PI * 2) / totalEmotions;
    const startAngle = index * anglePerEmotion;
    const endAngle = (index + 1) * anglePerEmotion;
    
    const x1 = centerX + innerRadius * Math.cos(startAngle);
    const y1 = centerY + innerRadius * Math.sin(startAngle);
    const x2 = centerX + innerRadius * Math.cos(endAngle);
    const y2 = centerY + innerRadius * Math.sin(endAngle);
    
    // Large arc flag is 0 for angles less than 180 degrees, 1 for angles greater than 180
    const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;
    
    // Calculate a point mid-way along the arc for placing text
    const midAngle = (startAngle + endAngle) / 2;
    const textX = centerX + (innerRadius / 2) * Math.cos(midAngle);
    const textY = centerY + (innerRadius / 2) * Math.sin(midAngle);
    
    // Determine text anchor position based on the angle
    const textAnchor = midAngle > Math.PI / 2 && midAngle < Math.PI * 3 / 2 ? "end" : "start";
    
    // Simple coloring based on emotion
    const colorMap: {[key: string]: string} = {
      "Joy": "fill-yellow-200 stroke-yellow-400 hover:fill-yellow-300",
      "Sadness": "fill-blue-200 stroke-blue-400 hover:fill-blue-300",
      "Fear": "fill-purple-200 stroke-purple-400 hover:fill-purple-300",
      "Disgust": "fill-green-200 stroke-green-400 hover:fill-green-300",
      "Anger": "fill-red-200 stroke-red-400 hover:fill-red-300",
      "Surprise": "fill-orange-200 stroke-orange-400 hover:fill-orange-300",
    };
    
    const classes = colorMap[emotion] || "fill-gray-200 stroke-gray-400 hover:fill-gray-300";
    const isSelected = selectedCore === emotion;
    
    return (
      <g key={`core-${emotion}`} className="cursor-pointer touch-manipulation">
        <path
          d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
          className={cn(
            classes,
            "transition-colors duration-200",
            isSelected ? "stroke-2 filter drop-shadow(0 0 3px rgba(0,0,0,0.3))" : "stroke-1",
            hoveredEmotion === emotion ? "opacity-90" : "opacity-80"
          )}
          onMouseEnter={() => setHoveredEmotion(emotion)}
          onMouseLeave={() => setHoveredEmotion(null)}
          onClick={() => handleEmotionSelect(emotion, "core")}
          data-emotion={emotion}
          data-layer="core"
        />
        <text
          x={textX}
          y={textY}
          className={cn(
            "text-xs sm:text-sm font-medium pointer-events-none text-shadow-sm",
            isSelected ? "font-bold" : ""
          )}
          textAnchor={textAnchor}
          dominantBaseline="middle"
        >
          {translate(emotion)}
        </text>
      </g>
    );
  });

  // Create the segments for the primary emotions (middle ring)
  const primarySegments = Object.keys(emotionData).flatMap((coreEmotion, coreIndex) => {
    const totalCoreEmotions = Object.keys(emotionData).length;
    const anglePerCoreEmotion = (Math.PI * 2) / totalCoreEmotions;
    const coreStartAngle = coreIndex * anglePerCoreEmotion;
    const coreEndAngle = (coreIndex + 1) * anglePerCoreEmotion;
    
    const primaryEmotions = emotionData[coreEmotion];
    
    return primaryEmotions.map((primaryGroup, primaryIndex) => {
      const totalPrimaryEmotions = primaryEmotions.length;
      const anglePerPrimaryEmotion = (coreEndAngle - coreStartAngle) / totalPrimaryEmotions;
      const primaryStartAngle = coreStartAngle + primaryIndex * anglePerPrimaryEmotion;
      const primaryEndAngle = primaryStartAngle + anglePerPrimaryEmotion;
      
      const x1 = centerX + innerRadius * Math.cos(primaryStartAngle);
      const y1 = centerY + innerRadius * Math.sin(primaryStartAngle);
      const x2 = centerX + innerRadius * Math.cos(primaryEndAngle);
      const y2 = centerY + innerRadius * Math.sin(primaryEndAngle);
      
      const x3 = centerX + middleRadius * Math.cos(primaryEndAngle);
      const y3 = centerY + middleRadius * Math.sin(primaryEndAngle);
      const x4 = centerX + middleRadius * Math.cos(primaryStartAngle);
      const y4 = centerY + middleRadius * Math.sin(primaryStartAngle);
      
      // Calculate a point mid-way along the arc for placing text
      const midAngle = (primaryStartAngle + primaryEndAngle) / 2;
      const textRadius = (innerRadius + middleRadius) / 2;
      const textX = centerX + textRadius * Math.cos(midAngle);
      const textY = centerY + textRadius * Math.sin(midAngle);
      
      // Determine text anchor and rotation based on the angle
      const textAnchor = "middle";
      const textRotation = (midAngle * 180 / Math.PI) + (midAngle > Math.PI / 2 && midAngle < Math.PI * 3 / 2 ? 180 : 0);
      
      // Inherit color from core emotion but make it slightly different
      const colorMap: {[key: string]: string} = {
        "Joy": "fill-yellow-100 stroke-yellow-300 hover:fill-yellow-200",
        "Sadness": "fill-blue-100 stroke-blue-300 hover:fill-blue-200",
        "Fear": "fill-purple-100 stroke-purple-300 hover:fill-purple-200",
        "Disgust": "fill-green-100 stroke-green-300 hover:fill-green-200",
        "Anger": "fill-red-100 stroke-red-300 hover:fill-red-200",
        "Surprise": "fill-orange-100 stroke-orange-300 hover:fill-orange-200",
      };
      
      const classes = colorMap[coreEmotion] || "fill-gray-100 stroke-gray-300 hover:fill-gray-200";
      const isSelected = selectedPrimary === primaryGroup.name;
      const isParentSelected = selectedCore === coreEmotion;
      
      return (
        <g key={`primary-${primaryGroup.name}`} className="cursor-pointer touch-manipulation">
          <path
            d={`M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z`}
            className={cn(
              classes,
              "transition-colors duration-200",
              isSelected ? "stroke-2 filter drop-shadow(0 0 3px rgba(0,0,0,0.3))" : "stroke-1",
              isParentSelected && !isSelected ? "opacity-90" : "opacity-80",
              hoveredEmotion === primaryGroup.name ? "opacity-90" : ""
            )}
            onMouseEnter={() => setHoveredEmotion(primaryGroup.name)}
            onMouseLeave={() => setHoveredEmotion(null)}
            onClick={() => handleEmotionSelect(primaryGroup.name, "primary")}
            data-emotion={primaryGroup.name}
            data-layer="primary"
          />
          <text
            x={textX}
            y={textY}
            transform={`rotate(${textRotation}, ${textX}, ${textY})`}
            className={cn(
              "text-xs sm:text-sm font-medium pointer-events-none text-shadow-sm",
              isSelected ? "font-bold" : ""
            )}
            textAnchor={textAnchor}
            dominantBaseline="middle"
          >
            {translate(primaryGroup.name)}
          </text>
        </g>
      );
    });
  });

  // Create the segments for the tertiary emotions (outer ring)
  const tertiarySegments = Object.keys(emotionData).flatMap((coreEmotion, coreIndex) => {
    const totalCoreEmotions = Object.keys(emotionData).length;
    const anglePerCoreEmotion = (Math.PI * 2) / totalCoreEmotions;
    const coreStartAngle = coreIndex * anglePerCoreEmotion;
    const coreEndAngle = (coreIndex + 1) * anglePerCoreEmotion;
    
    return emotionData[coreEmotion].flatMap((primaryGroup, primaryIndex) => {
      const totalPrimaryEmotions = emotionData[coreEmotion].length;
      const anglePerPrimaryEmotion = (coreEndAngle - coreStartAngle) / totalPrimaryEmotions;
      const primaryStartAngle = coreStartAngle + primaryIndex * anglePerPrimaryEmotion;
      const primaryEndAngle = primaryStartAngle + anglePerPrimaryEmotion;
      
      if (!primaryGroup.tertiaries || primaryGroup.tertiaries.length === 0) {
        return [];
      }
      
      return primaryGroup.tertiaries.map((tertiaryEmotion, tertiaryIndex) => {
        const totalTertiaryEmotions = primaryGroup.tertiaries?.length || 1;
        const anglePerTertiaryEmotion = (primaryEndAngle - primaryStartAngle) / totalTertiaryEmotions;
        const tertiaryStartAngle = primaryStartAngle + tertiaryIndex * anglePerTertiaryEmotion;
        const tertiaryEndAngle = tertiaryStartAngle + anglePerTertiaryEmotion;
        
        const x1 = centerX + middleRadius * Math.cos(tertiaryStartAngle);
        const y1 = centerY + middleRadius * Math.sin(tertiaryStartAngle);
        const x2 = centerX + middleRadius * Math.cos(tertiaryEndAngle);
        const y2 = centerY + middleRadius * Math.sin(tertiaryEndAngle);
        
        const x3 = centerX + outerRadius * Math.cos(tertiaryEndAngle);
        const y3 = centerY + outerRadius * Math.sin(tertiaryEndAngle);
        const x4 = centerX + outerRadius * Math.cos(tertiaryStartAngle);
        const y4 = centerY + outerRadius * Math.sin(tertiaryStartAngle);
        
        // Calculate a point mid-way along the arc for placing text
        const midAngle = (tertiaryStartAngle + tertiaryEndAngle) / 2;
        const textRadius = (middleRadius + outerRadius) / 2;
        const textX = centerX + textRadius * Math.cos(midAngle);
        const textY = centerY + textRadius * Math.sin(midAngle);
        
        // Determine text anchor and rotation based on the angle
        const textAnchor = "middle";
        const textRotation = (midAngle * 180 / Math.PI) + (midAngle > Math.PI / 2 && midAngle < Math.PI * 3 / 2 ? 180 : 0);
        
        // Inherit color from primary emotion but make it lighter
        const colorMap: {[key: string]: string} = {
          "Joy": "fill-yellow-50 stroke-yellow-200 hover:fill-yellow-100",
          "Sadness": "fill-blue-50 stroke-blue-200 hover:fill-blue-100",
          "Fear": "fill-purple-50 stroke-purple-200 hover:fill-purple-100",
          "Disgust": "fill-green-50 stroke-green-200 hover:fill-green-100",
          "Anger": "fill-red-50 stroke-red-200 hover:fill-red-100",
          "Surprise": "fill-orange-50 stroke-orange-200 hover:fill-orange-100",
        };
        
        const classes = colorMap[coreEmotion] || "fill-gray-50 stroke-gray-200 hover:fill-gray-100";
        const isSelected = selectedTertiary === tertiaryEmotion;
        const isParentSelected = selectedPrimary === primaryGroup.name;
        const isGrandparentSelected = selectedCore === coreEmotion;
        
        return (
          <g key={`tertiary-${tertiaryEmotion}`} className="cursor-pointer touch-manipulation">
            <path
              d={`M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z`}
              className={cn(
                classes,
                "transition-colors duration-200",
                isSelected ? "stroke-2 filter drop-shadow(0 0 3px rgba(0,0,0,0.3))" : "stroke-1",
                isParentSelected && !isSelected ? "opacity-90" : "opacity-80",
                isGrandparentSelected && !isParentSelected && !isSelected ? "opacity-85" : "",
                hoveredEmotion === tertiaryEmotion ? "opacity-90" : ""
              )}
              onMouseEnter={() => setHoveredEmotion(tertiaryEmotion)}
              onMouseLeave={() => setHoveredEmotion(null)}
              onClick={() => handleEmotionSelect(tertiaryEmotion, "tertiary")}
              data-emotion={tertiaryEmotion}
              data-layer="tertiary"
            />
            <text
              x={textX}
              y={textY}
              transform={`rotate(${textRotation}, ${textX}, ${textY})`}
              className={cn(
                "text-[10px] sm:text-xs font-medium pointer-events-none text-shadow-sm",
                isSelected ? "font-bold" : ""
              )}
              textAnchor={textAnchor}
              dominantBaseline="middle"
            >
              {translate(tertiaryEmotion)}
            </text>
          </g>
        );
      });
    });
  });

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Selection Display */}
      <div className="flex flex-col items-center">
        <div className="text-center px-4 py-2 bg-white rounded-full shadow-md">
          {selectedTertiary ? (
            <motion.span 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1 font-medium px-2"
            >
              <span className="font-medium text-gray-900">{translate(selectedTertiary)}</span>
              <button 
                className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none" 
                onClick={() => setSelectedTertiary(null)}
              >
                ✕
              </button>
            </motion.span>
          ) : selectedPrimary ? (
            <motion.span 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1 font-medium px-2"
            >
              <span className="font-medium text-gray-900">{translate(selectedPrimary)}</span>
              <button 
                className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none" 
                onClick={() => setSelectedPrimary(null)}
              >
                ✕
              </button>
            </motion.span>
          ) : selectedCore ? (
            <motion.span 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1 font-medium px-2"
            >
              <span className="font-medium text-gray-900">{translate(selectedCore)}</span>
              <button 
                className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none" 
                onClick={() => setSelectedCore(null)}
              >
                ✕
              </button>
            </motion.span>
          ) : (
            <span className="text-sm text-gray-500 italic">
              {translate("Select an emotion from the wheel below")}
            </span>
          )}
        </div>
      </div>

      {/* Touch instructions */}
      <div className="flex items-center justify-center text-xs text-gray-500 mb-2">
        <InfoIcon className="h-3 w-3 mr-1" />
        Pinch to zoom, tap to select
      </div>

      {/* The SVG wheel with touch support */}
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        id="emotional-wheel-mobile"
        className="wheel-container relative rounded-full p-4 overflow-hidden touch-manipulation"
        style={{ 
          background: "linear-gradient(135deg, #f5f7ff 0%, #e0e7ff 100%)",
          boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.1), 0 8px 10px -6px rgba(99, 102, 241, 0.05)",
          width: '100%',
          maxWidth: '100%'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-0 rounded-full bg-white/50 backdrop-blur-sm" 
          style={{ boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)" }}></div>
        
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${wheelSize} ${wheelSize}`}
          className={cn("emotion-wheel relative z-10", direction === "rtl" ? "transform scale-x-[-1]" : "")}
        >
          {/* Core emotions (inner ring) */}
          {coreSegments}
          
          {/* Primary emotions (middle ring) */}
          {primarySegments}
          
          {/* Tertiary emotions (outer ring) */}
          {tertiarySegments}
          
          {/* Center circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={innerRadius * 0.2}
            className="fill-white stroke-gray-200"
          />
        </svg>
      </motion.div>
      
      {/* Helper text at bottom */}
      <TooltipProvider>
        <div className="text-center px-4 py-2 text-xs text-gray-500 mt-2">
          <Tooltip>
            <TooltipTrigger>
              <span className="underline">Need help?</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-center">
                The emotion wheel helps you identify emotions with precision. The inner ring shows core emotions, 
                the middle ring shows primary emotions, and the outer ring shows more specific tertiary emotions.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}