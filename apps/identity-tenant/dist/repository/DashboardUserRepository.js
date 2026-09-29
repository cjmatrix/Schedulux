import { DashboardUser } from "../model/DashboardUser.js";
import { BaseRepository } from "./BaseRepository.js";
class DashboardUserRepository extends BaseRepository {
    constructor() {
        super(DashboardUser);
    }
    findByEmail(email) {
        return this.model.findOne({ email });
    }
}
