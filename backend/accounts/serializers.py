from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import InviteLink, User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["full_name"] = user.full_name
        token["survey_completed"] = user.survey_completed
        return token


class UserMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "nickname",
            "birth_date",
            "gender",
            "department",
            "role",
            "consent_aggregated_data",
            "survey_completed",
        )


class InviteCreateSerializer(serializers.Serializer):
    email_hint = serializers.EmailField(required=False, allow_blank=True)
    expires_in_days = serializers.IntegerField(min_value=1, max_value=30, default=7)

    def create(self, validated_data):
        request = self.context["request"]
        return InviteLink.objects.create(
            created_by=request.user,
            email_hint=validated_data.get("email_hint", ""),
            expires_at=timezone.now() + timedelta(days=validated_data["expires_in_days"]),
        )


class InviteSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = InviteLink
        fields = ("token", "email_hint", "expires_at", "used_at", "created_at", "is_active")


class EmployeeRegistrationSerializer(serializers.ModelSerializer):
    invite_token = serializers.UUIDField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "invite_token",
            "email",
            "password",
            "full_name",
            "nickname",
            "birth_date",
            "gender",
            "department",
            "consent_aggregated_data",
        )

    def validate_invite_token(self, value):
        try:
            invite = InviteLink.objects.get(token=value)
        except InviteLink.DoesNotExist as exc:
            raise serializers.ValidationError("Invalid invite token.") from exc
        if not invite.is_active:
            raise serializers.ValidationError("Invite is expired or already used.")
        self.context["invite"] = invite
        return value

    def create(self, validated_data):
        validated_data.pop("invite_token")
        invite = self.context["invite"]
        password = validated_data.pop("password")
        email = validated_data.pop("email")
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            role=User.Role.EMPLOYEE,
            **validated_data,
        )
        invite.mark_used(user)
        return user
