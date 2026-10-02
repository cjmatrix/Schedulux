import {
  Controller,
  Patch,
  Get,
  Query,
  Param,
  Inject,
  OnModuleInit,
  UsePipes,
  UseGuards,
} from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";
import { ZodValidationPipe } from "nestjs-zod";
import { SuperAdminAuthGuard } from "../../guards/superadmin-auth.guard.js";
import { TenantServiceClient } from "@repo/proto/tenant";
import { ListTenantsDto, SuspendTenantParamDto } from "./dtos/superAdmin.dto.js";

@Controller(`api/v1/admin/tenants`)
@UseGuards(SuperAdminAuthGuard)
export class SuperAdminTenantController implements OnModuleInit {
  private superAdminTenantClient!: TenantServiceClient;

  constructor(@Inject("TENANT_PACKAGE") private client: ClientGrpc) {}

  onModuleInit() {
    this.superAdminTenantClient = this.client.getService("TenantService");
  }

  @Get()
  @UsePipes(ZodValidationPipe)
  async ListTenants(@Query() query: ListTenantsDto) {
    const lists = await lastValueFrom(
      this.superAdminTenantClient.listTenants({
        page: query.page,
        limit: query.limit,
        search: query.search,
        tier: query.tier,
        status: query.status,
      }),
    );

    return {
      message: "successfull",
      data: lists,
    };
  }

  @Patch(":id/suspend")
  @UsePipes(ZodValidationPipe)
  async SuspendTenant(@Param() params: SuspendTenantParamDto) {
    const result = await lastValueFrom(
      this.superAdminTenantClient.suspendTenant({ tenant_id: params.id }),
    );

    return {
      message: "Tenant suspended successfully",
      data: result,
    };
  }
}
