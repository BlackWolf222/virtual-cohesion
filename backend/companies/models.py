from django.db import models
from django_tenants.models import DomainMixin, TenantMixin


class Company(TenantMixin):
    name = models.CharField(max_length=255, unique=True)
    paid_until = models.DateField(null=True, blank=True)
    on_trial = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    auto_create_schema = True

    def __str__(self):
        return self.name


class Domain(DomainMixin):
    pass
