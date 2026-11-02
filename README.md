# Siksha – Smart Learning Platform for School Students

A centralized MERN web app where school students (classes 6–12) find notes, PDFs, videos and quizzes organised by **class → subject → topic**, get **instant quiz feedback**, and **track their progress**. Teachers upload and manage content, build quizzes, and view student performance reports.

> IROP project · Department of CSE, Chitkara University, Punjab
> Nishita · Shivika · Sneha Rathore · Manya Garg — supervised by Dr. Lalit Sharma

---

## Quick start

Requires **Node.js 18+**. No MongoDB install needed — if `MONGO_URI` is not set, the server starts an embedded MongoDB that saves data in `server/.data` (first run downloads the MongoDB binary, ~75 MB).

```bash
npm run install:all   # installs root, server and client dependencies
npm run dev           # API on http://localhost:5050, web app on http://localhost:5173
```

Open **http://localhost:5173**. Demo data is seeded automatically on first start:

| Role | Email | Password |
|---|---|---|
| Student (Class 9) | `student@siksha.com` | `student123` |
| Teacher | `teacher@siksha.com` | `teacher123` |

More demo users: `ananya@siksha.com`, `rohan@siksha.com` (students) and `priya@siksha.com` (teacher), same passwords.
The login page also has one-click **Demo student / Demo teacher** buttons.

Other scripts:

```bash
npm run seed    # wipe the database and re-seed demo data
npm test        # API integration tests (node:test + supertest, in-memory MongoDB)
npm run build   # build the React app; `npm start` then serves API + app on :5050
```

### Configuration (`server/.env`, see `.env.example`)

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5050) |
| `JWT_SECRET` | Secret for signing JWTs — **set this in production** |
| `MONGO_URI` | Your MongoDB / Atlas connection string (optional) |
| `CLOUDINARY_URL` | If set, uploaded PDFs/videos go to Cloudinary instead of `server/uploads` |

---

## Features (mapped to the synopsis modules)

1. **Authentication & Access Control** — registration with role (student/teacher) and class, bcrypt-hashed passwords, JWT sessions, role-protected API routes and pages.
2. **Teacher Content Management** — create/edit/delete Notes (Markdown editor with live preview), PDF uploads (drag & drop), videos (upload or YouTube link) and external links; organised by class/subject/topic with tags.
3. **External Educational Sources** — search Wikipedia and Open Library through their official public APIs (no scraping); teachers can add results to the library; every resource page shows a Wikipedia summary of its topic.
4. **Student Learning Module** — library with a Class → Subject → Topic tree, inline viewers (Markdown notes, embedded PDF, YouTube/MP4 player), bookmarks, mark-as-complete, related resources and topic quizzes.
5. **Quiz & Evaluation Module** — timed quizzes with question palette, flag-for-review, keyboard shortcuts and auto-submit; server-side evaluation (answers are never sent to students before submitting); instant results with per-question explanations.
6. **Progress Tracking Module** — scores stored per attempt; averages by subject and topic, weak/strong topics, study streak, completion stats.
7. **Search & Filter Module** — keyword search plus class, subject, topic, type and sort filters (also from the global search bar).
8. **Dashboard & Reports** — personalised student dashboard and teacher dashboard with charts; printable reports and CSV export; teachers can open any student's full report.
9. **Testing & Integration** — `server/tests/api.test.js` covers auth, RBAC, search, content/quiz creation, evaluation and reports.

Also: dark mode, responsive layout (mobile sidebar), toasts, empty states.

---

## Architecture

```
Student / Teacher ─► React (Vite + Tailwind) ─► REST API (Express) ─► JWT auth & business logic ─► MongoDB (Mongoose)
                                                                                               └► File storage (local / Cloudinary)
```

```
siksha/
├─ server/                 Node.js + Express API
│  ├─ src/models/          User, Resource, Quiz, Attempt (Mongoose)
│  ├─ src/routes/          auth, resources, quizzes, progress, external, meta
│  ├─ src/middleware/      JWT auth + role guard
│  ├─ src/utils/           file storage (multer/Cloudinary), PDF generator for seed
│  ├─ src/seed.js          demo data
│  └─ tests/               API tests
└─ client/                 React app
   └─ src/
      ├─ pages/            Landing, Auth, Library, ResourceView, Explore, Profile
      │  ├─ student/       Dashboard, Quizzes, QuizAttempt, AttemptResult, Progress
      │  └─ teacher/       Dashboard, ManageContent, QuizBuilder, Students
      ├─ components/       Layout, UI kit, cards, charts (Recharts)
      └─ context/          Auth + toast providers
```

## REST API

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET/PUT | `/api/auth/me` | logged in |
| GET | `/api/resources?q=&className=&subject=&topic=&type=&sort=&bookmarked=1&mine=1` | logged in |
| GET | `/api/resources/:id` (with related resources & quizzes) | logged in |
| POST/PUT/DELETE | `/api/resources[/:id]` (multipart, field `file`) | teacher (owner) |
| POST | `/api/resources/:id/bookmark`, `/api/resources/:id/complete` | logged in |
| GET | `/api/quizzes`, `/api/quizzes/:id` (answers hidden for students) | logged in |
| POST/PUT/DELETE | `/api/quizzes[/:id]` | teacher (owner) |
| POST | `/api/quizzes/:id/attempt` → score + feedback | student |
| GET | `/api/progress/me`, `/api/progress/attempts/:id` | student / teacher |
| GET | `/api/progress/teacher/overview`, `/api/progress/teacher/students/:id` | teacher |
| GET | `/api/external/search?q=`, `/api/external/summary?title=` | logged in |
| POST | `/api/external/import` | teacher |
| GET | `/api/meta/taxonomy` | logged in |

Note: the seeded "Video lessons" items link to YouTube search pages. Videos a teacher adds with a direct YouTube link (or an uploaded MP4) play inside the app.
