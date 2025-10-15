# ResilienceHub - Replit.md

## Overview

ResilienceHub is a comprehensive mental health web application that provides cognitive behavioral therapy (CBT) interactive tools, connecting mental health professionals with their clients. The platform facilitates structured therapy sessions through emotion tracking, thought records, journaling, and goal setting features.

## System Architecture

### Frontend Architecture
- **React-based SPA**: Single-page application using modern React patterns with hooks
- **Component Library**: Built on shadcn/ui components with Radix UI primitives
- **State Management**: React Query for server state, Context API for global state
- **Styling**: Tailwind CSS for responsive, mobile-first design
- **Routing**: Wouter for client-side routing

### Backend Architecture
- **Node.js/Express**: RESTful API server with middleware-based architecture
- **Service Layer**: Domain-specific services for business logic (email, OpenAI, WebSocket)
- **Authentication**: Session-based authentication with secure cookie management
- **Database ORM**: Drizzle ORM for type-safe database operations

### Database Strategy
- **PostgreSQL**: Primary database hosted on Neon (serverless PostgreSQL)
- **Connection Pooling**: Optimized connection management with retry mechanisms
- **Schema Management**: Drizzle-kit for migrations and schema evolution

## Key Components

### User Management
- **Role-based Access Control**: Three user types (client, therapist, admin)
- **Client-Therapist Relationships**: Invitation system and client assignment
- **Session Management**: Secure session handling with fallback authentication

### Core Features
1. **Emotion Tracking**: Interactive emotion wheel with wizard-based 4-step flow, onboarding tour, and intensity tracking
2. **Thought Records**: Wizard-based 3-step thought recording with optional emotion linking and separate thought challenging
3. **Journaling**: AI-assisted journal analysis with emotion detection
4. **Goal Setting**: SMART goals with smart milestone tracking and automatic status updates
5. **Reframe Coach**: Interactive cognitive restructuring practice
6. **Progress Tracking**: Cross-component insights and analytics

### UX Pattern - Wizard-Based Flows
All core modules follow a consistent wizard-based pattern:
- **Step-by-step guidance**: Progress bar showing "Step X of Y" with percentage
- **Informative guidance**: Blue info boxes explaining "Why This Step?" at each stage
- **Required fields**: Marked with red asterisk (*) and minimum character validation
- **Inline examples**: Placeholder text and FormDescription showing examples
- **Success dialogs**: Post-submission insights with clear next actions
- **Navigation**: Previous/Next buttons with validation before advancing
- **First-time onboarding**: localStorage-persisted tours for new users

### AI Integration
- **OpenAI Integration**: Journal analysis, emotion detection, and reframe coaching
- **Caching System**: Smart caching for AI responses to reduce API costs
- **Fallback Handling**: Graceful degradation when AI services are unavailable

## Data Flow

### Authentication Flow
1. User logs in with credentials
2. Server validates and creates session
3. Session ID stored in secure cookie
4. Middleware validates session on each request
5. User context available throughout application

### Data Sync Flow
1. Client actions trigger API calls
2. Server validates user permissions
3. Database operations through Drizzle ORM
4. Real-time updates via WebSocket (when enabled)
5. Client state updates via React Query

### Therapist-Client Data Flow
1. Therapist selects client from dashboard
2. Server validates therapist-client relationship
3. All subsequent requests scoped to selected client
4. Client data accessible through consistent API endpoints

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL hosting
- **OpenAI API**: AI-powered journal analysis and reframe coaching
- **SparkPost**: Email delivery service for notifications and reminders

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across frontend and backend
- **Drizzle**: Database ORM and migration tool
- **React Query**: Server state management and caching

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide Icons**: Consistent icon library
- **Recharts**: Data visualization components

## Deployment Strategy

### Replit Deployment
- **Autoscale Target**: Configured for automatic scaling
- **Build Process**: Vite build for frontend, ESBuild for backend
- **Environment Variables**: Secure configuration management
- **Port Configuration**: Frontend (5000), Backend API (same port)

### Database Management
- **Migration Strategy**: Drizzle-kit for schema changes
- **Connection Pooling**: Optimized for serverless environment
- **Backup Strategy**: Managed by Neon platform

### Security Considerations
- **Cookie Security**: Secure, HttpOnly cookies with proper SameSite settings
- **CORS Handling**: Configured for Replit's domain structure
- **Rate Limiting**: Basic rate limiting for API endpoints
- **Input Validation**: Zod schemas for request validation

## Changelog

- October 15, 2025 (latest). Enhanced thought categorization with detailed definitions and multiple examples
  - **Improved Category Descriptions**: Each of the 5 thought categories now has a comprehensive definition explaining what it means
  - **Multiple Examples**: Expanded from 2 to 3-4 relatable examples per category to help users better understand
  - **Categories Enhanced**:
    - About Yourself: "Thoughts that judge your abilities, worth, character, or identity as a person"
    - About Others: "Thoughts about what other people think of you or how they perceive you"
    - About the Future: "Predictions, worries, or expectations about what will happen next or in the future"
    - About the Past: "Regrets, criticisms, or negative thoughts about things that already happened"
    - About the Situation: "Judgments or interpretations about your current circumstances or what's happening around you"
  - **Fixed Value Consistency**: Changed "about_self" to "about_yourself" to match database schema
  - **Educational UX**: Step 3 of ThoughtRecordWizard now serves as a learning tool with clear definitions and examples
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

## User Preferences

Preferred communication style: Simple, everyday language.