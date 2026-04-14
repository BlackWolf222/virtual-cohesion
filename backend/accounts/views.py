from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import InviteLink
from .permissions import IsHRHead
from .serializers import (
    CustomTokenObtainPairSerializer,
    EmployeeRegistrationSerializer,
    InviteCreateSerializer,
    InviteSerializer,
    UserMeSerializer,
)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserMeSerializer

    def get_object(self):
        return self.request.user


class InviteListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsHRHead]

    def get(self, request):
        invites = InviteLink.objects.order_by("-created_at")
        return Response(InviteSerializer(invites, many=True).data)

    def post(self, request):
        serializer = InviteCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        invite = serializer.save()
        return Response(InviteSerializer(invite).data, status=status.HTTP_201_CREATED)


class EmployeeRegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = EmployeeRegistrationSerializer
