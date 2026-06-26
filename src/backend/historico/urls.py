"""
Configuração de rotas (URLs) para os endpoints de histórico e relatórios.
O DefaultRouter gera automaticamente os caminhos da API com base nas ViewSets.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

router.register(r'pastas', views.PastaViewSet)
router.register(r'tags', views.TagSegmentoViewSet)
router.register(r'relatorios', views.RelatorioViewSet)
router.register(r'arquivos', views.ArquivoAnexoViewSet)
router.register(r'importacoes', views.HistoricoImportacaoViewSet, basename='historico-importacoes')

urlpatterns = [
    path('', include(router.urls)),
]
