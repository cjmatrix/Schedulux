import type { ClientSession } from 'mongoose';

export interface IUnitOfWork {
  getSession(): ClientSession | undefined;
  withTransaction<T>(work: () => Promise<T>): Promise<T>;
}
