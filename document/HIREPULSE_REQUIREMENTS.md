# HirePulse — Requirements & Scope Document

**Product:** HirePulse Recruitment Management System  
**Document purpose:** Define the functional scope, role responsibilities, data rules, and acceptance criteria for the existing HirePulse project.  
**Technology baseline:** Use the stack already present in the repository. This document does not authorize a framework or database migration.

---

## 1. Project Overview

HirePulse is a web-based recruitment platform connecting candidates with recruiters and providing administrative control over users, jobs, and recruitment activity. It supports job discovery, job posting, candidate applications, application status tracking, notifications, and role-based dashboards.

The implementation source of truth is the current repository, Django models/migrations, API views/serializers/permissions, frontend pages, and tests. If a feature described here is not present in the repository, treat it as a requirement to verify or plan—not proof that it is already implemented.

## 2. Roles

### 2.1 Candidate
A candidate should be able to:
- Register and sign in using the public candidate registration flow.
- Manage their own candidate profile.
- Maintain contact details, location, skills, education, experience, LinkedIn/portfolio links, profile picture, and resume where supported.
- Browse and search available jobs, using supported filters.
- View job details.
- Apply to a job with a cover letter and resume where supported.
- Avoid duplicate applications to the same job.
- View and track their own applications and their current status.
- Receive and manage their own notifications.

### 2.2 Recruiter
A recruiter should be able to:
- Register through the approved public recruiter registration flow.
- Maintain their own recruiter and company profile.
- Create, update, list, and close jobs they own, according to the implemented permissions and status rules.
- View applicants for their own jobs.
- Review application details and resumes only where authorized.
- Update application status using supported status values.
- Receive notifications for relevant applications.
- View recruiter dashboard metrics for their own recruitment activity.

### 2.3 Admin
An admin should be able to use the explicitly implemented administrative features to:
- Manage users and their active state/roles where authorized.
- Review and manage recruiter accounts according to the project's restrictions.
- Moderate jobs and applications using authorized operations.
- View platform-level dashboard metrics that are implemented.
- Access administrative endpoints only with server-side admin permission.

Admin access to private candidate data or notifications must follow explicit permissions; it must not be assumed from the existence of an admin role alone.

## 3. Technology and Architecture Constraints

Keep the existing project stack:
- Frontend: React 18, Vite, React Router, Axios.
- Backend: Python, Django, Django REST Framework.
- Authentication: `djangorestframework-simplejwt`.
- Database: PostgreSQL 16.
- API schema: `drf-spectacular`, where configured.
- Runtime: Docker Compose with backend, frontend/Nginx, and PostgreSQL services.

Do not introduce FastAPI, SQLAlchemy, Alembic, Redis/Celery, a mobile app, or a new database as part of ordinary fixes. Any architectural expansion requires separate approval.

## 4. Functional Modules

### 4.1 Authentication and Accounts
- Candidate and recruiter public registration.
- Login and logout.
- JWT access/refresh token handling.
- Current-user/profile retrieval.
- Password change and password-reset endpoints where configured.
- Role-based access enforced by the backend.
- Recruiter account creation must follow the agreed registration policy; alternate creation paths must not bypass it.
- Email uniqueness is enforced by the user model.

**Acceptance criteria**
- Invalid credentials do not reveal whether an email exists.
- Public registration cannot self-assign admin privileges.
- A logged-in user can access only operations allowed for their role.
- Refresh-token behavior is tested, including refresh failure.

### 4.2 Candidate Profile
Supported profile data includes phone, bio, profile picture, skills, education, experience, resume, location, LinkedIn URL, and portfolio URL.

**Acceptance criteria**
- Candidate can read/update their own profile.
- A recruiter or unrelated user cannot modify it through candidate-only endpoints.
- Resume/file uploads are validated and private resumes are served through an authorized route.
- Profile creation is consistent and does not create duplicate one-to-one profiles.

### 4.3 Recruiter and Company Profile
Supported data includes company name, description, website, location, logo, banner, brand color, phone, and recruiter position.

**Acceptance criteria**
- Recruiters can manage their own profile.
- Candidate accounts cannot use recruiter-only profile operations.
- Company branding uploads are validated.
- A recruiter cannot use profile/job endpoints to act as another recruiter.

### 4.4 Job Posting
The current `Job` model supports:
- Recruiter ownership.
- Title and description.
- Required skills.
- Category and location.
- Optional minimum/maximum salary.
- Experience level and job type.
- Active/closed status.
- Optional closing date.
- Search vector and timestamps.

Existing choices include job types `full-time`, `part-time`, and `remote`; experience levels `fresher`, `0-2`, `2-5`, `5-8`, and `8+`; and categories defined in the model.

**Acceptance criteria**
- Public job search returns only jobs eligible for public display.
- Recruiters can manage only their own jobs.
- Salary values cannot be negative; maximum salary cannot be lower than minimum salary.
- Closing-date rules are enforced by API validation, not only by `Model.clean()`.
- Closing a job prevents new applications according to the agreed business rule.
- Search and filters return consistent results and respect pagination where configured.

### 4.5 Applications and Hiring Pipeline
The current `Application` model links a `CandidateProfile` to a `Job`, supports an optional application resume and cover letter, and records status and timestamps.

Existing statuses:
- `applied`
- `shortlisted`
- `interview`
- `rejected`
- `hired`

A database uniqueness constraint prevents more than one application per candidate/job pair.

**Acceptance criteria**
- Candidates can apply only as themselves and only to eligible jobs.
- Duplicate applications are rejected safely, including concurrent requests.
- Candidates can view only their own applications.
- Recruiters can view/update applications only for jobs they own.
- Status updates accept only supported values and enforce any approved transition rules.
- Application status and its required notification side effect remain consistent if a write fails.

### 4.6 Notifications
The current `Notification` model supports recipient user, optional application, title, message, type, read state, and creation timestamp.

Existing types include `status_change`, `application_received`, `job_alert`, and `system`.

**Expected scope**
- Candidate receives relevant application-status notifications.
- Recruiter receives relevant new-application notifications.
- Notifications identify the correct recipient and, where applicable, the relevant application.
- Users can list their own notifications, mark one as read, and mark all their notifications as read.
- Unread counts and read state remain consistent with the API/frontend implementation.

Do not assume every notification type is generated automatically or that admins receive all notifications unless confirmed in the code and product requirements.

### 4.7 Dashboards and Analytics
- Candidate dashboard: own application activity and relevant status information.
- Recruiter dashboard: recruiter-owned jobs, applicant activity, and hiring metrics.
- Admin dashboard: platform-wide metrics available through authorized admin APIs.

Dashboard queries must apply role and ownership filters. Counts and charts should agree with the underlying records.

### 4.8 Admin User, Recruiter, Job, and Application Management
- Restrict management endpoints to authorized admin users.
- Validate role changes and account activation/deactivation.
- Preserve the agreed restriction that recruiter accounts are created through public registration rather than bypass paths.
- Do not expose passwords, token values, or private file paths in API responses.

## 5. Core Data Model

| Model/table (Django default naming) | Purpose | Key relationships |
|---|---|---|
| `accounts_user` (`User`) | Login identity and global role | One-to-one with candidate or recruiter profile as applicable; owns notifications |
| `accounts_candidateprofile` (`CandidateProfile`) | Candidate details and resume | One-to-one with `User`; has many applications |
| `accounts_recruiterprofile` (`RecruiterProfile`) | Recruiter and company details | One-to-one with `User`; has many jobs |
| `jobs_job` (`Job`) | Job posting | Belongs to `RecruiterProfile`; has many applications |
| `applications_application` (`Application`) | Candidate's application to a job | Belongs to `CandidateProfile` and `Job`; can be referenced by notifications |
| `notifications_notification` (`Notification`) | User-facing notification | Belongs to `User`; optionally references `Application` |

Use the current models and migrations as the definitive schema. Do not create additional tables merely because a generic recruitment product might have them.

## 6. Security and Privacy Requirements

- Authentication is required for protected endpoints.
- Enforce roles and object ownership on the backend; frontend route guards are not sufficient.
- Candidate/recruiter cross-role profile access must be denied.
- Recruiters must not access another recruiter's jobs or applicants.
- Candidates must not access other candidates' applications, resumes, or private notifications.
- Protect resume files from unrestricted public access and path traversal.
- Validate uploads for allowed type and size; do not trust file names or extensions alone.
- Use Django ORM/parameterized queries; do not build SQL by string concatenation.
- Keep secrets in environment configuration and out of version control.
- Never log passwords, access/refresh tokens, or sensitive resume content.
- Return safe errors without production stack traces.
- Apply throttling to authentication and other sensitive endpoints where configured/required.

## 7. Non-Functional Requirements

- Responsive interface for desktop and mobile-sized browsers.
- Consistent validation messages and loading/error/empty states.
- Pagination/filtering for large result lists where configured.
- PostgreSQL constraints and indexes must preserve data integrity and support actual query patterns.
- Docker Compose must start the application reproducibly with persistent database and media storage.
- Maintainable, focused modules; avoid duplicated business rules.
- Keep existing API contracts stable unless a change is explicitly approved.

## 8. Out of Scope Unless Separately Approved

Do not assume the following are included just because they exist in other job portals:
- Multi-company tenancy or company switching.
- Billing, payments, subscriptions, or invoicing.
- Native Android/iOS applications.
- Chat/video interview infrastructure.
- External ATS integrations.
- AI resume ranking or automatic candidate selection.
- Background queues or Redis/Celery.
- Email/SMS delivery beyond what the current project actually configures.
- Saved/bookmarked jobs or hidden jobs unless confirmed in current implementation and scope.

## 9. Suggested Delivery Sequence

1. Authentication, registration, role enforcement, and JWT refresh.
2. Candidate/recruiter profiles and secure uploads.
3. Job posting, search, filters, and ownership checks.
4. Application submission and duplicate prevention.
5. Recruiter applicant review and status changes.
6. Notifications for relevant application events.
7. Role-based dashboards and admin management.
8. Full regression testing, Docker verification, and deployment hardening.

This sequence is a planning reference, not a claim that the modules are currently incomplete.

## 10. Definition of Done

A change is complete when:
1. The current behavior and requirement are understood.
2. The smallest necessary implementation change is made.
3. Relevant automated tests pass, or failures are explained and investigated.
4. Role and ownership permissions are tested.
5. Manual test steps are completed for user-facing behavior.
6. No unrelated workflows are changed.
7. Required migrations/documentation are included.
8. The application still builds and runs through Docker Compose.
