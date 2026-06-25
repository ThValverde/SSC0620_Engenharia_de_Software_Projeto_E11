"""
Testes automatizados do app `inventario`.

Rode com:   python manage.py test inventario
Ou um caso: python manage.py test inventario.HerancaTests

Cada classe agrupa um aspecto da modelagem que discutimos. O Django roda
cada teste dentro de uma transação que é desfeita ao final, então os
testes são isolados e não sujam o banco real (usam um banco temporário).
"""

from datetime import date

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate

from .models import (
    AtrativoLazerEntretenimento,
    Cadastur,
    Caracteristica,
    CaracteristicaValor,
    Contato,
    Endereco,
    EstabelecimentoCaracteristica,
    GrupoFolclorico,
    GuiaTurismo,
    IndicadorODS,
    Medicao,
    MeioHospedagem,
    Pagamento,
    RegistroInventario,
    RegistroODS,
    ServicoApoio,
)
from .serializers import (
    GrupoFolcloricoSerializer,
    GuiaTurismoSerializer,
    MeioHospedagemSerializer,
    RHCSerializer,
    TradePortalMeuEstabelecimentoSerializer,
)
from .views import DashboardResumoView


class DiscriminadorTipoTests(TestCase):
    """O campo `tipo` da raiz deve se preencher sozinho a partir da filha."""

    def test_tipo_preenchido_automaticamente(self):
        h = MeioHospedagem.objects.create(nome_fantasia="Hotel A")
        self.assertEqual(h.tipo, RegistroInventario.Tipo.MEIO_HOSPEDAGEM)

    def test_tipos_distintos_por_filha(self):
        h = MeioHospedagem.objects.create(nome_fantasia="Hotel A")
        s = ServicoApoio.objects.create(
            nome_fantasia="Farmácia B",
            tipo_servico=ServicoApoio.TipoServico.FARMACIA,
        )
        self.assertEqual(h.tipo, "meio_hospedagem")
        self.assertEqual(s.tipo, "servico_apoio")


class CadasturDerivadoTests(TestCase):
    """Regra 1.5: 'Sim' se e somente se existir a linha 1:1 em Cadastur."""

    def test_sem_cadastur_e_nao(self):
        h = MeioHospedagem.objects.create(nome_fantasia="Hotel A")
        self.assertFalse(h.possui_cadastur)
        self.assertEqual(h.registro_cadastur, "Não")

    def test_com_cadastur_e_sim(self):
        h = MeioHospedagem.objects.create(nome_fantasia="Hotel A")
        Cadastur.objects.create(registro=h, numero="123")
        h.refresh_from_db()
        self.assertTrue(h.possui_cadastur)
        self.assertEqual(h.registro_cadastur, "Sim")

    def test_um_cadastur_por_registro(self):
        h = MeioHospedagem.objects.create(nome_fantasia="Hotel A")
        Cadastur.objects.create(registro=h, numero="123")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Cadastur.objects.create(registro=h, numero="456")


class CnpjTests(TestCase):
    """Chave substituta + CNPJ UNIQUE NULL."""

    def test_cnpj_invalido_barrado_no_full_clean(self):
        h = MeioHospedagem(nome_fantasia="Hotel A", cnpj="123")
        with self.assertRaises(ValidationError):
            h.full_clean()

    def test_cnpj_valido_passa(self):
        h = MeioHospedagem(nome_fantasia="Hotel A", cnpj="11222333000181")
        h.full_clean()

    def test_cnpj_duplicado_rejeitado(self):
        MeioHospedagem.objects.create(nome_fantasia="Hotel A", cnpj="11222333000181")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                MeioHospedagem.objects.create(nome_fantasia="Clone", cnpj="11222333000181")

    def test_cnpj_nulo_permitido_para_atrativo_publico(self):
        AtrativoLazerEntretenimento.objects.create(nome_fantasia="Praça Pública", cnpj=None)
        AtrativoLazerEntretenimento.objects.create(nome_fantasia="Mirante", cnpj=None)
        self.assertEqual(
            AtrativoLazerEntretenimento.objects.filter(cnpj__isnull=True).count(), 2
        )

    def test_cnpj_invalido_retorna_mensagem_amigavel_no_serializer(self):
        serializer = MeioHospedagemSerializer(data={"nome_fantasia": "Hotel A", "cnpj": "123"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("CNPJ deve conter exatamente 14 dígitos numéricos.", str(serializer.errors["cnpj"]))


class DocumentoIndependenteTests(TestCase):
    """Entidades independentes usam CPF ou documento próprio, não CNPJ."""

    def test_guia_turismo_cpf_tem_mensagem_amigavel(self):
        serializer = GuiaTurismoSerializer(data={"cpf": "123"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("CPF deve conter exatamente 11 dígitos numéricos.", str(serializer.errors["cpf"]))

    def test_rhc_cpf_proprietario_tem_mensagem_amigavel(self):
        serializer = RHCSerializer(data={
            "numeracao_rhc": "RHC-1",
            "tipo_imovel": "casa",
            "cpf_proprietario": "123",
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "CPF do proprietário deve conter exatamente 11 dígitos numéricos.",
            str(serializer.errors["cpf_proprietario"]),
        )

    def test_grupo_folclorico_documento_segue_tipo_documento(self):
        serializer = GrupoFolcloricoSerializer(data={
            "nome": "Grupo X",
            "tipo_documento": "cpf",
            "documento": "123",
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("CPF deve conter exatamente 11 dígitos numéricos.", str(serializer.errors["documento"]))

    def test_grupo_folclorico_accepta_cpf_sem_tipo_documento(self):
        serializer = GrupoFolcloricoSerializer(data={
            "nome": "Grupo X",
            "documento": "12345678901",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["tipo_documento"], "cpf")
        self.assertEqual(serializer.validated_data["documento"], "12345678901")

    def test_grupo_folclorico_accepta_cnpj_sem_tipo_documento(self):
        serializer = GrupoFolcloricoSerializer(data={
            "nome": "Grupo X",
            "documento": "11222333000181",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["tipo_documento"], "cnpj")
        self.assertEqual(serializer.validated_data["documento"], "11222333000181")


class HerancaTests(TestCase):
    """Herança multi-tabela: a raiz enxerga todos; especializacao() desce à folha."""

    def test_raiz_enxerga_todos_os_tipos(self):
        MeioHospedagem.objects.create(nome_fantasia="Hotel A")
        GuiaTurismo.objects.create(cpf="12345678901", nome="Guia X")
        self.assertEqual(RegistroInventario.objects.count(), 2)

    def test_especializacao_retorna_a_folha(self):
        MeioHospedagem.objects.create(nome_fantasia="Hotel A")
        raiz = RegistroInventario.objects.get(tipo="meio_hospedagem")
        folha = raiz.especializacao()
        self.assertIsInstance(folha, MeioHospedagem)

    def test_dados_especificos_acessiveis_pela_folha(self):
        MeioHospedagem.objects.create(nome_fantasia="Hotel A", uh_total=50, leitos=120)
        h = MeioHospedagem.objects.get(nome_fantasia="Hotel A")
        self.assertEqual(h.uh_total, 50)
        self.assertEqual(h.leitos, 120)


class SupertipoRelacionamentosTests(TestCase):
    """O motivo de existir a raiz: Cadastur/ODS/Endereço servem também aos independentes."""

    def test_guia_pode_ter_cadastur(self):
        g = GuiaTurismo.objects.create(cpf="12345678901", nome="Guia X")
        Cadastur.objects.create(registro=g, numero="999")
        g.refresh_from_db()
        self.assertEqual(g.registro_cadastur, "Sim")

    def test_endereco_e_coordenadas_na_raiz(self):
        h = MeioHospedagem.objects.create(nome_fantasia="Hotel A")
        Endereco.objects.create(
            registro=h, cep="17580000", rua="Rua A", numero="10",
            latitude="-20.737000", longitude="-48.914000",
        )
        h.refresh_from_db()
        self.assertIsNotNone(h.coordenadas)
        self.assertEqual(h.coordenadas[0], h.endereco.latitude)

    def test_varios_contatos_por_registro(self):
        h = MeioHospedagem.objects.create(nome_fantasia="Hotel A")
        Contato.objects.create(registro=h, cargo="Recepção", telefone="111")
        Contato.objects.create(registro=h, cargo="Proprietário", telefone="222")
        self.assertEqual(h.contatos.count(), 2)


class EAVEscopoTests(TestCase):
    """O escopo do catálogo impede aplicar característica de um segmento a outro."""

    def setUp(self):
        self.hotel = MeioHospedagem.objects.create(nome_fantasia="Hotel A")
        self.carac_mh = Caracteristica.objects.create(
            escopo="meio_hospedagem", nome="Acessibilidade", categoria="Rampa"
        )
        self.carac_atrativo = Caracteristica.objects.create(
            escopo="atrativos", nome="Acessibilidade", categoria="Rampa"
        )

    def test_caracteristica_do_mesmo_escopo_passa(self):
        ec = EstabelecimentoCaracteristica(
            estabelecimento=self.hotel, caracteristica=self.carac_mh
        )
        ec.full_clean()

    def test_caracteristica_de_outro_escopo_barrada(self):
        ec = EstabelecimentoCaracteristica(
            estabelecimento=self.hotel, caracteristica=self.carac_atrativo
        )
        with self.assertRaises(ValidationError):
            ec.full_clean()

    def test_escopo_evita_colisao_de_nomes_iguais(self):
        self.assertNotEqual(self.carac_mh.pk, self.carac_atrativo.pk)

    def test_medicao_guarda_valor_numerico(self):
        metrica = CaracteristicaValor.objects.create(
            escopo="meio_hospedagem", nome="Capacidade", categoria="Leitos"
        )
        Medicao.objects.create(estabelecimento=self.hotel, metrica=metrica, valor=120)
        self.assertEqual(self.hotel.medicao_set.first().valor, 120)


class ODSTests(TestCase):
    """Indicador qualitativo: existência = Sim. Quantitativo: exige valor."""

    def setUp(self):
        self.hotel = MeioHospedagem.objects.create(nome_fantasia="Hotel A")
        self.quali = IndicadorODS.objects.create(
            eixo=1, ods=3, descricao="Estrutura básica de saúde",
            natureza=IndicadorODS.Natureza.QUALITATIVO,
        )
        self.quant = IndicadorODS.objects.create(
            eixo=1, ods=5, descricao="% mulheres em liderança",
            natureza=IndicadorODS.Natureza.QUANTITATIVO,
        )

    def test_quantitativo_sem_valor_barrado(self):
        r = RegistroODS(registro=self.hotel, indicador=self.quant, valor=None)
        with self.assertRaises(ValidationError):
            r.full_clean()

    def test_qualitativo_com_valor_barrado(self):
        r = RegistroODS(registro=self.hotel, indicador=self.quali, valor=10)
        with self.assertRaises(ValidationError):
            r.full_clean()

    def test_quantitativo_com_valor_passa(self):
        r = RegistroODS(registro=self.hotel, indicador=self.quant, valor=42)
        r.full_clean()


class DashboardResumoTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = get_user_model().objects.create_user(
            username="dashboard-user",
            password="senha-segura",
        )
        self.hotel = MeioHospedagem.objects.create(nome_fantasia="Hotel A")
        self.indicador_quant = IndicadorODS.objects.create(
            eixo=1,
            ods=5,
            descricao="Mulheres em posição de liderança",
            natureza=IndicadorODS.Natureza.QUANTITATIVO,
        )
        self.indicador_quali = IndicadorODS.objects.create(
            eixo=1,
            ods=5,
            descricao="Igualdade de gênero",
            natureza=IndicadorODS.Natureza.QUALITATIVO,
        )
        RegistroODS.objects.create(registro=self.hotel, indicador=self.indicador_quant, valor=42)

    def test_resumo_usa_catalogo_real_de_ods(self):
        request = self.factory.get("/api/inventario/dashboard/resumo/")
        force_authenticate(request, user=self.user)

        response = DashboardResumoView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["ods"]), 2)
        self.assertIn("Mulheres em posição de liderança", response.data["ods"][0]["subtitulo"])
        self.assertIn("Igualdade de gênero", response.data["ods"][1]["subtitulo"])
        self.assertEqual(response.data["ods"][0]["percent"], 100)
        self.assertEqual(response.data["ods"][1]["percent"], 0)
        self.assertIsNone(response.data["infra"]["estimativaLeitosConstrucao"])


class DynamicODSSerializerTests(TestCase):
    def setUp(self):
        self.hotel = MeioHospedagem.objects.create(nome_fantasia="Hotel A")
        self.indicador_quali = IndicadorODS.objects.create(
            eixo=1,
            ods=3,
            descricao="Acesso PCD",
            natureza=IndicadorODS.Natureza.QUALITATIVO,
        )
        self.indicador_quant = IndicadorODS.objects.create(
            eixo=2,
            ods=5,
            descricao="Mulheres em posição de liderança",
            natureza=IndicadorODS.Natureza.QUANTITATIVO,
        )

    def test_serializer_exposes_dynamic_ods_catalog(self):
        data = MeioHospedagemSerializer(self.hotel).data
        self.assertEqual(len(data["sustentabilidade"]), 2)
        self.assertEqual(data["sustentabilidade"][0]["descricao"], "Acesso PCD")
        self.assertFalse(data["sustentabilidade"][0]["ativo"])

    def test_serializer_syncs_dynamic_ods_payload(self):
        serializer = MeioHospedagemSerializer(
            self.hotel,
            data={
                "nome_fantasia": "Hotel A",
                "sustentabilidade": [
                    {"id": self.indicador_quali.id, "ativo": True},
                    {"id": self.indicador_quant.id, "ativo": True, "valor": 75},
                ],
            },
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

        self.assertEqual(self.hotel.indicadores_ods.count(), 2)
        self.assertTrue(self.hotel.indicadores_ods.filter(indicador=self.indicador_quali).exists())
        self.assertEqual(
            self.hotel.indicadores_ods.get(indicador=self.indicador_quant).valor,
            75,
        )

    def test_trade_portal_serializer_exposes_dynamic_ods(self):
        data = TradePortalMeuEstabelecimentoSerializer(self.hotel).data
        self.assertEqual(len(data["sustentabilidade"]), 2)
        self.assertEqual(data["sustentabilidade"][1]["descricao"], "Mulheres em posição de liderança")


class DynamicCatalogSerializerTests(TestCase):
    def setUp(self):
        self.hotel = MeioHospedagem.objects.create(nome_fantasia="Hotel A")
        self.carac_1 = Caracteristica.objects.create(
            escopo="meio_hospedagem",
            nome="Acessibilidade",
            categoria="Rampa",
        )
        self.carac_2 = Caracteristica.objects.create(
            escopo="meio_hospedagem",
            nome="Acessibilidade",
            categoria="Braille",
        )

    def test_serializer_exposes_characteristics_from_db(self):
        data = MeioHospedagemSerializer(self.hotel).data
        self.assertEqual(data["caracteristicas"], [])

    def test_serializer_syncs_characteristics(self):
        serializer = MeioHospedagemSerializer(
            self.hotel,
            data={
                "nome_fantasia": "Hotel A",
                "caracteristicas": [self.carac_1.id, self.carac_2.id],
            },
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        self.assertEqual(
            list(self.hotel.caracteristicas.order_by("id").values_list("id", flat=True)),
            [self.carac_1.id, self.carac_2.id],
        )

    def test_trade_portal_serializer_syncs_characteristics(self):
        serializer = TradePortalMeuEstabelecimentoSerializer(
            self.hotel,
            data={
                "nome_fantasia": "Hotel A",
                "caracteristicas": [self.carac_1.id],
            },
            partial=True,
            context={"nivel_permissao": "editor"},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        self.assertEqual(
            list(self.hotel.caracteristicas.values_list("id", flat=True)),
            [self.carac_1.id],
        )


class GrupoFolcloricoTests(TestCase):
    """tipo_documento + documento substituem o ambíguo CNPJ_OU_CPF."""

    def test_cpf_com_11_digitos_passa(self):
        g = GrupoFolclorico(
            nome="Grupo X", tipo_documento=GrupoFolclorico.TipoDocumento.CPF,
            documento="12345678901",
        )
        g.full_clean()

    def test_cpf_com_tamanho_errado_barrado(self):
        g = GrupoFolclorico(
            nome="Grupo X", tipo_documento=GrupoFolclorico.TipoDocumento.CPF,
            documento="123",
        )
        with self.assertRaises(ValidationError):
            g.full_clean()


class PagamentoTests(TestCase):
    """N:M simples entre Estabelecimento e Pagamento."""

    def test_associa_formas_de_pagamento(self):
        h = MeioHospedagem.objects.create(nome_fantasia="Hotel A")
        pix, _ = Pagamento.objects.get_or_create(tipo=Pagamento.TipoPagamento.PIX)
        din, _ = Pagamento.objects.get_or_create(tipo=Pagamento.TipoPagamento.DINHEIRO)
        h.formas_pagamento.add(pix, din)
        self.assertEqual(h.formas_pagamento.count(), 2)
