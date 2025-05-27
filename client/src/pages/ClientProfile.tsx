import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/lib/auth";
import { useClientContext } from "@/context/ClientContext";
import { User, Heart, Brain, BookOpen, Target, BarChart3, Calendar, Mail, Phone, ArrowLeft } from "lucide-react";
import { User as UserType } from "@shared/schema";

export default function ClientProfile() {
  const { clientId } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { setViewingClient } = useClientContext();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch client details
  const { data: client, isLoading: isLoadingClient } = useQuery<UserType>({
    queryKey: [`/api/users/${clientId}`],
    enabled: !!clientId && !!user && user.role === "therapist",
  });

  // Fetch client's recent emotions
  const { data: emotions = [], isLoading: isLoadingEmotions } = useQuery<any[]>({
    queryKey: [`/api/users/${clientId}/emotions`],
    enabled: !!clientId && !!user && user.role === "therapist",
  });

  // Fetch client's recent journal entries
  const { data: journals = [], isLoading: isLoadingJournals } = useQuery<any[]>({
    queryKey: [`/api/users/${clientId}/journal`],
    enabled: !!clientId && !!user && user.role === "therapist",
  });

  // Fetch client's thought records
  const { data: thoughts = [], isLoading: isLoadingThoughts } = useQuery<any[]>({
    queryKey: [`/api/users/${clientId}/thoughts`],
    enabled: !!clientId && !!user && user.role === "therapist",
  });

  // Fetch client's goals
  const { data: goals = [], isLoading: isLoadingGoals } = useQuery<any[]>({
    queryKey: [`/api/users/${clientId}/goals`],
    enabled: !!clientId && !!user && user.role === "therapist",
  });

  const handleViewSection = (section: string) => {
    if (!client) return;
    
    setViewingClient(client.id, client.name || client.username);
    localStorage.setItem('viewingClientId', client.id.toString());
    localStorage.setItem('viewingClientName', client.name || client.username);
    
    switch (section) {
      case "emotions":
        navigate("/emotions");
        break;
      case "thoughts":
        navigate("/thoughts");
        break;
      case "journal":
        navigate("/journal");
        break;
      case "goals":
        navigate("/goals");
        break;
      case "dashboard":
        navigate("/dashboard");
        break;
    }
  };

  if (isLoadingClient) {
    return (
      <AppLayout title="Client Profile">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">Loading client profile...</div>
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout title="Client Profile">
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-medium mb-2">Client Not Found</h3>
              <p className="text-neutral-500 mb-4">
                The client profile you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Button onClick={() => navigate("/clients")}>
                Back to Clients
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`${client.name || client.username} - Profile`}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/clients")}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-800">
                {client.name || client.username}
              </h1>
              <p className="text-neutral-500">{client.email}</p>
            </div>
          </div>
          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
            {client.status || 'Active'}
          </Badge>
        </div>

        {/* Client Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-500">Full Name</label>
                <p className="text-neutral-800">{client.name || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-500">Email</label>
                <p className="text-neutral-800">{client.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-500">Member Since</label>
                <p className="text-neutral-800">
                  {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : "Unknown"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
            onClick={() => handleViewSection("emotions")}
          >
            <Heart className="h-6 w-6 mb-2 text-red-500" />
            <span className="text-sm">Emotions</span>
            <span className="text-xs text-neutral-500">
              {emotions?.length || 0} records
            </span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
            onClick={() => handleViewSection("thoughts")}
          >
            <Brain className="h-6 w-6 mb-2 text-purple-500" />
            <span className="text-sm">Thoughts</span>
            <span className="text-xs text-neutral-500">
              {thoughts?.length || 0} records
            </span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
            onClick={() => handleViewSection("journal")}
          >
            <BookOpen className="h-6 w-6 mb-2 text-green-500" />
            <span className="text-sm">Journal</span>
            <span className="text-xs text-neutral-500">
              {journals?.length || 0} entries
            </span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
            onClick={() => handleViewSection("goals")}
          >
            <Target className="h-6 w-6 mb-2 text-blue-500" />
            <span className="text-sm">Goals</span>
            <span className="text-xs text-neutral-500">
              {goals?.length || 0} goals
            </span>
          </Button>
          
          <Button
            variant="default"
            className="flex flex-col items-center p-4 h-auto"
            onClick={() => handleViewSection("dashboard")}
          >
            <BarChart3 className="h-6 w-6 mb-2" />
            <span className="text-sm">Dashboard</span>
            <span className="text-xs">View all data</span>
          </Button>
        </div>

        {/* Detailed Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Emotions</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingEmotions ? (
                    <p className="text-neutral-500">Loading...</p>
                  ) : emotions && emotions.length > 0 ? (
                    <div className="space-y-2">
                      {emotions.slice(0, 3).map((emotion: any) => (
                        <div key={emotion.id} className="flex justify-between items-center p-2 bg-neutral-50 rounded">
                          <span className="font-medium">{emotion.coreEmotion}</span>
                          <span className="text-sm text-neutral-500">
                            {new Date(emotion.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500">No emotion records yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Journal Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingJournals ? (
                    <p className="text-neutral-500">Loading...</p>
                  ) : journals && journals.length > 0 ? (
                    <div className="space-y-2">
                      {journals.slice(0, 3).map((journal: any) => (
                        <div key={journal.id} className="p-2 bg-neutral-50 rounded">
                          <p className="font-medium text-sm">{journal.title}</p>
                          <p className="text-xs text-neutral-500">
                            {new Date(journal.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500">No journal entries yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Recent activity items would go here */}
                  <p className="text-neutral-500">Activity timeline feature coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{emotions?.length || 0}</div>
                    <div className="text-sm text-blue-600">Emotion Records</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{journals?.length || 0}</div>
                    <div className="text-sm text-green-600">Journal Entries</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{thoughts?.length || 0}</div>
                    <div className="text-sm text-purple-600">Thought Records</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{goals?.length || 0}</div>
                    <div className="text-sm text-orange-600">Goals Set</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Therapist Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-500">Therapist notes feature coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}