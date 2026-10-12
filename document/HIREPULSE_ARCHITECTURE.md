# HirePulse Architecture

> Recruitment Management Platform --- Architecture and Development
> Rules\
> This document describes the existing HirePulse project. Verify
> implementation in code before changing it; do not introduce a new
> stack or duplicate existing functionality.

## 1. Project Overview

HirePulse is a recruitment platform with three roles: - **Candidate**
--- manages a candidate profile, searches jobs, applies, uploads a
resume, tracks applications, and receives notifications. - **Recruiter**
--- maintains company/recruiter information, manages job postings,
reviews applicants, changes application statuses, and receives relevant
notifications. - **Admin** --- manages platform users and administrative
operations through authorized admin features.

The application uses a React web frontend, Django REST Framework
backend, PostgreSQL database, JWT authentication, and Docker Compose.

## 2. Existing Technology Stack

  -----------------------------------------------------------------------
  Layer                               Existing technology
  ----------------------------------- -----------------------------------
  Frontend                            React 18, Vite, JavaScript/JSX,
                                      React Router

  API client                          Axios
                                      (`frontend/src/services/api.js`)

  Backend                             Python, Django 5.x, Django REST
                                      Framework

  Authentication                      `djangorestframework-simplejwt`
                                      (JWT access/refresh tokens)

  API documentation                   `drf-spectacular`

  Database                            PostgreSQL 16

  Search                              PostgreSQL full-text search support
                                      using `SearchVectorField` and a GIN
                                      index

  Containers                          Docker and Docker Compose

  Web serving                         Frontend container with Nginx

  Backend media                       Django media storage mounted
                                      through Docker volume
  -----------------------------------------------------------------------

**Architecture rule:** Keep the current stack. Do not replace Django
with FastAPI, React with another framework, PostgreSQL with another
database, or JWT with a different authentication scheme without an
explicitly approved architectural decision.

## 3. High-Level Architecture

``` text
Browser
  |
  v
React + Vite frontend (served by Nginx)
  |
  | HTTP/JSON + JWT
  v
Django REST Framework API
  |
  +--> Accounts
  |      User, CandidateProfile, RecruiterProfile
  |
  +--> Jobs
  |      Job posting, search, filters, recruiter ownership
  |
  +--> Applications
  |      Candidate-job application, resume, status workflow
  |
  +--> Notifications
  |      Recipient, optional application, type, read state
  |
  v
PostgreSQL 16

Docker Compose coordinates PostgreSQL, backend, and frontend.
```

## 4. Project Structure

The exact files in the repository are authoritative. The main expected
layout is:

``` text
job-portal/
├── backend/
│   ├── accounts/          # User model, profiles, registration, permissions
│   ├── jobs/              # Job model, job APIs, search and filtering
│   ├── applications/      # Application model and status workflow
│   ├── notifications/     # Notification model and APIs
│   ├── config/            # Django settings and root URLs
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── services/api.js
│   └── ...
├── docker-compose.yml
├── .env.example
└── ARCHITECTURE.md
```

Do not create a new app, service layer, repository layer, or duplicate
API client solely to match this example. First check the current
repository structure and conventions.

## 5. Core Database Model

The following describes the models found in the supplied HirePulse
project files. Field details should always be checked against the
current model code and migrations.

### 5.1 Accounts

**`accounts_user` --- `User`** - Primary identifier: Django model
primary key. - `email`: unique email used as the login identifier. -
`first_name`, `last_name` - `role`: `admin`, `recruiter`, or
`candidate` - `is_active`, `is_staff` - `created_at`, `updated_at`

The custom user model uses email as `USERNAME_FIELD`.

**`accounts_candidateprofile` --- `CandidateProfile`** - One-to-one
relationship with `User`, cascading on user deletion. - Contact details,
bio, profile picture, skills, education, experience, resume, location,
LinkedIn URL, portfolio URL, timestamps.

**`accounts_recruiterprofile` --- `RecruiterProfile`** - One-to-one
relationship with `User`, cascading on user deletion. - Company name,
description, website, location, logo, banner, brand color, phone,
position, timestamps.

A profile is associated with one user. Enforce role checks at the API
permission/view boundary; a candidate must not access recruiter profile
operations and vice versa.

### 5.2 Jobs

**`jobs_job` --- `Job`** - Foreign key to `RecruiterProfile`
(`recruiter`), with related name `jobs`. - Title, description, required
skills, category, location. - Optional minimum and maximum salary. -
Experience level, job type, status, optional closing date. - Search
vector and timestamps.

Existing choices include: - Job type: full-time, part-time, remote. -
Status: active, closed. - Experience: fresher, 0--2, 2--5, 5--8, 8+
years. - Categories are defined in the `Job` model.

Existing indexes include a GIN index on `search_vector`, status/created
date, category/status, job type/status, and experience/status.

The model's `clean()` method defines checks for negative salary, maximum
salary below minimum salary, and a closing date in the past. Verify that
API serializers/services enforce the required checks for actual API
writes; Django does not automatically call `full_clean()` on every
ordinary `save()`.

### 5.3 Applications

**`applications_application` --- `Application`** - Foreign key to
`CandidateProfile`. - Foreign key to `Job`. - Optional application
resume and cover letter. - Status and timestamps.

Existing statuses: `applied`, `shortlisted`, `interview`, `rejected`,
`hired`.

A database unique constraint on `(candidate, job)` prevents duplicate
applications. Existing indexes support status/date, candidate/status,
and job/status queries.

Application status changes must be authorized and validated server-side.
Notifications should be created consistently with the status transition
and must reference the correct recipient and application.

### 5.4 Notifications

**`notifications_notification` --- `Notification`** - Foreign key to
recipient `User`. - Optional foreign key to `Application`, set to null
if the application is deleted. - Title, message, notification type, read
state, creation timestamp.

Existing notification types: `status_change`, `application_received`,
`job_alert`, `system`.

An index supports `(user, is_read)` and another supports `created_at`.
Users must only retrieve or modify notifications they are authorized to
access. Admin capabilities must follow explicit permissions rather than
implicit access to every user's private notifications.

## 6. Main Relationships

``` text
User 1 ─── 0..1 CandidateProfile
User 1 ─── 0..1 RecruiterProfile

RecruiterProfile 1 ─── many Job
CandidateProfile 1 ─── many Application
Job 1 ─── many Application

User 1 ─── many Notification
Application 1 ─── 0..many Notification
```

The one-to-one profile relationships are conditional on user role and
profile creation rules. Do not assume every user must have both profile
types. The database model's exact nullability and deletion behavior are
authoritative.

## 7. Role and Access Rules

### Candidate

-   Can view public/eligible active job listings.
-   Can manage their own candidate profile.
-   Can submit one application per job.
-   Can view their own applications and application statuses.
-   Can access and mark their own notifications as read.
-   Cannot create or manage jobs as a recruiter.
-   Cannot read another candidate's private profile, resume,
    applications, or notifications.

### Recruiter

-   Can manage their own recruiter/company profile.
-   Can create, update, close, and manage jobs owned by their recruiter
    profile, subject to application rules.
-   Can view applicants for jobs they own.
-   Can update application statuses only for applications associated
    with their own jobs.
-   Can receive notifications for relevant applications.
-   Cannot access or change another recruiter's jobs or applicants.

### Admin

-   Can perform only the administrative operations explicitly
    implemented and authorized.
-   Admin-only APIs must enforce server-side permissions.
-   Public registration must not allow a user to self-assign the admin
    role.
-   Recruiter creation policy: use the approved public registration
    flow. Django Admin or other alternative creation paths must not
    bypass the agreed restriction.
-   Do not assume admin receives every application notification unless
    that feature is specified and implemented.

**Security rule:** Hiding a frontend button is not authorization.
Validate user role, object ownership, and allowed state transitions on
the backend.

## 8. Authentication and Session Handling

-   Use the existing Simple JWT configuration.
-   Access tokens should be short-lived according to configured
    settings; refresh behavior must follow the implementation and
    deployment configuration.
-   Keep token handling consistent with the current frontend API client
    and backend authentication settings.
-   On refresh failure, clear invalid session state and require login
    gracefully.
-   Do not log passwords, access tokens, refresh tokens, or secrets.
-   Public registration, login, refresh, and other endpoints must have
    explicitly reviewed permissions and throttling where appropriate.
-   Never trust a role or user ID supplied by the browser when the
    authenticated identity is available from the JWT/request user.

## 9. API Conventions

-   Preserve existing endpoint paths and response formats unless an API
    change is explicitly approved.
-   Use Django REST Framework serializers for request/response
    validation.
-   Use permissions and filtered querysets to enforce role and ownership
    restrictions.
-   Return appropriate HTTP status codes: `400` validation error, `401`
    unauthenticated, `403` forbidden, `404` not found, `409` where
    explicitly used for conflicts, and `5xx` for unexpected server
    failures.
-   List endpoints should paginate where configured and apply
    filtering/search consistently.
-   Avoid duplicating business rules in models, serializers, views, and
    services. First identify the current source of truth and consolidate
    carefully without weakening validation.
-   Do not leak stack traces or internal details in production
    responses.

## 10. Business Workflows

### Candidate application

1.  Candidate authenticates.
2.  Candidate selects an eligible job and submits an application.
3.  Backend validates job availability and prevents duplicate
    candidate-job applications.
4.  Application and relevant notification records are created according
    to the existing workflow.
5.  Candidate can track the application and see status changes.

### Recruiter job management

1.  Recruiter authenticates and completes their recruiter/company
    profile.
2.  Recruiter creates a job associated with their own
    `RecruiterProfile`.
3.  Backend validates salary range, job status, closing date, and
    required fields.
4.  Public job search returns only jobs eligible for display.
5.  Only the owning recruiter or an explicitly authorized admin can
    manage the job.

### Application status update

1.  Recruiter requests a valid status transition for an application
    belonging to one of their jobs.
2.  Backend checks authentication, ownership, and allowed transition.
3.  Status is persisted.
4.  A candidate notification is created with the correct application
    reference and status information.
5.  Tests verify both the status change and notification side effect.

### Notifications

-   Candidate notifications cover relevant application updates.
-   Recruiter notifications cover relevant new applications and other
    implemented recruiter events.
-   System/admin notifications should only be added where explicitly
    supported.
-   Ensure correct recipient, application reference, unread state, and
    ownership checks.
-   Avoid duplicate notifications for a single event unless intentional.

## 11. Database and Migration Rules

-   PostgreSQL is the source of truth for persistent data.
-   Model changes must be accompanied by Django migrations.
-   Create migrations using Django's `makemigrations` and apply them
    using `migrate`.
-   Do not edit production database schema manually or delete volumes to
    resolve ordinary migration issues.
-   Preserve existing data and inspect migration plans before applying
    destructive changes.
-   Unique constraints and indexes should be represented in model
    metadata and migrations.
-   Review foreign-key deletion behavior deliberately; do not change
    `CASCADE`/`SET_NULL`/`PROTECT` semantics without assessing the
    workflow.
-   Test migrations against a safe development/test database before
    deployment.

## 12. File Uploads

HirePulse stores candidate resumes and profile/company images through
Django file fields. Application resumes are also supported by the
`Application` model.

-   Validate file size, permitted file types, and file content where
    feasible.
-   Generate safe storage names; never trust a user-supplied path.
-   Protect private resumes with authenticated, ownership-checked
    access. Do not expose private resume files through an unrestricted
    catch-all media route.
-   Configure Nginx/Django upload limits consistently.
-   Ensure Docker media volumes persist uploads across container
    recreation.
-   Avoid returning server filesystem paths in API responses.

## 13. Error Handling and Logging

-   Return clear validation messages that do not expose sensitive
    internals.
-   Log unexpected exceptions with enough context to investigate, but
    never log credentials, JWTs, or private resume contents.
-   Avoid swallowing errors that should fail a transaction.
-   Keep related database updates atomic where partial success would
    leave inconsistent data---for example, application status changes
    and notification creation where the workflow requires both.
-   Do not claim an issue is fixed based solely on code changes; verify
    through tests and manual workflows.

## 14. Testing Strategy

Use the existing Django test framework and test conventions in the
repository. Do not introduce a new test framework without approval.

### Accounts and permissions

-   Candidate and recruiter registration.
-   Admin-only operations and public role restrictions.
-   Cross-role profile access is denied.
-   Recruiters cannot change another recruiter's jobs or applicants.

### Jobs

-   Create, edit, close, and list jobs.
-   Search and filters.
-   Salary minimum/maximum validation and closing-date validation.
-   Closed/expired job application behavior.

### Applications

-   Successful application.
-   Duplicate application blocked by the database constraint.
-   Candidate can view only their own applications.
-   Recruiter can view/update applications only for their own jobs.
-   Valid and invalid status changes.

### Notifications

-   Correct notification generated for application/status events.
-   Correct recipient and application association.
-   Authenticated user can retrieve only their own notifications.
-   Read/unread state and unread count.
-   Tests cover both successful behavior and unauthorized/not-found
    cases.

### Integration and deployment

-   Run the complete backend test suite, not just a focused test.
-   Build and start services through Docker Compose.
-   Verify frontend-to-API login, refresh, registration, job search,
    application submission, recruiter workflow, notifications, and admin
    restrictions.
-   Investigate every failure before deciding whether the defect is in
    the test, fixture, or application code.

## 15. Docker and Environment Configuration

Docker Compose currently coordinates: - PostgreSQL service. - Django
backend service, which runs migrations/collectstatic and starts
Django. - Frontend service served through Nginx. - Persistent PostgreSQL
and media volumes.

Rules: - Use `.env` for local configuration and provide a sanitized
`.env.example`. - Never commit real secrets or production credentials. -
Keep database credentials and Django secret keys out of source code in
production. - Wait for PostgreSQL health before starting
database-dependent commands. - Do not run destructive volume commands
without explicit confirmation and a backup plan. - Verify service logs
and health after rebuilding/restarting containers.

## 16. Code Quality Rules

-   Keep each module focused on its domain.
-   Reuse existing helpers and API clients instead of creating duplicate
    implementations.
-   Keep validation consistent and testable; do not remove validation
    simply to eliminate duplication.
-   Prefer small, reviewable changes that address one finding at a time.
-   Do not refactor unrelated modules while fixing a specific bug.
-   Preserve existing behavior unless a change is required and approved.
-   Update tests and documentation when behavior changes.
-   Remove dead code only after confirming it is unused.

## 17. Git and Change Workflow

-   Use focused feature/fix branches where the team workflow supports
    them.
-   Keep commits small and descriptive, for example
    `fix: enforce recruiter job ownership`.
-   Before implementation, inspect the current code and provide a
    concise finding/report.
-   Implement one approved finding at a time.
-   After implementation, report files changed, behavior changed, tests
    run, and failures.
-   Provide manual testing steps.
-   Wait for manual test results before starting the next finding.

## 18. Definition of Done

A HirePulse change is complete only when: 1. The requirement and
existing behavior are understood. 2. The smallest appropriate code
change is implemented. 3. Relevant tests pass, or remaining failures are
clearly explained and investigated. 4. Permissions and ownership are
verified. 5. Manual testing steps are completed for user-facing
workflows. 6. No unrelated behavior was changed. 7. Migrations and
documentation are updated if needed. 8. The Docker-based application
still builds and runs.

------------------------------------------------------------------------

**Primary rule:** HirePulse is a recruitment platform. Keep its existing
Django, React, PostgreSQL, and Docker architecture; model the real
hiring workflows; enforce permissions on the server; and make changes
incrementally with tests and manual verification.
