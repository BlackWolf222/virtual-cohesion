from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import HasCompletedMandatorySurvey, IsHRHead

from .models import AvailabilitySlot, ConnectionMatch
from .serializers import AvailabilitySlotSerializer, ConnectionMatchSerializer
from .services import run_matching_for_tenant


class AvailabilitySlotListCreateView(generics.ListCreateAPIView):
    serializer_class = AvailabilitySlotSerializer
    permission_classes = [permissions.IsAuthenticated, HasCompletedMandatorySurvey]

    def get_queryset(self):
        return AvailabilitySlot.objects.filter(user=self.request.user)


class RunMatchingView(APIView):
    permission_classes = [permissions.IsAuthenticated, HasCompletedMandatorySurvey, IsHRHead]

    def post(self, request):
        matches = run_matching_for_tenant()
        return Response(ConnectionMatchSerializer(matches, many=True).data, status=status.HTTP_201_CREATED)


class MatchListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, HasCompletedMandatorySurvey]
    serializer_class = ConnectionMatchSerializer

    def get_queryset(self):
        user = self.request.user
        return ConnectionMatch.objects.filter(user_one=user) | ConnectionMatch.objects.filter(user_two=user)
