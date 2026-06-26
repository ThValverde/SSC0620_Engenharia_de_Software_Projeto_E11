# Generated migration to add nivel_permissao field to VinculoTrade

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0005_seed_alimentacao'),
    ]

    operations = [
        migrations.AddField(
            model_name='vinculotrade',
            name='nivel_permissao',
            field=models.CharField(
                max_length=50,
                default='visualizador',
                choices=[
                    ('admin', 'Administrador'),
                    ('editor', 'Editor'),
                    ('visualizador', 'Visualizador'),
                ],
                help_text='Nível de permissão do usuário neste estabelecimento'
            ),
        ),
    ]
