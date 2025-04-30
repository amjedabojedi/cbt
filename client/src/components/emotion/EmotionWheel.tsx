import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

// Define the emotion structure
interface EmotionData {
  name: string;
  color: string;
  children?: EmotionData[];
}

// Core emotions data
const emotionsData: EmotionData[] = [
  {
    name: "Joy",
    color: "#FBBC05",
    children: [
      {
        name: "Happiness",
        color: "#F9CB9C",
        children: [
          { name: "Optimistic", color: "#FFF2CC" },
          { name: "Cheerful", color: "#FFF2CC" },
          { name: "Proud", color: "#FFF2CC" },
        ],
      },
      {
        name: "Contentment",
        color: "#F9CB9C",
        children: [
          { name: "Peaceful", color: "#FFF2CC" },
          { name: "Satisfied", color: "#FFF2CC" },
          { name: "Grateful", color: "#FFF2CC" },
        ],
      },
    ],
  },
  {
    name: "Anger",
    color: "#EA4335",
    children: [
      {
        name: "Rage",
        color: "#F28B82",
        children: [
          { name: "Furious", color: "#FADBD8" },
          { name: "Irritated", color: "#FADBD8" },
          { name: "Annoyed", color: "#FADBD8" },
        ],
      },
      {
        name: "Frustration",
        color: "#F28B82",
        children: [
          { name: "Aggravated", color: "#FADBD8" },
          { name: "Impatient", color: "#FADBD8" },
          { name: "Resentful", color: "#FADBD8" },
        ],
      },
    ],
  },
  {
    name: "Sadness",
    color: "#4285F4",
    children: [
      {
        name: "Despair",
        color: "#A4C2F4",
        children: [
          { name: "Hopeless", color: "#D2E3FC" },
          { name: "Miserable", color: "#D2E3FC" },
          { name: "Lonely", color: "#D2E3FC" },
        ],
      },
      {
        name: "Melancholy",
        color: "#A4C2F4",
        children: [
          { name: "Nostalgic", color: "#D2E3FC" },
          { name: "Disappointed", color: "#D2E3FC" },
          { name: "Regretful", color: "#D2E3FC" },
        ],
      },
    ],
  },
  {
    name: "Fear",
    color: "#34A853",
    children: [
      {
        name: "Anxiety",
        color: "#93C47D",
        children: [
          { name: "Worried", color: "#D9EAD3" },
          { name: "Nervous", color: "#D9EAD3" },
          { name: "Uneasy", color: "#D9EAD3" },
        ],
      },
      {
        name: "Terror",
        color: "#93C47D",
        children: [
          { name: "Horrified", color: "#D9EAD3" },
          { name: "Scared", color: "#D9EAD3" },
          { name: "Panicked", color: "#D9EAD3" },
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

    return (
      <g>
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
                    "slice cursor-pointer transition-opacity",
                    selectedCore === emotion.name ? "stroke-2" : "hover:opacity-80",
                    selectedCore && selectedCore !== emotion.name ? "opacity-50" : ""
                  )}
                  fill={emotion.color}
                  stroke="#fff"
                  strokeWidth={selectedCore === emotion.name ? 2 : 1}
                  onClick={() => handleCoreSelect(emotion.name)}
                  onMouseEnter={() => setHoveredEmotion(emotion.name)}
                  onMouseLeave={() => setHoveredEmotion(null)}
                />
                
                {/* Only show label for core emotions if no core is selected or this is the selected core */}
                {(!selectedCore || selectedCore === emotion.name) && (
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    className="text-xs font-medium select-none pointer-events-none"
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
                        "slice cursor-pointer transition-opacity",
                        selectedPrimary === primary.name ? "stroke-2" : "hover:opacity-80",
                        selectedPrimary && selectedPrimary !== primary.name ? "opacity-50" : ""
                      )}
                      fill={primary.color}
                      stroke="#fff"
                      strokeWidth={selectedPrimary === primary.name ? 2 : 1}
                      onClick={() => handlePrimarySelect(primary.name)}
                      onMouseEnter={() => setHoveredEmotion(primary.name)}
                      onMouseLeave={() => setHoveredEmotion(null)}
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
                        "slice cursor-pointer transition-opacity",
                        selectedTertiary === tertiary.name ? "stroke-2" : "hover:opacity-80",
                        selectedTertiary && selectedTertiary !== tertiary.name ? "opacity-50" : ""
                      )}
                      fill={tertiary.color}
                      stroke="#fff"
                      strokeWidth={selectedTertiary === tertiary.name ? 2 : 1}
                      onClick={() => handleTertiarySelect(tertiary.name)}
                      onMouseEnter={() => setHoveredEmotion(tertiary.name)}
                      onMouseLeave={() => setHoveredEmotion(null)}
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
