import json
import re
from .models import *
from django import forms
from django.urls import reverse
from django.shortcuts import render
from django.db import IntegrityError
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt

class RegisterForm(forms.Form):
    template_name = 'playez/form_snippet.html'
    username = forms.CharField(
        widget = forms.TextInput(
            attrs = {
                'class': 'form-input'
            }
        )
    )
    email = forms.EmailField(
        widget = forms.EmailInput(
            attrs = {
                'class': 'form-input'
            }
        )
    )
    password = forms.CharField(
        widget = forms.PasswordInput(
            attrs = {
                'class': 'form-input'
            }
        )
    )
    password_confirm = forms.CharField(
        widget = forms.PasswordInput(
            attrs = {
                'class': 'form-input'
            }
        )
    )

class LoginForm(forms.Form):
    template_name = 'playez/form_snippet.html'
    username = forms.CharField(
        widget = forms.TextInput(
            attrs = {
                'class': 'form-input'
            }
        )
    )
    password = forms.CharField(
        widget = forms.PasswordInput(
            attrs = {
                'class': 'form-input'
            }
        )
    )

def index(request):
    return render(request, 'playez/index.html', {
        "games": ["hello", "world"]
    })

@login_required(login_url='/login')
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))

def login_view(request):
    login_form = LoginForm()
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
        else:
            return render(request, "playez/login.html", {
                "message": "Invalid username and/or password.",
                "login_form": login_form
            })
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "playez/login.html", {
            "login_form": login_form
        })

def register_view(request):
    register_form = RegisterForm()
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        password = request.POST["password"]
        confirmation = request.POST["password_confirm"]
        if password != confirmation:
            return render(request, "playez/register.html", {
                "message": "Passwords must match.",
                "register_form": register_form
            })
        if not re.match('^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]{8,}$', password):
            return render(request, "playez/register.html", {
                "message": "Password must contain at least eight characters, at least one number and one letter.",
                "register_form": register_form
            })
        try:
           user = User.objects.create_user(username, email, password)
           user.save()
        except IntegrityError as e:
            print(e)
            return render(request, "playez/register.html", {
                "message": "Username address already taken.",
                "register_form": register_form
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "playez/register.html", {
            "register_form": register_form
        })

def test_view(request):
    return render(request, "playez/test.html")

def gamepi(request):
    body = json.loads(request.body.decode('utf-8'))
    if request.method == "POST":
        try:
            if body.get("type") == "new":
                game = Game.objects.create()
                game.join_game(user=request.user, position='Forward')
                return HttpResponse(str(game.id))
            elif body.get("type") == "update":
                game = Game.objects.get(id=body.get("game_id"))
                player = Player.objects.get(user=request.user)
                player.position = json.dumps(body.get("data"), separators=(',', ':'))
                player.save()
                return HttpResponse(str(game.id))
            elif body.get("type") == "redate":
                game = Game.objects.get(id=body.get("game_id"))
                players = Player.objects.filter(game=game)
                final = {}
                for player in players:
                    if request.user != player.user:
                        final[player.user.username]=player.position
                return JsonResponse(final)
            elif body.get("type") == "join":
                game = Game.objects.get(id=body.get("game_id"))
                game.join_game(user=request.user, position='{}')
                return HttpResponse(str(game.id))
            elif body.get("type") == "leave":
                player = Player.objects.get(user=request.user)
                player.delete()
                return HttpResponse(str("Left Game"))
            elif body.get("type") == "delete":
                game = Game.objects.get(id=body.get("game_id"))
                game.delete()
                return HttpResponse(str(game.id))
            else:
                return HttpResponse("hello")
        except Exception as e:
            print(e)
            response = render(request, "playez/error.html")
            response.status_code = 404
            return response
    else:
        response = render(request, "playez/error.html")
        response.status_code = 404
        return response
