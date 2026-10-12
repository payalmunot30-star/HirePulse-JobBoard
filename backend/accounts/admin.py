"""Django admin configuration for accounts."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm
from django.core.exceptions import ValidationError

from .models import User, CandidateProfile, RecruiterProfile


class AdminUserCreationForm(UserCreationForm):
    """
    Dedicated user-creation form for Django Admin.
    Restricts account creation to Candidate and Admin roles only.
    Recruiter accounts must register through the public registration flow (/api/auth/register/)
    with company information.
    """

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('email', 'first_name', 'last_name', 'role')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'role' in self.fields:
            self.fields['role'].choices = [
                (choice, label)
                for choice, label in User.Role.choices
                if choice != User.Role.RECRUITER
            ]

    def clean(self):
        cleaned_data = super().clean()
        if self.data.get('role') == User.Role.RECRUITER:
            self.errors.pop('role', None)
            self.add_error(
                'role',
                ValidationError(
                    'Recruiter accounts must be created through the public registration flow (/api/auth/register/) with company information.'
                )
            )
        return cleaned_data


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = AdminUserCreationForm
    list_display = ['email', 'first_name', 'last_name', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'is_staff', 'created_at']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-created_at']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        """Make role field read-only when editing an existing user."""
        if obj is not None:
            return tuple(self.readonly_fields) + ('role',)
        return self.readonly_fields

    def save_model(self, request, obj, form, change):
        """Ensure recruiter creation cannot occur in Django admin and role cannot be altered."""
        if change:
            orig = User.objects.get(pk=obj.pk)
            if orig.role != obj.role:
                obj.role = orig.role
        elif obj.role == User.Role.RECRUITER:
            raise ValidationError(
                'Recruiter accounts must be created through the public registration flow (/api/auth/register/) with company information.'
            )
        super().save_model(request, obj, form, change)


@admin.register(CandidateProfile)
class CandidateProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone', 'location', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']


@admin.register(RecruiterProfile)
class RecruiterProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'company_name', 'company_location', 'created_at']
    search_fields = ['user__email', 'company_name']

