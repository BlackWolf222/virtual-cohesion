from rest_framework import serializers

from .models import Hobby, SurveyResponse


class SurveyResponseSerializer(serializers.ModelSerializer):
    hobbies = serializers.ListField(child=serializers.CharField(max_length=80), write_only=True)
    hobby_names = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SurveyResponse
        fields = (
            "favorite_game",
            "activity_pattern",
            "communication_style",
            "native_language",
            "extra_languages",
            "hobbies",
            "hobby_names",
        )

    def get_hobby_names(self, obj):
        return list(obj.hobbies.values_list("name", flat=True))

    def create(self, validated_data):
        hobby_names = validated_data.pop("hobbies", [])
        survey, _ = SurveyResponse.objects.update_or_create(
            user=self.context["request"].user,
            defaults=validated_data,
        )
        hobbies = [Hobby.objects.get_or_create(name=name.strip().lower())[0] for name in hobby_names if name.strip()]
        survey.hobbies.set(hobbies)
        user = self.context["request"].user
        user.survey_completed = True
        user.save(update_fields=["survey_completed"])
        return survey
