from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .permissions import IsSecretariaOrReadOnly, IsTradeOwnerOrSecretaria

from .models import (
    Pagamento, Caracteristica, CaracteristicaValor, IndicadorODS,
    MeioHospedagem, MeioAlimentacaoBebida, AtrativoLazerEntretenimento,
    EspacoEvento, AgenciaOperadoraTurismo, OrganizadorServicoEvento,
    LocadoraVeiculoTransporte, Artesanato, Banco, TemploReligioso,
    ServicoSaude, ServicoApoio, GuiaTurismo, RHC, GrupoFolclorico, TaxiAplicativo
)
from .serializers import (
    PagamentoSerializer, CaracteristicaSerializer, CaracteristicaValorSerializer,
    ODSSerializer, MeioHospedagemSerializer, MeioAlimentacaoBebidaSerializer,
    AtrativoSerializer, EspacoEventoSerializer, AgenciaOperadoraTurismoSerializer,
    OrganizadorServicoEventoSerializer, LocadoraVeiculoTransporteSerializer,
    ArtesanatoSerializer, BancoSerializer, TemploReligiosoSerializer,
    ServicoSaudeSerializer, ServicoApoioSerializer, GuiaTurismoSerializer,
    RHCSerializer, GrupoFolcloricoSerializer, TaxiAplicativoSerializer
)


# CLASSES BASE DE SEGURANÇA (DRY)===================

class EstabelecimentoBaseViewSet(viewsets.ModelViewSet):
    """
    Aplica a segurança para todas as empresas do trade.
    - Protege a edição (permissions_classes)
    - Filtra a listagem (get_queryset) para o Trade só ver seus próprios negócios.
    """
    permission_classes = [IsTradeOwnerOrSecretaria]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        if not user.is_authenticated:
            return qs.none()
            
        if user.is_superuser or user.is_staff or user.groups.filter(name='Secretaria').exists():
            return qs
            
        return qs.filter(responsaveis__usuario=user)


# 1. VIEWS DE CATÁLOGO (Listas de Apoio)
# trade pode apenas LER. Secretaria pode EDITAR.

class PagamentoViewSet(viewsets.ModelViewSet):
    queryset = Pagamento.objects.all()
    serializer_class = PagamentoSerializer
    permission_classes = [IsSecretariaOrReadOnly]

class CaracteristicaViewSet(viewsets.ModelViewSet):
    queryset = Caracteristica.objects.all()
    serializer_class = CaracteristicaSerializer
    permission_classes = [IsSecretariaOrReadOnly]

class CaracteristicaValorViewSet(viewsets.ModelViewSet):
    queryset = CaracteristicaValor.objects.all()
    serializer_class = CaracteristicaValorSerializer
    permission_classes = [IsSecretariaOrReadOnly]

class ODSViewSet(viewsets.ModelViewSet):
    queryset = IndicadorODS.objects.all()
    serializer_class = ODSSerializer
    permission_classes = [IsSecretariaOrReadOnly]

# VIEWS DAS ENTIDADES PRINCIPAIS =======================

class MeioHospedagemViewSet(EstabelecimentoBaseViewSet):
    queryset = MeioHospedagem.objects.all()
    serializer_class = MeioHospedagemSerializer

class MeioAlimentacaoBebidaViewSet(EstabelecimentoBaseViewSet):
    queryset = MeioAlimentacaoBebida.objects.all()
    serializer_class = MeioAlimentacaoBebidaSerializer

class AtrativoViewSet(EstabelecimentoBaseViewSet):
    queryset = AtrativoLazerEntretenimento.objects.all()
    serializer_class = AtrativoSerializer

class EspacoEventoViewSet(EstabelecimentoBaseViewSet):
    queryset = EspacoEvento.objects.all()
    serializer_class = EspacoEventoSerializer

class AgenciaOperadoraTurismoViewSet(EstabelecimentoBaseViewSet):
    queryset = AgenciaOperadoraTurismo.objects.all()
    serializer_class = AgenciaOperadoraTurismoSerializer

class OrganizadorServicoEventoViewSet(EstabelecimentoBaseViewSet):
    queryset = OrganizadorServicoEvento.objects.all()
    serializer_class = OrganizadorServicoEventoSerializer

class LocadoraVeiculoTransporteViewSet(EstabelecimentoBaseViewSet):
    queryset = LocadoraVeiculoTransporte.objects.all()
    serializer_class = LocadoraVeiculoTransporteSerializer

class ArtesanatoViewSet(EstabelecimentoBaseViewSet):
    queryset = Artesanato.objects.all()
    serializer_class = ArtesanatoSerializer

class BancoViewSet(EstabelecimentoBaseViewSet):
    queryset = Banco.objects.all()
    serializer_class = BancoSerializer

class TemploReligiosoViewSet(EstabelecimentoBaseViewSet):
    queryset = TemploReligioso.objects.all()
    serializer_class = TemploReligiosoSerializer

class ServicoSaudeViewSet(EstabelecimentoBaseViewSet):
    queryset = ServicoSaude.objects.all()
    serializer_class = ServicoSaudeSerializer

class ServicoApoioViewSet(EstabelecimentoBaseViewSet):
    queryset = ServicoApoio.objects.all()
    serializer_class = ServicoApoioSerializer


# VIEWS DAS ENTIDADES INDEPENDENTES ===================
# não possuem VinculoTrade

class GuiaTurismoViewSet(viewsets.ModelViewSet):
    queryset = GuiaTurismo.objects.all()
    serializer_class = GuiaTurismoSerializer
    permission_classes = [IsSecretariaOrReadOnly]

class RHCViewSet(viewsets.ModelViewSet):
    queryset = RHC.objects.all()
    serializer_class = RHCSerializer
    permission_classes = [IsSecretariaOrReadOnly]

class GrupoFolcloricoViewSet(viewsets.ModelViewSet):
    queryset = GrupoFolclorico.objects.all()
    serializer_class = GrupoFolcloricoSerializer
    permission_classes = [IsSecretariaOrReadOnly]

class TaxiAplicativoViewSet(viewsets.ModelViewSet):
    queryset = TaxiAplicativo.objects.all()
    serializer_class = TaxiAplicativoSerializer
    permission_classes = [IsSecretariaOrReadOnly]