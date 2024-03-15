from django.db import models
from django.contrib.auth.models import AbstractBaseUser, AbstractUser

class User(AbstractUser):
    pos_x = models.IntegerField(default=0)
    pos_y = models.IntegerField(default=0)
    pos_z = models.IntegerField(default=0)
    in_jump = models.BooleanField(default=False)

    def __str__(self):
        return self.username

class Game(models.Model):
    game_code = models.CharField(max_length=8, unique=True)
    players = models.ManyToManyField(User)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.game_code)
