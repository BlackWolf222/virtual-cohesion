from rest_framework import serializers

from .models import AvailabilitySlot, ConnectionMatch


class AvailabilitySlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilitySlot
        fields = ("id", "starts_at", "ends_at", "created_at")
        read_only_fields = ("id", "created_at")

    def create(self, validated_data):
        return AvailabilitySlot.objects.create(user=self.context["request"].user, **validated_data)


class ConnectionMatchSerializer(serializers.ModelSerializer):
    user_one_name = serializers.CharField(source="user_one.full_name", read_only=True)
    user_two_name = serializers.CharField(source="user_two.full_name", read_only=True)

    class Meta:
        model = ConnectionMatch
        fields = (
            "id",
            "user_one_name",
            "user_two_name",
            "shared_hobby",
            "overlap_start",
            "overlap_end",
            "score",
            "status",
            "created_at",
        )
