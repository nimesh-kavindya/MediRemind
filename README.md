# MediRemind 💊

MediRemind is a production-ready, AI-powered healthcare application designed to help users track their medication adherence securely and intuitively.

## Features

- **Offline Persistence**: Fully functional offline. Medications and syncs are handled seamlessly via Firestore IndexedDB caching.
- **Progressive Web App (PWA)**: Installable on desktop and mobile with background sync capabilities and custom app icons.
- **Smart Reminders**: Calculates next doses, missed doses, and provides browser notifications.
- **Advanced Analytics**: Visualizes adherence streaks, weekly progress, and medication types using beautiful Recharts.
- **Data Portability**: Export your health data to JSON or CSV, and import JSON backups seamlessly.
- **Premium UI**: Built with Tailwind CSS, Framer Motion, and Lucide React, supporting Light, Dark, and System themes.

## Architecture

- **Frontend**: React 19, Vite, React Router DOM, Tailwind CSS.
- **Backend & Auth**: Firebase Authentication, Cloud Firestore (with strict Security Rules).
- **Storage**: Firebase Storage (with client-side HTML5 canvas image compression).
- **Serverless AI**: Firebase Cloud Functions (Node.js) abstracts the Gemini API, ensuring the API key is never exposed to the client.

## Setup Instructions

### 1. Install Dependencies

In the root directory, run:
```bash
npm install
```

In the `functions/` directory, run:
```bash
cd functions
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory (for frontend config, if any):
```env
# Currently, the Gemini API is handled securely in the backend.
# Ensure your Firebase project configuration is properly set in src/utils/firebase.js
```

### 3. Firebase Configuration

You must create a Firebase project and enable:
- Authentication (Email/Password & Google)
- Cloud Firestore
- Firebase Storage
- Firebase Functions (Requires Blaze plan)
- 

### 4. Deployment

Deploy the entire architecture (Hosting, Firestore Rules, Storage Rules, Indexes, and Functions) using the Firebase CLI:

```bash
firebase deploy
```

## Testing

This project uses Vitest and React Testing Library for unit testing.

```bash
npm run test
```

## Security

This application utilizes robust Firebase Security Rules for both Firestore and Storage to guarantee that users can only read, write, or delete their own personal health data. AI requests are strictly authenticated at the Cloud Function level.
