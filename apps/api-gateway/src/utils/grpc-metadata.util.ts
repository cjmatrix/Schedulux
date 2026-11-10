import { Metadata } from '@grpc/grpc-js';

export function createTenantGrpcMetadata(tenantId: string, tier = 'starter'): Metadata {
  const metadata = new Metadata();
  metadata.set('x-tenant-id', tenantId);
  metadata.set('x-tenant-tier', tier || 'starter');
  return metadata;
}

