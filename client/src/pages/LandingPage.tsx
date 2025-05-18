import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, Brain, Heart, Shield, Target, Book, MessageCircle, 
  BarChart3, Smartphone, Activity, BookOpen, BrainCircuit, 
  Users, LineChart, FileText, LibraryBig, CheckCircle 
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import CbtToolsSection from '@/components/landing/CbtToolsSection';

export default function LandingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Flag that we've seen the landing page first (prevents unwanted redirects)
    sessionStorage.setItem('landing_page_first', 'true');
    
    // Check if device is mobile using localStorage value set by MobileRedirector
    const mobileFlag = localStorage.getItem('isMobileDevice');
    setIsMobile(mobileFlag === 'true');
    
    // Make sure we detect mobile even if MobileRedirector hasn't run yet
    if (mobileFlag === null) {
      const detectMobile = () => {
        const userAgentCheck = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const screenWidthCheck = window.innerWidth < 768;
        const touchCheck = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        let mobileSignals = 0;
        if (userAgentCheck) mobileSignals++;
        if (screenWidthCheck) mobileSignals++;
        if (touchCheck) mobileSignals++;
        
        return mobileSignals >= 2;
      };
      
      const isMobile = detectMobile();
      localStorage.setItem('isMobileDevice', isMobile ? 'true' : 'false');
      setIsMobile(isMobile);
      
      console.log('Landing page detected mobile status:', isMobile);
    }
    
    // If user is logged in, redirect to dashboard
    if (user) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Hero Section */}
      <header className="container mx-auto px-4 pt-24 pb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6">
          ResilienceHub™
        </h1>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-primary mb-4">What Is ResilienceHub™?</h2>
          <p className="text-lg text-neutral-700 max-w-3xl mx-auto mb-4">
            ResilienceHub™ is an interactive mental health support tool that helps individuals track and understand 
            their emotional patterns, thought processes, and daily progress. It encourages self-reflection, 
            builds emotional awareness, and supports healthier thinking habits through structured, evidence-informed tools.
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-3xl mx-auto mb-8">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> This app works alongside therapy—not as a replacement—to strengthen personal reflection 
            and improve between-session engagement. These tools are most effective when used with a qualified mental health professional.
          </p>
        </div>
        
        {isMobile ? (
          /* Mobile-specific header content */
          <div className="flex flex-col gap-6 max-w-md mx-auto">
            <Button asChild size="lg" className="gap-2 bg-primary hover:bg-primary/90">
              <Link href="/m/login">
                Login to App <Smartphone className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mt-2 text-left">
              <p className="text-sm text-blue-800">
                <strong>Mobile Users:</strong> You can view the app's features below before logging in. Use this special mobile login button when you're ready.
              </p>
            </div>
            
            <p className="text-sm text-neutral-700 text-center mt-2">
              Clients need an invitation from their mental health professional to access the platform.
              If you've received an invitation, check your email for the registration link.
            </p>
          </div>
        ) : (
          /* Desktop header content */
          <div className="flex flex-col gap-6 max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2 bg-primary hover:bg-primary/90">
                <Link href="/auth">
                  Log In / Register <ArrowRight size={18} />
                </Link>
              </Button>
            </div>
            
            {/* Mobile-specific login option */}
            <div className="mt-2 text-center">
              <p className="text-sm text-neutral-600 mb-2">
                <strong>Having trouble on mobile?</strong>
              </p>
              <Button asChild variant="outline" size="sm" className="gap-1">
                <Link href="/m/login">
                  Use Mobile Login
                </Link>
              </Button>
            </div>
            
            <p className="text-sm text-neutral-700 text-center">
              Clients need an invitation from their mental health professional to access the platform.
              If you've received an invitation, check your email for the registration link.
            </p>
          </div>
        )}
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Tools for Emotion and Behavior Tracking</h2>
        
        {/* Feature Flow Image */}
        <div className="mb-16">
          <h3 className="text-xl font-semibold text-center mb-8">How ResilienceHub™ Works</h3>
          <div className="max-w-4xl mx-auto">
            <img 
              src="/images/image_1747581873634.png" 
              alt="ResilienceHub™ Feature Usage Sequence" 
              className="w-full rounded-lg shadow-md"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="landing-feature-box rounded-lg p-6 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Emotion Tracking</h3>
            <p>
              Use the emotion wheel to record how you feel with intensity tracking. Spot emotional trends and gain greater self-awareness between sessions.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="landing-feature-box rounded-lg p-6 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Thought & Behavior Tools</h3>
            <p>
              Document thinking patterns using structured CBT tools. Track which coping strategies work best for you when managing difficult moments.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="landing-feature-box rounded-lg p-6 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Goal Setting</h3>
            <p>
              Create specific, measurable goals and break them into manageable steps. Monitor your progress consistently to maintain momentum.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="landing-feature-box rounded-lg p-6 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Book className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Simple Journaling</h3>
            <p>
              Reflect on your experiences with journal entries that help you process thoughts and feelings. Basic AI assistance helps spot recurring patterns in your writing.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="landing-feature-box rounded-lg p-6 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Progress Visualization</h3>
            <p>
              See connections between your recorded emotions, thoughts, and journal entries. View intuitive charts showing your activity and patterns over time.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="landing-feature-box rounded-lg p-6 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Professional Connection</h3>
            <p>
              Securely share your tracking data with your therapist. Receive feedback on your progress between sessions, enhancing the effectiveness of your professional support.
            </p>
          </div>
        </div>
      </section>

      {/* Research Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">Research-Based Tracking Tools</h2>
        <p className="text-center text-neutral-600 max-w-3xl mx-auto mb-12">
          Our tracking tools are designed based on scientific research that shows how systematically recording emotions, thoughts, and behaviors helps individuals better understand their patterns.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold mb-2 text-neutral-800">Better Emotion Recognition</h3>
            <p className="text-neutral-600 text-sm">
              Research shows that people who can identify specific emotions react less impulsively and manage stress better. Our emotion wheel helps build this important skill.
              <span className="block mt-2 text-xs italic">Based on research by Kashdan, Barrett, & McKnight (2015)</span>
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold mb-2 text-neutral-800">Effective Homework</h3>
            <p className="text-neutral-600 text-sm">
              Studies prove that completing thought records between therapy sessions leads to better outcomes for depression and anxiety. Our digital tools make this easier.
              <span className="block mt-2 text-xs italic">Based on research by Rees, McEvoy, & Nathan (2005)</span>
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold mb-2 text-neutral-800">Clear Goals Work Better</h3>
            <p className="text-neutral-600 text-sm">
              Setting specific, measurable goals improves motivation and success rates. Our SMART goal system helps break down big changes into achievable steps.
              <span className="block mt-2 text-xs italic">Based on research by Locke & Latham (2002)</span>
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold mb-2 text-neutral-800">Building Resilience</h3>
            <p className="text-neutral-600 text-sm">
              Tracking what helps you cope during difficult times builds lasting resilience. Our tools help identify your personal protective factors and coping strategies.
              <span className="block mt-2 text-xs italic">Based on research by Werner (1995)</span>
            </p>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="bg-blue-50/70 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Collaborative Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Client Role */}
            <div className="landing-feature-box rounded-lg p-8 shadow-md bg-white">
              <h3 className="text-2xl font-semibold mb-5 flex items-center gap-2">
                <Heart className="h-6 w-6 text-rose-500" /> For Individuals
              </h3>
              <p className="text-neutral-600 mb-5">
                Track your emotional journey in real-time, build self-awareness through consistent recording,
                and strengthen the connection with your mental health professional between sessions.
              </p>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium flex items-center gap-2 text-neutral-800">
                    <BarChart3 className="h-5 w-5 text-blue-600" /> Track Emotional Patterns
                  </h4>
                  <p className="mt-1 text-neutral-600">
                    Use the interactive emotion wheel to identify and record emotions with precision.
                    Gain valuable insights by tracking patterns over time and understanding your emotional responses.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium flex items-center gap-2 text-neutral-800">
                    <Book className="h-5 w-5 text-amber-600" /> Reflect Through Journaling
                  </h4>
                  <p className="mt-1 text-neutral-600">
                    Express yourself through guided journaling that helps you process thoughts and feelings.
                    Basic AI assistance identifies recurring themes in your writing, providing additional perspective.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium flex items-center gap-2 text-neutral-800">
                    <Brain className="h-5 w-5 text-purple-600" /> Identify Effective Strategies
                  </h4>
                  <p className="mt-1 text-neutral-600">
                    Track which coping mechanisms and protective factors work best for you in different situations.
                    Build a personalized toolkit of proven strategies for managing challenging moments.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium flex items-center gap-2 text-neutral-800">
                    <Target className="h-5 w-5 text-green-600" /> Maintain Momentum
                  </h4>
                  <p className="mt-1 text-neutral-600">
                    Create structured goals with specific milestones, track your progress, and celebrate achievements. 
                    Stay engaged with your personal growth journey between professional sessions.
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Role */}
            <div className="landing-feature-box rounded-lg p-8 shadow-md bg-white">
              <h3 className="text-2xl font-semibold mb-5 flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-500" /> For Mental Health Professionals
              </h3>
              <p className="text-neutral-600 mb-5">
                Access client-recorded data to gain deeper insights, provide more targeted support based on 
                observed patterns, and enhance therapeutic conversations with data-driven observations.
              </p>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium flex items-center gap-2 text-neutral-800">
                    <MessageCircle className="h-5 w-5 text-indigo-600" /> Support Client Engagement
                  </h4>
                  <p className="mt-1 text-neutral-600">
                    Invite clients to the platform where they can use structured CBT tools between sessions.
                    Help them build consistent tracking habits that reinforce cognitive behavioral techniques.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium flex items-center gap-2 text-neutral-800">
                    <BarChart3 className="h-5 w-5 text-blue-600" /> Access Comprehensive Insights
                  </h4>
                  <p className="mt-1 text-neutral-600">
                    View detailed data on client emotions, thought patterns, and journaling over time.
                    Identify recurring themes and patterns to inform your sessions with objective data.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium flex items-center gap-2 text-neutral-800">
                    <CheckCircle className="h-5 w-5 text-emerald-600" /> Review Client Progress
                  </h4>
                  <p className="mt-1 text-neutral-600">
                    Monitor client engagement with reframing exercises, emotion tracking, and journaling.
                    See which techniques are most effective and tailor your approach based on concrete data.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium flex items-center gap-2 text-neutral-800">
                    <Book className="h-5 w-5 text-amber-600" /> Share Targeted Resources
                  </h4>
                  <p className="mt-1 text-neutral-600">
                    Provide educational materials and interactive exercises tailored to each client's specific needs.
                    Track resource engagement and effectiveness to optimize your client's learning experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6 text-neutral-800">For Mental Health Professionals</h2>
        <p className="text-xl text-neutral-600 max-w-2xl mx-auto mb-8">
          Are you a mental health professional looking to enhance your client tracking capabilities? Join ResilienceHub to provide your clients with structured tools for tracking emotions, thoughts, and behaviors between sessions.
        </p>
        
        {isMobile ? (
          /* Mobile CTA */
          <div className="flex flex-col gap-4 justify-center">
            <Button asChild size="lg" className="gap-2 bg-primary hover:bg-primary/90">
              <Link href="/m/login">
                Log In / Register <Smartphone className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <div className="mt-4 text-center p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Mobile Users:</strong> We've optimized the login experience for your device. 
                Use the mobile login button above for the best experience.
              </p>
            </div>
          </div>
        ) : (
          /* Desktop CTA */
          <>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2 bg-primary hover:bg-primary/90">
                <Link href="/auth">
                  Log In / Register <ArrowRight size={18} />
                </Link>
              </Button>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-neutral-600 mb-2">
                <strong>Mobile user?</strong> Use our dedicated mobile login:
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/m/login">
                  Mobile Login
                </Link>
              </Button>
            </div>
          </>
        )}
      </section>

      {/* Advanced CBT Tools Section */}
      <CbtToolsSection />

      {/* Footer */}
      <footer className="bg-blue-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-xl font-bold text-neutral-800">ResilienceHub</h3>
              <p className="text-neutral-600 mt-2">Structured tools for tracking emotions, thoughts, and behaviors</p>
            </div>
            <div className="flex flex-col md:flex-row gap-6 md:gap-12">
              <Link href="/auth" className="text-neutral-600 hover:text-primary transition-colors">
                Log In / Register
              </Link>
              <Link href="/m/login" className="text-neutral-600 hover:text-primary transition-colors">
                Mobile Login
              </Link>
              <Link href="/privacy-policy" className="text-neutral-600 hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-neutral-600 hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-neutral-600">
            <p>© {new Date().getFullYear()} ResilienceHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}