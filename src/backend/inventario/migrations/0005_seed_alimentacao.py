"""Seed Consolidado e Unificado de Meios de Alimentação e Bebidas.

- Cria as seções "Acessibilidade" e "Dados de Funcionamento".
- Injeta o catálogo limpo de Acessibilidade específico para restaurantes/bares.
- Injeta as características operacionais (Adega, Climatizador, Ventilador, etc.).
"""

from django.db import migrations

ESCOPO = "alimentacao"

# 1. ITENS DA SEÇÃO ACESSIBILIDADE -> (Subgrupo/Nome, Opção/Categoria)
ACESSIBILIDADE = [
    ("Capacidade para receber pessoas com deficiência", "Não"),
    ("Capacidade para receber pessoas com deficiência", "Física"),
    ("Capacidade para receber pessoas com deficiência", "Auditiva"),
    ("Capacidade para receber pessoas com deficiência", "Visual"),
    ("Capacidade para receber pessoas com deficiência", "Intelectual"),
    ("Capacidade para receber pessoas com deficiência", "Múltipla"),
    ("Rota externa acessível", "Não"),
    ("Rota externa acessível", "Calçada rebaixada"),
    ("Rota externa acessível", "Faixa de pedestre"),
    ("Rota externa acessível", "Rampa"),
    ("Rota externa acessível", "Semáforo sonoro"),
    ("Rota externa acessível", "Piso regular/anti derrapante"),
    ("Rota externa acessível", "Livre de obstáculos"),
    ("Local de embarque e desembarque", "Não"),
    ("Local de embarque e desembarque", "Sinalizado"),
    ("Local de embarque e desembarque", "Com acesso em nível"),
    ("Estacionamento", "Não"),
    ("Estacionamento", "Sinalizada"),
    ("Estacionamento", "Com acesso em nível"),
    ("Estacionamento", "Alargada para cadeira de rodas"),
    ("Estacionamento", "Rampa de acesso à calçada"),
    ("Área de circulação/acesso interno para cadeiras de rodas", "Não"),
    ("Área de circulação/acesso interno para cadeiras de rodas", "Plataforma elevatória"),
    ("Área de circulação/acesso interno para cadeiras de rodas", "Com circulação entre mobiliário"),
    ("Área de circulação/acesso interno para cadeiras de rodas", "Porta larga"),
    ("Escada", "Não"),
    ("Escada", "Corrimão"),
    ("Escada", "Patamar para descanso"),
    ("Escada", "Sinalização tátil de alerta"),
    ("Escada", "Piso antiderrapante"),
    ("Escada", "Piso tátil"),
    ("Rampa", "Não"),
    ("Rampa", "Corrimão"),
    ("Rampa", "Patamar para descanso"),
    ("Rampa", "Piso antiderrapante"),
    ("Rampa", "Sinalização tátil"),
    ("Rampa", "Piso tátil"),
    ("Rampa", "Inclinação adequada"),
    ("Piso", "Não"),
    ("Piso", "Tátil"),
    ("Piso", "Sem obstáculos (tapete ou desnível)"),
    ("Piso", "Antiderrapante/antideslizante"),
    ("Elevador", "Não"),
    ("Elevador", "Sinalizado em Braille"),
    ("Elevador", "Dispositivo sonoro"),
    ("Elevador", "Dispositivo luminoso"),
    ("Elevador", "Sensor eletrônico (porta)"),
    ("Equipamento motorizado para deslocamento interno", "Não"),
    ("Equipamento motorizado para deslocamento interno", "Sim"),
    ("Sinalização visual", "Não"),
    ("Sinalização visual", "Atendimento Preferencial Pcd"),
    ("Sinalização visual", "Entrada/Saída"),
    ("Sinalização visual", "Caixa"),
    ("Sinalização visual", "Sanitário"),
    ("Sinalização visual", "Sanitário PCD"),
    ("Sinalização visual", "Elevador"),
    ("Sinalização visual", "Escada"),
    ("Sinalização visual", "Cozinha"),
    ("Sinalização visual", "Área de lazer"),
    ("Sinalização visual", "Área de resgate"),
    ("Alarme de emergência para deficientes", "Não"),
    ("Alarme de emergência para deficientes", "Sim"),
    ("Comunicação", "Não"),
    ("Comunicação", "Cardápio em Braille"),
    ("Comunicação", "Cardápio em língua estrangeira"),
    ("Comunicação", "Cardápio em fonte ampliada"),
    ("Comunicação", "Telefone para surdos (TPS ou TTS)"),
    ("Comunicação", "Intérprete em Libras (língua brasileira de sinais)"),
    ("Balcão de atendimento", "Não"),
    ("Balcão de atendimento", "Rebaixado"),
    ("Mobiliário", "Não"),
    ("Mobiliário", "Altura adequada"),
    ("Mobiliário", "Recuo adequado"),
    ("Sanitário", "Não"),
    ("Sanitário", "Barra de apoio"),
    ("Sanitário", "Porta larga suficiente para entrada de cadeira de rodas"),
    ("Sanitário", "Giro para cadeira de rodas"),
    ("Sanitário", "Acesso para cadeira de rodas"),
    ("Sanitário", "Pia rebaixada"),
    ("Sanitário", "Espelho rebaixado ou com ângulo de alcance visual"),
    ("Sanitário", "Torneira monocomando/alavanca"),
]

# 2. ITENS DA SEÇÃO DADOS DE FUNCIONAMENTO -> Como é um nível plano, Nome e Categoria se alinham
FUNCIONAMENTO = [
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

    # Cria as Seções Master do escopo de Alimentação
    acess, _ = Secao.objects.get_or_create(
        escopo=ESCOPO, nome="Acessibilidade",
        defaults={"com_pergunta": True, "ordem": 1})
        
    func, _ = Secao.objects.get_or_create(
        escopo=ESCOPO, nome="Dados de Funcionamento",
        defaults={"com_pergunta": False, "ordem": 2})

    # Prepara os objetos associando-os às seções corretas
    novas_acess = [
        Caracteristica(escopo=ESCOPO, secao=acess, nome=sub, categoria=op, customizada=False)
        for (sub, op) in ACESSIBILIDADE
    ]
    novas_func = [
        Caracteristica(escopo=ESCOPO, secao=func, nome=sub, categoria=op, customizada=False)
        for (sub, op) in FUNCIONAMENTO
    ]

    # Grava tudo em lote de forma limpa
    Caracteristica.objects.bulk_create(novas_acess, ignore_conflicts=True)
    Caracteristica.objects.bulk_create(novas_func, ignore_conflicts=True)


def remover(apps, schema_editor):
    Secao = apps.get_model("inventario", "Secao")
    Caracteristica = apps.get_model("inventario", "Caracteristica")
    
    Caracteristica.objects.filter(escopo=ESCOPO).delete()
    Secao.objects.filter(escopo=ESCOPO).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("inventario", "0004_seed_secoes_mh"), # Segue a linha do tempo após o seed de hotelaria
    ]
    operations = [migrations.RunPython(semear, remover)]