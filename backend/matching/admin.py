from django.contrib import admin

from .models import AvailabilitySlot, ConnectionMatch

admin.site.register(AvailabilitySlot)
admin.site.register(ConnectionMatch)
