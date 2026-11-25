import { Model, UpdateQuery } from 'mongoose';
import type { IUnitOfWork } from '../interfaces/IUnitOfWork.js';

export abstract class BaseRepository<T> {
  protected constructor(
    protected readonly model: Model<T>,
    protected readonly unitOfWork?: IUnitOfWork,
  ) {}

  async create(item: Partial<T>): Promise<T> {
    const session = this.unitOfWork?.getSession();
    const newEntity = new this.model(item);
    return (await newEntity.save({ session })) as unknown as T;
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id).exec();
  }

  async findOne(filter: Record<string, unknown>): Promise<T | null> {
    return await this.model.findOne(filter).exec();
  }

  async find(filter: Record<string, unknown> = {}): Promise<T[]> {
    return await this.model.find(filter).exec();
  }

  async update(id: string, item: UpdateQuery<T>): Promise<T | null> {
    const session = this.unitOfWork?.getSession();
    return await this.model
      .findByIdAndUpdate(id, item, { returnDocument: 'after', session })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const session = this.unitOfWork?.getSession();
    const result = await this.model.findByIdAndDelete(id, { session }).exec();
    return result !== null;
  }
}
