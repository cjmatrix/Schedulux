import { SCHEDULING_INVENTORY_SERVICE_NAME } from '@repo/proto/scheduling';

export const GRPC_SERVICES = {
  SCHEDULING_INVENTORY: SCHEDULING_INVENTORY_SERVICE_NAME,
} as const;

export const GRPC_METHODS = {
  SCHEDULING_INVENTORY: {
    CREATE_SERVICE: 'CreateService',
    GET_SERVICE: 'GetService',
    LIST_SERVICES: 'ListServices',
    UPDATE_SERVICE: 'UpdateService',
    DELETE_SERVICE: 'DeleteService',
    CREATE_RESOURCE: 'CreateResource',
    GET_RESOURCE: 'GetResource',
    LIST_RESOURCES: 'ListResources',
    UPDATE_RESOURCE: 'UpdateResource',
    DELETE_RESOURCE: 'DeleteResource',
    BATCH_SYNC_INVENTORY: 'BatchSyncInventory',
    CREATE_BOOKING: 'CreateBooking',
    GET_AVAILABILITY: 'GetAvailability',
  },
} as const;
