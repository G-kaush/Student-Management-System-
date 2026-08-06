# Student Management System

Full stack onboarding project using Next.js, Spring Boot, Supabase PostgreSQL, JWT authentication, and Tailwind CSS.

## Checklist Status

- Next.js frontend: complete
- Spring Boot REST API: complete
- Supabase PostgreSQL integration: configured through environment variables
- Users, instructor-owned courses, and enrollments tables: schema provided in `database/schema.sql`
- Course CRUD APIs, student viewing, and instructor approval: complete
- Login, student/instructor registration, and protected API calls: complete
- Student course enrollment flow: complete
- JWT authentication and role-based endpoint access: complete
- Validation and JSON error responses: complete
- Local build/test commands: documented below

## Prerequisites

- Java 21
- Node.js 20 or newer
- Supabase project with a PostgreSQL database
- PowerShell on Windows

## Supabase Setup

1. Open your Supabase project.
2. Go to SQL Editor.
3. Run the SQL in `database/schema.sql`.
4. Copy your database connection values from Project Settings > Database.

The backend uses direct JDBC access to Supabase PostgreSQL, so the database connection string must start with `jdbc:postgresql://`.

## Backend Setup

Create `backend/.env` from `backend/.env.example` and fill in real values:

```powershell
Copy-Item backend\.env.example backend\.env
```

Generate a JWT secret:

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Paste the generated value into `JWT_SECRET` in `backend/.env`.

Run the backend:

```powershell
cd backend
.\run-local.ps1
```

The API runs at:

```text
http://localhost:8080/api
```

Health check:

```text
GET http://localhost:8080/api/health
```

If `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` are set in `backend/.env`, the backend creates the first admin account on startup when that email does not already exist.

## Frontend Setup

The frontend reads `NEXT_PUBLIC_API_BASE_URL` from `frontend/.env.local`.

Expected local value:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

Run the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Authentication Flow

1. Students create their own account on `/register` and can log in immediately.
2. Instructors request an account on `/register`.
3. The single Admin account is created by bootstrap environment variables.
4. Admin approves pending instructor requests from the Users page.
5. Approved users sign in on `/login`.
6. The frontend stores the JWT in browser local storage.
7. API requests send `Authorization: Bearer <token>`.
8. Expired or missing sessions redirect back to `/login`.

Roles:

- `ADMIN`: single bootstrap account; approve instructors, assign courses to instructors, view all students, courses, users, and enrollments
- `INSTRUCTOR`: log in only after approval; view assigned courses and students enrolled in those courses
- `STUDENT`: register, log in, use dashboard/profile, view available courses, enroll in courses, and view enrolled courses

Registration APIs:

```text
POST  /api/auth/register             public student registration
POST  /api/auth/instructor/register  public instructor request
PATCH /api/users/{id}/approve        admin-only instructor approval
```

Enrollment APIs:

```text
GET  /api/courses/available        student-only available courses
POST /api/enrollments/{courseId}   student-only enroll in course
GET  /api/enrollments/my-courses   student-only enrolled courses
GET  /api/enrollments              admin sees all; instructor sees own course enrollments
```

## Useful Commands

Frontend:

```powershell
cd frontend
npm run lint
npm run build
```

Backend:

```powershell
cd backend
.\mvnw.cmd test
```

Backend tests use an H2 test profile and do not require Supabase credentials.
