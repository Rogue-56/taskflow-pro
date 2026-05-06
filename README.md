# TaskFlow Pro — Full-Stack Team Task Manager

A modern, full-stack task management web application with role-based access control (Admin/Manager/Member), project and team management, task assignment and tracking, an interactive dashboard with analytics, and a calendar view — built with React, Node.js, Express, and MongoDB.

**Live URL:** [https://taskflow-pro-production-0ad8.up.railway.app](https://taskflow-pro-production-0ad8.up.railway.app)

**GitHub Repo:** [https://github.com/Rogue-56/taskflow-pro](https://github.com/Rogue-56/taskflow-pro)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Local Setup](#local-setup)
- [Deployment](#deployment)
- [Test Credentials](#test-credentials)
- [Screenshots](#screenshots)
- [Demo Video](#demo-video)
- [Author](#author)

---

## Features

### Authentication
- Secure signup and login with JWT token-based authentication
- Password hashing using bcrypt
- Persistent sessions with token storage
- Auto-redirect and 401 handling via Axios interceptors

### Role-Based Access Control
- **Admin** — Full access: create/edit/delete projects, tasks, teams, and manage users
- **Manager** — Can create/edit projects and tasks, manage team assignments
- **Member** — Can view assigned tasks, update task status, and see team-wide data

### Project and Team Management
- Create, edit, and delete projects with member assignment
- Team creation with designated managers and team members
- Scoped visibility: members see their team's data, admins see everything

### Task Creation, Assignment, and Status Tracking
- Full CRUD operations for tasks with title, description, status, priority, and due date
- Multi-user task assignment
- Status tracking: To Do, In Progress, Done
- Priority levels: Low, Medium, High, Urgent
- Real-time overdue detection with visual indicators
- Task history and audit trail for deleted tasks

### Dashboard (Tasks, Status, Overdue)
- Summary statistics: total tasks, in-progress, completed, overdue, to-do, urgent
- Interactive waterfall chart with two view modes (By Status / By Project)
- Rich hover tooltips showing task details (title, assignee, priority, due date, project)
- Team / My Tasks toggle for switching between team-wide and personal views
- Recent tasks list with inline status updates

### Calendar View
- Full monthly calendar with project timeline and task schedule views
- Toggle between Projects mode (color-coded timeline bars) and Tasks mode (status-colored chips)
- Month navigation with today marker
- Summary cards showing project duration, completion progress, and upcoming deadlines

### Additional Features
- Light and dark theme toggle
- Fully responsive design (mobile, tablet, desktop)
- Search, filter, and sort across tasks
- Update notification indicators on navigation tabs

---

## Tech Stack

| Layer        | Technology                              |
|--------------|----------------------------------------|
| Frontend     | React 18, Vite, React Router v6        |
| Styling      | Vanilla CSS (custom design system)      |
| HTTP Client  | Axios with JWT interceptors             |
| Notifications| react-hot-toast                         |
| Icons        | react-icons (Material Design)           |
| Backend      | Node.js, Express                        |
| Database     | MongoDB with Mongoose ODM               |
| Authentication| JSON Web Tokens (JWT) + bcryptjs       |
| Deployment   | Railway (monorepo setup)                |

---

## Architecture

```
taskflow-pro/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── api/               # Axios instance with interceptors
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── WaterfallChart.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── ...
│   │   ├── context/           # Auth and Theme context providers
│   │   ├── pages/             # Route-level page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── Calendar.jsx
│   │   │   ├── Team.jsx
│   │   │   └── ...
│   │   ├── index.css          # Design system and all styles
│   │   └── main.jsx           # App entry point
│   └── index.html
├── server/                    # Express backend
│   ├── config/                # Database connection
│   ├── middleware/            # Auth and error handling middleware
│   ├── models/                # Mongoose schemas
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   ├── Team.js
│   │   └── DeletedTask.js
│   ├── routes/                # REST API route handlers
│   │   ├── auth.js
│   │   ├── tasks.js
│   │   ├── projects.js
│   │   ├── teams.js
│   │   └── users.js
│   ├── seed.js                # Database seeder
│   └── index.js               # Server entry point
├── railway.toml               # Railway deployment config
├── package.json               # Root scripts
└── README.md
```

---

## API Endpoints

### Authentication

| Method | Path                | Auth | Description               |
|--------|---------------------|:----:|---------------------------|
| POST   | /api/auth/register  | No   | Register a new user       |
| POST   | /api/auth/login     | No   | Login and receive JWT      |
| GET    | /api/auth/me        | Yes  | Get current user profile   |

### Users

| Method | Path                  | Auth | Role          | Description         |
|--------|----------------------|:----:|---------------|---------------------|
| GET    | /api/users           | Yes  | Admin/Manager | List all users      |
| GET    | /api/users/:id       | Yes  | Any           | Get user by ID      |
| PUT    | /api/users/:id/role  | Yes  | Admin         | Update user role    |
| DELETE | /api/users/:id       | Yes  | Admin         | Delete user         |

### Projects

| Method | Path                | Auth | Role          | Description              |
|--------|---------------------|:----:|---------------|--------------------------|
| GET    | /api/projects       | Yes  | Any           | List projects (scoped)   |
| POST   | /api/projects       | Yes  | Admin/Manager | Create project           |
| GET    | /api/projects/:id   | Yes  | Any           | Get project with tasks   |
| PUT    | /api/projects/:id   | Yes  | Admin/Manager | Update project           |
| DELETE | /api/projects/:id   | Yes  | Admin/Manager | Delete project and tasks |

### Tasks

| Method | Path                      | Auth | Role          | Description                          |
|--------|--------------------------|:----:|---------------|--------------------------------------|
| GET    | /api/tasks               | Yes  | Any           | List tasks (supports ?mine=true)     |
| GET    | /api/tasks/stats         | Yes  | Any           | Dashboard statistics                 |
| GET    | /api/tasks/stats/projects| Yes  | Any           | Per-project task breakdown           |
| POST   | /api/tasks               | Yes  | Admin/Manager | Create task                          |
| GET    | /api/tasks/:id           | Yes  | Any           | Get single task                      |
| PUT    | /api/tasks/:id           | Yes  | Any           | Update task (members: status only)   |
| DELETE | /api/tasks/:id           | Yes  | Admin/Manager | Delete task (archived to history)    |
| GET    | /api/tasks/history       | Yes  | Admin/Manager | Deleted tasks audit log              |

### Teams

| Method | Path             | Auth | Role  | Description  |
|--------|-----------------|:----:|-------|--------------|
| GET    | /api/teams      | Yes  | Any   | List teams   |
| POST   | /api/teams      | Yes  | Admin | Create team  |
| PUT    | /api/teams/:id  | Yes  | Admin | Update team  |
| DELETE | /api/teams/:id  | Yes  | Admin | Delete team  |

---

## Database Schema

### User
| Field    | Type   | Details                                  |
|----------|--------|------------------------------------------|
| name     | String | Required, max 50 characters              |
| email    | String | Required, unique                         |
| password | String | Hashed with bcrypt, min 6 characters     |
| role     | String | Enum: admin, manager, member (default)   |
| avatar   | String | Auto-generated color code                |

### Project
| Field       | Type       | Details                                |
|-------------|------------|----------------------------------------|
| name        | String     | Required, max 100 characters           |
| description | String     | Optional, max 500 characters           |
| status      | String     | Enum: active, completed, archived      |
| members     | [ObjectId] | References User                        |
| createdBy   | ObjectId   | References User                        |

### Task
| Field       | Type       | Details                                |
|-------------|------------|----------------------------------------|
| title       | String     | Required, max 200 characters           |
| description | String     | Optional, max 1000 characters          |
| status      | String     | Enum: todo, in-progress, done          |
| priority    | String     | Enum: low, medium, high, urgent        |
| dueDate     | Date       | Used for overdue detection             |
| assignedTo  | [ObjectId] | References User (multi-assign)         |
| project     | ObjectId   | References Project (required)          |
| createdBy   | ObjectId   | References User                        |
| isOverdue   | Virtual    | true if past due and status != done    |

### Team
| Field       | Type       | Details                                |
|-------------|------------|----------------------------------------|
| name        | String     | Required                               |
| description | String     | Optional                               |
| manager     | ObjectId   | References User                        |
| members     | [ObjectId] | References User                        |
| createdBy   | ObjectId   | References User                        |

---

## Local Setup

### Prerequisites
- Node.js 18 or higher
- MongoDB Atlas account (or local MongoDB instance)

### 1. Clone and install dependencies

```bash
git clone https://github.com/Rogue-56/taskflow-pro.git
cd taskflow-pro
npm run install
```

### 2. Configure environment variables

Create `server/.env`:

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/taskflow
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=development
```

### 3. Seed the database

```bash
npm run seed
```

### 4. Start development servers

Backend (Terminal 1):
```bash
npm run dev:server
```

Frontend (Terminal 2):
```bash
npm run dev:client
```

The frontend runs on http://localhost:3000 and the API on http://localhost:5000.

---

## Deployment

This application is deployed on **Railway** using a monorepo setup.

**Live URL:** [https://taskflow-pro-production-0ad8.up.railway.app](https://taskflow-pro-production-0ad8.up.railway.app)

### Deployment Steps

1. Push code to GitHub
2. Create a new project on [Railway](https://railway.app) and connect the GitHub repository
3. Set environment variables in the Railway dashboard:
   - `MONGODB_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — Secret key for JWT signing
   - `NODE_ENV` — Set to `production`
4. Railway auto-detects the `railway.toml` configuration and deploys
5. Generate a public domain under Settings > Networking
6. Seed the database via the Railway shell: `cd server && node seed.js`

### Railway Configuration (railway.toml)

```toml
[build]
builder = "NIXPACKS"

[build.nixpacks]
buildCmd = "npm run install && npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

---

## Test Credentials

After running the seed script:

| Role    | Email               | Password    |
|---------|---------------------|-------------|
| Admin   | admin@taskflow.com  | admin123    |
| Manager | sarah@taskflow.com  | manager123  |
| Manager | mike@taskflow.com   | manager123  |
| Member  | john@taskflow.com   | member123   |
| Member  | jane@taskflow.com   | member123   |
| Member  | alex@taskflow.com   | member123   |
| Member  | priya@taskflow.com  | member123   |

The seed data includes 3 projects, 2 teams, 7 users, and 8+ tasks with varied statuses, priorities, and due dates.

---

## Screenshots

### Dashboard
- Summary statistics with task counts across all statuses
- Interactive waterfall chart with hover tooltips
- Team/Personal toggle for scoped data views

### Calendar
- Monthly calendar with project timeline view
- Task schedule view with status-colored indicators
- Project summary cards with progress tracking

### Task Management
- Full CRUD interface with inline status updates
- Priority badges and overdue highlighting
- Filtering by status, priority, and project

---

## Demo Video

[Add demo video link here]

---

## Environment Variables

| Variable    | Required | Description                        |
|-------------|----------|------------------------------------|
| MONGODB_URI | Yes      | MongoDB connection string          |
| JWT_SECRET  | Yes      | Secret for JWT token signing       |
| PORT        | No       | Server port (default: 5000)        |
| NODE_ENV    | No       | Environment mode (production/dev)  |

---

## Author

**Abhinav Dhiman** — [GitHub: Rogue-56](https://github.com/Rogue-56)

---

## License

MIT
