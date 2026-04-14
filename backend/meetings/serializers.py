from rest_framework import serializers

from .models import Meeting


class MeetingSerializer(serializers.ModelSerializer):
    other_person = serializers.SerializerMethodField()
    shared_hobby = serializers.SerializerMethodField()

    class Meta:
        model = Meeting
        fields = ("id", "starts_at", "ends_at", "video_url", "shared_hobby", "other_person")

    def get_other_person(self, obj):
        user = self.context["request"].user
        if obj.organizer_id == user.id:
            return obj.participant.full_name
        return obj.organizer.full_name

    def get_shared_hobby(self, obj):
        return obj.match.shared_hobby
