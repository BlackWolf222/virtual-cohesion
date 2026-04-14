from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from .models import InviteLink, User


class InviteModelTests(TestCase):
    def test_invite_active_status(self):
        creator = User.objects.create_user(username="hr@test", email="hr@test", password="Pass12345", full_name="HR")
        invite = InviteLink.objects.create(created_by=creator, expires_at=timezone.now() + timedelta(days=1))
        self.assertTrue(invite.is_active)
