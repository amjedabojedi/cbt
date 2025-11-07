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

### November 6, 2025 - Dashboard Redesign: Module Identity System
- **Module Identity System**: Introduced visual identity for each of the 5 core modules
  - **Emotion Tracking**: Blue (#3b82f6), Heart icon, metrics: Total, Avg. Intensity, Most Common emotion
  - **Thought Records**: Purple (#9333ea), Brain icon, metrics: Total, Challenged %, Top ANT category
  - **Reframe Coach**: Green (#16a34a), Lightbulb icon, metrics: Practices, Avg. Score, Improvement %
  - **Journal**: Yellow/Amber (#eab308), BookOpen icon, metrics: Total, Avg. Rating, Emotions detected
  - **Smart Goals**: Indigo (#6366f1), Target icon, metrics: Total, Completed, Success Rate %
- **ModuleSummaryCard Component**: New reusable component displays module overview with icon, color-coded metrics, and "View Insights" link
- **Overall Progress Card**: Shows engagement score (based on total activities), progress bar, and quick stats for all 5 modules
- **useModuleStats Hook**: Custom hook fetches data from all module APIs and calculates key statistics
- **Dashboard Structure**: Replaced long list of individual components with:
  - Overall Progress section showing engagement metrics
  - Grid of 5 Module Summary Cards with high-level overviews
  - Detailed analytics remain in each module's Insights tab (no changes to module pages)
- **Quick Actions Updated**: Aligned with 5-module system and RECORD modality
  - Now shows 5 cards: Record Emotion, Record Thought, Practice Reframe, Write Journal, Create Goal
  - Each card uses module identity color on icon (Heart=Blue, Brain=Purple, Lightbulb=Green, Book=Yellow, Target=Indigo)
  - Fixed routing: /thought-records instead of /thoughts
  - Removed generic "View Progress" - users can access Insights via Module Summary Cards
  - Grid layout: 5 columns on large screens, 2 columns on medium, 1 column on mobile
- **Getting Started Checklist Updated**: Aligned with module identity system
  - Now covers all 5 modules in sequential order: Track emotion → Record thought → Practice reframe → Write journal → Create goal
  - Uses concrete action verbs matching module names
  - Removed therapist-specific "Accept invitation" from universal onboarding checklist
  - Added subtitle: "Complete these steps to explore the full therapeutic toolkit"
- **Navigation**: Module cards link to module pages using wouter routing; Insights tabs unchanged
- **Design Philosophy**: Dashboard shows overview (3 key metrics per module), detailed analytics stay in module Insights tabs
- **Conceptual Flow Model**: RECORD → REVIEW → INSIGHTS (applied consistently across all 5 modules)

### November 6, 2025 - Sequential Flow Clarity: Module Content Accuracy
- **Module Headers Updated**: Added sequential flow context to clarify each module's place in the therapeutic process
  - Emotion Tracking: "Start here: identify and track how you're feeling"
  - Thought Records: "Record and examine your thoughts after tracking emotions"
  - Journal: "Process your emotions and experiences: Reflect on your thoughts and feelings through daily journaling"
- **Thought Records Wizard Benefit Card**: Changed "Challenge & Balance" to "Examine the Evidence"
  - Removed language about "developing balanced perspectives" which is Reframe Coach's role
  - Now accurately describes examining evidence for/against thoughts within Thought Records
- **Content Accuracy Principle**: Each module now clearly describes ONLY what it does, not what other modules do
  - Prevents user confusion about where to practice reframing (Reframe Coach only)
  - Maintains clear boundaries between identification (Thought Records) and practice (Reframe Coach)
- **Verified Card Actions**: Confirmed other modules (Emotions, Goals, Journal) appropriately use dropdown menus for CRUD operations
  - Unlike Reframe Coach's simplified single-action pattern, these modules legitimately need View/Edit/Delete actions
  - Dropdown pattern is appropriate for secondary CRUD operations

### November 5, 2025 - Reframe Coach: Major UX Simplification & Unified Timeline
- **Removed 3-Tab Structure**: Simplified from fragmented tabs (Start Practice, History, Insights) to a single unified timeline view
  - All thought records now displayed in one scrollable list
  - No more context switching between tabs
  - Practice history shown inline with each thought record
- **Collapsible Introduction Card**: First-time user education made dismissible
  - "What is Reframe Coach?" intro appears at top of page
  - Users can collapse/expand or dismiss permanently
  - Shows key benefits: Identify Distortions, Practice Reframing, Track Progress
- **Simplified Thought Record Cards**: Reduced visual clutter and cognitive load
  - Removed multiple status badges (Practice Ready, Practiced Today) from header
  - Removed clickable card behavior - cards are no longer interactive surfaces themselves
  - Header now shows only: Date + Challenged status + Journal entry count
  - Clean two-line header layout for better information hierarchy
- **Primary Action Button**: Single clear call-to-action at bottom of each card
  - Prominent purple "Practice This Thought" button when ready (24-hour cooldown passed)
  - Disabled "Practiced Today" button with hours-until-next indicator when on cooldown
  - Replaced confusing multiple interaction points with one obvious action
- **Inline Practice Results**: Last practice session displayed directly on card
  - Shows time since last practice and score achieved
  - No need to navigate to separate History tab
  - Practice context always visible alongside the thought record
- **Improved Navigation**: Replaced all window.location.href with proper wouter routing
  - Smoother page transitions
  - Maintains browser history correctly
  - Better performance and user experience
- **Overall Impact**: Reduced from 3 separate views + multiple badges + clickable cards to 1 unified timeline + 1 button per card = significantly simplified user experience
