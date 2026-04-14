from django.urls import path

from .views import EmployeeRegisterView, InviteListCreateView, LoginView, MeView

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("register/", EmployeeRegisterView.as_view(), name="employee-register"),
    path("me/", MeView.as_view(), name="me"),
    path("invites/", InviteListCreateView.as_view(), name="invites"),
]
