let socket;
let AncModal;
let NMModal;

function main() {
    // 创建 WebSocket 连接
    socket = new WebSocket(`ws://${window.location.host}/ws/chat/`);

    socket.onopen = function() {
        console.log('WebSocket connection established');

        const systemMessageElement = document.createElement("div");
        const chatHistory = document.getElementById("chatHistory");
        const userMessage = document.getElementById('userMessage');
        const btn_send = document.getElementById('btn-send');

        systemMessageElement.style.animation = "messagePop 0.3s ease-out";
        systemMessageElement.classList.add("system-message");
        systemMessageElement.textContent = '可以开始聊天啦！';
        chatHistory.appendChild(systemMessageElement);

        userMessage.placeholder = '输入消息...';
        userMessage.disabled = false;
        btn_send.disabled = false;
    };

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

        chatHistory.scrollTop = chatHistory.scrollHeight;
    };

    socket.onerror = function(error) {
        console.error('WebSocket Error: ', error);
        showToast(false, `连接发生错误，错误信息：<br>${error}<br>请联系站长解决。`)
    };

    socket.onclose = function() {
        console.log('WebSocket connection closed');

        const systemMessageElement = document.createElement("div");
        const chatHistory = document.getElementById("chatHistory");
        const userMessage = document.getElementById('userMessage');
        const btn_send = document.getElementById('btn-send');

        systemMessageElement.style.animation = "messagePop 0.3s ease-out";
        systemMessageElement.classList.add("system-message text-danger");
        systemMessageElement.textContent = '连接因某种原因关闭，无法聊天';
        chatHistory.appendChild(systemMessageElement);

        userMessage.placeholder = '连接关闭，无法聊天';
        userMessage.disabled = true;
        btn_send.disabled = true;
    };
}

// 发送消息给服务器
function sendMessage() {
    const message = document.getElementById("userMessage").value;

    const messageData = {
        message: message,
        csrfToken: csrfToken
    };

    socket.send(JSON.stringify(messageData));

    const chatHistory = document.getElementById("chatHistory");
    const userMessageElement = document.createElement("div");

    userMessageElement.style.animation = "messagePop 0.3s ease-out";

    userMessageElement.classList.add("user-message");
    userMessageElement.textContent = message;  // 显示用户的消息
    chatHistory.appendChild(userMessageElement);

    chatHistory.scrollTop = chatHistory.scrollHeight;

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