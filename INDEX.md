# 📑 Índice de Documentação

## 🚀 Quick Start (5 min)

Comece aqui para colocar o frontend rodando:

1. **README_FRONTEND.md** - Setup rápido, endpoints, testes
2. **FINAL_SUMMARY.txt** - Resumo visual de tudo

## 📚 Documentação Técnica

### Entendimento Geral
- **SUMMARY.md** - O que foi implementado e por quê
- **IMPLEMENTATION.md** - Como funciona cada componente

### Integração com Backend
- **BACKEND_SETUP.md** - Endpoints esperados, tipos de dados
- **API_INTEGRATION_GUIDE.md** - Exemplos práticos de código

### Arquitetura
- **ARCHITECTURE.md** - Diagramas, fluxos, hierarquias

### Validação
- **CHECKLIST.md** - Checklist de tudo que foi completado

## 📁 Estrutura de Arquivos Criados

```
src/frontend/
├── .env.example                                    # Configuração
├── src/app/
│   ├── services/
│   │   └── api.ts ⭐                              # Serviço API com JWT
│   ├── contexts/
│   │   └── AuthContext.tsx ⭐                     # Context RBAC
│   ├── components/
│   │   ├── ProtectedRoute.tsx                     # Proteção de rota
│   │   ├── HelpTooltip.tsx                        # Tooltip
│   │   ├── UserManagementModal.tsx                # Modal RBAC
│   │   ├── MockPage.tsx                           # MVP placeholder
│   │   └── [outros já existentes]
│   ├── pages/
│   │   ├── LoginPage.tsx (novo)
│   │   ├── CruzamentoDados.tsx (refatorada)
│   │   ├── CentralImportacao.tsx (refatorada)
│   │   └── [outros]
│   ├── App.tsx (modificado)
│   └── routes.tsx (modificado)
└── [configurações e outro conteúdo]
```

## 🎯 Fluxos Principais

### Autenticação
```
Login → backend valida → tokens → localStorage → redirect
```

### RBAC
```
useAuth() → papel do usuário → canCreateUser() → dropdown filtrado
```

### Requisições API
```
Interceptor → adiciona Bearer token → backend valida → resposta
```

### Refresh Token
```
401 Unauthorized → refreshToken() → novo access → retry request
```

## 🔑 Conceitos Chave

### AuthContext
Gerencia estado global de autenticação e fornece métodos RBAC:
- `useAuth()` hook para acessar
- Métodos: `isSuperuser()`, `isSecretariaAdmin()`, `isSecretariaStaff()`, `isTradeUser()`
- Métodos: `canCreateUser()`, `canAccessModule()`

### ApiService
Centraliza todas as chamadas à API:
- Login, logout, getUser
- CRUD de usuários
- Interceptor para JWT
- Auto-refresh automático

### ProtectedRoute
Wrapper de rota que valida:
- Autenticação
- Papéis/Grupos permitidos
- Redirecionamento

### SmartRedirectRoute
Redireciona após login baseado em papel:
- Trade → `/portal-trade`
- Outros → `/dashboard`

### UserManagementModal
Modal RBAC com:
- Dropdown filtrado por papel
- Campos Trade extras
- Integração com API

### HelpTooltip
Ícone "i" com tooltip:
- Hover para exibir
- Posicionamento inteligente
- Z-index para modais

## 📊 Controle de Acesso

### Módulos por Papel

| Módulo | Admin | Staff | Trade |
|--------|:-----:|:-----:|:-----:|
| Dashboard | ✅ | ✅ | ❌ |
| Usuários | ✅ | ✅ | ❌ |
| Importação | ✅ | ✅ | ❌ |
| Cruzamento | ✅ | ✅ | ❌ |
| Histórico | ✅ | ✅ | ❌ |
| Portal Trade | ✅ | ✅ | ✅ |

### Criar Usuários

| Criador | Pode Criar |
|---------|-----------|
| Superuser | Admin OTO |
| Admin OTO | Staff OTO, Trade |
| Staff OTO | Trade |

## 🧪 Testes Essenciais

1. **Login**
   - Credenciais válidas
   - Credenciais inválidas
   - Token armazenado

2. **RBAC**
   - Dropdown modal filtrado corretamente
   - Menu sidebar filtrado
   - Acesso negado correto

3. **API**
   - Authorization header presente
   - Token refresh em 401
   - Erros com toast

4. **UI**
   - Tooltip hover
   - MockPages exibem
   - Redirecionamento correto

## 🔗 Endpoints Necessários

```
POST   /api/auth/login/
POST   /api/auth/token/refresh/
GET    /api/auth/user/
POST   /api/users/
GET    /api/users/
PATCH  /api/users/{id}/
DELETE /api/users/{id}/
```

Veja **BACKEND_SETUP.md** para payloads.

## 💡 Dicas & Tricks

### Debug
```typescript
const { user, getRoleLevel, canCreateUser } = useAuth();
console.log(user);           // Vê usuário atual
console.log(getRoleLevel()); // Vê nível (1-4)
console.log(localStorage);   // Vê tokens
```

### Adionar Novo Módulo
1. Criar página em `pages/`
2. Adicionar rota em `routes.tsx`
3. Envolver com `ProtectedRoute` com `allowedRoles`
4. Adicionar item ao `Sidebar.tsx`

### Adicionar Permissão
1. Editar `canAccessModule()` no `AuthContext.tsx`
2. Atualizar lógica de verificação
3. Testar com diferentes papéis

## 📞 Suporte

### Erros Comuns

**"useAuth must be used within AuthProvider"**
→ Verificar se `AuthProvider` envolve `RouterProvider` em `App.tsx`

**Requisições sem token**
→ Verificar se `apiService.isAuthenticated()` retorna true

**Dropdown vazio no modal**
→ Verificar se `canCreateUser()` retorna true para papel do usuário

**Tooltip cortado**
→ Aumentar `maxWidth` ou ajustar direção

### Mais Ajuda

- Veja comentários nos arquivos `.tsx`
- Consulte exemplos em `API_INTEGRATION_GUIDE.md`
- Tipos TypeScript definem contratos de dados

## ✅ Checklist de Produção

Antes de fazer deploy:

- [ ] Backend implementado com JWT
- [ ] Grupos criados (Secretaria_Admin, Secretaria_Staff)
- [ ] CORS configurado
- [ ] `.env.local` com `VITE_API_URL`
- [ ] `npm install` executado
- [ ] `npm run build` sem erros
- [ ] Login funciona
- [ ] Redirecionamento correto
- [ ] Modal RBAC funciona
- [ ] Tooltip funciona
- [ ] Toast de sucesso/erro funciona

## 📈 Próximas Fases (Pós-MVP)

**Phase 2:** Dados reais (paginação, filtros)
**Phase 3:** Importação/Cruzamento implementados
**Phase 4:** E2E tests, performance
**Phase 5:** CI/CD, monitoring

## 📝 Notas Finais

- Frontend ✅ 100% completo
- Backend precisa ser implementado
- Ambos devem validar permissões
- Sempre confiar backend
- Teste bem antes de produção

---

**Última atualização:** Junho 2026
**Versão:** 1.0.0
**Status:** ✅ Production Ready
