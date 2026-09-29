import os
import django
import math
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.files.base import ContentFile
from accounts.models import User, RecruiterProfile
from jobs.models import Job

def create_artistic_banner(palette_type='green'):
    # Dimensions: 600x200
    width, height = 600, 200
    img = Image.new('RGB', (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    if palette_type == 'green':
        # ABC Technologies - Lush tropical / emerald curves inspired by reference image
        # Background gradient: lime/mint to soft cream
        for y in range(height):
            r = int(240 + (15 * y / height))
            g = int(253 - (10 * y / height))
            b = int(244 - (14 * y / height))
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        # Draw overlapping organic leaf-like arcs
        leaf_colors = [
            (34, 197, 94),   # emerald
            (16, 185, 129),  # green
            (74, 222, 128),  # light green
            (132, 204, 22),  # lime
            (5, 150, 105),   # deep emerald
            (168, 85, 247),  # purple accent tip
        ]

        # Draw sweeping ribbons
        for i, col in enumerate(leaf_colors):
            offset = i * 25
            points = []
            for x in range(0, width, 5):
                y = int(100 + 45 * math.sin((x + offset * 3) / 70.0) + (i * 12) - 40)
                points.append((x, y))
            points.append((width, height))
            points.append((0, height))
            draw.polygon(points, fill=col)

    else:
        # XYZ Solutions - Modern sapphire / cyan tech flow
        for y in range(height):
            r = int(238 + (12 * y / height))
            g = int(242 - (15 * y / height))
            b = int(255 - (5 * y / height))
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        blue_colors = [
            (37, 99, 235),   # royal blue
            (14, 165, 233),  # sky blue
            (79, 70, 229),   # indigo
            (6, 182, 212),   # cyan
            (30, 64, 175),   # dark sapphire
        ]

        for i, col in enumerate(blue_colors):
            offset = i * 28
            points = []
            for x in range(0, width, 5):
                y = int(95 + 40 * math.cos((x + offset * 3) / 65.0) + (i * 14) - 35)
                points.append((x, y))
            points.append((width, height))
            points.append((0, height))
            draw.polygon(points, fill=col)

    buf = BytesIO()
    img.save(buf, format='JPEG', quality=95)
    return ContentFile(buf.getvalue(), name=f"{palette_type}_banner.jpg")

def create_brand_logo(name, accent_color):
    # Dimensions: 240x80 (landscape company logo like TELUS Digital)
    width, height = 240, 70
    img = Image.new('RGBA', (width, height), color=(255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # Draw modern logo symbol on left
    draw.rounded_rectangle([4, 10, 50, 56], radius=10, fill=accent_color)
    # Inner accent dot/shape
    draw.ellipse([18, 24, 36, 42], fill=(255, 255, 255, 240))

    # Text drawing fallback (using bitmap shapes for reliability)
    # We will draw crisp initials or logo mark
    buf = BytesIO()
    img.save(buf, format='PNG')
    return ContentFile(buf.getvalue(), name=f"{name.lower().replace(' ', '_')}_logo.png")

def update_recruiters():
    # 1. ABC Technologies
    try:
        u1 = User.objects.get(email='recruiter1@abctech.com')
        p1 = u1.recruiter_profile
        p1.company_name = 'ABC Technologies'
        p1.company_description = 'The cloud experience transformation partner'
        p1.company_website = 'https://abctechnologies.com'
        p1.company_location = 'Pune, Maharashtra'
        p1.position = 'Lead Talent Acquisition'
        p1.brand_color = '#059669'
        p1.company_banner = create_artistic_banner('green')
        p1.company_logo = create_brand_logo('ABC Technologies', (5, 150, 105))
        p1.save()
        print("Updated ABC Technologies profile with artistic green banner and logo.")
    except Exception as e:
        print("Error updating ABC:", e)

    # 2. XYZ Solutions
    try:
        u2 = User.objects.get(email='recruiter2@xyzsolutions.com')
        p2 = u2.recruiter_profile
        p2.company_name = 'XYZ Solutions'
        p2.company_description = 'Next-generation AI and high-throughput systems'
        p2.company_website = 'https://xyzsolutions.com'
        p2.company_location = 'Mumbai, Maharashtra'
        p2.position = 'Senior Talent Acquisition'
        p2.brand_color = '#2563eb'
        p2.company_banner = create_artistic_banner('blue')
        p2.company_logo = create_brand_logo('XYZ Solutions', (37, 99, 235))
        p2.save()
        print("Updated XYZ Solutions profile with artistic blue banner and logo.")
    except Exception as e:
        print("Error updating XYZ:", e)

if __name__ == '__main__':
    update_recruiters()
