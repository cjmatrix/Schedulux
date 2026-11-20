import { useQuery } from '@tanstack/react-query';
import {
  customersApi,
  type ListCustomersParams,
  type ListCustomersResponseData,
} from '../api/customersApi';

export const CUSTOMER_KEYS = {
  all: ['customers'] as const,
  list: (params?: ListCustomersParams) => ['customers', params] as const,
};

export function useCustomersList(params?: ListCustomersParams, options?: { enabled?: boolean }) {
  return useQuery<ListCustomersResponseData, Error>({
    queryKey: CUSTOMER_KEYS.list(params),
    queryFn: () => customersApi.listCustomers(params),
    enabled: options?.enabled !== undefined ? options.enabled : true,
    staleTime: 30 * 1000,
  });
}
