# HirePulse — Business Workflows

**Purpose:** Define the principal candidate, recruiter, and admin workflows for the HirePulse recruitment platform.  
**Implementation rule:** Match workflows to existing APIs and models. A workflow described here must be checked against the code before claiming it is implemented. Do not add new product scope implicitly.

---

## 1. Registration and Authentication

### 1.1 Candidate registration
1. Visitor opens the public registration page.
2. Visitor submits required identity details and credentials.
3. Backend validates the request and ensures the email is unique.
4. Backend creates a user with the candidate role and creates/ensures the candidate profile according to the project's profile-creation design.
5. API returns a safe success response.
6. Candidate signs in and receives JWT credentials through the configured authentication flow.

**Rules**
- Public registration must not allow self-assignment of the admin role.
- Passwords are stored only as Django password hashes.
- Duplicate email registration returns a validation/conflict response.
- Do not create duplicate candidate profiles through a signal plus service/view path.

### 1.2 Recruiter registration
1. Visitor selects recruiter registration.
2. Visitor supplies account details and required company information.
3. Backend validates the registration, including company-name requirements.
4. Backend creates the recruiter user and recruiter profile atomically.
5. Recruiter signs in and completes or updates company information.

**Rules**
- Recruiter accounts must be created through the approved public registration flow.
- Django Admin and alternative API paths must not bypass this restriction.
- Recruiter profile endpoints must reject candidate users.
- Registration failure must not leave a partially created user/profile.

### 1.3 Login, token refresh, and logout
1. User submits email and password.
2. Backend authenticates the credentials and issues the configured JWT token pair.
3. Frontend API client attaches the access token to protected requests.
4. When access expires, the client attempts the configured refresh endpoint.
5. If refresh succeeds, the client retries the original request once with the new access token.
6. If refresh fails, the client clears invalid session state and sends the user to sign in.
7. Logout clears client-side authentication state and performs any configured backend token invalidation.

**Rules**
- Avoid infinite refresh/retry loops.
- Concurrent failed requests should not cause uncontrolled parallel refresh attempts if the client implements refresh coordination.
- Do not expose whether an email exists during failed login.
- Verify refresh behavior against the actual SimpleJWT settings and frontend interceptor.

---

## 2. Profile Management

### 2.1 Candidate profile
1. Candidate signs in.
2. Candidate opens their profile.
3. Frontend loads profile data from the candidate profile endpoint.
4. Candidate updates supported fields and uploads a profile image or resume if desired.
5. Backend validates input and files, then saves the candidate's own profile.
6. Frontend displays the saved data.

**Rules**
- A candidate may only modify their own profile.
- A candidate must not access recruiter-only profile operations.
- Resume access must use an authenticated, ownership-checked path where resumes are private.
- Missing profile creation should be handled consistently and should not create duplicate one-to-one records.

### 2.2 Recruiter/company profile
1. Recruiter signs in.
2. Recruiter opens company profile settings.
3. Recruiter updates company name, description, website, location, phone, position, branding color, logo, or banner as supported.
4. Backend validates ownership and uploaded files.
5. Updated profile is returned and displayed.

**Rules**
- Candidate users cannot use recruiter profile endpoints.
- Recruiters cannot edit another recruiter's profile.
- Uploaded logos and banners must be validated and stored safely.

---

## 3. Job Posting Lifecycle

### 3.1 Create a job
1. Recruiter signs in and opens job management.
2. Recruiter submits title, description, skills, category, location, salary range, experience level, job type, and optional closing date.
3. Backend identifies the recruiter from the authenticated user—not from an untrusted client-supplied owner ID.
4. Backend validates required fields and salary/date rules.
5. Job is saved under that recruiter's profile.
6. The job appears in the recruiter's job list and in public listings when eligible.

**Rules**
- Salary values cannot be negative.
- If both salary values exist, minimum must not exceed maximum.
- Closing-date validation must run on API writes.
- Only supported job types, experience levels, categories, and statuses are accepted.

### 3.2 Edit or close a job
1. Recruiter opens one of their jobs.
2. Backend checks ownership and whether the requested operation is allowed for the job's current state.
3. Recruiter edits allowed fields or closes the job.
4. Backend persists the change and returns the updated job.
5. Public search reflects the new state.

**Rules**
- Recruiters cannot modify another recruiter's job.
- Closed jobs should not accept new applications, subject to the confirmed business rule.
- Do not silently reopen or change status as a side effect of editing unrelated fields.
- Admin moderation is limited to explicit admin permissions.

### 3.3 Public job discovery
1. Visitor/candidate opens job search.
2. Frontend sends keyword and supported filters such as category, location, job type, and experience level.
3. Backend filters to jobs eligible for public display and applies search/pagination.
4. Frontend displays results and job details.
5. Candidate can open a job to review requirements before applying.

**Rules**
- Search must not reveal private/draft/ineligible jobs.
- Filters should compose predictably.
- Salary formatting uses Indian currency presentation where the frontend displays salary.
- Search vector/index behavior must remain consistent with the model and migrations.

---

## 4. Candidate Application Lifecycle

### 4.1 Submit an application
1. Candidate signs in.
2. Candidate opens an eligible job.
3. Candidate selects or uploads a resume and optionally enters a cover letter.
4. Frontend submits the application.
5. Backend verifies the candidate identity, job eligibility, file validity, and duplicate-application constraint.
6. Backend creates an application with status `applied`.
7. The candidate sees confirmation and the application in their application list.
8. The relevant recruiter notification is created if supported by the current notification workflow.

**Rules**
- One candidate may have at most one application per job.
- The database uniqueness constraint is the final protection against duplicate requests.
- The client cannot submit an application on behalf of a different candidate by supplying another candidate ID.
- Closed or otherwise ineligible jobs must reject new applications.
- A failed notification should not silently corrupt the application record; transaction/side-effect behavior must be deliberate.

### 4.2 Candidate tracks applications
1. Candidate opens “My Applications.”
2. Backend filters applications to the authenticated candidate.
3. Frontend displays job details, application date, and current status.
4. Candidate opens an application to see supported details.
5. Candidate receives relevant status notifications.

**Rules**
- Candidate cannot read another candidate's application or private resume.
- Application status shown in the UI must match the database.
- Do not let candidates change recruiter-controlled status fields.

---

## 5. Recruiter Applicant Review

### 5.1 View applicants
1. Recruiter signs in.
2. Recruiter opens a job or applicant management view.
3. Backend returns applications only for jobs owned by the authenticated recruiter.
4. Recruiter reviews candidate details and application resume where authorized.
5. Frontend displays applicant information and status.

**Rules**
- Recruiters cannot enumerate or retrieve applicants for jobs owned by another recruiter.
- Resume URLs must not bypass access checks.
- Candidate personal data should be limited to what the recruiter needs for the application process.

### 5.2 Update application status
1. Recruiter selects an application belonging to one of their jobs.
2. Recruiter selects a supported status: `shortlisted`, `interview`, `rejected`, or `hired` (and `applied` as the initial state).
3. Backend validates recruiter ownership, current status, requested status, and any configured transition restrictions.
4. Backend saves the status change.
5. A candidate notification is created with the correct recipient, application, title/message, and status context.
6. Candidate's application list and notification list reflect the update.

**Rules**
- Only the owning recruiter or an explicitly authorized admin can change an application's status.
- Invalid status values are rejected.
- The status-change function must receive the arguments its implementation requires.
- Avoid duplicate notifications for one status transition unless explicitly intended.
- If the status update or notification creation fails, the implementation must have a deliberate consistency strategy and tests for it.

---

## 6. Notification Workflow

### 6.1 New application notification
1. Candidate successfully applies to a job.
2. Backend identifies the recruiter who owns the job.
3. Backend creates a notification for the intended recruiter, if this event is enabled.
4. Recruiter sees the notification and can open the associated application through an authorized route.

### 6.2 Application status notification
1. Recruiter changes application status.
2. Backend saves the status transition.
3. Backend creates a notification for the candidate.
4. Candidate opens the notification and navigates to the relevant application.
5. Notification read state is updated when marked read.

### 6.3 List and read notifications
1. Authenticated user requests the notification list.
2. Backend filters notifications to that user.
3. User marks one notification as read, or marks all their notifications as read.
4. Backend updates only notifications owned by that user.
5. Unread count and UI state update.

**Rules**
- A user must not retrieve, mark read, or modify another user's notification.
- An optional application relation may be null; UI/API behavior must handle that safely.
- Correct recipient, application relation, type, and message must be tested.
- Admin/system notification behavior must follow actual implemented requirements; do not assume admins receive all candidate/recruiter notifications.
- A notification test returning 404 must be diagnosed: verify route, authentication, ownership filter, test fixture, and expected response before changing production logic.

---

## 7. Admin Workflows

### 7.1 User and recruiter management
1. Admin signs in through an authorized admin account.
2. Admin opens user management.
3. Backend checks admin permissions.
4. Admin searches/views users and performs only supported actions such as activation changes or permitted role management.
5. Recruiter creation remains restricted to the approved public registration flow.
6. Changes are reflected in the relevant admin and user views.

**Rules**
- Frontend hiding is not a security boundary.
- Non-admin users must be denied admin endpoints.
- Role changes must not create inconsistent profile state.
- Django Admin must not provide an alternate recruiter creation path when policy forbids it.

### 7.2 Job/application moderation and dashboard
1. Admin opens the relevant management or dashboard page.
2. Backend verifies admin permission.
3. Dashboard metrics are calculated from the authorized platform data.
4. Admin performs only the moderation operations supported by current APIs.
5. Updated counts and lists reflect the resulting records.

Do not add a moderation action or admin notification event merely because it is common in other portals; verify that the project supports it.

---

## 8. Password Reset and Change

### 8.1 Password reset
1. User requests a reset using the configured endpoint.
2. Backend responds safely without exposing whether the account exists.
3. The configured reset mechanism sends/validates the reset token or code.
4. User submits a new password.
5. Backend validates and stores the password hash.
6. Old sessions/tokens are invalidated if the configured security policy supports it.

### 8.2 Change password
1. Authenticated user submits the current password and new password.
2. Backend verifies the current password and validates the new one.
3. Password is updated through Django's password API.
4. Frontend reports success and follows the configured session policy.

---

## 9. Dashboard Workflows

### Candidate dashboard
- Show the candidate's own application counts and recent application/status information supported by the API.
- Do not include other candidates' data.

### Recruiter dashboard
- Show jobs owned by the recruiter, applicant totals, status distribution, and relevant recent activity supported by the API.
- Ensure metrics use the same ownership filters as applicant lists.

### Admin dashboard
- Show platform-wide totals and distributions only where implemented and authorized.
- Metrics should agree with the source tables and filters.
- Empty datasets should render gracefully rather than causing server errors.

---

## 10. Error and Edge-Case Handling

- Duplicate email: reject registration with a safe validation/conflict response.
- Invalid credentials: return a generic authentication failure.
- Expired/invalid access token: follow the configured refresh flow; if refresh fails, require sign-in.
- Wrong role: deny access.
- Wrong object owner: deny access or return a non-disclosing not-found response according to the endpoint's policy.
- Duplicate candidate/job application: reject without creating a second record.
- Closed job: reject new applications.
- Invalid salary range or closing date: return field-level validation errors.
- Invalid application status: reject without changing the existing status.
- Notification for another user: never expose it.
- Missing optional application on a notification: handle without crashing.
- Invalid/oversized upload: reject safely.
- Database failure during a multi-step write: roll back related database changes where atomicity is required.
- Unexpected server error: log safe diagnostic context; never return secrets or stack traces to the user.

---

## 11. Testing and Release Checklist

### Accounts and access
- [ ] Candidate registration and login.
- [ ] Recruiter registration with required company information.
- [ ] Public registration cannot create admin users.
- [ ] Candidate cannot access recruiter profile operations and vice versa.
- [ ] Admin-only operations reject non-admin users.
- [ ] JWT refresh works and refresh failure is handled.

### Jobs
- [ ] Recruiter creates, edits, lists, and closes their own job.
- [ ] Recruiter cannot edit/close another recruiter's job.
- [ ] Public search, category, location, job type, and experience filters work.
- [ ] Negative salary, invalid salary range, and past closing date are rejected.
- [ ] Closed jobs cannot receive applications.

### Applications
- [ ] Candidate applies successfully.
- [ ] Duplicate application is blocked.
- [ ] Candidate sees only their own applications.
- [ ] Recruiter sees only applicants for owned jobs.
- [ ] Valid status update persists.
- [ ] Invalid status and wrong-owner updates are rejected.

### Notifications
- [ ] New application notification goes to the correct recruiter where configured.
- [ ] Status notification goes to the correct candidate.
- [ ] Notification references the correct application.
- [ ] Users can list only their own notifications.
- [ ] Mark-one-read and mark-all-read affect only the current user's notifications.
- [ ] Unread count/read state updates correctly.
- [ ] Notification creation/retrieval tests cover success and unauthorized/not-found cases.

### Full integration
- [ ] Frontend build succeeds.
- [ ] Docker Compose services start and remain healthy.
- [ ] Database migrations apply safely.
- [ ] Login, refresh, job search, application, recruiter review, notifications, and admin flows work end to end.
- [ ] Full backend test suite is run; every failure is classified before deciding whether a code or test fix is needed.
- [ ] Manual tests are completed after implementation, one finding at a time.

---

**Primary rule:** Keep HirePulse focused on recruitment. Preserve the existing Django/React/PostgreSQL architecture, enforce ownership on the backend, and verify each change with automated and manual tests.
