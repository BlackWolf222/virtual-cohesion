from django.urls import path

from .views import SurveyResponseView

urlpatterns = [
    path("me/", SurveyResponseView.as_view(), name="survey-me"),
]
