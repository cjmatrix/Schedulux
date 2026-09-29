import { Controller, Post, Get, Body, Query, Req, Res, Inject, OnModuleInit, HttpException, HttpStatus } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { Observable, lastValueFrom } from 'rxjs';

interface TenantAuthService {
  Register(data: any): Observable<any>;
  Login(data: any): Observable<any>;
  VerifyEmail(data: any): Observable<any>;
  RefreshToken(data: any): Observable<any>;
  Logout(data: any): Observable<any>;
}

@Controller('api/v1/tenant/auth')
export class TenantController implements OnModuleInit {
  private tenantAuthService!: TenantAuthService;

  constructor(@Inject('TENANT_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.tenantAuthService = this.client.getService<TenantAuthService>('TenantAuthService');
  }

  @Post('register')
  async register(@Body() body: any, @Res() res: Response) {
    try {
      const response: any = await lastValueFrom(this.tenantAuthService.Register(body));
      return res.status(201).json(response);
    } catch (err: any) {
      if (err.code === 6) return res.status(409).json({ error: err.details });
      if (err.code === 3) return res.status(400).json({ error: err.details });
      return res.status(500).json({ error: err.details || 'Internal server error' });
    }
  }

  @Post('login')
  async login(@Body() body: any, @Res() res: Response) {
    try {
      const response: any = await lastValueFrom(this.tenantAuthService.Login(body));
      const isProduction = process.env.NODE_ENV === 'production';

      res.cookie('access_token', response.access_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refresh_token', response.refresh_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        message: response.message,
        tenant: response.tenant,
      });
    } catch (err: any) {
      if (err.code === 16) return res.status(401).json({ error: err.details });
      if (err.code === 7) return res.status(403).json({ error: err.details });
      if (err.code === 3) return res.status(400).json({ error: err.details });
      return res.status(500).json({ error: err.details || 'Internal server error' });
    }
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    try {
      const response: any = await lastValueFrom(this.tenantAuthService.VerifyEmail({ token }));
      return res.status(200).json(response);
    } catch (err: any) {
      if (err.code === 3) return res.status(400).json({ error: err.details });
      return res.status(500).json({ error: err.details || 'Internal server error' });
    }
  }

  @Post('refresh-token')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.cookies?.refresh_token || req.body?.refresh_token;
      const response: any = await lastValueFrom(this.tenantAuthService.RefreshToken({ refresh_token: token }));
      const isProduction = process.env.NODE_ENV === 'production';

      res.cookie('access_token', response.access_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refresh_token', response.refresh_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({ message: response.message });
    } catch (err: any) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      if (err.code === 16) return res.status(401).json({ error: err.details });
      if (err.code === 3) return res.status(400).json({ error: err.details });
      return res.status(500).json({ error: err.details || 'Internal server error' });
    }
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.cookies?.refresh_token || req.body?.refresh_token;
      const response: any = await lastValueFrom(this.tenantAuthService.Logout({ refresh_token: token }));
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return res.status(200).json(response);
    } catch (err: any) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return res.status(500).json({ error: err.details || 'Internal server error' });
    }
  }
}
