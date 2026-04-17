from django.db import models


class Meeting(models.Model):
    match = models.OneToOneField("matching.ConnectionMatch", on_delete=models.CASCADE, related_name="meeting")
    organizer = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="organized_meetings")
    participant = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="participating_meetings")
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    video_url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Meeting#{self.id}"


class CalendarEvent(models.Model):
    class Source(models.TextChoices):
        MANUAL = "MANUAL", "Manual"
        IMPORTED = "IMPORTED", "Imported"

    owner = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="calendar_events")
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    video_url = models.URLField(blank=True)
    source = models.CharField(max_length=16, choices=Source.choices, default=Source.MANUAL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("starts_at", "id")

    def __str__(self):
        return f"CalendarEvent#{self.id} {self.title}"
