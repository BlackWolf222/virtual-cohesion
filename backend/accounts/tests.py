from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from matching.views import AvailabilitySlotListCreateView, MatchListView
from meetings.views import MeetingListView

from .models import InviteLink, User


class InviteModelTests(TestCase):
    def test_invite_active_status(self):
        creator = User.objects.create_user(username="hr@test", email="hr@test", password="Pass12345", full_name="HR")
        invite = InviteLink.objects.create(created_by=creator, expires_at=timezone.now() + timedelta(days=1))
        self.assertTrue(invite.is_active)


class MandatorySurveyApiAccessTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.incomplete_employee = User.objects.create_user(
            username="employee_incomplete@test",
            email="employee_incomplete@test",
            password="Pass12345",
            full_name="Incomplete Employee",
            role=User.Role.EMPLOYEE,
            survey_completed=False,
        )
        self.completed_employee = User.objects.create_user(
            username="employee_completed@test",
            email="employee_completed@test",
            password="Pass12345",
            full_name="Completed Employee",
            role=User.Role.EMPLOYEE,
            survey_completed=True,
        )

    def _call_view(self, view_cls, method, user, path, data=None):
        request_factory_method = getattr(self.factory, method.lower())
        request = request_factory_method(path, data=data or {}, format="json")
        force_authenticate(request, user=user)
        return view_cls.as_view()(request)

    def test_incomplete_employee_blocked_from_meetings_and_matching_endpoints(self):
        meeting_response = self._call_view(MeetingListView, "get", self.incomplete_employee, "/api/meetings/")
        self.assertEqual(meeting_response.status_code, status.HTTP_403_FORBIDDEN)

        match_list_response = self._call_view(MatchListView, "get", self.incomplete_employee, "/api/matching/list/")
        self.assertEqual(match_list_response.status_code, status.HTTP_403_FORBIDDEN)

        availability_get_response = self._call_view(
            AvailabilitySlotListCreateView,
            "get",
            self.incomplete_employee,
            "/api/matching/availability/",
        )
        self.assertEqual(availability_get_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_completed_employee_can_access_meetings_and_matching_endpoints(self):
        meeting_response = self._call_view(MeetingListView, "get", self.completed_employee, "/api/meetings/")
        self.assertEqual(meeting_response.status_code, status.HTTP_200_OK)

        match_list_response = self._call_view(MatchListView, "get", self.completed_employee, "/api/matching/list/")
        self.assertEqual(match_list_response.status_code, status.HTTP_200_OK)

        availability_get_response = self._call_view(
            AvailabilitySlotListCreateView,
            "get",
            self.completed_employee,
            "/api/matching/availability/",
        )
        self.assertEqual(availability_get_response.status_code, status.HTTP_200_OK)
