from django.urls import path

from .views import CalendarEventImportView, CalendarEventListCreateView, MeetingListView

urlpatterns = [
    path("", MeetingListView.as_view(), name="meetings"),
    path("calendar-events/", CalendarEventListCreateView.as_view(), name="calendar-events"),
    path("calendar-events/import/", CalendarEventImportView.as_view(), name="calendar-events-import"),
]
