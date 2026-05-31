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
import FeatureFlowImage from '@/components/landing/FeatureFlowImage';
const rdtLogo = '/rdt-logo.png';

const BrainLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14Z" />
  </svg>
);

export default function LandingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('landing_page_first', 'true');

    const mobileFlag = localStorage.getItem('isMobileDevice');
    setIsMobile(mobileFlag === 'true');

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
      const isMobileDetected = detectMobile();
      localStorage.setItem('isMobileDevice', isMobileDetected ? 'true' : 'false');
      setIsMobile(isMobileDetected);
    }

    if (user) setLocation('/dashboard');
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-teal-900 to-teal-800 border-b border-teal-700/40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <BrainLogo />
            </div>
            <div className="leading-none">
              <p className="text-white font-bold text-base tracking-wide">ResilienceHub</p>
              <p className="text-teal-300/70 text-[9px] font-semibold tracking-widest uppercase mt-0.5">Clinical Suite</p>
            </div>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            {isMobile ? (
              <Button asChild size="sm" className="rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-semibold text-sm">
                <Link href="/m/login">
                  <Smartphone className="mr-1.5 h-3.5 w-3.5" /> Mobile Login
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-teal-100 hover:text-white hover:bg-white/10 rounded-xl text-sm">
                  <Link href="/auth">Log In</Link>
                </Button>
                <Button asChild size="sm" className="rounded-xl bg-white text-teal-900 hover:bg-teal-50 font-semibold text-sm shadow-sm">
                  <Link href="/auth">Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-teal-600/20 blur-3xl pointer-events-none" />

        <div className="relative container mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-teal-200 text-xs font-semibold tracking-wide uppercase mb-6">
            <Shield className="h-3 w-3" /> Evidence-Based CBT Platform
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-5 leading-tight">
            ResilienceHub™
          </h1>
          <p className="text-teal-100/80 text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
            An interactive mental health support tool that helps individuals track emotional patterns,
            thought processes, and daily progress — backed by evidence-informed CBT techniques.
          </p>

          {/* Disclaimer */}
          <div className="flex items-start gap-2.5 bg-amber-400/15 border border-amber-300/30 rounded-xl p-3.5 max-w-2xl mx-auto mb-10 text-left">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-300 mt-0.5 shrink-0">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" />
            </svg>
            <p className="text-amber-100/90 text-sm leading-relaxed">
              <strong className="text-amber-200">Important:</strong> This app works alongside therapy — not as a replacement — to strengthen personal reflection
              and improve between-session engagement. Most effective when used with a qualified mental health professional.
            </p>
          </div>

          {/* CTA buttons */}
          {isMobile ? (
            <div className="flex flex-col items-center gap-4">
              <Button asChild size="lg" className="rounded-xl bg-white text-teal-900 hover:bg-teal-50 font-semibold shadow-md px-8">
                <Link href="/m/login"><Smartphone className="mr-2 h-4 w-4" /> Login to App</Link>
              </Button>
              <p className="text-teal-200/70 text-sm">
                Need an invitation? Check your email for the registration link.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="rounded-xl bg-white text-teal-900 hover:bg-teal-50 font-semibold shadow-md px-8">
                <Link href="/auth">Log In / Register <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 font-medium px-6">
                <Link href="/m/login"><Smartphone className="mr-2 h-4 w-4" /> Mobile Login</Link>
              </Button>
            </div>
          )}

          <p className="text-teal-200/60 text-xs mt-6">
            Clients need an invitation from their mental health professional to access the platform.
          </p>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: <Brain className="h-5 w-5 text-teal-600" />, label: "CBT Modules", value: "5" },
              { icon: <BarChart3 className="h-5 w-5 text-teal-600" />, label: "Insight Charts", value: "15+" },
              { icon: <Target className="h-5 w-5 text-teal-600" />, label: "ANT Categories", value: "12" },
              { icon: <Users className="h-5 w-5 text-teal-600" />, label: "Role-Based Access", value: "3" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  {stat.icon}
                </div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Video Demo ── */}
      <section className="bg-slate-50 border-b border-slate-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">See ResilienceHub™ in Action</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
              Watch how ResilienceHub supports mental health professionals and their clients through evidence-based therapeutic tools.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-slate-100" style={{ paddingBottom: '56.25%', height: 0 }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://videos.sproutvideo.com/embed/8c9bd9bf131aecc506/8f9a044478c2937a"
                width="640" height="360" frameBorder="0" allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                title="ResilienceHub Platform Demo"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">Tools for Emotion & Behaviour Tracking</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">
              A full suite of structured CBT tools — each module builds on the next to create a complete picture of your mental wellness.
            </p>
          </div>

          <FeatureFlowImage />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Brain className="h-5 w-5 text-teal-600" />, title: "Emotion Tracking", desc: "Use the emotion wheel to record how you feel with intensity tracking. Spot emotional trends and gain greater self-awareness between sessions.", color: "bg-teal-50" },
              { icon: <Heart className="h-5 w-5 text-rose-500" />, title: "Thought & Behaviour Tools", desc: "Document thinking patterns using structured CBT tools. Track which coping strategies work best when managing difficult moments.", color: "bg-rose-50" },
              { icon: <Target className="h-5 w-5 text-emerald-600" />, title: "Goal Setting", desc: "Create specific, measurable goals and break them into manageable steps. Monitor your progress consistently to maintain momentum.", color: "bg-emerald-50" },
              { icon: <Book className="h-5 w-5 text-amber-600" />, title: "Simple Journaling", desc: "Reflect on your experiences with journal entries that help you process thoughts and feelings. AI assistance spots recurring patterns.", color: "bg-amber-50" },
              { icon: <BarChart3 className="h-5 w-5 text-blue-600" />, title: "Progress Visualisation", desc: "See connections between your recorded emotions, thoughts, and journal entries through intuitive charts showing patterns over time.", color: "bg-blue-50" },
              { icon: <MessageCircle className="h-5 w-5 text-violet-600" />, title: "Professional Connection", desc: "Securely share your tracking data with your therapist. Receive feedback on your progress between sessions.", color: "bg-violet-50" },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Research ── */}
      <section className="bg-slate-50 border-b border-slate-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">Research-Based Tracking Tools</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm leading-relaxed">
              Our tracking tools are designed based on scientific research showing how systematically recording emotions, thoughts, and behaviours helps individuals better understand their patterns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {[
              { title: "Better Emotion Recognition", desc: "Research shows that people who can identify specific emotions react less impulsively and manage stress better. Our emotion wheel helps build this important skill.", cite: "Kashdan, Barrett, & McKnight (2015)" },
              { title: "Effective Homework", desc: "Studies prove that completing thought records between therapy sessions leads to better outcomes for depression and anxiety. Our digital tools make this easier.", cite: "Rees, McEvoy, & Nathan (2005)" },
              { title: "Clear Goals Work Better", desc: "Setting specific, measurable goals improves motivation and success rates. Our SMART goal system helps break big changes into achievable steps.", cite: "Locke & Latham (2002)" },
              { title: "Building Resilience", desc: "Tracking what helps you cope during difficult times builds lasting resilience. Our tools help identify personal protective factors and coping strategies.", cite: "Werner (1995)" },
            ].map((r) => (
              <div key={r.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-1">{r.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{r.desc}</p>
                    <p className="text-xs text-slate-400 italic mt-2">Based on research by {r.cite}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section className="bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">Collaborative Benefits</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">One platform, two perspectives — built for the therapeutic relationship.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* For Individuals */}
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">For Individuals</h3>
              </div>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Track your emotional journey in real-time, build self-awareness through consistent recording,
                and strengthen the connection with your mental health professional between sessions.
              </p>
              <div className="space-y-4">
                {[
                  { icon: <BarChart3 className="h-4 w-4 text-teal-600" />, title: "Track Emotional Patterns", desc: "Use the interactive emotion wheel to identify and record emotions with precision." },
                  { icon: <Book className="h-4 w-4 text-amber-600" />, title: "Reflect Through Journaling", desc: "Express yourself through guided journaling. AI assistance identifies recurring themes." },
                  { icon: <Brain className="h-4 w-4 text-teal-700" />, title: "Identify Effective Strategies", desc: "Track which coping mechanisms work best for you in different situations." },
                  { icon: <Target className="h-4 w-4 text-emerald-600" />, title: "Maintain Momentum", desc: "Create structured goals with milestones, track progress, and celebrate achievements." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">{item.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Professionals */}
            <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-900 to-teal-800 p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">For Mental Health Professionals</h3>
                </div>
                <p className="text-sm text-teal-100/75 mb-6 leading-relaxed">
                  Access client-recorded data to gain deeper insights, provide more targeted support,
                  and enhance therapeutic conversations with data-driven observations.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: <MessageCircle className="h-4 w-4 text-teal-300" />, title: "Support Client Engagement", desc: "Invite clients to use structured CBT tools between sessions." },
                    { icon: <BarChart3 className="h-4 w-4 text-teal-300" />, title: "Access Comprehensive Insights", desc: "View detailed data on client emotions, thought patterns, and journaling over time." },
                    { icon: <CheckCircle className="h-4 w-4 text-teal-300" />, title: "Review Client Progress", desc: "Monitor engagement with exercises and see which techniques are most effective." },
                    { icon: <Book className="h-4 w-4 text-teal-300" />, title: "Share Targeted Resources", desc: "Provide educational materials tailored to each client's specific needs." },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0 mt-0.5">{item.icon}</div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="text-xs text-teal-200/70 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Advanced CBT tools (existing component) ── */}
      <CbtToolsSection />

      {/* ── CTA ── */}
      <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready to get started?</h2>
          <p className="text-teal-100/75 max-w-xl mx-auto text-sm leading-relaxed mb-8">
            Join ResilienceHub to provide your clients with structured tools for tracking emotions, thoughts, and behaviours between sessions — or start your own journey today.
          </p>

          {isMobile ? (
            <Button asChild size="lg" className="rounded-xl bg-white text-teal-900 hover:bg-teal-50 font-semibold shadow-md px-8">
              <Link href="/m/login"><Smartphone className="mr-2 h-4 w-4" /> Login to App</Link>
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="rounded-xl bg-white text-teal-900 hover:bg-teal-50 font-semibold shadow-md px-8">
                <Link href="/auth">Log In / Register <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 font-medium px-6">
                <Link href="/m/login"><Smartphone className="mr-2 h-4 w-4" /> Mobile Login</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                <BrainLogo />
              </div>
              <div className="leading-none">
                <p className="text-white font-bold text-sm">ResilienceHub</p>
                <p className="text-slate-400 text-xs mt-0.5">Structured tools for tracking emotions, thoughts, and behaviours</p>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/auth" className="text-slate-400 hover:text-white text-sm transition-colors">Log In / Register</Link>
              <Link href="/m/login" className="text-slate-400 hover:text-white text-sm transition-colors">Mobile Login</Link>
              <Link href="/privacy-policy" className="text-slate-400 hover:text-white text-sm transition-colors">Privacy Policy</Link>
              <Link href="/terms-of-service" className="text-slate-400 hover:text-white text-sm transition-colors">Terms of Service</Link>
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-xs">
              © {new Date().getFullYear()} ResilienceHub. All rights reserved.
            </p>
            <div className="flex items-center gap-2.5">
              <span className="text-slate-600 text-xs">Built by</span>
              <img
                src={rdtLogo}
                alt="Resilience Digital Transformation Inc"
                className="h-7 object-contain opacity-80 hover:opacity-100 transition-opacity"
              />
              <span className="text-slate-400 text-xs font-medium">Resilience Digital Transformation Inc</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
