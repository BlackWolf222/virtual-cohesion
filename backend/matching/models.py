from django.db import models


class AvailabilitySlot(models.Model):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="availability_slots")
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["starts_at"]


class ConnectionMatch(models.Model):
    class Status(models.TextChoices):
        PROPOSED = "PROPOSED", "Proposed"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"

    user_one = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="matches_as_user_one")
    user_two = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="matches_as_user_two")
    shared_hobby = models.CharField(max_length=80)
    overlap_start = models.DateTimeField()
    overlap_end = models.DateTimeField()
    score = models.FloatField(default=0)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PROPOSED)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user_one", "user_two")

    def __str__(self):
        return f"{self.user_one_id}-{self.user_two_id}"
