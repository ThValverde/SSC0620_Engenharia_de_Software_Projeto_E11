# Implementação de RBAC e Integração Frontend-Backend

## 📋 Visão Geral

Este documento descreve a implementação de:
- **Autenticação JWT** com axios interceptor
- **Controle de Acesso Baseado em Papéis (RBAC)**
- **Roteamento Inteligente** pós-login
- **Componentes RBAC** para UI dinâmica
- **Telas Mockadas** para MVP
- **Componente Tooltip** para ajuda contextual

## 🔐 Arquitetura de Segurança

### 1. Serviço de API (`src/app/services/api.ts`)

**Responsabilidades:**
- Centralizar todas as chamadas à API
- Gerenciar tokens JWT (access + refresh)
- Interceptar requisições para adicionar token Bearer
- Renovar token automaticamente em caso de 401
- Limpar tokens e redirecionar em caso de falha

**Uso:**
```typescript
import { apiService } from '@/app/services/api';

// Login
const response = await apiService.login(email, password);

// Requisições autenticadas (token adicionado automaticamente)
const users = await apiService.listUsers();

// Criar usuário
await apiService.createUser({ email, username, password, groups: [] });

// Update resource (para Dashboard)
await apiService.updateResource('/endpoint', data);
```

### 2. Contexto de Autenticação (`src/app/contexts/AuthContext.tsx`)

**Fornece:**
- Estado global de autenticação (user, isAuthenticated, isLoading)
- Funções RBAC para verificações de acesso
- Métodos de login/logout

**Métodos RBAC:**
```typescript
const { 
  isSuperuser,           // is_superuser: true
  isSecretariaAdmin,     // Secretaria_Admin group
  isSecretariaStaff,     // Secretaria_Staff group
  isTradeUser,           // Usuário Trade (sem grupos)
  getRoleLevel,          // Nível numérico (4=admin, 1=trade)
  canCreateUser,         // Pode criar tipo X?
  canAccessModule,       // Pode acessar módulo?
  hasGroup,              // Tem group?
} = useAuth();
```

**Hierarquia de Papéis:**
```
Level 4: Superuser (Admin Django) → is_superuser: true
Level 3: Secretaria_Admin (Admin OTO) → groups: ['Secretaria_Admin']
Level 2: Secretaria_Staff (Staff OTO) → groups: ['Secretaria_Staff']
Level 1: Trade User → groups: [] (ou vínculo de estabelecimento)
```

### 3. Proteção de Rotas (`src/app/components/ProtectedRoute.tsx`)

**ProtectedRoute:**
- Verifica autenticação
- Valida papéis permitidos
- Redireciona não autenticados para /login
- Mostra loading durante verificação

**SmartRedirectRoute:**
- Redireciona baseado em papel após login
- Trade → `/portal-trade`
- Admins/Staff → `/dashboard`

**Uso:**
```typescript
<ProtectedRoute allowedRoles={['Secretaria_Admin', 'Secretaria_Staff']}>
  <Dashboard />
</ProtectedRoute>

<SmartRedirectRoute>
  <Dashboard />
</SmartRedirectRoute>
```

## 🎨 Componentes RBAC

### 1. Modal de Gestão de Usuários (`UserManagementModal.tsx`)

**Visibilidade:**
- Apenas Admin Django, Admin OTO, Staff OTO (não Trade)

**Dropdown de Tipo Filtrado:**
- Admin Django → pode criar Secretaria_Admin
- Admin OTO → pode criar Secretaria_Staff, Trade
- Staff OTO → pode criar Trade

**Campos de Trade:**
- ID do Estabelecimento
- Nível de Permissão (Visualizador, Editor, Gerenciador)

**Uso:**
```typescript
import { UserManagementModal } from '@/app/components/UserManagementModal';

// Adiciona ao Dashboard/Sidebar
<UserManagementModal />
```

### 2. Tooltip de Ajuda (`HelpTooltip.tsx`)

**Componentes:**
- `HelpTooltip`: Ícone "i" com tooltip ao hover
- `LabelWithHelp`: Label + tooltip integrados

**Características:**
- Posicionamento inteligente (evita cortes de viewport)
- Delay customizável (padrão 200ms)
- Suporta 4 direções: top, bottom, left, right
- Z-index elevado para ficar acima de modais

**Uso:**
```typescript
import { HelpTooltip, LabelWithHelp } from '@/app/components/HelpTooltip';

<LabelWithHelp 
  label="Tipo de Usuário"
  tooltip="Selecione o perfil de acesso"
  htmlFor="user-type"
/>

<HelpTooltip text="Texto explicativo" side="top" />
```

### 3. Páginas Mockadas (`MockPage.tsx`)

**Uso:**
```typescript
import { MockPage } from '@/app/components/MockPage';

export function CruzamentoDados() {
  return (
    <MockPage
      title="Cruzamento de Dados"
      description="Consultas avançadas de dados"
      icon={<Database className="w-16 h-16 text-blue-500" />}
      message="Módulo em desenvolvimento"
    />
  );
}
```

## 🔄 Fluxo de Autenticação

### Login (POST /api/auth/login/)
```
User input → LoginPage → apiService.login() → API
↓
Response: { access, refresh, user } → localStorage
↓
setUser() → AuthContext atualizado
↓
SmartRedirectRoute → /dashboard (admin) ou /portal-trade (trade)
```

### Token Refresh (Automático)
```
Request com 401 → Interceptor → apiService.refreshAccessToken()
↓
POST /api/auth/token/refresh/ com refresh token
↓
Nova access token armazenada
↓
Request original retentada
```

### Logout
```
User clica "Sair" → apiService.logout()
↓
localStorage limpo
↓
navigate(/login)
```

## 📱 Controle de Acesso por Módulo

| Módulo | Superuser | Sec Admin | Sec Staff | Trade |
|--------|:---------:|:---------:|:---------:|:-----:|
| Dashboard | ✅ | ✅ | ✅ | ❌ |
| Inventário | ✅ | ✅ | ✅ | ❌ |
| **Gestão Users** | ✅ | ✅ | ✅ | ❌ |
| Importação | ✅ | ✅ | ✅ | ❌ |
| Cruzamento | ✅ | ✅ | ✅ | ❌ |
| Histórico | ✅ | ✅ | ✅ | ❌ |
| Portal Trade | ✅ | ✅ | ✅ | ✅ |

## 🚀 Configuração do Ambiente

### 1. Instalar Dependências
```bash
cd src/frontend
npm install
# ou
pnpm install
```

### 2. Variáveis de Ambiente (`.env.local`)
```env
VITE_API_URL=http://localhost:8000/api
```

### 3. Executar Development
```bash
npm run dev
```

## 📝 Integração com Dashboard

### Exemplo: Salvar Alterações
```typescript
import { apiService } from '@/app/services/api';

async function handleSave(data: any) {
  try {
    await apiService.updateResource('/dashboard/update', data);
    // Toast de sucesso é exibido automaticamente
  } catch (error) {
    // Toast de erro é exibido automaticamente
  }
}
```

## 🔗 Endpoints Esperados do Backend

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login/` | Login e retorna tokens |
| POST | `/api/auth/token/refresh/` | Renova access token |
| GET | `/api/auth/user/` | Obtém dados do usuário |
| POST | `/api/users/` | Cria novo usuário |
| GET | `/api/users/` | Lista usuários |
| PATCH | `/api/users/{id}/` | Atualiza usuário |
| DELETE | `/api/users/{id}/` | Deleta usuário |
| PATCH | `/api/*` | Endpoints específicos do recurso |

## 🧪 Testando RBAC

### Criar usuários de teste no backend:
```python
# Admin OTO
User.objects.create_user(
    email='admin@oto.com',
    username='admin_oto',
    password='senha123'
)
admin_user.groups.add(Group.objects.get(name='Secretaria_Admin'))

# Staff OTO
User.objects.create_user(
    email='staff@oto.com',
    username='staff_oto',
    password='senha123'
)
staff_user.groups.add(Group.objects.get(name='Secretaria_Staff'))

# Trade User
User.objects.create_user(
    email='trade@user.com',
    username='trade_user',
    password='senha123'
)
```

### Testar no Frontend:
1. Login como cada tipo de usuário
2. Verificar redirecionamento correto
3. Verificar visibilidade do menu (Gestão Users)
4. Testar criação de usuários com dropdown filtrado

## 🐛 Troubleshooting

### Problema: "useAuth must be used within AuthProvider"
**Solução:** Certifique-se que `AuthProvider` envolve `RouterProvider` em `App.tsx`

### Problema: Token não é enviado nas requisições
**Solução:** Verificar se `apiService.isAuthenticated()` retorna true, e se localStorage contém `access_token`

### Problema: Login redireciona para login novamente
**Solução:** Verificar se API está retornando `{ access, refresh, user }` corretamente

### Problema: Dropdown vazio no modal de usuários
**Solução:** Verificar `canCreateUser()` baseado no papel do usuário atual

## 📚 Referências

- [React Router v7 Docs](https://reactrouter.com/)
- [JWT Authentication Pattern](https://tools.ietf.org/html/rfc7519)
- [Radix UI Components](https://www.radix-ui.com/)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
