let socket;
let AncModal;
let NMModal;

function main() {
    socket = new WebSocket(`wss://${window.location.host}/ws/chat/`);

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
        showToast(toast, false,`连接发生错误，错误信息：<br>${error}<br>请联系站长解决。`);
    };

    socket.onclose = function() {
        console.log('WebSocket connection closed');

        const systemMessageElement = document.createElement("div");
        const chatHistory = document.getElementById("chatHistory");
        const userMessage = document.getElementById('userMessage');
        const btn_send = document.getElementById('btn-send');

        systemMessageElement.style.animation = "messagePop 0.3s ease-out";
        systemMessageElement.classList.add("system-message", "text-danger");
        systemMessageElement.textContent = '连接因某种原因关闭，无法聊天';
        chatHistory.appendChild(systemMessageElement);

        userMessage.placeholder = '连接关闭，无法聊天';
        userMessage.disabled = true;
        btn_send.disabled = true;
    };
}

function caller_listener () {
    const ws_call = new WebSocket(`wss://${window.location.host}/ws/call/?csrftoken=${csrfToken}&role=user`);
    ws_call.onmessage = async (e) => {
        const data = JSON.parse(e.data);
        if (data.state) {
            document.getElementById('caller-avatar').textContent = data['caller_name'][0];
            document.getElementById('caller-details').textContent = data['caller_name'];

            acceptCall = () => {
                open_page(`https://live.ljhchat.top?token=${data.token}`);
            }

            declineCall = () => {
                ws_call.send(JSON.stringify({
                    token: '',
                    caller_name: '',
                    csrftoken: data.from,
                    from: csrfToken,
                    role: 'caller',
                    state: false
                }));
                call_toast.hide();
            }

            call_toast.show();
        } else {
            call_toast.hide();
        }
    }
}

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
    userMessageElement.textContent = message;
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
    if (!response.status) {
        showToast(toast, response.status,
            `操作遇到错误，错误信息：<br>${response.error}<br>请联系站长解决。`
        );
    } else {
        document.getElementById('user-nickname').textContent = nickname;
    }
}

async function requestCall() {
    const rc_spinner = document.getElementById('rc-spinner');
    const rc_btn_complete = document.getElementById('rc-btn-complete');
    const rc_span = document.getElementById('rc-span');

    rc_spinner.style.display = '';
    rc_btn_complete.disabled = true;
    rc_span.textContent = '请求中...';

    const response = await FetchData(`//${window.location.host}/api/request_call`, {
        csrfToken: csrfToken,
        to_nickname: document.getElementById('calleeSelect').value
    });

    if (response.error === '') {
        showToast(toast, false, '余额不足！请先去<a href="/envelope/">领取红包</a>以消费');

        rc_spinner.style.display = 'none';
        rc_btn_complete.disabled = false;
        rc_span.textContent = '完成';
    } else if (!response.status) {
        showToast(toast, response.status,
            `操作遇到错误，错误信息：<br>${response.error}<br>请联系站长解决。`
        );

        rc_spinner.style.display = 'none';
        rc_btn_complete.disabled = false;
        rc_span.textContent = '完成';
    } else {
        rc_spinner.style.display = 'none';
        rc_btn_complete.disabled = false;
        rc_span.textContent = '完成';
        rcModal.hide();


        open_page(`https://live.ljhchat.top?token=${response.token}`);
    }
}

let rcModal;
let toastEl;
let toast;
let call_toast;
let acceptCall;
let declineCall;

document.addEventListener('DOMContentLoaded', function() {
    AncModal = new bootstrap.Modal(document.getElementById('AncModal'));
    NMModal = new bootstrap.Modal(document.getElementById('NMModal'));
    rcModal = new bootstrap.Modal(document.getElementById('phoneModal'));

    document.getElementById('AncModal').addEventListener('hidden.bs.modal', main);
    caller_listener();

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

    document.getElementById('calleeSelect').addEventListener('change', (e) => {
        document.getElementById('rc-btn-complete').disabled = !e.target.value;
    })

    toastEl = document.getElementById('tipToast');
    toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 2000
    });

    call_toast = new bootstrap.Toast(document.getElementById('callToast'), {
        autohide: false
    });
});
