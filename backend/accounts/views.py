"""
Views for authentication, user management, and profile management.
"""
import logging
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.db.models import Q
from rest_framework import generics, permissions, status, serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.utils import extend_schema, extend_schema_view

logger = logging.getLogger('accounts.views')

from .models import User, CandidateProfile, RecruiterProfile
from .permissions import IsAdmin, IsRecruiterOrAdmin
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    ChangePasswordSerializer,
    UserSerializer,
    AdminUserSerializer,
    AdminRecruiterSerializer,
    CandidateProfileSerializer,
    CandidateProfileUpdateSerializer,
    RecruiterProfileSerializer,
    RecruiterProfileUpdateSerializer,
)

# Authentication & Session Handlers

@extend_schema(tags=['Auth'])
class RegisterView(generics.CreateAPIView):
    """Register a new user (candidate or recruiter)."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Registration successful.',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Auth'])
class LoginView(APIView):
    """Authenticate user and return JWT tokens."""
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Login successful.',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        })


@extend_schema(tags=['Auth'])
class LogoutView(APIView):
    """Blacklist the refresh token to logout."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'message': 'Logout successful.'},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {'error': 'Invalid token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


@extend_schema(tags=['Auth'])
class PasswordResetRequestView(APIView):
    """Request a password reset email."""
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email, is_active=True)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            origin = request.META.get('HTTP_ORIGIN') or 'http://localhost:3000'
            origin = origin.rstrip('/')
            reset_url = f"{origin}/reset-password/{uid}/{token}"

            send_mail(
                subject='Password Reset - HirePulse Job Portal',
                message=f'Click the link to reset your password: {reset_url}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=(
                    f'<h2>Password Reset Request</h2>'
                    f'<p>Hi {user.first_name or "there"},</p>'
                    f'<p>You recently requested to reset your password for your HirePulse Job Portal account.</p>'
                    f'<p>Click the link below to set a new password:</p>'
                    f'<p style="margin: 20px 0;"><a href="{reset_url}" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a></p>'
                    f'<p>Or copy and paste this link into your browser:</p>'
                    f'<p><a href="{reset_url}">{reset_url}</a></p>'
                    f'<p>If you did not request this, please ignore this email.</p>'
                ),
                fail_silently=False,
            )
            logger.info(f"Password reset email sent to {user.email}")
        except User.DoesNotExist:
            logger.info(f"Password reset requested for non-existent email: {email}")
        except Exception as e:
            logger.error(f"Error sending password reset email to {email}: {e}")

        return Response({
            'message': 'If an account with this email exists, a password reset link has been sent.',
        })


@extend_schema(tags=['Auth'])
class PasswordResetConfirmView(APIView):
    """Confirm password reset with uid and token."""
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Password has been reset successfully.'})


@extend_schema(tags=['Auth'])
class ChangePasswordView(APIView):
    """Change password for authenticated user."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Password changed successfully.'})


@extend_schema(tags=['Auth'])
class MeView(APIView):
    """Get current authenticated user info."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        data = UserSerializer(user).data

        # Include profile data based on role
        if user.is_candidate and hasattr(user, 'candidate_profile'):
            data['profile'] = CandidateProfileSerializer(
                user.candidate_profile,
                context={'request': request},
            ).data
        elif user.is_recruiter and hasattr(user, 'recruiter_profile'):
            data['profile'] = RecruiterProfileSerializer(
                user.recruiter_profile,
                context={'request': request},
            ).data

        return Response(data)


# Administration & User Moderation Endpoints

@extend_schema(tags=['Users'])
class UserListView(generics.ListAPIView):
    """List all registered users (admin only)."""
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = User.objects.all()
    filterset_fields = ['role', 'is_active']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'email', 'first_name']


@extend_schema(tags=['Users'])
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View, update, or deactivate a user account (admin only)."""
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = User.objects.all()

    def perform_destroy(self, instance):
        if instance.role == User.Role.ADMIN:
            raise serializers.ValidationError({"detail": "Admin accounts cannot be deleted."})
        instance.delete()


@extend_schema(tags=['Users'])
class AdminRecruiterListView(generics.ListAPIView):
    """List recruiters (admin only). Dedicated recruiter creation endpoint has been removed."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminRecruiterSerializer
    queryset = User.objects.filter(role=User.Role.RECRUITER).select_related('recruiter_profile').order_by('-created_at')
    filterset_fields = ['is_active']
    search_fields = ['email', 'first_name', 'last_name', 'recruiter_profile__company_name']
    ordering_fields = ['created_at', 'email', 'first_name']


# Backward-compatibility alias
AdminRecruiterListCreateView = AdminRecruiterListView


# Profile Lifecycle & Search Endpoints

@extend_schema(tags=['Users'])
class CandidateProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the authenticated candidate's profile."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return CandidateProfileUpdateSerializer
        return CandidateProfileSerializer

    def get_object(self):
        user = self.request.user
        if not getattr(user, 'is_candidate', False):
            raise PermissionDenied('Only candidates can access candidate profiles.')
        profile, _ = CandidateProfile.objects.get_or_create(user=user)
        return profile


@extend_schema(tags=['Users'])
class RecruiterProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the authenticated recruiter's profile."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return RecruiterProfileUpdateSerializer
        return RecruiterProfileSerializer

    def get_object(self):
        user = self.request.user
        if not getattr(user, 'is_recruiter', False):
            raise PermissionDenied('Only recruiters can access recruiter profiles.')
        profile, _ = RecruiterProfile.objects.get_or_create(user=user)
        return profile

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(RecruiterProfileSerializer(instance, context={'request': request}).data)


@extend_schema(tags=['Users'])
class CandidateListView(generics.ListAPIView):
    """List candidate profiles (recruiter/admin only) with search."""
    serializer_class = CandidateProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiterOrAdmin]

    def get_queryset(self):
        queryset = CandidateProfile.objects.select_related('user').all()
        search = self.request.query_params.get('search', '').strip()
        skills = self.request.query_params.get('skills', '').strip()
        location = self.request.query_params.get('location', '').strip()

        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(bio__icontains=search)
            )

        if skills:
            skill_list = [s.strip().lower() for s in skills.split(',')]
            for skill in skill_list:
                queryset = queryset.filter(skills__icontains=skill)

        if location:
            queryset = queryset.filter(location__icontains=location)

        return queryset


@extend_schema(tags=['Users'])
class CandidateDetailView(generics.RetrieveAPIView):
    """View a specific candidate profile (recruiter/admin only)."""
    serializer_class = CandidateProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiterOrAdmin]
    queryset = CandidateProfile.objects.select_related('user').all()
