from rest_framework import serializers

from .models import CalendarEvent, Meeting


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


class CalendarEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarEvent
        fields = (
            "id",
            "title",
            "description",
            "starts_at",
            "ends_at",
            "video_url",
            "source",
            "created_at",
        )
        read_only_fields = ("id", "source", "created_at")

    def validate(self, attrs):
        starts_at = attrs.get("starts_at") or getattr(self.instance, "starts_at", None)
        ends_at = attrs.get("ends_at") or getattr(self.instance, "ends_at", None)
        if starts_at and ends_at and ends_at <= starts_at:
            raise serializers.ValidationError("The event end must be later than the start.")
        return attrs


class CalendarEventImportSerializer(serializers.Serializer):
    events = CalendarEventSerializer(many=True, allow_empty=False)

    def create(self, validated_data):
        owner = self.context["request"].user
        created_events = []
        for event_data in validated_data["events"]:
            created_events.append(
                CalendarEvent.objects.create(
                    owner=owner,
                    source=CalendarEvent.Source.IMPORTED,
                    **event_data,
                )
            )
        return created_events
