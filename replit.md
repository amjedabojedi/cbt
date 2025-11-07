# ResilienceHub

## Overview
ResilienceHub is a mental health web application connecting mental health professionals with clients using interactive cognitive behavioral therapy (CBT) tools. It facilitates structured therapy through emotion tracking, thought records, journaling, and goal setting, aiming to enhance mental well-being and provide a comprehensive platform for mental health management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The application is a React-based Single Page Application (SPA) using modern React with hooks. UI components are built with `shadcn/ui` and `Radix UI` primitives. State management is handled by `React Query` for server state and the Context API for global application state. Styling is achieved with `Tailwind CSS` for a responsive, mobile-first design, and `Wouter` for client-side routing.

### Backend
The backend is a `Node.js/Express` server providing a RESTful API. It includes a dedicated service layer for business logic (email, OpenAI, WebSockets) and uses session-based authentication with secure cookie management. `Drizzle ORM` handles type-safe database operations.

### Database
`PostgreSQL` serves as the primary database, hosted on Neon (serverless) with connection pooling. `Drizzle-kit` manages schema and migrations.

### Key Features
- **User Management**: Role-based access control (client, therapist, admin) and client-therapist assignment.
- **Core Therapeutic Tools**:
    - **Emotion Tracking**: Interactive emotion wheel, 4-step wizard, onboarding, and intensity tracking.
    - **Thought Records**: 3-step wizard for recording thoughts, linking emotions, and challenging, incorporating 12 clinical CBT ANT categories.
    - **Journaling**: AI-assisted analysis for emotion detection.
    - **Goal Setting**: SMART goals with milestone tracking and automatic status updates.
    - **Reframe Coach**: Interactive cognitive restructuring practice.
- **Progress Tracking**: Cross-component insights and analytics for user progress, including evidence-based CBT metrics.

### UI/UX Design Patterns
The application utilizes consistent design patterns:
- **Wizard-Based Flows**: Step-by-step guidance, progress bars, validation, and success dialogs.
- **Unified Module Pages**: Consistent structure across core modules (Header, Three-Tab Layout for Creation/Wizard, History/View, and Insights, and Educational Accordion).
- **Visual Consistency**: Adherence to consistent card styles, spacing, typography, and color schemes.
- **Progressive Learning**: CBT concepts introduced through action.
- **Data-Driven Progress**: Real-time statistics to motivate engagement.
- **Standardized Dialogs**: Unified detail views with sticky headers, icon badges, and card-based content.
- **Card Grid Layout**: Responsive card grid with consistent dropdown menus for actions.
- **Module Identity System**: Visual identity for each core module (Emotion Tracking, Thought Records, Reframe Coach, Journal, Smart Goals) with specific colors, icons, and key metrics for dashboard overviews.

### AI Integration
`OpenAI` is integrated for journal analysis, emotion detection, and reframe coaching, with caching and fallback handling.

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **OpenAI API**: Provides AI-powered features.
- **SparkPost**: Email delivery services.

### Development Tools
- **Vite**: Build tool and development server.
- **TypeScript**: Type safety.
- **Drizzle**: ORM and migration tool.
- **React Query**: Server state management and caching.

### UI/UX Libraries
- **Radix UI**: Provides accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Lucide Icons**: Consistent icon library.
- **Recharts**: Utilized for data visualization components.

## Recent Changes

### November 7, 2025 - My Progress Page: Clinical CBT Metrics Redesign
- **Complete Redesign Philosophy**: Shifted from generic charts to clinical metrics based on CBT principles
  - Metrics informed by evidence-based CBT concepts (behavioral activation, affect monitoring, cognitive restructuring, goal progress)
  - Focus on cross-module insights NOT available in individual module Insights tabs
  - Quick Links to module-specific detailed analytics instead of duplicating charts
- **useProgressInsights Hook**: Centralized data fetching and computation for all 5 modules
  - Fetches: emotions, thoughts, journals, goals, reframe practice results
  - Computes clinical metrics with proper time range filtering
  - Provides unified activity timeline across all modules
- **CBTProgressSnapshot Component**: 4 Clinical Metric Cards
  - **Engagement Level**: Total entries across all 5 modules (behavioral activation concept)
  - **Emotional Balance**: Separate positive/negative emotion intensity tracking with % change trends
    - Positive affect: Joy, Love families (affect-based)
    - Negative affect: Sadness, Fear, Anger, Disgust families (affect-based)
    - Trend indicators show improvement (negative ↓ = good, positive ↑ = good)
  - **Cognitive Restructuring**: % of thoughts examined with evidence (cognitive restructuring practice)
  - **Goal Progress**: Completion rate with breakdown (completed/in-progress/pending)
- **ModuleQuickLinks Component**: Navigation to detailed module Insights tabs
  - Links to all 5 modules in sidebar order with query parameter `?tab=insights`
  - Replaces chart duplication with efficient navigation to existing detailed analytics
- **ActivityTimeline Component**: Unified chronological activity view
  - Shows last 30 activities from all 5 modules sorted by date (most recent first)
  - Color-coded icons matching module identity system
  - Displays relative time ("2 hours ago") and absolute timestamp
- **CBTTriangleConnections Component**: Cross-module relationship insights
  - **Thought-Feeling Connection**: % of thought records linked to emotion tracking
  - **Cognitive Pattern Recognition**: Most common cognitive distortion with frequency
  - **Activity-Mood Connection**: Behavioral activation tracking
  - Provides recommendations when connections are weak
- **ProgressIndicators Component**: Clinical markers and personalized recommendations
  - **Engagement Level**: Progress bar based on total activities
  - **Cognitive Restructuring**: Progress bar for thought challenge rate
  - **Emotional Awareness**: Progress bar for emotion tracking frequency
  - **Personalized Recommendations**: Context-aware suggestions based on usage patterns
    - Success messages for positive behaviors
    - Constructive guidance for improvement areas
    - CBT best practices integrated into feedback
- **Page Layout**: Clinical information hierarchy
  1. Header with time range selector (week/month/all) and PDF export
  2. CBT Progress Snapshot (4 metrics overview)
  3. Module Quick Links (navigation to detailed insights)
  4. Two-column layout: Activity Timeline + CBT Triangle Connections
  5. Full-width Progress Indicators with recommendations
- **Removed Legacy Charts**: Eliminated redundant visualizations
  - Emotion distribution pie chart (available in Emotion Tracking Insights tab)
  - Intensity trend line chart (available in Emotion Tracking Insights tab)
  - Cognitive distortions bar chart (available in Thought Records Insights tab)
  - Goal status pie chart (available in Smart Goals Insights tab)
  - Replaced with Quick Links to existing detailed module analytics
- **Clinical Validity**: Metrics based on CBT principles
  - Engagement Level: Behavioral activation concept from CBT
  - Emotional Balance: Separate positive/negative affect measurement (affect-based concept)
  - Cognitive Restructuring: Cognitive restructuring practice tracking
  - Goal Progress: SMART goals completion tracking
- **Design Principle**: My Progress shows cross-module connections; module Insights tabs show module-specific deep dives

### November 7, 2025 - Reframe Coach Module Tabs Redesign & UI Improvements
- **Reframe Coach Tabs Structure**: Redesigned ReframeCoachPage to match other modules with 3-tab layout
  - **Practice Tab**: Select thought records for cognitive reframing practice with educational accordion
  - **History Tab**: View past reframe practice sessions using ReframePracticeHistory component
  - **Insights Tab**: Detailed analytics and score trends using ReframeInsights component
  - URL parameter support: `?tab=insights` navigates directly to Insights tab from Module Quick Links
- **Module Quick Links Navigation**: All 5 modules now properly route to their Insights tabs
  - Emotion Tracking → `/emotions?tab=insights`
  - Thought Records → `/thoughts?tab=insights`
  - Journal → `/journal?tab=insights`
  - Smart Goals → `/goals?tab=insights`
  - Reframe Coach → `/reframe-coach?tab=insights`
- **ModuleSummaryCard Layout Fix**: Improved readability for long distortion names on Dashboard
  - Added `leading-tight` and `break-words` classes to metric values
  - Long cognitive distortion names (e.g., "All or Nothing") now wrap gracefully to second line
  - Prevents text squeezing in Top ANT metric display
- **Module Consistency**: All 5 therapeutic modules now use identical 3-tab structure
  - Tab 1: Record/Practice/Create (wizard or form)
  - Tab 2: History/View (past entries)
  - Tab 3: Insights (analytics and trends)
