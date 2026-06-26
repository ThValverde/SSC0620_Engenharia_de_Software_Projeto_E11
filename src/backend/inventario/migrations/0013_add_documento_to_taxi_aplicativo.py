# Generated migration to add documento and tipo_documento fields to TaxiAplicativo

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0009_alter_grupofolclorico_tipo_documento'),
    ]

    operations = [
        migrations.AddField(
            model_name='taxiaplicativo',
            name='tipo_documento',
            field=models.CharField(
                blank=True,
                choices=[('cpf', 'CPF'), ('cnpj', 'CNPJ')],
                help_text='Tipo de documento: CPF (pessoa física) ou CNPJ (empresa/associação)',
                max_length=4,
            ),
        ),
        migrations.AddField(
            model_name='taxiaplicativo',
            name='documento',
            field=models.CharField(
                blank=True,
                help_text='CPF (11 dígitos) ou CNPJ (14 dígitos), sem máscara',
                max_length=14,
            ),
        ),
    ]
