from django.shortcuts import render, redirect
from PChat.models import UserEnvelope, PublicEnvelope
from django.forms import ModelForm
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from random import uniform
import json


def password(request):
    if request.session.get('is_authenticated', False):
        return redirect('/chat/')

    if request.method == "GET":
        return render(request, 'password.html', {'method': 'GET'})
    elif request.method == "POST":
        post_data = request.POST
        pwd = [('不要玩烟卡', '不要玩烟卡；', '不要玩烟卡。'),
                ('不要打开green文件夹', '不要打开green文件夹。'),
                ('生意不是你这样做的', '生意不是你这样做的。'),
                ('那它要是不熟怎么办？', '那它要是不熟怎么办')
                ]
        if post_data.get('pwd_1') in pwd[0] and post_data.get('pwd_2') in pwd[1] and post_data.get('pwd_3') in pwd[
            2] and post_data.get('pwd_4') in pwd[3]:
            request.session['is_authenticated'] = True
            return redirect('/chat/')
            # return HttpResponse('OK!')
        return render(request, 'password.html', {'msg': '暗号错误！', 'method': 'POST'})


def run():
    from subprocess import Popen
    Popen(['python', 'chat_server.py'], shell=True)


def homepage(request):
    try:
        csrftoken = request.COOKIES['csrftoken']
    except KeyError as ke:  # 有时候cookies中不会夹带csrftoken键，很奇怪。此时强制刷新即可。
        print(ke)
        return redirect('/chat/')

    run()
    if not request.session.get('is_authenticated', False):
        return redirect('/')

    request.session.set_expiry(0)
    return render(request, 'chat_base.html',{'csrfToken':csrftoken})


def generate_floats(n, total):
    numbers = [uniform(0.01, 1) for _ in range(n)]
    scaling_factor = total / sum(numbers)
    scaled = [round(x * scaling_factor, 2) for x in numbers]
    scaled[-1] -= round(sum(scaled) - total, 2)
    scaled[-1] = round(scaled[-1], 2)
    return scaled


class PublicEnvelopeForm(ModelForm):
    class Meta:
        model = PublicEnvelope
        fields = ['total', 'total_people', 'received_total_people', 'word', 'per_person', 'publisher', 'is_completed']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for name, field in self.fields.items():
            field.widget.attrs['class'] = 'form-control required'
            field.widget.attrs['placeholder'] = field.label
            field.widget.attrs['display'] = 'inline-block'
            field.widget.attrs['width'] = '80%'


def envelope(request):
    try:
        csrftoken = request.COOKIES['csrftoken']
    except KeyError as ke:  # 有时候cookies中不会夹带csrftoken键，很奇怪。此时强制刷新即可。
        print(ke)
        return redirect('/envelope/')
    user_env_qs = UserEnvelope.objects.filter(csrftoken=csrftoken).first()
    public_env_qs = PublicEnvelope.objects.all()

    if not user_env_qs: # 用户第一次访问此页面
        UserEnvelope.objects.create(csrftoken=csrftoken, total=0)
        return render(request, 'envelope.html', {'envelope_total': '0.00', 'public_env_qs':public_env_qs, 'csrfToken': csrftoken})

    p_env_form = PublicEnvelopeForm()
    shown_id = ['id_total', 'id_total_people', 'id_word']
    return render(request, 'envelope.html', {
        'envelope_total': user_env_qs.total,
        'public_env_qs': public_env_qs,
        'csrfToken': csrftoken,
        'p_env_form': p_env_form,
        'p_shown_id': shown_id
    })


@require_http_methods(["POST"])
def get_recv_money(request):
    try:
        # 解析前端发送的 JSON 数据
        data = json.loads(request.body)

        env_qs = PublicEnvelope.objects.filter(id=data['id']).first()
        per_person = env_qs.per_person.split(',')
        recv_env_money = per_person[env_qs.received_total_people]
        return JsonResponse({'status': True,'amount': recv_env_money}, status=201)
    except Exception as e:
        return JsonResponse({'status': False,'error': str(e)}, status=500)


@require_http_methods(["POST"])
def modify_user_money(request):
    try:
        # 解析前端发送的 JSON 数据
        data = json.loads(request.body)

        u_env_qs = UserEnvelope.objects.filter(csrftoken=data['csrfToken'])
        prev_total = u_env_qs.first().total
        u_env_qs.update(total=float(prev_total) + data['total'])

        p_env = PublicEnvelope.objects.filter(id=data['id'])
        prev_people = p_env.first().received_total_people
        p_env.update(received_total_people=prev_people + 1)
        if p_env.first().total_people == prev_people + 1:
            p_env.update(is_completed=True)

        return JsonResponse({'status': True}, status=201)
    except Exception as e:
        return JsonResponse({'status': False,'error': str(e)}, status=500)

@require_http_methods(["POST"])
def release_envelope(request):
    try:
        # 解析前端发送的 JSON 数据
        data = json.loads(request.body)

        p_env = PublicEnvelope.objects.filter(id=data['id'])
        prev_people = p_env.first().received_total_people
        p_env.update(received_total_people=prev_people + 1)
        if p_env.first().total_people == prev_people + 1:
            p_env.update(is_completed=True)

        return JsonResponse({'status': True}, status=201)
    except Exception as e:
        return JsonResponse({'status': False,'error': str(e)}, status=500)