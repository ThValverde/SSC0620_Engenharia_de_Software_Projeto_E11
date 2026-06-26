from rest_framework import permissions
from .models import VinculoTrade

class IsSecretariaOrReadOnly(permissions.BasePermission):
    """
    Permite leitura a qualquer usuário autenticado. 
    Escrita restrita a administradores ou membros do grupo 'Secretaria'.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return True
            
        return (request.user.is_superuser or 
                request.user.is_staff or 
                request.user.groups.filter(name='Secretaria').exists())

class IsTradeOwnerOrSecretaria(permissions.BasePermission):
    """
    Garante acesso irrestrito à Secretaria. 
    Usuários do Trade têm acesso apenas aos objetos onde possuem VinculoTrade.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if (request.user.is_superuser or 
            request.user.is_staff or 
            request.user.groups.filter(name='Secretaria').exists()):
            return True
            
        return VinculoTrade.objects.filter(
            usuario=request.user, 
            estabelecimento_id=obj.pk
        ).exists()


def get_trade_vinculo(user, estabelecimento_id):
    """Retorna o vínculo ativo entre o usuário e o estabelecimento especificado."""
    return VinculoTrade.objects.filter(
        usuario=user,
        estabelecimento_id=estabelecimento_id,
    ).select_related('estabelecimento').first()


class IsSuperuserOrSecretariaAdmin(permissions.BasePermission):
    """
    Restringe o acesso exclusivamente a superusuários ou membros do grupo 'Secretaria_Admin'.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        return request.user.is_superuser or request.user.groups.filter(name='Secretaria_Admin').exists()


class IsSuperuserOrSecretariaAny(permissions.BasePermission):
    """
    Restringe o acesso a superusuários e membros dos grupos 'Secretaria_Admin' ou 'Secretaria_Staff'.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return request.user.groups.filter(name__in=['Secretaria_Admin', 'Secretaria_Staff']).exists()


class IsTradeUserOnly(permissions.BasePermission):
    """
    Restringe o acesso a usuários autenticados que NÃO sejam superusuários nem pertençam à Secretaria.
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
