import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, Users, Heart, Brain, Flag, BookOpen, Activity, 
  UserCheck, AlertTriangle, Medal, Share2, BookmarkCheck, Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { z } from "zod";

// Validate the aggregate contract before rendering counts or doing arithmetic.
// Do not coerce missing/null/string values into plausible-looking statistics.
const adminStatsSchema = z.object({
  totalUsers: z.number().finite(),
  totalClients: z.number().finite(),
  totalTherapists: z.number().finite(),
  totalEmotions: z.number().finite(),
  totalThoughts: z.number().finite(),
  totalGoals: z.number().finite(),
  totalResources: z.number().int().nonnegative().nullish().transform(value => value ?? null),
  activeClients: z.number().finite(),
  activeTherapists: z.number().finite(),
  resourceUsage: z.number().finite(),
  clientsWithoutTherapist: z.number().finite(),
  therapistsWithoutClients: z.number().finite(),
  clientsWithGoals: z.number().finite(),
  averageGoalsPerClient: z.number().finite(),
  averageEmotionsPerClient: z.number().finite(),
  mostActiveTherapist: z.string(),
  mostActiveClient: z.string(),
  mostUsedResource: z.string(),
  topResources: z.array(z.object({
    id: z.number().finite(),
    title: z.string(),
    usageCount: z.number().finite(),
  })),
});

// Stats card component
const StatCard = ({
  title,
  value,
  description,
  icon,
  colorClass = "text-primary",
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  colorClass?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className={`${colorClass}`}>{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClients: 0,
    totalTherapists: 0,
    totalEmotions: 0,
    totalThoughts: 0,
    totalGoals: 0,
    totalResources: null as number | null,
    activeClients: 0,
    activeTherapists: 0,
    resourceUsage: 0,
    clientsWithoutTherapist: 0,
    therapistsWithoutClients: 0,
    clientsWithGoals: 0,
    averageGoalsPerClient: 0,
    averageEmotionsPerClient: 0,
    mostActiveTherapist: '',
    mostActiveClient: '',
    mostUsedResource: '',
    topResources: [] as any[],
  });
  const [loadStatus, setLoadStatus] = useState<"loading" | "error" | "success">("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);

  // Get system stats when the component mounts
  useEffect(() => {
    if (!user) return;
    // Only admins should be able to access this page
    if (user.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    let cancelled = false;
    const fetchStats = async () => {
      setLoadStatus("loading");
      try {
        // Fetch admin stats from our dedicated endpoint
        const response = await apiRequest("GET", "/api/admin/stats");
        const result = adminStatsSchema.safeParse(await response.json());
        if (!result.success) {
          // Keep response contents out of errors: they can contain client names.
          throw new Error("Invalid admin statistics response");
        }
        
        // Update state with real data from the server
        if (cancelled) return;
        setStats(result.data);
        setLoadStatus("success");
      } catch (error) {
        if (cancelled) return;
        setLoadStatus("error");
        console.error("Error fetching stats:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      }
    };

    fetchStats();
    return () => { cancelled = true; };
  }, [user, navigate, toast, loadAttempt]);

  if (loadStatus === "loading") {
    return (
      <Layout title="Admin Dashboard">
        <div role="status" className="flex items-center justify-center gap-2 min-h-[500px]">
          <Loader2 aria-hidden="true" className="h-8 w-8 animate-spin text-primary" />
          <span>Loading dashboard statistics…</span>
        </div>
      </Layout>
    );
  }

  if (loadStatus === "error") {
    return (
      <Layout title="Admin Dashboard">
        <div className="container mx-auto px-4 py-6">
          <h1 className="mb-6 text-2xl font-bold">Admin Dashboard</h1>
          <Alert variant="destructive">
            <AlertTriangle aria-hidden="true" className="h-4 w-4" />
            <AlertTitle>Unable to load dashboard statistics</AlertTitle>
            <AlertDescription>
              Statistics are unavailable right now. This does not mean the system has no records.
            </AlertDescription>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => {
                setLoadStatus("loading");
                setLoadAttempt(attempt => attempt + 1);
              }}
            >
              Retry
            </Button>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System-wide overview and statistics
          </p>
        </div>

        <Tabs defaultValue="overview" className="min-w-0 space-y-4">
          <div className="max-w-full overflow-x-auto" data-testid="admin-tab-scroll">
            <TabsList className="w-max">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="relationships">Therapist-Client</TabsTrigger>
              <TabsTrigger value="users">User Stats</TabsTrigger>
              <TabsTrigger value="content">Content Stats</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                description="All registered users in the system"
                icon={<Users className="h-4 w-4" />}
                colorClass="text-primary"
              />
              <StatCard
                title="Total Clients"
                value={stats.totalClients}
                description="All registered clients"
                icon={<Users className="h-4 w-4" />}
                colorClass="text-blue-500"
              />
              <StatCard
                title="Total Therapists"
                value={stats.totalTherapists}
                description="All registered therapists"
                icon={<Users className="h-4 w-4" />}
                colorClass="text-green-500"
              />
              <StatCard
                title="System Health"
                value="Unavailable"
                description="System health measurements are not available"
                icon={<Activity className="h-4 w-4" />}
                colorClass="text-muted-foreground"
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>System Activity</CardTitle>
                  <CardDescription>Recent actions and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Activity trends are unavailable. No time-series data is provided.
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Clients</span>
                      <span className="font-medium">{stats.activeClients}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Therapists</span>
                      <span className="font-medium">{stats.activeTherapists}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Emotion Records</span>
                      <span className="font-medium">{stats.totalEmotions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Resource Usage</span>
                      <span className="font-medium">{stats.resourceUsage}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Clients Without Therapist</span>
                      <span className="font-medium text-amber-500">{stats.clientsWithoutTherapist}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Most Used Resource</span>
                      <span className="font-medium text-primary text-xs">{stats.mostUsedResource}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Therapist-Client Relationship Tab */}
          <TabsContent value="relationships" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Clients Assigned"
                value={stats.totalClients - stats.clientsWithoutTherapist}
                description="Clients with a therapist"
                icon={<UserCheck className="h-4 w-4" />}
                colorClass="text-green-500"
              />
              <StatCard
                title="Unassigned Clients"
                value={stats.clientsWithoutTherapist}
                description="Clients without a therapist"
                icon={<AlertTriangle className="h-4 w-4" />}
                colorClass="text-amber-500"
              />
              <StatCard
                title="Therapists with Clients"
                value={stats.totalTherapists - stats.therapistsWithoutClients}
                description="Therapists with at least one client"
                icon={<Share2 className="h-4 w-4" />}
                colorClass="text-blue-500"
              />
              <StatCard
                title="Unassigned Therapists"
                value={stats.therapistsWithoutClients}
                description="Therapists without any clients"
                icon={<AlertTriangle className="h-4 w-4" />}
                colorClass="text-red-500"
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Client Progress</CardTitle>
                  <CardDescription>Goal completion statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Clients with Goals</span>
                      <span className="font-medium">{stats.clientsWithGoals}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg. Goals per Client</span>
                      <span className="font-medium">{stats.averageGoalsPerClient}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg. Emotions per Client</span>
                      <span className="font-medium">{stats.averageEmotionsPerClient}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Most Active Therapist</span>
                      <span className="font-medium">{stats.mostActiveTherapist}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Most Active Client</span>
                      <span className="font-medium">{stats.mostActiveClient}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Resource Usage</CardTitle>
                  <CardDescription>Most used resources by therapist-client pairs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.topResources && stats.topResources.length > 0 ? (
                      stats.topResources.map((resource: any, index: number) => (
                        <div key={index} className="flex items-center space-x-2 rounded-md bg-slate-50 p-2">
                          <BookmarkCheck className="h-4 w-4 text-primary" />
                          <span className="flex-grow text-sm font-medium">{resource.title}</span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {resource.useCount} {resource.useCount === 1 ? 'use' : 'uses'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-4">
                        No resource usage data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>New users over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    User growth trends are unavailable. No time-series data is provided.
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>User Breakdown</CardTitle>
                  <CardDescription>Distribution by role</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    User role chart is unavailable. See Overview for user totals.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Emotions Tracked"
                value={stats.totalEmotions}
                description="Total emotion records"
                icon={<Heart className="h-4 w-4" />}
                colorClass="text-red-500"
              />
              <StatCard
                title="Thought Records"
                value={stats.totalThoughts}
                description="Total thought records"
                icon={<Brain className="h-4 w-4" />}
                colorClass="text-teal-600"
              />
              <StatCard
                title="Goals Created"
                value={stats.totalGoals}
                description="Total goal records"
                icon={<Flag className="h-4 w-4" />}
                colorClass="text-amber-500"
              />
              <StatCard
                title="Resources"
                value={Number.isInteger(stats.totalResources) && stats.totalResources !== null && stats.totalResources >= 0
                  ? stats.totalResources : "Unavailable"}
                description={Number.isInteger(stats.totalResources) && stats.totalResources !== null && stats.totalResources >= 0
                  ? "Resources in library" : "Resource count is not available"}
                icon={<BookOpen className="h-4 w-4" />}
                colorClass="text-emerald-500"
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Content Activity</CardTitle>
                <CardDescription>Record creation over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Content activity trends are unavailable. No time-series data is provided.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
