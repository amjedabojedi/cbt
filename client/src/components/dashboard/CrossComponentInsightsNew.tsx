import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis,
  ReferenceLine,
  ComposedChart
} from 'recharts';
import { Separator } from '@/components/ui/separator';
import useActiveUser from '@/hooks/use-active-user';
import { Link2, Lightbulb, ArrowRightLeft, Maximize2, ShieldCheck, Zap } from 'lucide-react';
import { getEmotionColor, stringToColor, CHART_COLORS } from '@/lib/colors';

export default function CrossComponentInsights() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cross-Component Insights</CardTitle>
        <CardDescription>
          Discover patterns and relationships across your emotional records, journals, and thought records.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="strategies">
          <TabsList className="mb-4">
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
          </TabsList>
          <TabsContent value="strategies">
            <Tabs defaultValue="coping">
              <TabsList className="mb-4">
                <TabsTrigger value="coping">Coping Strategies</TabsTrigger>
                <TabsTrigger value="factors">Protective Factors</TabsTrigger>
              </TabsList>
              <TabsContent value="factors" className="space-y-4">
                <div className="flex flex-col">
                  <h3 className="text-sm font-medium">Protective Factors Usage & Effectiveness</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    This chart shows the relationship between how often you utilize each protective factor and how effective it is.
                  </p>
                  
                  {/* Combined chart showing both usage and effectiveness */}
                  <div className="h-[430px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={[
                          { name: "Positive relationships", count: 5, effectiveness: 8 },
                          { name: "Self-care routine", count: 3, effectiveness: 7 },
                          { name: "Value system", count: 2, effectiveness: 6 },
                          { name: "Future orientation", count: 1, effectiveness: 5 }
                        ]}
                        margin={{ top: 20, right: 50, left: 30, bottom: 150 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} />
                        <XAxis 
                          type="number"
                          label={{ 
                            value: 'Usage Count & Effectiveness', 
                            position: 'bottom', 
                            offset: 15,
                            style: { textAnchor: 'middle', fontWeight: 'bold' }
                          }}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={150}
                          tick={{ fontSize: 14 }}
                        />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === 'Usage Count') return [`${value} times`, 'Usage'];
                            if (name === 'Effectiveness') return [`${value}/10`, 'Effectiveness'];
                            return [value, name];
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={100} 
                          wrapperStyle={{ paddingTop: "80px" }}
                        />
                        <Bar 
                          dataKey="count"
                          name="Usage Count"
                          barSize={20}
                          fill="#5a61d6"
                        />
                        <Line
                          type="monotone"
                          dataKey="effectiveness"
                          name="Effectiveness"
                          stroke="#22c55e"
                          strokeWidth={3}
                          dot={{ fill: '#22c55e', strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                        <ReferenceLine 
                          y={5} 
                          strokeWidth={2}
                          stroke="#ff7777" 
                          strokeDasharray="3 3" 
                          label={{ 
                            value: 'Average (5/10)', 
                            position: 'right',
                            style: { fill: '#666', fontSize: 12, fontWeight: 'bold' } 
                          }} 
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}