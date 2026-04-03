import { verifyToken } from '../utils/jwt.js'
import { prisma }      from '../config/prisma.js'
import { sendError }   from '../utils/response.js'

/**
 * Protects any route that requires a logged-in user.
 * Reads the JWT from the Authorization header:
 *   Authorization: Bearer <token>
 */
export const protect = async (req, res, next) => {
  try {
    // 1. Check header exists
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Not authorized. No token provided.')
    }

    // 2. Extract token
    const token = authHeader.split(' ')[1]

    // 3. Verify token
    const decoded = verifyToken(token)

    // 4. Check user still exists in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id:        true,
        email:     true,
        name:      true,
        role:      true,
        createdAt: true,
      },
    })

    if (!user) {
      return sendError(res, 401, 'Not authorized. User no longer exists.')
    }

    // 5. Attach user to request for downstream use
    req.user = user
    next()

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Not authorized. Token has expired.')
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'Not authorized. Invalid token.')
    }
    return sendError(res, 500, 'Authentication error.')
  }
}

/**
 * Restrict a route to ADMIN users only.
 * Always use AFTER protect middleware.
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'You do not have permission to perform this action.')
    }
    next()
  }
}