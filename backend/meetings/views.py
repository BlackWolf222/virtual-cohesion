from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import HasCompletedMandatorySurvey

from .models import CalendarEvent, Meeting
from .serializers import CalendarEventImportSerializer, CalendarEventSerializer, MeetingSerializer


class MeetingListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, HasCompletedMandatorySurvey]
    serializer_class = MeetingSerializer

    def get_queryset(self):
        user = self.request.user
        return Meeting.objects.filter(Q(organizer=user) | Q(participant=user)).order_by("starts_at")


class CalendarEventListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, HasCompletedMandatorySurvey]
    serializer_class = CalendarEventSerializer

    def get_queryset(self):
        return CalendarEvent.objects.filter(owner=self.request.user).order_by("starts_at")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user, source=CalendarEvent.Source.MANUAL)


class CalendarEventImportView(APIView):
    permission_classes = [permissions.IsAuthenticated, HasCompletedMandatorySurvey]

    def post(self, request):
        serializer = CalendarEventImportSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        created_events = serializer.save()
        return Response(CalendarEventSerializer(created_events, many=True).data, status=status.HTTP_201_CREATED)
