import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    class Role(models.TextChoices):
        HR_HEAD = "HR_HEAD", "HR Head"
        EMPLOYEE = "EMPLOYEE", "Employee"

    class Gender(models.TextChoices):
        FEMALE = "FEMALE", "Female"
        MALE = "MALE", "Male"
        OTHER = "OTHER", "Other"
        UNDISCLOSED = "UNDISCLOSED", "Prefer not to say"

    full_name = models.CharField(max_length=255)
    nickname = models.CharField(max_length=80, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=16, choices=Gender.choices, default=Gender.UNDISCLOSED)
    department = models.CharField(max_length=120, blank=True)
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.EMPLOYEE)
    consent_aggregated_data = models.BooleanField(default=False)
    survey_completed = models.BooleanField(default=False)

    EMAIL_FIELD = "email"

    def __str__(self):
        return self.email or self.username


class InviteLink(models.Model):
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_invites")
    email_hint = models.EmailField(blank=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    used_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="used_invite")
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_active(self):
        return self.used_at is None and self.expires_at > timezone.now()

    def mark_used(self, user):
        self.used_by = user
        self.used_at = timezone.now()
        self.save(update_fields=["used_by", "used_at"])
