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
import { RESPONSE_MESSAGES } from '../../constants/messages.constant.js';
import { API_ROUTES } from '../../constants/routes.constant.js';
import { Roles } from '../../decorators/roles.decorator.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import { AuthenticatedTenantRequest, TenantAuthGuard } from '../../guards/tenant-auth.guard.js';
import { GetAvailabilityQueryDto } from './dtos/availability.dto.js';
import { CreateBookingDto } from './dtos/booking.dto.js';
import {
  CreateResourceDto,
  ListResourcesQueryDto,
  UpdateResourceDto,
} from './dtos/resource.dto.js';
import { CreateServiceDto, ListServicesQueryDto, UpdateServiceDto } from './dtos/service.dto.js';

@Controller(API_ROUTES.SCHEDULING.BASE)
@UseGuards(TenantAuthGuard, RolesGuard)
@Roles('tenant_owner', 'root', 'manager', 'dashboard_user')
export class SchedulingController implements OnModuleInit {
  private _schedulingService!: SchedulingInventoryServiceClient;

  constructor(@Inject('SCHEDULING_PACKAGE') private readonly _client: ClientGrpc) {}

  onModuleInit() {
    this._schedulingService = this._client.getService<SchedulingInventoryServiceClient>(
      SCHEDULING_INVENTORY_SERVICE_NAME,
    );
  }

  private _getTenantId(req: AuthenticatedTenantRequest): string {
    const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.TENANT_CONTEXT_MISSING);
    }
    return tenantId;
  }

  @Post(API_ROUTES.SCHEDULING.SERVICES)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  async createService(@Req() req: AuthenticatedTenantRequest, @Body() body: CreateServiceDto) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._schedulingService.createService({
        tenant_id: tenantId,
        agent_id: body.agent_id,
        name: body.name,
        category: body.category,
        description: body.description,
        duration_minutes: body.duration_minutes,
        buffer_minutes: body.buffer_minutes,
        booking_mode: body.booking_mode,
        price: body.price,
        deposit: body.deposit,
        verification: body.verification
          ? { require_otp: body.verification.require_otp ?? undefined }
          : undefined,
        resource_requirements: body.resource_requirements ?? [],
        recall_interval_days: body.recall_interval_days,
      }),
    );

    return {
      message: response.message,
      data: response.service,
    };
  }

  @Get(API_ROUTES.SCHEDULING.SERVICES)
  @UsePipes(ZodValidationPipe)
  async listServices(@Req() req: AuthenticatedTenantRequest, @Query() query: ListServicesQueryDto) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._schedulingService.listServices({
        tenant_id: tenantId,
        page: query.page,
        limit: query.limit,
        category: query.category || '',
        agent_id: query.agent_id,
        search: query.search || undefined,
      }),
    );

    return {
      message: RESPONSE_MESSAGES.SCHEDULING.SERVICES_RETRIEVED,
      data: response.services,
      pagination: {
        total: response.total,
        page: response.page,
        limit: response.limit,
      },
      summary: response.summary,
    };
  }

  @Get(API_ROUTES.SCHEDULING.SERVICE_BY_ID)
  async getService(@Req() req: AuthenticatedTenantRequest, @Param('id') serviceId: string) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._schedulingService.getService({
        tenant_id: tenantId,
        service_id: serviceId,
      }),
    );

    return {
      message: response.message,
      data: response.service,
    };
  }

  @Put(API_ROUTES.SCHEDULING.SERVICE_BY_ID)
  @UsePipes(ZodValidationPipe)
  async updateService(
    @Req() req: AuthenticatedTenantRequest,
    @Param('id') serviceId: string,
    @Body() body: UpdateServiceDto,
  ) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._schedulingService.updateService({
        tenant_id: tenantId,
        service_id: serviceId,
        name: body.name,
        category: body.category,
        description: body.description,
        duration_minutes: body.duration_minutes,
        buffer_minutes: body.buffer_minutes,
        booking_mode: body.booking_mode,
        price: body.price,
        deposit: body.deposit,
        verification: body.verification
          ? { require_otp: body.verification.require_otp ?? undefined }
          : undefined,
        resource_requirements: body.resource_requirements ?? [],
        recall_interval_days: body.recall_interval_days,
      }),
    );

    return {
      message: response.message,
      data: response.service,
    };
  }

  @Delete(API_ROUTES.SCHEDULING.SERVICE_BY_ID)
  async deleteService(@Req() req: AuthenticatedTenantRequest, @Param('id') serviceId: string) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._schedulingService.deleteService({
        tenant_id: tenantId,
        service_id: serviceId,
      }),
    );

    return {
      message: response.message,
      success: response.success,
    };
  }

  @Post(API_ROUTES.SCHEDULING.RESOURCES)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  async createResource(@Req() req: AuthenticatedTenantRequest, @Body() body: CreateResourceDto) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._schedulingService.createResource({
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

  @Get(API_ROUTES.SCHEDULING.RESOURCES)
  @UsePipes(ZodValidationPipe)
  async listResources(
    @Req() req: AuthenticatedTenantRequest,
    @Query() query: ListResourcesQueryDto,
  ) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._schedulingService.listResources({
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
      message: RESPONSE_MESSAGES.SCHEDULING.RESOURCES_RETRIEVED,
      data: response.resources,
      pagination: {
        total: response.total,
        page: response.page,
        limit: response.limit,
      },
      summary: response.summary,
    };
  }

  @Get(API_ROUTES.SCHEDULING.RESOURCE_BY_ID)
  async getResource(@Req() req: AuthenticatedTenantRequest, @Param('id') resourceId: string) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._schedulingService.getResource({
        tenant_id: tenantId,
        resource_id: resourceId,
      }),
    );

    return {
      message: response.message,
      data: response.resource,
    };
  }

  @Put(API_ROUTES.SCHEDULING.RESOURCE_BY_ID)
  @UsePipes(ZodValidationPipe)
  async updateResource(
    @Req() req: AuthenticatedTenantRequest,
    @Param('id') resourceId: string,
    @Body() body: UpdateResourceDto,
  ) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._schedulingService.updateResource({
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

  @Delete(API_ROUTES.SCHEDULING.RESOURCE_BY_ID)
  async deleteResource(@Req() req: AuthenticatedTenantRequest, @Param('id') resourceId: string) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._schedulingService.deleteResource({
        tenant_id: tenantId,
        resource_id: resourceId,
      }),
    );

    return {
      message: response.message,
      success: response.success,
    };
  }

  @Post(API_ROUTES.SCHEDULING.BOOKINGS)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  async createBooking(@Req() req: AuthenticatedTenantRequest, @Body() body: CreateBookingDto) {
    const tenantId = this._getTenantId(req);
    const userId = req.dashboardUser?.user_id || req.tenant?.tenant_id || '';
    const response = await lastValueFrom(
      this._schedulingService.createBooking({
        tenant_id: tenantId,
        agent_id: body.agent_id,
        service_id: body.service_id,
        resource_id: body.resource_id,
        resource_ids: body.resource_ids ?? (body.resource_id ? [body.resource_id] : []),
        start_time: body.start_time,
        end_time: body.end_time,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        customer_email: body.customer_email || undefined,
        notes: body.notes,
        source: body.source,
        deposit_status: body.deposit_status,
        created_by: body.created_by || userId,
      }),
    );

    return {
      message: response.message,
      data: response.booking,
    };
  }

  @Get(API_ROUTES.SCHEDULING.AVAILABILITY)
  @UsePipes(ZodValidationPipe)
  async getAvailability(
    @Req() req: AuthenticatedTenantRequest,
    @Query() query: GetAvailabilityQueryDto,
  ) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._schedulingService.getAvailability({
        tenant_id: tenantId,
        service_id: query.service_id,
        start_date: query.start_date,
        end_date: query.end_date,
        agent_id: query.agent_id,
        resource_id: query.resource_id,
        resource_ids: query.resource_ids || [],
        timezone: query.timezone,
      }),
    );

    return {
      message: RESPONSE_MESSAGES.SCHEDULING.AVAILABILITY_FETCHED,
      data: response,
    };
  }
}


