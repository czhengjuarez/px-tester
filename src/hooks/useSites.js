import { useQuery } from '@tanstack/react-query';
import { sitesApi } from '../services/api';

export function useSites({ category = 'all', sort = 'newest', page = 1, limit = 12 } = {}) {
  return useQuery({
    queryKey: ['sites', { category, sort, page, limit }],
    queryFn: () => sitesApi.getAll({ category, sort, page, limit }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
  });
}

export function useSite(id) {
  return useQuery({
    queryKey: ['site', id],
    queryFn: () => sitesApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
