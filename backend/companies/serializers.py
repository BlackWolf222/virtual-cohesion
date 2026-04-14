from rest_framework import serializers


class CompanyRegistrationSerializer(serializers.Serializer):
    company_name = serializers.CharField(max_length=255)
    subdomain = serializers.RegexField(regex=r"^[a-z0-9-]+$", max_length=63)
    admin_email = serializers.EmailField()
    admin_password = serializers.CharField(min_length=8, write_only=True)
    admin_full_name = serializers.CharField(max_length=255)
