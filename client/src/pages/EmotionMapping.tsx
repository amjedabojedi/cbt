import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Heart, Search, Link, Network } from "lucide-react";
import RelatedEmotionsPanel from "@/components/emotions/RelatedEmotionsPanel";

export default function EmotionMapping() {
  const { user } = useAuth();
  const [searchEmotion, setSearchEmotion] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [activeTab, setActiveTab] = useState("taxonomy");
  
  // Get the emotion taxonomy
  const { data: taxonomyData, isLoading: isLoadingTaxonomy } = useQuery({
    queryKey: ['/api/emotions/taxonomy'],
  });
  
  // Get related emotions when an emotion is selected
  const { data: relatedData, isLoading: isLoadingRelated } = useQuery({
    queryKey: ['/api/emotions/related', selectedEmotion],
    enabled: !!selectedEmotion,
  });
  
  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchEmotion) {
      setSelectedEmotion(searchEmotion);
    }
  };
  
  // Handle selecting an emotion from the taxonomy
  const handleSelectEmotion = (emotion: string) => {
    setSelectedEmotion(emotion);
    setSearchEmotion(emotion);
    setActiveTab("related");
  };
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access this feature.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Emotion Mapping & Integration</h1>
        <p className="text-muted-foreground">
          Explore connections between emotions and find related content across the application.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Emotions
            </CardTitle>
            <CardDescription>
              Search for an emotion to see its classification and related content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <Input
                placeholder="Type an emotion (e.g., anxiety, joy, frustration)"
                value={searchEmotion}
                onChange={(e) => setSearchEmotion(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Search</Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="taxonomy">Emotion Taxonomy</TabsTrigger>
              <TabsTrigger value="related" disabled={!selectedEmotion}>
                Related Emotions
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="taxonomy" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Emotion Classification
                  </CardTitle>
                  <CardDescription>
                    All emotions are organized into families based on core emotions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingTaxonomy ? (
                    <div className="flex justify-center p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="w-full">
                      {taxonomyData?.coreEmotions.map((coreEmotion: string) => (
                        <AccordionItem key={coreEmotion} value={coreEmotion}>
                          <AccordionTrigger className="text-lg font-medium">
                            {coreEmotion}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="flex flex-wrap gap-2 pt-2">
                              {taxonomyData?.emotionFamilies[coreEmotion]?.map((emotion: string) => (
                                <Badge 
                                  key={emotion}
                                  variant="outline"
                                  className="cursor-pointer hover:bg-accent"
                                  onClick={() => handleSelectEmotion(emotion)}
                                >
                                  {emotion}
                                </Badge>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="related" className="space-y-4 mt-4">
              {selectedEmotion && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Link className="h-5 w-5 text-primary" />
                      Emotion Relationships
                    </CardTitle>
                    <CardDescription>
                      Showing emotions related to "{selectedEmotion}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingRelated ? (
                      <div className="flex justify-center p-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Core Emotion:</h3>
                          <Badge variant="default" className="text-base py-1.5">
                            {relatedData?.coreEmotion}
                          </Badge>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-2">Related Emotions:</h3>
                          <div className="flex flex-wrap gap-2">
                            {relatedData?.relatedEmotions.map((emotion: string) => (
                              <Badge 
                                key={emotion}
                                variant={emotion === selectedEmotion ? "default" : "outline"}
                                className={`${
                                  emotion === selectedEmotion 
                                    ? "ring-2 ring-offset-1" 
                                    : "hover:bg-accent cursor-pointer"
                                }`}
                                onClick={() => emotion !== selectedEmotion && handleSelectEmotion(emotion)}
                              >
                                {emotion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          {selectedEmotion && user?.id && (
            <RelatedEmotionsPanel
              emotion={selectedEmotion}
              userId={user.id}
            />
          )}
        </div>
      </div>
    </div>
  );
}