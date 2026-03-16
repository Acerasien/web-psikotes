# Web Psikotes - Project Overview

A psychological testing platform built with React + Vite frontend and FastAPI backend.

## Tech Stack

### Frontend (`client/`)
- **Framework:** React 19 with Vite 7
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM v7
- **HTTP Client:** Axios
- **Charts:** Recharts
- **PDF/Excel:** PapaParse, XLSX
- **Notifications:** SweetAlert2
- **Utilities:** date-fns

### Backend (`server/`)
- **Framework:** FastAPI
- **Database:** PostgreSQL with SQLAlchemy ORM
- **Auth:** JWT (python-jose), bcrypt password hashing
- **PDF Generation:** WeasyPrint
- **Excel:** openpyxl, xlrd

## Project Structure

```
Web_Psikotes/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   └── data/          # Static data
│   └── dist/              # Production build
└── server/                # FastAPI backend
    ├── routes/            # API route modules
    ├── scoring/           # Test scoring algorithms
    ├── services/          # Business logic services
    ├── auth.py            # Authentication logic
    ├── database.py        # DB connection
    ├── models.py          # SQLAlchemy models
    ├── schemas.py         # Pydantic schemas
    └── seed_*.py          # Database seeders
```

## Development Commands

### Frontend
```bash
cd client
npm run dev      # Start dev server (port 5173)
npm run build    # Production build
npm run lint     # ESLint check
```

### Backend
```bash
cd server
# Activate venv first on Windows:
.venv\Scripts\activate  or  venv\Scripts\activate

uvicorn main:app --reload   # Start dev server (port 8000)
```

## Environment Setup

### Frontend (.env)
```
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_APP_NAME=Web Psikotes
```

### Backend (.env)
```
DATABASE_URL=postgresql://postgres:password@localhost/psych_db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Key Features

- **Authentication:** JWT-based auth with admin/superadmin roles
- **Test Types:** DISC, Speed, Temperament, Memory, Logic, Leadership
- **PDF Reports:** Generated via WeasyPrint
- **Excel Import/Export:** Support for test data
- **Scoring Modules:** Located in `server/scoring/`

## Database Models

- User, Test, Assignment, Result, Question, Option, ExitLog, Response

## API Routes

- `/auth` - Authentication
- `/users` - User management
- `/tests` - Test operations
- `/assignments` - Test assignments
- `/results` - Test results
- `/admin` - Admin operations

## TODO List

### Mobile Responsiveness (Completed ✅)
- [x] Phase 1: Core Layout - Admin sidebar with hamburger menu
- [x] Phase 2: Tables → Cards - ParticipantsPage mobile view
- [x] Phase 3: Test Screens - Improved question display and touch targets
  - [x] TestScreen.jsx - Scrollable question indicators, larger buttons
  - [x] DISCTest.jsx - Card view for mobile, table for desktop
  - [x] MemoryTest.jsx - Already responsive (grid layout)
  - [x] LogicTest.jsx - Already responsive (similar to TestScreen)
- [x] Phase 4: Polish - Modals, headers, navigation improved

### Test Routing Refactor (Completed ✅)
- [x] Created useTestSession hook for shared test logic
- [x] Created TestLayout, QuestionNavGrid, QuestionCard, TestFooter components
- [x] Created StandardTest component for generic tests
- [x] Set up React Router routes for /test/:assignmentId
- [x] Updated all test components to use navigate() instead of onFinish
- [x] Updated ParticipantDashboard to use routing

### Other Features
1. **IQ Test** - Not implemented (waiting for images to be received)
2. **Add TypeScript** - Migrate frontend to TypeScript for better type safety
3. **Add Tests** - Unit tests (frontend) and pytest (backend)
4. **User Settings** - Profile management, password change
5. **Test Analytics Dashboard** - Visualize aggregate results, trends
6. **Export Improvements** - Bulk export, custom report templates
7. **Rate Limiting** - Add rate limiting for API endpoints
8. **Email Notifications** - Send test invitations, results via email
9. **Session Management** - Track and manage active user sessions
10. **Audit Logging** - Log admin actions for security compliance
11. **Backup System** - Automated database backups
