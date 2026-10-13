import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Inject,
  OnModuleInit,
  UsePipes,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  SchedulingInventoryServiceClient,
  SCHEDULING_INVENTORY_SERVICE_NAME,
} from '@repo/proto/scheduling';
import { TenantAuthGuard, AuthenticatedTenantRequest } from '../../guards/tenant-auth.guard.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import { Roles } from '../../decorators/roles.decorator.js';
import {
  CreateServiceDto,
  UpdateServiceDto,
  ListServicesQueryDto,
} from './dtos/service.dto.js';
import {
  CreateResourceDto,
  UpdateResourceDto,
  ListResourcesQueryDto,
} from './dtos/resource.dto.js';

@Controller('api/v1/tenant/scheduling')
@UseGuards(TenantAuthGuard, RolesGuard)
@Roles('tenant_owner', 'root', 'manager', 'dashboard_user')
export class SchedulingController implements OnModuleInit {
  private schedulingService!: SchedulingInventoryServiceClient;

  constructor(
    @Inject('SCHEDULING_PACKAGE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.schedulingService = this.client.getService<SchedulingInventoryServiceClient>(
      SCHEDULING_INVENTORY_SERVICE_NAME,
    );
  }

  private getTenantId(req: AuthenticatedTenantRequest): string {
    const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant context missing from token');
    }
    return tenantId;
  }

  // ==========================================
  // SERVICES ENDPOINTS
  // ==========================================

  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  async createService(
    @Req() req: AuthenticatedTenantRequest,
    @Body() body: CreateServiceDto,
  ) {
    const tenantId = this.getTenantId(req);
    const response = await lastValueFrom(
      this.schedulingService.createService({
        tenant_id: tenantId,
        name: body.name,
        category: body.category,
        description: body.description,
        duration_minutes: body.duration_minutes,
        buffer_minutes: body.buffer_minutes,
        allocation_model: body.allocation_model,
        price: body.price,
        deposit: body.deposit,
        eligible_resource_ids: body.eligible_resource_ids,
        required_asset_ids: body.required_asset_ids,
        recall_interval_days: body.recall_interval_days,
      }),
    );

    return {
      message: response.message,
      data: response.service,
    };
  }

  @Get('services')
  @UsePipes(ZodValidationPipe)
  async listServices(
    @Req() req: AuthenticatedTenantRequest,
    @Query() query: ListServicesQueryDto,
  ) {
    const tenantId = this.getTenantId(req);
    const response = await lastValueFrom(
      this.schedulingService.listServices({
        tenant_id: tenantId,
        page: query.page,
        limit: query.limit,
        category: query.category || '',
      }),
    );

    return {
      message: 'Services retrieved successfully',
      data: response.services,
      pagination: {
        total: response.total,
        page: response.page,
        limit: response.limit,
      },
    };
  }

  @Get('services/:id')
  async getService(
    @Req() req: AuthenticatedTenantRequest,
    @Param('id') serviceId: string,
  ) {
    const tenantId = this.getTenantId(req);
    const response = await lastValueFrom(
      this.schedulingService.getService({
        tenant_id: tenantId,
        service_id: serviceId,
      }),
    );

    return {
      message: response.message,
      data: response.service,
    };
  }

  @Put('services/:id')
  @UsePipes(ZodValidationPipe)
  async updateService(
    @Req() req: AuthenticatedTenantRequest,
    @Param('id') serviceId: string,
    @Body() body: UpdateServiceDto,
  ) {
    const tenantId = this.getTenantId(req);
    const response = await lastValueFrom(
      this.schedulingService.updateService({
        tenant_id: tenantId,
        service_id: serviceId,
        name: body.name,
        category: body.category,
        description: body.description,
        duration_minutes: body.duration_minutes,
        buffer_minutes: body.buffer_minutes,
        allocation_model: body.allocation_model,
        price: body.price,
        deposit: body.deposit,
        eligible_resource_ids: body.eligible_resource_ids ?? [],
        required_asset_ids: body.required_asset_ids ?? [],
        recall_interval_days: body.recall_interval_days,
      }),
    );

    return {
      message: response.message,
      data: response.service,
    };
  }

  @Delete('services/:id')
  async deleteService(
    @Req() req: AuthenticatedTenantRequest,
    @Param('id') serviceId: string,
  ) {
    const tenantId = this.getTenantId(req);
    const response = await lastValueFrom(
      this.schedulingService.deleteService({
        tenant_id: tenantId,
        service_id: serviceId,
      }),
    );

    return {
      message: response.message,
      success: response.success,
    };
  }

  // ==========================================
  // RESOURCES ENDPOINTS
  // ==========================================

  @Post('resources')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  async createResource(
    @Req() req: AuthenticatedTenantRequest,
    @Body() body: CreateResourceDto,
  ) {
    const tenantId = this.getTenantId(req);
    const response = await lastValueFrom(
      this.schedulingService.createResource({
        tenant_id: tenantId,
        resource_type: body.resource_type,
        name: body.name,
        title: body.title,
        category: body.category,
        description: body.description,
        is_bookable: body.is_bookable,
        dispatch_status: body.dispatch_status,
        custom_shift_overrides_json: body.custom_shift_overrides_json,
      }),
    );

    return {
      message: response.message,
      data: response.resource,
    };
  }

  @Get('resources')
  @UsePipes(ZodValidationPipe)
  async listResources(
    @Req() req: AuthenticatedTenantRequest,
    @Query() query: ListResourcesQueryDto,
  ) {
    const tenantId = this.getTenantId(req);
    const response = await lastValueFrom(
      this.schedulingService.listResources({
        tenant_id: tenantId,
        page: query.page,
        limit: query.limit,
        resource_type: query.resource_type || '',
        dispatch_status: query.dispatch_status || '',
      }),
    );

    return {
      message: 'Resources retrieved successfully',
      data: response.resources,
      pagination: {
        total: response.total,
        page: response.page,
        limit: response.limit,
      },
    };
  }

  @Get('resources/:id')
  async getResource(
    @Req() req: AuthenticatedTenantRequest,
    @Param('id') resourceId: string,
  ) {
    const tenantId = this.getTenantId(req);
    const response = await lastValueFrom(
      this.schedulingService.getResource({
        tenant_id: tenantId,
        resource_id: resourceId,
      }),
    );

    return {
      message: response.message,
      data: response.resource,
    };
  }

  @Put('resources/:id')
  @UsePipes(ZodValidationPipe)
  async updateResource(
    @Req() req: AuthenticatedTenantRequest,
    @Param('id') resourceId: string,
    @Body() body: UpdateResourceDto,
  ) {
    const tenantId = this.getTenantId(req);
    const response = await lastValueFrom(
      this.schedulingService.updateResource({
        tenant_id: tenantId,
        resource_id: resourceId,
        resource_type: body.resource_type,
        name: body.name,
        title: body.title,
        category: body.category,
        description: body.description,
        is_bookable: body.is_bookable,
        dispatch_status: body.dispatch_status,
        custom_shift_overrides_json: body.custom_shift_overrides_json,
      }),
    );

    return {
      message: response.message,
      data: response.resource,
    };
  }

  @Delete('resources/:id')
  async deleteResource(
    @Req() req: AuthenticatedTenantRequest,
    @Param('id') resourceId: string,
  ) {
    const tenantId = this.getTenantId(req);
    const response = await lastValueFrom(
      this.schedulingService.deleteResource({
        tenant_id: tenantId,
        resource_id: resourceId,
      }),
    );

    return {
      message: response.message,
      success: response.success,
    };
  }
}
