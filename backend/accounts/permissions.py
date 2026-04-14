from rest_framework.permissions import BasePermission

from .models import User


class IsHRHead(BasePermission):
    message = "Only HR head users can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.HR_HEAD)
