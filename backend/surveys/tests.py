from django.test import TestCase

from accounts.models import User
from .models import Hobby, SurveyResponse


class SurveyResponseTests(TestCase):
    def test_create_survey(self):
        user = User.objects.create_user(
            username="employee@test",
            email="employee@test",
            password="Pass12345",
            full_name="Employee",
        )
        hobby = Hobby.objects.create(name="fishing")
        survey = SurveyResponse.objects.create(
            user=user,
            favorite_game="Chess",
            activity_pattern=SurveyResponse.ActivityPattern.FLEXIBLE,
            communication_style=SurveyResponse.CommunicationStyle.TALKER,
            native_language="Hungarian",
            extra_languages=["English"],
        )
        survey.hobbies.add(hobby)
        self.assertEqual(survey.hobbies.count(), 1)
