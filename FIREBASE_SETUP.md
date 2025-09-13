# Attendance System - Firebase Setup Guide

This attendance system uses Firebase Firestore as the online database for easy deployment and real-time functionality.

## 🚀 Quick Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "attendance-system")
4. Enable/disable Google Analytics (optional)
5. Click "Create project"

### 2. Set up Firestore Database

1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location closest to your users
5. Click "Done"

### 3. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) to add a web app
4. Register your app with a nickname
5. Copy the configuration object

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Replace the values in `.env` with your Firebase config:
   ```
   REACT_APP_FIREBASE_API_KEY=your_actual_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

### 5. Set up Firestore Security Rules (Optional)

For production, update Firestore rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents
    // Update these rules based on your authentication needs
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 6. Run the Application

```bash
npm start
```

## 📊 Database Structure

The system creates these Firestore collections:

### Students Collection
```javascript
{
  studentId: "ST001",
  name: "John Doe",
  email: "john@email.com",
  classId: "CS-301",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Sessions Collection
```javascript
{
  teacherId: "teacher_001",
  classId: "CS-301",
  subject: "Computer Science",
  qrCode: "ABC123XYZ",
  location: {
    lat: 40.7128,
    lng: -74.0060,
    address: "Room 101"
  },
  startTime: timestamp,
  isActive: true,
  createdAt: timestamp
}
```

### Attendance Collection
```javascript
{
  studentId: "ST001",
  sessionId: "session_id",
  status: "present", // present, absent, late
  timestamp: timestamp,
  method: "qr", // qr, manual
  location: {
    lat: 40.7128,
    lng: -74.0060
  }
}
```

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Connect your GitHub repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### Option 2: Netlify

1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com)
3. Connect your repository
4. Add environment variables
5. Set build command: `npm run build`
6. Set publish directory: `build`
7. Deploy!

### Option 3: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 🔧 Features

- ✅ Real-time attendance updates
- ✅ QR code generation for sessions
- ✅ Location-based attendance verification
- ✅ Manual attendance marking
- ✅ Student management
- ✅ Session history
- ✅ Attendance statistics
- ✅ Export functionality (coming soon)

## 🛠️ Development

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 📝 Notes

- Firebase free tier includes 1GB storage and 50,000 reads/day
- For production, consider implementing authentication
- Update Firestore security rules before going live
- The app automatically creates sample students on first run

## 🔒 Security Considerations

1. Set up Firebase Authentication for production
2. Update Firestore security rules
3. Implement role-based access control
4. Use HTTPS for all communications
5. Validate all user inputs

## 🆘 Troubleshooting

**Firebase initialization error:**
- Check if all environment variables are set correctly
- Verify Firebase project is active
- Ensure Firestore is enabled

**Permission denied:**
- Update Firestore security rules
- Check if user has proper permissions

**App not loading:**
- Check console for errors
- Verify all dependencies are installed
- Ensure environment variables are prefixed with `REACT_APP_`