# ⚡ TaskFlow Pro

> A modern, full-stack task management application with role-based access control, real-time overdue detection, and a stunning dark glassmorphism UI.

🔗 **Live Demo**: [Your Railway URL here]

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure login/register with token persistence
- 👤 **Role-Based Access** — Admin & Member roles with scoped permissions
- 📁 **Project Management** — Create, edit, delete projects with member assignment
- ✅ **Task CRUD** — Full task lifecycle with status, priority, due dates, and assignment
- ⏰ **Overdue Detection** — Backend + frontend red glow highlighting for overdue tasks
- 📊 **Dashboard Analytics** — At-a-glance stats for total, in-progress, completed, and overdue tasks
- 🔍 **Search & Filter** — Filter tasks by status, priority, project; full-text search
- 👥 **Team Management** — Admin can toggle roles and remove users
- 📱 **Fully Responsive** — Mobile-first design with collapsible navbar
- 🎨 **Dark Glassmorphism UI** — Premium design with gradients, blur, and micro-animations
- 🚀 **One-Click Deploy** — Railway-ready with `railway.toml`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, React Router v6 |
| **Styling** | Vanilla CSS (dark glassmorphism) |
| **HTTP Client** | Axios (JWT interceptors) |
| **Notifications** | react-hot-toast |
| **Icons** | react-icons |
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
git clone <your-repo-url>
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

| Method | Path | Protected | Role | Description |
|--------|------|:---------:|------|-------------|
| `POST` | `/api/auth/register` | ❌ | — | Register new user |
| `POST` | `/api/auth/login` | ❌ | — | Login, returns JWT |
| `GET` | `/api/auth/me` | ✅ | Any | Get current user profile |
| `GET` | `/api/users` | ✅ | Admin | List all users |
| `GET` | `/api/users/:id` | ✅ | Any | Get user by ID |
| `PUT` | `/api/users/:id/role` | ✅ | Admin | Update user role |
| `DELETE` | `/api/users/:id` | ✅ | Admin | Delete user |
| `GET` | `/api/projects` | ✅ | Any | List projects (scoped) |
| `POST` | `/api/projects` | ✅ | Admin | Create project |
| `GET` | `/api/projects/:id` | ✅ | Any | Get project + tasks |
| `PUT` | `/api/projects/:id` | ✅ | Admin | Update project |
| `DELETE` | `/api/projects/:id` | ✅ | Admin | Delete project + tasks |
| `GET` | `/api/tasks` | ✅ | Any | List tasks (scoped) |
| `GET` | `/api/tasks/stats` | ✅ | Any | Dashboard statistics |
| `POST` | `/api/tasks` | ✅ | Admin | Create task |
| `GET` | `/api/tasks/:id` | ✅ | Any | Get single task |
| `PUT` | `/api/tasks/:id` | ✅ | Any | Update task (member=status only) |
| `DELETE` | `/api/tasks/:id` | ✅ | Admin | Delete task |
| `GET` | `/api/health` | ❌ | — | Health check |

---

## 🗄️ Database Schema

### User
```
name       String    Required, max 50 chars
email      String    Unique, required
password   String    Hashed (bcrypt), min 6 chars
role       String    'admin' | 'member' (default)
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
assignedTo  ObjectId    References User
project     ObjectId    References Project (required)
createdBy   ObjectId    References User
isOverdue   Virtual     true if past due & not done
```

---

## 🚂 Railway Deployment

1. Push your code to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Add a **MongoDB** plugin (or use MongoDB Atlas)
4. Connect your GitHub repo
5. Set environment variables:
   - `MONGODB_URI` — from MongoDB plugin or Atlas
   - `JWT_SECRET` — any strong random string
   - `NODE_ENV` — `production`
   - `VITE_API_URL` — leave empty (uses relative URLs)
6. Deploy — Railway reads `railway.toml` automatically
7. Run seed (Railway shell): `cd server && node seed.js`

---

## 🧪 Test Credentials

After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@taskflow.com` | `admin123` |
| **Member** | `john@taskflow.com` | `member123` |
| **Member** | `jane@taskflow.com` | `member123` |

Seed data includes 3 projects, 12 tasks with varied statuses/priorities, and intentionally overdue tasks for testing.

---

## 🎥 Demo Video

> [Add your demo video/GIF here]

---

## 👤 Author

Built with ❤️ by **[Your Name]**

---

## 📄 License

MIT
