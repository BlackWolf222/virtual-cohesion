from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import InviteLink, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ("email", "full_name", "role", "department", "survey_completed", "is_staff")
    fieldsets = UserAdmin.fieldsets + (
        (
            "Virtual Cohesion",
            {
                "fields": (
                    "full_name",
                    "nickname",
                    "birth_date",
                    "gender",
                    "department",
                    "role",
                    "consent_aggregated_data",
                    "survey_completed",
                )
            },
        ),
    )


@admin.register(InviteLink)
class InviteLinkAdmin(admin.ModelAdmin):
    list_display = ("token", "created_by", "email_hint", "expires_at", "used_at")
