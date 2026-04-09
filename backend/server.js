import express    from 'express'
import cors       from 'cors'
import helmet     from 'helmet'
import morgan     from 'morgan'
import { config } from './src/config/env.js'
import router     from './src/routes/index.js'
import { requestLogger } from './src/middleware/requestLogger.js'
import { notFound }      from './src/middleware/notFound.js'
import { errorHandler }  from './src/middleware/errorHandler.js'

const app = express()

// ── Security & parsing ──────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: [
    config.clientUrl,
    'https://ai-interview-platform-five-rosy.vercel.app',
    'http://localhost:3000',
  ],
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Logging ─────────────────────────────────────────────────────
app.use(morgan('dev'))
app.use(requestLogger)

// ── Routes ──────────────────────────────────────────────────────
app.use('/api', router)

// ── Fallback handlers (must be LAST) ────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ── Start ────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`
  ┌──────────────────────────────────────────┐
  │   PrepAI Backend                         │
  │   Running  →  http://localhost:${config.port}      │
  │   Env      →  ${config.nodeEnv}               │
  │   Health   →  /api/health                │
  └──────────────────────────────────────────┘
  `)
})