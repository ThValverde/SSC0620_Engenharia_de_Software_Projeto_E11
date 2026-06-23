from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth.models import User
from .serializers import CadastroUsuarioHierarquicoSerializer, UserAdminSerializer


from django.db.models import Sum, Count, Q
from django.db.models.functions import Coalesce
from django.utils import timezone


from .permissions import IsSecretariaOrReadOnly, IsTradeOwnerOrSecretaria, IsSuperuserOrSecretariaAdmin

from .models import (
    Pagamento, Secao, Caracteristica, EscopoCatalogo, CaracteristicaValor, IndicadorODS, MeioHospedagem, MeioAlimentacaoBebida, AtrativoLazerEntretenimento,
    EspacoEvento, AgenciaOperadoraTurismo, OrganizadorServicoEvento,
    LocadoraVeiculoTransporte, Artesanato, Banco, TemploReligioso,
    ServicoSaude, ServicoApoio, GuiaTurismo, RHC, GrupoFolclorico, TaxiAplicativo, Estabelecimento
)
from .serializers import (
    PagamentoSerializer, CaracteristicaSerializer, CaracteristicaValorSerializer,
    ODSSerializer, MeioHospedagemSerializer, MeioAlimentacaoBebidaSerializer,
    AtrativoSerializer, EspacoEventoSerializer, AgenciaOperadoraTurismoSerializer,
    OrganizadorServicoEventoSerializer, LocadoraVeiculoTransporteSerializer,
    ArtesanatoSerializer, BancoSerializer, TemploReligiosoSerializer,
    ServicoSaudeSerializer, ServicoApoioSerializer, GuiaTurismoSerializer,
    RHCSerializer, GrupoFolcloricoSerializer, TaxiAplicativoSerializer,
    CadastroUsuarioSerializer
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

    @action(detail=False, methods=['get'], url_path='arvore')
    def arvore(self, request):
        """
        Retorna a estrutura EAV aninhada em 3 níveis filtrada por escopo.
        Exemplo de uso: /api/inventario/caracteristicas/arvore/?escopo=meio_hospedagem
        """
        escopo = request.query_params.get('escopo')
        if not escopo:
            return Response(
                {"error": "O parâmetro de consulta 'escopo' é obrigatório. "
                          "Use valores como: meio_hospedagem, atrativos, alimentacao."}, 
                status=400
            )
            
        # 1. Filtra as Seções (Nível 1) pertencentes ao escopo
        secoes = Secao.objects.filter(escopo=escopo).order_by('ordem')
        
        estrutura = []
        for secao in secoes:
            # Captura todas as características vinculadas a esta seção específica
            caracteristicas_secao = Caracteristica.objects.filter(secao=secao)
            
            # 2. Agrupa os itens dinamicamente pelo atributo 'nome' (Nível 2 - Subgrupo)
            subgrupos_dict = {}
            for carac in caracteristicas_secao:
                if carac.nome not in subgrupos_dict:
                    subgrupos_dict[carac.nome] = []
                
                # Injeta a opção (Nível 3 - Categoria)
                subgrupos_dict[carac.nome].append({
                    "id": carac.id,
                    "categoria": carac.categoria,
                    "customizada": carac.customizada
                })
            
            # Transforma o dicionário temporário em uma lista estruturada para o JSON
            lista_subgrupos = [
                {"subgrupo_nome": nome_subgrupo, "opcoes": opcoes}
                for nome_subgrupo, opcoes in subgrupos_dict.items()
            ]
            
            # Monta o nó principal da árvore
            estrutura.append({
                "secao_id": secao.id,
                "secao_nome": secao.nome,
                "com_pergunta": secao.com_pergunta,
                "subgrupos": lista_subgrupos
            })
            
        return Response(estrutura)

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


class UserAdminViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserAdminSerializer
    permission_classes = [IsSuperuserOrSecretariaAdmin]
    pagination_class = None
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name', 'groups__name']

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_superuser:
            return qs
        return qs.filter(is_superuser=False)

    def perform_update(self, serializer):
        instance = self.get_object()
        if not self.request.user.is_superuser and instance.is_superuser:
            raise PermissionDenied('Somente o superuser Django pode editar contas superuser.')
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_superuser and instance.is_superuser:
            raise PermissionDenied('Somente o superuser Django pode remover contas superuser.')
        instance.delete()


# =====================================================
# ENDPOINT DE CADASTRO DE USUÁRIOS (RBAC)
# =====================================================

class CadastrarUsuarioView(APIView):
    """
    Endpoint para criação de usuários com controle estrito de RBAC.
    
    POST /api/auth/cadastrar-usuario/
    Payload:
    {
        "email": "usuario@example.com",
        "password": "senhaSegura123",
        "tipo_usuario": "trade|usuario_oto|admin_oto",
        "estabelecimento_id": 1,  # Obrigatório se tipo_usuario == "trade"
        "nivel_permissao": "admin|editor|visualizador"  # Opcional para trade, padrão: visualizador
    }
    
    Response (201):
    {
        "id": 123,
        "email": "usuario@example.com",
        "username": "usuario@example.com",
        "tipo_usuario": "trade"
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CadastroUsuarioSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'tipo_usuario': request.data.get('tipo_usuario'),
                    'mensagem': 'Usuário criado com sucesso.'
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    


class DashboardResumoView(APIView):
    """
    Endpoint para fornecer dados agregados em tempo real para o Dashboard do React.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Agregações Básicas (Banco e Entidades)
        total_entidades = Estabelecimento.objects.count()
        ativos = Estabelecimento.objects.filter(ativo=True).count()
        inativos = total_entidades - ativos

        ultima_atualizacao = timezone.now().strftime("%d/%m/%Y às %H:%M")

        # CADASTUR (Filtra quem tem string de Cadastur preenchida)
        total_cadastur = Estabelecimento.objects.filter(cadastur__isnull=False).count()
        percentual_cadastur = round((total_cadastur / total_entidades * 100)) if total_entidades > 0 else 0

        # Mão de Obra (Soma todas as colunas em 1 única query rápida)
        mao_de_obra = Estabelecimento.objects.aggregate(
            fixos=Coalesce(Sum('qtde_funcionarios_fixos'), 0),
            temporarios=Coalesce(Sum('qtde_funcionarios_temporarios'), 0)
        )
        total_mao_obra = mao_de_obra['fixos'] + mao_de_obra['temporarios']

        # Infraestrutura Básica
        meios_hospedagem = MeioHospedagem.objects.count()
        imoveis_temporada = RHC.objects.count()

        # Montando a resposta no formato exato que a constante DADOS_ATUAIS espera
        dados = {
            "banco": { 
                "totalEntidades": total_entidades, 
                "ultimaAtualizacao": ultima_atualizacao 
            },
            "maoDeObra": { 
                "total": total_mao_obra, 
                "fixos": mao_de_obra['fixos'], 
                "temporarios": mao_de_obra['temporarios'], 
                "trend": "Dados reais" 
            },
            "cadastur": { 
                "totalEmpresas": total_entidades, 
                "totalCadastur": total_cadastur, 
                "percentual": percentual_cadastur, 
                "trend": "Em tempo real" 
            },
            "statusEntidades": { 
                "ativos": ativos, 
                "inativos": inativos 
            },
            "infra": {
                "meiosHospedagem": meios_hospedagem,
                "imoveisTemporada": imoveis_temporada,
                # Retornamos 0 provisoriamente nos campos avançados para não quebrar a tela 
                # (já que eles dependerão de um JOIN futuro com as tabelas de Características)
                "totalLeitos": 0, "totalUHs": 0, "meiosIrregulares": 0, 
                "uhsIrregulares": 0, "totalGeralUHs": 0, "totalGeralLeitos": 0, "estimativaLeiosConstrucao": 0
            },
            # Mantemos o esqueleto ODS zerado mas válido para os gráficos redondos montarem perfeitamente
            "ods": [
                { "titulo": "Eixo Acessibilidade", "subtitulo": "ODS 10 & 11", "cor": "#1a6fbf", "percent": 0, "data": [{ "name": "Com PCD", "value": 0, "color": "#1a6fbf" }, { "name": "Sem PCD", "value": 1, "color": "#e2e8f0" }] },
                { "titulo": "Eixo Sustentabilidade", "subtitulo": "ODS 12 & 13", "cor": "#16a34a", "percent": 0, "data": [{ "name": "Com Selo", "value": 0, "color": "#16a34a" }, { "name": "Sem Selo", "value": 1, "color": "#e2e8f0" }] },
                { "titulo": "Eixo Energia Limpa", "subtitulo": "ODS 7", "cor": "#f59e0b", "percent": 0, "data": [{ "name": "Renováveis", "value": 0, "color": "#f59e0b" }, { "name": "Convencional", "value": 1, "color": "#e2e8f0" }] },
                { "titulo": "Eixo Resíduos", "subtitulo": "ODS 12", "cor": "#8b5cf6", "percent": 0, "data": [{ "name": "Com Plano", "value": 0, "color": "#8b5cf6" }, { "name": "Sem Plano", "value": 1, "color": "#e2e8f0" }] },
            ]
        }

        return Response(dados, status=status.HTTP_200_OK)