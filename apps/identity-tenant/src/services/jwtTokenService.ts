import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { IJwtService } from '../interfaces/IJwtService.js';

@Injectable()
export class JwtTokenService implements IJwtService {
  sign(payload: string | object | Buffer, secret: string, options?: jwt.SignOptions): string {
    return jwt.sign(payload, secret, options);
  }

  verify<T = any>(token: string, secret: string, options?: jwt.VerifyOptions): T {
    return jwt.verify(token, secret, options) as T;
  }
}
