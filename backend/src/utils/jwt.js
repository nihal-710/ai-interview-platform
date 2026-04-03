import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'

/**
 * Generate a signed JWT for a given user
 * @param {{ id: string, email: string, role: string }} payload
 * @returns {string} signed token
 */
export const signToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  })
}

/**
 * Verify and decode a JWT
 * @param {string} token
 * @returns decoded payload or throws
 */
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret)
}