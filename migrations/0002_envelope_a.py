# Generated by Django 4.2 on 2025-02-15 07:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('PChat', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='envelope',
            name='a',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
    ]
