import { Controller, Post, Get, Body, Req, Res, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { Observable, lastValueFrom } from 'rxjs';

import { AuthenticatedSuperAdminRequest } from '../middleware/superadmin-auth.middleware.js';

interface SuperAdminAuthService {
  Login(data: any): Observable<any>;
  RefreshToken(data: any): Observable<any>;
  Logout(data: any): Observable<any>;
  GetProfile(data: any): Observable<any>;
}

@Controller('api/v1/superadmin/auth')
export class SuperAdminController implements OnModuleInit {
  private superAdminAuthService!: SuperAdminAuthService;

  constructor(@Inject('SUPERADMIN_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.superAdminAuthService = this.client.getService<SuperAdminAuthService>('SuperAdminAuthService');
  }

  @Post('login')
  async login(@Body() body: any, @Res() res: Response) {
    try {
      const response: any = await lastValueFrom(this.superAdminAuthService.Login(body));
      const isProduction = process.env.NODE_ENV === 'production';

      res.cookie('superadmin_access_token', response.access_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000, 
      });

      res.cookie('superadmin_refresh_token', response.refresh_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, 
      });

      return res.status(200).json({
        message: response.message,
        superAdmin: response.superAdmin,
      });
    } catch (err: any) {
      if (err.code === 16) return res.status(401).json({ error: err.details });
      if (err.code === 3) return res.status(400).json({ error: err.details });
      return res.status(500).json({ error: err.details || 'Internal server error' });
    }
  }

  @Post('refresh-token')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.cookies?.superadmin_refresh_token || req.body?.refresh_token;
      const response: any = await lastValueFrom(this.superAdminAuthService.RefreshToken({ refresh_token: token }));
      const isProduction = process.env.NODE_ENV === 'production';

      res.cookie('superadmin_access_token', response.access_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('superadmin_refresh_token', response.refresh_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({ message: response.message });
    } catch (err: any) {
      res.clearCookie('superadmin_access_token');
      res.clearCookie('superadmin_refresh_token');
      if (err.code === 16) return res.status(401).json({ error: err.details });
      if (err.code === 3) return res.status(400).json({ error: err.details });
      return res.status(500).json({ error: err.details || 'Internal server error' });
    }
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.cookies?.superadmin_refresh_token || req.body?.refresh_token;
      const response: any = await lastValueFrom(this.superAdminAuthService.Logout({ refresh_token: token }));
      res.clearCookie('superadmin_access_token');
      res.clearCookie('superadmin_refresh_token');
      return res.status(200).json(response);
    } catch (err: any) {
      res.clearCookie('superadmin_access_token');
      res.clearCookie('superadmin_refresh_token');
      return res.status(500).json({ error: err.details || 'Internal server error' });
    }
  }

  @Get('me')
  async me(@Req() req: AuthenticatedSuperAdminRequest, @Res() res: Response) {
    try {
      const superAdminId = req.superAdmin?.super_admin_id;
      if (!superAdminId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const response: any = await lastValueFrom(
        this.superAdminAuthService.GetProfile({ superadmin_id: superAdminId })
      );
      return res.status(200).json(response);
    } catch (err: any) {
      if (err.code === 16) return res.status(401).json({ error: err.details });
      if (err.code === 5) return res.status(404).json({ error: err.details });
      return res.status(500).json({ error: err.details || 'Internal server error' });
    }
  }
}
