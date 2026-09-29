import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedSuperAdminRequest extends Request {
  superAdmin?: {
    super_admin_id: string;
    email: string;
    name: string;
    role: string;
    [key: string]: any;
  };
  user?: any;
}

@Injectable()
export class SuperAdminAuthMiddleware implements NestMiddleware {
  use(req: AuthenticatedSuperAdminRequest, res: Response, next: NextFunction) {
   
    const token =
      req.cookies?.superadmin_access_token 

    if (!token) {
      throw new UnauthorizedException('SuperAdmin authentication token missing');
    }

    try {
      const globalSecret = process.env.JWT_SECRET;
      const secret =
        process.env.SUPERADMIN_JWT_SECRET ||
        (globalSecret ? `${globalSecret}_superadmin` : 'superadmin_access_secret_2025');

      const decoded = jwt.verify(token, secret) as any;
      req.superAdmin = decoded;
      req.user = decoded;
      next();
    } catch (err: any) {
      throw new UnauthorizedException('Invalid or expired superadmin authentication token');
    }
  }
}
