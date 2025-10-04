import { describe, it, expect } from 'vitest';
import {
  createApiResponse,
  createPaginationParams,
  isValidEmail,
} from '../../src/utils/helpers';

describe('Helper Functions', () => {
  describe('createApiResponse', () => {
    it('should create success response with data', () => {
      const response = createApiResponse(
        'success',
        { id: 1 },
        'Success message'
      );

      expect(response).toEqual({
        status: 'success',
        data: { id: 1 },
        message: 'Success message',
      });
    });

    it('should create error response with errors', () => {
      const response = createApiResponse('error', null, 'Error occurred', [
        'Field required',
      ]);

      expect(response).toEqual({
        status: 'error',
        data: null,
        message: 'Error occurred',
        errors: ['Field required'],
      });
    });
  });

  describe('createPaginationParams', () => {
    it('should create valid pagination params', () => {
      const pagination = createPaginationParams(2, 20);

      expect(pagination).toEqual({
        page: 2,
        limit: 20,
        offset: 20,
      });
    });

    it('should handle min values', () => {
      const pagination = createPaginationParams(0, 0);

      expect(pagination).toEqual({
        page: 1,
        limit: 1,
        offset: 0,
      });
    });

    it('should handle max limit', () => {
      const pagination = createPaginationParams(1, 200);

      expect(pagination).toEqual({
        page: 1,
        limit: 100,
        offset: 0,
      });
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });
});
