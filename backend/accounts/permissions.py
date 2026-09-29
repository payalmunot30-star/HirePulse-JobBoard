"""
Reusable permission classes for role-based access control.
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to admin users."""
    message = 'Admin access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsRecruiter(BasePermission):
    """Allow access only to recruiter users."""
    message = 'Recruiter access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'recruiter'
        )


class IsCandidate(BasePermission):
    """Allow access only to candidate users."""
    message = 'Candidate access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'candidate'
        )


class IsRecruiterOrAdmin(BasePermission):
    """Allow access to recruiter or admin users."""
    message = 'Recruiter or admin access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('recruiter', 'admin')
        )


class IsOwnerOrAdmin(BasePermission):
    """Allow access only to the object owner or admin users."""
    message = 'You do not have permission to access this resource.'

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        # Check various ownership patterns
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'recruiter') and hasattr(obj.recruiter, 'user'):
            return obj.recruiter.user == request.user
        if hasattr(obj, 'candidate') and hasattr(obj.candidate, 'user'):
            return obj.candidate.user == request.user
        return obj == request.user
