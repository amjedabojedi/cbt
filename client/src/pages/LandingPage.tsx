import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight, Brain, Heart, Shield, Target, Book, MessageCircle, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function LandingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (user) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <header className="container mx-auto px-4 pt-24 pb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 mb-6">
          New Horizon CBT
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
          A comprehensive cognitive behavioral therapy platform connecting therapists with clients
          for personalized mental health support.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/auth">
              Get Started <ArrowRight size={18} />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link href="/auth">
              Login
            </Link>
          </Button>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Comprehensive CBT Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Advanced Emotion Tracking</h3>
            <p className="text-muted-foreground">
              Track and visualize emotions using our detailed emotion wheel with interactive mapping and intensity tracking.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Therapeutic Interventions</h3>
            <p className="text-muted-foreground">
              Access structured thought records, coping strategies, and protective factors to manage difficult emotions.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Goal Setting & Tracking</h3>
            <p className="text-muted-foreground">
              Create and track SMART goals with milestone tracking and progress visualization.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Book className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Journaling</h3>
            <p className="text-muted-foreground">
              Write journal entries with AI analysis that automatically identifies emotions, themes, and cognitive patterns.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Integrated Insights</h3>
            <p className="text-muted-foreground">
              View cross-component insights that connect your emotions, thoughts, journal entries, and progress over time.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Therapist-Client Connection</h3>
            <p className="text-muted-foreground">
              Secure communication and sharing between therapists and clients with real-time notifications.
            </p>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Tailored for Everyone</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Client Role */}
            <div className="bg-card rounded-lg p-6 shadow-sm border">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" /> For Clients
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Create personal emotion records and track patterns
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Journal with AI-powered insights
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Set and track personal therapy goals
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Access thought records and cognitive techniques
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Track progress through visual reports
                </li>
              </ul>
            </div>

            {/* Therapist Role */}
            <div className="bg-card rounded-lg p-6 shadow-sm border">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" /> For Therapists
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  View and provide feedback on client records
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Approve and monitor client goals
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Share therapy resources and educational content
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Track client progress through comprehensive dashboards
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Invite and manage multiple clients
                </li>
              </ul>
            </div>

            {/* Admin Role */}
            <div className="bg-card rounded-lg p-6 shadow-sm border">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" /> For Administrators
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Manage therapist accounts and permissions
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Oversee subscription plans and payments
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Access platform usage analytics
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Manage global resource library content
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Configure system-wide settings
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Start Your Mental Health Journey Today</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Join New Horizon CBT to access powerful tools for cognitive behavioral therapy and connect with professional therapists.
        </p>
        <Button asChild size="lg" className="gap-2">
          <Link href="/auth">
            Sign Up Now <ArrowRight size={18} />
          </Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-xl font-bold">New Horizon CBT</h3>
              <p className="text-muted-foreground mt-2">Comprehensive mental health support</p>
            </div>
            <div className="flex flex-col md:flex-row gap-6 md:gap-12">
              <Link href="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                Login
              </Link>
              <Link href="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                Register
              </Link>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} New Horizon CBT. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}