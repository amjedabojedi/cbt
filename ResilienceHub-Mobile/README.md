# ResilienceHub Mobile App

A React Native mobile application for clients to track emotions, journal entries, and thought records while staying connected with their therapists.

## Features

- **User Authentication**: Login using existing ResilienceHub credentials
- **Emotion Tracking**: Log emotions with intensity, location, company, and situation details
- **Dashboard**: View recent activity and quick access to key features
- **Real-time Sync**: All data syncs with the web application through shared backend

## Project Structure

```
ResilienceHub-Mobile/
├── App.tsx                    # Main app component with navigation
├── src/
│   ├── services/
│   │   └── api.ts            # API service for backend communication
│   └── screens/
│       ├── LoginScreen.tsx   # Authentication screen
│       ├── DashboardScreen.tsx # Main dashboard
│       └── EmotionTrackingScreen.tsx # Emotion logging
├── app.json                  # Expo configuration
└── package.json             # Dependencies and scripts
```

## Key Features Built

### 1. API Service (`src/services/api.ts`)
- Connects to your existing backend at the same endpoints
- Handles authentication, emotions, thought records, journal entries, and goals
- Cookie-based session management for security

### 2. Login Screen (`src/screens/LoginScreen.tsx`)
- Clean, professional design matching your web app
- Secure authentication using existing user credentials
- Error handling and loading states

### 3. Dashboard Screen (`src/screens/DashboardScreen.tsx`)
- Welcome message with user's name
- Quick action buttons for main features
- Recent emotions display
- Pull-to-refresh functionality

### 4. Emotion Tracking Screen (`src/screens/EmotionTrackingScreen.tsx`)
- Complete emotion tracking with all fields from web app:
  - Emotion selection (12 common emotions)
  - Intensity rating (1-10 scale)
  - Location, company, and situation details
- Intuitive mobile-friendly interface
- Data saves directly to your existing database

## Getting Started

1. **Install Dependencies**:
   ```bash
   cd ResilienceHub-Mobile
   npm install
   ```

2. **Configure API URL**:
   Update `app.json` to point to your deployed backend:
   ```json
   "extra": {
     "apiBaseUrl": "https://your-actual-domain.replit.dev"
   }
   ```

3. **Run the App**:
   ```bash
   npx expo start
   ```

## Technical Details

- **Cross-Platform**: Same code runs on iOS and Android
- **Shared Backend**: Uses your existing PostgreSQL database and API endpoints
- **Consistent Data**: Same user accounts work on both web and mobile
- **Real-time Sync**: Changes appear instantly across all platforms

## Next Steps

The foundation is complete! You can now:
- Test the app with your existing user accounts
- Add more screens (Journal, Thought Records, Goals)
- Customize the design to match your brand
- Deploy to app stores when ready

All the core infrastructure is in place to connect seamlessly with your existing web application.