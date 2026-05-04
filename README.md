---
title: Web Psikotes API
emoji: 🧠
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 8000
pinned: false
---

# Psikotes Platform – Andamas Standard

[![Tech Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20%7C%20PostgreSQL-blue)](https://github.com/Acerasien/web-psikotes)
[![UI Style](https://img.shields.io/badge/Theme-Industrial%20Utilitarian-orange)](#design-philosophy)

A professional, high-performance psychological assessment platform designed for corporate recruitment and internal auditing. Built with a focus on data precision, administrative efficiency, and a premium "Industrial Utilitarian" aesthetic.

---

## 🏗️ Technical Architecture

The platform follows a modern decoupled architecture:

```mermaid
graph TD
    User((Participant / Admin)) -->|React Router| Frontend[Vite + React Frontend]
    Frontend -->|JWT Auth / API| Backend[FastAPI Backend]
    Backend -->|SQLAlchemy| DB[(PostgreSQL Database)]
    Backend -->|python-docx| DOCX[DOCX Report Engine]
    
    subgraph Scoring Modules
        Backend --> DISC[Dynamic DISC Module]
        Backend --> IQ[IQ/Pattern Module]
        Backend --> WPT[WPT/Logic Module]
        Backend --> CBI[CBI/Risk Module]
    end
```

---

## ✨ Key Features

### 🛡️ Administrative Dashboard
- **Comprehensive Management**: Full-page workflows for creating and managing Admins and Participants.
- **Persistent Intelligence**: URL-synchronized filters for the participant list (status, search, etc.) that survive navigation and refreshes.
- **Bulk Operations**: High-speed participant import via CSV/Excel supporting custom fields (Department, Business Unit, position).
- **Security & Integrity**: Real-time Audit Logs tracking exit events (tab switching) and device/browser fingerprints.

### 🧠 Advanced Assessment Suite
- **Dynamic DISC Profiling**: Automated multi-paragraph interpretations based on Graph I, II, and III results.
- **WPT (Wonderlic) Standard**: 50-item logic assessment mapped to 12 cognitive tiers including Career Recommendations.
- **Manual Decision Interface**: Specialized "Report Decision" page for psychologists to override or finalize status (Recommended/Considered/Not Recommended).
- **CBI (Counterproductive Behavior Index)**: Specialized integrity screening with behavioral concern markers.
- **Memory, Speed & Accuracy**: High-pressure performance testing with visualizers.
- **Temperament & PAPI**: Multi-axial behavioral orientation tests.

### 📊 Professional Reporting
- **Industrial Dashboard**: High-contrast, data-dense participant profiles with specialized visualizers for every test module.
- **Microsoft Word Export (DOCX)**: Professional 3-page automated reports with high-quality tables, charts, and dynamic psychological conclusions.

---

## 🎨 Design Philosophy
The "Industrial Utilitarian" aesthetic prioritizes clarity and professional weight:
- **High Contrast**: Deep neutral-900 backgrounds with stark white and accent-gold headers.
- **Data-Sheet Styling**: Sharp 2px borders, mono-spaced technical fonts for metrics, and distinct "data-card" layouts.
- **Functional Animation**: Micro-interactions designed for professional feedback rather than simple decoration.

---

## 🚀 Getting Started

### Backend Setup (FastAPI)
1. **Initialize Environment**:
   ```bash
   cd server
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   ```
2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   pip install python-docx
   ```
3. **Database & Seeding**:
   ```bash
   # Initialize logic/questions and create superadmin
   python seed_all.py 
   ```
4. **Run Server**:
   ```bash
   python -m uvicorn main:app --reload
   ```

### Frontend Setup (Vite)
1. **Install Dependencies**:
   ```bash
   cd client
   npm install
   ```
2. **Environment Configuration**:
   Create a `.env` file based on `.env.example`.
3. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Headless UI, Heroicons.
- **Backend**: FastAPI, SQLAlchemy, Pydantic, python-docx.
- **Database**: PostgreSQL.
- **Language**: Python 3.9+, Javascript (ES6+).

---

## 📂 Project Structure
```text
├── client/          # Vite + React source code
│   ├── src/
│   │   ├── pages/   # Dashboard and Profile views
│   │   ├── components/ # Reusable UI blocks
│   │   └── contexts/# Auth and State management
├── server/          # FastAPI source code
│   ├── routes/      # API endpoints (Auth, Users, Results)
│   ├── scoring/     # Logic for each psychological test
│   ├── services/    # PDF Generation and external utilities
│   └── seed_*.py    # Database initializations
└── README.md        # This documentation
```

---

