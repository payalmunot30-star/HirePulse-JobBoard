## . Installation & Running Instructions

### Option A: Quick Start with Docker Compose (Recommended)

1. **Clone and navigate to repository**:
   ```bash
   cd "d:/job-portal"
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

3. **Start all services**:
   ```bash
   docker compose up --build
   ```

4. **Verify container status**:
   ```bash
   docker compose ps
   ```

5. **Access services**:
   - **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
   - **Backend REST API**: [http://localhost:8000/api/](http://localhost:8000/api/)
   - **Interactive Swagger Documentation**: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
   - **Redoc API Specifications**: [http://localhost:8000/api/redoc/](http://localhost:8000/api/redoc/)
   - **Django Admin Panel**: [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

### Option B: Local Development Setup (Without Docker)

#### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL 15+ running locally with database `job_portal`

#### . Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser / admin
python manage.py createsuperuser

# Start development server
python manage.py runserver 0.0.0.0:8000
```

#### . Frontend Setup
```bash
cd frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend will start on [http://localhost:3000](http://localhost:3000) with automatic proxying to [http://localhost:8000](http://localhost:8000).

---

## . Automated Testing

The backend includes a comprehensive automated test suite covering authentication, permissions, job posting/search, application workflows, and dashboard statistics:

```bash
# Run tests inside Docker container
docker exec job_portal_backend python manage.py test

# Run tests locally
cd backend
python manage.py test
```

To validate the frontend build bundle:
```bash
cd frontend
npm run build
```

# HirePulse — Enterprise Job Portal & Recruitment Management System

HirePulse is a complete, production-grade **Recruitment Management and Career Platform** designed to seamlessly bridge the gap between job seekers (**Candidates**) and hiring teams (**Recruiters**), while providing system supervisors (**Administrators**) with comprehensive visibility and moderation authority over the entire talent acquisition pipeline.

Built upon a robust decoupled stack comprising **Django 4.2 LTS / Django REST Framework (DRF)**, **PostgreSQL 16**, and **React 18 / Vite**, HirePulse delivers high-performance full-text search, secure role-based access control, rich company branding with custom covers and logos, candidate profile photo and resume management, an automated multi-stage application review pipeline, in-app/email status alerts, and real-time analytical dashboards.

---

## 1. Project Overview

### Purpose & User Roles
HirePulse modernizes the hiring lifecycle by replacing disjointed email chains and spreadsheets with a centralized, data-driven web portal. The system enforces strict **Role-Based Access Control (RBAC)** across three distinct persona types:

1. **Candidate**:
   - Discovers opportunities via full-text keyword search and multi-criteria filters (industry, employment type, location, experience).
   - Manages personal profile details, including **profile headshot photo upload**, verified PDF resume documents, technical skill tags, structured education history, work experience entries, and social links (LinkedIn, Portfolio).
   - Submits applications with custom cover letters and uploaded/profile resumes, guarded by database-level duplicate prevention.
   - Monitors submitted application statuses (`Applied`, `Shortlisted`, `Interview`, `Hired`, `Rejected`) in real-time with automatic notification bells and email alerts.
   - Saves bookmarked positions and hides unwanted listings from their personal feed.

2. **Recruiter**:
   - Creates, edits, publishes, and closes job postings with Indian currency salary ranges (`₹`), detailed descriptions, and skill tags.
   - Customizes company visual branding by uploading a **Company Banner Cover Image**, **Company Logo Avatar**, brand theme hex colors, and organization overviews.
   - Screens incoming candidate submissions in the **Applicant Review Pipeline**, viewing submitted resumes, candidate credentials, and contact details.
   - Advances applicant status through the hiring funnel (`Shortlisted`, `Interview`, `Hired`, `Rejected`), automatically triggering candidate alerts and emails.
   - Proactively sources talent using the **Candidate Search** engine filtered by name, technical skills, and experience keywords.
   - Tracks hiring performance through real-time KPI metrics and conversion distribution charts.

3. **Administrator**:
   - Global governance across all system users, recruiters, jobs, and applications.
   - Moderates users: searches users, changes user roles (`Candidate`, `Recruiter`, `Admin`), and activates or deactivates accounts.
   - Onboards and registers new verified recruiter organizations with corporate branding.
   - Moderates job postings across all companies with direct status controls (Active/Closed).
   - Analyzes platform-wide hiring conversion funnels and category distribution charts calculated via dynamic PostgreSQL query aggregations.

---

## 2. Technology Stack

All components and versions are verified directly against project configuration files (`package.json`, `requirements.txt`, `Dockerfile`, `docker-compose.yml`, `nginx.conf`):

### Frontend
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `^18.2.0` | Core UI library for component-driven interfaces |
| **React DOM** | `^18.2.0` | React package for DOM rendering |
| **Vite** | `^5.2.0` | Next-generation frontend build tool and local dev server |
| **React Router DOM** | `^6.22.3` | Client-side routing, protected route guards, and URL synchronization |
| **Axios** | `^1.6.8` | HTTP client with automatic JWT token injection and 401 refresh interceptors |
| **Lucide React** | `^0.368.0` | Modern, lightweight UI icon library |
| **Vanilla CSS** | Standard CSS3 | Enterprise design system with CSS custom properties, responsive grids, and micro-interactions |
| **Google Fonts** | Inter & Dancing Script | Clean modern typography and executive cursive script branding |

### Backend
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Python** | `3.11-slim` | Base container runtime environment |
| **Django** | `>=4.2,<5.0` (4.2 LTS) | Robust high-level Python web framework |
| **Django REST Framework** | `>=3.14,<4.0` | Toolkit for building secure, scalable RESTful Web APIs |
| **SimpleJWT** | `>=5.3,<6.0` | JSON Web Token (JWT) authentication with refresh rotation |
| **django-cors-headers** | `>=4.3,<5.0` | Cross-Origin Resource Sharing (CORS) headers handling |
| **django-filter** | `>=23.5,<25.0` | Declarative filtering integration for DRF querysets |
| **drf-spectacular** | `>=0.27,<1.0` | OpenAPI 3.0 schema generation with interactive Swagger & Redoc |
| **psycopg2-binary** | `>=2.9,<3.0` | PostgreSQL database adapter for Python |
| **Pillow** | `>=10.0,<11.0` | Imaging library for company banners, logos, and profile photos |
| **Gunicorn** | `>=21.2,<23.0` | Production WSGI HTTP server |
| **python-decouple** | `>=3.8,<4.0` | Environment settings management (`.env`) |
| **python-magic** | `>=0.4.27,<1.0` | MIME-type verification for file upload security |

### Database & Infrastructure
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **PostgreSQL** | `16-alpine` | Primary relational database with GIN indexed full-text search vectors |
| **Nginx** | `alpine` | High-performance reverse proxy and static asset web server |
| **Docker & Compose** | Compose v2 | Multi-container orchestration for database, backend, and frontend |

---

## 3. System Architecture

The HirePulse platform employs a decoupled client-server architecture with dedicated Docker services:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HIREPULSE SYSTEM ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────────────────┘

                               [ Web Browser / Client ]
                                          │
                                          │ HTTP / Port 3000 (Host)
                                          ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ FRONTEND CONTAINER (job_portal_frontend)                                │
  │ • Nginx Alpine Web Server (Listening on Port 80, mapped to Host 3000)   │
  │ • Serves React 18 SPA static bundle (/dist)                             │
  │ • Reverse Proxies /api/*  ──> http://backend:8000/api/                   │
  │ • Reverse Proxies /media/* ──> http://backend:8000/media/               │
  │ • Client max body size configured to 10M for uploads                    │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       │
                                       │ Internal Network: job_portal_net
                                       ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ BACKEND CONTAINER (job_portal_backend)                                  │
  │ • Python 3.11 + Django 4.2 LTS / Django REST Framework (Port 8000)      │
  │ • SimpleJWT Authentication (Bearer Token injection & rotation)          │
  │ • Modular Django Apps:                                                  │
  │   ├── accounts      ── Auth, Users, CandidateProfile, RecruiterProfile   │
  │   ├── jobs          ── Job listings, GIN Full-Text Search, CRUD         │
  │   ├── applications  ── Multi-stage Review, Duplicate Prevention         │
  │   ├── notifications ── In-app alerts and automated Email dispatch       │
  │   └── dashboards    ── Real-time KPI metrics & aggregation queries      │
  │ • Volume: media_volume mounted at /app/media                            │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       │
                                       │ Port 5432 (Internal)
                                       ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ DATABASE CONTAINER (job_portal_db)                                      │
  │ • PostgreSQL 16 Alpine                                                  │
  │ • Database: job_portal | User: postgres                                 │
  │ • Full-Text Search Vectors (`search_vector`) with GIN indexing           │
  │ • Relational Integrity & Unique Constraints                             │
  │ • Volume: postgres_data mounted at /var/lib/postgresql/data             │
  └─────────────────────────────────────────────────────────────────────────┘
```

### Docker Network & Storage Topology
- **Network**: `job_portal_net` (Bridge driver) allows secure inter-container resolution (`backend:8000`, `postgres:5432`).
- **Volumes**:
  - `postgres_data`: Persistent storage for all relational records and search indexes.
  - `media_volume`: Persistent storage for user uploaded resumes, company banners, company logos, and candidate profile photos.

---

## 4. Complete Project Structure

```
HirePulse/
│
├── backend/
│   ├── manage.py                               # Django CLI management entrypoint
│   ├── requirements.txt                         # Python package dependencies
│   ├── Dockerfile                              # Backend container image build recipe
│   ├── setup_test_recruiters.py                # Recruiter seeding helper script
│   ├── update_recruiters.py                    # Recruiter visual branding update script
│   ├── test_pipeline.py                        # Pipeline diagnostic testing script
│   │
│   ├── config/                                 # Project configuration package
│   │   ├── __init__.py
│   │   ├── asgi.py                             # ASGI configuration
│   │   ├── settings.py                         # Django configuration, DB, JWT, CORS, Media
│   │   ├── urls.py                             # Root URL patterns, Media routing, Swagger
│   │   └── wsgi.py                             # WSGI production server entrypoint
│   │
│   ├── accounts/                               # Authentication, Users & Profiles App
│   │   ├── __init__.py
│   │   ├── admin.py                            # Django Admin registrations
│   │   ├── apps.py                             # Accounts app configuration
│   │   ├── managers.py                         # Custom UserManager for email-based auth
│   │   ├── models.py                           # User, CandidateProfile, RecruiterProfile
│   │   ├── permissions.py                      # IsAdmin, IsRecruiter, IsCandidate RBAC
│   │   ├── serializers.py                      # User & Profile serializers
│   │   ├── signals.py                          # Profile auto-generation signals
│   │   ├── tests.py                            # Accounts test suite
│   │   ├── validators.py                       # Phone number, resume PDF, file validators
│   │   ├── views.py                            # Auth, Profile, and User viewsets
│   │   ├── migrations/                         # Database schema migrations
│   │   │   ├── 0001_initial.py
│   │   │   ├── 0002_recruiterprofile_brand_color_and_more.py
│   │   │   └── 0003_candidateprofile_profile_picture.py
│   │   └── urls/                               # Split URL modules
│   │       ├── __init__.py
│   │       ├── auth_urls.py                    # /api/auth/* endpoints
│   │       └── user_urls.py                    # /api/users/* endpoints
│   │
│   ├── jobs/                                   # Job Postings & Search App
│   │   ├── __init__.py
│   │   ├── admin.py                            # Job model admin integration
│   │   ├── apps.py                             # Jobs app configuration
│   │   ├── filters.py                          # PostgreSQL search & filter definitions
│   │   ├── models.py                           # Job model with GIN search vector
│   │   ├── serializers.py                      # JobListSerializer, JobDetailSerializer
│   │   ├── tests.py                            # Job CRUD & search test suite
│   │   ├── urls.py                             # /api/jobs/* endpoints
│   │   ├── views.py                            # Job list, create, detail, and close views
│   │   └── migrations/                         # Job migrations
│   │
│   ├── applications/                           # Job Applications & Pipeline App
│   │   ├── __init__.py
│   │   ├── admin.py                            # Application admin integration
│   │   ├── apps.py                             # Applications app configuration
│   │   ├── models.py                           # Application model & unique constraints
│   │   ├── serializers.py                      # ApplicationSerializer, StatusUpdate
│   │   ├── tests.py                            # Application workflow test suite
│   │   ├── urls.py                             # /api/applications/* endpoints
│   │   ├── views.py                            # Apply, candidate tracker, recruiter review
│   │   └── migrations/                         # Application migrations
│   │
│   ├── notifications/                          # In-App Alerts & Email Notifications App
│   │   ├── __init__.py
│   │   ├── admin.py                            # Notification admin integration
│   │   ├── apps.py                             # Notifications app configuration
│   │   ├── models.py                           # Notification model
│   │   ├── serializers.py                      # NotificationSerializer
│   │   ├── services.py                         # Email dispatcher & notification creators
│   │   ├── urls.py                             # /api/notifications/* endpoints
│   │   ├── views.py                            # List, mark read, mark all read views
│   │   └── migrations/                         # Notification migrations
│   │
│   └── dashboards/                             # Analytical Metrics & Reporting App
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py                             # Dashboards app configuration
│       ├── tests.py                            # Dashboard metrics test suite
│       ├── urls.py                             # /api/dashboard/* endpoints
│       └── views.py                            # Dynamic SQL aggregation KPI views
│
├── frontend/
│   ├── package.json                            # NPM project manifest & scripts
│   ├── package-lock.json                       # Dependency lockfile
│   ├── vite.config.js                          # Vite configuration & dev reverse proxy
│   ├── nginx.conf                              # Production Nginx reverse proxy configuration
│   ├── Dockerfile                              # Multi-stage frontend Docker build recipe
│   ├── index.html                              # HTML5 entrypoint & Google Fonts preconnect
│   │
│   ├── public/                                 # Static assets served at root
│   │   ├── job_card_banner.jpg                 # Full-width executive dark desk banner
│   │   └── company_bird_logo.png               # High-resolution company origami bird logo
│   │
│   └── src/
│       ├── main.jsx                            # React 18 DOM mount entrypoint
│       ├── App.jsx                             # Top-level routing and providers
│       ├── index.css                           # Global design system & typography tokens
│       │
│       ├── components/
│       │   ├── common/
│       │   │   ├── Header.jsx                  # Main navbar, user dropdown, notifications
│       │   │   ├── Footer.jsx                  # Site footer with platform links
│       │   │   ├── Sidebar.jsx                 # Dashboard navigation drawer
│       │   │   ├── ProtectedRoute.jsx          # RBAC route authorization guard
│       │   │   ├── Modal.jsx                   # Accessible modal container with backdrop
│       │   │   ├── Badge.jsx                   # Status badges for applications
│       │   │   └── CompanyBranding.jsx         # CompanyBanner & CompanyLogo components
│       │   │
│       │   └── jobs/
│       │       ├── JobCard.jsx                 # Redesigned full-width banner job card
│       │       ├── JobCard.css                 # Dedicated stylesheet for job card
│       │       └── JobFilter.jsx               # Filter panel for job search
│       │
│       ├── context/
│       │   ├── AuthContext.jsx                 # Authentication state & role privileges
│       │   └── ToastContext.jsx                # Toast alerts and feedback notifications
│       │
│       ├── hooks/
│       │   └── useFetch.js                     # Generic data fetching hook
│       │
│       ├── services/
│       │   ├── api.js                          # Axios client with JWT interceptors
│       │   ├── auth.service.js                 # Login, register, password reset requests
│       │   ├── candidate.service.js            # Profile retrieval, update, recruiter search
│       │   ├── job.service.js                  # Job search, creation, and detail requests
│       │   ├── application.service.js          # Apply, candidate applications, status update
│       │   ├── notification.service.js         # Alerts listing and read receipts
│       │   └── dashboard.service.js            # Analytical KPI dashboard data requests
│       │
│       ├── utils/
│       │   ├── currency.js                     # Indian Rupee (`₹`) lakhs & crores formatter
│       │   ├── formatters.js                   # Title and company name capitalization
│       │   └── resume.js                       # PDF validation, view, and download helpers
│       │
│       └── pages/
│           ├── public/
│           │   ├── Home.jsx                    # Landing page with stats, search & features
│           │   ├── Login.jsx                   # Authentication login form
│           │   ├── Register.jsx                # Candidate registration form
│           │   ├── ForgotPassword.jsx          # Password reset request form
│           │   ├── ResetPassword.jsx           # Password confirmation with token
│           │   ├── JobListings.jsx             # Job search directory with 2-column grid
│           │   └── JobDetails.jsx              # Job specifications & Apply modal
│           │
│           ├── candidate/
│           │   ├── CandidateDashboard.jsx      # Metrics, profile progress, recommended jobs
│           │   ├── CandidateProfile.jsx        # Photo upload, resume, skills, experience
│           │   ├── CandidateOnboarding.jsx     # First-time profile creation wizard
│           │   └── MyApplications.jsx          # Applications tracker with status badges
│           │
│           ├── recruiter/
│           │   ├── RecruiterDashboard.jsx      # Hiring funnel metrics & status breakdown
│           │   ├── RecruiterProfile.jsx        # Banner, logo, and brand color visual hub
│           │   ├── CreateJob.jsx               # Job publishing form with INR salary
│           │   ├── EditJob.jsx                 # Job modification form
│           │   ├── ManageJobs.jsx              # Posted jobs table with Active/Closed toggle
│           │   ├── ApplicantsList.jsx          # Candidate review pipeline & status controls
│           │   └── CandidateSearch.jsx         # Candidate talent search with photo support
│           │
│           └── admin/
│               ├── AdminDashboard.jsx          # Global platform aggregates & KPIs
│               ├── UserManagement.jsx          # User role switching & account activation
│               ├── RecruiterManagement.jsx     # Recruiter organizations overview
│               ├── AddRecruiter.jsx            # Create and onboard new recruiters
│               ├── JobManagement.jsx           # Global job moderation
│               ├── ApplicationManagement.jsx   # Global application logs
│               └── HiringOverview.jsx          # Conversion funnel & category analytics
│
├── docker-compose.yml                          # Multi-container orchestration definition
├── .env.example                                # Environment variable documentation template
├── README.md                                   # Comprehensive developer and system guide
└── WALKTHROUGH.md                              # End-to-end operational testing manual
```

---

## 5. File-by-File Documentation

### Core Configuration & Entry Points

#### `backend/config/settings.py`
- **Purpose**: Master configuration for the Django application.
- **Responsibilities**: Configures installed apps, database connection credentials (`DATABASES`), custom user model (`AUTH_USER_MODEL = 'accounts.User'`), SimpleJWT lifetimes (60m access, 7d refresh), CORS whitelist, REST Framework defaults, media file paths (`MEDIA_ROOT`, `MEDIA_URL`), and SMTP/Console email settings.
- **Dependencies**: `python-decouple`, `psycopg2-binary`, `rest_framework`, `corsheaders`.

#### `backend/config/urls.py`
- **Purpose**: Top-level API routing hub.
- **Responsibilities**: Namespaces and includes sub-routers: `/api/auth/`, `/api/users/`, `/api/jobs/`, `/api/applications/`, `/api/notifications/`, `/api/dashboard/`, Swagger UI (`/api/docs/`), Redoc (`/api/redoc/`), and dynamic `/media/` serving.
- **Dependencies**: `django.urls`, `drf_spectacular.views`.

#### `frontend/src/App.jsx`
- **Purpose**: Main React application root component.
- **Responsibilities**: Defines the client-side routing tree using React Router DOM, wraps components within `AuthProvider` and `ToastProvider`, and configures role-based access via `ProtectedRoute`.
- **Dependencies**: `react-router-dom`, `AuthContext`, `ToastContext`, page components.

#### `frontend/src/services/api.js`
- **Purpose**: Centralized Axios HTTP client instance.
- **Responsibilities**: Configures base API URL (`/api`), automatically injects Bearer JWT access tokens into request headers, and intercepts 401 Unauthorized responses to perform automatic token rotation using the refresh token.
- **Dependencies**: `axios`.

### Key Backend Models & Views

#### `backend/accounts/models.py`
- **Purpose**: Defines user identity and profile extensions.
- **Responsibilities**:
  - `User`: Custom user with email as primary identifier, role enum (`admin`, `recruiter`, `candidate`), first and last name.
  - `CandidateProfile`: Stores candidate `profile_picture`, `phone`, `bio`, `skills` (JSON), `education` (JSON), `experience` (JSON), `resume` (PDF file field), `location`, `linkedin_url`, and `portfolio_url`.
  - `RecruiterProfile`: Stores recruiter `company_name`, `company_description`, `company_website`, `company_location`, `company_logo` (image), `company_banner` (image), `brand_color`, `phone`, and `position`.

#### `backend/jobs/models.py`
- **Purpose**: Job posting schema with PostgreSQL full-text search capability.
- **Responsibilities**:
  - `Job`: Model containing `title`, `description`, `category`, `location`, `job_type`, `experience_level`, `salary_min`, `salary_max`, `skills_required` (JSON), `closing_date`, and `status`.
  - `search_vector`: Dedicated `SearchVectorField` indexed with `GinIndex` across job title, description, category, and skills for rapid natural language search.

#### `backend/applications/models.py`
- **Purpose**: Job application tracking and workflow model.
- **Responsibilities**:
  - `Application`: Foreign keys to `CandidateProfile` and `Job`, submitted `resume` file, `cover_letter`, `applied_at`, and `status` (`applied`, `shortlisted`, `interview`, `rejected`, `hired`).
  - Database Constraint: `UniqueConstraint(fields=['candidate', 'job'], name='unique_candidate_job_application')` prevents duplicate applications.

#### `backend/notifications/services.py`
- **Purpose**: Centralized notification and email dispatcher.
- **Responsibilities**: Creates in-app `Notification` database records and dispatches localized emails to candidates upon status changes (`Shortlisted`, `Interview`, `Hired`, `Rejected`).

#### `backend/dashboards/views.py`
- **Purpose**: High-performance SQL aggregation endpoints for dashboards.
- **Responsibilities**:
  - `RecruiterDashboardView`: Aggregates active jobs, total applicants, and status distribution counts.
  - `AdminDashboardView`: Aggregates system user totals by role, active postings, and total applications.
  - `AdminHiringPipelineView`: Calculates stage-by-stage hiring conversion percentages and category distribution.
  - `CandidateDashboardView`: Returns candidate application metrics and recommended jobs.

### Key Frontend UI Components

#### `frontend/src/components/jobs/JobCard.jsx` & `JobCard.css`
- **Purpose**: Redesigned modern job card matching enterprise recruitment aesthetics.
- **Responsibilities**:
  - Full-width company cover banner (`width: 100%; height: 160px; object-fit: cover`) with top rounded corners.
  - Floating company logo box (`width: 85px; height: 85px`) overlapping the bottom-right corner of the banner (`bottom: -35px; right: 40px`).
  - Left-aligned "Multiple openings" badge with comfortable clearance from overlapping logo.
  - Bold job title link, company name, location with `MapPin` icon.
  - Vertically stacked Bookmark and Dislike action controls on the right.
  - Pill badges for Job Type, Experience Level, and Green Indian Rupee (`₹`) Salary Range.
  - Bottom activity insights container highlighting response speed, applicant count, and early applicant status.

#### `frontend/src/pages/candidate/CandidateProfile.jsx`
- **Purpose**: Interactive profile management and photo upload view for candidates.
- **Responsibilities**:
  - VIEW Mode: Displays candidate header card with circular avatar photo, quick-upload camera icon button, basic contact details, resume action buttons, skill tags, and experience entries.
  - EDIT Mode: Features dedicated "Candidate Profile Picture" upload card with live image preview, photo selection button (JPG, PNG, WEBP max 5MB), reset button, phone validation (`+91`), PDF resume upload, and structured form fields.
  - Submits multipart `FormData` directly to `/api/users/profile/candidate/` for database persistence.

#### `frontend/src/pages/recruiter/RecruiterProfile.jsx`
- **Purpose**: Corporate branding management hub for recruiters.
- **Responsibilities**: Allows recruiters to upload company banner images, logos, select corporate brand theme hex colors, and update company overviews.

---

## 6. Frontend Pages and Routes

HirePulse contains **25 verified routes** registered in `frontend/src/App.jsx`:

| Group | Page Name | Route | Source File | Access Role | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Public** | Home | `/` | `pages/public/Home.jsx` | Public | Landing page with hero search, platform stats, categories, and featured jobs |
| **Public** | Login | `/login` | `pages/public/Login.jsx` | Public | Universal JWT sign-in form for all user roles |
| **Public** | Register | `/register` | `pages/public/Register.jsx` | Public | Candidate registration form |
| **Public** | Forgot Password | `/forgot-password` | `pages/public/ForgotPassword.jsx` | Public | Request password reset token via email |
| **Public** | Reset Password | `/reset-password` | `pages/public/ResetPassword.jsx` | Public | Submit reset token and set new password |
| **Public** | Reset Password (URL) | `/reset-password/:uid/:token` | `pages/public/ResetPassword.jsx` | Public | Direct email reset link handler |
| **Public** | Job Listings | `/jobs` | `pages/public/JobListings.jsx` | Public | Searchable 2-column job directory with multi-filters and Active/Closed toggle |
| **Public** | Job Details | `/jobs/:id` | `pages/public/JobDetails.jsx` | Public | Full vacancy specifications, company overview, and candidate Apply modal |
| **Candidate** | Candidate Onboarding | `/candidate-onboarding` | `pages/candidate/CandidateOnboarding.jsx` | `candidate` | Initial career onboarding flow for new candidates |
| **Candidate** | Candidate Onboarding (Alt) | `/candidate/onboarding` | `pages/candidate/CandidateOnboarding.jsx` | `candidate` | Alternate path for career onboarding flow |
| **Candidate** | Candidate Dashboard | `/candidate/dashboard` | `pages/candidate/CandidateDashboard.jsx` | `candidate` | Application stage metrics, profile progress bar, and recommended jobs |
| **Candidate** | Candidate Profile | `/candidate/profile` | `pages/candidate/CandidateProfile.jsx` | `candidate` | Manage profile picture, contact, PDF resume, skills, and work history |
| **Candidate** | My Applications | `/candidate/applications` | `pages/candidate/MyApplications.jsx` | `candidate` | Application tracker with stage badges, cover letters, and applied dates |
| **Recruiter** | Recruiter Dashboard | `/recruiter/dashboard` | `pages/recruiter/RecruiterDashboard.jsx` | `recruiter`, `admin` | Recruitment KPIs, active job count, applicant pipeline status breakdown |
| **Recruiter** | Recruiter Profile | `/recruiter/profile` | `pages/recruiter/RecruiterProfile.jsx` | `recruiter` | Company branding hub (banner, logo, brand theme color, company overview) |
| **Recruiter** | Create Job | `/recruiter/create-job` | `pages/recruiter/CreateJob.jsx` | `recruiter` | Vacancy publishing form with category, INR salary, and requirements |
| **Recruiter** | Manage Jobs | `/recruiter/jobs` | `pages/recruiter/ManageJobs.jsx` | `recruiter` | Table of recruiter's vacancies with Active/Closed toggle and applicant counts |
| **Recruiter** | Edit Job | `/recruiter/jobs/:id/edit` | `pages/recruiter/EditJob.jsx` | `recruiter` | Modify job criteria, specifications, or salary ranges |
| **Recruiter** | Applicants Pipeline | `/recruiter/applicants` | `pages/recruiter/ApplicantsList.jsx` | `recruiter`, `admin` | Screen applicants, review resumes, and advance statuses (`Shortlisted`, etc.) |
| **Recruiter** | Candidate Search | `/recruiter/candidates` | `pages/recruiter/CandidateSearch.jsx` | `recruiter`, `admin` | Search candidate profiles by skill tags, location, and experience |
| **Admin** | Admin Dashboard | `/admin/dashboard` | `pages/admin/AdminDashboard.jsx` | `admin` | Global platform metrics: user counts by role, job totals, conversion rates |
| **Admin** | Recruiter Management | `/admin/recruiters` | `pages/admin/RecruiterManagement.jsx` | `admin` | Directory of verified recruiter organizations and their job listings |
| **Admin** | Add Recruiter | `/admin/recruiters/add` | `pages/admin/AddRecruiter.jsx` | `admin` | Form to manually onboard and create a verified recruiter account |
| **Admin** | User Management | `/admin/users` | `pages/admin/UserManagement.jsx` | `admin` | Moderate users, change user roles, and activate/deactivate accounts |
| **Admin** | Job Moderation | `/admin/jobs` | `pages/admin/JobManagement.jsx` | `admin` | Platform-wide job listing moderation with status controls |
| **Admin** | Application Logs | `/admin/applications` | `pages/admin/ApplicationManagement.jsx` | `admin` | Global oversight of all applications across all jobs |
| **Admin** | Hiring Funnel Analytics | `/admin/hiring` | `pages/admin/HiringOverview.jsx` | `admin` | Funnel conversion visualization and category placement statistics |

---

## 7. Backend Applications & API Endpoints

### 1. `accounts` App (`backend/accounts/`)
- **Purpose**: Custom authentication, JWT management, user profiles, and recruiter onboarding.
- **Key Models**: `User`, `CandidateProfile`, `RecruiterProfile`.
- **API Endpoints**:
  - `POST /api/auth/register/` — Register a new Candidate or Recruiter.
  - `POST /api/auth/login/` — Authenticate and receive access/refresh tokens.
  - `POST /api/auth/logout/` — Blacklist refresh token and log out.
  - `POST /api/auth/token/refresh/` — Obtain new access token via refresh token.
  - `GET  /api/auth/me/` — Retrieve authenticated user profile information.
  - `POST /api/auth/password-reset/` — Request password reset link.
  - `POST /api/auth/password-reset-confirm/` — Set new password using token.
  - `POST /api/auth/change-password/` — Change password while authenticated.
  - `GET, PUT /api/users/profile/candidate/` — Retrieve / update candidate profile (supports multipart `profile_picture` & `resume`).
  - `GET, PUT /api/users/profile/recruiter/` — Retrieve / update recruiter profile (supports `company_logo` & `company_banner`).
  - `GET  /api/users/candidates/` — Candidate search endpoint for recruiters.
  - `GET, PATCH /api/users/` — Admin user management (status toggle, role changes).
  - `POST /api/users/recruiters/` — Admin recruiter creation endpoint.

### 2. `jobs` App (`backend/jobs/`)
- **Purpose**: Job vacancy catalog, PostgreSQL full-text search, and status controls.
- **Key Models**: `Job`.
- **API Endpoints**:
  - `GET  /api/jobs/` — Public list of jobs with keyword search, category, location, and job type filters.
  - `POST /api/jobs/` — Create new job vacancy (Recruiter only).
  - `GET  /api/jobs/{id}/` — Retrieve job posting details.
  - `PUT, PATCH /api/jobs/{id}/` — Modify job specifications.
  - `POST /api/jobs/{id}/close/` — Close an active job posting.
  - `GET  /api/jobs/my-jobs/` — Recruiter's own job listings with applicant counts.
  - `GET  /api/jobs/categories/` — List available job categories with vacancy counts.
  - `GET  /api/jobs/choices/` — Standardized choices for job types and experience levels.

### 3. `applications` App (`backend/applications/`)
- **Purpose**: Job application submission, file verification, and candidate review pipeline.
- **Key Models**: `Application`.
- **API Endpoints**:
  - `POST /api/applications/` — Submit application with resume and cover letter (Candidate only).
  - `GET  /api/applications/my-applications/` — Track candidate's own submitted applications.
  - `GET  /api/applications/recruiter/` — Review applicants filtered by job and status (Recruiter only).
  - `GET  /api/applications/{id}/` — View detailed application record and candidate profile.
  - `PATCH /api/applications/{id}/status/` — Update application status (`shortlisted`, `interview`, `hired`, `rejected`).

### 4. `notifications` App (`backend/notifications/`)
- **Purpose**: System alerts, unread counters, and automated candidate email dispatch.
- **Key Models**: `Notification`.
- **API Endpoints**:
  - `GET  /api/notifications/` — List user notifications ordered by date.
  - `POST /api/notifications/{id}/read/` — Mark a single notification as read.
  - `POST /api/notifications/read-all/` — Mark all user notifications as read.

### 5. `dashboards` App (`backend/dashboards/`)
- **Purpose**: Aggregated SQL analytics for role-specific dashboard screens.
- **API Endpoints**:
  - `GET /api/dashboard/candidate/` — Candidate application counters and recommended jobs.
  - `GET /api/dashboard/recruiter/` — Recruiter active vacancies, total applicants, and status funnel.
  - `GET /api/dashboard/admin/` — Admin platform-wide statistics (users, jobs, applications).
  - `GET /api/dashboard/admin/hiring-pipeline/` — Stage conversion rates and industry category breakdowns.

---

## 8. Database Architecture & Migrations

### Configuration
HirePulse utilizes PostgreSQL 16 Alpine configured in `.env` and `docker-compose.yml`:
- **Database Name**: `job_portal`
- **User**: `Configured through environment variables`
- **Password**: `Configured through environment variables`
- **Host**: `postgres` (in Docker) or `localhost` (local dev)
- **Port**: `5432`
- **Data Persistence**: Docker volume `postgres_data` mapped to `/var/lib/postgresql/data`.

### Database Schema Highlights
- **Indexed Full-Text Search**: `Job.search_vector` stores a pre-computed search vector combining job title (weight A), skills (weight B), category (weight B), and description (weight C) indexed with PostgreSQL `GinIndex`.
- **Duplicate Prevention**: `Application` contains a unique database constraint on `(candidate, job)` ensuring a candidate cannot submit duplicate applications for the same role.
- **Foreign Key Integrity**: Cascading deletes for user profiles on user removal; `SET_NULL` protection on application notifications to preserve alert history if an application record is pruned.

### Applying Migrations
Run migrations within the backend environment:

```bash
# Inside Docker container
docker exec job_portal_backend python manage.py makemigrations
docker exec job_portal_backend python manage.py migrate

# Or on local system
cd backend
python manage.py makemigrations
python manage.py migrate
```

---

## 9. Installation & Running Instructions

### Option A: Quick Start with Docker Compose (Recommended)

1. **Clone and navigate to repository**:
   ```bash
   git clone <repository-url>
    cd HirePulse
    cd job-portal
   
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

3. **Start all services**:
   ```bash
   docker compose up --build
   ```

4. **Verify container status**:
   ```bash
   docker compose ps
   ```

5. **Access services**:
   - **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
   - **Backend REST API**: [http://localhost:8000/api/](http://localhost:8000/api/)
   - **Interactive Swagger Documentation**: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
   - **Redoc API Specifications**: [http://localhost:8000/api/redoc/](http://localhost:8000/api/redoc/)
   - **Django Admin Panel**: [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

### Option B: Local Development Setup (Without Docker)

#### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL 15+ running locally with database `job_portal`

#### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser / admin
python manage.py createsuperuser

# Start development server
python manage.py runserver 0.0.0.0:8000
```

#### 2. Frontend Setup
```bash
cd frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend will start on [http://localhost:3000](http://localhost:3000) with automatic proxying to [http://localhost:8000](http://localhost:8000).

---

## 10. Automated Testing

The backend includes a comprehensive automated test suite covering authentication, permissions, job posting/search, application workflows, and dashboard statistics:

```bash
# Run tests inside Docker container
docker exec job_portal_backend python manage.py test

# Run tests locally
cd backend
python manage.py test
```

To validate the frontend build bundle:
```bash
cd frontend
npm run build
```


## 11. License & Attribution

HirePulse Recruitment & Career Portal — Enterprise Software System. All rights reserved.
