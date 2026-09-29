"""Job posting URL patterns."""
from django.urls import path
from .views import (
    JobListCreateView,
    JobDetailView,
    RecruiterJobListView,
    close_job,
    job_categories,
    job_choices,
)

urlpatterns = [
    path('', JobListCreateView.as_view(), name='job-list-create'),
    path('my-jobs/', RecruiterJobListView.as_view(), name='recruiter-jobs'),
    path('categories/', job_categories, name='job-categories'),
    path('choices/', job_choices, name='job-choices'),
    path('<int:pk>/', JobDetailView.as_view(), name='job-detail'),
    path('<int:pk>/close/', close_job, name='job-close'),
]
