from rest_framework import permissions
from .models import VinculoTrade

class IsSecretariaOrReadOnly(permissions.BasePermission):
    """
    Catálogos: Qualquer usuário logado pode LER (GET) para montar as telas.
    Mas apenas Administradores ou grupo 'Secretaria' podem CRIAR/EDITAR/DELETAR.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Se for método seguro (GET, HEAD, OPTIONS), libera para todos do Trade/Secretaria
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Se for escrita (POST, PUT, DELETE), exige ser staff, superuser ou grupo 'Secretaria'
        return (request.user.is_superuser or 
                request.user.is_staff or 
                request.user.groups.filter(name='Secretaria').exists())

class IsTradeOwnerOrSecretaria(permissions.BasePermission):
    """
    Entidades: Secretaria tem acesso total. 
    Trade só acessa/edita se houver VinculoTrade.
    """
    def has_permission(self, request, view):
        # Bloqueia anônimos logo na porta de entrada
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # 1. Admin ou Secretaria passa direto
        if (request.user.is_superuser or 
            request.user.is_staff or 
            request.user.groups.filter(name='Secretaria').exists()):
            return True
            
        # 2. Usuário do Trade: Verifica se existe a ponte no banco
        # obj.pk representa o ID do estabelecimento atual
        return VinculoTrade.objects.filter(
            usuario=request.user, 
            estabelecimento_id=obj.pk
        ).exists()


def get_trade_vinculo(user, estabelecimento_id):
    return VinculoTrade.objects.filter(
        usuario=user,
        estabelecimento_id=estabelecimento_id,
    ).select_related('estabelecimento').first()


class IsSuperuserOrSecretariaAdmin(permissions.BasePermission):
    """
    Gestão de usuários: apenas superuser Django ou membros do grupo Secretaria_Admin.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        return request.user.is_superuser or request.user.groups.filter(name='Secretaria_Admin').exists()


class IsSuperuserOrSecretariaAny(permissions.BasePermission):
    """
    Trade: superuser, Secretaria_Admin ou Secretaria_Staff.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return request.user.groups.filter(name__in=['Secretaria_Admin', 'Secretaria_Staff']).exists()


class IsTradeUserOnly(permissions.BasePermission):
    """
    Permite apenas usuários Trade autenticados.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return False

        return not (
            request.user.groups.filter(name='Secretaria_Admin').exists()
            or request.user.groups.filter(name='Secretaria_Staff').exists()
        )