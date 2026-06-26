"""Reparo de mapeamento de seções do catálogo para escopos já semeados.

Contexto:
- Em ambientes onde 0004/0005 já rodaram, editar essas migrations não
  reaplica o vínculo secao das características.
- Esta migration força o mapeamento esperado para que a árvore do frontend
  reflita exatamente a configuração de seções (com_pergunta + grupos).
"""

from django.db import migrations


MH_ESCOPO = "meio_hospedagem"
MH_ACESS_NOME = "Acessibilidade"
MH_SERV_NOME = "Serviços e Equipamentos"
MH_SERV_GRUPOS = [
    "Geral",
    "Atendimento em língua estrangeira",
    "UH",
    "Recepção",
    "A & B",
    "Área de Eventos",
    "Área de Recreação",
]

ALIM_ESCOPO = "alimentacao"
ALIM_ACESS_NOME = "Acessibilidade"
ALIM_SERV_NOME = "Dados de Funcionamento"
ALIM_SERV_GRUPOS = ["Dados Funcionamento"]


def _aplicar_mapeamento(apps, escopo, nome_acess, nome_serv, grupos_serv):
    Secao = apps.get_model("inventario", "Secao")
    Caracteristica = apps.get_model("inventario", "Caracteristica")

    secao_acess, _ = Secao.objects.get_or_create(
        escopo=escopo,
        nome=nome_acess,
        defaults={"com_pergunta": True, "ordem": 1},
    )
    secao_serv, _ = Secao.objects.get_or_create(
        escopo=escopo,
        nome=nome_serv,
        defaults={"com_pergunta": False, "ordem": 2},
    )

    # Grupos operacionais/comodidades sempre na seção sem pergunta.
    Caracteristica.objects.filter(
        escopo=escopo,
        nome__in=grupos_serv,
    ).update(secao=secao_serv)

    # Demais grupos do escopo ficam em Acessibilidade.
    Caracteristica.objects.filter(escopo=escopo).exclude(nome__in=grupos_serv).update(secao=secao_acess)


def semear(apps, schema_editor):
    _aplicar_mapeamento(apps, MH_ESCOPO, MH_ACESS_NOME, MH_SERV_NOME, MH_SERV_GRUPOS)
    _aplicar_mapeamento(apps, ALIM_ESCOPO, ALIM_ACESS_NOME, ALIM_SERV_NOME, ALIM_SERV_GRUPOS)


def remover(apps, schema_editor):
    Caracteristica = apps.get_model("inventario", "Caracteristica")

    Caracteristica.objects.filter(escopo=MH_ESCOPO).update(secao=None)
    Caracteristica.objects.filter(escopo=ALIM_ESCOPO).update(secao=None)


class Migration(migrations.Migration):
    dependencies = [
        ("inventario", "0007 seed secoes restantes"),
    ]

    operations = [migrations.RunPython(semear, remover)]
