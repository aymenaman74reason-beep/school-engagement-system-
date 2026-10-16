# School Management System - Backend API

Production-ready backend for an Integrated School Management and Parent–Child Education Engagement System.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (access + refresh tokens) + bcrypt
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest + Supertest + mongodb-memory-server

## Quick Start

### Prerequisites

- Node.js >= 18
- MongoDB >= 6.0 (running locally or Atlas URI)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env
# Edit .env with your MongoDB URI and secrets

# 3. Seed the database with demo data
npm run seed

# 4. Start the development server
npm run dev
```

Server starts at `http://localhost:5000`.

### Default Credentials (after seeding)

| Role    | Email               | Password       |
| ------- | ------------------- | -------------- |
| Admin   | admin@school.com    | Admin@123456   |
| Teacher | teacher1@school.com | Teacher@123456 |
| Teacher | teacher2@school.com | Teacher@123456 |
| Parent  | parent@school.com   | Parent@123456  |
| Student | student1@school.com | Student@123456 |
| Student | student2@school.com | Student@123456 |

## API Endpoints

Base URL: `/api/v1`

### Auth

| Method | Endpoint                | Access |
| ------ | ----------------------- | ------ |
| POST   | `/auth/login`           | Public |
| POST   | `/auth/register`        | Admin  |
| POST   | `/auth/logout`          | Auth   |
| POST   | `/auth/refresh-token`   | Public |
| POST   | `/auth/forgot-password` | Public |
| POST   | `/auth/reset-password`  | Public |
| PUT    | `/auth/change-password` | Auth   |
| GET    | `/auth/me`              | Auth   |

### User Management

| Method | Endpoint            | Access |
| ------ | ------------------- | ------ |
| GET    | `/users`            | Admin  |
| GET    | `/users/:id`        | Admin  |
| PUT    | `/users/:id`        | Admin  |
| DELETE | `/users/:id`        | Admin  |
| PUT    | `/users/:id/status` | Admin  |

### Academic

| Method | Endpoint                         | Access           |
| ------ | -------------------------------- | ---------------- |
| POST   | `/academic/classes`              | Admin            |
| GET    | `/academic/classes`              | Auth             |
| GET    | `/academic/classes/:id`          | Auth             |
| PUT    | `/academic/classes/:id`          | Admin/Teacher    |
| DELETE | `/academic/classes/:id`          | Admin            |
| POST   | `/academic/subjects`             | Admin            |
| GET    | `/academic/subjects`             | Auth             |
| POST   | `/academic/academic-terms`       | Admin            |
| GET    | `/academic/academic-terms`       | Auth             |
| POST   | `/academic/enrollments`          | Admin            |
| GET    | `/academic/enrollments`          | Admin/Teacher    |
| PUT    | `/academic/students/:id/profile` | Admin            |
| GET    | `/academic/students/:id`         | Auth (ownership) |

### Attendance

| Method | Endpoint                         | Access           |
| ------ | -------------------------------- | ---------------- |
| POST   | `/attendance`                    | Admin/Teacher    |
| POST   | `/attendance/bulk`               | Admin/Teacher    |
| GET    | `/attendance/class/:classId`     | Admin/Teacher    |
| GET    | `/attendance/student/:studentId` | Auth (ownership) |
| GET    | `/attendance/summary/:classId`   | Admin/Teacher    |

### Grades

| Method | Endpoint                                    | Access           |
| ------ | ------------------------------------------- | ---------------- |
| POST   | `/grades`                                   | Admin/Teacher    |
| PUT    | `/grades/:id`                               | Admin/Teacher    |
| GET    | `/grades/student/:studentId`                | Auth (ownership) |
| GET    | `/grades/class/:classId/subject/:subjectId` | Admin/Teacher    |
| GET    | `/grades/summary/:classId`                  | Admin/Teacher    |

### Assignments

| Method | Endpoint                            | Access           |
| ------ | ----------------------------------- | ---------------- |
| POST   | `/assignments`                      | Admin/Teacher    |
| GET    | `/assignments`                      | Auth             |
| GET    | `/assignments/:id`                  | Auth             |
| PUT    | `/assignments/:id`                  | Admin/Teacher    |
| DELETE | `/assignments/:id`                  | Admin/Teacher    |
| POST   | `/assignments/:id/submit`           | Student          |
| GET    | `/assignments/:id/submissions`      | Admin/Teacher    |
| POST   | `/assignments/feedback`             | Admin/Teacher    |
| GET    | `/assignments/feedback/student/:id` | Auth (ownership) |

### Notifications

| Method | Endpoint                  | Access        |
| ------ | ------------------------- | ------------- |
| GET    | `/notifications`          | Auth          |
| PUT    | `/notifications/read-all` | Auth          |
| PUT    | `/notifications/:id/read` | Auth          |
| POST   | `/notifications`          | Admin/Teacher |

### Announcements

| Method | Endpoint             | Access        |
| ------ | -------------------- | ------------- |
| POST   | `/announcements`     | Admin/Teacher |
| GET    | `/announcements`     | Auth          |
| PUT    | `/announcements/:id` | Admin/Teacher |
| DELETE | `/announcements/:id` | Admin/Teacher |

### Messages

| Method | Endpoint             | Access |
| ------ | -------------------- | ------ |
| POST   | `/messages`          | Auth   |
| GET    | `/messages`          | Auth   |
| GET    | `/messages/threads`  | Auth   |
| PUT    | `/messages/:id/read` | Auth   |

### Reports

| Method | Endpoint       | Access        |
| ------ | -------------- | ------------- |
| POST   | `/reports`     | Admin/Teacher |
| GET    | `/reports`     | Admin/Teacher |
| GET    | `/reports/:id` | Admin/Teacher |

### Admin

| Method | Endpoint          | Access |
| ------ | ----------------- | ------ |
| GET    | `/audit-logs`     | Admin  |
| GET    | `/audit-logs/:id` | Admin  |
| GET    | `/school-config`  | Auth   |
| PUT    | `/school-config`  | Admin  |

### Health

| Method | Endpoint  | Access |
| ------ | --------- | ------ |
| GET    | `/health` | Public |

## Architecture

```
src/
├── config/         # Environment, database connection
├── constants/      # Roles, permissions, messages
├── models/         # 21 Mongoose schemas
├── middleware/      # Auth, RBAC, validation, audit, error handler, rate limiter
├── validators/     # Zod validation schemas
├── controllers/    # HTTP handlers (thin layer)
├── services/       # Business logic
├── routes/v1/      # Express route definitions
├── events/         # Event-driven notification system
├── utils/          # Logger, errors, async handler, response formatter
├── types/          # TypeScript interfaces
├── scripts/        # Seed script
├── app.ts          # Express app setup
└── server.ts       # Server entry point
```

## Security

- JWT access tokens (15min) + refresh tokens (7d)
- bcrypt password hashing (12 salt rounds)
- Account lockout after 5 failed attempts (30min)
- Rate limiting on auth endpoints
- Helmet secure headers
- CORS configuration
- Input validation on all endpoints
- Role-based access control (RBAC)
- Parent-child ownership checks
- Audit logging for all mutations

## Testing

```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

## Scripts

| Script          | Description                   |
| --------------- | ----------------------------- |
| `npm run dev`   | Start dev server (hot reload) |
| `npm run build` | Compile TypeScript            |
| `npm start`     | Start production server       |
| `npm run seed`  | Seed database with demo data  |
| `npm test`      | Run test suite                |

## Backup Strategy

- Configure MongoDB daily automated backups using `mongodump`
- Store backups in a separate storage location
- Implement a rotation policy (keep last 30 daily backups)
- Test restore procedures periodically with `mongorestore`

## Deployment Notes

1. Set `NODE_ENV=production` in environment
2. Use strong `JWT_SECRET` (min 64 characters)
3. Configure CORS for production frontend domain
4. Enable MongoDB authentication
5. Set up SSL/TLS termination at load balancer
6. Use PM2 or Docker for process management
7. Configure MongoDB Atlas or replica set for high availability
8. Set up monitoring (health endpoint + logs)
