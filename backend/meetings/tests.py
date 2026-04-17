from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from accounts.models import User

from .models import CalendarEvent
from .views import CalendarEventImportView, CalendarEventListCreateView


class CalendarEventApiTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username="calendar_user@test",
            email="calendar_user@test",
            password="Pass12345",
            full_name="Calendar User",
            role=User.Role.EMPLOYEE,
            survey_completed=True,
        )
        self.blocked_user = User.objects.create_user(
            username="blocked_calendar_user@test",
            email="blocked_calendar_user@test",
            password="Pass12345",
            full_name="Blocked Calendar User",
            role=User.Role.EMPLOYEE,
            survey_completed=False,
        )

    def test_create_calendar_event_persists_manual_event(self):
        starts_at = timezone.now() + timedelta(days=1)
        ends_at = starts_at + timedelta(hours=1)
        payload = {
            "title": "Manual event",
            "description": "Team sync",
            "starts_at": starts_at.isoformat(),
            "ends_at": ends_at.isoformat(),
            "video_url": "https://meet.example.com/manual-sync",
        }

        request = self.factory.post("/api/meetings/calendar-events/", payload, format="json")
        force_authenticate(request, user=self.user)
        response = CalendarEventListCreateView.as_view()(request)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CalendarEvent.objects.count(), 1)
        created_event = CalendarEvent.objects.first()
        self.assertEqual(created_event.source, CalendarEvent.Source.MANUAL)
        self.assertEqual(created_event.title, "Manual event")

    def test_import_calendar_events_persists_imported_events(self):
        starts_at = timezone.now() + timedelta(days=2)
        payload = {
            "events": [
                {
                    "title": "Imported #1",
                    "description": "Imported meeting one",
                    "starts_at": starts_at.isoformat(),
                    "ends_at": (starts_at + timedelta(hours=1)).isoformat(),
                    "video_url": "",
                },
                {
                    "title": "Imported #2",
                    "description": "Imported meeting two",
                    "starts_at": (starts_at + timedelta(hours=2)).isoformat(),
                    "ends_at": (starts_at + timedelta(hours=3)).isoformat(),
                    "video_url": "https://meet.example.com/imported-two",
                },
            ]
        }

        request = self.factory.post("/api/meetings/calendar-events/import/", payload, format="json")
        force_authenticate(request, user=self.user)
        response = CalendarEventImportView.as_view()(request)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CalendarEvent.objects.count(), 2)
        self.assertEqual(
            CalendarEvent.objects.filter(source=CalendarEvent.Source.IMPORTED, owner=self.user).count(),
            2,
        )

    def test_incomplete_survey_user_cannot_create_calendar_event(self):
        starts_at = timezone.now() + timedelta(days=1)
        payload = {
            "title": "Blocked event",
            "description": "Should fail",
            "starts_at": starts_at.isoformat(),
            "ends_at": (starts_at + timedelta(hours=1)).isoformat(),
            "video_url": "",
        }

        request = self.factory.post("/api/meetings/calendar-events/", payload, format="json")
        force_authenticate(request, user=self.blocked_user)
        response = CalendarEventListCreateView.as_view()(request)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(CalendarEvent.objects.count(), 0)
