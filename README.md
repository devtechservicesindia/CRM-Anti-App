# 🎮 GameZone CRM — Gaming Parlour Management Platform

A premium, full-stack CRM system for managing gaming parlours. Built with a modern esports-dashboard aesthetic.

---

## ⚡ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| State | Zustand |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Auth | JWT (access + refresh tokens via httpOnly cookies) |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **PostgreSQL** installed & running

### 1. Configure Database

Update the PostgreSQL connection in **two places**:

**`/.env`** (root level — used by Prisma CLI):
```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/gaming_crm"
```

**`/server/.env`** (used by the Express server):
```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/gaming_crm"
JWT_SECRET="gaming-crm-super-secret-jwt-key-2024"
JWT_REFRESH_SECRET="gaming-crm-refresh-secret-key-2024"
PORT=5000
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

### 2. Install Dependencies

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd client
npm install
```

### 3. Run Database Migration & Seed

From the **root** directory:
```bash
# Generate Prisma client
npx prisma generate

# Create all database tables
npx prisma migrate dev --name init

# Seed with sample data (30 days of history)
cd server
npm run db:seed
```

### 4. Start Dev Servers

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# → http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# → http://localhost:5173
```

---

## 🔑 Demo Login Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@gameparlour.com | admin123 |
| **Staff** | staff@gameparlour.com | staff123 |
| **Customer** | arjun@example.com | customer123 |

---

## 📁 Project Structure

```
CRM-Anti-App/
├── .env                    ← Root .env (Prisma CLI)
├── prisma.config.ts        ← Prisma 7 configuration
├── prisma/
│   ├── schema.prisma       ← Database schema
│   └── seed.ts             ← Sample data seed
│
├── server/                 ← Express backend
│   ├── .env                ← Server .env
│   └── src/
│       ├── controllers/    ← Route handlers
│       ├── middleware/     ← Auth, error handling
│       ├── routes/         ← Express routers
│       ├── lib/            ← Prisma client
│       └── utils/          ← JWT helpers
│
└── client/                 ← React frontend
    └── src/
        ├── components/
        │   └── layout/     ← Sidebar, Topbar, AppLayout
        ├── pages/          ← All 10 app pages
        ├── store/          ← Zustand stores (auth, ui)
        ├── lib/            ← API client, utilities
        └── types/          ← Shared TypeScript interfaces
```

---

## 🖥️ Pages

| Route | Page | Roles |
|-------|------|-------|
| `/login` | Login / Register | Public |
| `/` | Dashboard | All |
| `/customers` | Customer Management | Admin, Staff |
| `/stations` | Station Management | Admin, Staff |
| `/bookings` | Booking Management | All |
| `/payments` | Payment Records | Admin, Staff |
| `/games` | Game Library | All |
| `/reports` | Analytics & Reports | Admin |
| `/profile` | User Profile | All |
| `/settings` | System Settings | Admin |

---

## 🗄️ API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, get JWT |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/users` | List users (Admin/Staff) |
| GET | `/api/stations` | List all stations |
| POST | `/api/bookings` | Create booking |
| PATCH | `/api/bookings/:id/end` | End session |
| GET | `/api/dashboard/stats` | KPI metrics |
| GET | `/api/dashboard/revenue` | Revenue chart data |

---

## 🎨 Design System

- **Backgrounds**: `#0a0a0f` (primary), `#0f0f1a` (secondary)
- **Primary**: Neon Purple `#7c3aed`
- **Accent**: Electric Blue `#2563eb`
- **Cards**: Glassmorphism with `backdrop-filter: blur(16px)`
- **Fonts**: Inter (body), Rajdhani (headings)
- **Animations**: Slide-in, pulse glow, live timers
