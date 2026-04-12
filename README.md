# PrepAI — AI Interview Preparation Platform

> Practice interviews with AI-generated questions, get real-time feedback powered by Groq LLM, analyze your resume, and track your performance over time.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://ai-interview-platform-five-rosy.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Railway-purple?style=for-the-badge&logo=railway)](https://railway.app)
[![Database](https://img.shields.io/badge/Database-Supabase-green?style=for-the-badge&logo=supabase)](https://supabase.com)
[![AI](https://img.shields.io/badge/AI-Groq%20LLM-orange?style=for-the-badge)](https://groq.com)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

---

## 🔗 Live Demo

**[https://ai-interview-platform-five-rosy.vercel.app](https://ai-interview-platform-five-rosy.vercel.app)**

---

## 📸 Screenshots

| Dashboard | Interview Session |
|-----------|------------------|
| ![dashboard](./docs/screenshots/dashboard.png) | ![session](./docs/screenshots/session.png) |

| Results — Summary | Results — Detail |
|-------------------|-----------------|
| ![results1](./docs/screenshots/results1.png) | ![results2](./docs/screenshots/results2.png) |

| Resume Analyzer — Upload | Resume Analyzer — Results |
|--------------------------|--------------------------|
| ![resume1](./docs/screenshots/resume1.png) | ![resume2](./docs/screenshots/resume2.png) |
---

## ✨ Features

- **AI Interview Sessions** — Groq LLM generates role-specific questions across Behavioral, Technical, System Design, and Case Study formats
- **AI Answer Evaluation** — Every answer is scored 0–100 with detailed feedback, strengths, and improvement areas
- **Speech-to-Text** — Answer questions by speaking using the Web Speech API
- **Video Recording** — Optional webcam recording during interviews via MediaRecorder API
- **Resume Analyzer** — Upload a PDF resume; AI extracts text, scores it against a target role, and returns matched/missing skills
- **Performance Dashboard** — Visual trend charts, session history, skill snapshots, and streak tracking
- **JWT Authentication** — Secure signup/login with bcrypt password hashing and JWT tokens
- **Protected Routes** — All interview, result, and dashboard routes require authentication
- **Past Results History** — Browse and review all previous interview sessions

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Vercel)                       │
│              Next.js 16 · TypeScript · App Router            │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS REST API
┌─────────────────────▼───────────────────────────────────────┐
│                      BACKEND (Railway)                       │
│         Express.js · JWT Auth · Layered Architecture         │
│   Routes → Controllers → Services → Prisma ORM              │
└──────────┬──────────────────────────┬───────────────────────┘
           │                          │
┌──────────▼──────────┐   ┌───────────▼──────────────────────┐
│  PostgreSQL          │   │         Groq Cloud API            │
│  (Supabase)          │   │    Llama3-8b-8192 Inference       │
│  Prisma Migrations   │   │    Question Gen · Evaluation      │
└─────────────────────┘   └──────────────────────────────────┘
```

---

## 🔄 System Workflow

1. User signs up / logs in → JWT token issued
2. User selects interview type and target role
3. Backend calls **Groq API** → generates 5 role-specific questions
4. User answers each question (text or speech-to-text)
5. On submission, backend calls **Groq API** → evaluates each answer with score + feedback
6. Session completes → AI generates overall performance summary
7. Results stored in PostgreSQL via Prisma
8. Dashboard aggregates all sessions → trend charts + skill analytics

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 16 (App Router) | React framework with SSR/SSG |
| TypeScript 5 | Type safety |
| Tailwind CSS 4 | Utility-first styling |
| Web Speech API | Browser-native speech-to-text |
| MediaRecorder API | Webcam video recording |

### Backend
| Technology | Purpose |
|------------|---------|
| Express.js 5 | REST API server |
| JWT + bcryptjs | Authentication & password hashing |
| Prisma ORM 7 | Type-safe database access |
| Multer | PDF file upload handling |
| pdf-parse | PDF text extraction |
| Morgan + Helmet | Logging & security headers |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting + CDN |
| Railway | Backend Node.js hosting |
| Supabase | Managed PostgreSQL database |
| Groq API | LLM inference (Llama3-8b-8192) |

---

## 🤖 AI Pipeline

### Interview Question Generation
```
User selects role + type
        ↓
POST /api/interview/start
        ↓
aiService.generateQuestions(role, type)
        ↓
Groq API (Llama3) → structured JSON
        ↓
5 questions stored in PostgreSQL
        ↓
Returned to frontend
```

### Answer Evaluation
```
User submits answer
        ↓
POST /api/interview/:id/respond
        ↓
aiService.evaluateAnswer(question, answer)
        ↓
Groq API → { score, feedback, strengths, improvements }
        ↓
Stored in Response table
        ↓
Session summary generated on completion
```

---

## 📄 Resume Analyzer Pipeline

```
User uploads PDF
        ↓
Multer saves file → uploads/
        ↓
pdf-parse extracts raw text
        ↓
analyseResume(text, targetRole)
        ↓
Groq API evaluates against role skill matrix
        ↓
Returns { resumeScore, matchedSkills, missingSkills,
          focusAreas, recommendations }
        ↓
Stored in Resume table → displayed on frontend
```

---

## 📊 Dashboard Analytics

The dashboard aggregates data from completed sessions:

- **Summary stats** — total sessions, average score, best score, streak
- **Performance trend** — SVG chart of score over last N sessions
- **Skills snapshot** — top strengths and improvement areas across all sessions
- **Type averages** — breakdown by interview type (Behavioral, Technical, etc.)
- **Session history** — paginated list with direct links to results

---

## 📁 Folder Structure

```
ai-interview-platform/
├── frontend/                    # Next.js App
│   ├── src/
│   │   ├── app/                 # App Router pages
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── dashboard/
│   │   │   ├── interview/
│   │   │   │   └── session/     # Active interview UI
│   │   │   ├── result/
│   │   │   │   └── history/     # Past results list
│   │   │   └── resume/
│   │   ├── components/          # Reusable UI components
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useSpeechRecognition.ts
│   │   │   ├── useVideoRecorder.ts
│   │   │   ├── useVoiceAnalytics.ts
│   │   │   └── useFacePresence.ts
│   │   └── lib/                 # Auth service, API utils
│   └── next.config.ts
│
├── backend/                     # Express.js API
│   ├── server.js                # Entry point
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── migrations/          # Migration history
│   └── src/
│       ├── config/              # Env config, Prisma client
│       ├── controllers/         # Route handlers
│       ├── middleware/          # Auth, error, logging
│       ├── routes/              # Express routers
│       ├── services/            # Business logic + AI
│       │   ├── aiService.js          # Groq API abstraction
│       │   ├── resumeAnalysisService.js
│       │   └── resumeParserService.js
│       └── utils/               # Response helpers
│
├── .gitignore
├── README.md
├── ARCHITECTURE.md
├── SYSTEM_DESIGN.md
└── API_REFERENCE.md
```

---

## 🚀 Deployment Architecture

```
GitHub (main branch)
     │
     ├──→ Vercel          (auto-deploy frontend on push)
     └──→ Railway         (auto-deploy backend on push)
                │
                └──→ Supabase PostgreSQL (always-on managed DB)
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL database (or Supabase project)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone the repository
```bash
git clone https://github.com/nihal-710/ai-interview-platform.git
cd ai-interview-platform
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/ai_interview_db
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
GROQ_API_KEY=gsk_your_groq_key_here
GROQ_MODEL=llama3-8b-8192
```

Run database migrations:
```bash
npx prisma migrate deploy
npx prisma generate
```

Start backend:
```bash
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 🌍 Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | ✅ |
| `NODE_ENV` | `development` or `production` | ✅ |
| `CLIENT_URL` | Frontend URL for CORS | ✅ |
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Secret key for JWT signing | ✅ |
| `JWT_EXPIRES_IN` | Token expiry e.g. `7d` | ✅ |
| `GROQ_API_KEY` | Groq API key | ✅ |
| `GROQ_MODEL` | Model ID e.g. `llama3-8b-8192` | ✅ |

### Frontend (`frontend/.env.local`)
| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL ending in `/api` | ✅ |

---

## 🗄️ Database Migrations

```bash
# Create a new migration
cd backend
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Open Prisma Studio (GUI)
npx prisma studio
```

---

## 🗺️ Future Roadmap

- [ ] Mock interview with AI voice (text-to-speech responses)
- [ ] Company-specific interview preparation tracks
- [ ] Peer comparison and leaderboards
- [ ] Interview scheduling and calendar integration
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Admin dashboard for analytics
- [ ] Paid tier with advanced AI models (GPT-4, Claude)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 🧠 Engineering Skills Demonstrated

| Skill Area | Details |
|------------|---------|
| **Backend Architecture** | Layered Express.js (Routes → Controllers → Services), clean separation of concerns |
| **AI Integration** | Groq LLM API for question generation, answer evaluation, resume analysis, and interviewer gestures |
| **Database Modeling** | Normalized PostgreSQL schema with Prisma ORM, cascade deletes, enum types |
| **Authentication** | JWT-based auth with bcrypt hashing, protected middleware, token validation |
| **Deployment Pipelines** | GitHub → Vercel (frontend) + Railway (backend) + Supabase (DB), fully automated CI/CD |
| **Browser APIs** | Web Speech API (STT), MediaRecorder API (video), real-time UI feedback |
| **Analytics Dashboards** | Aggregated SQL queries, SVG trend charts, skill frequency analysis |
| **Error Handling** | Fallback strategies for AI failures, graceful degradation, structured error responses |
| **TypeScript** | Strict typing across all frontend components, hooks, and API calls |
| **System Design** | Separation of AI provider layer, environment-based config, scalable service structure |

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

<p align="center">Built by <a href="https://github.com/nihal-710">nihal-710</a></p>
