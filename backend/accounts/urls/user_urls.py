"""User and profile management URL patterns."""
from django.urls import path

from accounts.views import (
    UserListView,
    UserDetailView,
    AdminRecruiterListCreateView,
    CandidateProfileView,
    RecruiterProfileView,
    CandidateListView,
    CandidateDetailView,
)

urlpatterns = [
    # Admin user & recruiter management
    path('', UserListView.as_view(), name='user-list'),
    path('recruiters/', AdminRecruiterListCreateView.as_view(), name='admin-recruiter-list-create'),
    path('<int:pk>/', UserDetailView.as_view(), name='user-detail'),

    # Profile management
    path('profile/candidate/', CandidateProfileView.as_view(), name='candidate-profile'),
    path('profile/recruiter/', RecruiterProfileView.as_view(), name='recruiter-profile'),

    # Candidate search (for recruiters)
    path('candidates/', CandidateListView.as_view(), name='candidate-list'),
    path('candidates/<int:pk>/', CandidateDetailView.as_view(), name='candidate-detail'),
]
