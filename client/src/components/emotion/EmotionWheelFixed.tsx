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
    name: "Anger",
    color: "#E53E3E", // Red
    gradient: ["#FC8181", "#C53030"],
    children: [
      {
        name: "Rage",
        color: "#F56565",
        gradient: ["#FEB2B2", "#E53E3E"],
        children: [
          { name: "Hate", color: "#FC8181", gradient: ["#FED7D7", "#F56565"] },
          { name: "Hostile", color: "#F56565", gradient: ["#FEB2B2", "#E53E3E"] }
        ],
      },
      {
        name: "Exasperated",
        color: "#E53E3E",
        gradient: ["#FC8181", "#C53030"],
        children: [
          { name: "Agitated", color: "#E53E3E", gradient: ["#FC8181", "#C53030"] },
          { name: "Frustrated", color: "#C53030", gradient: ["#E53E3E", "#9B2C2C"] }
        ],
      },
      {
        name: "Irritable",
        color: "#C53030",
        gradient: ["#E53E3E", "#9B2C2C"],
        children: [
          { name: "Annoyed", color: "#C53030", gradient: ["#E53E3E", "#9B2C2C"] },
          { name: "Aggravated", color: "#9B2C2C", gradient: ["#C53030", "#742A2A"] }
        ],
      },
      {
        name: "Envy",
        color: "#9B2C2C",
        gradient: ["#C53030", "#742A2A"],
        children: [
          { name: "Resentful", color: "#9B2C2C", gradient: ["#C53030", "#742A2A"] },
          { name: "Jealous", color: "#742A2A", gradient: ["#9B2C2C", "#63171B"] }
        ],
      },
      {
        name: "Disgust",
        color: "#742A2A",
        gradient: ["#9B2C2C", "#63171B"],
        children: [
          { name: "Contempt", color: "#742A2A", gradient: ["#9B2C2C", "#63171B"] },
          { name: "Revolted", color: "#63171B", gradient: ["#742A2A", "#501212"] }
        ],
      }
    ],
  },
  {
    name: "Sadness",
    color: "#3182CE", // Blue
    gradient: ["#63B3ED", "#2C5282"],
    children: [
      {
        name: "Suffering",
        color: "#4299E1",
        gradient: ["#90CDF4", "#2B6CB0"],
        children: [
          { name: "Agony", color: "#63B3ED", gradient: ["#BEE3F8", "#3182CE"] },
          { name: "Hurt", color: "#4299E1", gradient: ["#90CDF4", "#2B6CB0"] }
        ],
      },
      {
        name: "Sadness",
        color: "#3182CE",
        gradient: ["#63B3ED", "#2C5282"],
        children: [
          { name: "Depressed", color: "#3182CE", gradient: ["#63B3ED", "#2C5282"] },
          { name: "Sorrow", color: "#2B6CB0", gradient: ["#3182CE", "#2A4365"] }
        ],
      },
      {
        name: "Disappointed",
        color: "#2C5282",
        gradient: ["#3182CE", "#2A4365"],
        children: [
          { name: "Dismayed", color: "#2C5282", gradient: ["#3182CE", "#2A4365"] },
          { name: "Displeased", color: "#2A4365", gradient: ["#2C5282", "#1A365D"] }
        ],
      },
      {
        name: "Shameful",
        color: "#2B6CB0",
        gradient: ["#3182CE", "#2A4365"],
        children: [
          { name: "Regretful", color: "#2B6CB0", gradient: ["#3182CE", "#2A4365"] },
          { name: "Guilty", color: "#2A4365", gradient: ["#2B6CB0", "#1A365D"] }
        ],
      },
      {
        name: "Neglected",
        color: "#2A4365",
        gradient: ["#2B6CB0", "#1A365D"],
        children: [
          { name: "Isolated", color: "#2A4365", gradient: ["#2B6CB0", "#1A365D"] },
          { name: "Lonely", color: "#1A365D", gradient: ["#2A4365", "#0C2D53"] }
        ],
      },
      {
        name: "Despair",
        color: "#1A365D",
        gradient: ["#2A4365", "#0C2D53"],
        children: [
          { name: "Grief", color: "#1A365D", gradient: ["#2A4365", "#0C2D53"] },
          { name: "Powerless", color: "#0C2D53", gradient: ["#1A365D", "#0A2744"] }
        ],
      }
    ],
  },
  {
    name: "Surprise",
    color: "#6B46C1", // Purple
    gradient: ["#9F7AEA", "#553C9A"],
    children: [
      {
        name: "Stunned",
        color: "#805AD5",
        gradient: ["#B794F4", "#6B46C1"],
        children: [
          { name: "Shocked", color: "#9F7AEA", gradient: ["#D6BCFA", "#805AD5"] },
          { name: "Dismayed", color: "#805AD5", gradient: ["#B794F4", "#6B46C1"] }
        ],
      },
      {
        name: "Confused",
        color: "#6B46C1",
        gradient: ["#9F7AEA", "#553C9A"],
        children: [
          { name: "Disillusioned", color: "#6B46C1", gradient: ["#9F7AEA", "#553C9A"] },
          { name: "Perplexed", color: "#553C9A", gradient: ["#6B46C1", "#44337A"] }
        ],
      },
      {
        name: "Amazed",
        color: "#553C9A",
        gradient: ["#6B46C1", "#44337A"],
        children: [
          { name: "Astonished", color: "#553C9A", gradient: ["#6B46C1", "#44337A"] },
          { name: "Awe-struck", color: "#44337A", gradient: ["#553C9A", "#322659"] }
        ],
      },
      {
        name: "Overcome",
        color: "#44337A",
        gradient: ["#553C9A", "#322659"],
        children: [
          { name: "Speechless", color: "#44337A", gradient: ["#553C9A", "#322659"] },
          { name: "Astounded", color: "#322659", gradient: ["#44337A", "#1F1746"] }
        ],
      },
      {
        name: "Moved",
        color: "#322659",
        gradient: ["#44337A", "#1F1746"],
        children: [
          { name: "Stimulated", color: "#322659", gradient: ["#44337A", "#1F1746"] },
          { name: "Touched", color: "#1F1746", gradient: ["#322659", "#170B39"] }
        ],
      }
    ],
  },
  {
    name: "Joy",
    color: "#D69E2E", // Yellow
    gradient: ["#F6E05E", "#B7791F"],
    children: [
      {
        name: "Content",
        color: "#ECC94B",
        gradient: ["#FAF089", "#D69E2E"],
        children: [
          { name: "Pleased", color: "#F6E05E", gradient: ["#FEFCBF", "#ECC94B"] },
          { name: "Satisfied", color: "#ECC94B", gradient: ["#FAF089", "#D69E2E"] }
        ],
      },
      {
        name: "Happy",
        color: "#D69E2E",
        gradient: ["#F6E05E", "#B7791F"],
        children: [
          { name: "Amused", color: "#D69E2E", gradient: ["#F6E05E", "#B7791F"] },
          { name: "Delighted", color: "#B7791F", gradient: ["#D69E2E", "#975A16"] }
        ],
      },
      {
        name: "Cheerful",
        color: "#B7791F",
        gradient: ["#D69E2E", "#975A16"],
        children: [
          { name: "Jovial", color: "#B7791F", gradient: ["#D69E2E", "#975A16"] },
          { name: "Blissful", color: "#975A16", gradient: ["#B7791F", "#744210"] }
        ],
      },
      {
        name: "Proud",
        color: "#975A16",
        gradient: ["#B7791F", "#744210"],
        children: [
          { name: "Triumphant", color: "#975A16", gradient: ["#B7791F", "#744210"] },
          { name: "Illustrious", color: "#744210", gradient: ["#975A16", "#5F370E"] }
        ],
      },
      {
        name: "Optimistic",
        color: "#744210",
        gradient: ["#975A16", "#5F370E"],
        children: [
          { name: "Eager", color: "#744210", gradient: ["#975A16", "#5F370E"] },
          { name: "Hopeful", color: "#5F370E", gradient: ["#744210", "#473107"] }
        ],
      },
      {
        name: "Enthusiastic",
        color: "#5F370E",
        gradient: ["#744210", "#473107"],
        children: [
          { name: "Excited", color: "#5F370E", gradient: ["#744210", "#473107"] },
          { name: "Zeal", color: "#473107", gradient: ["#5F370E", "#372303"] }
        ],
      },
      {
        name: "Elation",
        color: "#473107",
        gradient: ["#5F370E", "#372303"],
        children: [
          { name: "Euphoric", color: "#473107", gradient: ["#5F370E", "#372303"] },
          { name: "Jubilation", color: "#372303", gradient: ["#473107", "#2C1D05"] }
        ],
      },
      {
        name: "Enthralled",
        color: "#372303",
        gradient: ["#473107", "#2C1D05"],
        children: [
          { name: "Enchanted", color: "#372303", gradient: ["#473107", "#2C1D05"] },
          { name: "Rapture", color: "#2C1D05", gradient: ["#372303", "#211606"] }
        ],
      }
    ],
  },
  {
    name: "Love",
    color: "#E6338F", // Pink
    gradient: ["#FB77C8", "#BF2975"],
    children: [
      {
        name: "Affectionate",
        color: "#F54DAA",
        gradient: ["#FAA3D9", "#D6277E"],
        children: [
          { name: "Romantic", color: "#FB77C8", gradient: ["#FDC4E9", "#F54DAA"] },
          { name: "Fondness", color: "#F54DAA", gradient: ["#FAA3D9", "#D6277E"] }
        ],
      },
      {
        name: "Longing",
        color: "#E6338F",
        gradient: ["#FB77C8", "#BF2975"],
        children: [
          { name: "Sentimental", color: "#E6338F", gradient: ["#FB77C8", "#BF2975"] },
          { name: "Attracted", color: "#D6277E", gradient: ["#E6338F", "#AC1E60"] }
        ],
      },
      {
        name: "Desire",
        color: "#BF2975",
        gradient: ["#E6338F", "#A31E60"],
        children: [
          { name: "Passion", color: "#BF2975", gradient: ["#E6338F", "#A31E60"] },
          { name: "Infatuation", color: "#A31E60", gradient: ["#BF2975", "#82184B"] }
        ],
      },
      {
        name: "Tenderness",
        color: "#A31E60",
        gradient: ["#BF2975", "#82184B"],
        children: [
          { name: "Caring", color: "#A31E60", gradient: ["#BF2975", "#82184B"] },
          { name: "Compassionate", color: "#82184B", gradient: ["#A31E60", "#641239"] }
        ],
      },
      {
        name: "Peaceful",
        color: "#82184B",
        gradient: ["#A31E60", "#641239"],
        children: [
          { name: "Relieved", color: "#82184B", gradient: ["#A31E60", "#641239"] },
          { name: "Satisfied", color: "#641239", gradient: ["#82184B", "#500D2D"] }
        ],
      }
    ],
  },
  {
    name: "Fear",
    color: "#38A169", // Green
    gradient: ["#68D391", "#2F855A"],
    children: [
      {
        name: "Scared",
        color: "#48BB78",
        gradient: ["#9AE6B4", "#38A169"],
        children: [
          { name: "Frightened", color: "#68D391", gradient: ["#C6F6D5", "#48BB78"] },
          { name: "Helpless", color: "#48BB78", gradient: ["#9AE6B4", "#38A169"] }
        ],
      },
      {
        name: "Terror",
        color: "#38A169",
        gradient: ["#68D391", "#2F855A"],
        children: [
          { name: "Panic", color: "#38A169", gradient: ["#68D391", "#2F855A"] },
          { name: "Hysterical", color: "#2F855A", gradient: ["#38A169", "#276749"] }
        ],
      },
      {
        name: "Insecure",
        color: "#2F855A",
        gradient: ["#38A169", "#276749"],
        children: [
          { name: "Inferior", color: "#2F855A", gradient: ["#38A169", "#276749"] },
          { name: "Inadequate", color: "#276749", gradient: ["#2F855A", "#1C4532"] }
        ],
      },
      {
        name: "Nervous",
        color: "#276749",
        gradient: ["#2F855A", "#1C4532"],
        children: [
          { name: "Worried", color: "#276749", gradient: ["#2F855A", "#1C4532"] },
          { name: "Anxious", color: "#1C4532", gradient: ["#276749", "#133B28"] }
        ],
      },
      {
        name: "Horror",
        color: "#1C4532",
        gradient: ["#276749", "#133B28"],
        children: [
          { name: "Mortified", color: "#1C4532", gradient: ["#276749", "#133B28"] },
          { name: "Dread", color: "#133B28", gradient: ["#1C4532", "#0A301E"] }
        ],
      }
    ],
  }
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
    // Core emotions
    "Joy": "الفرح",
    "Anger": "الغضب",
    "Sadness": "الحزن",
    "Fear": "الخوف",
    "Love": "الحب",
    "Surprise": "المفاجأة",
    
    // Anger secondary emotions
    "Rage": "الغيظ",
    "Exasperated": "مستفز",
    "Irritable": "متهيج",
    "Envy": "الحسد",
    "Disgust": "الاشمئزاز",
    
    // Anger tertiary emotions
    "Hate": "الكراهية",
    "Hostile": "عدائي",
    "Agitated": "مضطرب",
    "Frustrated": "محبط",
    "Annoyed": "منزعج",
    "Aggravated": "متفاقم",
    "Resentful": "استياء",
    "Jealous": "غيور",
    "Contempt": "احتقار",
    "Revolted": "متقزز",
    
    // Sadness secondary emotions
    "Suffering": "المعاناة",
    "Disappointed": "خائب الأمل",
    "Shameful": "مخجل",
    "Neglected": "مهمل",
    "Despair": "اليأس",
    
    // Sadness tertiary emotions
    "Agony": "ألم شديد",
    "Hurt": "متألم",
    "Depressed": "مكتئب",
    "Sorrow": "أسى",
    "Dismayed": "مصدوم",
    "Displeased": "غير راض",
    "Regretful": "نادم",
    "Guilty": "مذنب",
    "Isolated": "معزول",
    "Lonely": "وحيد",
    "Grief": "حزن عميق",
    "Powerless": "عاجز",
    
    // Surprise secondary emotions
    "Stunned": "مذهول",
    "Confused": "مرتبك",
    "Amazed": "مندهش",
    "Overcome": "مغلوب",
    "Moved": "متأثر",
    
    // Surprise tertiary emotions
    "Shocked": "مصدوم",
    "Stunned_Dismayed": "مفجوع", // Renamed to avoid duplicate keys
    "Disillusioned": "خائب الظن",
    "Perplexed": "محتار",
    "Astonished": "متعجب",
    "Awe-struck": "مبهور",
    "Speechless": "عاجز عن الكلام",
    "Astounded": "مندهش",
    "Stimulated": "متحفز",
    "Touched": "متأثر",
    
    // Joy secondary emotions
    "Content": "راضي",
    "Happy": "سعيد",
    "Cheerful": "مرح",
    "Proud": "فخور",
    "Optimistic": "متفائل",
    "Enthusiastic": "متحمس",
    "Elation": "ابتهاج",
    "Enthralled": "مأخوذ",
    
    // Joy tertiary emotions
    "Pleased": "مسرور",
    "Content_Satisfied": "راضي", // Renamed to avoid duplicate keys
    "Amused": "مستمتع",
    "Delighted": "مبتهج",
    "Jovial": "مرح",
    "Blissful": "سعيد",
    "Triumphant": "منتصر",
    "Illustrious": "بارز",
    "Eager": "متلهف",
    "Hopeful": "متفائل",
    "Excited": "متحمس",
    "Zeal": "حماس",
    "Euphoric": "نشوة",
    "Jubilation": "فرح شديد",
    "Enchanted": "مفتون",
    "Rapture": "نشوة",
    
    // Love secondary emotions
    "Affectionate": "عاطفي",
    "Longing": "شوق",
    "Desire": "رغبة",
    "Tenderness": "حنان",
    "Peaceful": "هادئ",
    
    // Love tertiary emotions
    "Romantic": "رومانسي",
    "Fondness": "مودة",
    "Sentimental": "عاطفي",
    "Attracted": "منجذب",
    "Passion": "شغف",
    "Infatuation": "افتتان",
    "Caring": "مهتم",
    "Compassionate": "متعاطف",
    "Relieved": "مرتاح",
    
    // Fear secondary emotions
    "Scared": "خائف",
    "Terror": "رعب",
    "Insecure": "غير آمن",
    "Nervous": "متوتر",
    "Horror": "فزع",
    
    // Fear tertiary emotions
    "Frightened": "مرعوب",
    "Helpless": "عاجز",
    "Panic": "ذعر",
    "Hysterical": "هستيري",
    "Inferior": "أدنى",
    "Inadequate": "غير كافي",
    "Worried": "قلق",
    "Anxious": "قلق",
    "Mortified": "مرعوب",
    "Dread": "خوف",
    
    // UI elements
    "Emotion Path:": "مسار المشاعر:",
    "Select an": "اختر",
    "Emotion": "شعورًا",
    "Click on the wheel to select your emotion": "انقر على العجلة لاختيار شعورك",
    "You selected": "لقد اخترت",
    "Select an emotion from the wheel below": "اختر شعورًا من العجلة أدناه"
  };

  // Translation function
  const translate = (text: string): string => {
    // Special cases for renamed keys to avoid duplication
    if (text === "Dismayed" && language === "ar") {
      return arabicTranslations["Stunned_Dismayed"];
    }
    
    if (text === "Satisfied" && language === "ar") {
      return arabicTranslations["Content_Satisfied"];
    }
    
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
    const coreRadius = 95; // Increased core size for better visibility
    
    // Define all radii here for consistency
    const middleRadiusStart = coreRadius; // Where middle ring starts
    const middleRadiusEnd = 145; // Reduced to give even more space to outer ring
    const outerRadiusStart = middleRadiusEnd; // Where outer ring starts
    const outerRadiusEnd = 199; // Maximized outer ring to completely fill all available space
    
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
                
                {/* Background for text with rotation */}
                <rect
                  x={-25} 
                  y={-8}
                  width={50}
                  height={16}
                  rx={8}
                  fill="rgba(0,0,0,0.3)"
                  className="select-none pointer-events-none"
                  transform={`translate(${labelX},${labelY}) rotate(${(midAngle * 180 / Math.PI)})`}
                />
                {/* Vertical text along the segment radius with corrected positioning */}
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#FFFFFF"
                  className="select-none pointer-events-none font-bold"
                  style={{
                    fontSize: '13px',
                    textShadow: "0px 1px 2px rgba(0,0,0,0.7)",
                    letterSpacing: '0.5px'
                  }}
                  transform={`translate(${labelX},${labelY}) rotate(${(midAngle * 180 / Math.PI)})`}
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
                  
                  {/* Background for text with rotation */}
                  <rect
                    x={-20} 
                    y={-7}
                    width={40}
                    height={14}
                    rx={7}
                    fill="rgba(255,255,255,0.7)"
                    className="select-none pointer-events-none"
                    transform={`translate(${labelX},${labelY}) rotate(${(midAngle * 180 / Math.PI)})`}
                  />
                  {/* Vertical text along the segment radius with corrected positioning */}
                  <text
                    x={0}
                    y={0}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#000000"
                    style={{
                      fontSize: '9px',
                      fontWeight: '600',
                    }}
                    className="select-none pointer-events-none"
                    transform={`translate(${labelX},${labelY}) rotate(${(midAngle * 180 / Math.PI)})`}
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
                    
                    {/* Background for tertiary text with rotation */}
                    <rect
                      x={-23} 
                      y={-7}
                      width={46}
                      height={14}
                      rx={7}
                      fill="rgba(255,255,255,0.75)"
                      className="select-none pointer-events-none"
                      style={{
                        opacity: isSelected || hoveredEmotion === tertiary.name ? 1 : 0.85
                      }}
                      transform={`translate(${labelX},${labelY}) rotate(${(midAngle * 180 / Math.PI)})`}
                    />
                    {/* Vertical text along the segment radius with corrected positioning */}
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isSelected ? "#000000" : "#333333"}
                      style={{
                        fontSize: '9px',
                        fontWeight: isSelected || hoveredEmotion === tertiary.name ? '700' : '600',
                        opacity: isSelected || hoveredEmotion === tertiary.name ? 1 : 0.95
                      }}
                      className="select-none pointer-events-none"
                      transform={`translate(${labelX},${labelY}) rotate(${(midAngle * 180 / Math.PI)})`}
                    >
                      {translate(tertiary.name)}
                    </text>
                  </g>
                );
              });
            });
          })}
        </g>

        {/* Empty center - no more blue circle and text */}
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
      {/* Simple Breadcrumb Trail - Plain Text */}
      <div id="emotion-breadcrumb" className="breadcrumb-container p-4 mb-5 flex items-center">
        <span className="breadcrumb-label text-sm font-medium text-gray-600 mr-3">
          {translate("Emotion Path:")}
        </span>
        <div className={`breadcrumb-trail flex flex-wrap ${direction === "rtl" ? "flex-row-reverse" : ""}`}>
          {selectedCore && (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              id="core-breadcrumb"
              className={cn(
                "breadcrumb-item flex items-center text-sm py-1 px-2 relative",
                direction === "rtl" ? "ml-4" : "mr-4"
              )}
            >
              <span className="font-medium text-gray-900">{translate(selectedCore)}</span>
              {!selectedPrimary && (
                <button 
                  className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none" 
                  onClick={() => resetSelections()}
                >
                  ✕
                </button>
              )}
              {(direction !== "rtl" && selectedPrimary) && (
                <span className="ml-2 text-gray-400">→</span>
              )}
              {(direction === "rtl" && selectedPrimary) && (
                <span className="mr-2 text-gray-400">←</span>
              )}
            </motion.span>
          )}
          
          {selectedPrimary && (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              id="primary-breadcrumb"
              className={cn(
                "breadcrumb-item flex items-center text-sm py-1 px-2 relative",
                direction === "rtl" ? "ml-4" : "mr-4"
              )}
            >
              <span className="font-medium text-gray-900">{translate(selectedPrimary)}</span>
              {!selectedTertiary && (
                <button 
                  className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none" 
                  onClick={() => setSelectedPrimary(null)}
                >
                  ✕
                </button>
              )}
              {(direction !== "rtl" && selectedTertiary) && (
                <span className="ml-2 text-gray-400">→</span>
              )}
              {(direction === "rtl" && selectedTertiary) && (
                <span className="mr-2 text-gray-400">←</span>
              )}
            </motion.span>
          )}
          
          {selectedTertiary && (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              id="tertiary-breadcrumb"
              className="breadcrumb-item flex items-center text-sm py-1 px-2"
            >
              <span className="font-medium text-gray-900">{translate(selectedTertiary)}</span>
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