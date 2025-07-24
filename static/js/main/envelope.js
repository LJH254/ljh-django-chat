async function modify() {
    isFinished = true;

    const response = await FetchData(`//${window.location.host}/api/modify_user_money`,{
        csrfToken: csrfToken,
        total: parseFloat(document.getElementById('tip').textContent),
        id: currentId
    });

    showToast(toast, response.status, response.status ? '操作成功！' :
        `操作遇到错误，错误信息：<br>${response.error}<br>请联系站长解决。`);

    if (response.status) {
        const people_amt_el = document.querySelectorAll('.people-amt');
        people_amt_el[currentId - 1].textContent = `${envs_data[currentId].recv_people + 1}/${envs_data[currentId].people}人`;
        document.getElementById('balance').textContent = (balance + parseFloat(window.current_env_amt)).toFixed(2);
        balance = parseFloat(document.getElementById('balance').textContent);
    }

    document.querySelectorAll('.list-item')[currentId - 1].classList.remove('active');
    document.querySelectorAll('.list-item')[currentId - 1].classList.add('disabled');
    envs_data[currentId].is_in = true;
    auto_select();
}

function checkFormValidity() {
    let isFormValid = true;

    document.querySelectorAll('.required').forEach(element => {
        if (element.type === 'text') {
            if (element.value.trim() === '') isFormValid = false;
        }
    });

    document.getElementById('release-btn-complete').disabled = !isFormValid;
}

async function release_env() {
    isFinished = true;
    const total = parseFloat(document.getElementById('total').value);
    const total_people = parseInt(document.getElementById('total_people').value);
    const word = document.getElementById('word').value;

    if (balance < total) {
        showToast(toast, false, '余额不足！')
        return
    }

    const response = await FetchData(`//${window.location.host}/api/release_envelope`,{
        csrfToken: csrfToken,
        total: total,
        total_people: total_people,
        word: word
    });

    showToast(toast, response.status, response.status ? '操作成功！' :
        `操作遇到错误，错误信息：<br>${response.error}<br>请联系站长解决。`);

    if (response.status) {
        releaseModal.hide();

        document.querySelector('.list-group').innerHTML += `
<a class="list-group-item list-item" data-id="${response.id}" onclick="changeType(${response.id})">
<div class="d-flex w-100 justify-content-between">
<p class="mb-1">你发布的红包</p>
</div>
<small class="text-muted">${total}元</small>
<label class="text-muted people-amt">0/${total_people}人</label>
</a>
`
        envs_data[response.id] = {
            name: word,
            amount: total,
            people: total_people,
            recv_people: 0,
            is_completed: false,
            is_in: false
        };

        document.querySelectorAll('.required').forEach(element => {
            element.value = '';
        });

        document.getElementById('release-btn-complete').disabled = true;

        document.getElementById('balance').textContent = (balance - total).toFixed(2);
        balance = parseFloat(document.getElementById('balance').textContent);

        await changeType(response.id);
    }
}

function auto_select() {
    let has_available = false;

    Object.keys(envs_data).some(id => {
        if (!(envs_data[id].is_completed || envs_data[id].is_in)) {
            changeType(id);
            has_available = true;
            return true;
        }
    });

    if (has_available) {
        document.querySelector('.redpacket-container').style.display = 'grid';
    } else {
        document.querySelector('.redpacket-container').style.display = 'none';
    }
}

async function changeType(id) {
    currentId = id;
    const title = document.getElementById('title');
    const items = document.querySelectorAll('.list-item');

    items.forEach(item => {
        const itemId = item.getAttribute('data-id');
        item.classList.remove('active');
        if (itemId === id.toString()) {
            item.classList.add('active');
        }
    });

    title.classList.remove('active');
    await new Promise(resolve => setTimeout(resolve, 100));
    title.classList.add('active');
    title.textContent = envs_data[id].name;
}

async function claimRedPacket() {
    const open_button = document.getElementById('open-btn');
    const spinner = document.getElementById('spinner-container');
    const tip = document.getElementById('tip');
    const close = document.getElementById('btn-close');
    const env_btn_complete = document.getElementById('Env-btn-complete');
    const EnvModal = new bootstrap.Modal(document.getElementById('EnvModal'));

    const env_money = envs_data[currentId].amount;
    const people = envs_data[currentId].people;
    const min = 0.01, max = env_money / people;

    open_button.style.display = "none";
    spinner.style.display = "";

    const recv_env_money_resp = await FetchData(`//${window.location.host}/api/get_recv_money`, {id: currentId});

    if (!recv_env_money_resp.status) {
        showToast(toast, false, `操作遇到错误，错误信息：<br>${recv_env_money_resp.error}<br>请联系站长解决。`);
        open_button.style.display = "";
        spinner.style.display = "none";
        return;
    }

    window.current_env_amt = recv_env_money_resp.amount;

    open_button.style.display = "";
    spinner.style.display = "none";
    close.disabled = true;
    env_btn_complete.disabled = true;

    EnvModal.show();

    for (let i = 0; i < 19; i++) {
        tip.textContent = (Math.random() * (max - min) + min).toFixed(2);
        await new Promise(resolve => setTimeout(resolve, 40));
    }
    tip.textContent = recv_env_money_resp.amount;

    close.disabled = false;
    env_btn_complete.disabled = false;
}

let isFinished;
let toastEl;
let toast;
let releaseModal;
let currentId;
let balance;


document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.sidebar-toggle').addEventListener('click', function() {
        document.querySelector('.sidebar').classList.toggle('active');
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('hidden.bs.modal', function () {
            if (!isFinished) showToast(toast, false, '操作已取消。');
            isFinished = false;
        });
    });

    document.getElementById('total').type = 'text';

    document.getElementById('total').addEventListener('input', function(e) {
        let value = e.target.value;
        // 移除所有非数字和小数点的字符，并确保最多一个小数点
        value = value.replace(/[^0-9.]/g, '')
                    .replace(/(\..*)\./g, '$1')
                    .replace(/^(-|0+)/, '');
        // 如果以小数点开头，可自动补零（可选）
        if (value.startsWith('.')) value = '0' + value;

        const parts = value.split('.');
        if (parts.length > 1) {
            parts[1] = parts[1].slice(0, 2);
            value = parts.join('.');
        }

        e.target.value = value;
    });

    document.getElementById('total').addEventListener('blur', function(e) {
        let value = e.target.value;
        if (value === '') return;

        if (!value.includes('.')) {
            value += '.00';
        } else {
            if (/^\d+\.$/.test(value)) {
                value = (value === '0.') ? `${value}01` : `${value}00`;
            } else {
                if (value === '0.00') {
                    value = '0.01'
                } else {
                    const parts = value.split('.');
                    if (parts[1].length === 1) parts[1] += '0';
                    value = parts.join('.');
                }
            }
        }

        e.target.value = value;
    });

    document.getElementById('total_people').type = 'text';

    document.getElementById('total_people').addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '').replace(/^0+/, '');
        if (parseInt(this.value) < 1 || this.value === '0') {
            this.value = '';
        }
    });

    document.querySelectorAll('.required').forEach(element => {
        element.addEventListener('input', checkFormValidity);
    });

    isFinished = false;
    toastEl = document.getElementById('tipToast');
    toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 2000
    });
    releaseModal = new bootstrap.Modal(document.getElementById('ReleaseModal'));

    currentId = 1;
    balance = parseFloat(document.getElementById('balance').textContent);

    auto_select();
});

