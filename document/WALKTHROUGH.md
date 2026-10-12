# HirePulse — Complete System Walkthrough & Operational Guide

---

## 1. Executive Summary & Architectural Overview

**HirePulse** is an enterprise-grade Recruitment Management and Job Portal System built upon a decoupled modern architecture. The system orchestrates candidate talent acquisition, recruiter vacancy management, and administrator moderation within an isolated multi-container Docker environment:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HIREPULSE SYSTEM ARCHITECTURE                    │
└────────────────────────────────────────────────────────────────────────┘

  [ Web Client / Browser ]
           │
           │  Port 3000 (Host)
           ▼
  ┌────────────────────────────────────────────────────────┐
  │ FRONTEND CONTAINER (job_portal_frontend)               │
  │ • Nginx Alpine Web Server (Port 80 -> Host 3000)       │
  │ • Serves React 18 + Vite Production SPA Bundle         │
  │ • Axios with Automatic JWT Rotation Interceptors       │
  │ • Role-Based Protected Routes (Admin/Recruiter/Cand.)  │
  └────────┬───────────────────────────────────┬───────────┘
           │ /api/                             │ /media/
           ▼                                   ▼
  ┌────────────────────────────────────────────────────────┐
  │ BACKEND CONTAINER (job_portal_backend)                 │
  │ • Django 4.2 LTS + Django REST Framework (Port 8000)   │
  │ • SimpleJWT Token Auth (Bearer Token Rotation)         │
  │ • PostgreSQL Full-Text Search (SearchVector + GIN)     │
  │ • drf-spectacular (OpenAPI 3.0 & Swagger UI)           │
  │ • Candidate Photo & Resume Upload Verification         │
  │ • Automated In-App & Email Notifications Dispatch      │
  │ • Volume: media_volume mounted at /app/media           │
  └────────────────────────┬───────────────────────────────┘
                           │ Port 5432 (Internal)
                           ▼
  ┌────────────────────────────────────────────────────────┐
  │ DATABASE CONTAINER (job_portal_db)                     │
  │ • PostgreSQL 16 Alpine                                 │
  │ • GIN Indexing on Search Vectors                       │
  │ • Relational Integrity & Duplicate Application Guards  │
  │ • Volume: postgres_data mounted at /var/lib/postgresql │
  └────────────────────────────────────────────────────────┘
```

---

## 2. Live Services & Access Points

| Component | Target URL | Description |
| :--- | :--- | :--- |
| **Frontend Web Application** | [http://localhost:3000](http://localhost:3000) | Full responsive React single-page application |
| **Backend REST API** | [http://localhost:8000/api/](http://localhost:8000/api/) | Core Django REST Framework endpoints |
| **Interactive Swagger UI** | [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/) | OpenAPI 3.0 interactive API documentation |
| **Redoc Documentation** | [http://localhost:8000/api/redoc/](http://localhost:8000/api/redoc/) | Detailed API reference specifications |
| **Django Admin Panel** | [http://localhost:8000/admin/](http://localhost:8000/admin/) | Low-level ORM administration interface |

---

## 3. Pre-Seeded Test Credentials

The database contains demo accounts representing each system role:

| Role | Email | Password | Organization / Profile Context |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@hirepulse.com` | `AdminPass123!` or `Pass@12345` | Global platform oversight, user moderation, recruitment funnel |
| **Recruiter (ABC Tech)** | `recruiter1@abctech.com` | `TestPassword123!` | ABC Technologies (Custom emerald branding cover, logo, active jobs) |
| **Recruiter (XYZ Solutions)** | `recruiter2@xyzsolutions.com` | `TestPassword123!` | XYZ Solutions (Custom sapphire branding cover, logo, active jobs) |
| **Candidate** | `candidate@example.com` | `CandidatePass123!` | Verified candidate profile with resume and applications |
| **Candidate 2** | `alex.miller@example.com` | `CandidatePass123!` | Full-stack developer profile with skills and experience |

---

## 4. Complete Page-by-Page Functional Breakdown

HirePulse features **25 verified routes** registered in `frontend/src/App.jsx`, organized into four functional groups:

### A. Public Pages (Accessible to All)
1. **Home (`/`)**: High-converting landing page featuring the hero search bar, live platform statistics (active jobs, companies, candidates), categorized industry cards, and featured positions.
2. **Login (`/login`)**: Universal login form supporting all roles. Issues JWT `access` and `refresh` tokens and automatically redirects to the appropriate role dashboard.
3. **Register (`/register` & `/register?role=recruiter`)**: Dual-flow registration system supporting separate Candidate and Recruiter onboarding workflows. Candidates enter contact details and advance to onboarding, while Recruiters register company branding, designation, location, and website to immediately access employer tools.
4. **Forgot Password (`/forgot-password`)**: Requests a password reset link sent to the user's email address.
5. **Reset Password (`/reset-password`)**: Form to validate reset tokens and set a new password.
6. **Reset Password with Token (`/reset-password/:uid/:token`)**: Direct email link handler for password recovery.
7. **Job Listings (`/jobs`)**: Public job catalog featuring PostgreSQL full-text keyword search, multi-filters (Category, Job Type, Experience Level, Location), Active/Closed status toggling, and the redesigned 2-column job cards.
8. **Job Details (`/jobs/:id`)**: Comprehensive view of role requirements, Indian Rupee salary (`₹`), company branding banner, and the **Apply Modal** allowing candidates to upload a resume or select their profile resume.

### B. Candidate Portal (Role: `candidate`)
9. **Candidate Onboarding (`/candidate-onboarding` & `/candidate/onboarding`)**: Streamlined profile setup wizard guiding new candidates through personal details, resume upload, and skill selection.
10. **Candidate Dashboard (`/candidate/dashboard`)**: Stage metrics (Applied, Shortlisted, Interview, Rejected), profile completion progress bar, quick action shortcuts, and personalized recommended jobs.
11. **Candidate Profile (`/candidate/profile`)**:
    - **Profile Picture Upload**: In EDIT mode, a dedicated upload card enables candidates to upload/change their profile photo (JPG, PNG, WEBP max 5MB) with instant preview and backend persistence.
    - **Quick Avatar Upload**: In VIEW mode, a camera badge directly on the circular avatar allows one-click profile picture updates.
    - **Resume & Career History**: Verified PDF resume viewer/downloader, skill tags, repeatable work experience, education history, and social links.
12. **My Applications (`/candidate/applications`)**: Status tracker displaying applied jobs with color-coded badges (`Applied`, `Shortlisted`, `Interview`, `Hired`, `Rejected`), submitted cover letters, and applied dates.

### C. Recruiter Portal (Role: `recruiter`)
13. **Recruiter Dashboard (`/recruiter/dashboard`)**: Real-time KPI summary (Total Jobs, Active Listings, Total Applicants, Status Distribution chart, and recent applicants feed).
14. **Recruiter Profile (`/recruiter/profile`)**: Company visual branding hub allowing recruiters to upload a **Company Banner Cover Image**, **Company Logo Avatar**, select brand theme hex colors, and update company overviews.
15. **Create Job (`/recruiter/create-job`)**: Job publishing interface with category, employment type, location, remote toggle, Indian currency salary range (`₹`), requirements, and closing date.
16. **Manage Jobs (`/recruiter/jobs`)**: Vacancies table with Active/Closed status toggling, applicant count badges, and direct links to view applicants or edit postings.
17. **Edit Job (`/recruiter/jobs/:id/edit`)**: Form to modify existing job specifications, requirements, or closing dates.
18. **Applicant Review Pipeline (`/recruiter/applicants`)**: Candidate screening workflow. Filter applicants by job and stage, view profile summaries, view/download submitted PDF resumes, and advance candidate statuses (`Shortlisted`, `Interview`, `Hired`, `Rejected`).
19. **Candidate Search (`/recruiter/candidates`)**: Talent discovery search engine allowing recruiters to search candidates by name, technical skills, and experience keywords, with candidate profile photos displayed in search cards and modal details.

### D. Admin Portal (Role: `admin`)
20. **Admin Dashboard (`/admin/dashboard`)**: Platform-wide metrics: total registered users broken down by role, total jobs, total applications, and hiring conversion rates.
21. **Recruiter Management (`/admin/recruiters`)**: Directory of verified recruiter organizations and their posted vacancies.
22. **Add Recruiter (`/admin/recruiters/add`)**: Dedicated form for administrators to create and onboard a new verified recruiter account with company information.
23. **User Management (`/admin/users`)**: Search platform users, change user roles (`Candidate`, `Recruiter`, `Admin`), and toggle account active/inactive status.
24. **Job Moderation (`/admin/jobs`)**: Platform-wide oversight of all vacancies across all companies with direct status controls.
25. **Application Management (`/admin/applications`)**: Global audit trail and review of all candidate applications.
26. **Hiring Funnel Analytics (`/admin/hiring`)**: Recruitment conversion funnel visualization (`Applied` → `Shortlisted` → `Interview` → `Hired`) and distribution by job category.

---

## 5. End-to-End Hands-on Operational Walkthrough

Follow this step-by-step procedure to test the complete recruitment lifecycle across all three roles:

### Step 1: Candidate Job Search & Job Card Verification
1. Open your browser and navigate to **[http://localhost:3000/jobs](http://localhost:3000/jobs)**.
2. Inspect the redesigned job card layout:
   - **Company Banner**: Full-width cover image spanning edge-to-edge at the top with top rounded corners.
   - **Company Logo**: Crisp white rounded container overlapping the bottom-right corner of the banner into the card body.
   - **Openings Badge**: Left-aligned "Multiple openings" pill badge below the banner.
   - **Job Information**: Bold title link, company name, and location with `MapPin` icon.
   - **Action Controls**: Bookmark icon button and Thumbs Down / Not Interested icon button on the right.
   - **Tags Row**: Badges for Job Type, Experience Level, and Green Indian Rupee (`₹`) Salary Range.
   - **Activity Insights Box**: Light-blue tinted bottom container displaying response speed, applicant count, and early applicant status.
3. Test search and filtering:
   - Type `"React"` or `"Developer"` into the keyword input.
   - Toggle between **Active Jobs** and **Closed Jobs**.
   - Notice the instant, reactive filtering without page reload.

---

### Step 2: Candidate Profile & Profile Picture Upload
1. Navigate to **[http://localhost:3000/login](http://localhost:3000/login)** and sign in as Candidate:
   - **Email**: `candidate@example.com`
   - **Password**: `CandidatePass123!`
2. Navigate to **Candidate Profile** (`/candidate/profile`):
   - Notice the candidate header card displaying the candidate's name, email, location, phone, and avatar.
3. Click the **Edit Profile** button:
   - In the **Basic Information** card, notice the dedicated **Candidate Profile Picture** section.
   - Click **Upload Photo** (or **Change Photo**) and select an image file (JPG, PNG, or WEBP).
   - Notice the instant live circular preview of the selected image.
   - Fill in or update phone number, location, bio, or skills.
   - Click **Save Profile**.
4. A success toast confirms: `"Candidate profile updated successfully!"`.
5. The view switches back to VIEW mode, displaying the candidate's newly uploaded profile photo in the circular avatar with a subtle border and shadow.
6. The profile picture is permanently saved in the backend database and stored in `media/profile_pictures/candidates/`.

---

### Step 3: Candidate Job Application Submission
1. Navigate to **Find Jobs** (`/jobs`).
2. Click on a job posting (e.g. *Senior React Developer* at *ABC Technologies*).
3. On the **Job Details** page (`/jobs/:id`), review the role overview and click **Apply Now**.
4. In the application modal:
   - Enter a brief cover letter explaining your qualifications.
   - Submit with your active profile resume or upload a custom PDF.
   - Click **Submit Application**.
5. A confirmation toast confirms submission.
6. Navigate to **My Applications** (`/candidate/applications`):
   - Verify the new submission appears with status **Applied**.
7. If you try to apply again for the same job, the system disables the button and informs you that you have already applied.

---

### Step 4: Recruiter Review & Status Advancement
1. Log out by clicking the user menu in the top navbar and selecting **Log Out**.
2. Sign in as Recruiter:
   - **Email**: `recruiter1@abctech.com`
   - **Password**: `TestPassword123!`
3. Check the **Recruiter Dashboard** (`/recruiter/dashboard`):
   - Notice the updated applicant counts and status distribution chart.
4. Navigate to **Applicants Pipeline** (`/recruiter/applicants`):
   - Filter by Job: **Senior React Developer**.
   - Locate the candidate's application.
   - Click **View** to inspect the submitted PDF resume in a new tab, or **Download** to save it locally.
   - In the status dropdown, change the status from `Applied` to **Shortlisted**, then to **Interview**, and finally to **Hired**.
   - A success notification confirms the status transition.
5. In the background, the notification service creates an in-app alert and dispatches an automated notification email to the candidate.

---

### Step 5: Recruiter Candidate Search
1. While logged in as Recruiter, navigate to **Candidate Search** (`/recruiter/candidates`).
2. Search by skill keyword (e.g. `"React"` or `"Python"`).
3. Notice that candidate cards display candidate profile photos (or initials if none uploaded) along with location, skills, and links.
4. Click on a candidate card to view their full profile in the details modal, including their photo, contact information, education, and resume.

---

### Step 6: Candidate Notification & Tracker Verification
1. Log out and sign back in as `candidate@example.com` / `CandidatePass123!`.
2. Notice the notification counter badge on the bell icon in the top header.
3. Click the bell icon to open the notifications dropdown:
   - An alert states that your application status has been updated to **Hired**.
   - Click **Mark All as Read** to clear the counter.
4. Navigate to **My Applications** (`/candidate/applications`):
   - Confirm that your application status badge now displays **Hired** in green.

---

### Step 7: Administrator Platform Governance
1. Log out and sign in as Administrator:
   - **Email**: `admin@hirepulse.com`
   - **Password**: `AdminPass123!` (or `Pass@12345`)
2. Review the **Admin Dashboard** (`/admin/dashboard`):
   - Platform-wide statistics aggregated from PostgreSQL: Total Users, Active Jobs, Total Applications, and Conversion Rate.
3. Navigate to **User Management** (`/admin/users`):
   - Search for any user by name or email.
   - Toggle account status between Active and Deactivated.
   - Change user roles if necessary.
4. Navigate to **Hiring Overview** (`/admin/hiring`):
   - Inspect the global recruitment funnel (`Applied` → `Shortlisted` → `Interview` → `Hired`) dynamically reflecting the recent placement.

---

## 6. How the Frontend Connects to the Backend

### 1. Request Interception & Bearer Token Injection
Every outgoing HTTP request made through `frontend/src/services/api.js` automatically retrieves the access token from `localStorage` (`hirepulse_access_token`) and injects the authorization header:
```http
Authorization: Bearer <access_token>
```

### 2. Automatic Token Refresh Rotation
If an API request returns `401 Unauthorized` (indicating the short-lived access token has expired), the Axios response interceptor:
1. Catches the 401 response and queues any simultaneous requests.
2. Retrieves the long-lived refresh token from `localStorage` (`hirepulse_refresh_token`).
3. Sends a `POST` request to `/api/auth/token/refresh/`.
4. Saves the newly issued access token into `localStorage`.
5. Retries the original failed request with the new token.
6. If the refresh token is also invalid or expired, clears storage and redirects to `/login`.

### 3. Multipart File Upload Handling
For binary file uploads (candidate profile photos, PDF resumes, company banners, and logos), the frontend packages fields into a `FormData` object. The `candidateService` and `recruiterService` pass `{ headers: { 'Content-Type': 'multipart/form-data' } }`, which Django REST Framework's `MultiPartParser` and `FormParser` process and store into `/app/media/`.

### 4. Reverse Proxying
- **In Docker Production**: Nginx listens on port 80 (mapped to host 3000). Requests to `/` serve the compiled React SPA, while `/api/*` and `/media/*` are proxied to `http://backend:8000/`.
- **In Local Vite Dev**: `vite.config.js` proxies `/api` and `/media` directly to `http://localhost:8000`.

---

## 7. Useful Diagnostic & Maintenance Commands

### Docker Container Operations
```powershell
# Check status and health of all containers
docker compose ps

# View live backend application logs
docker compose logs -f backend

# View live frontend web server logs
docker compose logs -f frontend

# Restart all services without losing data
docker compose restart

# Stop containers gracefully
docker compose down

# Stop containers and wipe database volume completely (Fresh reset)
docker compose down -v
```

### Database Operations
```powershell
# Run pending database migrations
docker exec job_portal_backend python manage.py migrate

# Generate new migration files if models change
docker exec job_portal_backend python manage.py makemigrations

# Create a new superuser manually
docker exec -it job_portal_backend python manage.py createsuperuser

# Re-run recruiter test seed script
docker exec job_portal_backend python setup_test_recruiters.py
```

### Automated Testing
```powershell
# Run backend Django test suite
docker exec job_portal_backend python manage.py test

# Validate frontend production build
cd frontend
npm run build
```
