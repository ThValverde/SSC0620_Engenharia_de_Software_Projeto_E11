"""
Inventário Turístico — OTO | Django Admin (CRUD do perfil Administrador)

Os inlines de Endereco/Contato/RedeSocial/Cadastur/ODS apontam para
RegistroInventario (a raiz da herança multi-tabela); o Django aceita
inlines cuja FK referencia um ancestral do model registrado.
"""

import re

from django import forms
from django.contrib import admin
from .models import (
    RegistroInventario,
    Estabelecimento,
    MeioHospedagem,
    MeioAlimentacaoBebida,
    AtrativoLazerEntretenimento,
    EspacoEvento,
    AgenciaOperadoraTurismo,
    OrganizadorServicoEvento,
    LocadoraVeiculoTransporte,
    Artesanato,
    Banco,
    TemploReligioso,
    ServicoSaude,
    ServicoApoio,
    GuiaTurismo,
    RHC,
    GrupoFolclorico,
    TaxiAplicativo,
    Endereco,
    Contato,
    RedeSocial,
    Cadastur,
    IndicadorODS,
    RegistroODS,
    EstabelecimentoCaracteristica,
    Caracteristica,
    Medicao,
    CaracteristicaValor,
    EventoProgramado,
    VinculoTrade,
    Pagamento,
    ProdutoServico,
    EscopoCatalogo
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


class ProdutoServicoInline(admin.TabularInline):
    model = ProdutoServico
    extra = 0


# ----------------------------- Bases reutilizáveis --------------------------

class RegistroBaseAdmin(admin.ModelAdmin):
    """Base p/ entidades independentes (Guia, RHC, Grupo, Táxi)."""
    inlines = [EnderecoInline, ContatoInline, RedeSocialInline, RegistroODSInline]
    readonly_fields = ["registro_cadastur", "criado_em", "atualizado_em"]


MAPA_TIPO_ESCOPO = {
    RegistroInventario.Tipo.MEIO_HOSPEDAGEM: EscopoCatalogo.MEIO_HOSPEDAGEM,
    RegistroInventario.Tipo.MEIO_ALIMENTACAO_BEBIDA: EscopoCatalogo.ALIMENTACAO,
    RegistroInventario.Tipo.ATRATIVO: EscopoCatalogo.ATRATIVOS,
    RegistroInventario.Tipo.ESPACO_EVENTO: EscopoCatalogo.ESPACOS_EVENTOS,
    RegistroInventario.Tipo.AGENCIA_TURISMO: EscopoCatalogo.AGENCIAS,
    RegistroInventario.Tipo.ORGANIZADOR_EVENTO: EscopoCatalogo.ORGANIZADORES,
    RegistroInventario.Tipo.ARTESANATO: EscopoCatalogo.ARTESANATO,
}


class EstabelecimentoBaseAdmin(RegistroBaseAdmin):
    """Base para filhas de Estabelecimento com inlines e querysets dinâmicos por escopo."""
    inlines = RegistroBaseAdmin.inlines + [
        CadasturInline,
        ProdutoServicoInline,
    ]
    list_display = ["nome_fantasia", "cnpj", "classificacao", "registro_cadastur"]
    search_fields = ["nome_fantasia", "razao_social", "cnpj"]
    filter_horizontal = ["formas_pagamento"]

    @admin.display(description="Cadastur", boolean=True)
    def registro_cadastur(self, obj):
        return obj.possui_cadastur

    def get_inline_instances(self, request, obj=None):
        """
        Garante o isolamento estrito de catálogo por segmento no painel administrativo.
        """
        inline_instances = super().get_inline_instances(request, obj)
        
        tipo_registro = getattr(self.model, 'TIPO_REGISTRO', None)
        escopo_alvo = MAPA_TIPO_ESCOPO.get(tipo_registro)
        
        if escopo_alvo:
            class ScopedCaracteristicaInline(admin.TabularInline):
                model = EstabelecimentoCaracteristica
                extra = 1  
                verbose_name = "Característica"
                verbose_name_plural = "Filtro de Características e Acessibilidade"
                
                def formfield_for_foreignkey(self, db_field, request, **kwargs):
                    if db_field.name == "caracteristica":
                        kwargs["queryset"] = Caracteristica.objects.filter(
                            escopo=escopo_alvo
                        ).order_by('secao__nome', 'nome', 'categoria')
                    return super().formfield_for_foreignkey(db_field, request, **kwargs)

            class ScopedMedicaoInline(admin.TabularInline):
                model = Medicao
                extra = 1
                verbose_name = "Métrica"
                verbose_name_plural = "Filtro de Métricas Numéricas (Capacidades)"
                
                def formfield_for_foreignkey(self, db_field, request, **kwargs):
                    if db_field.name == "metrica":
                        kwargs["queryset"] = CaracteristicaValor.objects.filter(
                            escopo=escopo_alvo
                        ).order_by('nome', 'categoria')
                    return super().formfield_for_foreignkey(db_field, request, **kwargs)

            inline_instances.append(ScopedCaracteristicaInline(self.model, self.admin_site))
            inline_instances.append(ScopedMedicaoInline(self.model, self.admin_site))
            
        return inline_instances


# ----------------------------- Filhas de Estabelecimento --------------------

@admin.register(Estabelecimento)
class EstabelecimentoAdmin(admin.ModelAdmin):
    list_display = ["nome_fantasia", "cnpj", "tipo", "classificacao"]
    list_filter = ["tipo"]
    search_fields = ["nome_fantasia", "razao_social", "cnpj"]

    def has_add_permission(self, request):
        return False  # Criar sempre pela especialização (filhas)


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
    class GrupoFolcloricoForm(forms.ModelForm):
        class Meta:
            model = GrupoFolclorico
            fields = "__all__"

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.fields["documento"].label = "CPF/CNPJ"
            self.fields["documento"].help_text = "Informe CPF (11 dígitos) ou CNPJ (14 dígitos). O tipo será definido automaticamente."
            self.fields["documento"].widget.attrs.update({"placeholder": "CPF ou CNPJ", "maxlength": 18})
            self.fields["tipo_documento"].required = False
            self.fields["tipo_documento"].help_text = "Opcional: será preenchido automaticamente a partir do número informado."

        def clean(self):
            cleaned = super().clean()
            documento = re.sub(r"\D", "", cleaned.get("documento", "") or "")
            tipo_documento = (cleaned.get("tipo_documento") or "").strip().lower()

            if len(documento) not in (11, 14):
                self.add_error("documento", "CPF/CNPJ deve conter 11 ou 14 dígitos numéricos.")
                return cleaned

            if not tipo_documento:
                cleaned["tipo_documento"] = "cpf" if len(documento) == 11 else "cnpj"
            elif tipo_documento not in ("cpf", "cnpj"):
                self.add_error("tipo_documento", "Use CPF ou CNPJ.")
            elif (tipo_documento == "cpf" and len(documento) != 11) or (tipo_documento == "cnpj" and len(documento) != 14):
                esperado = 11 if tipo_documento == "cpf" else 14
                self.add_error("documento", f"{tipo_documento.upper()} deve conter exatamente {esperado} dígitos numéricos.")

            cleaned["documento"] = documento
            return cleaned

    form = GrupoFolcloricoForm
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
    fields = ["secao", "nome", "categoria", "escopo", "customizada"]

    


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