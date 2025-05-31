from channels.generic.websocket import AsyncWebsocketConsumer
import json


chat_history = []


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # 当 WebSocket 连接时调用
        self.room_name = 'default'
        self.room_group_name = f'chat_{self.room_name}'

        # 加入群组
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        msg_dict = {"csrf_token": '', "message": "（可以开始聊天了）"}
        await self.send(json.dumps(msg_dict))

        for msg_list in chat_history:
            m = json.dumps({"csrf_token": msg_list[0], "message": msg_list[1]})
            await self.send(m)

    async def disconnect(self, close_code):
        # 当连接断开时调用
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # 当接收到消息时调用
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        csrftoken = text_data_json['csrfToken']

        # 广播消息到群组
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
        # 处理群组发送的消息
        message = event['message']
        csrftoken = event['csrf_token']
        chat_history.append([csrftoken, message])

        if self.channel_name == event['sender_channel']:
            return

        await self.send(text_data=json.dumps({
            'csrf_token': csrftoken,
            'message': message
        }))