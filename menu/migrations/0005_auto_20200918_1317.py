# Generated by Django 3.1 on 2020-09-18 20:17

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0004_auto_20200916_1853'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='food',
            name='category',
        ),
        migrations.AddField(
            model_name='food',
            name='category',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='foods', to='menu.category'),
        ),
    ]
