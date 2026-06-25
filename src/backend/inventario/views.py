from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, NotFound
from django.contrib.auth.models import User
from .serializers import CadastroUsuarioHierarquicoSerializer, UserAdminSerializer


from django.db.models import Sum, Count, Q
from django.db.models.functions import Coalesce
from django.utils import timezone
from .permissions import IsSecretariaOrReadOnly, IsTradeOwnerOrSecretaria, IsSuperuserOrSecretariaAdmin, IsSuperuserOrSecretariaAny, IsTradeUserOnly, get_trade_vinculo

from .models import (
    Pagamento, Secao, Caracteristica, EscopoCatalogo, CaracteristicaValor, IndicadorODS, RegistroInventario, RegistroODS, Cadastur, MeioHospedagem, MeioAlimentacaoBebida, AtrativoLazerEntretenimento,
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
    CadastroUsuarioSerializer, TradeUserSerializer, TradePortalMeuEstabelecimentoSerializer
)


class EstabelecimentoBaseViewSet(viewsets.ModelViewSet):
    """
    Aplica restrições de acesso baseadas em RBAC.
    Usuários do Trade visualizam e editam apenas os registros aos quais possuem vínculo.
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

    def _is_trade_request(self):
        user = self.request.user
        return (
            user
            and user.is_authenticated
            and not (user.is_superuser or user.is_staff or user.groups.filter(name='Secretaria').exists())
        )

    def _get_trade_vinculo(self, instance):
        return get_trade_vinculo(self.request.user, instance.pk)

    def perform_update(self, serializer):
        instance = serializer.instance
        if self._is_trade_request():
            vinculo = self._get_trade_vinculo(instance)
            if not vinculo:
                raise PermissionDenied('Usuário trade sem vínculo com este estabelecimento.')
            if vinculo.nivel_permissao == 'visualizador':
                raise PermissionDenied('Visualizador não pode alterar dados do estabelecimento.')
            if vinculo.nivel_permissao == 'editor' and 'ativo' in self.request.data:
                raise PermissionDenied('Editor não pode encerrar o estabelecimento.')
        serializer.save()

    def perform_destroy(self, instance):
        if self._is_trade_request():
            vinculo = self._get_trade_vinculo(instance)
            if not vinculo or vinculo.nivel_permissao != 'admin':
                raise PermissionDenied('Somente administrador do trade pode remover o estabelecimento.')
        instance.delete()

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
        Retorna a estrutura do catálogo EAV aninhada em 3 níveis (Seção > Subgrupo > Opção),
        filtrada pelo escopo informado via query param.
        """
        escopo = request.query_params.get('escopo')
        if not escopo:
            return Response(
                {"error": "O parâmetro de consulta 'escopo' é obrigatório. "
                          "Use valores como: meio_hospedagem, atrativos, alimentacao."}, 
                status=400
            )
            
        secoes = Secao.objects.filter(escopo=escopo).order_by('ordem')
        
        estrutura = []
        for secao in secoes:
            caracteristicas_secao = Caracteristica.objects.filter(secao=secao)
            
            subgrupos_dict = {}
            for carac in caracteristicas_secao:
                if carac.nome not in subgrupos_dict:
                    subgrupos_dict[carac.nome] = []
                
                subgrupos_dict[carac.nome].append({
                    "id": carac.id,
                    "categoria": carac.categoria,
                    "customizada": carac.customizada
                })
            
            lista_subgrupos = [
                {"subgrupo_nome": nome_subgrupo, "opcoes": opcoes}
                for nome_subgrupo, opcoes in subgrupos_dict.items()
            ]
            
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
    """
    Gerencia contas administrativas (Secretaria). 
    Filtra e exclui ativamente usuários vinculados ao Trade da listagem.
    """
    queryset = User.objects.all().order_by('username')
    serializer_class = UserAdminSerializer
    permission_classes = [IsSuperuserOrSecretariaAdmin]
    pagination_class = None
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name', 'groups__name']

    def get_queryset(self):
        qs = super().get_queryset()
        trade_user_ids = User.objects.filter(
            vinculos_trade__isnull=False
        ).values_list('id', flat=True).distinct()
        qs = qs.exclude(id__in=trade_user_ids)
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


class TradeUserViewSet(viewsets.ModelViewSet):
    """
    Gerencia contas de parceiros (Trade). 
    Lista exclusivamente usuários que possuem vínculo com algum estabelecimento.
    """
    queryset = User.objects.filter(vinculos_trade__isnull=False).distinct().order_by('username')
    serializer_class = TradeUserSerializer
    permission_classes = [IsSuperuserOrSecretariaAny]
    pagination_class = None
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name', 'vinculos_trade__estabelecimento__nome_fantasia']

    def get_queryset(self):
        return User.objects.filter(vinculos_trade__isnull=False).distinct().order_by('username')


class TradePortalResumoView(APIView):
    """
    Retorna o escopo de estabelecimentos vinculados ao usuário do Trade autenticado.
    """
    permission_classes = [IsTradeUserOnly]

    def get(self, request):
        user = request.user
        vinculos = user.vinculos_trade.select_related('estabelecimento').all()

        def endpoint_for(tipo: str) -> str:
            return {
                'meio_hospedagem': 'hospedagens',
                'meio_alimentacao_bebida': 'alimentacao',
                'atrativo': 'atrativos',
                'espaco_evento': 'espacos-eventos',
                'agencia_turismo': 'agencias',
                'organizador_evento': 'organizadores-eventos',
                'locadora_transporte': 'locadoras-transporte',
                'artesanato': 'artesanato',
                'banco': 'bancos',
                'templo_religioso': 'templos',
                'servico_saude': 'saude',
                'servico_apoio': 'apoio',
            }.get(tipo, '')

        data = []
        for vinculo in vinculos:
            est = vinculo.estabelecimento
            data.append({
                'id': est.id,
                'endpoint': endpoint_for(est.tipo),
                'tipo': est.tipo,
                'nome_fantasia': getattr(est, 'nome_fantasia', '') or '',
                'razao_social': getattr(est, 'razao_social', '') or '',
                'cnpj': getattr(est, 'cnpj', '') or '',
                'ativo': est.ativo,
                'nivel_permissao': vinculo.nivel_permissao,
                'usuario': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            })

        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'estabelecimentos': data,
        })


class TradeMeuEstabelecimentoView(APIView):
    """
    Permite ao usuário do Trade visualizar e editar os dados do seu próprio estabelecimento.
    """
    permission_classes = [IsTradeUserOnly]

    def get_vinculo(self, user):
        vinculo = user.vinculos_trade.select_related('estabelecimento').order_by('id').first()
        if not vinculo:
            raise NotFound('Usuário trade sem estabelecimento vinculado.')
        return vinculo

    def get(self, request):
        vinculo = self.get_vinculo(request.user)
        serializer = TradePortalMeuEstabelecimentoSerializer(
            vinculo.estabelecimento,
            context={'request': request, 'nivel_permissao': vinculo.nivel_permissao},
        )
        return Response(serializer.data)

    def patch(self, request):
        vinculo = self.get_vinculo(request.user)
        serializer = TradePortalMeuEstabelecimentoSerializer(
            vinculo.estabelecimento,
            data=request.data,
            partial=True,
            context={'request': request, 'nivel_permissao': vinculo.nivel_permissao},
        )
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return Response(
            TradePortalMeuEstabelecimentoSerializer(
                updated,
                context={'request': request, 'nivel_permissao': vinculo.nivel_permissao},
            ).data
        )


class CadastrarUsuarioView(APIView):
    """
    Gerencia a criação de usuários aplicando regras estritas de RBAC.
    Exige estabelecimento_id para contas do tipo 'trade'.
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
    Agrega e compila as métricas em tempo real para o painel de indicadores (Dashboard).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_registros = RegistroInventario.objects.count()
        total_estabelecimentos = Estabelecimento.objects.count()
        ativos = RegistroInventario.objects.filter(ativo=True).count()
        inativos = total_registros - ativos

        ultima_atualizacao = timezone.now().strftime("%d/%m/%Y às %H:%M")
        total_cadastur = RegistroInventario.objects.filter(cadastur__isnull=False).count()
        percentual_cadastur = round((total_cadastur / total_registros * 100)) if total_registros > 0 else 0

        mao_de_obra = Estabelecimento.objects.aggregate(
            fixos=Coalesce(Sum('qtde_funcionarios_fixos'), 0),
            temporarios=Coalesce(Sum('qtde_funcionarios_temporarios'), 0),
        )
        total_mao_de_obra = mao_de_obra['fixos'] + mao_de_obra['temporarios']

        meios_hospedagem = MeioHospedagem.objects.all()
        resumo_hospedagem = meios_hospedagem.aggregate(
            total_leitos=Coalesce(Sum('leitos'), 0),
            total_uhs=Coalesce(Sum('uh_total'), 0),
            irregulares=Count('id', filter=Q(cadastur__isnull=True) | Q(ativo=False)),
            sem_capacidade=Count('id', filter=Q(leitos__isnull=True) | Q(uh_total__isnull=True)),
        )
        rhc = RHC.objects.aggregate(
            total=Count('id'),
            total_leitos=Coalesce(Sum('quantidade_leitos'), 0),
            total_uhs=Coalesce(Sum('quantidade'), 0),
        )

        total_uhs = resumo_hospedagem['total_uhs'] + rhc['total_uhs']
        total_leitos = resumo_hospedagem['total_leitos'] + rhc['total_leitos']
        total_geral_uhs = total_uhs
        total_geral_leitos = total_leitos

        # O cálculo de ODS é restrito a Estabelecimentos (empresas), 
        # pois o foco da métrica é o mapeamento da infraestrutura comercial.
        estabelecimentos_count = total_estabelecimentos
        
        ods_payload = []
        palette = ["#1a6fbf", "#16a34a", "#f59e0b", "#8b5cf6", "#0ea5e9", "#ef4444"]
        for index, indicator in enumerate(IndicadorODS.objects.all().order_by('eixo', 'ods', 'id')):
            positive_count = RegistroODS.objects.filter(
                indicador=indicator,
                registro__estabelecimento__isnull=False
            ).count()
            percent = round((positive_count / estabelecimentos_count * 100)) if estabelecimentos_count > 0 else 0
            cor = palette[index % len(palette)]
            ods_payload.append({
                "titulo": f"ODS {indicator.ods}",
                "subtitulo": f"Eixo {indicator.eixo} — {indicator.descricao}",
                "cor": cor,
                "percent": percent,
                "data": [
                    {"name": "Com registro", "value": positive_count, "color": cor},
                    {"name": "Sem registro", "value": max(estabelecimentos_count - positive_count, 0), "color": "#e2e8f0"},
                ],
            })

        dados = {
            "banco": {
                "totalEntidades": total_registros,
                "totalEmpresas": total_estabelecimentos,
                "ultimaAtualizacao": ultima_atualizacao,
            },
            "maoDeObra": {
                "total": total_mao_de_obra,
                "fixos": mao_de_obra['fixos'],
                "temporarios": mao_de_obra['temporarios'],
                "trend": "Dados do banco",
            },
            "cadastur": {
                "totalEmpresas": total_estabelecimentos,
                "totalCadastur": total_cadastur,
                "percentual": percentual_cadastur,
                "trend": "Dados do banco",
            },
            "statusEntidades": {
                "ativos": ativos,
                "inativos": inativos,
            },
            "infra": {
                "meiosHospedagem": meios_hospedagem.count(),
                "imoveisTemporada": rhc['total'],
                "totalLeitos": total_leitos,
                "totalUHs": total_uhs,
                "meiosIrregulares": resumo_hospedagem['irregulares'],
                "uhsIrregulares": resumo_hospedagem['sem_capacidade'],
                "totalGeralUHs": total_geral_uhs,
                "totalGeralLeitos": total_geral_leitos,
                "estimativaLeitosConstrucao": None,
            },
            "ods": ods_payload,
        }

        return Response(dados, status=status.HTTP_200_OK)
