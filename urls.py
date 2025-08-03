"""Chat URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# from django.contrib import admin
from django.urls import path
from django.views.generic import RedirectView

from PChat import views

urlpatterns = [
    path('', views.password),
    path('chat/', views.homepage),
    path('envelope/', views.envelope),
    path('api/get_recv_money', views.get_recv_money),
    path('api/modify_user_money', views.modify_user_money),
    path('api/release_envelope', views.release_envelope),
    path('api/modify_nickname', views.modify_nickname),
    path('api/request_call', views.request_call)
]
