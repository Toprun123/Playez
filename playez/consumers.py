import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.apps import apps

class Playez3DGameConsumer(AsyncWebsocketConsumer):
    async def handle_game_loop(self):
        try:
            while True:
                await self.send(text_data=json.dumps(await self.get_game_state()))
                await asyncio.sleep(0.1)
        except Exception as e:
            pass

    async def connect(self):
        await self.accept()
        await self.join_player()
        self.background_task = asyncio.create_task(self.handle_game_loop())

    async def disconnect(self, close_code):
        print(close_code)
        await self.leave_player()
        if hasattr(self, 'background_task'):
            self.background_task.cancel()
            await self.background_task

    async def receive(self, text_data):
        user = self.scope['user']
        id = self.scope['url_route']['kwargs']['game_id']
        await self.save_game_state({ "user": user, "id": id, "data": text_data })

    @database_sync_to_async
    def join_player(self):
        id = self.scope['url_route']['kwargs']['game_id']
        game = apps.get_model('playez', 'Game').objects.get(id=id)
        game.join_game(self.scope['user'])

    @database_sync_to_async
    def leave_player(self):
        player = apps.get_model('playez', 'Player').objects.get(user=self.scope["user"])
        player.delete()

    @database_sync_to_async
    def save_game_state(self, message):
        # Save or update game state
        PlayerModel = apps.get_model('playez', 'Player')
        player = PlayerModel.objects.get(user=message['user'])
        data = json.loads(message['data'])
        player.position = data['position']
        player.rotation = data['rotation']
        player.skin = data['skin']
        player.save()

    @database_sync_to_async
    def get_game_state(self):
        GameModel = apps.get_model('playez', 'Game')
        game = GameModel.objects.get(id=self.scope['url_route']['kwargs']['game_id'])
        PlayerModel = apps.get_model('playez', 'Player')
        players = PlayerModel.objects.filter(game=game)
        final = {}
        for player in players:
            if self.scope['user'] != player.user:
                final[player.user.username]=dict(position=player.position, rotation=player.rotation, skin=player.skin)
        return final
