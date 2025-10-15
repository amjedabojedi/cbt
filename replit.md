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
1. **Emotion Tracking**: Interactive emotion wheel with intensity tracking
2. **Thought Records**: CBT thought challenging with cognitive distortion identification
3. **Journaling**: AI-assisted journal analysis with emotion detection
4. **Goal Setting**: SMART goals with smart milestone tracking and automatic status updates
5. **Reframe Coach**: Interactive cognitive restructuring practice
6. **Progress Tracking**: Cross-component insights and analytics

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

- October 15, 2025. Implemented Smart Status auto-update system for goals - status now automatically updates based on milestone completion percentage (0% → pending, 1-99% → in_progress, 100% → completed)
- June 19, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.