import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../interfaces/IPasswordHasher.js';

@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(password: string, saltOrRounds: number | string = 10): Promise<string> {
    return bcrypt.hash(password, saltOrRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
