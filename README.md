# PrepAI — AI Interview Preparation Platform

A full-stack AI-powered platform to help candidates prepare for job interviews
through AI-generated questions, real-time feedback, and performance analytics.

## Tech Stack

| Layer      | Technology                           |
|------------|--------------------------------------|
| Frontend   | Next.js 16, TypeScript, Tailwind CSS |
| Backend    | Express.js, Node.js                  |
| Database   | PostgreSQL, Prisma ORM               |
| Auth       | JWT, bcryptjs                        |
| AI Service | Coming soon                          |

## Project Structure
AI-Interview-Platform/
├── frontend/     → Next.js App Router
├── backend/      → Express.js REST API
├── database/     → DB config and seeds
├── ai-service/   → AI integration (coming soon)
└── docs/         → Documentation

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL running locally
- Git

### Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Visit `http://localhost:3000`

## Completed Milestones
- [x] Frontend scaffolding with Next.js App Router
- [x] Backend REST API with Express.js
- [x] PostgreSQL database with Prisma ORM
- [x] Full authentication system (register, login, JWT)
- [x] Protected routes on frontend and backend
- [ ] AI interview session (in progress)
- [ ] Results and feedback system
- [ ] Resume analysis