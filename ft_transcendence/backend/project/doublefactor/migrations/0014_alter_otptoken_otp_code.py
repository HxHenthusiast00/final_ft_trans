# Generated by Django 3.2.7 on 2024-10-23 08:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('doublefactor', '0013_alter_otptoken_otp_code'),
    ]

    operations = [
        migrations.AlterField(
            model_name='otptoken',
            name='otp_code',
            field=models.CharField(default='58a16c', max_length=6),
        ),
    ]
