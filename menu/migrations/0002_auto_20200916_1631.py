# Generated by Django 3.1 on 2020-09-16 23:31

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='recipe',
            name='ingredients',
        ),
        migrations.AddField(
            model_name='ingredient',
            name='recipe',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='ingredients', to='menu.recipe'),
            preserve_default=False,
        ),
        migrations.RemoveField(
            model_name='food',
            name='category',
        ),
        migrations.AddField(
            model_name='food',
            name='category',
            field=models.ManyToManyField(null=True, related_name='foods', to='menu.Category'),
        ),
        migrations.AlterField(
            model_name='recipe',
            name='name',
            field=models.CharField(max_length=64),
        ),
    ]
