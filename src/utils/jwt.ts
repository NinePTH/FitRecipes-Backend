import jwt from 'jsonwebtoken'
import env from '@/config/env'
import { JWTPayload } from '@/types'

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })
}

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export const extractTokenFromHeader = (authHeader: string | undefined): string => {
  if (!authHeader) {
    throw new Error('Authorization header is missing')
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header format')
  }

  return authHeader.substring(7)
}