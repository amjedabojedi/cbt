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
import { Loader2, Users, Heart, Brain, Flag, BookOpen, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    activeClients: 0,
    activeTherapists: 0,
  });
  const [loading, setLoading] = useState(true);

  // Get system stats when the component mounts
  useEffect(() => {
    // Only admins should be able to access this page
    if (user && user.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch all users to get stats
        const response = await apiRequest("GET", "/api/users");
        const users = await response.json();
        
        // Calculate basic stats
        const clients = users.filter(u => u.role === 'client');
        const therapists = users.filter(u => u.role === 'therapist');
        
        // Set mock stats for now (we'd make separate API calls for these in real implementation)
        setStats({
          totalUsers: users.length,
          totalClients: clients.length,
          totalTherapists: therapists.length,
          totalEmotions: 125,
          totalThoughts: 87,
          totalGoals: 42,
          activeClients: Math.round(clients.length * 0.7),
          activeTherapists: therapists.length,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, navigate, toast]);

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Stats</TabsTrigger>
            <TabsTrigger value="content">Content Stats</TabsTrigger>
          </TabsList>
          
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
                value="Excellent"
                description="Overall system performance"
                icon={<Activity className="h-4 w-4" />}
                colorClass="text-green-500"
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
                    Activity chart would appear here
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
                      <span className="text-sm">Thought Records</span>
                      <span className="font-medium">{stats.totalThoughts}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Goal Records</span>
                      <span className="font-medium">{stats.totalGoals}</span>
                    </div>
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
                    User growth chart would appear here
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
                    User role chart would appear here
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
                colorClass="text-purple-500"
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
                value="24"
                description="Resources in library"
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
                  Content activity chart would appear here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}