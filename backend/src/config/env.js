import 'dotenv/config'

const requiredVars = [
  'PORT',
  'NODE_ENV',
  'CLIENT_URL',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
]

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`)
    process.exit(1)
  }
})

export const config = {
  port:         process.env.PORT         || 5000,
  nodeEnv:      process.env.NODE_ENV     || 'development',
  clientUrl:    process.env.CLIENT_URL   || 'http://localhost:3000',
  jwtSecret:    process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
}