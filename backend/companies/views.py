from django.conf import settings
from django.db import transaction
from django_tenants.utils import schema_context
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User

from .models import Company, Domain
from .serializers import CompanyRegistrationSerializer


class CompanyRegistrationView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = CompanyRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        schema_name = data["subdomain"].replace("-", "_")
        domain_suffix = request.get_host().split(":", 1)[0]
        if domain_suffix in {"localhost", "127.0.0.1"}:
            tenant_domain = f"{data['subdomain']}.localhost"
        else:
            tenant_domain = f"{data['subdomain']}.{domain_suffix}"

        if Company.objects.filter(schema_name=schema_name).exists():
            return Response({"detail": "Company schema already exists."}, status=status.HTTP_400_BAD_REQUEST)

        company = Company.objects.create(name=data["company_name"], schema_name=schema_name)
        Domain.objects.create(domain=tenant_domain, tenant=company, is_primary=True)

        # User must be created inside tenant schema.
        with schema_context(schema_name):
            admin_user = User.objects.create_user(
                username=data["admin_email"],
                email=data["admin_email"],
                password=data["admin_password"],
                full_name=data["admin_full_name"],
                role=User.Role.HR_HEAD,
                consent_aggregated_data=True,
            )

        frontend_base_url = settings.CORS_ALLOWED_ORIGINS[0] if settings.CORS_ALLOWED_ORIGINS else "http://localhost:5173"
        return Response(
            {
                "company_id": company.id,
                "schema_name": company.schema_name,
                "tenant_domain": tenant_domain,
                "admin_user_id": admin_user.id,
                "next": f"{frontend_base_url}/login",
            },
            status=status.HTTP_201_CREATED,
        )
