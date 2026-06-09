import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, PieChart as PieChartIcon, Calendar as CalendarIcon, Clock } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, startOfDay } from "date-fns";
import { useLocalization } from "@/lib/localize.tsx";
import { translateEmotion } from "./EmotionWheelFixed";

interface EmotionInsightsProps {
  userId: number;
}

const EMOTION_COLORS: Record<string, string> = {
  "Joy": "#eab308",
  "Sadness": "#3b82f6",
  "Fear": "#10b981",
  "Anger": "#ef4444",
  "Disgust": "#8b5cf6",
  "Surprise": "#f97316",
  "Love": "#ec4899",
};

const POSITIVE_EMOTIONS = ["Joy", "Love", "Surprise"];
const NEGATIVE_EMOTIONS = ["Sadness", "Fear", "Anger", "Disgust"];

export default function EmotionInsights({ userId }: EmotionInsightsProps) {
  const { t, tNum, isRTL, currentLanguage } = useLocalization();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");

  const { data: emotions = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/emotions`],
    enabled: !!userId,
  });

  const getEmotionDistribution = () => {
    const counts: Record<string, number> = {};
    emotions.forEach((e) => {
      counts[e.coreEmotion] = (counts[e.coreEmotion] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: EMOTION_COLORS[name] || "#94a3b8",
    }));
  };

  const getMoodTrends = () => {
    if (timeRange === "week") {
      const today = new Date();
      const days = eachDayOfInterval({
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      });
      return days.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayEmotions = emotions.filter(e =>
          format(new Date(e.createdAt), "yyyy-MM-dd") === dayStr
        );
        const pos = dayEmotions.filter(e => POSITIVE_EMOTIONS.includes(e.coreEmotion));
        const neg = dayEmotions.filter(e => NEGATIVE_EMOTIONS.includes(e.coreEmotion));
        return {
          date: t(format(day, "EEE")),
          positiveIntensity: parseFloat((pos.length > 0 ? pos.reduce((s, e) => s + e.intensity, 0) / pos.length : 0).toFixed(1)),
          negativeIntensity: parseFloat((neg.length > 0 ? neg.reduce((s, e) => s + e.intensity, 0) / neg.length : 0).toFixed(1)),
          count: dayEmotions.length,
        };
      });
    } else if (timeRange === "month") {
      const currentWeekMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
      return Array.from({ length: 4 }, (_, i) => subDays(currentWeekMonday, (3 - i) * 7))
        .map((weekStart, index) => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const weekEmotions = emotions.filter(e => {
            const d = new Date(e.createdAt);
            return d >= weekStart && d <= weekEnd;
          });
          const pos = weekEmotions.filter(e => POSITIVE_EMOTIONS.includes(e.coreEmotion));
          const neg = weekEmotions.filter(e => NEGATIVE_EMOTIONS.includes(e.coreEmotion));
          return {
            date: `${t("Week")} ${tNum(index + 1)}`,
            positiveIntensity: parseFloat((pos.length > 0 ? pos.reduce((s, e) => s + e.intensity, 0) / pos.length : 0).toFixed(1)),
            negativeIntensity: parseFloat((neg.length > 0 ? neg.reduce((s, e) => s + e.intensity, 0) / neg.length : 0).toFixed(1)),
            count: weekEmotions.length,
          };
        });
    } else {
      const year = new Date().getFullYear();
      return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1))
        .map(monthDate => {
          const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
          const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
          const monthEmotions = emotions.filter(e => {
            const d = new Date(e.createdAt);
            return d >= monthStart && d <= monthEnd;
          });
          const pos = monthEmotions.filter(e => POSITIVE_EMOTIONS.includes(e.coreEmotion));
          const neg = monthEmotions.filter(e => NEGATIVE_EMOTIONS.includes(e.coreEmotion));
          return {
            date: t(format(monthDate, "MMM")),
            positiveIntensity: parseFloat((pos.length > 0 ? pos.reduce((s, e) => s + e.intensity, 0) / pos.length : 0).toFixed(1)),
            negativeIntensity: parseFloat((neg.length > 0 ? neg.reduce((s, e) => s + e.intensity, 0) / neg.length : 0).toFixed(1)),
            count: monthEmotions.length,
          };
        });
    }
  };

  const getIntensityHeatmap = () => {
    const today = startOfDay(new Date());
    const startDate = startOfWeek(subDays(today, 28), { weekStartsOn: 1 });
    const endDate = endOfWeek(today, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate }).map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayEmotions = emotions.filter(e =>
        format(new Date(e.createdAt), "yyyy-MM-dd") === dayStr
      );
      const pos = dayEmotions.filter(e => POSITIVE_EMOTIONS.includes(e.coreEmotion));
      const neg = dayEmotions.filter(e => NEGATIVE_EMOTIONS.includes(e.coreEmotion));
      const avgPos = pos.length > 0 ? pos.reduce((s, e) => s + e.intensity, 0) / pos.length : 0;
      const avgNeg = neg.length > 0 ? neg.reduce((s, e) => s + e.intensity, 0) / neg.length : 0;
      return {
        fullDate: format(day, "MMM d"),
        positiveIntensity: avgPos,
        negativeIntensity: avgNeg,
        netIntensity: avgPos - avgNeg,
        count: dayEmotions.length,
        isFuture: day > today,
      };
    });
  };

  const TIME_SLOT_KEYS = ["Morning (6-12)", "Afternoon (12-18)", "Evening (18-24)", "Night (0-6)"] as const;

  const getTimePatterns = () => {
    const counts: Record<string, number> = Object.fromEntries(TIME_SLOT_KEYS.map(k => [k, 0]));
    emotions.forEach(e => {
      const h = new Date(e.createdAt).getHours();
      if (h >= 6 && h < 12) counts["Morning (6-12)"]++;
      else if (h >= 12 && h < 18) counts["Afternoon (12-18)"]++;
      else if (h >= 18 && h < 24) counts["Evening (18-24)"]++;
      else counts["Night (0-6)"]++;
    });
    return TIME_SLOT_KEYS.map(key => ({ time: t(key), count: counts[key] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 bg-white/60 backdrop-blur border border-slate-100 rounded-3xl shadow-sm">
        <div className="animate-spin h-10 w-10 border-4 border-teal-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (emotions.length === 0) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="bg-white/60 backdrop-blur rounded-3xl border border-slate-100 shadow-sm py-16 text-center px-6">
        <div className="w-16 h-16 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarIcon className="h-8 w-8" />
        </div>
        <h3 className="font-bold text-slate-800 text-lg mb-1">{t("Begin Tracking")}</h3>
        <p className="text-slate-500 max-w-sm mx-auto text-sm">{t("No emotion data found. Please log some emotions to generate insights.")}</p>
      </div>
    );
  }

  const cardClass = "bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden hover:shadow-md hover:border-teal-200/60 transition-all duration-300";

  const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

  const legendItems = [
    { color: "bg-slate-50 border border-slate-100", label: t("Unlogged") },
    { color: "bg-emerald-50 border border-emerald-100", label: t("Low Positive") },
    { color: "bg-emerald-500", label: t("High Positive") },
    { color: "bg-amber-100 border border-amber-200", label: t("Balanced") },
    { color: "bg-rose-50 border border-rose-100", label: t("Low Negative") },
    { color: "bg-rose-500", label: t("High Negative") },
  ];

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-6">

      {/* Mood Trends */}
      <div className={cardClass}>
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">{t("Mood Trends")}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 ps-7">{t("Daily snapshot of positive and negative intensity scores")}</p>
          </div>
          <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)} className="w-auto shrink-0">
            <TabsList className="bg-slate-100 p-0.5 rounded-xl h-auto">
              <TabsTrigger value="week" className="rounded-lg text-xs py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-500 font-semibold">{t("Week")}</TabsTrigger>
              <TabsTrigger value="month" className="rounded-lg text-xs py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-500 font-semibold">{t("Month")}</TabsTrigger>
              <TabsTrigger value="year" className="rounded-lg text-xs py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-500 font-semibold">{t("Year")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={getMoodTrends()} margin={{ left: -10, right: 10, bottom: 5, top: 10 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div dir={isRTL ? "rtl" : "ltr"} className="bg-white/95 backdrop-blur-md p-3 border border-teal-100 rounded-xl shadow-xl">
                      <p className="font-bold text-slate-800 text-xs mb-1.5">{d.date}</p>
                      <div className="space-y-1 text-[11px] font-semibold">
                        <div className="flex items-center gap-2 justify-between">
                          <span className="text-emerald-600">{t("Positive Intensity:")}</span>
                          <span className="text-slate-800 font-extrabold">{tNum(d.positiveIntensity)}</span>
                        </div>
                        <div className="flex items-center gap-2 justify-between">
                          <span className="text-rose-600">{t("Negative Intensity:")}</span>
                          <span className="text-slate-800 font-extrabold">{tNum(d.negativeIntensity)}</span>
                        </div>
                        <div className="flex items-center gap-2 justify-between pt-1 border-t border-slate-100">
                          <span className="text-slate-500">{t("Tracked Entries:")}</span>
                          <span className="text-slate-800 font-extrabold">{tNum(d.count)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#475569' }} />
              <Line type="monotone" dataKey="positiveIntensity" stroke="#10b981" strokeWidth={3} name={t("Positive Emotions")} dot={{ r: 4, strokeWidth: 1, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="negativeIntensity" stroke="#ef4444" strokeWidth={3} name={t("Negative Emotions")} dot={{ r: 4, strokeWidth: 1, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Emotion Distribution */}
        <div className={cardClass}>
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 shrink-0">
                <PieChartIcon className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">{t("Emotion Distribution")}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 ps-7">{t("Breakdown of positive and negative emotions logged")}</p>
          </div>
          <div className="p-6 flex items-center justify-center min-h-[300px]">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={getEmotionDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${translateEmotion(name, currentLanguage)} ${(percent * 100).toFixed(0)}%`
                  }
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {getEmotionDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0];
                    return (
                      <div dir={isRTL ? "rtl" : "ltr"} className="bg-white/95 backdrop-blur-md py-1.5 px-3 border border-purple-50 rounded-xl shadow-lg text-xs font-semibold text-slate-800">
                        {translateEmotion(String(d.name), currentLanguage)}: <span className="font-extrabold text-teal-700">{tNum(d.value as number)}</span>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Patterns */}
        <div className={cardClass}>
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-pink-50 text-pink-600 shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">{t("Time Patterns")}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 ps-7">{t("Which parts of the day you track your feelings most")}</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={getTimePatterns()} margin={{ left: -20, right: 10, bottom: 5, top: 15 }}>
                <defs>
                  <linearGradient id="barPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.95} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.95} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#f8fafc" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(124, 58, 237, 0.05)', radius: [6, 6, 0, 0] } as any}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div dir={isRTL ? "rtl" : "ltr"} className="bg-white/95 backdrop-blur-md py-1.5 px-3 border border-purple-50 rounded-xl shadow-lg text-xs font-semibold text-slate-800">
                        {d.time}: <span className="font-extrabold text-teal-700">{tNum(d.count)} {t("records")}</span>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" fill="url(#barPurple)" radius={[6, 6, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Intensity Heatmap — kept dir=ltr so calendar flows Mon→Sun regardless of language */}
      <div className={cardClass}>
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">{t("Weekly Intensity Calendar")}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 ps-7">{t("Visual net wellness scale based on positive vs negative entries logged")}</p>
        </div>
        <div className="p-6">
          {/* Always LTR so Mon is always the leftmost column */}
          <div dir="ltr">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-3 mb-3">
              {DAY_KEYS.map(day => (
                <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-slate-400 tracking-wider uppercase">
                  {t(day)}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
              {getIntensityHeatmap().map((day, i) => {
                const { positiveIntensity, negativeIntensity, netIntensity, count, fullDate, isFuture } = day;
                const [mon, dayNum] = fullDate.split(" ");
                const translatedDate = `${t(mon)} ${tNum(dayNum)}`;

                let cellClass = "bg-slate-50 text-slate-300 border border-slate-100";
                if (isFuture) {
                  cellClass = "border border-dashed border-slate-200 bg-slate-50/20 text-slate-300/40 opacity-40 cursor-not-allowed";
                } else if (count > 0) {
                  if (netIntensity > 0) {
                    cellClass = netIntensity <= 3
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-100 hover:border-emerald-300 shadow-sm"
                      : netIntensity <= 6
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-200 hover:border-emerald-400 shadow-sm"
                        : "bg-emerald-500 text-white border border-emerald-600 hover:bg-emerald-600 shadow-md shadow-emerald-100/50";
                  } else if (netIntensity < 0) {
                    const abs = Math.abs(netIntensity);
                    cellClass = abs <= 3
                      ? "bg-rose-50 text-rose-800 border border-rose-100 hover:border-rose-300 shadow-sm"
                      : abs <= 6
                        ? "bg-rose-100 text-rose-900 border border-rose-200 hover:border-rose-400 shadow-sm"
                        : "bg-rose-500 text-white border border-rose-600 hover:bg-rose-600 shadow-md shadow-rose-100/50";
                  } else {
                    cellClass = "bg-amber-100 text-amber-900 border border-amber-200 hover:border-amber-400 shadow-sm";
                  }
                } else {
                  cellClass = "bg-slate-50 text-slate-400 border border-slate-100 hover:border-slate-200";
                }

                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-2xl ${cellClass} flex flex-col items-center justify-center text-[10px] sm:text-xs font-semibold relative group p-1 transition-all duration-300 hover:scale-[1.06] hover:-translate-y-0.5 cursor-default`}
                  >
                    <span className="text-[9px] opacity-75">{tNum(dayNum)}</span>
                    {!isFuture && count > 0 && (
                      <span className="text-[10px] font-extrabold mt-0.5">{tNum(count)}</span>
                    )}
                    {!isFuture && (
                      <div dir={isRTL ? "rtl" : "ltr"} className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900/95 backdrop-blur-sm text-white text-[10px] rounded-xl px-2.5 py-1.5 whitespace-nowrap z-10 shadow-xl border border-slate-800 pointer-events-none transition-all duration-200 font-medium">
                        <p className="font-bold text-slate-200 mb-1 border-b border-slate-700/60 pb-0.5">{translatedDate}</p>
                        <div className="space-y-0.5 text-slate-300">
                          <p>{t("Positive Intensity:")} <span className="text-emerald-400 font-bold">{tNum(positiveIntensity.toFixed(1))}</span></p>
                          <p>{t("Negative Intensity:")} <span className="text-rose-400 font-bold">{tNum(negativeIntensity.toFixed(1))}</span></p>
                          <p>{t("Total Entries:")} <span className="text-white font-bold">{tNum(count)}</span></p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-3 mt-6 text-xs text-slate-500 font-semibold flex-wrap">
            {legendItems.map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded-md shrink-0 ${color}`} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
