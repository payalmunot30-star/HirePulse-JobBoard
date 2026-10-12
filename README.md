# HirePulse

HirePulse is a recruitment management system with Candidate, Recruiter, and Admin roles.

## Prerequisites

Install:
- Git
- Docker Desktop with Docker Compose v2

Python, Node.js, and PostgreSQL do not need to be installed locally when using Docker Compose.

## Clone the Repository

```bash
git clone <repository-url>
cd job-portal
```

Use the actual repository URL and project folder name for your setup.

## Build and Start

Run this command from the folder containing `docker-compose.yml`:

```bash
docker compose up -d --build
```

This builds and starts the services defined in your project's Docker Compose file, including the frontend, Django backend, and PostgreSQL database.

## Verify Containers

```bash
docker compose ps
```

If a service is not running, check its logs:

```bash
docker compose logs -f
```

## Database Migrations

Apply Django migrations:

```bash
docker compose exec backend python manage.py migrate
```

If your Compose service is not named `backend`, replace `backend` with the service name shown by:

```bash
docker compose ps
```

## Access HirePulse

Use the ports configured in your `docker-compose.yml`.

Common local URLs from the current project setup:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Django Admin:** http://localhost:3001/admin/

If your local Compose configuration maps different ports, use those mapped ports instead.

## Daily Development

### Start services

```bash
docker compose up -d
```

### Stop services

```bash
docker compose down
```

### Rebuild after Dockerfile or dependency changes

```bash
docker compose up -d --build
```

## View Logs

### All services

```bash
docker compose logs -f
```

### Backend

```bash
docker compose logs -f backend
```

### Frontend

```bash
docker compose logs -f frontend
```

### Database

```bash
docker compose logs -f postgres
```

If your Compose file uses different service names, substitute the names shown by `docker compose ps`.

## Run Commands Inside Containers

### Django backend shell

```bash
docker compose exec backend bash
```

### Run Django management commands

```bash
docker compose exec backend python manage.py check
docker compose exec backend python manage.py showmigrations
docker compose exec backend python manage.py test
```

### Create an admin account

```bash
docker compose exec backend python manage.py createsuperuser
```

Follow the prompts. Use this only to create the project's authorized Django admin account; public registration should be used for candidate and recruiter accounts according to the project's rules.

## After Pulling Latest Changes

### Source-code changes only

```bash
git pull
docker compose up -d
```

### Dockerfile or dependency changes

```bash
git pull
docker compose up -d --build
```

If model changes include new Django migrations, apply them:

```bash
docker compose exec backend python manage.py migrate
```

## Useful Commands

### Restart backend

```bash
docker compose restart backend
```

### Restart frontend

```bash
docker compose restart frontend
```

### Restart all services

```bash
docker compose restart
```

### Check Django configuration

```bash
docker compose exec backend python manage.py check
```

## Important Database Warning

Stop and remove containers without deleting the database volume:

```bash
docker compose down
```

**Do not run `docker compose down -v` unless you intentionally want to delete the local database volume and have confirmed that you do not need its data.**

## Project Notes

- HirePulse uses React/Vite for the frontend, Django REST Framework for the backend, PostgreSQL for data, and JWT authentication.
- Candidate and recruiter accounts should be created through the approved public registration flow.
- Use Django migrations for model changes.
- Test role permissions, job ownership, applications, and notifications after relevant changes.
- Check `docker-compose.yml` for the exact service names and port mappings used by your local setup.
