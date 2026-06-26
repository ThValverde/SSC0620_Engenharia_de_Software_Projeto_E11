"""Seções de Meios de Alimentação (Acessibilidade + Dados de Funcionamento).

CONSOLIDADO: acessibilidade NÃO é duplicada (vem do seed_caracteristicas);
aqui apenas LIGA à seção. Comodidades (exclusivas do escopo, sem "Não")
são criadas na seção Dados de Funcionamento.
"""

from django.db import migrations

ESCOPO = "alimentacao"

# (subgrupo, opção) — exclusivas deste escopo, sem "Não"
SERVICOS = [
    ("Dados Funcionamento", "Estacionamento"),
    ("Dados Funcionamento", "Música ao vivo"),
    ("Dados Funcionamento", "Espaço para eventos"),
    ("Dados Funcionamento", "Atendimento a grupos"),
    ("Dados Funcionamento", "Manobrista"),
    ("Dados Funcionamento", "Adega"),
    ("Dados Funcionamento", "Climatizador"),
    ("Dados Funcionamento", "Ventilador"),
    ("Dados Funcionamento", "Ar condicionado"),
    ("Dados Funcionamento", "Internet sem fio"),
    ("Dados Funcionamento", "Área de lazer para crianças"),
    ("Dados Funcionamento", "Recreação para crianças"),
    ("Dados Funcionamento", "Área para fumantes"),
    ("Dados Funcionamento", "Carta de vinhos"),
    ("Dados Funcionamento", "Sanitário proprio"),
]


def semear(apps, schema_editor):
    Secao = apps.get_model("inventario", "Secao")
    Caracteristica = apps.get_model("inventario", "Caracteristica")

    acess, _ = Secao.objects.get_or_create(
        escopo=ESCOPO, nome="Acessibilidade",
        defaults={"com_pergunta": True, "ordem": 1})
    serv, _ = Secao.objects.get_or_create(
        escopo=ESCOPO, nome="Dados de Funcionamento",
        defaults={"com_pergunta": False, "ordem": 2})

    # 1) Acessibilidade: já criada pelo seed_caracteristicas -> apenas LIGA.
    Caracteristica.objects.filter(escopo=ESCOPO, secao__isnull=True).update(secao=acess)

    # 2) Comodidades: exclusivas deste escopo -> cria e liga.
    for (sub, op) in SERVICOS:
        Caracteristica.objects.update_or_create(
            escopo=ESCOPO, nome=sub, categoria=op,
            defaults={"secao": serv, "customizada": False})


def remover(apps, schema_editor):
    Secao = apps.get_model("inventario", "Secao")
    Caracteristica = apps.get_model("inventario", "Caracteristica")
    Caracteristica.objects.filter(
        escopo=ESCOPO, nome__in=sorted({s for s, _ in SERVICOS})).delete()
    Caracteristica.objects.filter(escopo=ESCOPO).update(secao=None)
    Secao.objects.filter(escopo=ESCOPO).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("inventario", "seed_caracteristicas"),
        ("inventario", "0004_seed_secoes_mh"),
    ]
    operations = [migrations.RunPython(semear, remover)]