import { Inject, Injectable } from '@nestjs/common';
import { BookingEntity } from '../../../domain/entities/booking.entity.js';
import {
  ActiveBookingInterval,
  FindBookingsFilter,
  IBookingRepository,
} from '../../../domain/repositories/booking.repository.interface.js';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';
import { UNIT_OF_WORK } from '../../../domain/tokens.js';
import { BookingMapper } from '../mappers/booking.mapper.js';
import { BookingModel } from '../schemas/booking.schema.js';

@Injectable()
export class MongoBookingRepository implements IBookingRepository {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async create(booking: BookingEntity): Promise<BookingEntity> {
    const session = this.unitOfWork?.getSession();
    const persistenceData = BookingMapper.toPersistence(booking);
    if (session) {
      const [created] = await BookingModel.create([persistenceData], { session });
      return BookingMapper.toDomain(created);
    }
    const created = await BookingModel.create(persistenceData);
    return BookingMapper.toDomain(created);
  }

  async findById(tenantId: string, bookingId: string): Promise<BookingEntity | null> {
    const doc = await BookingModel.findOne({
      _id: bookingId,
      tenant_id: tenantId,
      is_deleted: { $ne: true },
    }).exec();
    if (!doc) return null;
    return BookingMapper.toDomain(doc);
  }

  async findByReference(
    tenantId: string,
    bookingReference: string,
  ): Promise<BookingEntity | null> {
    const doc = await BookingModel.findOne({
      booking_reference: bookingReference,
      tenant_id: tenantId,
      is_deleted: { $ne: true },
    }).exec();
    if (!doc) return null;
    return BookingMapper.toDomain(doc);
  }

  async findOverlappingBookings(
    tenantId: string,
    resourceId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ): Promise<BookingEntity[]> {
    const query: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: { $ne: true },
      status: { $nin: ['cancelled', 'no_show'] },
      start_time: { $lt: endTime },
      end_time: { $gt: startTime },
      $or: [
        { resource_id: resourceId },
        { assigned_asset_ids: resourceId },
      ],
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const docs = await BookingModel.find(query).exec();
    return docs.map((doc) => BookingMapper.toDomain(doc));
  }

  async findBusyResourceIds(
    tenantId: string,
    resourceIds: string[],
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ): Promise<Set<string>> {
    if (!resourceIds || resourceIds.length === 0) return new Set();

    const query: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: { $ne: true },
      status: { $nin: ['cancelled', 'no_show'] },
      start_time: { $lt: endTime },
      effective_end_time: { $gt: startTime },
      $or: [
        { resource_id: { $in: resourceIds } },
        { resource_ids: { $in: resourceIds } },
        { assigned_asset_ids: { $in: resourceIds } },
      ],
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const docs = await BookingModel.find(query, {
      resource_id: 1,
      resource_ids: 1,
      assigned_asset_ids: 1,
    })
      .lean()
      .exec();

    const busySet = new Set<string>();
    const resourceSet = new Set(resourceIds);

    for (const doc of docs) {
      const bDoc = doc as {
        resource_id?: string | null;
        resource_ids?: string[];
        assigned_asset_ids?: string[];
      };
      if (bDoc.resource_id && resourceSet.has(bDoc.resource_id)) {
        busySet.add(bDoc.resource_id);
      }
      if (Array.isArray(bDoc.resource_ids)) {
        for (const rId of bDoc.resource_ids) {
          if (resourceSet.has(rId)) {
            busySet.add(rId);
          }
        }
      }
      if (Array.isArray(bDoc.assigned_asset_ids)) {
        for (const assetId of bDoc.assigned_asset_ids) {
          if (resourceSet.has(assetId)) {
            busySet.add(assetId);
          }
        }
      }
    }

    return busySet;
  }

  async findActiveBookingsInRange(
    tenantId: string,
    resourceIds: string[],
    startTime: Date,
    endTime: Date,
  ): Promise<ActiveBookingInterval[]> {
    if (!resourceIds || resourceIds.length === 0) return [];

    const query: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: { $ne: true },
      status: { $nin: ['cancelled', 'no_show'] },
      start_time: { $lt: endTime },
      effective_end_time: { $gt: startTime },
      $or: [
        { resource_id: { $in: resourceIds } },
        { resource_ids: { $in: resourceIds } },
        { assigned_asset_ids: { $in: resourceIds } },
      ],
    };

    const docs = await BookingModel.find(query, {
      resource_id: 1,
      resource_ids: 1,
      assigned_asset_ids: 1,
      start_time: 1,
      effective_end_time: 1,
    })
      .lean()
      .exec();

    return docs as unknown as ActiveBookingInterval[];
  }

  async findAll(
    tenantId: string,
    filter: FindBookingsFilter,
  ): Promise<{ bookings: BookingEntity[]; total: number }> {
    const query: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: { $ne: true },
    };

    if (filter.serviceId) {
      query.service_id = filter.serviceId;
    }
    if (filter.resourceId) {
      query.resource_id = filter.resourceId;
    }
    if (filter.customerId) {
      query.customer_id = filter.customerId;
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.startDate || filter.endDate) {
      const timeFilter: Record<string, unknown> = {};
      if (filter.startDate) timeFilter.$gte = filter.startDate;
      if (filter.endDate) timeFilter.$lte = filter.endDate;
      query.start_time = timeFilter;
    }
    if (filter.search?.trim()) {
      const searchRegex = new RegExp(
        filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );
      query.$or = [
        { booking_reference: searchRegex },
        { 'customer_snapshot.name': searchRegex },
        { 'customer_snapshot.phone': searchRegex },
        { 'customer_snapshot.email': searchRegex },
      ];
    }

    const skip = Math.max(0, (filter.page - 1) * filter.limit);
    const [docs, total] = await Promise.all([
      BookingModel.find(query).sort({ start_time: -1 }).skip(skip).limit(filter.limit).exec(),
      BookingModel.countDocuments(query).exec(),
    ]);

    return {
      bookings: docs.map((doc) => BookingMapper.toDomain(doc)),
      total,
    };
  }

  async update(booking: BookingEntity): Promise<BookingEntity | null> {
    const session = this.unitOfWork?.getSession();
    const persistenceData = BookingMapper.toPersistence(booking);

    const doc = await BookingModel.findOneAndUpdate(
      {
        _id: booking.id,
        tenant_id: booking.tenantId,
        is_deleted: { $ne: true },
      },
      { $set: persistenceData },
      { new: true, session },
    ).exec();

    if (!doc) return null;
    return BookingMapper.toDomain(doc);
  }
}
