import os
import django
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.files.base import ContentFile
from accounts.models import User, RecruiterProfile
from jobs.models import Job

def create_banner_image(primary_color, secondary_color, title_text):
    img = Image.new('RGB', (600, 200), color=primary_color)
    draw = ImageDraw.Draw(img)
    # Add abstract geometry pattern
    for i in range(0, 600, 40):
        draw.line([(i, 0), (i + 100, 200)], fill=secondary_color, width=2)
    # Overlay rounded accent
    draw.rectangle([20, 20, 580, 180], outline=(255, 255, 255, 120), width=3)
    buf = BytesIO()
    img.save(buf, format='JPEG', quality=90)
    return ContentFile(buf.getvalue(), name=f"{title_text.lower().replace(' ', '_')}_banner.jpg")

def create_logo_image(bg_color, text_color, initials):
    img = Image.new('RGB', (200, 200), color=bg_color)
    draw = ImageDraw.Draw(img)
    # Draw simple badge circle
    draw.ellipse([20, 20, 180, 180], outline=text_color, width=6)
    buf = BytesIO()
    img.save(buf, format='PNG')
    return ContentFile(buf.getvalue(), name=f"{initials.lower()}_logo.png")

def setup():
    # 1. Setup ABC Technologies
    u1, _ = User.objects.get_or_create(
        email='recruiter1@abctech.com',
        defaults={
            'first_name': 'Sarah',
            'last_name': 'Connor',
            'role': User.Role.RECRUITER,
            'is_active': True,
        }
    )
    u1.set_password('TestPassword123!')
    u1.save()

    p1, _ = RecruiterProfile.objects.get_or_create(user=u1)
    p1.company_name = 'ABC Technologies'
    p1.company_description = 'Next-gen enterprise software and full-stack web solutions.'
    p1.company_website = 'https://abctechnologies.com'
    p1.company_location = 'Pune, Maharashtra'
    p1.position = 'Lead Technical Recruiter'
    p1.brand_color = '#059669'
    p1.company_banner = create_banner_image((5, 150, 105), (16, 185, 129), 'ABC')
    p1.company_logo = create_logo_image((5, 150, 105), (255, 255, 255), 'ABC')
    p1.save()

    # Create job for ABC Technologies
    j1, _ = Job.objects.get_or_create(
        recruiter=p1,
        title='Senior React Developer',
        defaults={
            'description': 'Senior React Developer to build high performance UI applications with state of the art web technologies.',
            'category': Job.Category.ENGINEERING,
            'location': 'Pune, Maharashtra',
            'job_type': Job.JobType.FULL_TIME,
            'experience_level': Job.ExperienceLevel.EXP_2_5,
            'salary_min': 1200000,
            'salary_max': 1800000,
            'skills_required': ['React', 'TypeScript', 'Redux', 'TailwindCSS'],
            'status': Job.Status.ACTIVE,
        }
    )
    print("ABC Job created:", j1.id, j1.title, "at", j1.recruiter.company_name)

    # 2. Setup XYZ Solutions
    u2, _ = User.objects.get_or_create(
        email='recruiter2@xyzsolutions.com',
        defaults={
            'first_name': 'Alex',
            'last_name': 'Mercer',
            'role': User.Role.RECRUITER,
            'is_active': True,
        }
    )
    u2.set_password('TestPassword123!')
    u2.save()

    p2, _ = RecruiterProfile.objects.get_or_create(user=u2)
    p2.company_name = 'XYZ Solutions'
    p2.company_description = 'High performance distributed backend and AI infrastructure.'
    p2.company_website = 'https://xyzsolutions.com'
    p2.company_location = 'Mumbai, Maharashtra'
    p2.position = 'Senior Talent Partner'
    p2.brand_color = '#2563eb'
    p2.company_banner = create_banner_image((37, 99, 235), (59, 130, 246), 'XYZ')
    p2.company_logo = create_logo_image((37, 99, 235), (255, 255, 255), 'XYZ')
    p2.save()

    # Create job for XYZ Solutions
    j2, _ = Job.objects.get_or_create(
        recruiter=p2,
        title='Python Developer',
        defaults={
            'description': 'Python Developer passionate about designing resilient microservices, Django backends, and data streaming.',
            'category': Job.Category.ENGINEERING,
            'location': 'Mumbai, Maharashtra',
            'job_type': Job.JobType.FULL_TIME,
            'experience_level': Job.ExperienceLevel.EXP_2_5,
            'salary_min': 1000000,
            'salary_max': 1600000,
            'skills_required': ['Python', 'Django', 'PostgreSQL', 'FastAPI'],
            'status': Job.Status.ACTIVE,
        }
    )
    print("XYZ Job created:", j2.id, j2.title, "at", j2.recruiter.company_name)

if __name__ == '__main__':
    setup()
