from django.db import models


class Users(models.Model):
    csrftoken = models.CharField(verbose_name='CSRF令牌', primary_key=True, max_length=50)
    total = models.DecimalField(verbose_name='账户余额',
                                max_digits=10,
                                decimal_places=2,
                                default=0)
    received_envs_ids = models.TextField(verbose_name='用户领取过红包的ID', default='')
    nickname = models.CharField(verbose_name='用户昵称', max_length=50, default='')


class PublicEnvelope(models.Model):
    total = models.DecimalField(verbose_name='红包总钱数', max_digits=10, decimal_places=2)
    publisher = models.CharField(verbose_name='CSRF令牌', max_length=50, default='')
    word = models.CharField(verbose_name='祝福语', max_length=100, default='')
    total_people = models.IntegerField(verbose_name='总人数')
    received_total_people = models.IntegerField(verbose_name='领取总人数', default=0)
    is_completed = models.BooleanField(verbose_name='是否领完', default=False)
    per_person = models.TextField(verbose_name='每人领取钱数的列表', default='')


class Calls(models.Model):
    from_csrftoken = models.CharField(verbose_name='CSRF令牌', max_length=50)
    to_csrftoken = models.CharField(verbose_name='CSRF令牌', max_length=50)
    session_uuid = models.CharField(verbose_name='UUID', default='', max_length=50)

class Message(models.Model):
    csrftoken = models.CharField(verbose_name='CSRF令牌', max_length=50)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.message
