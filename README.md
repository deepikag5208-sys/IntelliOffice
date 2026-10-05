# 🏢 IntelliOffice (OfficeGen AI) — Intelligent Enterprise Management System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build_Tool-Vite_5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/AI_Engine-Gemini_Pro-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)

**IntelliOffice** is an AI-powered, full-stack Enterprise Office Management System featuring a futuristic glassmorphic UI, real-time workspace analytics, automated workflow trackers, role-based security, and an intelligent **Natural Language AI Assistant** with retrieval-augmented database context (RAG).

---

## 🌟 Key Features

### 📊 Executive Workspace & Dashboard
- **Real-Time KPI Cards**: Live telemetry tracking Total Staff, Daily Attendance %, Pending Leaves, Active Tasks, Upcoming Meetings, and Broadcasts.
- **Interactive Analytics**: Attendance bar charts and task distribution donut charts powered by `Recharts`.
- **Micro-Animations & Glassmorphism**: Glowing background ambient mesh lights, smooth hover lifts, staggered card entrances, and responsive dark theme styling.

### 🤖 RAG-Enabled Office AI Assistant
- **Natural Language Query Engine**: Ask complex questions like *"What are my pending tasks?"*, *"How many leave days do I have remaining?"*, or *"Show today's meetings"*.
- **Database Context Aware**: Fetches live data from SQLite/SQLAlchemy models dynamically to generate precise context-backed responses.

### 👥 Staff Directory & Employee Management
- **Role-Based Profiles**: Manage Admin, Manager, and Employee accounts with role permissions.
- **Directory Search & Filter**: Instant search by employee name, ID code (`EMP-001`), designation, or department.

### ⏱️ Attendance & Check-In Punch Clock
- **One-Click Check-In / Check-Out**: Live status updates (`Present`, `Late`, `Absent`) with working hour duration tracking.
- **Attendance Logs**: Daily check-in timestamps and department-wide presence summaries.

### 🌴 Leave Management & Approval Pipeline
- **Request Workflows**: Submit Casual, Sick, or Paid Leave requests with custom date ranges and descriptions.
- **Manager Approval Hub**: One-click Approve or Reject actions with real-time balance calculations.

### 📋 Task Management & Kanban Board
- **Visual Pipeline**: Drag-free Kanban status columns (`To Do`, `In Progress`, `Completed`).
- **Priority Indicators**: Urgent, High, Medium, and Low badge tags with employee assignment tracking.

### 📅 Meeting Scheduler & Video Launcher
- **Calendar Booking**: Create board meetings, set start/end times, and assign participants.
- **Direct Link Launch**: Quick-join buttons for Google Meet, Zoom, or Teams links.

### 📢 Office Announcements & Notices
- **Broadcast Stream**: Priority notice board (`Urgent` / `Normal`) for company-wide policy updates and alerts.

### 📁 Document Catalog & Report Generation
- **Document Management**: File upload catalog, PDF handbook viewing, and instant downloads.
- **Executive Analytics Reports**: Comprehensive metric aggregation with **CSV Export** and printable PDF layout.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18 (Vite 5, JavaScript ES6+) |
| **Styling & Icons** | Tailwind CSS v3, Glassmorphism design system, Lucide React |
| **Data Visualization** | Recharts |
| **Backend API** | Python 3.9+, FastAPI, Uvicorn |
| **Database & ORM** | SQLAlchemy 2.0, SQLite (MySQL Ready) |
| **Authentication** | OAuth2 Password Bearer, JWT (JSON Web Tokens), Passlib Bcrypt |
| **AI Integration** | Google Generative AI (`google-generativeai` / Gemini API) |

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) (v3.9 or higher)

---

### 1️⃣ Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI development server (Runs on http://localhost:8000)
python run.py
```

*Interactive API documentation is available at `http://localhost:8000/docs`.*

---

### 2️⃣ Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node modules
npm install

# Start Vite live server (Runs on http://localhost:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🔐 Demo Credentials

Use any of the pre-configured demo accounts to explore role-specific permissions:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@office.com` | `admin123` | Full System Control (Employees, Reports, Settings) |
| **Manager** | `manager@office.com` | `manager123` | Department Management (Leaves, Tasks, Meetings) |
| **Employee** | `employee@office.com` | `employee123` | Personal Dashboard, Check-In, Tasks, AI Assistant |

---

## 📁 Repository Structure

```text
IntelliOffice/
├── backend/
│   ├── app/
│   │   ├── routes/          # FastAPI REST Endpoints (auth, employees, attendance, AI, etc.)
│   │   ├── services/        # AI Service (Gemini RAG) & Seed Data
│   │   ├── auth.py          # JWT Token verification & password hashing
│   │   ├── database.py      # SQLAlchemy DB session setup
│   │   ├── models.py        # Database entities (User, Attendance, Task, Meeting, etc.)
│   │   └── schemas.py       # Pydantic request/response validation
│   ├── uploads/             # Static documents and handbooks
│   ├── requirements.txt     # Python package requirements
│   └── run.py               # Application entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # Header, Sidebar, StatCard, Modal, ProtectedRoute
│   │   ├── context/         # AuthContext state management
│   │   ├── pages/           # Dashboard, Employees, Tasks, AI Assistant, etc.
│   │   ├── services/        # Axios API client instance
│   │   ├── App.jsx          # Router & layout mesh wrapper
│   │   └── index.css        # Keyframe animations & glassmorphism utilities
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
