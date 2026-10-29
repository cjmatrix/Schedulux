export const RESPONSE_MESSAGES = {
  SERVICE: {
    CREATED: 'Service created successfully',
    RETRIEVED: 'Service retrieved successfully',
    UPDATED: 'Service updated successfully',
    DELETED: 'Service deleted successfully',
  },
  RESOURCE: {
    CREATED: 'Resource created successfully',
    RETRIEVED: 'Resource retrieved successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
  },
  BOOKING: {
    CREATED: 'Booking created successfully',
  },
  INVENTORY: {
    BATCH_SYNC_SUCCESS: 'Batch sync completed successfully',
    BATCH_SYNC_FAILED: 'Batch sync failed',
  },
  ERRORS: {
    INTERNAL_SERVER_ERROR: 'Internal server error',
    MICROSERVICE_ERROR: 'Microservice error',
    MISSING_TENANT_ID: 'Missing tenant_id',
    TENANT_ID_REQUIRED: 'tenant_id is required',
    SERVICE_ID_REQUIRED: 'service_id is required',
    START_TIME_REQUIRED: 'start_time is required',
    CUSTOMER_PHONE_REQUIRED: 'customer_phone is required',
    INVALID_START_TIME: 'Invalid start_time format',
    END_TIME_REQUIRED_FOR_DATE_RANGE: 'end_time (check-out date) is required for date_range bookings',
    INVALID_END_TIME_DATE_RANGE: 'Invalid end_time format for date_range',
    CHECKOUT_AFTER_CHECKIN: 'Check-out end_time must be after check-in start_time',
    INVALID_END_TIME: 'Invalid end_time format',
    START_BEFORE_END: 'Booking start time must be before end time',
  },
} as const;
