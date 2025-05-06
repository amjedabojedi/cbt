# Architecture Overview

## 1. Overview

This application is a mental health platform designed for therapists and clients, focusing on emotion tracking, thought records, journaling, and goal setting. The system follows a modern full-stack architecture with the following key characteristics:

- **Client-server architecture**: Separate frontend and backend codebases
- **React-based SPA frontend**: Using modern React patterns and component libraries
- **Node.js/Express backend**: RESTful API serving the frontend
- **PostgreSQL database**: Managed through Drizzle ORM
- **Authentication**: Session-based authentication with cookies
- **Role-based access control**: Different interfaces for therapists, clients, and administrators

## 2. System Architecture

### 2.1 High-Level Architecture

The application follows a standard three-tier architecture:

1. **Presentation Layer**: React-based single-page application
2. **Application Layer**: Express.js server with RESTful API endpoints
3. **Data Layer**: PostgreSQL database accessed via Drizzle ORM

### 2.2 Frontend Architecture

The frontend is built with React and follows these design principles:

- **Component-based architecture**: Using reusable UI components
- **Hooks-based state management**: Custom hooks for shared logic
- **Context API**: For global state such as authentication and client selection
- **React Query**: For data fetching, caching, and state management
- **shadcn/ui**: Component library based on Radix UI primitives
- **Tailwind CSS**: For styling components

### 2.3 Backend Architecture

The backend is built with Express.js and structured as follows:

- **RESTful API**: Provides structured endpoints for data access and manipulation
- **Service-oriented architecture**: Logic organized into domain-specific services
- **Middleware-based request processing**: For authentication, authorization, and request validation
- **Database abstraction**: Using Drizzle ORM for type-safe database access

### 2.4 Database Architecture

The database is PostgreSQL, structured according to the application domains:

- **User management**: Accounts, roles, relationships between therapists and clients
- **Therapy data**: Emotion records, thought records, journal entries
- **Goal tracking**: Goals, milestones, actions
- **Resource management**: Therapy resources and assignments
- **Subscription management**: Plans, payments via Stripe

## 3. Key Components

### 3.1 Frontend Components

#### 3.1.1 Core Components

- **Authentication**: Login, register, and session management (`AuthProvider`)
- **Layout**: Common UI layout with navigation
- **Client Context**: For therapists to switch between client data views
- **Form Components**: Reusable form elements with validation

#### 3.1.2 Feature Components

- **Emotion Tracking**: Recording and visualizing emotions
- **Thought Records**: Cognitive behavioral therapy worksheets
- **Journaling**: Text entries with AI-powered analysis
- **Goal Setting**: Creating and tracking therapeutic goals
- **Resource Library**: Therapy resources and materials
- **Reports**: Data visualization and progress tracking

### 3.2 Backend Components

#### 3.2.1 API Routes

- **Authentication routes**: Login, registration, session management
- **User routes**: Profile management, therapist-client relationships
- **Therapy data routes**: Emotion records, thought records, journals
- **Goal routes**: Goals, milestones, progress tracking
- **Integration routes**: Cross-component data integration
- **Subscription routes**: Plan management, payments

#### 3.2.2 Services

- **Email Service**: Client communication via SparkPost
- **Emotion Mapping Service**: Standardized emotion taxonomy
- **OpenAI Service**: AI analysis of journal entries
- **WebSocket Service**: Real-time notifications
- **Reminders Service**: Scheduled notifications

### 3.3 Database Schema

The database schema is defined using Drizzle ORM and includes these core tables:

- **users**: User accounts with role-based permissions
- **subscriptionPlans**: Different subscription tiers
- **emotionRecords**: Tracked emotions with metadata
- **thoughtRecords**: CBT thought records
- **journalEntries**: User journal entries with AI analysis
- **goals/goalMilestones/actions**: Goal tracking system
- **resources/resourceAssignments**: Therapy resources

## 4. Data Flow

### 4.1 Authentication Flow

1. User submits credentials
2. Server validates and creates a session
3. Session ID stored in secure HTTP-only cookie
4. Subsequent requests include the cookie for authentication
5. Session timeout or explicit logout destroys the session

### 4.2 Therapist-Client Interaction Flow

1. Therapist logs in with therapist role
2. System presents list of assigned clients
3. Therapist selects client to view
4. All subsequent data operations are performed in the context of the selected client
5. Client selection is persisted in both database and client-side state

### 4.3 Emotion Tracking Flow

1. User selects emotions from emotion wheel or list
2. Emotion data recorded with intensity, situation context
3. Data stored and visualized in reports
4. For therapists, client emotion data is available for review

### 4.4 Journal Entry Analysis Flow

1. User creates journal entry
2. Optional AI analysis triggered on server
3. Analysis results (emotions, cognitive distortions, themes) returned
4. Results displayed to user and stored with the entry
5. Therapists can view and comment on client journal entries

## 5. External Dependencies

### 5.1 Frontend Dependencies

- **React**: UI library
- **TanStack Query (React Query)**: Data fetching and state management
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui and Radix UI**: UI component library
- **Lucide**: Icon library
- **date-fns**: Date manipulation
- **Recharts**: Chart visualization
- **react-hook-form and zod**: Form validation

### 5.2 Backend Dependencies

- **Express**: Web framework
- **Drizzle ORM**: Database access and schema definition
- **Neon Database**: Serverless PostgreSQL provider
- **bcrypt**: Password hashing
- **OpenAI API**: For AI-powered journal analysis
- **SparkPost**: Email service
- **Stripe**: Payment processing
- **WebSocket**: Real-time communication

## 6. Deployment Strategy

### 6.1 Development Environment

- **Vite**: Modern build tool for the React frontend
- **ESBuild**: For bundling the server code
- **TypeScript**: For type safety across the application
- **Replit**: Development and hosting platform

### 6.2 Production Deployment

- **Build Process**: Frontend built with Vite, server with ESBuild
- **Static Assets**: Frontend built to static files served by Express
- **Server**: Node.js runtime for the Express application
- **Database**: Neon serverless PostgreSQL
- **Scaling**: Autoscaling configuration via Replit

### 6.3 Environment Configuration

- **Environment Variables**: For secrets and configuration
- **Production vs. Development**: Different behaviors based on NODE_ENV
- **Database Connection**: Configured via DATABASE_URL environment variable

### 6.4 Third-Party Service Integration

- **OpenAI API**: Configured with API key for AI analysis
- **SparkPost**: Email service with API key
- **Stripe**: Payment processing with publishable and secret keys

## 7. Security Considerations

### 7.1 Authentication and Authorization

- **Password Security**: Bcrypt for password hashing
- **Session Management**: Secure HTTP-only cookies
- **Role-Based Access Control**: Different permissions for clients, therapists, and admins

### 7.2 Data Protection

- **Sensitive Data**: Encrypted in transit via HTTPS
- **API Security**: Validate user access to resources
- **Input Validation**: Zod schemas for request validation

### 7.3 External Service Security

- **API Keys**: Stored as environment variables, not in code
- **Limited Permissions**: Services configured with minimum necessary access