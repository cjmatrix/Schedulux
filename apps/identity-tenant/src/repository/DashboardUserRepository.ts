import { IDashboardUserRepository } from "../interfaces/IDashboardUserRepository.js";
import { DashboardUser, IDashboardUser } from "../model/DashboardUser.js";
import { BaseRepository } from "./BaseRepository.js";



class DashboardUserRepository extends BaseRepository<IDashboardUser> implements IDashboardUserRepository{

    constructor(){
        super(DashboardUser)
    }

    findByEmail(email: string): Promise<IDashboardUser | null> {
        
        return this.model.findOne({email})
    }

}