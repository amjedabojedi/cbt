import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Users, BookText, Goal, Brain, ListChecks, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { User as UserType } from "@shared/schema";

export default function TherapistStats() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch therapist's clients
  const { data: clients, isLoading: isLoadingClients } = useQuery<UserType[]>({
    queryKey: [`/api/users/clients`],
    enabled: !!user && user.role === "therapist",
  });

  // Fetch therapist's client journal entries stats
  const { data: journalStats, isLoading: isLoadingJournalStats } = useQuery<{ totalCount: number }>({
    queryKey: [`/api/therapist/stats/journal`],
    enabled: !!user && user.role === "therapist",
    placeholderData: { totalCount: 0 }
  });

  // Fetch therapist's client thought records stats
  const { data: thoughtStats, isLoading: isLoadingThoughtStats } = useQuery<{ totalCount: number }>({
    queryKey: [`/api/therapist/stats/thoughts`],
    enabled: !!user && user.role === "therapist",
    placeholderData: { totalCount: 0 }
  });

  // Fetch therapist's client goals stats
  const { data: goalStats, isLoading: isLoadingGoalStats } = useQuery<{ totalCount: number }>({
    queryKey: [`/api/therapist/stats/goals`],
    enabled: !!user && user.role === "therapist",
    placeholderData: { totalCount: 0 }
  });

  // Client count by activity status
  const clientStats = {
    total: clients?.length || 0,
    active: clients?.filter(c => c.status === "active").length || 0,
    new: clients?.filter(c => {
      // Consider clients registered in the last 14 days as "new"
      if (!c.createdAt) return false;
      const created = new Date(c.createdAt);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      return created > twoWeeksAgo;
    }).length || 0,
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Practice Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Client Activity</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <StatCard 
                title="Total Clients" 
                value={clientStats.total} 
                icon={<Users className="h-5 w-5" />}
                color="blue"
                isLoading={isLoadingClients}
              />
              <StatCard 
                title="Active Clients" 
                value={clientStats.active} 
                icon={<User className="h-5 w-5" />}
                color="green"
                isLoading={isLoadingClients}
              />
              <StatCard 
                title="New Clients (14d)" 
                value={clientStats.new} 
                icon={<User className="h-5 w-5" />}
                color="purple"
                isLoading={isLoadingClients}
              />
              <StatCard 
                title="Journal Entries" 
                value={journalStats?.totalCount || 0} 
                icon={<BookText className="h-5 w-5" />}
                color="indigo"
                isLoading={isLoadingJournalStats}
              />
              <StatCard 
                title="Thought Records" 
                value={thoughtStats?.totalCount || 0} 
                icon={<Brain className="h-5 w-5" />}
                color="pink"
                isLoading={isLoadingThoughtStats}
              />
              <StatCard 
                title="Active Goals" 
                value={goalStats?.totalCount || 0} 
                icon={<Goal className="h-5 w-5" />}
                color="amber"
                isLoading={isLoadingGoalStats}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="activity">
            <div className="mt-4 space-y-4">
              <p className="text-neutral-500 text-sm">Recent client activity across your practice:</p>
              
              {isLoadingClients ? (
                <div className="p-8 text-center">
                  <div className="animate-spin inline-block w-8 h-8 border-2 border-current border-t-transparent text-primary rounded-full mb-4"></div>
                  <p className="text-neutral-500">Loading client activity data...</p>
                </div>
              ) : clients && clients.length > 0 ? (
                <div className="space-y-2">
                  <ActivityItem 
                    title="Your Active Clients"
                    items={clients
                      .filter(client => client.status === "active")
                      .map(client => ({ 
                        label: client.name || client.username, 
                        value: "" 
                      })).slice(0, 5)}
                    icon={<ListChecks className="h-5 w-5 text-blue-500" />}
                    isLoading={isLoadingClients}
                  />
                </div>
              ) : (
                <div className="text-center p-6 border border-dashed border-neutral-200 rounded-lg">
                  <p className="text-neutral-500">No client activity data available yet.</p>
                  <p className="text-neutral-400 text-sm mt-1">Activity will appear as clients use the platform.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="engagement">
            <div className="mt-4 space-y-4">
              <p className="text-neutral-500 text-sm">Client engagement with therapy components:</p>
              
              <div className="flex items-center justify-center p-8 border border-dashed border-neutral-200 rounded-lg">
                <div className="text-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="40" 
                    height="40" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="mx-auto mb-4 text-neutral-400"
                  >
                    <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"></path>
                    <path d="M2 20h20"></path>
                    <path d="M14 12v.01"></path>
                  </svg>
                  <h3 className="font-medium mb-1">No Engagement Data Yet</h3>
                  <p className="text-neutral-500 text-sm max-w-xs mx-auto">
                    Engagement statistics will be available as clients interact with the platform.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  color = "blue",
  isLoading
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "indigo" | "pink" | "amber";
  isLoading: boolean;
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
    indigo: "bg-indigo-50 text-indigo-700",
    pink: "bg-pink-50 text-pink-700",
    amber: "bg-amber-50 text-amber-700",
  };
  
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
          {isLoading ? (
            <Skeleton className="h-6 w-12 mt-1" />
          ) : (
            <p className="text-xl font-bold">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ 
  title, 
  items,
  icon,
  isLoading
}: { 
  title: string; 
  items: { label: string; value: string }[];
  icon: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <div className="border border-neutral-200 rounded-lg p-4">
      <div className="flex items-center mb-3">
        {icon}
        <h3 className="text-sm font-medium ml-2">{title}</h3>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-sm">{item.label}</span>
              <span className="text-sm text-neutral-500">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EngagementBar({ 
  label, 
  percentage, 
  color,
  isLoading
}: { 
  label: string; 
  percentage: number; 
  color: string;
  isLoading: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs font-medium">{percentage}%</span>
      </div>
      
      {isLoading ? (
        <Skeleton className="h-2 w-full rounded-full" />
      ) : (
        <div className="h-2 bg-neutral-100 rounded-full">
          <div 
            className={`h-2 rounded-full ${color}`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}