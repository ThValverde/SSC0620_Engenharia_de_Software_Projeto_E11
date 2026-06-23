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
    Trava de segurança: Exige usuário logado.
    Como combinamos, o ideal aqui é o frontend só liberar esta tela para a 
    Secretaria Municipal. (Você pode plugar aquela sua classe IsSecretaria depois).
    """
    permission_classes = [IsAuthenticated]

class PastaViewSet(BaseSecretariaViewSet):
    queryset = Pasta.objects.all()
    serializer_class = PastaSerializer

class TagSegmentoViewSet(BaseSecretariaViewSet):
    queryset = TagSegmento.objects.all()
    serializer_class = TagSegmentoSerializer

class RelatorioViewSet(BaseSecretariaViewSet):
    queryset = Relatorio.objects.all()
    serializer_class = RelatorioSerializer
    

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    filterset_fields = ['pasta', 'tags']
    

    search_fields = ['titulo']
    

    ordering_fields = ['criado_em', 'atualizado_em', 'titulo']

class ArquivoAnexoViewSet(BaseSecretariaViewSet):
    queryset = ArquivoAnexo.objects.all()
    serializer_class = ArquivoAnexoSerializer

    parser_classes = [MultiPartParser, FormParser, JSONParser]


class HistoricoImportacaoViewSet(BaseSecretariaViewSet):
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