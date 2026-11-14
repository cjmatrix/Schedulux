import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Put,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { SuperAdminTierConfigServiceClient } from '@repo/proto/superadmin';
import { ZodValidationPipe } from 'nestjs-zod';
import { lastValueFrom } from 'rxjs';
import { RESPONSE_MESSAGES } from '../../constants/messages.constant.js';
import { API_ROUTES } from '../../constants/routes.constant.js';
import { SuperAdminAuthGuard } from '../../guards/superadmin-auth.guard.js';
import { RedisService } from '../../services/redis.service.js';
import { UpdateTierConfigDto } from './dtos/tierConfig.dto.js';

@Controller(API_ROUTES.SUPERADMIN.TIER_CONFIGS.BASE)
@UseGuards(SuperAdminAuthGuard)
export class SuperAdminTierConfigController implements OnModuleInit {
  private _tierConfigService!: SuperAdminTierConfigServiceClient;

  constructor(
    @Inject('SUPERADMIN_PACKAGE') private readonly _client: ClientGrpc,
    @Inject(RedisService) private readonly _redisService: RedisService,
  ) {}

  onModuleInit() {
    this._tierConfigService =
      this._client.getService<SuperAdminTierConfigServiceClient>('SuperAdminTierConfigService');
  }

  @Get(API_ROUTES.SUPERADMIN.TIER_CONFIGS.ROOT)
  async listTierConfigs() {
    const res = await lastValueFrom(this._tierConfigService.listTierConfigs({}));
    return {
      message: RESPONSE_MESSAGES.TIER_CONFIG.LIST_RETRIEVED,
      data: res.configs || [],
    };
  }

  @Get(API_ROUTES.SUPERADMIN.TIER_CONFIGS.BY_TIER)
  async getTierConfig(@Param('tier') tier: string) {
    const res = await lastValueFrom(this._tierConfigService.getTierConfig({ tier }));
    return {
      message: 'Tier configuration retrieved successfully',
      data: res.config,
    };
  }

  @Put(API_ROUTES.SUPERADMIN.TIER_CONFIGS.BY_TIER)
  @UsePipes(ZodValidationPipe)
  async updateTierConfig(
    @Param('tier') tier: string,
    @Body() body: UpdateTierConfigDto,
  ) {
    const res = await lastValueFrom(
      this._tierConfigService.updateTierConfig({
        tier,
        name: body.name,
        max_agents: body.max_agents,
        max_services: body.max_services,
        max_resources: body.max_resources,
        max_kb_docs: body.max_kb_docs,
        max_kb_doc_size_mb: body.max_kb_doc_size_mb,
        weekly_token_limit: body.weekly_token_limit,
        rate_limit_rpm: body.rate_limit_rpm,
        status: body.status,
        description: body.description,
      }),
    );

    await this._redisService.invalidateTierConfigCache(tier);

    return {
      message: RESPONSE_MESSAGES.TIER_CONFIG.UPDATED,
      data: res.config,
    };
  }
}

