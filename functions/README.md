# Cloud Functions for Smart Attendance

This directory contains Firebase Cloud Functions for the Smart Attendance system.

## Functions

### markAttendance

A secure serverless function that handles attendance marking with geofencing validation.

**Features:**

- **Geofencing Validation**: Validates student location against session geofence
- **Distance Calculation**: Uses Haversine formula for accurate GPS distance calculation
- **Authentication**: Requires user authentication
- **Duplicate Prevention**: Prevents multiple attendance marks for same student
- **Error Handling**: Comprehensive error handling with meaningful messages

**Parameters:**

- `sessionId` (string): The attendance session ID
- `studentId` (string): The student's unique ID
- `studentLatitude` (number): Student's current latitude (required for geofenced sessions)
- `studentLongitude` (number): Student's current longitude (required for geofenced sessions)

**Usage Example:**

```javascript
import { markAttendanceFunction } from "../firebase/config";

const result = await markAttendanceFunction({
  sessionId: "session123",
  studentId: "student456",
  studentLatitude: 37.7749,
  studentLongitude: -122.4194,
});
```

**Error Codes:**

- `unauthenticated`: User not signed in
- `permission-denied`: Student not within geofence radius
- `not-found`: Session not found or inactive
- `already-exists`: Attendance already marked
- `invalid-argument`: Missing required parameters

## Deployment

```bash
# Deploy functions
npm run deploy

# Test locally with emulator
npm run serve
```

## Dependencies

- `firebase-admin`: Firebase Admin SDK
- `firebase-functions`: Firebase Functions SDK
- `haversine-distance`: GPS distance calculation library
