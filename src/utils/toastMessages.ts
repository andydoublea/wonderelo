import { toast } from 'sonner@2.0.3';

/**
 * Centralized toast messages
 * Prevents duplication of common success/error messages across components
 */

/**
 * Authentication related messages
 */
export const AuthToasts = {
  signInSuccess: () => toast.success('Signed in successfully'),
  signInError: () => toast.error('Failed to sign in. Please check your credentials.'),
  signOutSuccess: () => toast.success('Logged out successfully'),
  signUpSuccess: () => toast.success('Account created successfully'),
  signUpError: () => toast.error('Failed to create account. Please try again.'),
  resetPasswordSuccess: () => toast.success('Password reset link sent to your email'),
  resetPasswordError: () => toast.error('Failed to send reset link. Please try again.'),
  passwordChangedSuccess: () => toast.success('Password changed successfully'),
  sessionExpired: () => toast.error('Your session has expired. Please sign in again.'),
  unauthorized: () => toast.error('You are not authorized to perform this action.'),
};

/**
 * Data loading messages
 */
export const LoadingToasts = {
  loadError: (resource: string) => toast.error(`Failed to load ${resource}`),
  saveSuccess: (resource: string = 'data') => toast.success(`${resource} saved successfully`),
  saveError: (resource: string = 'data') => toast.error(`Failed to save ${resource}`),
  deleteSuccess: (resource: string) => toast.success(`${resource} deleted successfully`),
  deleteError: (resource: string) => toast.error(`Failed to delete ${resource}`),
  updateSuccess: (resource: string = 'data') => toast.success(`${resource} updated successfully`),
  updateError: (resource: string = 'data') => toast.error(`Failed to update ${resource}`),
};

/**
 * Session management messages
 */
export const SessionToasts = {
  created: () => toast.success('Session created successfully'),
  updated: () => toast.success('Session updated successfully'),
  deleted: () => toast.success('Session deleted successfully'),
  createError: () => toast.error('Failed to create session'),
  updateError: () => toast.error('Failed to update session'),
  deleteError: () => toast.error('Failed to delete session'),
  published: () => toast.success('Session published successfully'),
  unpublished: () => toast.success('Session unpublished'),
};

/**
 * Registration messages
 */
export const RegistrationToasts = {
  success: () => toast.success('Registration successful!'),
  error: () => toast.error('Registration failed. Please try again.'),
  cancelled: () => toast.success('Registration cancelled'),
  confirmed: () => toast.success('Registration confirmed!'),
  verificationSent: () => toast.success('Verification email sent! Check your inbox.'),
  verificationError: () => toast.error('Failed to send verification email'),
  alreadyRegistered: () => toast.info('You are already registered for this round'),
};

/**
 * Validation messages
 */
export const ValidationToasts = {
  invalidEmail: () => toast.error('Please enter a valid email address'),
  invalidPhone: () => toast.error('Please enter a valid phone number'),
  requiredField: (fieldName: string) => toast.error(`${fieldName} is required`),
  invalidUrl: () => toast.error('Please enter a valid URL'),
  urlTaken: () => toast.error('This URL is already taken'),
  urlAvailable: () => toast.success('URL is available'),
};

/**
 * File upload messages
 */
export const UploadToasts = {
  success: (fileType: string = 'File') => toast.success(`${fileType} uploaded successfully`),
  error: (fileType: string = 'File') => toast.error(`Failed to upload ${fileType}`),
  invalidType: (allowedTypes: string) => toast.error(`Please select a valid file type (${allowedTypes})`),
  tooLarge: (maxSize: string) => toast.error(`File size must be less than ${maxSize}`),
  processing: (fileType: string = 'file') => toast.info(`Processing ${fileType}...`),
};

/**
 * Network messages
 */
export const NetworkToasts = {
  error: () => toast.error('Network error. Please check your connection.'),
  offline: () => toast.error('You are currently offline'),
  reconnected: () => toast.success('Connection restored'),
  slowConnection: () => toast.warning('Slow connection detected'),
};

/**
 * Copy to clipboard messages
 */
export const ClipboardToasts = {
  copied: (item: string = 'Content') => toast.success(`${item} copied to clipboard`),
  copyError: () => toast.error('Failed to copy to clipboard'),
};

/**
 * Generic messages
 */
export const GenericToasts = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message),
  noChanges: () => toast.info('No changes to save'),
  confirmAction: (action: string) => toast.info(`Please confirm ${action}`),
};

/**
 * Participant dashboard messages
 */
export const ParticipantToasts = {
  profileUpdated: () => toast.success('Profile updated successfully'),
  profileUpdateError: () => toast.error('Failed to update profile'),
  contactsSaved: () => toast.success('Contact information saved'),
  contactsError: () => toast.error('Failed to save contact information'),
  checkInSuccess: () => toast.success('Checked in successfully!'),
  checkInError: () => toast.error('Failed to check in'),
  attendanceConfirmed: () => toast.success('Attendance confirmed!'),
  noShowReported: () => toast.success('No-show reported'),
};

/**
 * Admin messages
 */
export const AdminToasts = {
  participantAdded: () => toast.success('Participant added successfully'),
  participantRemoved: () => toast.success('Participant removed'),
  participantUpdated: () => toast.success('Participant updated'),
  statusChanged: () => toast.success('Status changed successfully'),
  matchingComplete: () => toast.success('Matching completed successfully'),
  matchingError: () => toast.error('Failed to complete matching'),
  exportSuccess: () => toast.success('Data exported successfully'),
  exportError: () => toast.error('Failed to export data'),
};

/**
 * Settings messages
 */
export const SettingsToasts = {
  saved: () => toast.success('Settings saved successfully'),
  saveError: () => toast.error('Failed to save settings'),
  resetSuccess: () => toast.success('Settings reset to defaults'),
  resetError: () => toast.error('Failed to reset settings'),
};
