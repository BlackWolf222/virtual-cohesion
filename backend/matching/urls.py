from django.urls import path

from .views import AvailabilitySlotListCreateView, MatchListView, RunMatchingView

urlpatterns = [
    path("availability/", AvailabilitySlotListCreateView.as_view(), name="availability"),
    path("run/", RunMatchingView.as_view(), name="run-matching"),
    path("list/", MatchListView.as_view(), name="match-list"),
]
