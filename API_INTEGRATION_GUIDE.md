# Guia: Integração de API com Componentes Existentes

## 📌 Exemplo 1: Adicionar Botão "Novo Usuário" ao Dashboard

```typescript
import { UserManagementModal } from '../components/UserManagementModal';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const { canAccessModule } = useAuth();

  return (
    <div>
      {/* Cabeçalho com botão */}
      <div className="flex justify-between items-center mb-6">
        <h1>Dashboard</h1>
        {canAccessModule('users') && <UserManagementModal />}
      </div>

      {/* Resto do Dashboard */}
    </div>
  );
}
```

## 📌 Exemplo 2: Chamar API no Save Modal

```typescript
import { apiService } from '../services/api';
import { toast } from 'sonner';

async function handleSaveChanges(formData: any) {
  try {
    // Mostrar loading
    setIsSubmitting(true);

    // Fazer request PATCH
    await apiService.updateResource('/dashboard/update', formData);

    // Toast automático de sucesso via interceptor
    setIsOpen(false);
  } catch (error) {
    // Toast de erro também é automático
  } finally {
    setIsSubmitting(false);
  }
}
```

## 📌 Exemplo 3: Listar e Deletar Usuários

```typescript
import { apiService } from '../services/api';

async function loadUsers() {
  try {
    const users = await apiService.listUsers();
    setUsers(users);
  } catch (error) {
    console.error('Failed to load users:', error);
  }
}

async function handleDeleteUser(userId: number) {
  if (confirm('Tem certeza?')) {
    try {
      await apiService.deleteUser(userId);
      // Recarregar lista
      await loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  }
}
```

## 📌 Exemplo 4: Validar Permissão Antes de Renderizar

```typescript
import { useAuth } from '../contexts/AuthContext';

export function AdminPanel() {
  const { isSuperuser, isSecretariaAdmin, canAccessModule } = useAuth();

  // Renderização condicional
  return (
    <div>
      {canAccessModule('users') && (
        <section>
          <h2>Gestão de Usuários</h2>
          {/* Conteúdo */}
        </section>
      )}

      {(isSuperuser() || isSecretariaAdmin()) && (
        <section>
          <h2>Configurações Avançadas</h2>
          {/* Conteúdo */}
        </section>
      )}
    </div>
  );
}
```

## 📌 Exemplo 5: Usar Tooltip em Campos Complexos

```typescript
import { LabelWithHelp, HelpTooltip } from '../components/HelpTooltip';

export function AdvancedForm() {
  return (
    <form>
      <LabelWithHelp
        label="Nível de Permissão"
        tooltip="Define o que este usuário pode fazer. Viewer: apenas leitura. Editor: pode modificar dados. Manager: controle total."
        htmlFor="permission"
      />
      <select id="permission">
        <option>Visualizador</option>
        <option>Editor</option>
        <option>Gerenciador</option>
      </select>

      <div className="flex items-center gap-2">
        <label>ID do Estabelecimento</label>
        <HelpTooltip 
          text="Código único que identifica o estabelecimento. Obtido no Cadastur ou Sistema OTO."
          side="right"
        />
      </div>
    </form>
  );
}
```

## 📌 Exemplo 6: Proteger Rotas Administrativas

```typescript
// Em routes.tsx
{
  path: "admin-panel",
  Component: () => (
    <ProtectedRoute allowedRoles={['Secretaria_Admin']}>
      <AdminPanel />
    </ProtectedRoute>
  ),
},

// Ou proteger dentro do componente
export function AdminPanel() {
  const { isSecretariaAdmin } = useAuth();

  if (!isSecretariaAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <div>Admin Content</div>;
}
```

## 🔄 Fluxo Típico de uma Operação

```
1. User clica em "Salvar"
   ↓
2. handleSubmit() é chamado
   ↓
3. setIsSubmitting(true) → desabilita botões
   ↓
4. apiService.updateResource() chamado
   ↓
5. Interceptor adiciona Bearer token automaticamente
   ↓
6. Backend processa e retorna 200 ou erro
   ↓
7. Toast de sucesso ou erro exibido automaticamente
   ↓
8. Modal fechado (se sucesso)
   ↓
9. setIsSubmitting(false) → reabilita UI
```

## 🚨 Tratamento de Erros Padronizado

```typescript
try {
  await apiService.login(email, password);
  // Sucesso → automaticamente toast.success() é chamado
} catch (error) {
  // Erro → automaticamente toast.error() é chamado
  // Aqui você pode fazer lógica adicional se necessário
}

// Para erros mais específicos:
try {
  await apiService.createUser(userData);
} catch (error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.detail;
    
    if (status === 400) {
      // Validação falhou
    } else if (status === 403) {
      // Sem permissão
    } else if (status === 409) {
      // Email já existe
    }
  }
}
```

## 🔐 Segurança: O que NÃO fazer

❌ **Não armazene token em cookie sem HttpOnly**
✅ localStorage é ok para SPA, mas considere httpOnly cookies para produção

❌ **Não coloque dados sensíveis em querystring**
✅ Use POST/PATCH em request body

❌ **Não valide permissões apenas no frontend**
✅ Backend SEMPRE deve validar! Frontend é apenas UX

❌ **Não ignore 401 responses**
✅ Sempre limpe tokens e redirecione para login

## 📊 Debugging

```typescript
// Ver usuário atual
const { user } = useAuth();
console.log(user); // { id, username, email, is_superuser, groups }

// Ver se autenticado
const { isAuthenticated } = useAuth();
console.log(isAuthenticated);

// Ver nível de acesso
const { getRoleLevel, isSuperuser } = useAuth();
console.log(getRoleLevel()); // 1-4

// Ver permissões específicas
const { canAccessModule, canCreateUser } = useAuth();
console.log(canAccessModule('users')); // true/false
console.log(canCreateUser('Trade')); // true/false

// Ver token no localStorage
console.log(localStorage.getItem('access_token'));
```

## 🧪 Teste Rápido de Integração

```bash
# 1. Inicie o backend em http://localhost:8000
# 2. Configure VITE_API_URL em .env.local
# 3. Execute o frontend
npm run dev

# 4. Abra DevTools (F12)
# 5. Vá para Network tab
# 6. Faça login
# 7. Veja requests ir para API com Authorization header

# 8. Verifique localStorage
localStorage
// access_token: "eyJ0eXAi..."
// refresh_token: "..."
// user: "{...}"
```
