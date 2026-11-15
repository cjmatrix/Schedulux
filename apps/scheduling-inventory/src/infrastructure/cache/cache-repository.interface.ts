export interface SetOptions {
  EX?: number;
  PX?: number;
  ttlSeconds?: number;
}

export interface ActiveHoldInfo {
  key: string;
  resourceId: string;
  startTime: string;
  startTimeMs: number;
  holdToken: string;
}

export interface ICacheRepository {
  get(key: string): Promise<string | null>;
  mget(keys: string[]): Promise<(string | null)[]>;
  set(key: string, value: string, options?: SetOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  deleteMany(keys: string[]): Promise<number>;
  ttl(key: string): Promise<number>;
  exists(key: string): Promise<boolean>;
  scanKeys(pattern: string): Promise<string[]>;
  getActiveHolds(tenantId: string, agentId: string): Promise<ActiveHoldInfo[]>;
  releaseSlotHolds(
    tenantId: string,
    agentId: string,
    resourceIds: string[],
    startTime: string,
    holdToken?: string,
  ): Promise<number>;
}
