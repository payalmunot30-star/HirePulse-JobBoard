"""
Django-filter FilterSet for jobs.
"""
import django_filters
from .models import Job


class JobFilter(django_filters.FilterSet):
    """Filter jobs by category, location, experience level, job type, and salary."""

    category = django_filters.ChoiceFilter(choices=Job.Category.choices)
    location = django_filters.CharFilter(lookup_expr='icontains')
    experience_level = django_filters.ChoiceFilter(choices=Job.ExperienceLevel.choices)
    job_type = django_filters.ChoiceFilter(choices=Job.JobType.choices)
    salary_min = django_filters.NumberFilter(field_name='salary_min', lookup_expr='gte')
    salary_max = django_filters.NumberFilter(field_name='salary_max', lookup_expr='lte')
    skills = django_filters.CharFilter(method='filter_skills')
    status = django_filters.ChoiceFilter(choices=Job.Status.choices)

    class Meta:
        model = Job
        fields = [
            'category', 'location', 'experience_level',
            'job_type', 'salary_min', 'salary_max', 'status',
        ]

    def filter_skills(self, queryset, name, value):
        """Filter by skills (comma-separated list)."""
        if not value:
            return queryset
        skills = [s.strip().lower() for s in value.split(',') if s.strip()]
        for skill in skills:
            queryset = queryset.filter(skills_required__icontains=skill)
        return queryset
