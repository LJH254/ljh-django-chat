from channels.generic.websocket import AsyncWebsocketConsumer
import json
from urllib.parse import parse_qs

chat_history = []


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = 'default'
        self.room_group_name = f'chat_{self.room_name}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        for msg_list in chat_history:
            m = json.dumps({"csrf_token": msg_list[0], "message": msg_list[1]})
            await self.send(m)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        csrftoken = text_data_json['csrfToken']

        chat_history.append([csrftoken, message])

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'csrf_token': csrftoken,
                'message': message,
                'sender_channel': self.channel_name
            }
        )

    async def chat_message(self, event):
        message = event['message']
        csrftoken = event['csrf_token']

        if self.channel_name == event['sender_channel']:
            return

        await self.send(text_data=json.dumps({
            'csrf_token': csrftoken,
            'message': message
        }))


calls = {}
groups = []


class CallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        params = parse_qs(self.scope['query_string'].decode())
        self.csrftoken = params.get('csrftoken', [None])[0]
        self.role = params.get('role', [None])[0]
        if (not self.csrftoken) or (not self.role):
            await self.close()

        self.room_group_name = f'calls_{self.csrftoken}_{self.role}'

        groups.append(self.room_group_name)

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        if calls.get(self.csrftoken):
            value = calls.pop(self.csrftoken)
            if value[3]:
                await self.send(text_data=json.dumps({
                    'token': value[0],
                    'caller_name': value[1],
                    'from': value[2],
                    'state': True
                }))

    async def disconnect(self, close_code):
        if self.room_group_name in groups:
            groups.remove(self.room_group_name)

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        token = text_data_json['token']
        csrftoken = text_data_json['csrftoken']
        from_csrftoken = text_data_json['from']
        role = text_data_json['role']
        caller_name = text_data_json['caller_name']
        state = text_data_json['state']

        group_name = f'calls_{csrftoken}_{role}'

        if not (group_name in groups):
            calls[csrftoken] = [token, caller_name, from_csrftoken, state]
        else:
            await self.channel_layer.group_send(
                group_name,
                {
                    'type': 'call_tips',
                    'token': token,
                    'from': from_csrftoken,
                    'caller_name': caller_name,
                    'state': state
                }
            )

    async def call_tips(self, event):
        token = event['token']
        from_csrftoken = event['from']
        caller_name = event['caller_name']
        state = event['state']

        await self.send(text_data=json.dumps({
            'token': token,
            'caller_name': caller_name,
            'from': from_csrftoken,
            'state': state
        }))
