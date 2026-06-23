from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import CadastrarUsuarioView, DashboardResumoView, TradePortalResumoView, TradeMeuEstabelecimentoView

router = DefaultRouter()

# 1. Catálogos e Listas de Apoio
router.register(r'pagamentos', views.PagamentoViewSet)
router.register(r'caracteristicas', views.CaracteristicaViewSet)
router.register(r'metricas', views.CaracteristicaValorViewSet)
router.register(r'ods', views.ODSViewSet)

# 2. Segmentos Principais (Filhas)
router.register(r'hospedagens', views.MeioHospedagemViewSet)
router.register(r'alimentacao', views.MeioAlimentacaoBebidaViewSet)
router.register(r'atrativos', views.AtrativoViewSet)
router.register(r'espacos-eventos', views.EspacoEventoViewSet)
router.register(r'agencias', views.AgenciaOperadoraTurismoViewSet)
router.register(r'organizadores-eventos', views.OrganizadorServicoEventoViewSet)
router.register(r'locadoras-transporte', views.LocadoraVeiculoTransporteViewSet)
router.register(r'artesanato', views.ArtesanatoViewSet)
router.register(r'bancos', views.BancoViewSet)
router.register(r'templos', views.TemploReligiosoViewSet)
router.register(r'saude', views.ServicoSaudeViewSet)
router.register(r'apoio', views.ServicoApoioViewSet)

# 3. Entidades Independentes
router.register(r'guias', views.GuiaTurismoViewSet)
router.register(r'rhc', views.RHCViewSet)
router.register(r'grupos-folcloricos', views.GrupoFolcloricoViewSet)
router.register(r'taxis', views.TaxiAplicativoViewSet)
router.register(r'trade-users', views.TradeUserViewSet)

urlpatterns = [
    path('dashboard/resumo/', DashboardResumoView.as_view(), name='dashboard-resumo'),
    path('trade/portal/', TradePortalResumoView.as_view(), name='trade-portal-resumo'),
    path('meu-estabelecimento/', TradeMeuEstabelecimentoView.as_view(), name='trade-meu-estabelecimento'),
    
    path('auth/cadastrar-usuario/', CadastrarUsuarioView.as_view(), name='cadastrar-usuario'),
    path('', include(router.urls)),
]