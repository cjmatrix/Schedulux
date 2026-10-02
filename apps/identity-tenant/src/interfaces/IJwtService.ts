import jwt from 'jsonwebtoken';

export interface IJwtService {
  sign(payload: string | object | Buffer, secret: string, options?: jwt.SignOptions): string;
  verify<T = any>(token: string, secret: string, options?: jwt.VerifyOptions): T;
}
