import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ITokenAnalyticsService,
  RawTopTenantTokenUsage,
  TokenDatePoint,
} from '../interfaces/ITokenAnalyticsService.js';

export type { RawTopTenantTokenUsage, TokenDatePoint };

@Injectable()
export class OpenSearchAnalyticsService implements ITokenAnalyticsService, OnModuleInit {
  private readonly _logger = new Logger(OpenSearchAnalyticsService.name);
  private _cleanUrl = '';
  private _authHeader = '';
  private _index = 'token-ledger';

  constructor(
    @Inject(ConfigService)
    private readonly _configService: ConfigService,
  ) {}

  onModuleInit() {
    const rawUrl =
      this._configService.get<string>('OPENSEARCH_URL') ||
      process.env.OPENSEARCH_URL ||
      '';
    this._index =
      this._configService.get<string>('OPENSEARCH_TOKEN_INDEX') ||
      process.env.OPENSEARCH_TOKEN_INDEX ||
      'token-ledger';

    if (rawUrl) {
      try {
        const parsed = new URL(rawUrl);
        this._authHeader =
          parsed.username || parsed.password
            ? `Basic ${Buffer.from(`${parsed.username}:${parsed.password}`).toString('base64')}`
            : '';
        this._cleanUrl = `${parsed.origin}/${this._index}/_search`;
      } catch (err) {
        this._logger.error('Failed to parse OPENSEARCH_URL:', err);
      }
    }
  }

  private async _search(queryBody: Record<string, unknown>): Promise<any> {
    if (!this._cleanUrl) return null;
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this._authHeader) {
        headers.Authorization = this._authHeader;
      }

      const res = await fetch(this._cleanUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(queryBody),
      });

      if (!res.ok) {
        const errText = await res.text();
        this._logger.warn(`OpenSearch search query returned ${res.status}: ${errText}`);
        return null;
      }

      return await res.json();
    } catch (err) {
      this._logger.error('OpenSearch search failed:', err);
      return null;
    }
  }

  async getTotalTokens(startDate?: string, endDate?: string): Promise<number> {
    const rangeFilter: Record<string, string> = {};
    if (startDate) rangeFilter.gte = startDate;
    if (endDate) rangeFilter.lte = endDate;

    const query = Object.keys(rangeFilter).length
      ? { range: { created_at: rangeFilter } }
      : { match_all: {} };

    const body = {
      size: 0,
      query,
      aggs: {
        total_tokens: {
          sum: { field: 'total_tokens' },
        },
      },
    };

    const res = await this._search(body);
    return res?.aggregations?.total_tokens?.value ?? 0;
  }

  async getTokenDateHistogram(
    startDate?: string,
    endDate?: string,
    interval = 'day',
  ): Promise<TokenDatePoint[]> {
    const from = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const to = endDate || new Date().toISOString();

    const calendarInterval = interval === 'month' ? '1M' : '1d';

    const body = {
      size: 0,
      query: {
        range: {
          created_at: {
            gte: from,
            lte: to,
          },
        },
      },
      aggs: {
        tokens_over_time: {
          date_histogram: {
            field: 'created_at',
            calendar_interval: calendarInterval,
          },
          aggs: {
            total_tokens: { sum: { field: 'total_tokens' } },
            input_tokens: { sum: { field: 'input_tokens' } },
            output_tokens: { sum: { field: 'output_tokens' } },
          },
        },
      },
    };

    const res = await this._search(body);
    const buckets = res?.aggregations?.tokens_over_time?.buckets ?? [];

    return buckets.map((b: any) => ({
      date: b.key_as_string?.substring(0, 10) || String(b.key),
      total_tokens: b.total_tokens?.value ?? 0,
      input_tokens: b.input_tokens?.value ?? 0,
      output_tokens: b.output_tokens?.value ?? 0,
    }));
  }

  async getTopTenantsByTokens(
    startDate?: string,
    endDate?: string,
    limit = 5,
  ): Promise<RawTopTenantTokenUsage[]> {
    const rangeFilter: Record<string, string> = {};
    if (startDate) rangeFilter.gte = startDate;
    if (endDate) rangeFilter.lte = endDate;

    const query = Object.keys(rangeFilter).length
      ? { range: { created_at: rangeFilter } }
      : { match_all: {} };

    const body = {
      size: 0,
      query,
      aggs: {
        top_tenants: {
          terms: {
            field: 'tenant_id',
            size: limit,
            order: { total_tokens: 'desc' },
          },
          aggs: {
            total_tokens: { sum: { field: 'total_tokens' } },
          },
        },
      },
    };

    const res = await this._search(body);
    const buckets = res?.aggregations?.top_tenants?.buckets ?? [];

    return buckets.map((b: any) => ({
      tenant_id: b.key,
      total_tokens: b.total_tokens?.value ?? 0,
    }));
  }
}

