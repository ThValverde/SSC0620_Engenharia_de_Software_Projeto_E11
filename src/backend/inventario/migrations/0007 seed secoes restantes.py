"""Seções dos escopos restantes: Atrativos, Agências, Espaços e Organizadores.

Migração única (em vez de uma por escopo). Para cada escopo:
  - cria as seções;
  - LIGA as características de acessibilidade já criadas pelo
    seed_caracteristicas (sem recriar -> sem órfãs);
  - cria os grupos NÃO-acessibilidade do documento (sem "Não").

Nenhuma opção "Não": a ausência de marcação já significa "não possui".
"""

from django.db import migrations

# Grupos de acessibilidade de Espaços (precisam ser separados dos de equipamentos)
ESPACOS_ACESS = ["MOBILIÁRIO PCD", "ÁREA INTERNA", "ELEVADOR", "ESCADA",
                 "RAMPA", "INSTALAÇÕES SANITÁRIAS"]
ESPACOS_EQUIP = ["EQUPAMENTOS E SERVIÇOS", "SERVIÇOS E ITENS DE SEGURANÇA",
                 "ENERGIA ELÉTRICA", "GERADOR DE EMERGÊNCIA"]

SEED = {
    "atrativos": [
        {"nome": "Acessibilidade", "com_pergunta": True, "ordem": 1, "ligar_restantes": True},
        {"nome": "Serviços e Informações", "com_pergunta": False, "ordem": 2, "criar": {
            "Atendimento": ["Português", "Inglês", "Espanhol"],
            "Informativo Impresso": ["Português", "Inglês", "Espanhol"],
            "Informações": ["Classificação Turística", "Atividade",
                            "Integra roteiros turísticos comercializados",
                            "Integra guias turísticos"],
            "Visitação": ["Cobrança de ingresso: 0", "Cobrança de ingresso: 1",
                          "Cobrança de ingresso: 2", "Forma de pagamento aceita",
                          "Aberto ao público", "Visita agendada opcional",
                          "Visita agendada obrigatória", "Visita autoguiada",
                          "Visita guiada", "Cobrança extra p/ visita acompanhada"],
            "Instalações Gerais": ["Centro de recepção", "Posto de informação",
                "Portaria principal", "Guarita", "Bilheteria-caixa", "Anfiteatro",
                "Espaço para festas, eventos e apresentações", "Loja de souvenir",
                "Feiras", "Lanchonete-bar-restaurante", "Área de exposição",
                "Ar condicionado", "Climatizador-ventilador", "Guarda-volumes",
                "Circuito de monitoramento de segurança", "Serviço de informações",
                "Serviço de segurança", "Área para descanso",
                "Área de lazer para crianças", "Equipe de recreação p/ crianças"],
            "Acervos": ["Artes visuais cinematográficas", "Caça e guerra",
                "Objetos pecuniários", "Interiores", "Trabalho", "Lazer-desporto",
                "Religião-cerimônia", "Comunicação", "Transporte", "Objetos pessoais",
                "Castigo-penitência", "Objetos arqueológicos",
                "Estilo arquitetônico predominante"],
        }},
    ],
    "agencias": [
        {"nome": "Acessibilidade", "com_pergunta": True, "ordem": 1, "ligar_restantes": True},
        {"nome": "Serviços e Atendimento", "com_pergunta": False, "ordem": 2, "criar": {
            "Loja Física": ["Sim"],
            "Atendimento em Língua Estrangeira": ["Inglês", "Espanhol"],
        }},
    ],
    "espacos_eventos": [
        {"nome": "Acessibilidade", "com_pergunta": True, "ordem": 1, "ligar_grupos": ESPACOS_ACESS},
        {"nome": "Equipamentos e Serviços", "com_pergunta": False, "ordem": 2,
         "ligar_grupos": ESPACOS_EQUIP, "criar": {
            "Tipo de Espaço": ["Centro de Convenções e Feiras",
                "Parque-Pavilhão-Centro de Exposições", "Auditório-Salão para Reuniões"],
            "Atendimento em Língua Estrangeira": ["Inglês", "Espanhol"],
            "Estacionamento": ["Pago", "Gratuito", "Coberto", "Descoberto", "Vaga PCD"],
            "Área de Carga e Descarga": ["Sim", "Sinalizada"],
            "Área de Embarque-Desembarque": ["Sim", "Sinalizada para PCD"],
            "Infraestrutura Externa": ["Piso regular", "Calçada rebaixada",
                "Acesso em nível", "Rampa", "Faixa de pedestres"],
            "Espaços Internos": ["Área de Exposição Coberta", "Área de Exposição Descoberta",
                "Área para Cozinha", "Auditório", "Bar e Lanchonete", "Cabine de Som",
                "Escaninho", "Espaço Multiuso", "Pavilhão de Feiras", "Praça de Alimentação",
                "Restaurante", "Sala", "Salas Modulares", "Teatro"],
        }},
    ],
    "organizadores": [
        {"nome": "Serviços e Atendimento", "com_pergunta": False, "ordem": 1, "criar": {
            "Atividades": ["Eventos Sociais", "Eventos Corporativos", "Eventos Esportivos",
                "Eventos Culturais-Entretenimento", "Eventos Religiosos",
                "Eventos Acadêmicos-Educacionais"],
            "Atendimento em Língua Estrangeira": ["Inglês", "Espanhol"],
        }},
    ],
}

# seções criadas exclusivamente aqui (para o remover)
SECOES_PROPRIAS = [
    ("atrativos", "Acessibilidade"), ("atrativos", "Serviços e Informações"),
    ("agencias", "Acessibilidade"), ("agencias", "Serviços e Atendimento"),
    ("espacos_eventos", "Acessibilidade"), ("espacos_eventos", "Equipamentos e Serviços"),
    ("organizadores", "Serviços e Atendimento"),
]


def semear(apps, schema_editor):
    Secao = apps.get_model("inventario", "Secao")
    Caracteristica = apps.get_model("inventario", "Caracteristica")

    for escopo, secoes in SEED.items():
        for cfg in secoes:
            secao, _ = Secao.objects.get_or_create(
                escopo=escopo, nome=cfg["nome"],
                defaults={"com_pergunta": cfg["com_pergunta"], "ordem": cfg["ordem"]})

            if cfg.get("ligar_grupos"):
                Caracteristica.objects.filter(
                    escopo=escopo, nome__in=cfg["ligar_grupos"], secao__isnull=True
                ).update(secao=secao)

            for grupo, opcoes in cfg.get("criar", {}).items():
                for op in opcoes:
                    Caracteristica.objects.update_or_create(
                        escopo=escopo, nome=grupo, categoria=op,
                        defaults={"secao": secao, "customizada": False})

            # "ligar_restantes" por último: pega tudo que sobrou sem seção (acessibilidade)
            if cfg.get("ligar_restantes"):
                Caracteristica.objects.filter(
                    escopo=escopo, secao__isnull=True).update(secao=secao)


def remover(apps, schema_editor):
    Secao = apps.get_model("inventario", "Secao")
    Caracteristica = apps.get_model("inventario", "Caracteristica")
    escopos = list(SEED.keys())
    Caracteristica.objects.filter(escopo__in=escopos).update(secao=None)
    for escopo, nome in SECOES_PROPRIAS:
        Secao.objects.filter(escopo=escopo, nome=nome).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("inventario", "0006_vinculotrade_nivel_permissao"),
        ("inventario", "seed_caracteristicas"),
    ]
    operations = [migrations.RunPython(semear, remover)]