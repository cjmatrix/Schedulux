import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { AuthenticatedTenantRequest } from './tenant-auth.guard.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly _reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this._reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedTenantRequest>();

    const user = request.tenant || request.dashboardUser;

    if (!user) {
      throw new ForbiddenException(RESPONSE_MESSAGES.AUTH.USER_NOT_AUTHENTICATED);
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Forbidden: Requires one of the following roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}

