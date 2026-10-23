# MERN Task Manager

A simple, reliable, and production-minded Task Manager application built with the MERN stack. Designed with clean code boundaries, centralized error handling, JWT user authentication with password hashing, and deployment readiness for AWS (Amazon EC2, Amazon S3, and CloudFront).

---

## 1. Tech Stack

- **Frontend:** React 18, Vite, JavaScript, Plain CSS
- **Backend:** Node.js (v20+ / v22+), Express.js, REST API, Helmet, CORS
- **Authentication:** JSON Web Tokens (JWT) + `bcryptjs` password hashing
- **Database:** MongoDB & Mongoose ODM
- **Environment Management:** `dotenv`
- **Testing:** Jest & Supertest

---

## 2. Project Structure

```text
task-manager/
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth.js            # User registration & login API calls
│   │   │   └── tasks.js           # Task API calls with automatic Bearer token interceptor
│   │   ├── components/
│   │   │   ├── AuthForm.jsx       # Login & Sign Up toggle form with validation
│   │   │   ├── TaskForm.jsx       # Controlled task input form
│   │   │   ├── TaskList.jsx       # List renderer with empty & loading states
│   │   │   └── TaskItem.jsx       # Inline edit form, status checkbox, delete action
│   │   ├── App.jsx                # Single-page layout, user session & filter state
│   │   ├── index.css              # Minimalist neutral plain CSS design
│   │   └── main.jsx               # React entry point
│   ├── .env                       # VITE_API_BASE_URL=http://localhost:3000/api
│   ├── .env.example
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # Mongoose connection & lifecycle handlers
│   │   ├── controllers/
│   │   │   ├── authController.js  # User register, login, profile logic
│   │   │   └── taskController.js  # User-scoped CRUD controllers with ownership checks
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js  # JWT Bearer token protection middleware
│   │   │   └── errorHandler.js    # Centralized error normalizer and handler
│   │   ├── models/
│   │   │   ├── User.js            # User schema with bcrypt pre-save hook
│   │   │   └── Task.js            # Task schema with user reference & compound index
│   │   ├── routes/
│   │   │   ├── authRoutes.js      # Auth REST route mappings
│   │   │   ├── health.routes.js   # API diagnostic / healthcheck endpoint
│   │   │   └── taskRoutes.js      # Protected task route mappings
│   │   ├── utils/
│   │   │   └── generateToken.js   # JWT signing helper
│   │   ├── app.js                 # Express app (Helmet, CORS, body parsers)
│   │   └── server.js              # Port binding, MongoDB boot, graceful shutdown
│   ├── tests/
│   │   ├── auth.test.js           # Registration, login, and JWT validation tests
│   │   ├── health.test.js         # Healthcheck and 404 tests
│   │   └── tasks.test.js          # Authenticated CRUD & ownership isolation tests
│   ├── .env                       # PORT=3000, MONGODB_URI=mongodb://127.0.0.1:27017/task_manager
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json                   # Monorepo script orchestrator
└── README.md
```

---

## 3. Local Development Setup

### Prerequisites
- **Node.js:** v20.0.0 or higher (Tested on Node.js v22.12.0)
- **MongoDB:** Local MongoDB instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

### Configuration
1. **Server Environment (`server/.env`):**
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/task_manager
   JWT_SECRET=super_secret_jwt_key_task_manager_dev_2026_jeet
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   ```

2. **Client Environment (`client/.env`):**
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

---

## 4. Running the Application

### Option A: Simultaneous Development (Recommended)
Run both frontend and backend concurrently from the root directory:
```powershell
npm run dev
```

### Option B: Separate Terminals

**Terminal 1 — Backend API (Port 3000):**
```powershell
npm run dev:server
```

**Terminal 2 — Frontend Client (Port 5173):**
```powershell
npm run dev:client
```

Open your browser at: **[http://localhost:5173](http://localhost:5173)**

---

## 5. REST API Documentation

Base URL: `http://localhost:3000/api`

### Authentication Endpoints

| Method | Endpoint | Description | Request Body | Response Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register new user & return JWT | `{ name, email, password }` | `201 Created` |
| `POST` | `/auth/login` | Login user & return JWT | `{ email, password }` | `200 OK` |
| `GET` | `/auth/me` | Get authenticated profile | None (Requires `Bearer <token>`) | `200 OK` |

### Task Endpoints (Protected by Bearer Token)

| Method | Endpoint | Description | Request Body | Response Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Healthcheck & system diagnostics | None | `200 OK` |
| `GET` | `/tasks` | Get user's tasks (optional `?status=pending` or `completed`) | None | `200 OK` |
| `POST` | `/tasks` | Create task owned by current user | `{ title: string, description?: string }` | `201 Created` |
| `PATCH` | `/tasks/:id` | Update task with ownership check | `{ title?, description?, status? }` | `200 OK` |
| `DELETE` | `/tasks/:id` | Delete task with ownership check | None | `200 OK` |

---

## 6. Automated Testing

Run the automated backend test suites (Jest + Supertest):
```powershell
npm run test:server
```

Validates (17 automated tests):
- User registration with validation & duplicate email rejection
- Password hashing and password comparison
- JWT token generation & Bearer verification
- Task creation with valid & invalid inputs
- User-scoped task queries (User B cannot see User A's tasks)
- Task ownership authorization (User B cannot update or delete User A's task - `403 Forbidden`)
- Health check diagnostics & 404 handler
- Helmet security headers

---

## 7. Production Build & AWS Deployment Readiness

### Frontend Static Build (for Amazon S3 + CloudFront)
```powershell
npm run build:client
```
Generates production-optimized static assets in `client/dist/` with sub-second compilation.

### Backend Production Execution (for Amazon EC2)
```powershell
npm --prefix server start
```
- Decoupled from `localhost` hardcoding. Reads `CLIENT_URL` for CORS and `PORT` from environment variables.
- Catches termination signals (`SIGTERM`, `SIGINT`) to perform clean database disconnects and graceful HTTP connection draining.
