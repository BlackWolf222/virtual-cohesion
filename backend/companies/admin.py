from django.contrib import admin

from .models import Company, Domain


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "schema_name", "on_trial", "created_at")
    search_fields = ("name", "schema_name")


@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ("domain", "tenant", "is_primary")
    search_fields = ("domain",)
