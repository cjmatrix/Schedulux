import { IDashboardUser } from "../model/DashboardUser.js";


export interface IDashboardUserRepository{
    findByEmail(email:string):Promise<IDashboardUser | null>
}