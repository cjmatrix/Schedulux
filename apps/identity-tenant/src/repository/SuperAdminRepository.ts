import { Injectable } from '@nestjs/common';
import { BaseRepository } from './BaseRepository.js';
import { ISuperAdminRepository } from '../interfaces/ISuperAdminRepository.js';
import { ISuperAdmin, SuperAdmin } from '../model/SuperAdmin.js';

@Injectable()
export class SuperAdminRepository
  extends BaseRepository<ISuperAdmin>
  implements ISuperAdminRepository
{
  constructor() {
    super(SuperAdmin);
  }

  async findByEmail(email: string): Promise<ISuperAdmin | null> {
    return this.findOne({ email });
  }
}
