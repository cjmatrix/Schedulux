export const RESPONSE_MESSAGES = {
  CHAT: {
    SESSION_INITIALIZED: 'Public chat session initialized successfully',
    CHAT_PROCESSED: 'Customer chat message processed successfully',
    MESSAGES_RETRIEVED: 'Customer messages retrieved successfully',
    CONFIG_RETRIEVED: 'Widget configuration retrieved successfully',
    INVALID_SESSION_TOKEN: 'Invalid, malformed, or tampered session token.',
    FORBIDDEN_ORIGIN: 'Access denied: Website origin is not authorized for this agent.',
  },
} as const;
