# API Reference — PrepAI

**Base URL:** `https://ai-interview-platform-production.up.railway.app/api`

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

## Authentication

### POST /auth/register
Create a new user account.

**Auth required:** No

**Request Body:**
```json
{
  "name": "Nihal Raj",
  "email": "nihal@example.com",
  "password": "securepassword123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clxyz123",
      "name": "Nihal Raj",
      "email": "nihal@example.com",
      "role": "USER"
    }
  }
}
```

**Error Responses:**
- `400` — Missing required fields
- `409` — Email already registered
- `500` — Server error

---

### POST /auth/login
Authenticate and receive a JWT token.

**Auth required:** No

**Request Body:**
```json
{
  "email": "nihal@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clxyz123",
      "name": "Nihal Raj",
      "email": "nihal@example.com",
      "role": "USER"
    }
  }
}
```

**Error Responses:**
- `400` — Missing email or password
- `401` — Invalid credentials
- `500` — Server error

---

## Interview Sessions

### POST /interview/start
Start a new AI-generated interview session.

**Auth required:** Yes

**Request Body:**
```json
{
  "interviewType": "TECHNICAL",
  "targetRole": "Backend Developer"
}
```

**Valid interviewType values:** `BEHAVIORAL` | `TECHNICAL` | `SYSTEM_DESIGN` | `CASE_STUDY`

**Success Response (201):**
```json
{
  "success": true,
  "message": "Interview session started.",
  "data": {
    "session": {
      "id": "session_abc123",
      "type": "TECHNICAL",
      "targetRole": "Backend Developer",
      "status": "IN_PROGRESS",
      "totalQuestions": 5,
      "answeredCount": 0,
      "questions": [
        {
          "id": "q_001",
          "content": "Explain the difference between SQL and NoSQL databases.",
          "orderIndex": 1,
          "category": "TECHNICAL",
          "difficulty": "medium",
          "response": null
        }
      ]
    }
  }
}
```

**Error Responses:**
- `400` — Invalid interview type
- `401` — Unauthorized
- `500` — AI generation failed

---

### POST /interview/:sessionId/respond
Submit an answer to a question.

**Auth required:** Yes

**URL Params:** `sessionId` — interview session ID

**Request Body:**
```json
{
  "questionId": "q_001",
  "answer": "SQL databases use structured tables with schemas...",
  "timeTaken": 120
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Answer submitted.",
  "data": {
    "evaluation": {
      "score": 78,
      "feedback": "Good explanation of core differences with relevant examples.",
      "strengths": ["Clear comparison", "Mentioned use cases"],
      "improvements": ["Could mention ACID compliance", "Add performance context"]
    }
  }
}
```

**Error Responses:**
- `400` — Missing questionId or answer
- `401` — Unauthorized
- `404` — Session or question not found
- `500` — AI evaluation failed

---

### POST /interview/:sessionId/complete
Mark a session as complete and generate final AI summary.

**Auth required:** Yes

**URL Params:** `sessionId` — interview session ID

**Request Body:** None required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Interview completed.",
  "data": {
    "result": {
      "id": "result_xyz",
      "overallScore": 74,
      "sessionSummary": "Strong performance in technical concepts with good depth...",
      "strengthAreas": ["Database knowledge", "API design"],
      "improvementAreas": ["System scalability", "Error handling patterns"]
    }
  }
}
```

**Error Responses:**
- `401` — Unauthorized
- `404` — Session not found
- `500` — Summary generation failed

---

### POST /interview/:sessionId/gesture
Get an AI interviewer reaction to a submitted answer (non-critical, used for UI feedback).

**Auth required:** Yes

**Request Body:**
```json
{
  "question": "Explain REST principles",
  "answer": "REST uses stateless HTTP methods...",
  "candidateName": "Nihal"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "gesture": "Excellent response Nihal, very well articulated."
  }
}
```

---

## Results

### GET /results/:sessionId
Get full result for a completed session.

**Auth required:** Yes

**URL Params:** `sessionId` — interview session ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "result": {
      "id": "result_xyz",
      "sessionId": "session_abc123",
      "overallScore": 74,
      "completionScore": 100,
      "answerLengthScore": 68,
      "keywordScore": 72,
      "questionScores": [
        { "questionId": "q_001", "score": 78, "feedback": "..." }
      ],
      "strengthAreas": ["Database knowledge"],
      "improvementAreas": ["Scalability thinking"],
      "sessionSummary": "...",
      "totalQuestions": 5,
      "answeredQuestions": 5,
      "totalTimeSecs": 845,
      "session": {
        "type": "TECHNICAL",
        "targetRole": "Backend Developer",
        "questions": [ ... ]
      }
    }
  }
}
```

**Error Responses:**
- `401` — Unauthorized
- `403` — Result belongs to another user
- `404` — Result not found

---

### POST /results/:sessionId/behavioral
Save behavioral analytics (voice + face data) for a session.

**Auth required:** Yes

**Request Body:**
```json
{
  "behavioral": {
    "voice": { "averagePace": 145, "fillerWordCount": 3 },
    "face": { "presenceScore": 92, "eyeContactPercent": 78 }
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Behavioral analytics saved."
}
```

---

## Resume Analyzer

### POST /resume/upload
Upload and analyze a PDF resume.

**Auth required:** Yes

**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File (PDF) | Yes | Resume PDF file |
| `targetRole` | String | No | Target job role (default: `Software Engineer`) |

**Valid targetRole values:** `Software Engineer` | `Frontend Developer` | `Backend Developer` | `Full Stack Developer` | `Data Scientist` | `AI Engineer` | `Product Manager` | `DevOps Engineer`

**Success Response (201):**
```json
{
  "success": true,
  "message": "Resume analysed successfully.",
  "data": {
    "resume": {
      "id": "resume_xyz",
      "fileName": "nihal_resume.pdf",
      "targetRole": "Backend Developer",
      "resumeScore": 72,
      "matchedSkills": ["Node.js", "Express", "PostgreSQL", "REST APIs"],
      "missingSkills": ["Docker", "Kubernetes", "System Design"],
      "focusAreas": [
        "Strengthen containerization knowledge",
        "Add cloud deployment experience"
      ],
      "recommendations": [
        "Learn Docker and deploy a project",
        "Add quantifiable impact metrics to experience section",
        "Contribute to an open source backend project"
      ],
      "uploadedAt": "2026-04-10T12:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400` — No file uploaded
- `401` — Unauthorized
- `422` — Could not read PDF (corrupted or image-based)
- `500` — Analysis failed

---

### GET /resume/latest
Get the most recently uploaded resume for the authenticated user.

**Auth required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "resume": {
      "id": "resume_xyz",
      "fileName": "nihal_resume.pdf",
      "targetRole": "Backend Developer",
      "resumeScore": 72,
      "matchedSkills": [...],
      "missingSkills": [...],
      "focusAreas": [...],
      "recommendations": [...],
      "uploadedAt": "2026-04-10T12:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401` — Unauthorized
- `404` — No resume found

---

### GET /resume/history
Get all past resume uploads for the authenticated user.

**Auth required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "resumes": [
      {
        "id": "resume_xyz",
        "fileName": "nihal_resume.pdf",
        "targetRole": "Backend Developer",
        "resumeScore": 72,
        "matchedSkills": [...],
        "missingSkills": [...],
        "uploadedAt": "2026-04-10T12:00:00.000Z"
      }
    ]
  }
}
```

---

## Dashboard Analytics

### GET /dashboard/summary
Get aggregated performance statistics for the authenticated user.

**Auth required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalSessions": 12,
    "completedSessions": 10,
    "averageScore": 71,
    "bestScore": 89,
    "currentStreak": 3,
    "totalTimeMinutes": 142,
    "favoriteType": "TECHNICAL"
  }
}
```

---

### GET /dashboard/history
Get recent interview sessions.

**Auth required:** Yes

**Query Params:**
| Param | Default | Description |
|-------|---------|-------------|
| `limit` | `5` | Number of sessions to return |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session_abc123",
        "type": "TECHNICAL",
        "targetRole": "Backend Developer",
        "status": "COMPLETED",
        "overallScore": 74,
        "totalQuestions": 5,
        "answeredCount": 5,
        "createdAt": "2026-04-10T12:00:00.000Z",
        "strengths": ["Database knowledge"],
        "improvements": ["Scalability thinking"]
      }
    ]
  }
}
```

---

### GET /dashboard/trend
Get score trend data for chart rendering.

**Auth required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "trend": [
      { "index": 1, "score": 62, "date": "Apr 1", "type": "BEHAVIORAL" },
      { "index": 2, "score": 71, "date": "Apr 3", "type": "TECHNICAL" },
      { "index": 3, "score": 74, "date": "Apr 10", "type": "TECHNICAL" }
    ]
  }
}
```

---

### GET /dashboard/skills
Get aggregated skill strengths and improvement areas.

**Auth required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "topStrengths": [
      { "text": "Database knowledge", "count": 4 },
      { "text": "API design", "count": 3 }
    ],
    "topImprovements": [
      { "text": "Scalability thinking", "count": 5 },
      { "text": "System design depth", "count": 3 }
    ],
    "typeAverages": [
      { "type": "TECHNICAL", "avgScore": 74, "count": 6 },
      { "type": "BEHAVIORAL", "avgScore": 68, "count": 4 }
    ]
  }
}
```

---

## Health

### GET /health
Basic health check.

**Auth required:** No

**Success Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-04-10T12:00:00.000Z",
  "uptime": 3600
}
```

---

### GET /health/ready
Full readiness check including database and AI service.

**Auth required:** No

**Success Response (200):**
```json
{
  "status": "ready",
  "database": "connected",
  "aiService": "connected",
  "model": "llama3-8b-8192"
}
```
