from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    def __str__(self):
        return self.username


class Player(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    game = models.ForeignKey('Game', on_delete=models.CASCADE)
    skin = models.TextField()
    weapon = models.TextField()
    position = models.JSONField(default=dict)
    rotation = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.user.username} - {self.position}"


class Game(models.Model):
    #game_code = models.CharField(max_length=8, unique=True)
    players = models.ManyToManyField(User, through='Player')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.id)

    def change_player_position(self, user, new_position):
        try:
            player = self.players.get(user=user)
            player.position = new_position
            player.save()
            return True, "Position changed successfully."
        except Player.DoesNotExist:
            return False, "Player not found in the game."

    def join_game(self, user):
        player, created = Player.objects.get_or_create(user=user, game=self)
        if created:
            return True, "Player joined the game."
        else:
            return True, "Player is already in the game."
