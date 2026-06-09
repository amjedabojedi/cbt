import { useState } from "react";
import { useJournalEntries } from "../hooks/useJournal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, TrendingUp, Calendar as CalendarIcon, Tag, Heart, Info, AlertCircle } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, subYears, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ar } from "date-fns/locale";
import { useLocalization } from "@/lib/localize.tsx";
import { formatJournalTag } from "@/features/journal/utils/journalLabels";
interface JournalInsightsProps {
  userId: number;
}

const TOPIC_COLORS = [
  "#a78bfa", // Violet
  "#6366f1", // Indigo
  "#ec4899", // Fuchsia
  "#14b8a6", // Teal
  "#3b82f6", // Soothing blue
  "#f59e0b", // Amber/Gold
  "#10b981", // Emerald sage
  "#ef4444", // Crimson
];

export default function JournalInsights({ userId }: JournalInsightsProps) {
  const { t, tNum, isRTL, currentLanguage } = useLocalization();
  const dateLocale = isRTL ? ar : undefined;
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year" | "all">("month");

  // Fetch journal entries
  const { data: entries = [], isLoading } = useJournalEntries(userId);

  // Calculate sentiment trends
  const getSentimentTrends = () => {
    let startDate: Date;
    
    if (timeRange === "week") {
      startDate = subDays(new Date(), 7);
    } else if (timeRange === "month") {
      startDate = subDays(new Date(), 30);
    } else {
      startDate = subYears(new Date(), 1);
    }

    if (timeRange === "year") {
      const months = eachMonthOfInterval({ start: startDate, end: new Date() });
      
      return months.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const monthEntries = entries.filter(e => {
          const entryDate = new Date(e.createdAt);
          return isWithinInterval(entryDate, { start: monthStart, end: monthEnd });
        });
        
        const avgPositive = monthEntries.length > 0
          ? monthEntries.reduce((sum, e) => sum + (e.sentimentPositive || 0), 0) / monthEntries.length
          : 0;
        
        const avgNegative = monthEntries.length > 0
          ? monthEntries.reduce((sum, e) => sum + (e.sentimentNegative || 0), 0) / monthEntries.length
          : 0;
        
        const avgNeutral = monthEntries.length > 0
          ? monthEntries.reduce((sum, e) => sum + (e.sentimentNeutral || 0), 0) / monthEntries.length
          : 0;
        
        return {
          date: format(monthStart, "MMM", { locale: dateLocale }),
          positive: parseFloat(avgPositive.toFixed(1)),
          negative: parseFloat(avgNegative.toFixed(1)),
          neutral: parseFloat(avgNeutral.toFixed(1)),
          count: monthEntries.length,
        };
      });
    }

    if (timeRange === "month") {
      const today = new Date();
      const currentWeekMonday = startOfWeek(today, { weekStartsOn: 1 });
      
      const weeks = [];
      for (let i = 3; i >= 0; i--) {
        const weekMonday = subDays(currentWeekMonday, i * 7);
        weeks.push(weekMonday);
      }
      
      return weeks.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekEntries = entries.filter(e => {
          const entryDate = new Date(e.createdAt);
          return entryDate >= weekStart && entryDate <= weekEnd;
        });
        
        const avgPositive = weekEntries.length > 0
          ? weekEntries.reduce((sum, e) => sum + (e.sentimentPositive || 0), 0) / weekEntries.length
          : 0;
        
        const avgNegative = weekEntries.length > 0
          ? weekEntries.reduce((sum, e) => sum + (e.sentimentNegative || 0), 0) / weekEntries.length
          : 0;
        
        const avgNeutral = weekEntries.length > 0
          ? weekEntries.reduce((sum, e) => sum + (e.sentimentNeutral || 0), 0) / weekEntries.length
          : 0;
        
        return {
          date: `${t("Week")} ${tNum(index + 1)}`,
          positive: parseFloat(avgPositive.toFixed(1)),
          negative: parseFloat(avgNegative.toFixed(1)),
          neutral: parseFloat(avgNeutral.toFixed(1)),
          count: weekEntries.length,
        };
      });
    }

    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayEntries = entries.filter(e => 
        format(new Date(e.createdAt), "yyyy-MM-dd") === dayStr
      );
      
      const avgPositive = dayEntries.length > 0
        ? dayEntries.reduce((sum, e) => sum + (e.sentimentPositive || 0), 0) / dayEntries.length
        : 0;
      
      const avgNegative = dayEntries.length > 0
        ? dayEntries.reduce((sum, e) => sum + (e.sentimentNegative || 0), 0) / dayEntries.length
        : 0;
      
      const avgNeutral = dayEntries.length > 0
        ? dayEntries.reduce((sum, e) => sum + (e.sentimentNeutral || 0), 0) / dayEntries.length
        : 0;
      
      return {
        date: format(day, "EEE", { locale: dateLocale }),
        positive: parseFloat(avgPositive.toFixed(1)),
        negative: parseFloat(avgNegative.toFixed(1)),
        neutral: parseFloat(avgNeutral.toFixed(1)),
        count: dayEntries.length,
      };
    });
  };

  // Calculate writing frequency
  const getWritingFrequency = () => {
    const last30Days = eachDayOfInterval({ 
      start: subDays(new Date(), 29), 
      end: new Date() 
    });
    
    return last30Days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayEntries = entries.filter(e => 
        format(new Date(e.createdAt), "yyyy-MM-dd") === dayStr
      );
      
      return {
        date: format(day, "MMM d", { locale: dateLocale }),
        dayNum: format(day, "d", { locale: dateLocale }),
        count: dayEntries.length,
      };
    });
  };

  // Core emotions mapping
  const CORE_EMOTIONS: Record<string, { color: string; keywords: string[] }> = {
    Anger: {
      color: "#ef4444",
      keywords: [
        "anger","angry","rage","furious","enraged","mad","hostile","hate","hatred",
        "exasperated","agitated","frustrated","frustration","irritable","irritated",
        "irritation","annoyed","annoyance","aggravated","envy","resentful","resentment",
        "jealous","jealousy","disgust","disgusted","contempt","contemptuous","revolted",
        "bitter","bitterness","outraged","livid","irate","wrathful","wrath",
      ],
    },
    Sadness: {
      color: "#3b82f6",
      keywords: [
        "sadness","sad","unhappy","depressed","depression","sorrow","sorrowful",
        "grief","grieving","suffering","agony","hurt","disappointed","disappointment",
        "dismayed","displeased","shameful","shame","ashamed","regretful","regret",
        "guilty","guilt","neglected","isolated","isolation","lonely","loneliness",
        "despair","powerless","hopeless","hopelessness","dejected","miserable",
        "gloomy","melancholy","heartbroken","devastated","broken","crushed","lost",
        "empty","hollow","numb","worthless","down","blue","low","upset",
      ],
    },
    Fear: {
      color: "#10b981",
      keywords: [
        "fear","fearful","afraid","scared","frightened","helpless","terror","terrified",
        "panic","panicked","hysterical","insecure","insecurity","inferior","inadequate",
        "nervous","nervousness","worried","worry","anxious","anxiety","horror","mortified",
        "dread","dreading","apprehensive","apprehension","stressed","stress","overwhelmed",
        "overwhelm","uneasy","unease","tense","tension","alarmed","threatened",
        "vulnerable","uncertain","uncertainty","unsure","unsettled","doubtful",
        "on edge","distressed",
      ],
    },
    Surprise: {
      color: "#f59e0b",
      keywords: [
        "surprise","surprised","stunned","shocked","dismayed","confused","confusion",
        "disillusioned","perplexed","amazed","astonished","awe","awe-struck","overcome",
        "speechless","astounded","moved","stimulated","touched","bewildered","baffled",
        "disbelief","startled","unexpected","caught off guard","taken aback",
      ],
    },
    Joy: {
      color: "#eab308",
      keywords: [
        "joy","joyful","joyous","happy","happiness","glad","content","contentment",
        "pleased","satisfied","satisfaction","amused","amusement","delighted","delight",
        "cheerful","jovial","blissful","bliss","proud","pride","triumphant","optimistic",
        "optimism","eager","eagerness","hopeful","hope","enthusiastic","enthusiasm",
        "excited","excitement","euphoric","euphoria","jubilant","jubilation","enchanted",
        "rapture","grateful","gratitude","thankful","elated","elation","thrilled",
        "ecstatic","wonderful","great","good","positive","upbeat","energetic",
      ],
    },
    Love: {
      color: "#ec4899",
      keywords: [
        "love","loving","affectionate","affection","romantic","romance","fondness",
        "fond","longing","sentimental","attracted","desire","passion","passionate",
        "infatuation","tenderness","tender","caring","care","compassionate","compassion",
        "peaceful","peace","calm","calming","relieved","relief","connected","warmth",
        "warm","cherished","appreciated","appreciated","adoring","adore","devoted",
        "devotion","nurturing","trusting","trust","safe","secure","belonging",
      ],
    },
  };

  const mapToCoreEmotion = (raw: string): string => {
    const word = raw.toLowerCase().trim();
    for (const [coreName, { keywords }] of Object.entries(CORE_EMOTIONS)) {
      if (keywords.includes(word)) return coreName;
    }
    for (const [coreName, { keywords }] of Object.entries(CORE_EMOTIONS)) {
      if (keywords.some(k => word.includes(k) || k.includes(word))) return coreName;
    }
    return "Surprise";
  };

  // Calculate emotion distribution
  const getEmotionDistribution = () => {
    const coreCounts: Record<string, number> = {};

    entries.forEach(entry => {
      if (entry.emotions && Array.isArray(entry.emotions)) {
        entry.emotions.forEach((emotion: string) => {
          const core = mapToCoreEmotion(emotion);
          coreCounts[core] = (coreCounts[core] || 0) + 1;
        });
      }
    });

    return Object.entries(coreCounts)
      .map(([name, value]) => ({
        name,
        displayName: formatJournalTag(name, t, currentLanguage),
        value,
        color: CORE_EMOTIONS[name]?.color || "#a78bfa",
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Calculate topic analysis
  const getTopicAnalysis = () => {
    const topicCounts: Record<string, number> = {};
    
    entries.forEach(entry => {
      if (entry.topics && Array.isArray(entry.topics)) {
        entry.topics.forEach((topic: string) => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
      }
    });
    
    return Object.entries(topicCounts)
      .map(([topic, count]) => ({
        topic,
        label: formatJournalTag(topic, t, currentLanguage),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  const formatCalendarTooltip = (date: string, count: number) => {
    const logLabel =
      count === 1
        ? t("{date}: {count} log completed")
        : t("{date}: {count} logs completed");
    return logLabel.replace("{date}", date).replace("{count}", tNum(count));
  };

  // Calculate overall stats
  const getOverallStats = () => {
    const totalEntries = entries.length;
    const avgSentimentPositive = entries.length > 0
      ? entries.reduce((sum, e) => sum + (e.sentimentPositive || 0), 0) / entries.length
      : 0;
    
    const avgSentimentNegative = entries.length > 0
      ? entries.reduce((sum, e) => sum + (e.sentimentNegative || 0), 0) / entries.length
      : 0;
    
    const avgSentimentNeutral = entries.length > 0
      ? entries.reduce((sum, e) => sum + (e.sentimentNeutral || 0), 0) / entries.length
      : 0;
    
    const rawEmotion = getEmotionDistribution()[0]?.name || "None";
    const mostCommonEmotion = formatJournalTag(rawEmotion, t, currentLanguage);

    return {
      totalEntries,
      avgPositivity: parseFloat(avgSentimentPositive.toFixed(1)),
      avgNegativity: parseFloat(avgSentimentNegative.toFixed(1)),
      avgNeutrality: parseFloat(avgSentimentNeutral.toFixed(1)),
      mostCommonEmotion,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 bg-white/60 backdrop-blur border border-slate-100 rounded-3xl shadow-sm" dir={isRTL ? "rtl" : "ltr"}>
        <div className="animate-spin h-10 w-10 border-4 border-teal-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur rounded-3xl border border-slate-100 shadow-sm py-16 text-center px-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="w-16 h-16 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="h-8 w-8" />
        </div>
        <h3 className="font-bold text-slate-800 text-lg mb-1">{t("Wellness Journal")}</h3>
        <p className="text-slate-500 max-w-sm mx-auto text-sm">
          {t("No journal logs recorded yet. Begin documenting daily notes to analyze patterns, sentiment scores, and word graphs.")}
        </p>
      </div>
    );
  }

  const stats = getOverallStats();
  const insightCardClass = "bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden hover:shadow-md hover:border-teal-200/60 transition-all duration-300";

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/90 backdrop-blur border border-slate-100/80 hover:border-violet-200/60 hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-violet-50 text-violet-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Total Entries")}</p>
            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{tNum(stats.totalEntries)}</h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{t("Logs recorded")}</p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur border border-slate-100/80 hover:border-emerald-200/60 hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Avg Positivity")}</p>
            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{tNum(stats.avgPositivity)}%</h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{t("Positive sentiments")}</p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur border border-slate-100/80 hover:border-teal-200/60 hover:shadow-md transition-all duration-300 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-teal-50 text-teal-700">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Top Emotion")}</p>
            <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{stats.mostCommonEmotion}</h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{t("Most common vibe")}</p>
          </div>
        </div>
      </div>

      {/* Radial Gauges - Overall Sentiment Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={insightCardClass}>
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm text-center">{t("Positive Sentiment")}</h3>
          </div>
          <div className="p-6 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="95%"
                barSize={16}
                data={[{ value: stats.avgPositivity, fill: '#10b981' }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background={{ fill: '#f1f5f9' }}
                  dataKey="value"
                  cornerRadius={8}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-2xl font-extrabold"
                  fill="#10b981"
                >
                  {tNum(stats.avgPositivity)}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="text-[11px] font-semibold text-slate-500 text-center mt-2 max-w-[200px]">
              {t("Average positive emotion level detected across entries")}
            </p>
          </div>
        </div>

        <div className={insightCardClass}>
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm text-center">{t("Negative Sentiment")}</h3>
          </div>
          <div className="p-6 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="95%"
                barSize={16}
                data={[{ value: stats.avgNegativity, fill: '#ef4444' }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background={{ fill: '#f1f5f9' }}
                  dataKey="value"
                  cornerRadius={8}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-2xl font-extrabold"
                  fill="#ef4444"
                >
                  {tNum(stats.avgNegativity)}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="text-[11px] font-semibold text-slate-500 text-center mt-2 max-w-[200px]">
              {t("Average negative distress level detected across entries")}
            </p>
          </div>
        </div>

        <div className={insightCardClass}>
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm text-center">{t("Neutral Sentiment")}</h3>
          </div>
          <div className="p-6 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="95%"
                barSize={16}
                data={[{ value: stats.avgNeutrality, fill: '#64748b' }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background={{ fill: '#f1f5f9' }}
                  dataKey="value"
                  cornerRadius={8}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-2xl font-extrabold"
                  fill="#64748b"
                >
                  {tNum(stats.avgNeutrality)}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="text-[11px] font-semibold text-slate-500 text-center mt-2 max-w-[200px]">
              {t("Average objective neutral content density detected")}
            </p>
          </div>
        </div>
      </div>

      {/* Stacked Area Chart - Sentiment Composition Over Time */}
      <div className={insightCardClass}>
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">{t("Sentiment Composition")}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">{t("Timeline composition showing ratios of positivity vs. distress")}</p>
          </div>
          <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)} className="w-auto">
            <TabsList className="bg-slate-100 p-0.5 rounded-xl h-auto">
              <TabsTrigger value="week" className="rounded-lg text-xs py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-500 font-semibold">{t("Week")}</TabsTrigger>
              <TabsTrigger value="month" className="rounded-lg text-xs py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-500 font-semibold">{t("Month")}</TabsTrigger>
              <TabsTrigger value="year" className="rounded-lg text-xs py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-500 font-semibold">{t("Year")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={getSentimentTrends()} margin={{ left: -15, right: 10, bottom: 5, top: 15 }}>
              <defs>
                <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                </linearGradient>
                <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0.02}/>
                </linearGradient>
                <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tickFormatter={(v) => tNum(v)}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 backdrop-blur-md p-3 border border-teal-100 rounded-xl shadow-xl" dir={isRTL ? "rtl" : "ltr"}>
                        <p className="font-bold text-slate-800 text-xs mb-1.5">{data.date}</p>
                        <div className="space-y-1 text-[11px] font-semibold">
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-emerald-600">{t("Positive:")}</span>
                            <span className="text-slate-800 font-extrabold">{tNum(data.positive)}%</span>
                          </div>
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-slate-500">{t("Neutral:")}</span>
                            <span className="text-slate-800 font-extrabold">{tNum(data.neutral)}%</span>
                          </div>
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-rose-600">{t("Negative:")}</span>
                            <span className="text-slate-800 font-extrabold">{tNum(data.negative)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle" 
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#475569' }} 
              />
              <Area 
                type="monotone" 
                dataKey="positive" 
                stackId="1"
                stroke="#10b981" 
                fill="url(#colorPositive)"
                strokeWidth={2}
                name={t("Positive Sentiment")}
              />
              <Area 
                type="monotone" 
                dataKey="neutral" 
                stackId="1"
                stroke="#64748b" 
                fill="url(#colorNeutral)"
                strokeWidth={2}
                name={t("Neutral Sentiment")}
              />
              <Area 
                type="monotone" 
                dataKey="negative" 
                stackId="1"
                stroke="#ef4444" 
                fill="url(#colorNegative)"
                strokeWidth={2}
                name={t("Negative Sentiment")}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Emotion Distribution */}
        <div className={insightCardClass}>
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-pink-50 text-pink-600">
                <BookOpen className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">{t("Detected Emotions")}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">{t("Breakdown of specific core feelings found in your journals")}</p>
          </div>
          <div className="p-6 flex items-center justify-center min-h-[280px]">
            {getEmotionDistribution().length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={getEmotionDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, payload }) => {
                      const displayName = (payload as { displayName?: string })?.displayName ?? formatJournalTag(String(name), t, currentLanguage);
                      return `${displayName} ${tNum(Math.round((percent ?? 0) * 100))}%`;
                    }}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {getEmotionDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as { displayName?: string; name?: string; value?: number };
                        const label = data.displayName ?? formatJournalTag(String(data.name ?? ""), t, currentLanguage);
                        return (
                          <div className="bg-white/95 backdrop-blur-md py-1.5 px-3 border border-purple-50 rounded-xl shadow-lg text-xs font-semibold text-slate-800" dir={isRTL ? "rtl" : "ltr"}>
                            {label}: <span className="font-extrabold text-teal-700">{tNum(data.value ?? 0)} {t("records")}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                <AlertCircle className="h-6 w-6 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 font-semibold">{t("No emotions detected.")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Topic Analysis */}
        <div className={insightCardClass}>
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
                <Tag className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">{t("Topic Analysis")}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">{t("Frequently addressed topics and recurrent concepts")}</p>
          </div>
          <div className="p-6">
            {getTopicAnalysis().length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={getTopicAnalysis()} margin={{ left: -20, right: 10, bottom: 25, top: 15 }}>
                  <defs>
                    <linearGradient id="barTeal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.95}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.95}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f8fafc" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    angle={-25} 
                    textAnchor="end" 
                    interval={0}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                    height={40}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    tickFormatter={(v) => tNum(v)}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(13, 148, 136, 0.05)', radius: [4, 4, 0, 0] } as any}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as { label?: string; count?: number };
                        return (
                          <div className="bg-white/95 backdrop-blur-md py-1.5 px-3 border border-teal-50 rounded-xl shadow-lg text-xs font-semibold text-slate-800" dir={isRTL ? "rtl" : "ltr"}>
                            {data.label}: <span className="font-extrabold text-teal-600">{tNum(data.count ?? 0)} {t("references")}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="url(#barTeal)" radius={[4, 4, 0, 0]} maxBarSize={35} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                <AlertCircle className="h-6 w-6 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 font-semibold">{t("No topics analyzed yet.")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Emotion Word Cloud */}
      <div className={insightCardClass}>
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <BookOpen className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">{t("Emotion Word Canvas")}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t("Interactive visual map showing prominent emotional weights in journals")}</p>
        </div>
        <div className="p-6">
          {getEmotionDistribution().length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-3.5 p-6 bg-slate-50/30 rounded-2xl border border-slate-100 min-h-[220px]">
              {getEmotionDistribution().map((emotion, index) => {
                const maxValue = Math.max(...getEmotionDistribution().map(e => e.value));
                const minValue = Math.min(...getEmotionDistribution().map(e => e.value));
                const range = maxValue - minValue || 1;
                const size = ((emotion.value - minValue) / range) * 1.5 + 0.95;
                
                return (
                  <div
                    key={index}
                    className="inline-block px-3.5 py-1.5 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:scale-105 hover:-translate-y-0.5 hover:shadow-md cursor-default select-none"
                    style={{
                      fontSize: `${size}rem`,
                      color: emotion.color,
                      fontWeight: 700,
                      opacity: 0.75 + (size / 8),
                    }}
                    title={t("logged {count} times").replace("{count}", tNum(emotion.value))}
                  >
                    {emotion.displayName}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
              <AlertCircle className="h-6 w-6 text-slate-300 mb-2" />
              <p className="text-xs text-slate-400 font-semibold">{t("No emotion data available.")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Writing Frequency Calendar */}
      <div className={insightCardClass}>
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">{t("30-Day Writing Calendar")}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t("Consistency calendar tracing writing volumes over the past month")}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-10 gap-2">
            {getWritingFrequency().map((day, i) => {
              const count = day.count;
              
              let cellClass = "bg-slate-50 text-slate-300 border border-slate-100/50";
              if (count === 1) {
                cellClass = "bg-teal-50 border border-teal-100 text-teal-700 shadow-sm";
              } else if (count === 2) {
                cellClass = "bg-teal-100 border border-teal-200 text-teal-800 shadow-sm";
              } else if (count >= 3) {
                cellClass = "bg-teal-500 text-white border border-teal-600 shadow-md shadow-teal-100/40";
              }
              
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-xl ${cellClass} flex items-center justify-center text-[10px] font-bold relative group transition-all duration-300 hover:scale-105 cursor-default`}
                >
                  <span className="opacity-80">{day.dayNum}</span>
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900/95 backdrop-blur-sm text-white text-[10px] rounded-xl px-2.5 py-1.5 whitespace-nowrap z-10 shadow-xl border border-slate-800 pointer-events-none transition-all duration-200 font-medium">
                    {formatCalendarTooltip(day.date, count)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-500 font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-slate-50 border border-slate-100 rounded-md" />
              <span>{t("None")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-teal-50 border border-teal-100 rounded-md" />
              <span>{t("1 Entry")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-teal-100 border border-teal-200 rounded-md" />
              <span>{t("2 Entries")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-teal-500 rounded-md shadow-sm" />
              <span>{t("3+ Entries")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
