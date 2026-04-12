# System Design — PrepAI

## 1. High-Level System Design

```
┌──────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                  │
│          Browser (Next.js SPA)  ·  Mobile Browser                │
└────────────────────────┬─────────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼─────────────────────────────────────────┐
│                     VERCEL CDN EDGE                               │
│              Static assets + Next.js SSR                         │
└────────────────────────┬─────────────────────────────────────────┘
                         │ REST API calls
┌────────────────────────▼─────────────────────────────────────────┐
│                   RAILWAY (Backend)                               │
│              Node.js · Express.js · Port 5000                    │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │   Auth   │  │ Interview  │  │  Resume  │  │  Dashboard    │  │
│  │  Routes  │  │  Routes    │  │  Routes  │  │  Routes       │  │
│  └──────────┘  └────────────┘  └──────────┘  └───────────────┘  │
│                        │                                          │
│              ┌──────────▼──────────┐                             │
│              │    AI Service Layer  │                             │
│              │  (Groq API Client)   │                             │
│              └──────────┬──────────┘                             │
└─────────────────────────┼────────────────────────────────────────┘
          │               │               │
┌─────────▼──────┐  ┌─────▼────────┐  ┌──▼───────────────────────┐
│   Supabase     │  │  Groq Cloud  │  │  File System (uploads/)  │
│  PostgreSQL    │  │  Llama3 LLM  │  │  PDF temporary storage   │
└────────────────┘  └──────────────┘  └──────────────────────────┘
```

---

## 2. Component Interaction Diagram

```
Frontend Components
        │
        │── authService.ts ──→ localStorage (JWT token)
        │
        │── fetch(NEXT_PUBLIC_API_URL + endpoint)
        │         │
        │         ▼
        │   Express Router
        │         │
        │         ├── authMiddleware (JWT verify)
        │         │
        │         ▼
        │   Controller
        │         │
        │         ├── prisma.* (DB queries)
        │         └── aiService.* (LLM calls)
        │                   │
        │                   └── fetch(GROQ_URL)
        │                             │
        │                             ▼
        │                       Groq Cloud API
        │                             │
        │                       LLM Response
        │                             │
        │                       parseJSON()
        │                             │
        │                       Structured data
        │                             │
        │◄────────────────────────────┘
   JSON Response
```

---

## 3. Request Lifecycle Walkthrough

**Example: POST /api/interview/start**

```
1. Frontend sends:
   POST https://backend.railway.app/api/interview/start
   Headers: { Authorization: "Bearer <jwt>" }
   Body: { interviewType: "TECHNICAL", targetRole: "Backend Developer" }

2. Express receives request
   → CORS middleware checks Origin header against CLIENT_URL
   → Helmet sets security headers

3. authMiddleware runs:
   → jwt.verify(token, JWT_SECRET)
   → Attaches req.user = { id, email }
   → Calls next()

4. interviewController.startSession():
   → Validates req.body fields
   → Calls aiService.generateQuestions("Backend Developer", "TECHNICAL")

5. aiService.generateQuestions():
   → Builds structured prompt
   → POST https://api.groq.com/openai/v1/chat/completions
   → Receives JSON with 5 questions
   → parseJSON() extracts array safely

6. Controller continues:
   → prisma.interviewSession.create() — creates session record
   → prisma.question.createMany() — bulk inserts 5 questions
   → Returns session object with questions

7. Frontend receives:
   { success: true, data: { session: { id, questions: [...] } } }
   → Navigates to /interview/session?type=TECHNICAL&role=...
```

---

## 4. Interview Session Lifecycle

```
User Action              Frontend State           Backend Action
──────────               ──────────────           ──────────────
Select type+role    →    loading = true      →    POST /interview/start
                    ←    session loaded       ←    5 questions generated

Read question       →    currentIdx = 0           (no request)
Type/speak answer   →    answer state updates      (no request)

Click Submit        →    submitting = true    →    POST /interview/:id/respond
                    ←    score + feedback     ←    Groq evaluates answer
                    →    waitingForNext=true        (stored in DB)

Click Next Question →    currentIdx++              (no request)
                    →    answer cleared

... repeat for all questions ...

Last answer submit  →    submitting = true    →    POST /interview/:id/complete
                    ←    sessionDone = true   ←    Groq generates summary
                                                   Result record created

Click View Results  →    navigate to          →    GET /results/:sessionId
                         /result?sessionId=        Returns full result
```

---

## 5. AI Evaluation Lifecycle

```
Input:
  question = "Explain REST API principles"
  answer   = "REST uses HTTP verbs GET/POST/PUT/DELETE..."
  type     = "TECHNICAL"
        ↓
Build evaluation prompt (structured template)
        ↓
POST https://api.groq.com/openai/v1/chat/completions
  model: llama3-8b-8192
  temperature: 0.7
  max_tokens: 1024
        ↓
Raw LLM response (may include markdown, extra text)
        ↓
parseJSON() — tries:
  1. Direct JSON.parse()
  2. Extract from ```json ... ``` blocks
  3. Find first { to last } and parse
        ↓
Validated structure: { score, feedback, strengths, improvements }
        ↓
score clamped to 0–100
        ↓
Stored in Response table
        ↓
If AI fails → getFallbackEvaluation(answer)
  → word count based score
  → generic feedback
```

---

## 6. Resume Analysis Lifecycle

```
User uploads PDF file
        ↓
Multer middleware:
  → validates file type (PDF only)
  → saves to /uploads/<timestamp>-filename.pdf
  → sets req.file
        ↓
resumeParserService.extractTextFromPDF(filePath):
  → fs.readFileSync() → Buffer
  → dynamic import('pdf-parse/lib/pdf-parse.js')
  → pdfParse(buffer) → { text }
  → clean whitespace, normalize newlines
  → truncate to 3000 chars
  → log extracted character count
        ↓
resumeAnalysisService.analyseResume(text, role):
  → look up ROLE_SKILLS[role] expected skills
  → build prompt with resume text + role context
  → call Groq API
  → parse response JSON
  → clamp/validate all fields
        ↓
If Groq fails → getFallbackAnalysis():
  → keyword matching against expected skills
  → score = matched/total * 100
        ↓
prisma.resume.create() with all fields
        ↓
Return to frontend:
  { resumeScore, matchedSkills, missingSkills,
    focusAreas, recommendations }
```

---

## 7. Data Persistence Strategy

- **Interviews**: Full session + question + response chain stored with cascade deletes
- **AI Results**: Stored as structured fields + `Json` for flexible score breakdowns
- **Resume text**: Stored in DB to avoid re-parsing on future views
- **Analytics**: Computed at query time from existing Result records — no separate analytics tables needed at current scale
- **Files**: PDFs stored on Railway filesystem (`/uploads/`) — stateless deployments may lose these; future improvement would use S3/Cloudinary

---

## 8. Error Handling Strategy

### Backend
```
Controller level:
  try { ... } catch (error) {
    console.error('[CONTEXT]', error)
    sendError(res, 500, 'User-friendly message')
  }

AI failures:
  → Fallback functions return safe defaults
  → Never crash the request on AI failure

Prisma errors:
  → Caught at controller level
  → Specific error codes mapped to HTTP status
```

### Frontend
```
API calls wrapped in try/catch
  → setError(message) → shown to user
  → Loading states managed with finally blocks

Auth failures:
  → getToken() returns null → redirect to /login
  → 401 responses → logout() + redirect
```

---

## 9. Security Considerations

- **Passwords**: bcrypt with cost factor 12 — resistant to brute force
- **JWT**: Signed with `JWT_SECRET`, expires in 7 days, verified on every protected route
- **CORS**: Restricted to specific `CLIENT_URL` origin only
- **Helmet.js**: Sets `X-Frame-Options`, `X-XSS-Protection`, `Content-Security-Policy` headers
- **Environment Variables**: Never committed — validated at startup, process exits if missing
- **SQL Injection**: Prisma ORM uses parameterized queries by default
- **File Uploads**: Multer restricts file type; stored server-side not served publicly

---

## 10. Performance Optimization Strategy

- **Groq over local Ollama**: Cloud inference is faster and more reliable than local models
- **Question bulk insert**: `createMany()` inserts all 5 questions in one DB round trip
- **Dashboard aggregations**: Single SQL queries with GROUP BY instead of N+1 loops
- **JWT stateless auth**: No session store lookups — verification is pure computation
- **Truncated resume text**: 3000 char limit reduces LLM token usage and latency
- **Suspense boundaries**: Next.js streaming with `<Suspense>` for non-blocking page loads
- **Connection pooling**: Supabase transaction pooler reduces connection overhead

---

## 11. Rate Limiting Strategy

Current state: No rate limiting implemented (suitable for demo/personal use).

Production recommendation:
```javascript
import rateLimit from 'express-rate-limit'

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 10,              // 10 AI requests per minute
  message: 'Too many requests, please try again later'
})

router.post('/interview/start', authMiddleware, aiLimiter, startSession)
router.post('/resume/upload',   authMiddleware, aiLimiter, uploadResume)
```

---

## 12. Horizontal Scaling Strategy

The backend is designed to be stateless and horizontally scalable:

```
Load Balancer
     │
     ├──→ Backend Instance 1 (Railway)
     ├──→ Backend Instance 2 (Railway)
     └──→ Backend Instance 3 (Railway)
              │
              └──→ Shared PostgreSQL (Supabase)
                   + Shared Groq API
```

Requirements for scaling:
- Move file uploads to object storage (S3/Cloudinary) — filesystem is not shared
- Ensure JWT_SECRET is identical across all instances
- Railway supports multiple replicas natively

---

## 13. Future Improvements Roadmap

| Priority | Improvement | Rationale |
|----------|-------------|-----------|
| High | Move uploads to S3/Cloudinary | Railway filesystem resets on redeploy |
| High | Add rate limiting | Prevent Groq API quota exhaustion |
| High | Add Redis caching | Cache generated questions per role |
| Medium | WebSocket for real-time feedback | Show AI typing indicator during evaluation |
| Medium | Queue AI jobs | Decouple HTTP response from LLM latency |
| Medium | Add refresh tokens | Improve auth security |
| Low | Microservice split | When team/traffic grows |
| Low | Multi-provider AI | OpenAI/Anthropic as fallback providers |
