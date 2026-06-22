# 🏗️ Arquitetura - RBAC & Integração Frontend-Backend

## Diagrama de Camadas

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Vite)                       │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌────────────────────────────────────────────────────────────┐
│  │                    PRESENTATION LAYER                      │
│  ├────────────────────────────────────────────────────────────┤
│  │  • Pages (Dashboard, PortalTrade, LoginPage, etc)         │
│  │  • Components (Sidebar, UserManagementModal, etc)         │
│  │  • UI Components (Button, Input, Dialog, etc)             │
│  └────────────────────────────────────────────────────────────┘
│                              ↓
│  ┌────────────────────────────────────────────────────────────┐
│  │                    BUSINESS LOGIC LAYER                    │
│  ├────────────────────────────────────────────────────────────┤
│  │  • AuthContext (RBAC, role checks, user state)            │
│  │  • ProtectedRoute (access control)                        │
│  │  • SmartRedirectRoute (conditional navigation)            │
│  │  • HelpTooltip (contextual help)                          │
│  │  • MockPage (MVP placeholders)                            │
│  └────────────────────────────────────────────────────────────┘
│                              ↓
│  ┌────────────────────────────────────────────────────────────┐
│  │                    API INTEGRATION LAYER                   │
│  ├────────────────────────────────────────────────────────────┤
│  │  • ApiService (HTTP client with JWT)                      │
│  │  • Axios Interceptors (auth, token refresh)               │
│  │  • Error handling & toast notifications                   │
│  │  • Token management (access, refresh, localStorage)       │
│  └────────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS/HTTP
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Django/DRF)                        │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌────────────────────────────────────────────────────────────┐
│  │                    API ENDPOINTS LAYER                     │
│  ├────────────────────────────────────────────────────────────┤
│  │  • /api/auth/login/        (POST, retorna access+refresh) │
│  │  • /api/auth/token/refresh/ (POST, renova token)          │
│  │  • /api/auth/user/         (GET, dados do usuário)        │
│  │  • /api/users/             (CRUD de usuários)             │
│  │  • /api/dashboard/         (PATCH para atualizações)      │
│  └────────────────────────────────────────────────────────────┘
│                              ↓
│  ┌────────────────────────────────────────────────────────────┐
│  │                    AUTH & PERMISSION LAYER                │
│  ├────────────────────────────────────────────────────────────┤
│  │  • JWT Validation (SimpleJWT)                             │
│  │  • Group-based Permissions (Secretaria_Admin, etc)        │
│  │  • Decorator @permission_required (viewsets)              │
│  │  • Superuser checks (is_superuser)                        │
│  └────────────────────────────────────────────────────────────┘
│                              ↓
│  ┌────────────────────────────────────────────────────────────┐
│  │                    BUSINESS LOGIC LAYER                    │
│  ├────────────────────────────────────────────────────────────┤
│  │  • Serializers (validação de dados)                       │
│  │  • ViewSets (lógica de API)                               │
│  │  • Managers (queries)                                     │
│  │  • Signals (hooks de negócio)                             │
│  └────────────────────────────────────────────────────────────┘
│                              ↓
│  ┌────────────────────────────────────────────────────────────┐
│  │                    DATA LAYER                              │
│  ├────────────────────────────────────────────────────────────┤
│  │  • Django ORM                                             │
│  │  • Models (User, Group, Estabelecimento, etc)             │
│  │  • Database (PostgreSQL/MySQL)                            │
│  └────────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────┘
```

## Fluxo de Autenticação Detalhado

```
┌─────────────┐
│    USER     │
└──────┬──────┘
       │ 1. Visita http://localhost:5173
       ↓
┌──────────────────┐
│  App Router      │
└──────┬───────────┘
       │ 2. Sem token em localStorage
       ↓
┌──────────────────┐      ┌────────────────────────┐
│  LoginPage       │◄─────┤ useAuth().isLoading?   │
└──────┬───────────┘      └────────────────────────┘
       │ 3. Submita email/password
       ↓
┌──────────────────────────────────────────┐
│ apiService.login(email, password)        │
└──────┬───────────────────────────────────┘
       │ 4. POST /api/auth/login/
       ↓
┌────────────────────┐
│  Backend           │ 5. Valida credenciais
│  Returns:          │
│  {                 │
│    access: "jwt",  │
│    refresh: "jwt", │
│    user: {...}     │
│  }                 │
└──────┬─────────────┘
       │ 6. Armazena em localStorage
       │    - access_token
       │    - refresh_token
       │    - user (JSON)
       ↓
┌──────────────────────────────────────────┐
│ AuthContext.setUser()                    │
│ Trigga re-render                         │
└──────┬───────────────────────────────────┘
       │ 7. SmartRedirectRoute lê user.groups
       ↓
  ┌─── is Trade user? ─────────────┐
  │ (groups.length === 0)           │
  │                                 │
  NO                              YES
  │                                 │
  ↓                                 ↓
┌─────────────────────┐  ┌──────────────────┐
│ /dashboard (Admin)  │  │ /portal-trade    │
│ Dashboard.tsx       │  │ PortalTrade.tsx  │
└─────────────────────┘  └──────────────────┘
```

## Fluxo de Renovação de Token

```
┌──────────────────────────────────┐
│  User faz request à API          │
│  (com access_token expirado)     │
└──────────────┬───────────────────┘
               │ 1. Incluir token no header:
               │    Authorization: Bearer <expired_token>
               ↓
┌──────────────────────────────────┐
│  Interceptor de Request           │
│  (apiService.setupInterceptors)  │
└──────────────┬───────────────────┘
               │ 2. Request feito com token
               ↓
┌──────────────────────────────────┐
│  Backend                          │
│  Responde: 401 Unauthorized       │
└──────────────┬───────────────────┘
               │ 3. Detectado 401
               ↓
┌──────────────────────────────────┐
│  Interceptor de Response          │
│  (refreshAccessToken)            │
└──────────────┬───────────────────┘
               │ 4. POST /api/auth/token/refresh/
               │    Body: { refresh: refresh_token }
               ↓
┌──────────────────────────────────┐
│  Backend                          │
│  Retorna novo access_token        │
└──────────────┬───────────────────┘
               │ 5. Armazena novo token
               │    localStorage.access_token = novo
               ↓
┌──────────────────────────────────┐
│  Retry request original           │
│  Com novo token válido            │
└──────────────┬───────────────────┘
               │ 6. Authorization: Bearer <novo_token>
               ↓
┌──────────────────────────────────┐
│  Backend                          │
│  Responde: 200 OK                 │
└──────────────────────────────────┘
```

## Hierarquia de RBAC - Decisão Tree

```
┌─────────────────────────────────────┐
│    Verificar Acesso a Recurso       │
└────────────┬────────────────────────┘
             │
             ↓
       ┌─────────────────┐
       │ is_superuser?   │
       └──┬──────────┬───┘
         SIM        NÃO
          │           │
          ↓           ↓
      ✅ Acesso   ┌─────────────────────────┐
                  │ Tem grupo                │
                  │ Secretaria_Admin?       │
                  └──┬──────────────────┬───┘
                    SIM               NÃO
                     │                  │
                     ↓                  ↓
                 ✅ Acesso         ┌──────────────────┐
                              │ Tem grupo            │
                              │ Secretaria_Staff?   │
                              └──┬───────────┬──────┘
                                SIM        NÃO
                                 │          │
                                 ↓          ↓
                             ✅ Acesso  ❌ Denied
                             (Level 2)  (Trade User)
                                      
┌──────────────────────────────────────────────────────┐
│              Matriz de Permissões                    │
├──────────────────────────────────────────────────────┤
│  Ação                │ Superuser │ Admin │ Staff │   │
│  ─────────────────────────────────────────────────   │
│  Ver Dashboard       │ ✅        │ ✅    │ ✅    │   │
│  Criar Usuário       │ ✅        │ ✅    │ ✅    │   │
│  Criar Admin         │ ✅        │ ❌    │ ❌    │   │
│  Criar Staff         │ ✅        │ ✅    │ ❌    │   │
│  Criar Trade         │ ✅        │ ✅    │ ✅    │   │
│  Deletar Usuário     │ ✅        │ ✅    │ ✅    │   │
│  Ver Importação      │ ✅        │ ✅    │ ✅    │   │
│  Acessar Portal      │ ✅        │ ✅    │ ✅    │   │
│  Editar Configs      │ ✅        │ ✅    │ ❌    │   │
└──────────────────────────────────────────────────────┘
```

## Componentes em Ação

### UserManagementModal Flowchart
```
┌──────────────────────────────────────┐
│  useAuth().canAccessModule('users')? │
└──┬───────────────────────────────┬───┘
   │                               │
  SIM                             NÃO
   │                               │
   ↓                               ↓
┌──────────────────┐        ❌ return null
│ Renderiza Modal  │        (Hidden)
└──────┬───────────┘
       │ Click "Novo Usuário"
       ↓
┌──────────────────────────────────────┐
│  getAvailableUserTypes()             │
│  Baseado em:                         │
│  - isSuperuser()                     │
│  - isSecretariaAdmin()               │
│  - isSecretariaStaff()               │
└──────┬───────────────────────────────┘
       │ Popula dropdown dinamicamente
       ↓
┌──────────────────────────────────────┐
│  User seleciona tipo                 │
└──────┬───────────────────────────────┘
       │ Se Trade? Mostra campos extras
       ↓
┌──────────────────────────────────────┐
│  User preenche form                  │
└──────┬───────────────────────────────┘
       │ Submit
       ↓
┌──────────────────────────────────────┐
│  apiService.createUser(userData)     │
│  Envia com header JWT                │
└──────┬───────────────────────────────┘
       │
      ┌─┴────────────────┐
      ↓                  ↓
    201                400/403/409
     │                  │
     ↓                  ↓
  ✅ Toast Sucesso  ❌ Toast Erro
  Fechar Modal      Exibe Mensagem
```

## Estrutura de Diretórios Criar

```
src/frontend/src/app/
├── services/
│   └── api.ts                 # Serviço centralizado de API
├── contexts/
│   └── AuthContext.tsx        # Context de autenticação + RBAC
├── components/
│   ├── ProtectedRoute.tsx     # Guards de rota
│   ├── HelpTooltip.tsx        # Componente tooltip
│   ├── UserManagementModal.tsx # Modal RBAC
│   ├── MockPage.tsx           # Placeholder para MVP
│   ├── Sidebar.tsx            # Atualizado com RBAC
│   ├── Layout.tsx             # Wrapper de layout
│   └── ui/                    # Componentes Radix (já existentes)
├── pages/
│   ├── LoginPage.tsx          # Nova página de login
│   ├── Dashboard.tsx          # Painel administrativo
│   ├── PortalTrade.tsx        # Portal para trade
│   ├── Inventario.tsx         # Gestão de inventário
│   ├── CruzamentoDados.tsx    # Mockada (em desenvolvimento)
│   ├── CentralImportacao.tsx  # Mockada (em desenvolvimento)
│   └── Historico.tsx          # Histórico
├── App.tsx                    # Root com AuthProvider
└── routes.tsx                 # Definição de rotas
```

## Fluxo de Dados com Redux DevTools

Se implementar Redux DevTools (opcional):

```
Timeline:
1. [USER] Navegar para /login
2. [ROUTE] ProtectedRoute detecta sem token
3. [AUTH] AuthContext: isLoading = true
4. [PAGE] LoginPage renderiza
5. [USER] Digita email e senha
6. [FORM] handleSubmit é chamado
7. [API] apiService.login() iniciado
8. [REQUEST] POST /api/auth/login/ enviado
9. [RESPONSE] { access, refresh, user } recebido
10. [AUTH] AuthContext.setUser() atualizado
11. [REDIRECT] SmartRedirectRoute lê user.groups
12. [ROUTE] Redireciona para /dashboard ou /portal-trade
13. [PAGE] Dashboard/PortalTrade renderiza
14. [SIDEBAR] Menu filtrado por RBAC
```

---

**Todos os arquivos estão prontos para integração com o backend! 🚀**
