"""
Views for application management workflow.
"""
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from accounts.permissions import IsCandidate, IsRecruiter, IsAdmin, IsRecruiterOrAdmin
from jobs.models import Job
from .models import Application
from .serializers import (
    ApplicationCreateSerializer,
    ApplicationListSerializer,
    ApplicationDetailSerializer,
    ApplicationStatusUpdateSerializer,
)


class ApplicationCreateView(generics.CreateAPIView):
    """Candidate submits a job application."""

    serializer_class = ApplicationCreateSerializer
    permission_classes = [IsAuthenticated, IsCandidate]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        return Response(
            ApplicationListSerializer(application).data,
            status=status.HTTP_201_CREATED,
        )


class MyApplicationsView(generics.ListAPIView):
    """Candidate views all applications submitted by them."""

    serializer_class = ApplicationListSerializer
    permission_classes = [IsAuthenticated, IsCandidate]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['applied_at', 'updated_at']

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'candidate_profile'):
            return Application.objects.filter(candidate=user.candidate_profile).select_related('job', 'job__recruiter')
        return Application.objects.none()


class RecruiterApplicationsView(generics.ListAPIView):
    """Recruiter lists applications for jobs posted by their company."""

    serializer_class = ApplicationListSerializer
    permission_classes = [IsAuthenticated, IsRecruiterOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['job', 'status']
    search_fields = ['candidate__user__first_name', 'candidate__user__last_name', 'candidate__user__email', 'job__title']
    ordering_fields = ['applied_at', 'status']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Application.objects.all().select_related('job', 'candidate__user', 'job__recruiter')
        if hasattr(user, 'recruiter_profile'):
            return Application.objects.filter(
                job__recruiter=user.recruiter_profile
            ).select_related('job', 'candidate__user', 'job__recruiter')
        return Application.objects.none()


class ApplicationDetailView(generics.RetrieveAPIView):
    """View detailed application record."""

    serializer_class = ApplicationDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Application.objects.all()
        if hasattr(user, 'recruiter_profile'):
            return Application.objects.filter(job__recruiter=user.recruiter_profile)
        if hasattr(user, 'candidate_profile'):
            return Application.objects.filter(candidate=user.candidate_profile)
        return Application.objects.none()


class ApplicationStatusUpdateView(generics.UpdateAPIView):
    """Recruiter updates applicant status."""

    serializer_class = ApplicationStatusUpdateSerializer
    permission_classes = [IsAuthenticated, IsRecruiterOrAdmin]
    http_method_names = ['patch', 'put']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Application.objects.all()
        if hasattr(user, 'recruiter_profile'):
            return Application.objects.filter(job__recruiter=user.recruiter_profile)
        return Application.objects.none()
