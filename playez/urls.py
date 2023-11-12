from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name="index"),
    path('logout', views.logout_view, name="logout"),
    path('login', views.login_view, name="login"),
    path('register', views.register_view, name="register"),
    path('test', views.test_view, name="test"),
    path('test2', views.test_view2, name="test2")
]
