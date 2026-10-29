import {
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Patch,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { TenantServiceClient } from '@repo/proto/tenant';
import { ZodValidationPipe } from 'nestjs-zod';
import { lastValueFrom } from 'rxjs';
import { RESPONSE_MESSAGES } from '../../constants/messages.constant.js';
import { API_ROUTES } from '../../constants/routes.constant.js';
import { SuperAdminAuthGuard } from '../../guards/superadmin-auth.guard.js';
import { ListTenantsDto, SuspendTenantParamDto } from './dtos/superAdmin.dto.js';

@Controller(API_ROUTES.SUPERADMIN.TENANTS.BASE)
@UseGuards(SuperAdminAuthGuard)
export class SuperAdminTenantController implements OnModuleInit {
  private _superAdminTenantClient!: TenantServiceClient;

  constructor(@Inject('TENANT_PACKAGE') private readonly _client: ClientGrpc) {}

  onModuleInit() {
    this._superAdminTenantClient = this._client.getService('TenantService');
  }

  @Get(API_ROUTES.SUPERADMIN.TENANTS.ROOT)
  @UsePipes(ZodValidationPipe)
  async ListTenants(@Query() query: ListTenantsDto) {
    const lists = await lastValueFrom(
      this._superAdminTenantClient.listTenants({
        page: query.page,
        limit: query.limit,
        search: query.search,
        tier: query.tier,
        status: query.status,
      }),
    );

    return {
      message: RESPONSE_MESSAGES.TENANT.SUCCESS,
      data: lists,
    };
  }

  @Patch(API_ROUTES.SUPERADMIN.TENANTS.SUSPEND)
  @UsePipes(ZodValidationPipe)
  async SuspendTenant(@Param() params: SuspendTenantParamDto) {
    const result = await lastValueFrom(
      this._superAdminTenantClient.suspendTenant({ tenant_id: params.id }),
    );

    return {
      message: RESPONSE_MESSAGES.TENANT.TENANT_SUSPENDED,
      data: result,
    };
  }
}

