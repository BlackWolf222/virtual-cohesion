from django.contrib import admin

from .models import CalendarEvent, Meeting

admin.site.register(Meeting)
admin.site.register(CalendarEvent)
