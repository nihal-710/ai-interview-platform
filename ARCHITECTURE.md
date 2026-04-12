# Architecture Documentation — PrepAI

## 1. System Architecture Overview

PrepAI follows a classic three-tier architecture with a dedicated AI service layer:

```
┌───────────────────────────────────────────────────────────────┐
│                     PRESENTATION TIER                          │
│         Next.js 16 App Router (Vercel CDN)                    │
│         TypeScript · Tailwind · Browser APIs                  │
└───────────────────────────┬───────────────────────────────────┘
                            │ HTTPS / REST
┌───────────────────────────▼───────────────────────────────────┐
│                      APPLICATION TIER                          │
│              Express.js REST API (Railway)                     │
│     Routes → Controllers → Services → Prisma ORM              │
└──────────────┬──────────────────────────┬─────────────────────┘
               │                          │
┌──────────────▼──────────┐  ┌────────────▼──────────────────┐
│      DATA TIER           │  │       AI SERVICE TIER          │
│   PostgreSQL (Supabase)  │  │   Groq Cloud API               │
│   Prisma Migrations      │  │   Llama3-8b-8192               │
└─────────────────────────┘  └───────────────────────────────┘
```

---

## 2. Frontend Architecture

### App Router Structure
```
src/app/
├── page.tsx                  # Public landing page
├── layout.tsx                # Root layout (fonts, globals)
├── globals.css               # CSS variables + base styles
├── login/page.tsx            # Auth page
├── signup/page.tsx           # Registration page
├── dashboard/page.tsx        # Analytics dashboard (protected)
├── interview/
│   ├── page.tsx              # Interview setup (type + role select)
│   └── session/page.tsx      # Active interview session (protected)
├── result/
│   ├── page.tsx              # Single session result (protected)
│   ├── ResultContent.tsx     # Result display component
│   └── history/page.tsx      # All past sessions (protected)
└── resume/page.tsx           # Resume upload + analysis (protected)
```

### Component Layer
```
src/components/
├── MicButton.tsx             # Speech-to-text toggle button
└── WebcamPreview.tsx         # Video recording preview overlay
```

### Hooks Layer
```
src/hooks/
├── useSpeechRecognition.ts   # Web Speech API wrapper
├── useVideoRecorder.ts       # MediaRecorder API wrapper
├── useVoiceAnalytics.ts      # Voice timing + pacing metrics
└── useFacePresence.ts        # Camera presence detection
```

### Auth & API Layer
```
src/lib/
└── authService.ts            # JWT storage, getToken(), getUser(), logout()
```

---

## 3. Backend Layered Architecture

```
HTTP Request
     ↓
[ Routes Layer ]          — Express routers, URL mapping
     ↓
[ Middleware Layer ]       — JWT auth, error handler, request logger
     ↓
[ Controller Layer ]       — Request parsing, response formatting
     ↓
[ Service Layer ]          — Business logic, AI calls, data transformation
     ↓
[ Prisma ORM Layer ]       — Type-safe DB queries
     ↓
[ PostgreSQL ]             — Supabase managed database
```

### Route → Controller → Service Mapping

| Route | Controller | Service |
|-------|-----------|---------|
| `POST /api/auth/register` | authController | bcrypt + JWT |
| `POST /api/auth/login` | authController | bcrypt + JWT |
| `POST /api/interview/start` | interviewController | aiService.generateQuestions |
| `POST /api/interview/:id/respond` | interviewController | aiService.evaluateAnswer |
| `POST /api/interview/:id/complete` | interviewController | aiService.generateSessionSummary |
| `GET /api/results/:sessionId` | resultController | Prisma query |
| `POST /api/resume/upload` | resumeController | resumeParserService + resumeAnalysisService |
| `GET /api/dashboard/summary` | dashboardController | Aggregated Prisma queries |

---

## 4. Database Schema Relationships

```
User
 ├──< InterviewSession (one-to-many)
 │        ├──< Question (one-to-many)
 │        │        └──  Response (one-to-one)
 │        ├──  Feedback (one-to-one)
 │        └──  Result (one-to-one)
 ├──< Resume (one-to-many)
 └──< Result (one-to-many)
```

### Key Design Decisions
- `onDelete: Cascade` on all child relations — deleting a user cleans up all data
- `Result` stores both raw scores and AI-generated analytics as `Json` field
- `Resume` stores extracted text for re-analysis without re-uploading
- `InterviewType` and `SessionStatus` as PostgreSQL enums for data integrity

---

## 5. AI Integration Architecture

```
┌─────────────────────────────────────────────┐
│              aiService.js                    │
│         (Provider Abstraction Layer)         │
│                                              │
│  ollamaRequest(prompt)                       │
│       ↓ calls Groq REST API                  │
│  parseJSON(response)                         │
│       ↓ safe JSON extraction                 │
│  Exported functions:                         │
│  - generateQuestions()                       │
│  - evaluateAnswer()                          │
│  - generateSessionSummary()                  │
│  - generateInterviewerGesture()              │
│  - checkOllamaHealth()                       │
└─────────────────────────────────────────────┘
         ↑ imported by
┌────────┴────────────────────────────────────┐
│  interviewController.js                      │
│  resumeAnalysisService.js                    │
└─────────────────────────────────────────────┘
```

The function is named `ollamaRequest` internally but routes to Groq — this abstraction allows switching AI providers by changing only `aiService.js`.

---

## 6. Authentication Flow

```
POST /api/auth/register
  → validate input
  → bcrypt.hash(password, 12)
  → prisma.user.create()
  → jwt.sign({ userId, email })
  → return token

POST /api/auth/login
  → prisma.user.findUnique({ email })
  → bcrypt.compare(password, hash)
  → jwt.sign({ userId, email })
  → return token + user

Protected Routes:
  → Authorization: Bearer <token>
  → authMiddleware verifies jwt.verify()
  → attaches req.user = decoded payload
  → passes to controller
```

---

## 7. Interview Session Lifecycle

```
1. START
   POST /api/interview/start
   → Create InterviewSession (IN_PROGRESS)
   → Call Groq → generate 5 questions
   → Bulk insert Question records
   → Return session + questions

2. ANSWER (per question)
   POST /api/interview/:id/respond
   → Call Groq → evaluate answer
   → Create/Update Response record
   → Increment answeredCount on session
   → Return evaluation

3. COMPLETE
   POST /api/interview/:id/complete
   → Mark session COMPLETED
   → Call Groq → generate overall summary
   → Calculate composite score
   → Create Result record
   → Create Feedback record
   → Return result summary
```

---

## 8. Resume Analyzer Pipeline

```
POST /api/resume/upload (multipart/form-data)
  ↓
Multer saves PDF → /uploads/
  ↓
resumeParserService.extractTextFromPDF()
  → fs.readFileSync(filePath)
  → pdf-parse(buffer) → raw text
  → clean + truncate to 3000 chars
  ↓
resumeAnalysisService.analyseResume(text, role)
  → build prompt with role skill matrix
  → Groq API → JSON response
  → parse { resumeScore, matchedSkills,
             missingSkills, focusAreas,
             recommendations }
  ↓
prisma.resume.create() → store all fields
  ↓
Return to frontend for display
```

---

## 9. Dashboard Analytics Pipeline

```
GET /api/dashboard/summary
  → COUNT sessions, AVG score, MAX score
  → Calculate streak from createdAt dates

GET /api/dashboard/history
  → Latest N sessions with scores

GET /api/dashboard/trend
  → Last 10 completed sessions ordered by date
  → Map to { index, score, date, type }

GET /api/dashboard/skills
  → Aggregate strengths/improvements across all Results
  → Count frequency of each skill string
  → Sort by frequency descending
  → Group average scores by InterviewType
```

---

## 10. Deployment Architecture

```
Developer pushes to GitHub (main)
         │
         ├──────────────────────────────────┐
         ▼                                  ▼
   Vercel (Frontend)               Railway (Backend)
   - Detects Next.js               - Detects Node.js
   - Runs next build                - Runs npm install
   - Deploys to CDN                 - Runs prisma generate
   - Global edge network            - Runs node server.js
         │                                  │
         │         HTTPS REST               │
         └──────────────────────────────────┘
                                            │
                                   Supabase (PostgreSQL)
                                   - Connection pooler
                                   - IPv4 compatible URL
                                   - Persistent storage
```

---

## 11. Scalability Considerations

- **Stateless backend** — JWT auth means any number of backend instances can handle requests
- **Connection pooling** — Supabase transaction pooler handles concurrent DB connections
- **AI provider abstraction** — `aiService.js` can switch from Groq to OpenAI/Anthropic with minimal changes
- **CDN delivery** — Vercel serves frontend from global edge network
- **Horizontal scaling** — Railway supports multiple replicas for the backend service

---

## 12. Future Microservice Split Strategy

When the platform scales, the monolithic backend can be split into:

```
api-gateway/          → Auth + routing
interview-service/    → Session management
ai-service/           → All LLM calls (isolated)
resume-service/       → PDF processing + analysis
analytics-service/    → Dashboard aggregations
notification-service/ → Email, reminders
```

Each service would have its own database schema and communicate via REST or message queues (Redis/RabbitMQ).
