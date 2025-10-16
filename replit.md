# ResilienceHub

## Overview
ResilienceHub is a mental health web application designed to provide interactive cognitive behavioral therapy (CBT) tools and connect mental health professionals with their clients. The platform aims to facilitate structured therapy through features like emotion tracking, thought records, journaling, and goal setting. It is built to offer a comprehensive and engaging experience for managing mental well-being.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **React-based SPA**: Utilizes modern React with hooks.
- **Component Library**: Built with shadcn/ui and Radix UI primitives.
- **State Management**: React Query for server state, Context API for global state.
- **Styling**: Tailwind CSS for responsive, mobile-first design.
- **Routing**: Wouter for client-side routing.

### Backend
- **Node.js/Express**: RESTful API server with a middleware-based architecture.
- **Service Layer**: Dedicated services for business logic (email, OpenAI, WebSocket).
- **Authentication**: Session-based with secure cookie management.
- **Database ORM**: Drizzle ORM for type-safe database operations.

### Database
- **PostgreSQL**: Primary database hosted on Neon (serverless PostgreSQL).
- **Connection Pooling**: Optimized connection management with retry mechanisms.
- **Schema Management**: Drizzle-kit for migrations and schema evolution.

### Key Features
- **User Management**: Role-based access control (client, therapist, admin) with client-therapist invitation and assignment.
- **Core Therapeutic Tools**:
    - **Emotion Tracking**: Interactive emotion wheel with a 4-step wizard, onboarding, and intensity tracking.
    - **Thought Records**: 3-step wizard for recording thoughts, linking emotions, and challenging. Incorporates 12 clinical CBT ANT categories.
    - **Journaling**: AI-assisted analysis for emotion detection.
    - **Goal Setting**: SMART goals with milestone tracking and automatic status updates.
    - **Reframe Coach**: Interactive cognitive restructuring.
- **Progress Tracking**: Cross-component insights and analytics.

### UI/UX Design Patterns
- **Wizard-Based Flows**: Consistent step-by-step guidance with progress bars, informative "Why This Step?" sections, validation, and success dialogs. Features first-time user onboarding tours.
- **Unified Module Pages**: All core modules (Emotion Tracking, Thought Records, Smart Goals, Journal) share a consistent structure:
    - **Module Header**: Reusable component with title, description, and dynamic progress badges.
    - **Three-Tab Layout**: "Creation/Wizard Tab", "History/View Tab", and "Insights Tab" with analytics and trend visualizations.
    - **Educational Accordion**: Collapsible "Why [Feature]?" content on creation tabs.
- **Visual Consistency**: Adherence to consistent card styles, spacing, typography, and color schemes.
- **Progressive Learning**: CBT concepts are introduced through action before explicit terminology.
- **Data-Driven Progress**: Real-time statistics to motivate engagement.

### AI Integration
- **OpenAI Integration**: Powers journal analysis, emotion detection, and reframe coaching.
- **Caching System**: Smart caching for OpenAI responses to optimize costs.
- **Fallback Handling**: Graceful degradation when AI services are unavailable.

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **OpenAI API**: AI-powered features for analysis and coaching.
- **SparkPost**: Email delivery service.

### Development Tools
- **Vite**: Build tool and development server.
- **TypeScript**: Ensures type safety across the application.
- **Drizzle**: ORM and migration tool.
- **React Query**: Server state management and caching.

### UI/UX Libraries
- **Radix UI**: Accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide Icons**: Consistent icon library.
- **Recharts**: Data visualization components.

## Changelog

- October 16, 2025 (latest). Implemented 3-tab Insights structure across all 4 core modules
  - **3-Tab Layout**: All modules now have Create/Record → History → Insights tabs
  - **Insights Components**: Created dedicated insights components for each module:
    - **EmotionInsights**: Mood trends chart, intensity heatmap, emotion distribution pie chart, time-of-day patterns
    - **ThoughtInsights**: ANT patterns bar chart, challenge success rate, thought-emotion links, progress trends over time
    - **JournalInsights**: Sentiment trends (positive/negative/neutral), emotion distribution, topic analysis, 30-day writing calendar, mood trends
    - **GoalInsights**: Completion rate, status distribution, timeline performance, progress trends, 30-day milestone activity calendar
  - **Analytics Focus**: Insights tabs show trends, patterns, and analytics over time (distinct from Overall Progress cards which show current snapshot stats)
  - **Interactive Charts**: All insights use Recharts for beautiful visualizations (line charts, bar charts, pie charts, heatmaps)
  - **Time Range Filters**: Week/Month/All Time toggle for trend analysis
  - **Empty State Guards**: Proper handling of empty datasets to prevent crashes
  - **Consistent UX**: All insights components follow the same visual pattern with metric cards, charts, and calendar heatmaps
- October 16, 2025 (earlier). Implemented unified design pattern across all 4 core module pages
  - **ModuleHeader Component**: Created reusable component (`ModuleHeader.tsx`) with title, description, and dynamic progress badges
  - **Consistent Page Structure**: All pages now follow: ModuleHeader → 2-tab layout → Educational accordion in wizard/creation tab
  - **Progress Badges**: Added real-time stats to module headers:
    - Emotion Tracking: Total tracked, avg intensity, most common emotion
    - Thought Records: Total thoughts, challenged count, avg ratings
    - Smart Goals: Active goals, completed count, pending count
    - Journal: Total entries, most common emotion detected
  - **Educational Accordions**: Added "Why [Feature]?" collapsible sections with CBT psychoeducation at the top of creation tabs
  - **Visual Consistency**: Standardized card styles, spacing, typography, and color schemes across all modules
  - **Color System**: Defined consistent Tailwind color palette for progress badges (emerald for active, green for completed, yellow for pending, etc.)
  - **Design Philosophy**: Progressive learning approach where users experience CBT concepts through action before encountering technical terminology
- October 15, 2025 (latest). Implemented tab-based layout for Thought Records matching emotion tracking pattern
  - **Tab Navigation**: Added two tabs: "Record Thought" and "Thought Records History"
  - **Direct Wizard Access**: ThoughtRecordWizard now opens directly in "Record Thought" tab instead of as a dialog
  - **Consistent UX**: Matches the emotion tracking page layout for consistency
  - **Smart Defaults**: Shows history tab by default for therapists and when viewing client data
- October 15, 2025 (earlier). Streamlined thought workflows by removing duplication between recording and challenging
  - **Removed Duplicate Step**: Removed "Identify Thinking Errors" step from ThoughtChallengeWizard since ANT categories are already captured during thought recording (Step 3)
  - **Simplified Challenge Flow**: ThoughtChallengeWizard now has 3 steps instead of 4:
    - Intro: Learn about thought challenging
    - Step 1: Examine Evidence (for/against)
    - Step 2: Generate Alternative Thought  
    - Step 3: Rate Beliefs
  - **Improved UX**: No redundant work - users identify ANTs once during recording, then focus on evidence and alternatives during challenging
  - **Better Workflow**: Clear separation between identification (thought recording) and restructuring (thought challenging)
- October 15, 2025 (earlier). Implemented ANTs (Automatic Negative Thoughts) categorization with clinical CBT framework
  - **ANT Education**: Step 3 now explains what ANTs (Automatic Negative Thoughts) are and why recognizing unhelpful thinking patterns matters
  - **12 Clinical CBT Categories**: Replaced simple categories with professional ANT categories from clinical CBT:
    1. All or Nothing Thinking - Black and white thinking
    2. Mental Filter - Only seeing the negative
    3. Mind Reading - Presuming what others think without evidence
    4. Fortune Telling - Predicting negative futures
    5. Labelling - Giving negative labels to self or others
    6. Over-Generalising - Using "always", "never", "nothing"
    7. Compare and Despair - Comparing unfavourably to others
    8. Emotional Thinking - Believing feelings equal facts
    9. Guilty Thinking - "Should", "must", "have to" thinking
    10. Catastrophising - Expecting unlikely disasters
    11. Blaming Others - Always blaming external factors
    12. Personalising - Taking inappropriate blame
  - **Clear Educational Format**: Each category shows definition + 1-2 clinical examples
  - **User's Thought Reference**: Purple box displays user's actual automatic thought for easy comparison
  - **Professional Framework**: Based on evidence-based CBT unhelpful thinking styles from clinical psychology
  - **Educational UX**: Step 3 teaches users to recognize their ANT patterns, first step in cognitive restructuring
- October 15, 2025 (earlier). Fixed Microsoft Edge textarea text visibility bug in thought wizards
  - **Root Cause**: shadcn/ui FormField component has a bug in Microsoft Edge where `field.value` doesn't sync with actual form state, causing textareas to appear empty even though data is being captured
  - **Investigation**: Systematic debugging with console logs revealed form state contained correct values but FormField's render prop received empty field.value
  - **Solution**: Bypassed FormField entirely - use direct value binding with `form.watch()` and `form.setValue()` instead of FormField render props
  - **Pattern Applied**: 
    - `value={watchedValues.fieldName}` instead of `{...field}`
    - `onChange={(e) => form.setValue("fieldName", e.target.value)}` instead of `field.onChange`
  - **Files Fixed**: ThoughtRecordWizard (2 textareas), ThoughtChallengeWizard (3 textareas)
  - **Result**: Text now fully visible in all textareas across all browsers including Microsoft Edge
  - **Technical Note**: This is a Microsoft Edge-specific compatibility issue with React Hook Form's FormField component; EmotionTrackingFormWizard didn't have this issue because it used a different pattern
- October 15, 2025 (earlier). Implemented Thought Challenging Wizard with educational CBT guidance
  - **ThoughtChallengeWizard Component**: Created 4-step wizard flow (Review Thought → Identify Cognitive Distortions → Evaluate Evidence → Develop Alternative Perspectives)
  - **Educational Intro Dialog**: Added CBT psychoeducation explaining what thought challenging is and why it's helpful before the wizard begins
  - **Integration**: "Challenge This Thought" button in ThoughtRecordWizard success dialog opens the challenge wizard
  - **Backend API**: Added PATCH endpoint `/api/users/:userId/thoughts/:thoughtId` to update thought records with challenge data
  - **Data Persistence**: Challenge data (cognitive distortions, evidence for/against, alternative perspective, insights, reflection rating) saved to database
  - **Display**: ThoughtRecords history page displays all challenge data with visual sections for distortions, evidence evaluation, alternatives, insights, and progress ratings
  - **UX Enhancement**: Updated Step 3 situation prompt to include "who, what, when, where, why" for comprehensive context gathering
- October 15, 2025 (earlier). Implemented wizard-based UX pattern across emotion tracking and thought recording
  - **Emotion Tracking Wizard**: Created EmotionTrackingFormWizard with 4-step flow (Select Emotion → Rate Intensity → Describe Situation → Add Context)
  - **Onboarding Tour**: Created EmotionOnboardingTour with 3-slide introduction for first-time users, stored in localStorage
  - **Thought Recording Wizard**: Created ThoughtRecordWizard with 3-step flow (Write Thought → Optional Emotion Link → Describe Situation)
  - **Flow Separation**: Decoupled emotion tracking from thought recording - each module is now standalone with optional cross-linking
  - **Thought Challenging**: Made optional post-recording action instead of forced flow
  - **Success Dialogs**: Enhanced with insights (total tracked, most common emotion, average intensity) and clear next actions
  - **Consistent Pattern**: All wizards follow same pattern with progress bars, informative guidance, required field indicators, and inline examples
  - **Updated ThoughtRecords page**: Replaced emotion-first flow with direct thought recording wizard access
- October 15, 2025 (earlier). Code cleanup and TypeScript improvements
  - Removed duplicate `/emotion-tracking` route (kept `/emotions` as canonical route)
  - Removed broken `/analytics` page that had API errors and was not accessible from navigation
  - Fixed all 15 TypeScript warnings in Reports.tsx by adding proper type annotations (EmotionRecord[], ThoughtRecord[], Goal[])
  - Improved code quality and user experience with cleaner routing structure
- October 15, 2025. Implemented Smart Status auto-update system for goals - status now automatically updates based on milestone completion percentage (0% → pending, 1-99% → in_progress, 100% → completed)
- June 19, 2025. Initial setup
