# TaskFlow — Full Stack Project Manager

A modern, full-stack project and task management system built with **Go**, **PostgreSQL**, and **React + Vite**. It lets users register, log in, create projects, assign tasks to team members, and track progress across statuses.

---

## 🌟 Key Features

* **Secure Authentication:** JWT-based user registration and login.
* **Project Management:** Create workspaces, assign project owners, view stats, and manage task lifecycle.
* **Task Tracking:** Create tasks with granular status (`To Do`, `In Progress`, `Done`) and priority parameters. Assign tasks seamlessly to available members.
* **Sprint Planner:** A kanban-style board visualizing tasks.
* **Modern UI:** Built with React 19, featuring a responsive, dynamic layout with an integrated Light/Dark mode.
* **Containerized Deployment:** Start both the frontend and backend instantly using Docker.

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| **Backend** | Go 1.24, standard library `net/http`, GORM, Goose (DB Migrations) |
| **Database** | PostgreSQL 16 |
| **Frontend** | React 19, Vite, React Router v7, Axios, Lucide React (Icons) |
| **Infra** | Docker, Docker Compose, nginx |

---

## 🚀 Getting Started

The only prerequisite is **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**.

### 1. Clone & Configure
```bash
git clone https://github.com/Bansalshivam0/taskflow-shivam.git
cd taskflow-shivam

# Apply default environment configurations
cp .env.example .env
```

### 2. Launch Services
Run the following command to build the containers and launch the database, API, and frontend:
```bash
docker compose up --build
```

### 3. Access the Application
Once the containers are healthy:
* **Frontend UI:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://api:8081](http://api:8081)

---

## 📖 Usage Guide

1. **Sign Up:** Navigate to the browser at `http://localhost:3000`. Click **Register** to create your first user account. The database starts fresh, so you are in complete control.
2. **Setup Projects:** Use the sidebar's "**+ Create project**" button to provision a new workspace. Make sure to assign a **Project Owner** from the dropdown menu.
3. **Manage Tasks:** Inside your newly created project, click **Create Task**. Assign the tasks to yourself or other registered users, and track their lifecycles.
4. **Sprint Planning:** Use the **Sprint Planner** tab to view your active tasks.

---

## 📡 API Reference

All endpoints (except auth) require an `Authorization: Bearer <token>` header.

### Authentication
* `POST /auth/register` — Register a new user (`{ name, email, password }`)
* `POST /auth/login` — Login to receive a JWT (`{ email, password }`)
* `GET /users` — Retrieve a list of all users.

### Projects
* `GET /projects` — List projects associated with the logged-in user. Supports `?page=1&limit=20`
* `POST /projects` — Create a project (`{ name, description, owner_id }`)
* `GET /projects/:id` — Retrieve a project and its tasks
* `PATCH /projects/:id` — Update project metadata
* `DELETE /projects/:id` — Delete a project
* `GET /projects/:id/stats` — Retrieve task statistics by status and assignee

### Tasks
* `GET /projects/:id/tasks` — List tasks with filters (`?status=todo&page=1&limit=20`)
* `POST /projects/:id/tasks` — Create a task (`{ title, description, status, priority, assignee_id }`)
* `GET /tasks/:id` — Retrieve a specific task
* `PATCH /tasks/:id` — Update a task
* `DELETE /tasks/:id` — Delete a task
* `GET /tasks/assigned` — View tasks assigned directly to you
* `GET /sprint-planner` — Fetch aggregated cross-project sprint data

---

## 📂 Project Structure

```text
.
├── .env.example
├── docker-compose.yml
├── backend/
│   ├── Dockerfile              # Multi-stage: Go builder + alpine runtime
│   ├── cmd/main.go             # Entrypoint — DI wiring, HTTP server
│   ├── config/                 # Env-based configuration
│   ├── internal/
│   │   ├── auth/               # JWT generation and validation
│   │   ├── database/           # DB connection + Goose migration runner
│   │   ├── handlers/           # HTTP handlers
│   │   ├── middleware/         # Auth verification middleware
│   │   ├── migrations/         # SQL files (embedded automatically via go:embed)
│   │   ├── models/             # GORM models + DTOs
│   │   ├── repos/              # Data access layer
│   │   ├── request/            # Pagination helpers
│   │   ├── response/           # JSON response formatters
│   │   ├── services/           # Business logic layer
│   │   └── tests/              # Controller Integration tests
└── frontend/
    ├── Dockerfile              # Multi-stage: node build + nginx serve
    ├── nginx.conf              # SPA fallback + /api proxy
    └── src/
        ├── components/         # DashboardLayout, Sidebar, TaskModal
        ├── context/            # AuthContext (JWT + User State management)
        ├── pages/              # Flow pages: Login, Register, Dashboard, Project, Sprint Planner
        └── services/api.js     # Axios instance & Auth Interceptors
```
