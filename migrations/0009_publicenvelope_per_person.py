# Generated by Django 4.2 on 2025-04-04 11:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('PChat', '0008_publicenvelope_word'),
    ]

    operations = [
        migrations.AddField(
            model_name='publicenvelope',
            name='per_person',
            field=models.CharField(default='', max_length=6, verbose_name='每人领取钱数的列表'),
        ),
    ]
