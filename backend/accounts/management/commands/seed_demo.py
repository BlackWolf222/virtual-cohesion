from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from django_tenants.utils import get_tenant_model, schema_context

from accounts.models import InviteLink, User
from companies.models import Domain
from matching.models import AvailabilitySlot
from surveys.models import Hobby, SurveyResponse


class Command(BaseCommand):
    help = "Seed demo tenant and users for Virtual Cohesion MVP."

    def handle(self, *args, **options):
        Tenant = get_tenant_model()
        tenant, _ = Tenant.objects.get_or_create(schema_name="demo", defaults={"name": "Demo Company"})
        Domain.objects.get_or_create(domain="demo.localhost", tenant=tenant, defaults={"is_primary": True})

        demo_invite_token = None
        with schema_context(tenant.schema_name):
            hr, _ = User.objects.get_or_create(
                email="hr@demo.local",
                defaults={
                    "username": "hr@demo.local",
                    "full_name": "Demo HR",
                    "role": User.Role.HR_HEAD,
                    "consent_aggregated_data": True,
                },
            )
            hr.set_password("ChangeMe123!")
            hr.save()

            user, _ = User.objects.get_or_create(
                email="employee@demo.local",
                defaults={
                    "username": "employee@demo.local",
                    "full_name": "Demo Employee",
                    "department": "IT",
                    "consent_aggregated_data": True,
                    "survey_completed": True,
                },
            )
            user.set_password("ChangeMe123!")
            user.save()

            # One reusable unused invite for registration demos (avoid piling up on restart).
            demo_invite = InviteLink.objects.filter(
                created_by=hr,
                used_at__isnull=True,
                email_hint="newhire@demo.local",
            ).first()
            if not demo_invite:
                demo_invite = InviteLink.objects.create(
                    created_by=hr,
                    email_hint="newhire@demo.local",
                    expires_at=timezone.now() + timedelta(days=30),
                )
            demo_invite_token = str(demo_invite.token)

            hobby, _ = Hobby.objects.get_or_create(name="fishing")
            survey, _ = SurveyResponse.objects.get_or_create(
                user=user,
                defaults={
                    "favorite_game": "Chess",
                    "activity_pattern": SurveyResponse.ActivityPattern.FLEXIBLE,
                    "communication_style": SurveyResponse.CommunicationStyle.TALKER,
                    "native_language": "Hungarian",
                    "extra_languages": ["English"],
                },
            )
            survey.hobbies.add(hobby)
            AvailabilitySlot.objects.get_or_create(
                user=user,
                starts_at=timezone.now() + timedelta(days=1),
                ends_at=timezone.now() + timedelta(days=1, hours=1),
            )

        self.stdout.write(self.style.SUCCESS("Demo seed completed for schema demo."))
        self.stdout.write(
            self.style.NOTICE(
                "Open the app at http://demo.localhost/ (not plain http://localhost — auth routes live on tenant hosts).\n"
                f"Register with invite_token: {demo_invite_token}\n"
                "Login: hr@demo.local or employee@demo.local / password: ChangeMe123!"
            )
        )
