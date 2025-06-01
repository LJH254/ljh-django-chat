let socket;
let AncModal;
let NMModal;

function main() {
    // 创建 WebSocket 连接
    socket = new WebSocket(`ws://${window.location.host}/ws/chat/`);

    // WebSocket 连接打开后
    socket.onopen = function() {
        console.log('WebSocket connection established');

        const systemMessageElement = document.createElement("div");
        const chatHistory = document.getElementById("chatHistory");

        systemMessageElement.style.animation = "messagePop 0.3s ease-out";
        systemMessageElement.classList.add("system-message");
        systemMessageElement.textContent = '可以开始聊天啦！';
        chatHistory.appendChild(systemMessageElement);
    };

    // WebSocket 接收到消息时
    socket.onmessage = function(event) {
        const chatHistory = document.getElementById("chatHistory");
        const MessageElement = document.createElement("div");
        const msg = JSON.parse(event.data);
        const audio = document.getElementById("msgAudio");

        if (!(msg['csrf_token'] === csrfToken)) {
            audio.play();
        }

        MessageElement.style.animation = "messagePop 0.3s ease-out";

        if (msg['csrf_token'] === csrfToken) {
            MessageElement.classList.add("user-message");
        }
        else {
            MessageElement.classList.add("bot-message");
        }

        MessageElement.textContent = msg['message'];
        chatHistory.appendChild(MessageElement);

        // 滚动到最新消息
        chatHistory.scrollTop = chatHistory.scrollHeight;
    };

    // 错误处理
    socket.onerror = function(error) {
        console.error('WebSocket Error: ', error);
    };

    // 连接关闭时
    socket.onclose = function() {
        console.log('WebSocket connection closed');
    };
}

// 发送消息给服务器
function sendMessage() {
    const message = document.getElementById("userMessage").value;

    // 构造消息对象
    const messageData = {
        message: message,
        csrfToken: csrfToken  // 添加 CSRF Token
    };

    // 发送消息到 WebSocket 服务端
    socket.send(JSON.stringify(messageData));

    // 显示用户发送的消息
    const chatHistory = document.getElementById("chatHistory");
    const userMessageElement = document.createElement("div");

    userMessageElement.style.animation = "messagePop 0.3s ease-out";

    userMessageElement.classList.add("user-message");
    userMessageElement.textContent = message;  // 显示用户的消息
    chatHistory.appendChild(userMessageElement);

    // 滚动到最新消息
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // 清空输入框
    document.getElementById("userMessage").value = '';
}

async function m_nickname() {
    const nickname = document.getElementById('nickname').value;
    const response = await FetchData(`//${window.location.host}/api/modify_nickname`,{
        csrfToken: csrfToken,
        nickname: nickname
    });
    if (!response.status) showToast(response.status,
        `操作遇到错误，错误信息：<br>${response.error}<br>请联系站长解决。`
    );
}

document.addEventListener('DOMContentLoaded', function() {
    AncModal = new bootstrap.Modal(document.getElementById('AncModal'));
    NMModal = new bootstrap.Modal(document.getElementById('NMModal'));

    document.getElementById('AncModal').addEventListener('hidden.bs.modal', main);

    if (input_nickname) {
        NMModal.show();
        document.getElementById('NMModal').addEventListener('hidden.bs.modal', () => {
            AncModal.show();
        })
        document.getElementById('nickname').addEventListener('input', function (e) {
            const nm_c_btn = document.getElementById('NM-btn-complete');
            nm_c_btn.disabled = e.target.value.trim() === '';
        });
    } else {
        AncModal.show();
    }
});