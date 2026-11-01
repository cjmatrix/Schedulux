import type { ServiceEntity } from '../../domain/entities/service.entity.js';
import type { IServiceRepository } from '../../domain/repositories/service.repository.interface.js';
import type { ICacheRepository } from '../../infrastructure/cache/cache-repository.interface.js';
import { ServiceMapper } from '../../infrastructure/database/mappers/service.mapper.js';
import type { IServiceDoc } from '../../infrastructure/database/schemas/service.schema.js';

export const SERVICE_CACHE_TTL_SECONDS = 300;

export function buildServiceCacheKey(tenantId: string, serviceId: string): string {
  return `sched:service:${tenantId}:${serviceId}`;
}

export async function getCachedService(
  serviceRepository: IServiceRepository,
  cacheRepo: ICacheRepository,
  tenantId: string,
  serviceId: string,
): Promise<ServiceEntity | null> {
  const cacheKey = buildServiceCacheKey(tenantId, serviceId);
  try {
    const cached = await cacheRepo.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return ServiceMapper.toDomain(parsed as IServiceDoc);
    }
  } catch {}

  const service = await serviceRepository.findById(tenantId, serviceId);
  if (!service) return null;

  try {
    const persistenceData = ServiceMapper.toPersistence(service);
    void cacheRepo
      .set(cacheKey, JSON.stringify(persistenceData), { EX: SERVICE_CACHE_TTL_SECONDS })
      .catch(() => {});
  } catch {}

  return service;
}

export async function invalidateCachedService(
  cacheRepo: ICacheRepository,
  tenantId: string,
  serviceId: string,
): Promise<void> {
  const cacheKey = buildServiceCacheKey(tenantId, serviceId);
  try {
    await cacheRepo.delete(cacheKey);
  } catch {}
}

export async function invalidateCachedServices(
  cacheRepo: ICacheRepository,
  tenantId: string,
  serviceIds: string[],
): Promise<void> {
  if (!serviceIds || serviceIds.length === 0) return;
  const keys = serviceIds.map((id) => buildServiceCacheKey(tenantId, id));
  try {
    await cacheRepo.deleteMany(keys);
  } catch {}
}
