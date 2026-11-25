export class BaseRepository {
    model;
    unitOfWork;
    constructor(model, unitOfWork) {
        this.model = model;
        this.unitOfWork = unitOfWork;
    }
    async create(item) {
        const session = this.unitOfWork?.getSession();
        const newEntity = new this.model(item);
        return (await newEntity.save({ session }));
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
        const session = this.unitOfWork?.getSession();
        return await this.model
            .findByIdAndUpdate(id, item, { returnDocument: 'after', session })
            .exec();
    }
    async delete(id) {
        const session = this.unitOfWork?.getSession();
        const result = await this.model.findByIdAndDelete(id, { session }).exec();
        return result !== null;
    }
}
