"""Django admin for jobs."""
from django.contrib import admin
from .models import Job


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'recruiter', 'category', 'job_type', 'status', 'created_at']
    list_filter = ['status', 'category', 'job_type', 'experience_level']
    search_fields = ['title', 'description', 'location']
    ordering = ['-created_at']
