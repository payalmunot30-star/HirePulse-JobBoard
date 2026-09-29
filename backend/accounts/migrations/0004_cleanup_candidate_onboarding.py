# Generated to clean up orphaned accounts_candidateonboarding table

from django.db import migrations


def drop_candidate_onboarding_table(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("DROP TABLE IF EXISTS accounts_candidateonboarding CASCADE;")
        cursor.execute("DELETE FROM django_migrations WHERE app = 'accounts' AND name = '0002_add_candidate_onboarding';")


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_candidateprofile_profile_picture'),
    ]

    operations = [
        migrations.RunPython(drop_candidate_onboarding_table, reverse_code=migrations.RunPython.noop),
    ]
