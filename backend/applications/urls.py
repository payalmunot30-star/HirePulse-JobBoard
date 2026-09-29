"""
Application URLs.
"""
from django.urls import path
from .views import (
    ApplicationCreateView,
    MyApplicationsView,
    RecruiterApplicationsView,
    ApplicationDetailView,
    ApplicationStatusUpdateView,
)

urlpatterns = [
    path('', ApplicationCreateView.as_view(), name='application-create'),
    path('my-applications/', MyApplicationsView.as_view(), name='my-applications'),
    path('recruiter/', RecruiterApplicationsView.as_view(), name='recruiter-applications'),
    path('<int:pk>/', ApplicationDetailView.as_view(), name='application-detail'),
    path('<int:pk>/status/', ApplicationStatusUpdateView.as_view(), name='application-status-update'),
]
