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
        name: "Gratitude",
        color: "#FFCA28",
        gradient: ["#FFCA28", "#FFE082"],
        children: [
          { name: "Thankful", color: "#FFE082", gradient: ["#FFE082", "#FFF8E1"] },
          { name: "Appreciative", color: "#FFD54F", gradient: ["#FFD54F", "#FFF8E1"] },
        ],
      },
      {
        name: "Serenity",
        color: "#FFB300",
        gradient: ["#FFB300", "#FFD54F"],
        children: [
          { name: "Peaceful", color: "#FFECB3", gradient: ["#FFECB3", "#FFF8E1"] },
          { name: "Calm", color: "#FFE082", gradient: ["#FFE082", "#FFF8E1"] },
          { name: "Content", color: "#FFD54F", gradient: ["#FFD54F", "#FFF8E1"] },
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
        color: "#1E88E5",
        gradient: ["#1E88E5", "#90CAF9"],
        children: [
          { name: "Hopeless", color: "#BBDEFB", gradient: ["#BBDEFB", "#E3F2FD"] },
          { name: "Powerless", color: "#90CAF9", gradient: ["#90CAF9", "#E3F2FD"] },
        ],
      },
      {
        name: "Grief",
        color: "#1976D2",
        gradient: ["#1976D2", "#64B5F6"],
        children: [
          { name: "Loss", color: "#BBDEFB", gradient: ["#BBDEFB", "#E3F2FD"] },
          { name: "Heartbroken", color: "#90CAF9", gradient: ["#90CAF9", "#E3F2FD"] },
        ],
      },
      {
        name: "Loneliness",
        color: "#1565C0",
        gradient: ["#1565C0", "#42A5F5"],
        children: [
          { name: "Abandoned", color: "#BBDEFB", gradient: ["#BBDEFB", "#E3F2FD"] },
          { name: "Isolated", color: "#90CAF9", gradient: ["#90CAF9", "#E3F2FD"] },
        ],
      },
    ],
  },
  {
    name: "Fear",
    color: "#673AB7",
    gradient: ["#673AB7", "#D1C4E9"],
    children: [
      {
        name: "Terror",
        color: "#5E35B1",
        gradient: ["#5E35B1", "#B39DDB"],
        children: [
          { name: "Panicked", color: "#D1C4E9", gradient: ["#D1C4E9", "#EDE7F6"] },
          { name: "Petrified", color: "#B39DDB", gradient: ["#B39DDB", "#EDE7F6"] },
        ],
      },
      {
        name: "Anxiety",
        color: "#512DA8",
        gradient: ["#512DA8", "#9575CD"],
        children: [
          { name: "Worried", color: "#D1C4E9", gradient: ["#D1C4E9", "#EDE7F6"] },
          { name: "Nervous", color: "#B39DDB", gradient: ["#B39DDB", "#EDE7F6"] },
          { name: "Restless", color: "#9575CD", gradient: ["#9575CD", "#EDE7F6"] },
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
        color: "#E53935",
        gradient: ["#E53935", "#EF9A9A"],
        children: [
          { name: "Furious", color: "#FFCDD2", gradient: ["#FFCDD2", "#FFEBEE"] },
          { name: "Violent", color: "#EF9A9A", gradient: ["#EF9A9A", "#FFEBEE"] },
        ],
      },
      {
        name: "Frustration",
        color: "#D32F2F",
        gradient: ["#D32F2F", "#E57373"],
        children: [
          { name: "Annoyed", color: "#FFCDD2", gradient: ["#FFCDD2", "#FFEBEE"] },
          { name: "Impatient", color: "#EF9A9A", gradient: ["#EF9A9A", "#FFEBEE"] },
        ],
      },
      {
        name: "Resentment",
        color: "#C62828",
        gradient: ["#C62828", "#EF5350"],
        children: [
          { name: "Bitter", color: "#FFCDD2", gradient: ["#FFCDD2", "#FFEBEE"] },
          { name: "Envious", color: "#EF9A9A", gradient: ["#EF9A9A", "#FFEBEE"] },
        ],
      },
    ],
  },
  {
    name: "Disgust",
    color: "#4CAF50",
    gradient: ["#4CAF50", "#C8E6C9"],
    children: [
      {
        name: "Revulsion",
        color: "#43A047",
        gradient: ["#43A047", "#A5D6A7"],
        children: [
          { name: "Repulsed", color: "#C8E6C9", gradient: ["#C8E6C9", "#E8F5E9"] },
        ],
      },
      {
        name: "Contempt",
        color: "#388E3C",
        gradient: ["#388E3C", "#81C784"],
        children: [
          { name: "Disdain", color: "#C8E6C9", gradient: ["#C8E6C9", "#E8F5E9"] },
          { name: "Scornful", color: "#A5D6A7", gradient: ["#A5D6A7", "#E8F5E9"] },
        ],
      },
    ],
  },
  {
    name: "Surprise",
    color: "#FF9800",
    gradient: ["#FF9800", "#FFE0B2"],
    children: [
      {
        name: "Amazement",
        color: "#FB8C00",
        gradient: ["#FB8C00", "#FFCC80"],
        children: [
          { name: "Astonished", color: "#FFE0B2", gradient: ["#FFE0B2", "#FFF3E0"] },
          { name: "Awe", color: "#FFCC80", gradient: ["#FFCC80", "#FFF3E0"] },
        ],
      },
      {
        name: "Confusion",
        color: "#F57C00",
        gradient: ["#F57C00", "#FFB74D"],
        children: [
          { name: "Bewildered", color: "#FFE0B2", gradient: ["#FFE0B2", "#FFF3E0"] },
          { name: "Perplexed", color: "#FFCC80", gradient: ["#FFCC80", "#FFF3E0"] },
        ],
      },
    ],
  },
];

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

  // Arabic translations (would be replaced with proper translation map in production)
  const arabicTranslations: Record<string, string> = {
    "Joy": "الفرح",
    "Anger": "الغضب",
    "Sadness": "الحزن",
    "Fear": "الخوف",
    "Happiness": "السعادة",
    "Gratitude": "الامتنان",
    "Serenity": "الصفاء",
    "Rage": "الثورة",
    "Frustration": "الإحباط",
    "Despair": "اليأس",
    "Grief": "الحزن العميق",
    "Loneliness": "الوحدة",
    "Anxiety": "القلق",
    "Terror": "الرعب",
    "Optimistic": "متفائل",
    "Cheerful": "مبهج",
    "Proud": "فخور",
    "Peaceful": "مسالم",
    "Calm": "هادئ",
    "Content": "مكتفي",
    "Thankful": "شاكر",
    "Appreciative": "مقدر",
    "Furious": "غاضب جدا",
    "Irritated": "منزعج",
    "Annoyed": "مستاء",
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
    "Select an": "اختر",
    "Emotion": "شعورًا",
    "Click on the wheel to select your emotion": "انقر على العجلة لاختيار شعورك",
    "You selected": "لقد اخترت",
    "Select an emotion from the wheel below": "اختر شعورًا من العجلة أدناه"
  };

  // Translation function
  const translate = (text: string): string => {
    if (language === "ar" && arabicTranslations[text]) {
      return arabicTranslations[text];
    }
    return text;
  };

  // Generate the wheel segments
  const generateWheel = () => {
    // Core geometry constants
    const centerX = 200;
    const centerY = 200;
    const coreRadius = 70; // Much larger core circle
    
    // Define all radii here for consistency
    const middleRadiusStart = coreRadius; // Where middle ring starts
    const middleRadiusEnd = 130; // Where middle ring ends
    const outerRadiusStart = middleRadiusEnd; // Where outer ring starts
    const outerRadiusEnd = 180; // Where outer ring ends
    
    const emotionsCount = emotionsData.length;
    const anglePerEmotion = (2 * Math.PI) / emotionsCount;

    // Define the gradient IDs and filters
    const defineGradients = () => {
      return (
        <defs>
          {/* Filters for drop shadows */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#000000" floodOpacity="0.2" />
          </filter>
          <filter id="centerShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.3" />
          </filter>
          
          {/* Center gradient */}
          <radialGradient id="centerGradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#4F46E5" />
          </radialGradient>
          
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
            const labelX = centerX + (coreRadius / 2) * Math.cos(midAngle);
            const labelY = centerY + (coreRadius / 2) * Math.sin(midAngle);
            
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
                    selectedCore && selectedCore !== emotion.name ? "opacity-80" : ""
                  )}
                  fill={`url(#gradient-core-${emotion.name})`}
                  onClick={() => handleCoreSelect(emotion.name)}
                  onMouseEnter={() => setHoveredEmotion(emotion.name)}
                  onMouseLeave={() => setHoveredEmotion(null)}
                  filter={selectedCore === emotion.name ? "url(#shadow)" : ""}
                />
                
                {/* Background rectangle for core emotion text */}
                <rect
                  x={labelX - 30}
                  y={labelY - 9}
                  width={60}
                  height={18}
                  rx={9}
                  fill="rgba(255,255,255,0.2)"
                  className="select-none pointer-events-none"
                />
                {/* Core emotion text - horizontal for better readability */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#FFFFFF"
                  className="select-none pointer-events-none font-bold"
                  style={{
                    fontSize: '14px',
                    textShadow: "0px 1px 2px rgba(0,0,0,0.7)",
                    letterSpacing: '0.5px'
                  }}
                >
                  {translate(emotion.name)}
                </text>
              </g>
            );
          })}
        </g>

        {/* Primary Emotions (Middle Ring) - Always show all primary emotions */}
        <g id="primary-emotions">
          {emotionsData.flatMap((coreEmotion, coreIndex) => {
            const coreStartAngle = coreIndex * anglePerEmotion - Math.PI / 2;
            const coreEndAngle = (coreIndex + 1) * anglePerEmotion - Math.PI / 2;
            const totalPrimaries = coreEmotion.children?.length || 0;
            
            return coreEmotion.children?.map((primary, pIndex) => {
              const anglePerPrimary = (coreEndAngle - coreStartAngle) / totalPrimaries;
              const startAngle = coreStartAngle + pIndex * anglePerPrimary;
              const endAngle = startAngle + anglePerPrimary;
              
              // Use global radius variables for consistency
              const x1 = centerX + middleRadiusStart * Math.cos(startAngle);
              const y1 = centerY + middleRadiusStart * Math.sin(startAngle);
              const x2 = centerX + middleRadiusEnd * Math.cos(startAngle);
              const y2 = centerY + middleRadiusEnd * Math.sin(startAngle);
              const x3 = centerX + middleRadiusEnd * Math.cos(endAngle);
              const y3 = centerY + middleRadiusEnd * Math.sin(endAngle);
              const x4 = centerX + middleRadiusStart * Math.cos(endAngle);
              const y4 = centerY + middleRadiusStart * Math.sin(endAngle);
              
              const midAngle = (startAngle + endAngle) / 2;
              // Use the average position between the inner and outer radii for the label
              const labelRadius = (middleRadiusStart + middleRadiusEnd) / 2;
              const labelX = centerX + labelRadius * Math.cos(midAngle);
              const labelY = centerY + labelRadius * Math.sin(midAngle);
              
              const pathData = [
                `M ${x1},${y1}`,
                `L ${x2},${y2}`,
                `A ${middleRadiusEnd},${middleRadiusEnd} 0 0,1 ${x3},${y3}`,
                `L ${x4},${y4}`,
                `A ${middleRadiusStart},${middleRadiusStart} 0 0,0 ${x1},${y1}`,
                "Z",
              ].join(" ");

              const isCurrentCore = selectedCore === coreEmotion.name;
              const isSelected = isCurrentCore && selectedPrimary === primary.name;
              const isSiblingOfSelected = isCurrentCore && selectedPrimary && selectedPrimary !== primary.name;

              return (
                <g key={`primary-${coreEmotion.name}-${pIndex}`}>
                  <path
                    d={pathData}
                    className={cn(
                      "slice cursor-pointer transition-all duration-300 ease-in-out",
                      isSelected 
                        ? "stroke-white stroke-2 shadow-lg" 
                        : "hover:opacity-90 hover:scale-[1.02] stroke-white stroke-1",
                      isSiblingOfSelected ? "opacity-60" : "",
                      !isCurrentCore ? "opacity-80" : ""
                    )}
                    fill={`url(#gradient-primary-${primary.name})`}
                    onClick={() => {
                      if (selectedCore !== coreEmotion.name) {
                        handleCoreSelect(coreEmotion.name);
                      }
                      handlePrimarySelect(primary.name);
                    }}
                    onMouseEnter={() => setHoveredEmotion(primary.name)}
                    onMouseLeave={() => setHoveredEmotion(null)}
                    filter={isSelected ? "url(#shadow)" : ""}
                  />
                  
                  {/* Background rectangle for middle ring text */}
                  <rect
                    x={labelX - 25}
                    y={labelY - 7}
                    width={50}
                    height={14}
                    rx={7}
                    fill="rgba(255,255,255,0.8)"
                    className="select-none pointer-events-none"
                  />
                  {/* Horizontal text for better readability */}
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#000000"
                    style={{
                      fontSize: '10px',
                      fontWeight: '600',
                    }}
                    className="select-none pointer-events-none"
                  >
                    {translate(primary.name)}
                  </text>
                </g>
              );
            }) || [];
          })}
        </g>

        {/* Tertiary Emotions (Outer Ring) - Always show all tertiary emotions */}
        <g id="tertiary-emotions">
          {emotionsData.flatMap((coreEmotion, coreIndex) => {
            const coreStartAngle = coreIndex * anglePerEmotion - Math.PI / 2;
            const coreEndAngle = (coreIndex + 1) * anglePerEmotion - Math.PI / 2;
            
            return (coreEmotion.children || []).flatMap((primaryEmotion, primaryIndex) => {
              const totalPrimaries = coreEmotion.children?.length || 1;
              const anglePerPrimary = (coreEndAngle - coreStartAngle) / totalPrimaries;
              const primaryStartAngle = coreStartAngle + primaryIndex * anglePerPrimary;
              const primaryEndAngle = primaryStartAngle + anglePerPrimary;
              
              const totalTertiaries = primaryEmotion.children?.length || 1;
              
              return (primaryEmotion.children || []).map((tertiary, tIndex) => {
                const anglePerTertiary = (primaryEndAngle - primaryStartAngle) / totalTertiaries;
                const startAngle = primaryStartAngle + tIndex * anglePerTertiary;
                const endAngle = startAngle + anglePerTertiary;
                
                // Use global radius variables for outer ring
                const x1 = centerX + outerRadiusStart * Math.cos(startAngle);
                const y1 = centerY + outerRadiusStart * Math.sin(startAngle);
                const x2 = centerX + outerRadiusEnd * Math.cos(startAngle);
                const y2 = centerY + outerRadiusEnd * Math.sin(startAngle);
                const x3 = centerX + outerRadiusEnd * Math.cos(endAngle);
                const y3 = centerY + outerRadiusEnd * Math.sin(endAngle);
                const x4 = centerX + outerRadiusStart * Math.cos(endAngle);
                const y4 = centerY + outerRadiusStart * Math.sin(endAngle);
                
                const midAngle = (startAngle + endAngle) / 2;
                // Label position for tertiary emotions
                const labelRadius = (outerRadiusStart + outerRadiusEnd) / 2;
                const labelX = centerX + labelRadius * Math.cos(midAngle);
                const labelY = centerY + labelRadius * Math.sin(midAngle);
                
                const pathData = [
                  `M ${x1},${y1}`,
                  `L ${x2},${y2}`,
                  `A ${outerRadiusEnd},${outerRadiusEnd} 0 0,1 ${x3},${y3}`,
                  `L ${x4},${y4}`,
                  `A ${outerRadiusStart},${outerRadiusStart} 0 0,0 ${x1},${y1}`,
                  "Z",
                ].join(" ");

                const isCurrentCore = selectedCore === coreEmotion.name;
                const isCurrentPrimary = isCurrentCore && selectedPrimary === primaryEmotion.name;
                const isSelected = isCurrentPrimary && selectedTertiary === tertiary.name;
                
                // Determine the level of opacity based on selection state
                let opacity = 1;
                if (!isCurrentCore) opacity = 0.7;
                else if (!isCurrentPrimary) opacity = 0.8;
                else if (selectedTertiary && selectedTertiary !== tertiary.name) opacity = 0.6;

                return (
                  <g key={`tertiary-${coreEmotion.name}-${primaryEmotion.name}-${tIndex}`}>
                    <path
                      d={pathData}
                      className={cn(
                        "slice cursor-pointer transition-all duration-300 ease-in-out",
                        isSelected 
                          ? "stroke-white stroke-2 shadow-lg" 
                          : "hover:opacity-100 hover:scale-[1.02] stroke-white stroke-1",
                      )}
                      style={{ opacity }}
                      fill={`url(#gradient-tertiary-${tertiary.name})`}
                      onClick={() => {
                        if (selectedCore !== coreEmotion.name) {
                          handleCoreSelect(coreEmotion.name);
                        }
                        if (selectedPrimary !== primaryEmotion.name) {
                          handlePrimarySelect(primaryEmotion.name);
                        }
                        handleTertiarySelect(tertiary.name);
                      }}
                      onMouseEnter={() => setHoveredEmotion(tertiary.name)}
                      onMouseLeave={() => setHoveredEmotion(null)}
                      filter={isSelected ? "url(#shadow)" : ""}
                    />
                    
                    {/* Tertiary labels only show on hover or when selected to avoid clutter */}
                    {(hoveredEmotion === tertiary.name || isSelected) && (
                      <>
                        {/* Background rectangle for text */}
                        <rect
                          x={labelX - 20}
                          y={labelY - 6}
                          width={40}
                          height={12}
                          rx={6}
                          fill="rgba(255,255,255,0.8)"
                          className="select-none pointer-events-none"
                        />
                        {/* Horizontal text for outer ring */}
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={isSelected ? "#000000" : "#333333"}
                          style={{
                            fontSize: '8px',
                            fontWeight: '600',
                          }}
                          className="select-none pointer-events-none"
                        >
                          {translate(tertiary.name)}
                        </text>
                      </>
                    )}
                  </g>
                );
              });
            });
          })}
        </g>

        {/* Center Circle with enhanced styling */}
        <circle
          cx={centerX}
          cy={centerY}
          r={30}
          fill="url(#centerGradient)"
          stroke="#FFFFFF"
          strokeWidth={2}
          onClick={resetSelections}
          className="cursor-pointer transition-all duration-300 hover:opacity-90"
          filter="url(#centerShadow)"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={28}
          fill="transparent"
          stroke="#FFFFFF"
          strokeWidth={1}
          strokeOpacity={0.4}
          strokeDasharray="2,2"
          className="pointer-events-none"
        />
        <text
          x={centerX}
          y={centerY}
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
          fill="#FFFFFF"
          className="select-none pointer-events-none"
        >
          {hoveredEmotion ? translate(hoveredEmotion) : translate("Select an")}
        </text>
        <text
          x={centerX}
          y={centerY + 14}
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
          fill="#FFFFFF"
          className="select-none pointer-events-none"
        >
          {!hoveredEmotion && "Emotion"}
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
      {/* Enhanced Breadcrumb Trail */}
      <div id="emotion-breadcrumb" className="breadcrumb-container bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-5 shadow-sm flex items-center">
        <span className="breadcrumb-label text-sm font-medium text-indigo-600 mr-3">
          {translate("Emotion Path:")}
        </span>
        <div className={`breadcrumb-trail flex flex-wrap ${direction === "rtl" ? "flex-row-reverse" : ""}`}>
          {selectedCore && (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              id="core-breadcrumb"
              className={cn(
                "breadcrumb-item flex items-center bg-white text-sm py-1.5 px-3 border border-indigo-200 rounded-md shadow-sm relative",
                direction === "rtl" ? "ml-6" : "mr-6"
              )}
              style={{ 
                backgroundColor: emotionsData.find(e => e.name === selectedCore)?.gradient?.[1] || "white",
              }}
            >
              <span className="font-medium text-gray-700">{translate(selectedCore)}</span>
              {!selectedPrimary && (
                <button 
                  className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none" 
                  onClick={() => resetSelections()}
                >
                  ✕
                </button>
              )}
              {(direction !== "rtl" && selectedPrimary) && (
                <span className="absolute -right-4 top-1/2 transform -translate-y-1/2 text-gray-400">→</span>
              )}
              {(direction === "rtl" && selectedPrimary) && (
                <span className="absolute -left-4 top-1/2 transform -translate-y-1/2 text-gray-400">←</span>
              )}
            </motion.span>
          )}
          
          {selectedPrimary && (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              id="primary-breadcrumb"
              className={cn(
                "breadcrumb-item flex items-center bg-white text-sm py-1.5 px-3 border border-indigo-200 rounded-md shadow-sm relative",
                direction === "rtl" ? "ml-6" : "mr-6"
              )}
              style={{ 
                backgroundColor: emotionsData
                  .find(e => e.name === selectedCore)
                  ?.children?.find(p => p.name === selectedPrimary)?.gradient?.[1] || "white",
              }}
            >
              <span className="font-medium text-gray-700">{translate(selectedPrimary)}</span>
              {!selectedTertiary && (
                <button 
                  className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none" 
                  onClick={() => setSelectedPrimary(null)}
                >
                  ✕
                </button>
              )}
              {(direction !== "rtl" && selectedTertiary) && (
                <span className="absolute -right-4 top-1/2 transform -translate-y-1/2 text-gray-400">→</span>
              )}
              {(direction === "rtl" && selectedTertiary) && (
                <span className="absolute -left-4 top-1/2 transform -translate-y-1/2 text-gray-400">←</span>
              )}
            </motion.span>
          )}
          
          {selectedTertiary && (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              id="tertiary-breadcrumb"
              className="breadcrumb-item flex items-center bg-white text-sm py-1.5 px-3 border border-indigo-200 rounded-md shadow-sm"
              style={{ 
                backgroundColor: emotionsData
                  .find(e => e.name === selectedCore)
                  ?.children?.find(p => p.name === selectedPrimary)
                  ?.children?.find(t => t.name === selectedTertiary)?.gradient?.[1] || "white",
              }}
            >
              <span className="font-medium text-gray-700">{translate(selectedTertiary)}</span>
              <button 
                className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none" 
                onClick={() => setSelectedTertiary(null)}
              >
                ✕
              </button>
            </motion.span>
          )}
          
          {!selectedCore && (
            <span className="text-sm text-gray-500 italic">
              {translate("Select an emotion from the wheel below")}
            </span>
          )}
        </div>
      </div>

      {/* The SVG wheel with enhanced styling */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        id="emotional-wheel"
        className="wheel-container w-full aspect-square relative rounded-full p-4"
        style={{ 
          background: "linear-gradient(135deg, #f5f7ff 0%, #e0e7ff 100%)",
          boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.1), 0 8px 10px -6px rgba(99, 102, 241, 0.05)"
        }}
      >
        <div className="absolute inset-0 rounded-full bg-white/50 backdrop-blur-sm" 
          style={{ boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)" }}></div>
        
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="0 0 400 400"
          className={cn("emotion-wheel relative z-10", direction === "rtl" ? "rtl" : "")}
        >
          {generateWheel()}
        </svg>
        
        {/* Add subtle rotating highlight effect */}
        <div className="absolute inset-4 rounded-full opacity-30 pointer-events-none"
          style={{ 
            background: "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0) 100%)",
            animation: "rotate 10s linear infinite"
          }}
        ></div>
        
        {/* The CSS for rotation animation is added in the main stylesheet */}
      </motion.div>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        {selectedTertiary ? (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-2 px-4 bg-indigo-50 inline-block rounded-full"
          >
            {translate("You selected")}: <span className="font-semibold text-indigo-700">{translate(selectedTertiary)}</span>
          </motion.p>
        ) : (
          <p>{translate("Click on the wheel to select your emotion")}</p>
        )}
      </div>

      {/* Hidden inputs for state */}
      <input type="hidden" id="selectedCore" name="selectedCore" value={selectedCore || ""} />
      <input type="hidden" id="selectedPrimary" name="selectedPrimary" value={selectedPrimary || ""} />
      <input type="hidden" id="selectedTertiary" name="selectedTertiary" value={selectedTertiary || ""} />
    </div>
  );
}