import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Define the emotion structure
interface EmotionData {
  name: string;
  color: string;
  gradient?: [string, string]; // Start and end colors for gradient
  children?: EmotionData[];
}

// Core emotions data with enhanced color schemes
const emotionsData: EmotionData[] = [
  {
    name: "Joy",
    color: "#FFC107",
    gradient: ["#FFC107", "#FFECB3"],
    children: [
      {
        name: "Happiness",
        color: "#FFD54F",
        gradient: ["#FFD54F", "#FFE082"],
        children: [
          { name: "Optimistic", color: "#FFECB3", gradient: ["#FFECB3", "#FFF8E1"] },
          { name: "Cheerful", color: "#FFE082", gradient: ["#FFE082", "#FFF8E1"] },
          { name: "Proud", color: "#FFDB58", gradient: ["#FFDB58", "#FFF8E1"] },
        ],
      },
      {
        name: "Contentment",
        color: "#FFD180",
        gradient: ["#FFD180", "#FFE0B2"],
        children: [
          { name: "Peaceful", color: "#FFE0B2", gradient: ["#FFE0B2", "#FFF3E0"] },
          { name: "Satisfied", color: "#FFCC80", gradient: ["#FFCC80", "#FFF3E0"] },
          { name: "Grateful", color: "#FFD180", gradient: ["#FFD180", "#FFF3E0"] },
        ],
      },
    ],
  },
  {
    name: "Anger",
    color: "#F44336",
    gradient: ["#F44336", "#FFCDD2"],
    children: [
      {
        name: "Rage",
        color: "#EF5350",
        gradient: ["#EF5350", "#E57373"],
        children: [
          { name: "Furious", color: "#E57373", gradient: ["#E57373", "#FFCDD2"] },
          { name: "Irritated", color: "#EF9A9A", gradient: ["#EF9A9A", "#FFCDD2"] },
          { name: "Annoyed", color: "#FFCDD2", gradient: ["#FFCDD2", "#FFEBEE"] },
        ],
      },
      {
        name: "Frustration",
        color: "#FF8A80",
        gradient: ["#FF8A80", "#FFCCBC"],
        children: [
          { name: "Aggravated", color: "#FF8A65", gradient: ["#FF8A65", "#FFCCBC"] },
          { name: "Impatient", color: "#FFAB91", gradient: ["#FFAB91", "#FFCCBC"] },
          { name: "Resentful", color: "#FFCCBC", gradient: ["#FFCCBC", "#FBE9E7"] },
        ],
      },
    ],
  },
  {
    name: "Sadness",
    color: "#2196F3",
    gradient: ["#2196F3", "#BBDEFB"],
    children: [
      {
        name: "Despair",
        color: "#42A5F5",
        gradient: ["#42A5F5", "#90CAF9"],
        children: [
          { name: "Hopeless", color: "#90CAF9", gradient: ["#90CAF9", "#BBDEFB"] },
          { name: "Miserable", color: "#64B5F6", gradient: ["#64B5F6", "#BBDEFB"] },
          { name: "Lonely", color: "#BBDEFB", gradient: ["#BBDEFB", "#E3F2FD"] },
        ],
      },
      {
        name: "Melancholy",
        color: "#4FC3F7",
        gradient: ["#4FC3F7", "#B3E5FC"],
        children: [
          { name: "Nostalgic", color: "#81D4FA", gradient: ["#81D4FA", "#B3E5FC"] },
          { name: "Disappointed", color: "#4FC3F7", gradient: ["#4FC3F7", "#B3E5FC"] },
          { name: "Regretful", color: "#B3E5FC", gradient: ["#B3E5FC", "#E1F5FE"] },
        ],
      },
    ],
  },
  {
    name: "Fear",
    color: "#4CAF50",
    gradient: ["#4CAF50", "#C8E6C9"],
    children: [
      {
        name: "Anxiety",
        color: "#66BB6A",
        gradient: ["#66BB6A", "#A5D6A7"],
        children: [
          { name: "Worried", color: "#A5D6A7", gradient: ["#A5D6A7", "#C8E6C9"] },
          { name: "Nervous", color: "#81C784", gradient: ["#81C784", "#C8E6C9"] },
          { name: "Uneasy", color: "#C8E6C9", gradient: ["#C8E6C9", "#E8F5E9"] },
        ],
      },
      {
        name: "Terror",
        color: "#26A69A",
        gradient: ["#26A69A", "#B2DFDB"],
        children: [
          { name: "Horrified", color: "#4DB6AC", gradient: ["#4DB6AC", "#B2DFDB"] },
          { name: "Scared", color: "#80CBC4", gradient: ["#80CBC4", "#B2DFDB"] },
          { name: "Panicked", color: "#B2DFDB", gradient: ["#B2DFDB", "#E0F2F1"] },
        ],
      },
    ],
  },
];

// Arabic translations (would be replaced with proper translation map in production)
const arabicTranslations: Record<string, string> = {
  "Joy": "الفرح",
  "Anger": "الغضب",
  "Sadness": "الحزن",
  "Fear": "الخوف",
  "Happiness": "السعادة",
  "Contentment": "الرضا",
  "Rage": "الثورة",
  "Frustration": "الإحباط",
  "Despair": "اليأس",
  "Melancholy": "الكآبة",
  "Anxiety": "القلق",
  "Terror": "الرعب",
  "Optimistic": "متفائل",
  "Cheerful": "مبهج",
  "Proud": "فخور",
  "Peaceful": "مسالم",
  "Satisfied": "راضي",
  "Grateful": "ممتن",
  "Furious": "غاضب جدا",
  "Irritated": "منزعج",
  "Annoyed": "مستاء",
  "Aggravated": "متفاقم",
  "Impatient": "غير صبور",
  "Resentful": "حاقد",
  "Hopeless": "يائس",
  "Miserable": "بائس",
  "Lonely": "وحيد",
  "Nostalgic": "حنين",
  "Disappointed": "خائب الأمل",
  "Regretful": "نادم",
  "Worried": "قلق",
  "Nervous": "متوتر",
  "Uneasy": "غير مرتاح",
  "Horrified": "مرعوب",
  "Scared": "خائف",
  "Panicked": "مذعور",
  "Emotion Path:": "مسار المشاعر:",
  "Select an Emotion": "اختر شعورًا",
};

interface EmotionWheelProps {
  language?: string;
  direction?: "ltr" | "rtl";
  onEmotionSelect?: (selection: {
    coreEmotion: string;
    primaryEmotion: string;
    tertiaryEmotion: string;
  }) => void;
}

export default function EmotionWheel({
  language = "en",
  direction = "ltr",
  onEmotionSelect,
}: EmotionWheelProps) {
  const [selectedCore, setSelectedCore] = useState<string | null>(null);
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedTertiary, setSelectedTertiary] = useState<string | null>(null);
  const [hoveredEmotion, setHoveredEmotion] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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

  // Translate text based on selected language
  const translate = (text: string): string => {
    if (language === "ar" && arabicTranslations[text]) {
      return arabicTranslations[text];
    }
    return text;
  };

  // Generate the wheel segments
  const generateWheel = () => {
    const centerX = 200;
    const centerY = 200;
    const coreRadius = 40;
    const emotionsCount = emotionsData.length;
    const anglePerEmotion = (2 * Math.PI) / emotionsCount;

    // Define the gradient IDs
    const defineGradients = () => {
      return (
        <defs>
          {/* Core emotion gradients */}
          {emotionsData.map((emotion, index) => (
            <radialGradient
              key={`gradient-core-${index}`}
              id={`gradient-core-${emotion.name}`}
              cx="0.5"
              cy="0.5"
              r="0.5"
              fx="0.5"
              fy="0.5"
            >
              <stop offset="0%" stopColor={emotion.gradient?.[0] || emotion.color} />
              <stop offset="100%" stopColor={emotion.gradient?.[1] || emotion.color} />
            </radialGradient>
          ))}
          
          {/* Primary emotion gradients */}
          {emotionsData.flatMap((core) => 
            core.children?.map((primary, index) => (
              <radialGradient
                key={`gradient-primary-${core.name}-${index}`}
                id={`gradient-primary-${primary.name}`}
                cx="0.5"
                cy="0.5" 
                r="0.5"
                fx="0.5"
                fy="0.5"
              >
                <stop offset="0%" stopColor={primary.gradient?.[0] || primary.color} />
                <stop offset="100%" stopColor={primary.gradient?.[1] || primary.color} />
              </radialGradient>
            )) || []
          )}
          
          {/* Tertiary emotion gradients */}
          {emotionsData.flatMap((core) => 
            core.children?.flatMap((primary) => 
              primary.children?.map((tertiary, index) => (
                <radialGradient
                  key={`gradient-tertiary-${primary.name}-${index}`}
                  id={`gradient-tertiary-${tertiary.name}`}
                  cx="0.5"
                  cy="0.5"
                  r="0.5"
                  fx="0.5"
                  fy="0.5"
                >
                  <stop offset="0%" stopColor={tertiary.gradient?.[0] || tertiary.color} />
                  <stop offset="100%" stopColor={tertiary.gradient?.[1] || tertiary.color} />
                </radialGradient>
              )) || []
            ) || []
          )}
        </defs>
      );
    };

    return (
      <g>
        {defineGradients()}
        
        {/* Core Emotions (Center) */}
        <g id="core-emotions">
          {emotionsData.map((emotion, index) => {
            const startAngle = index * anglePerEmotion - Math.PI / 2;
            const endAngle = (index + 1) * anglePerEmotion - Math.PI / 2;
            
            const x1 = centerX + coreRadius * Math.cos(startAngle);
            const y1 = centerY + coreRadius * Math.sin(startAngle);
            const x2 = centerX + coreRadius * Math.cos(endAngle);
            const y2 = centerY + coreRadius * Math.sin(endAngle);
            
            const midAngle = (startAngle + endAngle) / 2;
            const labelX = centerX + (coreRadius + 35) * Math.cos(midAngle);
            const labelY = centerY + (coreRadius + 35) * Math.sin(midAngle);
            
            const pathData = [
              `M ${centerX},${centerY}`,
              `L ${x1},${y1}`,
              `A ${coreRadius},${coreRadius} 0 0,1 ${x2},${y2}`,
              "Z",
            ].join(" ");

            return (
              <g key={`core-${index}`}>
                <path
                  d={pathData}
                  className={cn(
                    "slice cursor-pointer transition-all duration-300 ease-in-out",
                    selectedCore === emotion.name 
                      ? "stroke-white stroke-2 shadow-lg" 
                      : "hover:opacity-90 stroke-white stroke-1",
                    selectedCore && selectedCore !== emotion.name ? "opacity-50" : ""
                  )}
                  fill={`url(#gradient-core-${emotion.name})`}
                  onClick={() => handleCoreSelect(emotion.name)}
                  onMouseEnter={() => setHoveredEmotion(emotion.name)}
                  onMouseLeave={() => setHoveredEmotion(null)}
                  filter={selectedCore === emotion.name ? "url(#shadow)" : ""}
                />
                
                {/* Only show label for core emotions if no core is selected or this is the selected core */}
                {(!selectedCore || selectedCore === emotion.name) && (
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    className="text-xs font-semibold select-none pointer-events-none"
                    fill="#424242"
                  >
                    {translate(emotion.name)}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Primary Emotions (Middle Ring) */}
        {selectedCore && (
          <g id="primary-emotions">
            {emotionsData
              .find((e) => e.name === selectedCore)
              ?.children?.map((primary, pIndex) => {
                const coreIndex = emotionsData.findIndex((e) => e.name === selectedCore);
                const totalPrimaries = emotionsData.find((e) => e.name === selectedCore)?.children?.length || 0;
                
                const coreStartAngle = coreIndex * anglePerEmotion - Math.PI / 2;
                const coreEndAngle = (coreIndex + 1) * anglePerEmotion - Math.PI / 2;
                const anglePerPrimary = (coreEndAngle - coreStartAngle) / totalPrimaries;
                
                const startAngle = coreStartAngle + pIndex * anglePerPrimary;
                const endAngle = startAngle + anglePerPrimary;
                
                const middleRadius = 85;
                
                const x1 = centerX + coreRadius * Math.cos(startAngle);
                const y1 = centerY + coreRadius * Math.sin(startAngle);
                const x2 = centerX + middleRadius * Math.cos(startAngle);
                const y2 = centerY + middleRadius * Math.sin(startAngle);
                const x3 = centerX + middleRadius * Math.cos(endAngle);
                const y3 = centerY + middleRadius * Math.sin(endAngle);
                const x4 = centerX + coreRadius * Math.cos(endAngle);
                const y4 = centerY + coreRadius * Math.sin(endAngle);
                
                const midAngle = (startAngle + endAngle) / 2;
                const labelX = centerX + (coreRadius + middleRadius) / 2 * Math.cos(midAngle);
                const labelY = centerY + (coreRadius + middleRadius) / 2 * Math.sin(midAngle);
                
                const pathData = [
                  `M ${x1},${y1}`,
                  `L ${x2},${y2}`,
                  `A ${middleRadius},${middleRadius} 0 0,1 ${x3},${y3}`,
                  `L ${x4},${y4}`,
                  `A ${coreRadius},${coreRadius} 0 0,0 ${x1},${y1}`,
                  "Z",
                ].join(" ");

                return (
                  <g key={`primary-${pIndex}`}>
                    <path
                      d={pathData}
                      className={cn(
                        "slice cursor-pointer transition-all duration-300 ease-in-out",
                        selectedPrimary === primary.name 
                          ? "stroke-white stroke-2 shadow-lg" 
                          : "hover:opacity-90 hover:scale-[1.02] stroke-white stroke-1",
                        selectedPrimary && selectedPrimary !== primary.name ? "opacity-40" : ""
                      )}
                      fill={`url(#gradient-primary-${primary.name})`}
                      onClick={() => handlePrimarySelect(primary.name)}
                      onMouseEnter={() => setHoveredEmotion(primary.name)}
                      onMouseLeave={() => setHoveredEmotion(null)}
                      filter={selectedPrimary === primary.name ? "url(#shadow)" : ""}
                    />
                    
                    {/* Only show label if no primary is selected or this is the selected primary */}
                    {(!selectedPrimary || selectedPrimary === primary.name) && (
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        className="text-xs font-medium select-none pointer-events-none"
                        fill="#424242"
                      >
                        {translate(primary.name)}
                      </text>
                    )}
                  </g>
                );
              })}
          </g>
        )}

        {/* Tertiary Emotions (Outer Ring) */}
        {selectedCore && selectedPrimary && (
          <g id="tertiary-emotions">
            {emotionsData
              .find((e) => e.name === selectedCore)
              ?.children?.find((p) => p.name === selectedPrimary)
              ?.children?.map((tertiary, tIndex) => {
                const coreIndex = emotionsData.findIndex((e) => e.name === selectedCore);
                const primaryData = emotionsData.find((e) => e.name === selectedCore)?.children;
                const primaryIndex = primaryData?.findIndex((p) => p.name === selectedPrimary) || 0;
                const totalPrimaries = primaryData?.length || 1;
                const totalTertiaries = primaryData?.[primaryIndex]?.children?.length || 1;
                
                const coreStartAngle = coreIndex * anglePerEmotion - Math.PI / 2;
                const coreEndAngle = (coreIndex + 1) * anglePerEmotion - Math.PI / 2;
                const anglePerPrimary = (coreEndAngle - coreStartAngle) / totalPrimaries;
                
                const primaryStartAngle = coreStartAngle + primaryIndex * anglePerPrimary;
                const primaryEndAngle = primaryStartAngle + anglePerPrimary;
                const anglePerTertiary = (primaryEndAngle - primaryStartAngle) / totalTertiaries;
                
                const startAngle = primaryStartAngle + tIndex * anglePerTertiary;
                const endAngle = startAngle + anglePerTertiary;
                
                const middleRadius = 85;
                const outerRadius = 130;
                
                const x1 = centerX + middleRadius * Math.cos(startAngle);
                const y1 = centerY + middleRadius * Math.sin(startAngle);
                const x2 = centerX + outerRadius * Math.cos(startAngle);
                const y2 = centerY + outerRadius * Math.sin(startAngle);
                const x3 = centerX + outerRadius * Math.cos(endAngle);
                const y3 = centerY + outerRadius * Math.sin(endAngle);
                const x4 = centerX + middleRadius * Math.cos(endAngle);
                const y4 = centerY + middleRadius * Math.sin(endAngle);
                
                const midAngle = (startAngle + endAngle) / 2;
                const labelX = centerX + (middleRadius + outerRadius) / 2 * Math.cos(midAngle);
                const labelY = centerY + (middleRadius + outerRadius) / 2 * Math.sin(midAngle);
                
                const pathData = [
                  `M ${x1},${y1}`,
                  `L ${x2},${y2}`,
                  `A ${outerRadius},${outerRadius} 0 0,1 ${x3},${y3}`,
                  `L ${x4},${y4}`,
                  `A ${middleRadius},${middleRadius} 0 0,0 ${x1},${y1}`,
                  "Z",
                ].join(" ");

                return (
                  <g key={`tertiary-${tIndex}`}>
                    <path
                      d={pathData}
                      className={cn(
                        "slice cursor-pointer transition-all duration-300 ease-in-out",
                        selectedTertiary === tertiary.name 
                          ? "stroke-white stroke-2 shadow-lg" 
                          : "hover:opacity-90 hover:scale-[1.02] stroke-white stroke-1",
                        selectedTertiary && selectedTertiary !== tertiary.name ? "opacity-40" : ""
                      )}
                      fill={`url(#gradient-tertiary-${tertiary.name})`}
                      onClick={() => handleTertiarySelect(tertiary.name)}
                      onMouseEnter={() => setHoveredEmotion(tertiary.name)}
                      onMouseLeave={() => setHoveredEmotion(null)}
                      filter={selectedTertiary === tertiary.name ? "url(#shadow)" : ""}
                    />
                    
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      className="text-xs font-medium select-none pointer-events-none"
                      fill="#424242"
                    >
                      {translate(tertiary.name)}
                    </text>
                  </g>
                );
              })}
          </g>
        )}

        {/* Center Circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={30}
          fill="#FFFFFF"
          stroke="#E0E0E0"
          strokeWidth={1}
          onClick={resetSelections}
          className="cursor-pointer"
        />
        <text
          x={centerX}
          y={centerY + 5}
          fontSize="12"
          textAnchor="middle"
          fill="#424242"
          className="select-none pointer-events-none"
        >
          {hoveredEmotion ? translate(hoveredEmotion) : translate("Select an Emotion")}
        </text>
      </g>
    );
  };

  // Handle selection of core emotion
  const handleCoreSelect = (emotionName: string) => {
    setSelectedCore(emotionName);
    setSelectedPrimary(null);
    setSelectedTertiary(null);
  };

  // Handle selection of primary emotion
  const handlePrimarySelect = (emotionName: string) => {
    setSelectedPrimary(emotionName);
    setSelectedTertiary(null);
  };

  // Handle selection of tertiary emotion
  const handleTertiarySelect = (emotionName: string) => {
    setSelectedTertiary(emotionName);
    
    if (selectedCore && selectedPrimary && onEmotionSelect) {
      onEmotionSelect({
        coreEmotion: selectedCore,
        primaryEmotion: selectedPrimary,
        tertiaryEmotion: emotionName,
      });
    }
  };

  // Reset all selections
  const resetSelections = () => {
    setSelectedCore(null);
    setSelectedPrimary(null);
    setSelectedTertiary(null);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Breadcrumb Trail */}
      <div id="emotion-breadcrumb" className="breadcrumb-container bg-neutral-100 p-3 rounded-md mb-4 flex items-center">
        <span className="breadcrumb-label text-sm text-neutral-600 mr-2">
          {translate("Emotion Path:")}
        </span>
        <div className={`breadcrumb-trail flex ${direction === "rtl" ? "flex-row-reverse" : ""}`}>
          <span
            id="core-breadcrumb"
            className={cn(
              "breadcrumb-item bg-white text-sm py-1 px-2 border border-neutral-300 rounded relative",
              direction === "rtl" ? "ml-3" : "mr-3",
              !selectedCore ? "hidden" : ""
            )}
          >
            {selectedCore && translate(selectedCore)}
          </span>
          <span
            id="primary-breadcrumb"
            className={cn(
              "breadcrumb-item bg-white text-sm py-1 px-2 border border-neutral-300 rounded relative",
              direction === "rtl" ? "ml-3" : "mr-3",
              !selectedPrimary ? "hidden" : ""
            )}
          >
            {selectedPrimary && translate(selectedPrimary)}
          </span>
          <span
            id="tertiary-breadcrumb"
            className={cn(
              "breadcrumb-item bg-white text-sm py-1 px-2 border border-neutral-300 rounded",
              !selectedTertiary ? "hidden" : ""
            )}
          >
            {selectedTertiary && translate(selectedTertiary)}
          </span>
        </div>
      </div>

      {/* The SVG wheel */}
      <div
        id="emotional-wheel"
        className="wheel-container w-full aspect-square relative bg-gradient-to-b from-neutral-50 to-neutral-100 rounded-full shadow-md transition-transform duration-300 hover:scale-[1.02]"
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="0 0 400 400"
          className={cn("emotion-wheel", direction === "rtl" ? "rtl" : "")}
        >
          {generateWheel()}
        </svg>
      </div>

      {/* Hidden inputs for state */}
      <input type="hidden" id="selectedCore" name="selectedCore" value={selectedCore || ""} />
      <input type="hidden" id="selectedPrimary" name="selectedPrimary" value={selectedPrimary || ""} />
      <input type="hidden" id="selectedTertiary" name="selectedTertiary" value={selectedTertiary || ""} />
    </div>
  );
}
