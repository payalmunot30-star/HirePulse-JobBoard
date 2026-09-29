"""
Dashboard URL routing.
"""
from django.urls import path
from .views import RecruiterDashboardView, AdminDashboardView, AdminHiringPipelineView, CandidateDashboardView

urlpatterns = [
    path('recruiter/', RecruiterDashboardView.as_view(), name='dashboard-recruiter'),
    path('admin/', AdminDashboardView.as_view(), name='dashboard-admin'),
    path('admin/hiring-pipeline/', AdminHiringPipelineView.as_view(), name='admin-hiring-pipeline'),
    path('candidate/', CandidateDashboardView.as_view(), name='dashboard-candidate'),
]

