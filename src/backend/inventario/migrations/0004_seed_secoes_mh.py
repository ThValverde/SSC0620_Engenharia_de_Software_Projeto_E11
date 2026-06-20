"""Seed Consolidado e Unificado de Meios de Hospedagem.

- Cria as seções "Acessibilidade" e "Serviços e Equipamentos".
- Injeta todo o catálogo limpo de Acessibilidade (sem opções genéricas "Outros").
- Injeta todo o catálogo limpo de Comodidades e Lazer.
- Associa cada item diretamente à sua seção correspondente desde o nascimento.
"""

from django.db import migrations

ESCOPO = "meio_hospedagem"

# 1. ITENS DA SEÇÃO ACESSIBILIDADE -> (Subgrupo/Nome, Opção/Categoria)
ACESSIBILIDADE = [
    ("Pessoal capacitado para receber pessoas com deficiência", "Não"),
    ("Pessoal capacitado para receber pessoas com deficiência", "Física"),
    ("Pessoal capacitado para receber pessoas com deficiência", "Auditiva"),
    ("Pessoal capacitado para receber pessoas com deficiência", "Visual"),
    ("Pessoal capacitado para receber pessoas com deficiência", "Intelectual"),
    ("Pessoal capacitado para receber pessoas com deficiência", "Múltipla"),
    ("Rota externa acessível", "Não"),
    ("Rota externa acessível", "Calçada rebaixada"),
    ("Rota externa acessível", "Faixa de pedestre"),
    ("Rota externa acessível", "Rampa"),
    ("Rota externa acessível", "Semáforo Sonoro"),
    ("Rota externa acessível", "Piso tátil de alerta"),
    ("Rota externa acessível", "Piso regular e antiderrapante"),
    ("Rota externa acessível", "Livre de obstáculos"),
    ("Rota externa acessível", "Acesso em nível"),
    ("Local de embarque e desembarque", "Não"),
    ("Local de embarque e desembarque", "Sinalizado"),
    ("Local de embarque e desembarque", "Com acesso em nível"),
    ("Local de embarque e desembarque", "Sem Obtáculos"),
    ("Vaga em estacionamento", "Não"),
    ("Vaga em estacionamento", "Sinalizada"),
    ("Vaga em estacionamento", "Com acesso em nível"),
    ("Vaga em estacionamento", "Alargada para cadeira de rodas"),
    ("Vaga em estacionamento", "Rampa de acesso à calçada"),
    ("Área de circulação/acesso interno para cadeiras de rodas", "Não"),
    ("Área de circulação/acesso interno para cadeiras de rodas", "Plataforma elevatória"),
    ("Área de circulação/acesso interno para cadeiras de rodas", "Com circulação entre mobiliário"),
    ("Área de circulação/acesso interno para cadeiras de rodas", "Porta larga"),
    ("Escada", "Não"),
    ("Escada", "Corrimão"),
    ("Escada", "Patamar para descanso"),
    ("Escada", "Sinalização/Piso tátil de alerta"),
    ("Escada", "Sinalização visual"),
    ("Escada", "Piso antiderrapante"),
    ("Rampa", "Não"),
    ("Rampa", "Corrimão"),
    ("Rampa", "Patamar para descanso"),
    ("Rampa", "Piso antiderrapante"),
    ("Rampa", "Sinalização / piso tátil"),
    ("Rampa", "Inclinação adequada"),
    ("Piso", "Não"),
    ("Piso", "Tátil"),
    ("Piso", "Regular, sem obstáculos (tapete ou desnível)"),
    ("Piso", "Antiderrapante/deslizante"),
    ("Elevador", "Não"),
    ("Elevador", "Sinalizado em Braille"),
    ("Elevador", "Dispositivo sonoro"),
    ("Elevador", "Dispositivo luminoso"),
    ("Elevador", "Sensor eletrônico (porta)"),
    ("Elevador", "Sinalização visual"),
    ("Equipamento motorizado para deslocamento interno", "Não"),
    ("Equipamento motorizado para deslocamento interno", "Sim"),
    ("Sinalização visual", "Não"),
    ("Sinalização visual", "Entrada / Saída"),
    ("Sinalização visual", "Recepção"),
    ("Sinalização visual", "Sanitário"),
    ("Sinalização visual", "Eventos"),
    ("Sinalização visual", "Restaurante"),
    ("Sinalização visual", "Área de lazer"),
    ("Sinalização visual", "Área de resgate"),
    ("Alarme de emergência", "Não"),
    ("Alarme de emergência", "Sim"),
    ("Comunicação", "Não"),
    ("Comunicação", "Texto informativo em Braille"),
    ("Comunicação", "Texto informativo em fonte ampliada"),
    ("Comunicação", "Intérprete em Libras (língua brasileira de sinais)"),
    ("Balcão de atendimento", "Não"),
    ("Balcão de atendimento", "Rebaixado"),
    ("Balcão de atendimento", "Preferencial para pessoas com deficiência ou mobilidade reduzida"),
    ("Mobiliário", "Não"),
    ("Mobiliário", "Altura adequada"),
    ("Mobiliário", "Recuo adequado"),
    ("Sanitário", "Não"),
    ("Sanitário", "Barra de apoio"),
    ("Sanitário", "Porta larga suficiente para entrada de cadeira de rodas"),
    ("Sanitário", "Acesso e giro para cadeira de rodas"),
    ("Sanitário", "Pia rebaixada"),
    ("Sanitário", "Espelho rebaixado ou com ângulo de alcance visual"),
    ("Sanitário", "Box ou banheira adaptada"),
    ("Sanitário", "Torneira monocomando/alavanca"),
    ("Sanitário", "Piso regular, sem obstáculos"),
    ("Sanitário", "Piso tátil"),
    ("Telefone", "Não"),
    ("Telefone", "Altura adequada"),
    ("Telefone", "Para surdos (TPS ou TTS)"),
    ("Sinalização indicativa de atendimento preferencial para PCD", "Sim"),
    ("Sinalização indicativa de atendimento preferencial para PCD", "Não"),
]

# 2. ITENS DA SEÇÃO SERVIÇOS E EQUIPAMENTOS -> (Subgrupo/Nome, Opção/Categoria)
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
    ("Recepção", "Não"),
    ("Recepção", "Internet Sem Fio"),
    ("Recepção", "Ar condicionado"),
    ("Recepção", "Climatizador Ventilador"),
    ("Recepção", "Área de estar"),
    ("Recepção", "Sanitário"),
    ("Recepção", "Sanitário PCD"),
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
    ("Área de Eventos", "Não"),
    ("Área de Eventos", "Ar condicionado"),
    ("Área de Eventos", "Climatizador / Ventilador"),
    ("Área de Eventos", "Sanitário exclusivo área de eventos"),
    ("Área de Eventos", "Sanitário PCD exclusivo área de eventos"),
    ("Área de Eventos", "Mobiliários"),
    ("Área de Eventos", "Eq. Audiovisuais"),
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
    ("Área de Recreação", "Anfiteatro/Cinema"),
    ("Área de Recreação", "Mini Golf / Golf"),
    ("Área de Recreação", "Mini Campo / Campo de futebol"),
    ("Área de Recreação", "Sanitário exclusivo área de lazer"),
    ("Área de Recreação", "Sanitário PCD exclusivo área de lazer"),
]


def semear(apps, schema_editor):
    Secao = apps.get_model("inventario", "Secao")
    Caracteristica = apps.get_model("inventario", "Caracteristica")

    # Garante a criação estrutural do Nível 1
    acess, _ = Secao.objects.get_or_create(
        escopo=ESCOPO, nome="Acessibilidade",
        defaults={"com_pergunta": True, "ordem": 1})
        
    serv, _ = Secao.objects.get_or_create(
        escopo=ESCOPO, nome="Serviços e Equipamentos",
        defaults={"com_pergunta": False, "ordem": 2})

    # Instancia as características vinculando-as diretamente ao respectivo pai
    novas_acess = [
        Caracteristica(escopo=ESCOPO, secao=acess, nome=sub, categoria=op, customizada=False)
        for (sub, op) in ACESSIBILIDADE
    ]
    novas_serv = [
        Caracteristica(escopo=ESCOPO, secao=serv, nome=sub, categoria=op, customizada=False)
        for (sub, op) in SERVICOS
    ]

    # Salva em lote de forma extremamente rápida e resiliente
    Caracteristica.objects.bulk_create(novas_acess, ignore_conflicts=True)
    Caracteristica.objects.bulk_create(novas_serv, ignore_conflicts=True)


def remover(apps, schema_editor):
    Secao = apps.get_model("inventario", "Secao")
    Caracteristica = apps.get_model("inventario", "Caracteristica")
    
    # Limpa as tabelas referentes a este escopo específico
    Caracteristica.objects.filter(escopo=ESCOPO).delete()
    Secao.objects.filter(escopo=ESCOPO).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("inventario", "0003_secao_caracteristica_secao"),
    ]
    operations = [migrations.RunPython(semear, remover)]