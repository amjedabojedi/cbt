# ResilienceHub

## Overview
ResilienceHub is a mental health web application designed to connect mental health professionals with clients through interactive cognitive behavioral therapy (CBT) tools. It aims to facilitate structured therapy and enhance mental well-being by providing features for emotion tracking, thought records, journaling, and goal setting. The project's vision is to offer a comprehensive platform for managing and improving mental health through proven therapeutic techniques.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The application is a React-based Single Page Application (SPA) utilizing modern React with hooks. UI components are built with `shadcn/ui` and `Radix UI` primitives. State management is handled by `React Query` for server state and the Context API for global application state. Styling is achieved with `Tailwind CSS` for a responsive, mobile-first design, and `Wouter` is used for client-side routing.

### Backend
The backend is a `Node.js/Express` server providing a RESTful API with middleware. Business logic for services like email, OpenAI integration, and WebSockets is managed through a dedicated service layer. Authentication is session-based with secure cookie management. `Drizzle ORM` is used for type-safe database operations.

### Database
`PostgreSQL` serves as the primary database, hosted on Neon (serverless). It utilizes connection pooling for optimized performance. Schema management and migrations are handled by `Drizzle-kit`.

### Key Features
- **User Management**: Includes role-based access control (client, therapist, admin) and client-therapist assignment.
- **Core Therapeutic Tools**:
    - **Emotion Tracking**: Interactive emotion wheel, 4-step wizard, onboarding, and intensity tracking.
    - **Thought Records**: 3-step wizard for recording thoughts, linking emotions, and challenging, incorporating 12 clinical CBT ANT categories.
    - **Journaling**: AI-assisted analysis for emotion detection.
    - **Goal Setting**: SMART goals with milestone tracking and automatic status updates.
    - **Reframe Coach**: Interactive cognitive restructuring practice.
- **Progress Tracking**: Provides cross-component insights and analytics for user progress.

### UI/UX Design Patterns
The application employs consistent design patterns:
- **Wizard-Based Flows**: Step-by-step guidance with progress bars, "Why This Step?" sections, validation, and success dialogs, including first-time user onboarding tours.
- **Unified Module Pages**: Core modules (Emotion Tracking, Thought Records, Smart Goals, Journal) share a consistent structure: Module Header, Three-Tab Layout ("Creation/Wizard Tab", "History/View Tab", and "Insights Tab"), and Educational Accordion.
- **Visual Consistency**: Adherence to consistent card styles, spacing, typography, and color schemes.
- **Progressive Learning**: CBT concepts are introduced through action before explicit terminology.
- **Data-Driven Progress**: Real-time statistics are used to motivate user engagement.
- **Standardized Dialogs**: Detail views across modules use a unified dialog structure with sticky headers, icon badges, and card-based content.
- **Card Grid Layout**: All core modules utilize a responsive card grid layout with consistent dropdown menus for actions like "View Details," "Edit," and "Delete."

### AI Integration
`OpenAI` is integrated to power features such as journal analysis, emotion detection, and reframe coaching. The integration includes a caching system for responses and fallback handling for service unavailability.

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **OpenAI API**: Provides AI-powered features.
- **SparkPost**: Used for email delivery services.

### Development Tools
- **Vite**: Build tool and development server.
- **TypeScript**: Ensures type safety throughout the codebase.
- **Drizzle**: ORM and migration tool for database interactions.
- **React Query**: Manages server state and caching.

### UI/UX Libraries
- **Radix UI**: Provides accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Lucide Icons**: Consistent icon library.
- **Recharts**: Utilized for data visualization components.

## Recent Changes

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