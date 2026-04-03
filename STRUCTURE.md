# AI Interview Platform — App Router Structure

src/
└── app/
    ├── globals.css          ← Design tokens, shared utility classes
    ├── layout.tsx           ← Root layout (wraps every page)
    ├── page.tsx             ← Landing page  →  Route: /
    │
    ├── login/
    │   └── page.tsx         ← Login form    →  Route: /login
    │
    ├── signup/
    │   └── page.tsx         ← Sign-up form  →  Route: /signup
    │
    ├── dashboard/
    │   └── page.tsx         ← User dashboard →  Route: /dashboard
    │
    ├── interview/
    │   └── page.tsx         ← Pick interview type → Route: /interview
    │
    └── result/
        └── page.tsx         ← Session results   →  Route: /result


## App Router Convention Rules

1. Every route = a FOLDER with a page.tsx inside it
2. layout.tsx  = persistent shell (nav, fonts, providers) — does NOT re-render between navigations
3. page.tsx    = the unique content for that URL
4. Route is determined by FOLDER NAME, not the file name
5. Nested folders = nested routes  (e.g. app/interview/session/page.tsx → /interview/session)


## Next Steps to Add

- app/interview/[sessionId]/page.tsx   ← Live interview room (dynamic route)
- app/dashboard/layout.tsx             ← Dashboard-only sidebar layout
- app/api/interview/route.ts           ← API Route for AI calls
- middleware.ts                        ← Auth guard (redirect /dashboard → /login if unauthenticated)
