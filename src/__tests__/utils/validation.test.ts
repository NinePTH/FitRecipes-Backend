import { validateData, registerSchema, loginSchema, createRecipeSchema } from '@/utils/validation'

describe('validation utils', () => {
  describe('validateData', () => {
    it('should validate correct data', () => {
      const validUser = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }

      const result = validateData(registerSchema, validUser)
      expect(result).toEqual(validUser)
    })

    it('should throw error for invalid data', () => {
      const invalidUser = {
        email: 'invalid-email',
        password: '123', // too short
        name: '', // too short
      }

      expect(() => validateData(registerSchema, invalidUser)).toThrow('Validation failed')
    })
  })

  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'password123',
        name: 'John Doe',
      }

      const result = registerSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'John Doe',
      }

      expect(() => registerSchema.parse(invalidData)).toThrow()
    })
  })

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'password123',
      }

      const result = loginSchema.parse(validData)
      expect(result).toEqual(validData)
    })
  })

  describe('createRecipeSchema', () => {
    it('should validate valid recipe data', () => {
      const validData = {
        title: 'Test Recipe',
        description: 'A delicious test recipe',
        ingredients: [
          { name: 'Flour', amount: '2 cups' },
          { name: 'Sugar', amount: '1 cup' },
        ],
        instructions: ['Mix ingredients', 'Bake for 30 minutes'],
        difficulty: 'EASY' as const,
        prepTime: 15,
        cookTime: 30,
        servings: 4,
        categoryId: 'test-category-id',
      }

      const result = createRecipeSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('should reject recipe with no ingredients', () => {
      const invalidData = {
        title: 'Test Recipe',
        ingredients: [],
        instructions: ['Mix ingredients'],
        difficulty: 'EASY' as const,
        prepTime: 15,
        cookTime: 30,
        servings: 4,
        categoryId: 'test-category-id',
      }

      expect(() => createRecipeSchema.parse(invalidData)).toThrow()
    })
  })
})