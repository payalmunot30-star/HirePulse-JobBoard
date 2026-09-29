import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from accounts.models import User
from dashboards.views import AdminHiringPipelineView
import json

admin = User.objects.filter(role='admin').first()
print('Admin:', admin, 'Role:', admin.role)

factory = APIRequestFactory()
request = factory.get('/api/dashboard/admin/hiring-pipeline/')
force_authenticate(request, user=admin)

view = AdminHiringPipelineView.as_view()
response = view(request)
response.render()

print('Status:', response.status_code)
data = json.loads(response.content)

if 'summary' in data:
    print('Summary:', json.dumps(data['summary'], indent=2))
    print('Recruiter count:', len(data['recruiter_overview']))
    print('Job pipeline count:', len(data['job_pipeline']))
    print('Applications count:', len(data['applications']))
    print('Recent activity count:', len(data['recent_activity']))
    print('Recruiter options:', len(data['recruiter_options']))
    print('API endpoint works correctly!')
else:
    print('Response:', json.dumps(data, indent=2))
