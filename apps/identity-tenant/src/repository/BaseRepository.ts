import { Model, Document, UpdateQuery } from 'mongoose';


export abstract class BaseRepository<T extends Document<any>> {

  protected constructor(protected readonly model: Model<T>) {}

  async create(item: Partial<T>): Promise<T> {
    const newEntity = new this.model(item);
    return await newEntity.save();
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id).exec();
  }

  async findOne(filter: any): Promise<T | null> {
    return await this.model.findOne(filter).exec();
  }

  async find(filter: any = {}): Promise<T[]> {
    return await this.model.find(filter).exec();
  }

  async update(id: string, item: UpdateQuery<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, item, { returnDocument: 'after' }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }
}