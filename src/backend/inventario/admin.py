"""
Inventário Turístico — OTO | Django Admin (CRUD do perfil Administrador)

Os inlines de Endereco/Contato/RedeSocial/Cadastur/ODS apontam para
RegistroInventario (a raiz da herança multi-tabela); o Django aceita
inlines cuja FK referencia um ancestral do model registrado.
"""

from django.contrib import admin

from .models import (
    Estabelecimento,
    AgenciaOperadoraTurismo,
    Artesanato,
    AtrativoLazerEntretenimento,
    Banco,
    Cadastur,
    Caracteristica,
    CaracteristicaValor,
    Contato,
    Endereco,
    EspacoEvento,
    EstabelecimentoCaracteristica,
    EventoProgramado,
    GrupoFolclorico,
    GuiaTurismo,
    IndicadorODS,
    LocadoraVeiculoTransporte,
    Medicao,
    MeioAlimentacaoBebida,
    MeioHospedagem,
    OrganizadorServicoEvento,
    Pagamento,
    ProdutoServico,
    RedeSocial,
    RegistroODS,
    RHC,
    ServicoApoio,
    ServicoSaude,
    TaxiAplicativo,
    TemploReligioso,
    VinculoTrade,
)

# ----------------------------- Inlines de suporte ---------------------------


class EnderecoInline(admin.StackedInline):
    model = Endereco
    extra = 0
    max_num = 1


class ContatoInline(admin.TabularInline):
    model = Contato
    extra = 0


class RedeSocialInline(admin.TabularInline):
    model = RedeSocial
    extra = 0


class CadasturInline(admin.StackedInline):
    model = Cadastur
    extra = 0
    max_num = 1


class RegistroODSInline(admin.TabularInline):
    model = RegistroODS
    extra = 0
    autocomplete_fields = ["indicador"]


class CaracteristicaInline(admin.TabularInline):
    model = EstabelecimentoCaracteristica
    extra = 0
    autocomplete_fields = ["caracteristica"]


class MedicaoInline(admin.TabularInline):
    model = Medicao
    extra = 0
    autocomplete_fields = ["metrica"]


class ProdutoServicoInline(admin.TabularInline):
    model = ProdutoServico
    extra = 0


# ----------------------------- Bases reutilizáveis --------------------------


class RegistroBaseAdmin(admin.ModelAdmin):
    """Base p/ entidades independentes (Guia, RHC, Grupo, Táxi)."""

    inlines = [EnderecoInline, ContatoInline, RedeSocialInline, RegistroODSInline]
    readonly_fields = ["registro_cadastur", "criado_em", "atualizado_em"]


class EstabelecimentoBaseAdmin(RegistroBaseAdmin):
    """Base p/ todas as filhas de Estabelecimento."""

    inlines = RegistroBaseAdmin.inlines + [
        CadasturInline,
        CaracteristicaInline,
        MedicaoInline,
        ProdutoServicoInline,
    ]
    list_display = ["nome_fantasia", "cnpj", "classificacao", "registro_cadastur"]
    search_fields = ["nome_fantasia", "razao_social", "cnpj"]
    filter_horizontal = ["formas_pagamento"]

    @admin.display(description="Cadastur", boolean=True)
    def registro_cadastur(self, obj):
        return obj.possui_cadastur


# ----------------------------- Filhas de Estabelecimento --------------------


@admin.register(Estabelecimento)
class EstabelecimentoAdmin(admin.ModelAdmin):
    """Listagem unificada (todas as filhas aparecem aqui via herança).
    Cadastro deve ser feito pela filha específica."""

    list_display = ["nome_fantasia", "cnpj", "tipo", "classificacao"]
    list_filter = ["tipo"]
    search_fields = ["nome_fantasia", "razao_social", "cnpj"]

    def has_add_permission(self, request):
        return False  # criar sempre pela especialização


@admin.register(MeioHospedagem)
class MeioHospedagemAdmin(EstabelecimentoBaseAdmin):
    list_display = EstabelecimentoBaseAdmin.list_display + ["uh_total", "leitos"]
    list_filter = ["aceita_pesquisas", "funcionamento_24h"]


@admin.register(MeioAlimentacaoBebida)
class MeioAlimentacaoBebidaAdmin(EstabelecimentoBaseAdmin):
    list_filter = ["parque", "estacionamento"]


@admin.register(AtrativoLazerEntretenimento)
class AtrativoAdmin(EstabelecimentoBaseAdmin):
    list_filter = ["local", "tipo_atrativo", "destaque"]


@admin.register(ServicoApoio)
class ServicoApoioAdmin(EstabelecimentoBaseAdmin):
    list_display = EstabelecimentoBaseAdmin.list_display + ["tipo_servico"]
    list_filter = ["tipo_servico"]


for _modelo in (
    EspacoEvento,
    AgenciaOperadoraTurismo,
    OrganizadorServicoEvento,
    LocadoraVeiculoTransporte,
    Artesanato,
    Banco,
    TemploReligioso,
    ServicoSaude,
):
    admin.site.register(_modelo, EstabelecimentoBaseAdmin)


# ----------------------------- Entidades independentes ----------------------


@admin.register(GuiaTurismo)
class GuiaTurismoAdmin(RegistroBaseAdmin):
    inlines = RegistroBaseAdmin.inlines + [CadasturInline]
    list_display = ["nome", "cpf", "categoria", "classificacao"]
    search_fields = ["nome", "cpf"]


@admin.register(RHC)
class RHCAdmin(RegistroBaseAdmin):
    list_display = ["numeracao_rhc", "denominacao_comercial", "tipo_imovel", "quantidade_leitos"]
    search_fields = ["numeracao_rhc", "denominacao_comercial", "nome_proprietario"]
    list_filter = ["tipo_imovel"]


@admin.register(GrupoFolclorico)
class GrupoFolcloricoAdmin(RegistroBaseAdmin):
    list_display = ["nome", "tipo_documento", "documento"]
    search_fields = ["nome", "documento"]


@admin.register(TaxiAplicativo)
class TaxiAplicativoAdmin(RegistroBaseAdmin):
    list_display = ["nome", "empresa", "placa", "ano_habilitacao"]
    search_fields = ["nome", "empresa", "placa"]


# ----------------------------- Catálogos e demais ---------------------------


@admin.register(Caracteristica)
class CaracteristicaAdmin(admin.ModelAdmin):
    list_display = ["escopo", "nome", "categoria", "customizada"]
    list_filter = ["escopo", "customizada"]
    search_fields = ["nome", "categoria"]


@admin.register(CaracteristicaValor)
class CaracteristicaValorAdmin(admin.ModelAdmin):
    list_display = ["escopo", "nome", "categoria"]
    list_filter = ["escopo"]
    search_fields = ["nome", "categoria"]


@admin.register(IndicadorODS)
class IndicadorODSAdmin(admin.ModelAdmin):
    list_display = ["eixo", "ods", "descricao", "natureza"]
    list_filter = ["eixo", "natureza"]
    search_fields = ["descricao"]


@admin.register(EventoProgramado)
class EventoProgramadoAdmin(admin.ModelAdmin):
    list_display = ["nome", "data_realizacao", "espaco"]
    autocomplete_fields = ["espaco"]
    search_fields = ["nome"]


@admin.register(VinculoTrade)
class VinculoTradeAdmin(admin.ModelAdmin):
    list_display = ["usuario", "estabelecimento"]
    autocomplete_fields = ["usuario", "estabelecimento"]


admin.site.register(Pagamento)