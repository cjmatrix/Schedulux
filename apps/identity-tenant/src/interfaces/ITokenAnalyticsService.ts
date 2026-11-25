export interface TokenDatePoint {
  date: string;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
}

export interface RawTopTenantTokenUsage {
  tenant_id: string;
  total_tokens: number;
}

export interface ITokenAnalyticsService {
  getTotalTokens(startDate?: string, endDate?: string): Promise<number>;
  getTokenDateHistogram(
    startDate?: string,
    endDate?: string,
    interval?: string,
  ): Promise<TokenDatePoint[]>;
  getTopTenantsByTokens(
    startDate?: string,
    endDate?: string,
    limit?: number,
  ): Promise<RawTopTenantTokenUsage[]>;
}

