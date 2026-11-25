import crypto from 'node:crypto';
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  Logger,
  type RawBodyRequest,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class PaddleWebhookGuard implements CanActivate {
  private readonly _logger = new Logger(PaddleWebhookGuard.name);

  constructor(@Inject(ConfigService) private readonly _configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RawBodyRequest<Request>>();
    const webhookSecret = this._configService.get<string>('PADDLE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this._logger.warn(
        'PADDLE_WEBHOOK_SECRET is not configured; skipping Paddle signature verification in development/sandbox',
      );
      return true;
    }

    const signatureHeader = request.headers['paddle-signature'] as string | undefined;
    if (!signatureHeader) {
      this._logger.error('Missing Paddle-Signature header');
      throw new UnauthorizedException('Missing Paddle-Signature header');
    }

    const rawBody = request.rawBody
      ? request.rawBody.toString('utf8')
      : JSON.stringify(request.body);

    if (!rawBody) {
      this._logger.error('Empty request raw body for Paddle webhook');
      throw new UnauthorizedException('Empty request body');
    }

    try {
      const parts = signatureHeader.split(';').reduce(
        (acc, part) => {
          const [k, v] = part.split('=');
          if (k && v) acc[k.trim()] = v.trim();
          return acc;
        },
        {} as Record<string, string>,
      );

      const ts = parts.ts;
      const h1 = parts.h1;

      if (!ts || !h1) {
        this._logger.error('Malformed Paddle-Signature header format');
        throw new UnauthorizedException('Malformed Paddle-Signature header');
      }

      const signedPayload = `${ts}:${rawBody}`;
      const computedHash = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(computedHash, 'utf8'),
        Buffer.from(h1, 'utf8'),
      );

      if (!isValid) {
        this._logger.error('Paddle webhook signature verification failed');
        throw new UnauthorizedException('Invalid Paddle signature');
      }

      return true;
    } catch (err: unknown) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      this._logger.error(`Error during Paddle signature verification: ${message}`);
      throw new UnauthorizedException('Paddle signature verification failed');
    }
  }
}
