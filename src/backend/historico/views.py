from rest_framework import viewsets, filters
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Pasta, TagSegmento, Relatorio, ArquivoAnexo
from .serializers import (
    PastaSerializer, TagSegmentoSerializer, 
    RelatorioSerializer, ArquivoAnexoSerializer, HistoricoImportacaoSerializer
)

class BaseSecretariaViewSet(viewsets.ModelViewSet):
    """
    Garante que apenas usuários autenticados acessem as rotas herdadas.
    Pendente de integração com a permissão IsSecretaria para restringir 
    o acesso exclusivamente à Secretaria Municipal.
    """
    permission_classes = [IsAuthenticated]

class PastaViewSet(BaseSecretariaViewSet):
    """
    Gerencia as ações da interface para as Pastas (listar, criar, editar e excluir).
    """
    queryset = Pasta.objects.all()
    serializer_class = PastaSerializer

class TagSegmentoViewSet(BaseSecretariaViewSet):
    """
    Gerencia as ações da interface para as Tags de Segmento.
    """
    queryset = TagSegmento.objects.all()
    serializer_class = TagSegmentoSerializer

class RelatorioViewSet(BaseSecretariaViewSet):
    """
    Gerencia as ações da interface para os Relatórios.
    Habilita ferramentas para o frontend filtrar os relatórios (por pasta ou tag),
    fazer buscas de texto (pelo título) e ordenar os resultados.
    """
    queryset = Relatorio.objects.all()
    serializer_class = RelatorioSerializer
    

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    filterset_fields = ['pasta', 'tags']
    

    search_fields = ['titulo']
    

    ordering_fields = ['criado_em', 'atualizado_em', 'titulo']

class ArquivoAnexoViewSet(BaseSecretariaViewSet):
    """
    Gerencia os arquivos físicos atrelados aos relatórios.
    Configurado especificamente para aceitar uploads de arquivos via formulário (MultiPart).
    """
    queryset = ArquivoAnexo.objects.all()
    serializer_class = ArquivoAnexoSerializer

    parser_classes = [MultiPartParser, FormParser, JSONParser]


class HistoricoImportacaoViewSet(BaseSecretariaViewSet):
    """
    Gerencia a listagem e o envio de arquivos para importação.
    Ao criar um novo registro, atrela automaticamente o usuário logado como autor.
    """
    queryset = Relatorio.objects.none()
    serializer_class = HistoricoImportacaoSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nome", "fonte", "autor__email", "autor__username"]
    ordering_fields = ["criado_em", "nome", "fonte", "status"]

    def get_queryset(self):
        from .models import HistoricoImportacao
        return HistoricoImportacao.objects.select_related("autor").all()

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)
