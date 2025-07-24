function getCookie(name) {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${name}=`))
        ?.split('=')[1];
    return cookieValue ? decodeURIComponent(cookieValue) : null;
}

async function FetchData(path, body) {
    const response = await fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(body)
    })
    return await response.json();
}

function showToast(toast, state, tip) {
    document.getElementById('toastIcon').innerHTML = state ? '<i class="fa-solid fa-circle-check fa-lg" style="color: green;"></i>' :
        '<i class="fa-solid fa-circle-xmark fa-lg" style="color: red;"></i>';
    document.getElementById('toastText').innerHTML = tip;
    toast.show();
}

function open_page(url) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_self';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

document.addEventListener('DOMContentLoaded', () => {
    let _tt = document.getElementById('tipToast');
    _tt.addEventListener('show.bs.toast', function() {
        _tt.style.animation = 'fadeIn 0.3s';
    });

    _tt.addEventListener('hide.bs.toast', function() {
        _tt.style.animation = 'fadeOut 0.3s';
    });

    let _modalEls = document.querySelectorAll('.modal');

    _modalEls.forEach(modalEl => {
        function handleKeyDown(e) {
            if (e.keyCode === 13 || e.key === 'Enter') modalEl.querySelector('.btn-primary').click();
        }

        modalEl.addEventListener('shown.bs.modal', function () {
            document.addEventListener('keydown', handleKeyDown);
        });
        modalEl.addEventListener('hidden.bs.modal', function() {
            document.removeEventListener('keydown', handleKeyDown);
        });
    });
});
