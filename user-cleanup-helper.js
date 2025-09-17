// Quick User Cleanup Utility
// Run this in browser console on Firebase Authentication page

// 1. Go to: https://console.firebase.google.com/project/attendance-d7971/authentication/users
// 2. Open browser developer tools (F12)
// 3. Paste and run this script:

console.log('🔧 Firebase Auth User Cleanup Helper');
console.log('📍 Current page should be: Firebase Console > Authentication > Users');
console.log('');
console.log('🎯 To delete a user:');
console.log('1. Find the user by email address');
console.log('2. Click the three dots (⋮) menu');
console.log('3. Select "Delete account"');
console.log('4. Confirm deletion');
console.log('');
console.log('✅ After deletion, the email will be available for re-registration');
console.log('');
console.log('🚀 For automatic deletion, upgrade to Blaze plan and deploy Cloud Functions');

// Auto-scroll to show all users
setTimeout(() => {
  window.scrollTo(0, document.body.scrollHeight);
}, 1000);