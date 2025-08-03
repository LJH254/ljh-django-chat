from django.shortcuts import render, redirect
from PChat.models import Users, PublicEnvelope, Calls
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.conf import settings
from random import uniform
import json
import uuid
import jwt
import time


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
        if (
                post_data.get('pwd_1') in pwd[0] and
                post_data.get('pwd_2') in pwd[1] and
                post_data.get('pwd_3') in pwd[2] and
                post_data.get('pwd_4') in pwd[3]
        ):
            request.session['is_authenticated'] = True
            return redirect('/chat/')
        return render(request, 'password.html', {'msg': '暗号错误！', 'method': 'POST'})
    return HttpResponse('Invalid method')


def homepage(request):
    try:
        csrftoken = request.COOKIES['csrftoken']
    except KeyError as ke:  # 有时候cookies中不会夹带csrftoken键，很奇怪。此时强制刷新即可。
        print(ke)
        return redirect('/chat/')

    # if not request.session.get('is_authenticated', False):
        # return redirect('/')

    request.session.set_expiry(0)

    input_nickname = not Users.objects.filter(csrftoken=csrftoken).first()

    return render(request, 'chat_base.html', {
        'csrfToken': csrftoken,
        'input_nickname': input_nickname,
        'users': Users.objects.all(),
        'nickname': '' if input_nickname else Users.objects.filter(csrftoken=csrftoken).first().nickname
    })


def generate_floats(n, total):
    numbers = [uniform(0.01, 1) for _ in range(n)]
    scaling_factor = total / sum(numbers)
    scaled = [round(x * scaling_factor, 2) for x in numbers]
    scaled[-1] -= round(sum(scaled) - total, 2)
    scaled[-1] = round(scaled[-1], 2)
    return scaled


def envelope(request):
    try:
        csrftoken = request.COOKIES['csrftoken']
    except KeyError as ke:  # 有时候cookies中不会夹带csrftoken键，很奇怪。此时强制刷新即可。
        print(ke)
        return redirect('/envelope/')

    # if not request.session.get('is_authenticated', False):
        # return redirect('/')

    user_env_qs = Users.objects.filter(csrftoken=csrftoken).first()
    public_env_qs = PublicEnvelope.objects.all()

    if not user_env_qs:  # 用户第一次访问此页面
        return render(request, 'envelope.html', {
            'envelope_total': '0.00',
            'public_env_qs': public_env_qs,
            'csrfToken': csrftoken,
        })

    received_envs_ids = list(
        map(int, user_env_qs.received_envs_ids.split(','))) if user_env_qs.received_envs_ids else []
    envs_data = {}

    for e in public_env_qs:
        envs_data[e.id] = {
            'name': e.word,
            'amount': float(e.total),
            'people': e.total_people,
            'recv_people': e.received_total_people,
            'is_completed': e.is_completed,
            'is_in': e.id in received_envs_ids,
        }

    return render(request, 'envelope.html', {
        'envelope_total': user_env_qs.total,
        'received_envs_ids': received_envs_ids,
        'public_env_qs': public_env_qs,
        'csrfToken': csrftoken,
        'envs_data': json.dumps(envs_data, ensure_ascii=True)
    })


@require_http_methods(["POST"])
def get_recv_money(request):
    try:
        data = json.loads(request.body)

        env_qs = PublicEnvelope.objects.filter(id=data['id']).first()
        per_person = env_qs.per_person.split(',')
        recv_env_money = per_person[env_qs.received_total_people]
        return JsonResponse({'status': True, 'amount': recv_env_money}, status=201)
    except Exception as e:
        return JsonResponse({'status': False, 'error': str(e)}, status=500)


@require_http_methods(["POST"])
def modify_user_money(request):
    try:
        data = json.loads(request.body)

        u_env_qs = Users.objects.filter(csrftoken=data['csrfToken'])
        prev_total = u_env_qs.first().total
        prev_recv_envs_ids = [] if not u_env_qs.first().received_envs_ids else u_env_qs.first().received_envs_ids.split(
            ',')
        prev_recv_envs_ids.append(str(data['id']))
        u_env_qs.update(total=float(prev_total) + data['total'], received_envs_ids=','.join(prev_recv_envs_ids))

        p_env = PublicEnvelope.objects.filter(id=data['id'])
        prev_people = p_env.first().received_total_people
        p_env.update(received_total_people=prev_people + 1)
        if p_env.first().total_people == prev_people + 1:
            p_env.update(is_completed=True)

        return JsonResponse({'status': True}, status=201)
    except Exception as e:
        return JsonResponse({'status': False, 'error': str(e)}, status=500)


@require_http_methods(["POST"])
def release_envelope(request):
    try:
        data = json.loads(request.body)

        new_env = PublicEnvelope.objects.create(total=data['total'],
                                                publisher=data['csrfToken'],
                                                word=data['word'],
                                                total_people=data['total_people'],
                                                received_total_people=0,
                                                is_completed=False,
                                                per_person=','.join(
                                                    map(str, generate_floats(data['total_people'], data['total']))
                                                )
                                                )

        u_env_qs = Users.objects.filter(csrftoken=data['csrfToken'])
        prev_total = u_env_qs.first().total
        u_env_qs.update(total=float(prev_total) - data['total'])

        return JsonResponse({'status': True, 'id': new_env.id}, status=201)
    except Exception as e:
        return JsonResponse({'status': False, 'error': str(e)}, status=500)


@require_http_methods(["POST"])
def modify_nickname(request):
    try:
        data = json.loads(request.body)

        Users.objects.create(csrftoken=data['csrfToken'],
                             total=0,
                             received_envs_ids='',
                             nickname=data['nickname']
                             )

        return JsonResponse({'status': True}, status=201)

    except Exception as e:
        return JsonResponse({'status': False, 'error': str(e)}, status=500)


@require_http_methods(["POST"])
def request_call(request):
    try:
        data = json.loads(request.body)

        caller_env_qs = Users.objects.filter(csrftoken=data['csrfToken'])
        if caller_env_qs.first().total < 2:
            return JsonResponse({'status': False, 'error': ''}, status=200)

        callee_env_qs = Users.objects.filter(nickname=data['to_nickname'])
        to_csrftoken = callee_env_qs.first().csrftoken

        session_uuid = uuid.uuid4().hex
        Calls.objects.create(from_csrftoken=data['csrfToken'], to_csrftoken=to_csrftoken, session_uuid=session_uuid)
        caller_env_qs.update(total=caller_env_qs.first().total - 2)

        info = {
            'from_csrftoken': data['csrfToken'],
            'to_csrftoken': to_csrftoken,
            'session_uuid': session_uuid,
            'caller_name': caller_env_qs.first().nickname,
            'callee_name': data['to_nickname'],
            'role': 'caller',
            'exp': int(time.time()) + 60 * 5
        }

        token = jwt.encode(info, settings.SHARED_SECRET_KEY, algorithm="HS256")

        return JsonResponse({'status': True, 'token': token}, status=201)

    except Exception as e:
        return JsonResponse({'status': False, 'error': str(e)}, status=500)
