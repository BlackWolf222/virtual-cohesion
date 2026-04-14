from django.urls import include, path

urlpatterns = [
    path("api/public/", include("companies.public_urls")),
]
