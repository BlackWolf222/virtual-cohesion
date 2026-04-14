from rest_framework import generics, permissions
from rest_framework.response import Response

from .models import SurveyResponse
from .serializers import SurveyResponseSerializer


class SurveyResponseView(generics.CreateAPIView, generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SurveyResponseSerializer

    def get_object(self):
        return SurveyResponse.objects.get(user=self.request.user)

    def create(self, request, *args, **kwargs):
        existing = SurveyResponse.objects.filter(user=request.user).first()
        serializer = self.get_serializer(instance=existing, data=request.data, partial=bool(existing))
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
