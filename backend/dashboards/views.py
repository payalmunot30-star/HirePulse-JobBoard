"""
Dynamic statistics endpoints for Recruiter, Admin, and Candidate dashboards.
"""
from django.db.models import Count, Q, F, Value, CharField
from django.db.models.functions import Concat
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from accounts.models import User, CandidateProfile, RecruiterProfile
from accounts.permissions import IsRecruiter, IsAdmin, IsCandidate, IsRecruiterOrAdmin
from jobs.models import Job
from applications.models import Application


class RecruiterDashboardView(APIView):
    """
    Recruiter Dashboard metrics dynamically calculated from PostgreSQL.
    """
    permission_classes = [IsAuthenticated, IsRecruiterOrAdmin]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'recruiter_profile') and not user.is_admin:
            return Response(
                {'detail': 'Recruiter profile not found.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Base querysets
        if user.is_admin and not hasattr(user, 'recruiter_profile'):
            recruiter_jobs = Job.objects.all()
            recruiter_apps = Application.objects.all()
        else:
            recruiter_profile = user.recruiter_profile
            recruiter_jobs = Job.objects.filter(recruiter=recruiter_profile)
            recruiter_apps = Application.objects.filter(job__recruiter=recruiter_profile)

        # Overview counters
        total_jobs = recruiter_jobs.count()
        active_jobs = recruiter_jobs.filter(status=Job.Status.ACTIVE).count()
        closed_jobs = recruiter_jobs.filter(status=Job.Status.CLOSED).count()

        total_applicants = recruiter_apps.count()
        shortlisted_count = recruiter_apps.filter(status=Application.Status.SHORTLISTED).count()
        interview_count = recruiter_apps.filter(status=Application.Status.INTERVIEW).count()
        hired_count = recruiter_apps.filter(status=Application.Status.HIRED).count()
        rejected_count = recruiter_apps.filter(status=Application.Status.REJECTED).count()
        applied_count = recruiter_apps.filter(status=Application.Status.APPLIED).count()

        # Status distribution map
        status_distribution = {
            'applied': applied_count,
            'shortlisted': shortlisted_count,
            'interview': interview_count,
            'rejected': rejected_count,
            'hired': hired_count,
        }

        # Applicants per job breakdown
        jobs_breakdown = recruiter_jobs.annotate(
            applicant_count=Count('applications'),
            shortlisted_count=Count('applications', filter=Q(applications__status=Application.Status.SHORTLISTED)),
            hired_count=Count('applications', filter=Q(applications__status=Application.Status.HIRED)),
        ).values('id', 'title', 'status', 'created_at', 'applicant_count', 'shortlisted_count', 'hired_count')[:10]

        # Recent applications feed
        recent_applications = recruiter_apps.select_related(
            'candidate__user', 'job'
        ).order_by('-applied_at')[:8]

        recent_apps_data = [
            {
                'id': app.id,
                'candidate_name': app.candidate.user.get_full_name(),
                'candidate_email': app.candidate.user.email,
                'job_id': app.job.id,
                'job_title': app.job.title,
                'status': app.status,
                'applied_at': app.applied_at,
            }
            for app in recent_applications
        ]

        return Response({
            'overview': {
                'total_jobs': total_jobs,
                'active_jobs': active_jobs,
                'closed_jobs': closed_jobs,
                'total_applicants': total_applicants,
                'shortlisted_count': shortlisted_count,
                'interview_count': interview_count,
                'hired_count': hired_count,
                'rejected_count': rejected_count,
            },
            'status_distribution': status_distribution,
            'jobs_breakdown': list(jobs_breakdown),
            'recent_applications': recent_apps_data,
        })


class AdminDashboardView(APIView):
    """
    Admin Platform Analytics dynamically calculated from PostgreSQL.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        total_users = User.objects.count()
        total_candidates = User.objects.filter(role=User.Role.CANDIDATE).count()
        total_recruiters = User.objects.filter(role=User.Role.RECRUITER).count()
        total_admins = User.objects.filter(role=User.Role.ADMIN).count()

        total_jobs = Job.objects.count()
        active_jobs = Job.objects.filter(status=Job.Status.ACTIVE).count()
        closed_jobs = Job.objects.filter(status=Job.Status.CLOSED).count()

        total_applications = Application.objects.count()
        total_hired = Application.objects.filter(status=Application.Status.HIRED).count()

        # Status breakdown across entire platform
        status_counts = Application.objects.values('status').annotate(count=Count('status'))
        status_distribution = {item['status']: item['count'] for item in status_counts}

        # Jobs by category breakdown
        category_counts = Job.objects.values('category').annotate(count=Count('category')).order_by('-count')[:8]

        # Recent registrations & applications
        recent_users = User.objects.order_by('-created_at').values('id', 'email', 'first_name', 'last_name', 'role', 'created_at')[:5]
        recent_jobs = Job.objects.select_related('recruiter').order_by('-created_at').values('id', 'title', 'recruiter__company_name', 'status', 'created_at')[:5]

        return Response({
            'overview': {
                'total_users': total_users,
                'total_candidates': total_candidates,
                'total_recruiters': total_recruiters,
                'total_admins': total_admins,
                'total_jobs_posted': total_jobs,
                'active_jobs': active_jobs,
                'closed_jobs': closed_jobs,
                'total_applications': total_applications,
                'successful_hires': total_hired,
            },
            'status_distribution': status_distribution,
            'category_distribution': list(category_counts),
            'recent_users': list(recent_users),
            'recent_jobs': list(recent_jobs),
        })


class AdminHiringPipelineView(APIView):
    """
    Admin-only comprehensive hiring pipeline analytics.
    Returns 5 sections of data:
    1. Summary cards (totals)
    2. Recruiter-wise hiring overview
    3. Job-wise pipeline breakdown
    4. Full application list for review
    5. Recent activity feed
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        # ── Query params for filtering ──
        recruiter_id = request.query_params.get('recruiter_id')
        status_filter = request.query_params.get('status')
        search = request.query_params.get('search', '').strip()

        # ── 1. SUMMARY CARDS ──
        total_recruiters = User.objects.filter(role=User.Role.RECRUITER, is_active=True).count()
        total_active_jobs = Job.objects.filter(status=Job.Status.ACTIVE).count()
        total_applications = Application.objects.count()
        total_hired = Application.objects.filter(status=Application.Status.HIRED).count()
        total_shortlisted = Application.objects.filter(status=Application.Status.SHORTLISTED).count()
        total_interview = Application.objects.filter(status=Application.Status.INTERVIEW).count()
        total_rejected = Application.objects.filter(status=Application.Status.REJECTED).count()
        total_applied = Application.objects.filter(status=Application.Status.APPLIED).count()

        summary = {
            'total_recruiters': total_recruiters,
            'total_active_jobs': total_active_jobs,
            'total_applications': total_applications,
            'total_hired': total_hired,
            'total_shortlisted': total_shortlisted,
            'total_interview': total_interview,
            'total_rejected': total_rejected,
            'total_applied': total_applied,
        }

        # ── 2. RECRUITER HIRING OVERVIEW ──
        recruiter_overview = RecruiterProfile.objects.select_related('user').annotate(
            jobs_created=Count('jobs', distinct=True),
            active_jobs=Count('jobs', filter=Q(jobs__status=Job.Status.ACTIVE), distinct=True),
            total_apps=Count('jobs__applications', distinct=True),
            hired_count=Count(
                'jobs__applications',
                filter=Q(jobs__applications__status=Application.Status.HIRED),
                distinct=True,
            ),
            shortlisted_count=Count(
                'jobs__applications',
                filter=Q(jobs__applications__status=Application.Status.SHORTLISTED),
                distinct=True,
            ),
            interview_count=Count(
                'jobs__applications',
                filter=Q(jobs__applications__status=Application.Status.INTERVIEW),
                distinct=True,
            ),
        ).order_by('-jobs_created')

        recruiter_data = [
            {
                'id': rp.id,
                'user_id': rp.user.id,
                'name': rp.user.get_full_name(),
                'email': rp.user.email,
                'company': rp.company_name or 'N/A',
                'is_active': rp.user.is_active,
                'jobs_created': rp.jobs_created,
                'active_jobs': rp.active_jobs,
                'total_applications': rp.total_apps,
                'hired': rp.hired_count,
                'shortlisted': rp.shortlisted_count,
                'interview': rp.interview_count,
            }
            for rp in recruiter_overview
        ]

        # ── 3. JOB-WISE PIPELINE ──
        job_pipeline_qs = Job.objects.select_related('recruiter', 'recruiter__user').annotate(
            total_apps=Count('applications', distinct=True),
            applied_count=Count(
                'applications', filter=Q(applications__status=Application.Status.APPLIED), distinct=True
            ),
            shortlisted_count=Count(
                'applications', filter=Q(applications__status=Application.Status.SHORTLISTED), distinct=True
            ),
            interview_count=Count(
                'applications', filter=Q(applications__status=Application.Status.INTERVIEW), distinct=True
            ),
            rejected_count=Count(
                'applications', filter=Q(applications__status=Application.Status.REJECTED), distinct=True
            ),
            hired_count=Count(
                'applications', filter=Q(applications__status=Application.Status.HIRED), distinct=True
            ),
        ).order_by('-created_at')

        # Apply recruiter filter
        if recruiter_id:
            job_pipeline_qs = job_pipeline_qs.filter(recruiter_id=recruiter_id)

        job_pipeline_data = [
            {
                'id': job.id,
                'title': job.title,
                'recruiter_name': job.recruiter.user.get_full_name(),
                'company': job.recruiter.company_name or 'N/A',
                'status': job.status,
                'category': job.category,
                'created_at': job.created_at,
                'total_applications': job.total_apps,
                'applied': job.applied_count,
                'shortlisted': job.shortlisted_count,
                'interview': job.interview_count,
                'rejected': job.rejected_count,
                'hired': job.hired_count,
            }
            for job in job_pipeline_qs[:50]
        ]

        # ── 4. APPLICATION REVIEW LIST ──
        apps_qs = Application.objects.select_related(
            'candidate__user', 'job', 'job__recruiter', 'job__recruiter__user'
        ).order_by('-applied_at')

        if recruiter_id:
            apps_qs = apps_qs.filter(job__recruiter_id=recruiter_id)
        if status_filter:
            apps_qs = apps_qs.filter(status=status_filter)
        if search:
            apps_qs = apps_qs.filter(
                Q(candidate__user__first_name__icontains=search) |
                Q(candidate__user__last_name__icontains=search) |
                Q(candidate__user__email__icontains=search) |
                Q(job__title__icontains=search)
            )

        applications_data = [
            {
                'id': app.id,
                'candidate_name': app.candidate.user.get_full_name(),
                'candidate_email': app.candidate.user.email,
                'job_id': app.job.id,
                'job_title': app.job.title,
                'recruiter_name': app.job.recruiter.user.get_full_name(),
                'company': app.job.recruiter.company_name or 'N/A',
                'status': app.status,
                'applied_at': app.applied_at,
                'updated_at': app.updated_at,
            }
            for app in apps_qs[:100]
        ]

        # ── 5. RECENT ACTIVITY ──
        recent_apps = Application.objects.select_related(
            'candidate__user', 'job', 'job__recruiter__user'
        ).order_by('-updated_at')[:15]

        recent_activity = [
            {
                'id': app.id,
                'candidate_name': app.candidate.user.get_full_name(),
                'job_title': app.job.title,
                'recruiter_name': app.job.recruiter.user.get_full_name(),
                'company': app.job.recruiter.company_name or 'N/A',
                'status': app.status,
                'applied_at': app.applied_at,
                'updated_at': app.updated_at,
            }
            for app in recent_apps
        ]

        # ── Recruiter filter options (for dropdown) ──
        recruiter_options = [
            {
                'id': rp.id,
                'name': rp.user.get_full_name(),
                'company': rp.company_name or 'N/A',
            }
            for rp in RecruiterProfile.objects.select_related('user').filter(
                user__is_active=True
            ).order_by('user__first_name')
        ]

        return Response({
            'summary': summary,
            'recruiter_overview': recruiter_data,
            'job_pipeline': job_pipeline_data,
            'applications': applications_data,
            'recent_activity': recent_activity,
            'recruiter_options': recruiter_options,
        })


class CandidateDashboardView(APIView):
    """
    Candidate Dashboard metrics.
    """
    permission_classes = [IsAuthenticated, IsCandidate]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'candidate_profile'):
            return Response(
                {'detail': 'Candidate profile not found.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        candidate = user.candidate_profile
        applications = Application.objects.filter(candidate=candidate)

        total_applied = applications.count()
        shortlisted = applications.filter(status=Application.Status.SHORTLISTED).count()
        interview = applications.filter(status=Application.Status.INTERVIEW).count()
        hired = applications.filter(status=Application.Status.HIRED).count()
        rejected = applications.filter(status=Application.Status.REJECTED).count()

        recent_applications = applications.select_related('job', 'job__recruiter').order_by('-applied_at')[:5]
        recent_apps_data = [
            {
                'id': app.id,
                'job_id': app.job.id,
                'job_title': app.job.title,
                'company_name': app.job.recruiter.company_name,
                'location': app.job.location,
                'status': app.status,
                'applied_at': app.applied_at,
            }
            for app in recent_applications
        ]

        profile_complete = bool(candidate.phone and candidate.skills and candidate.resume)

        return Response({
            'overview': {
                'total_applied': total_applied,
                'shortlisted': shortlisted,
                'interview': interview,
                'hired': hired,
                'rejected': rejected,
                'profile_complete': profile_complete,
            },
            'recent_applications': recent_apps_data,
        })
