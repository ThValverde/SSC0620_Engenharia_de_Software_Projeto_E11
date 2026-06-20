"""Seed das SEÇÕES de Meios de Hospedagem + comodidades (com subgrupos).

- Cria as seções "Acessibilidade" (com pergunta Sim/Não) e
  "Serviços e Equipamentos" (sempre exibida).
- Liga as características de acessibilidade já existentes (0002) à seção.
- Cria as comodidades preservando o SUBGRUPO em `nome` (ex.: "UH",
  "Recepção"), de modo que itens iguais em subgrupos diferentes (ex.:
  "Ar condicionado") sejam linhas distintas.
"""

from django.db import migrations

ESCOPO = "meio_hospedagem"

# (subgrupo, opção)
COMODIDADES = [
    ("Geral", "Estacionamento"),
    ("Geral", "Manobrista"),
    ("Geral", "Mensageiro"),
    ("Geral", "Área para fumantes"),
    ("Geral", "Pet"),
    ("Atendimento em língua estrangeira", "Inglês"),
    ("Atendimento em língua estrangeira", "Espanhol"),
    ("Atendimento em língua estrangeira", "Outra"),
    ("UH", "Internet sem fio"),
    ("UH", "Ar Condicionado"),
    ("UH", "Ventilador/Climatizador"),
    ("UH", "Frigobar"),
    ("UH", "TV"),
    ("UH", "Outros"),
    ("Recepção", "Não"),
    ("Recepção", "Internet Sem Fio"),
    ("Recepção", "Ar condicionado"),
    ("Recepção", "Climatizador Ventilador"),
    ("Recepção", "Área de estar"),
    ("Recepção", "Sanitário"),
    ("Recepção", "Sanitário  PCD"),
    ("Recepção", "Outros"),
    ("A & B", "Não"),
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
    ("A & B", "Outros"),
    ("Área de Eventos", "Não"),
    ("Área de Eventos", "Ar condicionado"),
    ("Área de Eventos", "Climatizador   Ventilador"),
    ("Área de Eventos", "Sanitário exclusivo área de eventos"),
    ("Área de Eventos", "Sanitário PCD exclusivo área de eventos"),
    ("Área de Eventos", "Mobiliários"),
    ("Área de Eventos", "Eq. Audiovisuais"),
    ("Área de Eventos", "Outros"),
    ("Área de Recreação", "Não"),
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
    ("Área de Recreação", "Anfiteratro/Cinema"),
    ("Área de Recreação", "Mini Golf / Golf"),
    ("Área de Recreação", "Mini Campo / Campo de futebol"),
    ("Área de Recreação", "Sanitário exclusivo área de lazer"),
    ("Área de Recreação", "Sanitário PCD exclusivo área de lazer"),
    ("Área de Recreação", "Outros"),
]


def semear(apps, schema_editor):
    Secao = apps.get_model("inventario", "Secao")
    Caracteristica = apps.get_model("inventario", "Caracteristica")

    acess, _ = Secao.objects.get_or_create(
        escopo=ESCOPO, nome="Acessibilidade",
        defaults={"com_pergunta": True, "ordem": 2})
    serv, _ = Secao.objects.get_or_create(
        escopo=ESCOPO, nome="Serviços e Equipamentos",
        defaults={"com_pergunta": False, "ordem": 1})

    Caracteristica.objects.filter(escopo=ESCOPO, secao__isnull=True).update(secao=acess)

    novas = [
        Caracteristica(escopo=ESCOPO, secao=serv, nome=sub, categoria=op, customizada=False)
        for (sub, op) in COMODIDADES
    ]
    Caracteristica.objects.bulk_create(novas, ignore_conflicts=True)


def remover(apps, schema_editor):
    Secao = apps.get_model("inventario", "Secao")
    Caracteristica = apps.get_model("inventario", "Caracteristica")
    subgrupos = sorted({s for s, _ in COMODIDADES})
    Caracteristica.objects.filter(escopo=ESCOPO, nome__in=subgrupos).delete()
    Caracteristica.objects.filter(escopo=ESCOPO).update(secao=None)
    Secao.objects.filter(escopo=ESCOPO).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("inventario", "seed_caracteristicas"),
        ("inventario", "0003_secao_caracteristica_secao"),
    ]
    operations = [migrations.RunPython(semear, remover)]
