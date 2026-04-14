from django.db.models import Q
from rest_framework import generics, permissions

from .models import Meeting
from .serializers import MeetingSerializer


class MeetingListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MeetingSerializer

    def get_queryset(self):
        user = self.request.user
        return Meeting.objects.filter(Q(organizer=user) | Q(participant=user)).order_by("starts_at")
