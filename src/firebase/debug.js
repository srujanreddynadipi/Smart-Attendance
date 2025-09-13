import { auth } from '../firebase/config';
import { connectAuthEmulator } from 'firebase/auth';

// Debug Firebase Auth configuration
export const debugFirebaseAuth = () => {
  console.log('🔍 Firebase Auth Debug Information:');
  console.log('Auth instance:', auth);
  console.log('Auth config:', auth.config);
  console.log('Auth app:', auth.app);
  console.log('Environment variables:');
  console.log('API Key:', process.env.REACT_APP_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('Auth Domain:', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing');
  console.log('Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
  
  // Check if we're accidentally using emulator
  if (auth._delegate && auth._delegate.emulator) {
    console.log('⚠️ WARNING: Auth emulator detected');
  }
};