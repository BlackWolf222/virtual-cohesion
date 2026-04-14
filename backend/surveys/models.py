from django.db import models


class Hobby(models.Model):
    name = models.CharField(max_length=80, unique=True)

    def __str__(self):
        return self.name


class SurveyResponse(models.Model):
    class CommunicationStyle(models.TextChoices):
        LISTENER = "LISTENER", "Listener"
        TALKER = "TALKER", "Talker"
        PASSIVE = "PASSIVE", "Passive"

    class ActivityPattern(models.TextChoices):
        MORNING = "MORNING", "Morning"
        AFTERNOON = "AFTERNOON", "Afternoon"
        EVENING = "EVENING", "Evening"
        FLEXIBLE = "FLEXIBLE", "Flexible"

    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="survey")
    favorite_game = models.CharField(max_length=120)
    activity_pattern = models.CharField(max_length=16, choices=ActivityPattern.choices)
    communication_style = models.CharField(max_length=16, choices=CommunicationStyle.choices)
    native_language = models.CharField(max_length=80)
    extra_languages = models.JSONField(default=list, blank=True)
    hobbies = models.ManyToManyField(Hobby, related_name="responses")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Survey({self.user_id})"
