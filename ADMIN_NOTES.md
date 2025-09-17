# Admin Dashboard - User Management Notes

## Current Functionality

### Delete vs Deactivate Users
- **Delete (Hard Delete)**: Permanently removes user data from Firestore database
- **Deactivate (Soft Delete)**: Marks user as inactive but preserves data for audit trail

### Important Limitations

#### Firebase Auth vs Firestore
When you delete a user from the admin dashboard, it only removes their data from Firestore (the database). **It does NOT remove their Firebase Authentication account.**

This means:
- ✅ User data is removed from the database
- ❌ The email address remains registered in Firebase Auth
- ❌ You cannot re-register with the same email address

### Workarounds for Email Reuse

1. **Use a different email**: The simplest solution for new registrations
2. **Firebase Console**: Manually delete the user from Firebase Auth console
3. **Backend Function**: Implement a Firebase Cloud Function with admin privileges

### Error Messages
If someone tries to register with a previously used email, they will see:
- "The email address is already in use by another account"
- This happens even after "deleting" the user from admin dashboard

### Technical Details
- Client-side applications cannot delete Firebase Auth users due to security restrictions
- Only server-side code with admin privileges can delete Auth accounts
- This is a Firebase security feature, not a bug in the application

## Recommendations

### For Immediate Use
1. When a user needs to re-register, use a different email address
2. Document this limitation for administrators
3. Consider implementing the deactivate option instead of delete for most cases

### For Future Enhancement
1. Implement Firebase Cloud Functions for complete user deletion
2. Add email change functionality for existing users
3. Implement user reactivation instead of re-registration

## Contact Admin
If you need to completely remove an email address for re-registration:
1. Contact a Firebase project administrator
2. Request manual deletion from Firebase Console
3. Or wait for Cloud Function implementation