from django.urls import path

from .views import CompanyRegistrationView

urlpatterns = [
    path("companies/register/", CompanyRegistrationView.as_view(), name="company-register"),
]
