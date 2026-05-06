# ⚡ TaskFlow Pro

> A modern, full-stack task management application with role-based access control, real-time overdue detection, interactive calendar, and a stunning dark glassmorphism UI.

🔗 **Live Demo**: [https://taskflow-pro-production.up.railway.app](https://taskflow-pro-production.up.railway.app)

---

## ✨ Features

### Core
- 🔐 **JWT Authentication** — Secure login/register with token persistence
- 👤 **Role-Based Access** — Admin, Manager & Member roles with scoped permissions
- 📁 **Project Management** — Create, edit, delete projects with member assignment
- ✅ **Task CRUD** — Full task lifecycle with status, priority, due dates, and multi-user assignment
- ⏰ **Overdue Detection** — Backend + frontend red glow highlighting for overdue tasks

### Dashboard & Analytics
- 📊 **Dashboard Stats** — At-a-glance cards for total, in-progress, completed, overdue, to-do, and urgent tasks
- 📈 **Waterfall Chart** — Interactive task breakdown by status or by project with animated bars
- 💡 **Rich Hover Tooltips** — Hover on any chart bar to see task details (title, priority, status, assignee, due date, project)
- 👥 **Team / My Tasks Toggle** — Switch between team-wide and personal task views on the dashboard

### Calendar
- 📅 **Calendar Page** — Full monthly calendar with project timeline and task schedule views
- 🔀 **Projects / Tasks Mode** — Toggle between project timelines (color-coded bars) and task due dates (status chips)
- 🗓️ **Month Navigation** — Navigate months with today marker and jump-to-today button
- 📋 **Summary Cards** — Project duration, completion progress, and weekly task counts below the calendar

### Team & Management
- 👥 **Team Management** — Create teams with managers and members
- 🔄 **Role Switching** — Admin can toggle user roles
- 🗑️ **Task History** — Archived deleted tasks with deletion audit trail
- 🔍 **Search & Filter** — Filter tasks by status, priority, project; full-text search

### UI/UX
- 🎨 **Dark Glassmorphism UI** — Premium design with gradients, blur, and micro-animations
- 🌗 **Light/Dark Theme** — Toggle between themes
- 📱 **Fully Responsive** — Mobile-first design with collapsible navbar
- 🔔 **Update Indicators** — Green dots on nav tabs when new content is available
- 🚀 **One-Click Deploy** — Railway-ready with `railway.toml`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, React Router v6 |
| **Styling** | Vanilla CSS (dark glassmorphism design system) |
| **HTTP Client** | Axios (JWT interceptors) |
| **Notifications** | react-hot-toast |
| **Icons** | react-icons (Material Design) |
| **Backend** | Node.js, Express |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT + bcryptjs |
| **Deployment** | Railway (monorepo) |

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone and install

```bash
git clone https://github.com/Rogue-56/taskflow-pro.git
cd taskflow-pro
npm run install
```

### 2. Configure environment

Create `server/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/taskflow
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=5000
NODE_ENV=development
```

### 3. Seed the database

```bash
npm run seed
```

### 4. Start development servers

Terminal 1 — Backend:
```bash
npm run dev:server
```

Terminal 2 — Frontend:
```bash
npm run dev:client
```

Frontend runs on `http://localhost:3000`, API on `http://localhost:5000`.

---

## 🔑 Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGODB_URI` | ✅ | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | ✅ | Secret for JWT signing | `my-secret-key` |
| `PORT` | ❌ | Server port (default: 5000) | `5000` |
| `NODE_ENV` | ❌ | Environment mode | `production` |
| `VITE_API_URL` | ❌ | API URL for frontend (empty in prod) | `` |

---

## 📡 API Endpoints

### Authentication
| Method | Path | Protected | Description |
|--------|------|:---------:|-------------|
| `POST` | `/api/auth/register` | ❌ | Register new user |
| `POST` | `/api/auth/login` | ❌ | Login, returns JWT |
| `GET` | `/api/auth/me` | ✅ | Get current user profile |

### Users
| Method | Path | Protected | Role | Description |
|--------|------|:---------:|------|-------------|
| `GET` | `/api/users` | ✅ | Admin/Manager | List all users |
| `GET` | `/api/users/:id` | ✅ | Any | Get user by ID |
| `PUT` | `/api/users/:id/role` | ✅ | Admin | Update user role |
| `DELETE` | `/api/users/:id` | ✅ | Admin | Delete user |

### Projects
| Method | Path | Protected | Role | Description |
|--------|------|:---------:|------|-------------|
| `GET` | `/api/projects` | ✅ | Any | List projects (scoped) |
| `POST` | `/api/projects` | ✅ | Admin/Manager | Create project |
| `GET` | `/api/projects/:id` | ✅ | Any | Get project + tasks |
| `PUT` | `/api/projects/:id` | ✅ | Admin/Manager | Update project |
| `DELETE` | `/api/projects/:id` | ✅ | Admin/Manager | Delete project + tasks |

### Tasks
| Method | Path | Protected | Role | Description |
|--------|------|:---------:|------|-------------|
| `GET` | `/api/tasks` | ✅ | Any | List tasks (scoped, `?mine=true` for personal) |
| `GET` | `/api/tasks/stats` | ✅ | Any | Dashboard statistics |
| `GET` | `/api/tasks/stats/projects` | ✅ | Any | Per-project task breakdown |
| `POST` | `/api/tasks` | ✅ | Admin/Manager | Create task |
| `GET` | `/api/tasks/:id` | ✅ | Any | Get single task |
| `PUT` | `/api/tasks/:id` | ✅ | Any | Update task (member=status only) |
| `DELETE` | `/api/tasks/:id` | ✅ | Admin/Manager | Delete task (archived to history) |
| `GET` | `/api/tasks/history` | ✅ | Admin/Manager | Deleted tasks audit log |

### Teams
| Method | Path | Protected | Role | Description |
|--------|------|:---------:|------|-------------|
| `GET` | `/api/teams` | ✅ | Any | List teams |
| `POST` | `/api/teams` | ✅ | Admin | Create team |
| `PUT` | `/api/teams/:id` | ✅ | Admin | Update team |
| `DELETE` | `/api/teams/:id` | ✅ | Admin | Delete team |

---

## 🗄️ Database Schema

### User
```
name       String    Required, max 50 chars
email      String    Unique, required
password   String    Hashed (bcrypt), min 6 chars
role       String    'admin' | 'manager' | 'member' (default)
avatar     String    Auto-generated color
```

### Project
```
name        String      Required, max 100 chars
description String      Optional, max 500 chars
status      String      'active' | 'completed' | 'archived'
members     [ObjectId]  References User
createdBy   ObjectId    References User
```

### Task
```
title       String      Required, max 200 chars
description String      Optional, max 1000 chars
status      String      'todo' | 'in-progress' | 'done'
priority    String      'low' | 'medium' | 'high' | 'urgent'
dueDate     Date        For overdue detection
assignedTo  [ObjectId]  References User (multi-assign)
project     ObjectId    References Project (required)
createdBy   ObjectId    References User
isOverdue   Virtual     true if past due & not done
```

### Team
```
name        String      Required
description String      Optional
manager     ObjectId    References User
members     [ObjectId]  References User
createdBy   ObjectId    References User
```

---

## 🚂 Railway Deployment

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) and sign in with GitHub
3. Click **"New Project"** → **"Deploy from GitHub Repo"**
4. Select your `taskflow-pro` repository
5. Set these **environment variables** in the Railway dashboard:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — any strong random string
   - `NODE_ENV` — `production`
6. Railway auto-detects `railway.toml` and deploys
7. After deploy, open the Railway shell and run: `cd server && node seed.js`
8. Click **"Generate Domain"** to get your live URL

---

## 🧪 Test Credentials

After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@taskflow.com` | `admin123` |
| **Manager** | `sarah@taskflow.com` | `manager123` |
| **Manager** | `mike@taskflow.com` | `manager123` |
| **Member** | `john@taskflow.com` | `member123` |
| **Member** | `jane@taskflow.com` | `member123` |
| **Member** | `alex@taskflow.com` | `member123` |
| **Member** | `priya@taskflow.com` | `member123` |

Seed data includes 3 projects, 2 teams, 7 users, and 8+ tasks with varied statuses/priorities/due dates.

---

## 📸 Screenshots

### Dashboard
- Stats cards with task overview
- Interactive waterfall chart with hover tooltips
- Team/Personal toggle for scoped views

### Calendar
- Monthly project timeline view
- Task schedule with status-colored chips
- Summary cards with progress tracking

### Task Management
- Full CRUD with inline status updates
- Priority badges and overdue highlighting
- Search, filter, and sort capabilities

---

## 🎥 Demo Video

> [Add your 2-5 min demo video link here]

---

## 👤 Author

Built by **Rogue-56**

---

## 📄 License

MIT
