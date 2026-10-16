# Integrated School Management System

The **Integrated School Management and Parent–Child Education Engagement System** is a platform designed to modernize school operations and strengthen communication between schools, parents, teachers, and students.

## Project Structure
This system follows a split-stack approach:
- `/backend`: Node.js, Express, MongoDB, TypeScript, Mongoose
- `/frontend`: React, Vite, Tailwind CSS, TypeScript

## Features
- **Admin**: Dashboard stats, full User Management (CRUD), class scheduling, settings.
- **Teacher**: Take class attendance, create assignments, grade submissions, send announcements.
- **Student**: View active upcoming assignments, submit work, view grades, track attendance.
- **Parent**: Multi-child view to track their children's grades, active class attendance, and message teachers directly.

## Running the Application
Ensure you have `Node.js` installed and MongoDB running (cloud or local).

### Backend
1. `cd backend`
2. Configure `.env` file (see `.env.example` if available, or structure inside `src/config/env.ts`)
3. `npm install`
4. `npm run dev`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

### Seed Default Database
If you need default accounts: `cd backend` then `npm run seed`. Default seed login applies:
- Example: `admin@school.com`
- Password: `Admin@123456`

## Built With
- React & Vite
- Tailwind CSS
- Node.js & Express
- MongoDB
- JWT Authentication

## Production Deployment
The backend has a built-in node-cron script that natively pings the health endpoint (`/api/health`) every 9 minutes to prevent idle environments from spinning down (useful for free-tier deployments like Render).
