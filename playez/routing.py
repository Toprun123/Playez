from django.urls import re_path

from .consumers import Playez3DGameConsumer

websocket_urlpatterns = [
    re_path('ws/playez3dgame/(?P<game_id>\w+)/$', Playez3DGameConsumer.as_asgi())
]
