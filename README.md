# Student Management System

Full stack onboarding project using Next.js, Spring Boot, Supabase PostgreSQL, JWT authentication, and Tailwind CSS.

## Checklist Status

- Next.js frontend: complete
- Spring Boot REST API: complete
- Supabase PostgreSQL integration: configured through environment variables
- Students, courses, and users tables: schema provided in `database/schema.sql`
- CRUD APIs for students and courses: complete
- Login and protected API calls: complete
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

1. Sign in on `/login` with the admin account.
2. The frontend stores the JWT in browser local storage.
3. API requests send `Authorization: Bearer <token>`.
4. Expired or missing sessions redirect back to `/login`.

Roles:

- `ADMIN`: manage users, courses, and students; delete students
- `INSTRUCTOR`: view courses/students and create/update students

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

## Deployment

Recommended simple deployment:

- Supabase: database
- Render: Spring Boot backend
- Vercel: Next.js frontend

### 1. Deploy Supabase

Run `database/schema.sql` in the Supabase SQL Editor.

Use a Supabase connection string that your backend host can reach. Supabase direct connections can require IPv6. If your backend host cannot connect, use the Supabase pooler/session connection string and convert it to JDBC format:

```text
jdbc:postgresql://HOST:PORT/postgres?sslmode=require
```

### 2. Deploy Backend On Render

Create a Render Web Service from this GitHub repository.

Use these settings:

```text
Root Directory: backend
Build Command: ./mvnw clean package -DskipTests
Start Command: java -jar target/backend-0.0.1-SNAPSHOT.jar
```

Add these Render environment variables:

```text
DB_URL=jdbc:postgresql://YOUR_SUPABASE_HOST:5432/postgres?sslmode=require
DB_USERNAME=postgres
DB_PASSWORD=YOUR_SUPABASE_DATABASE_PASSWORD
JWT_SECRET=YOUR_BASE64_SECRET
JWT_EXPIRATION_MS=86400000
ADMIN_USERNAME=System Admin
ADMIN_EMAIL=admin@studentmanagement.com
ADMIN_PASSWORD=YourOwnStrongPassword123
CORS_ALLOWED_ORIGINS=https://YOUR_FRONTEND_DOMAIN.vercel.app
```

After Render deploys, your backend link will look like:

```text
https://your-backend-name.onrender.com
```

Backend API base URL:

```text
https://your-backend-name.onrender.com/api
```

Health check:

```text
https://your-backend-name.onrender.com/api/health
```

### 3. Deploy Frontend On Vercel

Create a Vercel project from this GitHub repository.

Use these settings:

```text
Root Directory: frontend
Build Command: npm run build
Install Command: npm install
```

Add this Vercel environment variable:

```text
NEXT_PUBLIC_API_BASE_URL=https://your-backend-name.onrender.com/api
```

After Vercel deploys, your frontend link will look like:

```text
https://your-frontend-name.vercel.app
```

After you know the Vercel URL, go back to Render and update:

```text
CORS_ALLOWED_ORIGINS=https://your-frontend-name.vercel.app
```

Then redeploy the backend.

Final deliverable links:

```text
Frontend: https://your-frontend-name.vercel.app
Backend API: https://your-backend-name.onrender.com/api
Health Check: https://your-backend-name.onrender.com/api/health
```
