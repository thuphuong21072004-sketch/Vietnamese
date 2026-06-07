# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack Vietnamese language learning platform with:
- Self-paced courses (levels → courses → units → quizzes)
- One-on-one tutoring marketplace (teacher profiles, availability, booking, payments)
- Group live classes with scheduling and attendance
- AI-powered tutoring and speaking practice (OpenAI + gTTS)

## Commands

### Frontend (Angular 18) — `Fontend/`
```bash
npm start          # Dev server at http://localhost:4200
npm run build      # Production build → dist/fontend
npm test           # Karma/Jasmine unit tests
```

### Backend (ASP.NET Core .NET 8) — `Backend/Backend/`
```bash
dotnet run         # API server at https://localhost:5108
dotnet build       # Build only
dotnet ef database update  # Apply EF Core migrations
```

## Architecture

### Frontend Structure
```
Fontend/src/app/
├── core/interceptors/      # JWT auth interceptor (adds Bearer token to all requests)
├── features/
│   ├── models/             # TypeScript DTOs mirroring backend models
│   ├── services/           # API service classes (extend base.service.ts)
│   └── pages/
│       ├── ViewUser/       # Learner flows (units, quizzes, booking, speaking)
│       └── ViewAdmin/      # Admin/moderator/teacher dashboards
└── app.component.ts        # Root shell — manages auth state and role-based nav
```

Routes are defined in `app.routes.ts` (100+ routes). Role-based UI is determined by `currentUser.role` stored in `AppComponent`.

### Backend Structure
```
Backend/Backend/
├── Controllers/            # API surface — thin, delegate to services
├── Services/               # Business logic (interface + impl pattern)
├── Repository/             # Data access (interface + impl pattern)
├── Models/                 # EF Core entities
├── Data/AppDbContext.cs    # 24 DbSets, relationship config, cascade delete rules
├── dto/                    # Request/response DTOs
├── Mapper/                 # AutoMapper profiles
├── Common/                 # JWT helper, UserContext (current user resolution)
└── Middleware/             # Global exception handling
```

### Data Flow
Frontend → `auth.interceptor.ts` adds JWT → Backend Controller → Service → Repository → EF Core → SQL Server (`vietnamese` database on `localhost\SQLEXPRESS`).

### Key Domain Relationships
- **Learning:** `Level → Course → Unit → Quiz → Part → Question → Answer` (cascade delete throughout)
- **Tutoring:** `TeacherProfile → TeacherAvailability → Booking → Payment → Review`
- **Classes:** `TeacherClass → ClassScheduleDay → ClassSession → ClassEnrollment → ClassAttendance`
- **Auth:** `User ↔ Role` (roles: Admin, Moderator/Teacher, Student/Learner)

### External Integrations
- **Stripe:** Payment processing — keys in `appsettings.json`, webhooks handled in `StripeService`
- **OpenAI:** Chat completions (AI tutor) and Whisper (speech-to-text) — keys currently disabled in config
- **Python/gTTS:** `TextToSpeechService` calls Python CLI for audio generation
- **YouTube:** Video import with transcript extraction

## Configuration

- **Frontend API base URL:** `Fontend/src/environments/environment.ts` → `http://localhost:5108/api`
- **Backend config:** `Backend/Backend/appsettings.json` — DB connection, JWT secret, Stripe keys, AI keys
- **CORS:** Backend allows `http://localhost:4200` only

## Known Architectural Gaps (from `Fontend/architecture.md`)

- Many components call API URLs directly instead of using services
- Route guards are missing on most protected routes
- No shared design system — component-level CSS is scattered
- AI/speaking workloads run synchronously (no background job queue)
- `Fontend/skill.md` contains coding standards and feature rules used in this project
