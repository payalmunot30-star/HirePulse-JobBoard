"""
Views for job postings with full-text search and filtering.
"""
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.db.models import Count, Exists, OuterRef, Value, BooleanField
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter

from rest_framework_simplejwt.authentication import JWTAuthentication
from accounts.permissions import IsRecruiter, IsRecruiterOrAdmin
from .models import Job
from .serializers import JobListSerializer, JobDetailSerializer, JobCreateUpdateSerializer
from .filters import JobFilter


class OptionalJWTAuthentication(JWTAuthentication):
    """Allows anonymous fallback if an expired or invalid token is sent on public endpoints."""
    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except Exception:
            return None


@extend_schema(tags=['Jobs'])
class JobListCreateView(generics.ListCreateAPIView):
    """
    List active jobs (public) or create a new job (recruiter only).
    Supports full-text search via ?search= parameter.
    """
    authentication_classes = [OptionalJWTAuthentication]
    filterset_class = JobFilter
    ordering_fields = ['created_at', 'salary_min', 'salary_max', 'title']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsRecruiter()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return JobCreateUpdateSerializer
        return JobListSerializer

    def get_queryset(self):
        queryset = Job.objects.select_related(
            'recruiter', 'recruiter__user'
        ).annotate(
            application_count=Count('applications')
        )

        # Public listing only shows active jobs by default, or filtered status if specified
        if not self.request.user.is_authenticated or self.request.user.role != 'admin':
            status_param = self.request.query_params.get('status')
            if not status_param:
                queryset = queryset.filter(status=Job.Status.ACTIVE)

        # Full-text search
        search = self.request.query_params.get('search', '').strip()
        if search:
            search_query = SearchQuery(search, config='english')
            queryset = queryset.annotate(
                search_vector_computed=SearchVector(
                    'title', 'description', config='english'
                ),
                rank=SearchRank(
                    SearchVector('title', 'description', config='english'),
                    search_query,
                ),
            ).filter(
                search_vector_computed=search_query
            ).order_by('-rank')

        return queryset


@extend_schema(tags=['Jobs'])
class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Get, update, or delete a job posting.
    - GET: Public for active jobs
    - PUT/PATCH/DELETE: Recruiter (owner only)
    """
    authentication_classes = [OptionalJWTAuthentication]

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [permissions.IsAuthenticated(), IsRecruiter()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return JobCreateUpdateSerializer
        return JobDetailSerializer

    def get_queryset(self):
        queryset = Job.objects.select_related(
            'recruiter', 'recruiter__user'
        ).annotate(
            application_count=Count('applications')
        )

        # Annotate has_applied for authenticated candidates
        if (
            self.request.user.is_authenticated
            and self.request.user.role == 'candidate'
            and hasattr(self.request.user, 'candidate_profile')
        ):
            from applications.models import Application
            queryset = queryset.annotate(
                has_applied=Exists(
                    Application.objects.filter(
                        job=OuterRef('pk'),
                        candidate=self.request.user.candidate_profile,
                    )
                )
            )
        else:
            queryset = queryset.annotate(
                has_applied=Value(False, output_field=BooleanField())
            )

        return queryset

    def perform_update(self, serializer):
        job = self.get_object()
        if job.recruiter.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You can only edit your own job postings.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.recruiter.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You can only delete your own job postings.')
        instance.delete()


@extend_schema(tags=['Jobs'])
class RecruiterJobListView(generics.ListAPIView):
    """List all jobs posted by the authenticated recruiter."""
    serializer_class = JobListSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]
    filterset_class = JobFilter

    def get_queryset(self):
        return Job.objects.filter(
            recruiter=self.request.user.recruiter_profile
        ).annotate(
            application_count=Count('applications')
        ).order_by('-created_at')


@extend_schema(tags=['Jobs'])
@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated, IsRecruiter])
def close_job(request, pk):
    """Close a job posting (recruiter owner only)."""
    try:
        job = Job.objects.get(pk=pk)
    except Job.DoesNotExist:
        return Response(
            {'error': 'Job not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if job.recruiter.user != request.user:
        return Response(
            {'error': 'You can only close your own job postings.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    if job.status == Job.Status.CLOSED:
        return Response(
            {'error': 'Job is already closed.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    job.status = Job.Status.CLOSED
    job.save()
    return Response({
        'message': 'Job closed successfully.',
        'job': JobListSerializer(job, context={'request': request}).data,
    })


@extend_schema(tags=['Jobs'])
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def job_categories(request):
    """Return available job categories."""
    categories = [
        {'value': choice[0], 'label': choice[1]}
        for choice in Job.Category.choices
    ]
    return Response(categories)


@extend_schema(tags=['Jobs'])
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def job_choices(request):
    """Return all job choice fields for filters."""
    return Response({
        'categories': [{'value': c[0], 'label': c[1]} for c in Job.Category.choices],
        'job_types': [{'value': c[0], 'label': c[1]} for c in Job.JobType.choices],
        'experience_levels': [{'value': c[0], 'label': c[1]} for c in Job.ExperienceLevel.choices],
        'statuses': [{'value': c[0], 'label': c[1]} for c in Job.Status.choices],
    })
