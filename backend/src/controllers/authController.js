import bcrypt          from 'bcryptjs'
import { prisma }      from '../config/prisma.js'
import { signToken }   from '../utils/jwt.js'
import { sendSuccess, sendError } from '../utils/response.js'

// ─────────────────────────────────────────
// REGISTER
// POST /api/auth/register
// ─────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    // 1. Validate required fields
    if (!name || !email || !password) {
      return sendError(res, 400, 'Name, email and password are required.')
    }

    // 2. Validate password length
    if (password.length < 8) {
      return sendError(res, 400, 'Password must be at least 8 characters.')
    }

    // 3. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingUser) {
      return sendError(res, 409, 'An account with this email already exists.')
    }

    // 4. Hash password — 12 salt rounds is the production standard
    const hashedPassword = await bcrypt.hash(password, 12)

    // 5. Create user in database
    const user = await prisma.user.create({
      data: {
        name:     name.trim(),
        email:    email.toLowerCase().trim(),
        password: hashedPassword,
        role:     role === 'ADMIN' ? 'ADMIN' : 'USER',
      },
      select: {
        id:        true,
        name:      true,
        email:     true,
        role:      true,
        createdAt: true,
      },
    })

    // 6. Sign JWT
    const token = signToken({ id: user.id, email: user.email, role: user.role })

    return sendSuccess(res, 201, 'Account created successfully.', { user, token })

  } catch (error) {
    console.error('[REGISTER ERROR]', error)
    return sendError(res, 500, 'Something went wrong during registration.')
  }
}

// ─────────────────────────────────────────
// LOGIN
// POST /api/auth/login
// ─────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // 1. Validate fields
    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required.')
    }

    // 2. Find user — include password for comparison
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    // 3. Check user exists AND password matches
    //    We check both together to prevent user enumeration attacks
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return sendError(res, 401, 'Invalid email or password.')
    }

    // 4. Sign JWT
    const token = signToken({ id: user.id, email: user.email, role: user.role })

    // 5. Return user without password
    const { password: _, ...safeUser } = user

    return sendSuccess(res, 200, 'Logged in successfully.', { user: safeUser, token })

  } catch (error) {
    console.error('[LOGIN ERROR]', error)
    return sendError(res, 500, 'Something went wrong during login.')
  }
}

// ─────────────────────────────────────────
// GET ME
// GET /api/auth/me  (protected)
// ─────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    // req.user is already attached by authMiddleware
    return sendSuccess(res, 200, 'User profile fetched.', { user: req.user })

  } catch (error) {
    console.error('[GET ME ERROR]', error)
    return sendError(res, 500, 'Could not fetch user profile.')
  }
}