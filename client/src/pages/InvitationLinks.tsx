import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CopyIcon, CheckIcon, LinkIcon, SendIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface InvitationLink {
  id: number;
  email: string;
  name: string;
  link: string;
  copied: boolean;
}

export default function InvitationLinks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [links, setLinks] = useState<InvitationLink[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  
  // Generate an invitation link
  const generateInvitationMutation = useMutation({
    mutationFn: async (data: { email: string; name: string }) => {
      const response = await apiRequest("POST", "/api/users/invite-client", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create invitation");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Create a new link entry with a unique ID
      const newLink: InvitationLink = {
        id: Date.now(),
        email: email,
        name: name,
        link: data.inviteLink || `${window.location.origin}/auth?invitation=true&email=${encodeURIComponent(email)}&therapistId=${user?.id}`,
        copied: false
      };
      
      // Add the new link to our list
      setLinks(prev => [...prev, newLink]);
      
      // Reset the form
      setEmail("");
      setName("");
      
      toast({
        title: "Invitation Link Created",
        description: `A link for ${name} has been created and is ready to share.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Link",
        description: error.message || "Failed to create invitation link. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and name to create an invitation link.",
        variant: "destructive",
      });
      return;
    }
    
    generateInvitationMutation.mutate({ email, name });
  };
  
  // Copy link to clipboard
  const copyLink = (id: number) => {
    const link = links.find(l => l.id === id);
    if (link) {
      navigator.clipboard.writeText(link.link).then(() => {
        // Mark this specific link as copied
        setLinks(links.map(l => 
          l.id === id ? { ...l, copied: true } : l
        ));
        
        // Reset the copied status after 2 seconds
        setTimeout(() => {
          setLinks(links.map(l => 
            l.id === id ? { ...l, copied: false } : l
          ));
        }, 2000);
        
        toast({
          title: "Link Copied",
          description: "The invitation link has been copied to your clipboard."
        });
      }).catch(err => {
        toast({
          title: "Copy Failed",
          description: "Unable to copy the link. Please try again.",
          variant: "destructive",
        });
      });
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Create Invitation Links</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate New Invitation Link</CardTitle>
          <CardDescription>
            Create a personalized invitation link for someone to join Resilience CBT.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="client@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          </form>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleSubmit}
            disabled={generateInvitationMutation.isPending}
          >
            {generateInvitationMutation.isPending ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              <span className="flex items-center">
                <LinkIcon className="mr-2 h-4 w-4" />
                Generate Link
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <h2 className="text-2xl font-semibold mb-4">Your Invitation Links</h2>
      {links.length === 0 ? (
        <Card className="bg-blue-50 border-blue-200 border">
          <CardContent className="pt-6 text-center">
            <LinkIcon className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <p className="text-blue-800">No invitation links generated yet. Create your first link above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {links.map((link) => (
            <Card key={link.id} className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{link.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyLink(link.id)}
                    className="h-8 gap-1"
                  >
                    {link.copied ? (
                      <>
                        <CheckIcon className="h-4 w-4 text-green-500" />
                        <span className="text-green-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="h-4 w-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </CardTitle>
                <CardDescription>{link.email}</CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="bg-blue-50 rounded p-3 text-sm font-mono break-all">
                  {link.link}
                </div>
              </CardContent>
              
              <CardFooter className="justify-between">
                <div className="text-xs text-neutral-500">
                  Generated {new Date().toLocaleString()}
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <SendIcon className="h-4 w-4" />
                  <span>Send via Email</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}