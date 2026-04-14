from django.db.models import Count, F
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import IsHRHead
from matching.models import ConnectionMatch
from surveys.models import SurveyResponse


class AnalyticsSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsHRHead]

    def get(self, request):
        total_users = User.objects.filter(role=User.Role.EMPLOYEE).count()
        consented_users = User.objects.filter(role=User.Role.EMPLOYEE, consent_aggregated_data=True).count()
        survey_completed_users = User.objects.filter(role=User.Role.EMPLOYEE, survey_completed=True).count()
        total_matches = ConnectionMatch.objects.count()
        cross_dept_matches = ConnectionMatch.objects.exclude(user_one__department=F("user_two__department")).count()
        top_hobbies = (
            SurveyResponse.objects.values("hobbies__name")
            .annotate(total=Count("hobbies"))
            .order_by("-total")[:5]
        )
        return Response(
            {
                "employee_count": total_users,
                "consent_rate": (consented_users / total_users * 100) if total_users else 0,
                "survey_completion_rate": (survey_completed_users / total_users * 100) if total_users else 0,
                "total_matches": total_matches,
                "cross_department_matches": cross_dept_matches,
                "top_hobbies": [h for h in top_hobbies if h["hobbies__name"]],
            }
        )
