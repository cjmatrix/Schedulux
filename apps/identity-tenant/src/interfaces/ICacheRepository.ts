export interface SetOptions {
  EX?: number;
  PX?: number;
  ttlSeconds?: number;
}

export interface ICacheRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: SetOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  ttl(key: string): Promise<number>;
  exists(key: string): Promise<boolean>;
}
