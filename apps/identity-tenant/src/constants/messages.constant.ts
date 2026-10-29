export const RESPONSE_MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Login successful',
    GOOGLE_LOGIN_SUCCESS: 'Google login successful',
    SUPERADMIN_LOGIN_SUCCESS: 'SuperAdmin login successful',
    DASHBOARD_LOGIN_SUCCESS: 'Dashboard user login successful',
    REGISTRATION_SUCCESS:
      'Registration successful. Please check your email to verify your account.',
    EMAIL_VERIFIED_SUCCESS: 'Email verified successfully. You can now log in.',
    TOKEN_ROTATED_SUCCESS: 'Token rotated successfully',
    TOKEN_REFRESHED_SUCCESS: 'Token refreshed successfully',
    LOGGED_OUT_SUCCESS: 'Logged out successfully',
    PASSWORD_RESET_SENT:
      'If that email exists, a password reset link has been sent.',
    PASSWORD_RESET_SUCCESS:
      'Password has been successfully reset. You can now log in.',
    USER_INVITED_SUCCESS: 'Dashboard user invited successfully',
    TENANT_STATUS_UPDATED: (status: string) =>
      `Tenant ${status === 'active' ? 'reactivated' : 'suspended'} successfully`,
  },
  ERRORS: {
    // Service-level error codes thrown across use-cases
    EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    USER_ID_REQUIRED: 'USER_ID_REQUIRED',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    REFRESH_TOKEN_REQUIRED: 'REFRESH_TOKEN_REQUIRED',
    INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
    INVALID_OR_EXPIRED_TOKEN: 'INVALID_OR_EXPIRED_TOKEN',
    INVALID_OR_EXPIRED_REFRESH_TOKEN: 'INVALID_OR_EXPIRED_REFRESH_TOKEN',
    INVALID_OR_REVOKED_REFRESH_TOKEN: 'INVALID_OR_REVOKED_REFRESH_TOKEN',
    SUPERADMIN_NOT_FOUND: 'SUPERADMIN_NOT_FOUND',
    SUPERADMIN_ALREADY_EXISTS: 'SUPERADMIN_ALREADY_EXISTS',
    TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
    FAILED_TO_UPDATE_TENANT_STATUS: 'FAILED_TO_UPDATE_TENANT_STATUS',
    EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
    ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
    GOOGLE_ID_TOKEN_REQUIRED: 'GOOGLE_ID_TOKEN_REQUIRED',
    INVALID_GOOGLE_PAYLOAD: 'INVALID_GOOGLE_PAYLOAD',
    TENANT_NOT_FOUND_OR_INACTIVE: 'TENANT_NOT_FOUND_OR_INACTIVE',
    ONLY_ACTIVE_TENANTS_CAN_BE_SUSPENDED: 'ONLY_ACTIVE_TENANTS_CAN_BE_SUSPENDED',
    CRAWL_JOB_NOT_FOUND: 'CRAWL_JOB_NOT_FOUND',

    // Controller input validation messages
    MISSING_REQUIRED_FIELDS: 'Missing required fields',
    EMAIL_AND_PASSWORD_REQUIRED: 'Email and password are required',
    VERIFICATION_TOKEN_REQUIRED: 'Verification token is required',
    REFRESH_TOKEN_REQUIRED_INPUT: 'Refresh token is required',
    EMAIL_REQUIRED: 'Email is required',
    TENANT_ID_REQUIRED: 'Tenant ID is required',
    SUPERADMIN_ID_REQUIRED: 'SuperAdmin ID is required',
    TOKEN_AND_NEW_PASSWORD_REQUIRED: 'Token and new password are required',
    GOOGLE_ID_TOKEN_REQUIRED_INPUT: 'Google ID token is required',

    // gRPC Filter human-readable translated messages
    INTERNAL_SERVER_ERROR: 'Internal server error',
    ACCOUNT_ALREADY_EXISTS: 'An account or user with this email already exists',
    INVALID_VERIFICATION_TOKEN: 'Invalid or expired verification token',
    INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password',
    VERIFY_EMAIL_PROMPT: 'Please verify your email before logging in',
    ACCOUNT_INACTIVE_PROMPT: 'Your account is not active. Please contact support.',
    SESSION_EXPIRED: 'Session expired or invalid. Please log in again.',
    TENANT_NOT_FOUND_MSG: 'Tenant not found',
    ONLY_ACTIVE_TENANTS_CAN_BE_SUSPENDED_MSG: 'Only active tenants can be suspended',
    CRAWL_JOB_NOT_FOUND_MSG: 'Crawl job not found',
  },
} as const;
