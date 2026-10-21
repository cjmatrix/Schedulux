import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  SCHEDULING_INVENTORY_SERVICE_NAME,
  SchedulingInventoryServiceClient,
} from '@repo/proto/scheduling';
import { ZodValidationPipe } from 'nestjs-zod';
import { lastValueFrom } from 'rxjs';
import { Roles } from '../../decorators/roles.decorator.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import { AuthenticatedTenantRequest, TenantAuthGuard } from '../../guards/tenant-auth.guard.js';
import {
  CreateResourceDto,
  ListResourcesQueryDto,
  UpdateResourceDto,
} from './dtos/resource.dto.js';
import { CreateServiceDto, ListServicesQueryDto, UpdateServiceDto } from './dtos/service.dto.js';

@Controller('api/v1/tenant/scheduling')
@UseGuards(TenantAuthGuard, RolesGuard)
@Roles('tenant_owner', 'root', 'manager', 'dashboard_user')
export class SchedulingController implements OnModuleInit {
  private schedulingService!: SchedulingInventoryServiceClient;

  constructor(@Inject('SCHEDULING_PACKAGE') private readonly client: ClientGrpc) {}

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

  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  async createService(@Req() req: AuthenticatedTenantRequest, @Body() body: CreateServiceDto) {
    const tenantId = this.getTenantId(req);
    const response = await lastValueFrom(
      this.schedulingService.createService({
        tenant_id: tenantId,
        agent_id: body.agent_id,
        name: body.name,
        category: body.category,
        description: body.description,
        duration_minutes: body.duration_minutes,
        buffer_minutes: body.buffer_minutes,
        allocation_model: body.allocation_model,
        booking_mode: body.booking_mode,
        price: body.price,
        deposit: body.deposit,
        verification: body.verification
          ? { require_otp: body.verification.require_otp ?? undefined }
          : undefined,
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
  async listServices(@Req() req: AuthenticatedTenantRequest, @Query() query: ListServicesQueryDto) {
    const tenantId = this.getTenantId(req);
    const response = await lastValueFrom(
      this.schedulingService.listServices({
        tenant_id: tenantId,
        page: query.page,
        limit: query.limit,
        category: query.category || '',
        agent_id: query.agent_id,
        search: query.search || undefined,
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
      summary: response.summary,
    };
  }

  @Get('services/:id')
  async getService(@Req() req: AuthenticatedTenantRequest, @Param('id') serviceId: string) {
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
        booking_mode: body.booking_mode,
        price: body.price,
        deposit: body.deposit,
        verification: body.verification
          ? { require_otp: body.verification.require_otp ?? undefined }
          : undefined,
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
  async deleteService(@Req() req: AuthenticatedTenantRequest, @Param('id') serviceId: string) {
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

  @Post('resources')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  async createResource(@Req() req: AuthenticatedTenantRequest, @Body() body: CreateResourceDto) {
    const tenantId = this.getTenantId(req);
    const response = await lastValueFrom(
      this.schedulingService.createResource({
        tenant_id: tenantId,
        agent_id: body.agent_id,
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
        category: query.category || undefined,
        agent_id: query.agent_id,
        search: query.search || undefined,
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
      summary: response.summary,
    };
  }

  @Get('resources/:id')
  async getResource(@Req() req: AuthenticatedTenantRequest, @Param('id') resourceId: string) {
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
  async deleteResource(@Req() req: AuthenticatedTenantRequest, @Param('id') resourceId: string) {
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
