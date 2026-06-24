# Solução Definitiva: Erro 400 no Endpoint de Login

## Problema
Usuários staff/admin recebiam erro `HTTP 400 Bad Request` ao tentar fazer login com credenciais válidas, apesar do cadastro estar correto.

## Causa Raiz
Dois problemas em cascata no backend:

### 1. Configuração REST_AUTH Duplicada (Commit: 4d4c57c)
```python
# ❌ ANTES: Configuração aparecia DUAS VEZES em settings.py
REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_COOKIE': 'jwt-auth',
    'JWT_AUTH_REFRESH_COOKIE': 'jwt-refresh',
    'JWT_AUTH_HTTPONLY': False,
    'USER_DETAILS_SERIALIZER': 'inventario.serializers.CustomUserDetailsSerializer',
}
# ... linhas depois...
REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_HTTPONLY': False,
    'USER_DETAILS_SERIALIZER': 'inventario.serializers.CustomUserDetailsSerializer',
}  # ← Esta sobrescrevia a primeira, removendo JWT_AUTH_COOKIE/JWT_AUTH_REFRESH_COOKIE
```

**Impacto:** A segunda definição sobrescrevia a primeira, removendo campos críticos de JWT.

### 2. dj-rest-auth Tentando Fazer django_login() (Commit: d7dd9b0)
Quando `SESSION_LOGIN` não era especificado, o dj-rest-auth tentava executar `django_login()`, que requer session middleware. Isso causava:
```
AttributeError: 'Request' object has no attribute 'session'
```
Resultado: Erro 400 genérico retornado ao cliente.

## Solução Implementada

### Arquivo: `src/backend/config/settings.py`

**Antes:**
```python
REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_COOKIE': 'jwt-auth',
    'JWT_AUTH_REFRESH_COOKIE': 'jwt-refresh',
    'JWT_AUTH_HTTPONLY': False,
    'USER_DETAILS_SERIALIZER': 'inventario.serializers.CustomUserDetailsSerializer',
}
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# CONFIGURAÇÃO DUPLICADA E ERRADA
REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_HTTPONLY': False,
    'USER_DETAILS_SERIALIZER': 'inventario.serializers.CustomUserDetailsSerializer',
}
```

**Depois:**
```python
REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_COOKIE': 'jwt-auth',
    'JWT_AUTH_REFRESH_COOKIE': 'jwt-refresh',
    'JWT_AUTH_HTTPONLY': False,
    'USER_DETAILS_SERIALIZER': 'inventario.serializers.CustomUserDetailsSerializer',
    'SESSION_LOGIN': False,  # ← Novo: desabilita django_login() quando usando JWT
}
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

## Verificação de Funcionamento

### Teste 1: Login com usuário admin_oto
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@oto.com","password":"senha"}'

# ✅ Resposta: HTTP 200 OK com tokens JWT
# {
#   "access": "eyJhbGc...",
#   "refresh": "eyJhbGc...",
#   "user": {"id": 5, "username": "admin@oto.com", ...}
# }
```

### Teste 2: Criar novo usuário e fazer login
```bash
# 1. Login como superuser
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -d '{"username":"admindjango@oto.com","password":"senha"}' | jq -r '.access')

# 2. Criar novo usuário
curl -X POST http://localhost:8000/api/auth/cadastrar-usuario/ \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"email":"novo@teste.com","password":"SenhaForte123!","tipo_usuario":"admin_oto"}'

# 3. Fazer login com novo usuário
curl -X POST http://localhost:8000/api/auth/login/ \
  -d '{"username":"novo@teste.com","password":"SenhaForte123!"}'

# ✅ Resposta: HTTP 200 OK com tokens JWT
```

## Commits Relacionados
- `4d4c57c` - Remove duplicate REST_AUTH configuration
- `d7dd9b0` - Disable session login in dj-rest-auth for JWT-only auth

## Notas de Produção
1. **Limpe o cache do navegador** se ainda vir erros após atualizar o código
2. **Reinicie o servidor Django** após fazer o merge dos commits
3. A configuração `'SESSION_LOGIN': False` é segura pois o sistema usa JWT, não sessions

## Recomendações Futuras
1. Implementar testes de integração para o endpoint de login
2. Considerar usar `.env` ou `settings.local.py` para evitar duplicações em settings.py
3. Adicionar logging detalhado para erros de autenticação (sem expor credenciais)

---
**Data:** 2026-06-24  
**Status:** ✅ Resolvido e Testado  
**Desenvolvedor:** Senior Developer
