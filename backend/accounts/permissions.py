from rest_framework.permissions import BasePermission

from .models import User


class IsHRHead(BasePermission):
    message = "Only HR head users can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.HR_HEAD)


class HasCompletedMandatorySurvey(BasePermission):
    message = "Complete the mandatory survey before accessing this endpoint."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.role != User.Role.EMPLOYEE:
            return True
        return bool(user.survey_completed)
