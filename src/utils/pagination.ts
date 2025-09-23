import { PaginationParams, PaginatedResponse } from '@/types'

export const DEFAULT_PAGE_SIZE = 20

export const parsePaginationParams = (
  cursor?: string,
  limit?: string
): PaginationParams => {
  return {
    cursor: cursor || undefined,
    limit: limit ? Math.min(parseInt(limit, 10), 100) : DEFAULT_PAGE_SIZE,
  }
}

export const createPaginatedResponse = <T>(
  data: T[],
  limit: number,
  nextCursor?: string
): PaginatedResponse<T> => {
  return {
    data,
    nextCursor,
    hasMore: data.length === limit,
  }
}