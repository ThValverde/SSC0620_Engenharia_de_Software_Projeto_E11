"""Seções de Meios de Hospedagem (Acessibilidade + Serviços e Equipamentos).

CONSOLIDADO: acessibilidade NÃO é duplicada (vem do seed_caracteristicas);
aqui apenas LIGA à seção. Comodidades (exclusivas do escopo, sem "Não")
são criadas na seção Serviços e Equipamentos.
"""

from django.db import migrations

ESCOPO = "meio_hospedagem"

# (subgrupo, opção) — exclusivas deste escopo, sem "Não"
SERVICOS = [
    ("Geral", "Estacionamento"),
    ("Geral", "Manobrista"),
    ("Geral", "Mensageiro"),
    ("Geral", "Área para fumantes"),
    ("Geral", "Pet"),
    ("Atendimento em língua estrangeira", "Inglês"),
    ("Atendimento em língua estrangeira", "Espanhol"),
    ("UH", "Internet sem fio"),
    ("UH", "Ar Condicionado"),
    ("UH", "Ventilador/Climatizador"),
    ("UH", "Frigobar"),
    ("UH", "TV"),
    ("Recepção", "Internet Sem Fio"),
    ("Recepção", "Ar condicionado"),
    ("Recepção", "Climatizador Ventilador"),
    ("Recepção", "Área de estar"),
    ("Recepção", "Sanitário"),
    ("Recepção", "Sanitário PCD"),
    ("A & B", "Café da Manhã"),
    ("A & B", "Meia Pensão"),
    ("A & B", "Pensão Completa"),
    ("A & B", "All-Inclusive"),
    ("A & B", "Room Service"),
    ("A & B", "Restaurante"),
    ("A & B", "Lanchonete"),
    ("A & B", "Bar"),
    ("A & B", "Bar Molhado"),
    ("A & B", "Copa do bebê"),
    ("A & B", "Área pra refeições/copa"),
    ("A & B", "Sanitário exclusivo para área de A&B"),
    ("A & B", "Sanitário PCD exclusivo para área de A&B"),
    ("A & B", "Aberto ao público"),
    ("A & B", "Alimentação diferenciada (diabeticos, celiacos, veganos, etc)"),
    ("Área de Eventos", "Ar condicionado"),
    ("Área de Eventos", "Climatizador / Ventilador"),
    ("Área de Eventos", "Sanitário exclusivo área de eventos"),
    ("Área de Eventos", "Sanitário PCD exclusivo área de eventos"),
    ("Área de Eventos", "Mobiliários"),
    ("Área de Eventos", "Eq. Audiovisuais"),
    ("Área de Recreação", "Piscina"),
    ("Área de Recreação", "Piscina infantil"),
    ("Área de Recreação", "Sauna"),
    ("Área de Recreação", "SPA / ofuro"),
    ("Área de Recreação", "Área Verde"),
    ("Área de Recreação", "Área Descanso / leitura"),
    ("Área de Recreação", "Academia"),
    ("Área de Recreação", "Quadra Poliesportiva"),
    ("Área de Recreação", "Salão de Jogos"),
    ("Área de Recreação", "Área de lazer para crianças"),
    ("Área de Recreação", "Equipe de recreação para crianças"),
    ("Área de Recreação", "Anfiteatro/Cinema"),
    ("Área de Recreação", "Mini Golf / Golf"),
    ("Área de Recreação", "Mini Campo / Campo de futebol"),
    ("Área de Recreação", "Sanitário exclusivo área de lazer"),
    ("Área de Recreação", "Sanitário PCD exclusivo área de lazer"),
]


def semear(apps, schema_editor):
    Secao = apps.get_model("inventario", "Secao")
    Caracteristica = apps.get_model("inventario", "Caracteristica")

    acess, _ = Secao.objects.get_or_create(
        escopo=ESCOPO, nome="Acessibilidade",
        defaults={"com_pergunta": True, "ordem": 1})
    serv, _ = Secao.objects.get_or_create(
        escopo=ESCOPO, nome="Serviços e Equipamentos",
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
        ("inventario", "0003_secao_caracteristica_secao"),
    ]
    operations = [migrations.RunPython(semear, remover)]