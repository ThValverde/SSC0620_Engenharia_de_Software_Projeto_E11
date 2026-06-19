from rest_framework import viewsets
from .models import (
    Pagamento,
    Caracteristica,
    CaracteristicaValor,
    IndicadorODS,
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
    TaxiAplicativo
)
from .serializers import (
    PagamentoSerializer,
    CaracteristicaSerializer,
    CaracteristicaValorSerializer,
    ODSSerializer,
    MeioHospedagemSerializer,
    MeioAlimentacaoBebidaSerializer,
    AtrativoSerializer,
    EspacoEventoSerializer,
    AgenciaOperadoraTurismoSerializer,
    OrganizadorServicoEventoSerializer,
    LocadoraVeiculoTransporteSerializer,
    ArtesanatoSerializer,
    BancoSerializer,
    TemploReligiosoSerializer,
    ServicoSaudeSerializer,
    ServicoApoioSerializer,
    GuiaTurismoSerializer,
    RHCSerializer,
    GrupoFolcloricoSerializer,
    TaxiAplicativoSerializer
)


# 1. VIEWS DE CATÁLOGO (Listas de Apoio)==========================

class PagamentoViewSet(viewsets.ModelViewSet):
    queryset = Pagamento.objects.all()
    serializer_class = PagamentoSerializer

class CaracteristicaViewSet(viewsets.ModelViewSet):
    queryset = Caracteristica.objects.all()
    serializer_class = CaracteristicaSerializer

class CaracteristicaValorViewSet(viewsets.ModelViewSet):
    queryset = CaracteristicaValor.objects.all()
    serializer_class = CaracteristicaValorSerializer

class ODSViewSet(viewsets.ModelViewSet):
    queryset = IndicadorODS.objects.all()
    serializer_class = ODSSerializer


# 2. VIEWS DAS ENTIDADES PRINCIPAIS (Segmentos)=========================

class MeioHospedagemViewSet(viewsets.ModelViewSet):
    queryset = MeioHospedagem.objects.all()
    serializer_class = MeioHospedagemSerializer

class MeioAlimentacaoBebidaViewSet(viewsets.ModelViewSet):
    queryset = MeioAlimentacaoBebida.objects.all()
    serializer_class = MeioAlimentacaoBebidaSerializer

class AtrativoViewSet(viewsets.ModelViewSet):
    queryset = AtrativoLazerEntretenimento.objects.all()
    serializer_class = AtrativoSerializer

class EspacoEventoViewSet(viewsets.ModelViewSet):
    queryset = EspacoEvento.objects.all()
    serializer_class = EspacoEventoSerializer

class AgenciaOperadoraTurismoViewSet(viewsets.ModelViewSet):
    queryset = AgenciaOperadoraTurismo.objects.all()
    serializer_class = AgenciaOperadoraTurismoSerializer

class OrganizadorServicoEventoViewSet(viewsets.ModelViewSet):
    queryset = OrganizadorServicoEvento.objects.all()
    serializer_class = OrganizadorServicoEventoSerializer

class LocadoraVeiculoTransporteViewSet(viewsets.ModelViewSet):
    queryset = LocadoraVeiculoTransporte.objects.all()
    serializer_class = LocadoraVeiculoTransporteSerializer

class ArtesanatoViewSet(viewsets.ModelViewSet):
    queryset = Artesanato.objects.all()
    serializer_class = ArtesanatoSerializer

class BancoViewSet(viewsets.ModelViewSet):
    queryset = Banco.objects.all()
    serializer_class = BancoSerializer

class TemploReligiosoViewSet(viewsets.ModelViewSet):
    queryset = TemploReligioso.objects.all()
    serializer_class = TemploReligiosoSerializer

class ServicoSaudeViewSet(viewsets.ModelViewSet):
    queryset = ServicoSaude.objects.all()
    serializer_class = ServicoSaudeSerializer

class ServicoApoioViewSet(viewsets.ModelViewSet):
    queryset = ServicoApoio.objects.all()
    serializer_class = ServicoApoioSerializer

# 3. VIEWS DAS ENTIDADES INDEPENDENTES============================

class GuiaTurismoViewSet(viewsets.ModelViewSet):
    queryset = GuiaTurismo.objects.all()
    serializer_class = GuiaTurismoSerializer

class RHCViewSet(viewsets.ModelViewSet):
    queryset = RHC.objects.all()
    serializer_class = RHCSerializer

class GrupoFolcloricoViewSet(viewsets.ModelViewSet):
    queryset = GrupoFolclorico.objects.all()
    serializer_class = GrupoFolcloricoSerializer

class TaxiAplicativoViewSet(viewsets.ModelViewSet):
    queryset = TaxiAplicativo.objects.all()
    serializer_class = TaxiAplicativoSerializer