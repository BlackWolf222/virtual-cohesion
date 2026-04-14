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
