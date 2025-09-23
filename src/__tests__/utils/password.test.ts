import { hashPassword, comparePassword } from '@/utils/password'

describe('password utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50) // bcrypt hashes are typically 60 characters
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'testpassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2) // Different salts should produce different hashes
    })
  })

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)

      const isValid = await comparePassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const password = 'testpassword123'
      const wrongPassword = 'wrongpassword456'
      const hash = await hashPassword(password)

      const isValid = await comparePassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })
  })
})