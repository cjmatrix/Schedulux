export class BaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create(item) {
        const newEntity = new this.model(item);
        return (await newEntity.save());
    }
    async findById(id) {
        return await this.model.findById(id).exec();
    }
    async findOne(filter) {
        return await this.model.findOne(filter).exec();
    }
    async find(filter = {}) {
        return await this.model.find(filter).exec();
    }
    async update(id, item) {
        return await this.model.findByIdAndUpdate(id, item, { returnDocument: 'after' }).exec();
    }
    async delete(id) {
        const result = await this.model.findByIdAndDelete(id).exec();
        return result !== null;
    }
}
