from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from accounts.models import User
from surveys.models import Hobby, SurveyResponse

from .models import AvailabilitySlot
from .services import run_matching_for_tenant


class MatchingServiceTests(TestCase):
    def test_matching_creates_cross_department_match(self):
        user_a = User.objects.create_user(
            username="a@test",
            email="a@test",
            password="Pass12345",
            full_name="A User",
            department="IT",
            survey_completed=True,
        )
        user_b = User.objects.create_user(
            username="b@test",
            email="b@test",
            password="Pass12345",
            full_name="B User",
            department="Marketing",
            survey_completed=True,
        )
        hobby = Hobby.objects.create(name="fishing")
        survey_a = SurveyResponse.objects.create(
            user=user_a,
            favorite_game="Chess",
            activity_pattern=SurveyResponse.ActivityPattern.FLEXIBLE,
            communication_style=SurveyResponse.CommunicationStyle.LISTENER,
            native_language="Hungarian",
            extra_languages=[],
        )
        survey_a.hobbies.add(hobby)
        survey_b = SurveyResponse.objects.create(
            user=user_b,
            favorite_game="Chess",
            activity_pattern=SurveyResponse.ActivityPattern.FLEXIBLE,
            communication_style=SurveyResponse.CommunicationStyle.TALKER,
            native_language="Hungarian",
            extra_languages=[],
        )
        survey_b.hobbies.add(hobby)
        starts_at = timezone.now() + timedelta(hours=2)
        ends_at = starts_at + timedelta(hours=1)
        AvailabilitySlot.objects.create(user=user_a, starts_at=starts_at, ends_at=ends_at)
        AvailabilitySlot.objects.create(user=user_b, starts_at=starts_at, ends_at=ends_at)

        matches = run_matching_for_tenant()
        self.assertEqual(len(matches), 1)
