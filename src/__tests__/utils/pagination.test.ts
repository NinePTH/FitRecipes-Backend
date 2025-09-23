import { parsePaginationParams, createPaginatedResponse, DEFAULT_PAGE_SIZE } from '@/utils/pagination'

describe('pagination utils', () => {
  describe('parsePaginationParams', () => {
    it('should return default values when no params provided', () => {
      const result = parsePaginationParams()

      expect(result.cursor).toBeUndefined()
      expect(result.limit).toBe(DEFAULT_PAGE_SIZE)
    })

    it('should parse valid cursor and limit', () => {
      const cursor = 'test-cursor'
      const limit = '10'

      const result = parsePaginationParams(cursor, limit)

      expect(result.cursor).toBe(cursor)
      expect(result.limit).toBe(10)
    })

    it('should limit maximum page size to 100', () => {
      const result = parsePaginationParams(undefined, '150')

      expect(result.limit).toBe(100)
    })

    it('should handle invalid limit gracefully', () => {
      const result = parsePaginationParams(undefined, 'invalid')

      expect(result.limit).toBe(DEFAULT_PAGE_SIZE)
    })
  })

  describe('createPaginatedResponse', () => {
    it('should create paginated response with next cursor', () => {
      const data = [{ id: '1' }, { id: '2' }, { id: '3' }]
      const limit = 3
      const nextCursor = 'next-cursor'

      const result = createPaginatedResponse(data, limit, nextCursor)

      expect(result.data).toBe(data)
      expect(result.nextCursor).toBe(nextCursor)
      expect(result.hasMore).toBe(true) // data.length === limit
    })

    it('should create paginated response without next cursor', () => {
      const data = [{ id: '1' }, { id: '2' }]
      const limit = 3

      const result = createPaginatedResponse(data, limit)

      expect(result.data).toBe(data)
      expect(result.nextCursor).toBeUndefined()
      expect(result.hasMore).toBe(false) // data.length < limit
    })
  })
})