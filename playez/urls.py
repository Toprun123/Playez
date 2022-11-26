from django.urls import path
from django.views.generic import RedirectView

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("favicon.ico", RedirectView.as_view(url='/static/playez/favicon.ico'), name="favicon")
]
