from django.contrib import admin

# Register your models here.

from .models import User, Game

admin.site.register(User)

admin.site.register(Game)
