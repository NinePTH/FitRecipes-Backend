import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as recipeervice from '@/services/recipeService';
import { prisma } from '@/utils/database';

// Mock Prisma client
vi.mock('@/utils/database', () => ({
  prisma: {
    recipe: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    notificationPreference: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock notification service
vi.mock('@/services/notificationService', () => ({
  notifyRecipeApproved: vi.fn(),
  notifyRecipeRejected: vi.fn(),
  notifyNewRecipeSubmission: vi.fn(),
  createNotification: vi.fn(),
  getUserPreferences: vi.fn(),
}));

describe('recipeervice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitRecipe', () => {
    it('should create a recipe with PENDING status', async () => {
      const mockRecipe = {
        id: 'recipe123',
        title: 'Test Recipe',
        description: 'Test description',
        mainIngredient: 'Chicken',
        ingredients: [{ name: 'Chicken', amount: '200', unit: 'g' }],
        instructions: ['Step 1'],
        cookingTime: 30,
        servings: 2,
        difficulty: 'EASY',
        status: 'PENDING',
        authorId: 'user123',
        author: {
          id: 'user123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      };

      vi.mocked(prisma.recipe.create).mockResolvedValue(mockRecipe as any);

      const result = await recipeervice.submitRecipe('user123', {
        title: 'Test Recipe',
        description: 'Test description',
        mainIngredient: 'Chicken',
        ingredients: [{ name: 'Chicken', amount: '200', unit: 'g' }],
        instructions: ['Step 1'],
        cookingTime: 30,
        servings: 2,
        difficulty: 'EASY',
      });

      expect(result.status).toBe('PENDING');
      expect(result.authorId).toBe('user123');
    });
  });

  describe('getRecipeById', () => {
    it('should allow author to view PENDING recipe', async () => {
      const mockRecipe = {
        id: 'recipe123',
        status: 'PENDING',
        authorId: 'user123',
        author: {
          id: 'user123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'CHEF',
        },
        ratings: [],
      };

      vi.mocked(prisma.recipe.findUnique).mockResolvedValue(mockRecipe as any);

      const result = await recipeervice.getRecipeById(
        'recipe123',
        'user123',
        'CHEF'
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('recipe123');
    });

    it('should allow admin to view PENDING recipe', async () => {
      const mockRecipe = {
        id: 'recipe123',
        status: 'PENDING',
        authorId: 'user123',
        author: {
          id: 'user123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'CHEF',
        },
        ratings: [],
      };

      vi.mocked(prisma.recipe.findUnique).mockResolvedValue(mockRecipe as any);

      const result = await recipeervice.getRecipeById(
        'recipe123',
        'admin123',
        'ADMIN'
      );

      expect(result).toBeDefined();
    });

    it('should reject non-author/non-admin viewing PENDING recipe', async () => {
      const mockRecipe = {
        id: 'recipe123',
        status: 'PENDING',
        authorId: 'user123',
        author: {
          id: 'user123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'CHEF',
        },
        ratings: [],
      };

      vi.mocked(prisma.recipe.findUnique).mockResolvedValue(mockRecipe as any);

      await expect(
        recipeervice.getRecipeById('recipe123', 'otherUser', 'USER')
      ).rejects.toThrow("You don't have permission to view this recipe");
    });

    it('should throw error for non-existent recipe', async () => {
      vi.mocked(prisma.recipe.findUnique).mockResolvedValue(null);

      await expect(
        recipeervice.getRecipeById('nonexistent', 'user123', 'USER')
      ).rejects.toThrow('Recipe not found');
    });
  });

  describe('approveRecipe', () => {
    it('should approve a PENDING recipe', async () => {
      const mockPendingRecipe = {
        id: 'recipe123',
        status: 'PENDING',
      };

      const mockApprovedRecipe = {
        id: 'recipe123',
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: 'admin123',
        approvedBy: { id: 'admin123', firstName: 'Admin', lastName: 'User' },
      };

      vi.mocked(prisma.recipe.findUnique).mockResolvedValue(
        mockPendingRecipe as any
      );
      vi.mocked(prisma.recipe.update).mockResolvedValue(
        mockApprovedRecipe as any
      );

      const result = await recipeervice.approveRecipe(
        'recipe123',
        'admin123',
        'Great recipe!'
      );

      expect(result.status).toBe('APPROVED');
      expect(result.approvedById).toBe('admin123');
    });

    it('should reject approving already approved recipe', async () => {
      const mockApprovedRecipe = {
        id: 'recipe123',
        status: 'APPROVED',
      };

      vi.mocked(prisma.recipe.findUnique).mockResolvedValue(
        mockApprovedRecipe as any
      );

      await expect(
        recipeervice.approveRecipe('recipe123', 'admin123')
      ).rejects.toThrow('Recipe is already approved');
    });
  });

  describe('rejectRecipe', () => {
    it('should reject a recipe with reason', async () => {
      const mockRecipe = {
        id: 'recipe123',
        status: 'PENDING',
      };

      const mockRejectedRecipe = {
        id: 'recipe123',
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedById: 'admin123',
        rejectionReason: 'Missing ingredients',
        rejectedBy: { id: 'admin123', firstName: 'Admin', lastName: 'User' },
      };

      vi.mocked(prisma.recipe.findUnique).mockResolvedValue(mockRecipe as any);
      vi.mocked(prisma.recipe.update).mockResolvedValue(
        mockRejectedRecipe as any
      );

      const result = await recipeervice.rejectRecipe(
        'recipe123',
        'admin123',
        'Missing ingredients'
      );

      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBe('Missing ingredients');
    });
  });

  describe('getPendingrecipe', () => {
    it('should return paginated pending recipe', async () => {
      const mockrecipe = [
        { id: 'recipe1', status: 'PENDING', author: {} },
        { id: 'recipe2', status: 'PENDING', author: {} },
      ];

      vi.mocked(prisma.recipe.findMany).mockResolvedValue(mockrecipe as any);
      vi.mocked(prisma.recipe.count).mockResolvedValue(15);

      const result = await recipeervice.getPendingRecipes(1, 10);

      expect(result.recipes).toHaveLength(2);
      expect(result.pagination.total).toBe(15);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });
  });
});
