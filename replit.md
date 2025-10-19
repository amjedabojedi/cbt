# ResilienceHub

## Overview
ResilienceHub is a mental health web application offering interactive cognitive behavioral therapy (CBT) tools to connect mental health professionals with clients. It provides features like emotion tracking, thought records, journaling, and goal setting to facilitate structured therapy and enhance mental well-being.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **React-based SPA**: Modern React with hooks.
- **Component Library**: shadcn/ui and Radix UI primitives.
- **State Management**: React Query for server state, Context API for global state.
- **Styling**: Tailwind CSS for responsive, mobile-first design.
- **Routing**: Wouter for client-side routing.

### Backend
- **Node.js/Express**: RESTful API server with middleware.
- **Service Layer**: Dedicated services for business logic (email, OpenAI, WebSocket).
- **Authentication**: Session-based with secure cookie management.
- **Database ORM**: Drizzle ORM for type-safe operations.

### Database
- **PostgreSQL**: Primary database hosted on Neon (serverless).
- **Connection Pooling**: Optimized connection management.
- **Schema Management**: Drizzle-kit for migrations.

### Key Features
- **User Management**: Role-based access control (client, therapist, admin) and client-therapist assignment.
- **Core Therapeutic Tools**:
    - **Emotion Tracking**: Interactive emotion wheel, 4-step wizard, onboarding, intensity tracking.
    - **Thought Records**: 3-step wizard for recording thoughts, linking emotions, and challenging, incorporating 12 clinical CBT ANT categories.
    - **Journaling**: AI-assisted analysis for emotion detection.
    - **Goal Setting**: SMART goals with milestone tracking and automatic status updates.
    - **Reframe Coach**: Interactive cognitive restructuring.
- **Progress Tracking**: Cross-component insights and analytics.

### UI/UX Design Patterns
- **Wizard-Based Flows**: Consistent step-by-step guidance with progress bars, "Why This Step?" sections, validation, and success dialogs, including first-time user onboarding tours.
- **Unified Module Pages**: All core modules (Emotion Tracking, Thought Records, Smart Goals, Journal) share a consistent structure: Module Header, Three-Tab Layout ("Creation/Wizard Tab", "History/View Tab", and "Insights Tab"), and Educational Accordion.
- **Visual Consistency**: Adherence to consistent card styles, spacing, typography, and color schemes.
- **Progressive Learning**: CBT concepts introduced through action before explicit terminology.
- **Data-Driven Progress**: Real-time statistics to motivate engagement.

### AI Integration
- **OpenAI Integration**: Powers journal analysis, emotion detection, and reframe coaching.
- **Caching System**: Smart caching for OpenAI responses.
- **Fallback Handling**: Graceful degradation for AI service unavailability.

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **OpenAI API**: AI-powered features.
- **SparkPost**: Email delivery service.

### Development Tools
- **Vite**: Build tool and development server.
- **TypeScript**: Ensures type safety.
- **Drizzle**: ORM and migration tool.
- **React Query**: Server state management and caching.

### UI/UX Libraries
- **Radix UI**: Accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide Icons**: Consistent icon library.
- **Recharts**: Data visualization components.

## Changelog

- October 19, 2025 (latest). Complete UI Standardization: Card Grid Layout with Dropdown Menus Across All Modules
  - **Emotion Tracking**: Converted from Table layout to Card Grid (2-3 columns responsive, `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
  - **All Modules Now Unified**: Emotion Tracking, Thought Records, Journal, and Goals all use identical Card Grid layout pattern
  - **Dropdown Menu Pattern**: Replaced footer/inline action buttons with consistent DropdownMenu component in card headers
    - Icon: MoreVertical (three vertical dots) positioned in top-right of each card
    - Alignment: `align="end"` for right-aligned dropdown
    - Actions: View Details, Edit, Delete (with DropdownMenuSeparator before destructive actions)
    - Module-specific actions: Add Thought Record (Emotion), Challenge Thought/Practice (Thought Records), View Milestones (Goals)
  - **Table Retained for Full History Dialog**: Emotion Tracking Full History Dialog intentionally uses Table for comprehensive multi-column data view
  - **Fixed Runtime Error**: Restored Table component imports for Full History Dialog in EmotionHistory.tsx
  - **Goals Module**: Removed non-functional Delete option from dropdown menu
  - **Visual Consistency**: All modules now share identical card styling, grid layout, and action menu patterns for cohesive user experience

- October 17, 2025. Enhanced Thought Records Insights with Distortion-Emotion Correlation Analysis
  - **New Feature: Distortion-Emotion Patterns Bubble Chart**: Interactive bubble chart showing which cognitive distortions appear with which core emotions
    - X-axis displays all cognitive distortions (All or Nothing Thinking, Catastrophizing, etc.)
    - Y-axis shows core emotions from emotion records (Fear, Sadness, Anger, Joy, Love, Surprise, Disgust)
    - Bubble size represents frequency of that specific distortion-emotion combination
    - Interactive tooltips show distortion name, emotion name, and exact frequency count
    - Helps users identify their thinking patterns in context of emotional states (e.g., "When I feel Fear, I catastrophize")
  - **Chart Layout Improvements**: All charts now display at full width individually (no side-by-side layouts) for better readability on all screen sizes
  - **Challenge Success Section Redesign**: Split into two separate full-width charts
    - Challenge Rate pie chart showing percentage of thoughts challenged vs not challenged
    - Belief Shift bar chart showing how belief changes from original thought to balanced alternative
  - **Critical Bug Fix**: ANT Patterns (Cognitive Distortions) chart now displays correctly by reading from `thoughtCategory` field instead of empty `cognitiveDistortions` field
  - **Label Mapping**: Added getCategoryLabel() function to convert snake_case values (all_or_nothing, mental_filter, etc.) to readable labels ("All or Nothing Thinking", "Mental Filter", etc.)
  - **Visual Enhancement**: All bar charts use vertical orientation with angled labels for better readability; Y-axis displays whole numbers only for count data
  - **Data Field Mapping**: Established that `thoughtCategory` contains actual distortions across the application, not `cognitiveDistortions` which remains empty

- October 16, 2025. Consolidated Reframe Coach navigation into unified 3-tab page
  - **Navigation Cleanup**: Removed separate `/users/:userId/reframe-history` route and ReframeHistoryPage.tsx
  - **Unified Route**: All reframe coach features now accessible through `/reframe-coach` or `/users/:userId/reframe-coach` with tab parameter
  - **Tab Navigation**: History tab accessible via `?tab=history`, Insights via `?tab=insights` query parameters
  - **URL Synchronization**: Implemented robust tab state management with `useLocation` to keep URL and active tab in perfect sync
    - URL automatically normalizes to valid tab when loading with invalid parameters
    - Tab changes update URL query parameter via navigate with replace
    - Therapist/client-view contexts handled correctly (practice tab unavailable when viewing client data)
  - **Updated References**: Updated all navigation links across app (ThoughtRecordsList, ReframePractice, PracticeResultsSummary) to point to unified page with `?tab=history`
  - **Bug Fix**: Fixed null handling in ReframeCoachPage for avgScore to prevent runtime error with `.toFixed()` on null/undefined values
  - **Consistent UX**: Reframe Coach now follows same 3-tab pattern as all other core modules (Start Practice → History → Insights)