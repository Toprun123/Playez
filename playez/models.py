from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class User(AbstractUser):
    is_author = models.BooleanField(default=False)

class Game(models.Model):
    name = models.CharField(max_length=255, unique=True)
    author = models.ForeignKey('User', on_delete=models.SET_NULL, null=True)
    code = models.CharField(max_length=20000, default="<html></html>")
