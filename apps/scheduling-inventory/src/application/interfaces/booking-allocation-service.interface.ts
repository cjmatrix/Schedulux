import type { BookingEntity, BookingMode } from '../../domain/entities/booking.entity.js';
import type { ResourceEntity } from '../../domain/entities/resource.entity.js';
import type { ServiceEntity } from '../../domain/entities/service.entity.js';
import type { IBookingRepository } from '../../domain/repositories/booking.repository.interface.js';
import type { IResourceRepository } from '../../domain/repositories/resource.repository.interface.js';

export interface BookingIntervalResult {
  startTime: Date;
  endTime: Date;
  effectiveStartTime: Date;
  effectiveEndTime: Date;
  durationMinutes: number;
  bufferMinutes: number;
  bookingMode: BookingMode;
}

export interface AllocateResourcesParams {
  tenantId: string;
  agentId: string;
  service: ServiceEntity;
  effectiveStartTime: Date;
  effectiveEndTime: Date;
  explicitResourceIds?: string[];
  excludeBookingId?: string;
  resourceRepository: IResourceRepository;
  bookingRepository: IBookingRepository;
}

export interface AllocateResourcesResult {
  allocatedResourceIds: string[];
  assignedAssetIds: string[];
  activeResourceMap: Map<string, ResourceEntity>;
}

export interface IBookingAllocationService {
  resolveBookingByIdentifier(
    bookingRepository: IBookingRepository,
    tenantId: string,
    bookingIdentifier: string,
    agentId?: string,
  ): Promise<BookingEntity>;

  calculateBookingInterval(
    service: ServiceEntity,
    startTimeInput: string | Date,
    endTimeInput?: string | Date | null,
  ): BookingIntervalResult;

  allocateResourcesForSlot(params: AllocateResourcesParams): Promise<AllocateResourcesResult>;
}
