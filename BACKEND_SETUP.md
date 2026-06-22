# 🚀 Próximos Passos - Integração Backend

## Backend: Configuração Necessária

### 1. Grupos de Usuários (Django)
```python
from django.contrib.auth.models import Group

# Criar grupos
groups_data = [
    'Secretaria_Admin',
    'Secretaria_Staff',
]

for group_name in groups_data:
    Group.objects.get_or_create(name=group_name)
```

### 2. Endpoints JWT Esperados

#### POST `/api/auth/login/`
**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "usuario",
    "email": "usuario@example.com",
    "is_superuser": false,
    "first_name": "João",
    "last_name": "Silva",
    "groups": ["Secretaria_Admin"]
  }
}
```

#### POST `/api/auth/token/refresh/`
**Request:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### GET `/api/auth/user/`
**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response (200):**
```json
{
  "id": 1,
  "username": "usuario",
  "email": "usuario@example.com",
  "is_superuser": false,
  "first_name": "João",
  "last_name": "Silva",
  "groups": ["Secretaria_Admin"]
}
```

### 3. Endpoint de Usuários

#### POST `/api/users/`
**Request:**
```json
{
  "email": "novo@example.com",
  "username": "novo_usuario",
  "password": "senha_segura",
  "first_name": "Maria",
  "last_name": "Santos",
  "groups": ["Secretaria_Staff"]
}
```

**Response (201):**
```json
{
  "id": 2,
  "email": "novo@example.com",
  "username": "novo_usuario",
  "first_name": "Maria",
  "last_name": "Santos",
  "is_superuser": false,
  "groups": ["Secretaria_Staff"]
}
```

#### GET `/api/users/`
**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "username": "usuario1",
    "email": "user1@example.com",
    "is_superuser": false,
    "groups": ["Secretaria_Admin"]
  },
  {
    "id": 2,
    "username": "usuario2",
    "email": "user2@example.com",
    "is_superuser": false,
    "groups": ["Secretaria_Staff"]
  }
]
```

#### PATCH `/api/users/{id}/`
**Request:**
```json
{
  "first_name": "Maria Atualizada",
  "groups": ["Secretaria_Staff"]
}
```

**Response (200):**
```json
{
  "id": 2,
  "username": "usuario2",
  "email": "user2@example.com",
  "first_name": "Maria Atualizada",
  "is_superuser": false,
  "groups": ["Secretaria_Staff"]
}
```

#### DELETE `/api/users/{id}/`
**Response (204):** No content

### 4. Tratamento de Erros Esperado

**400 Bad Request:**
```json
{
  "detail": "Dados inválidos",
  "field_errors": {
    "email": "Este email já está registrado"
  }
}
```

**401 Unauthorized:**
```json
{
  "detail": "Token inválido ou expirado"
}
```

**403 Forbidden:**
```json
{
  "detail": "Você não tem permissão para acessar este recurso"
}
```

**404 Not Found:**
```json
{
  "detail": "Recurso não encontrado"
}
```

---

## Frontend: Inicialização

### 1. Configurar Variáveis de Ambiente
```bash
# .env.local
VITE_API_URL=http://localhost:8000/api
```

### 2. Instalar Dependências
```bash
cd src/frontend
npm install
```

### 3. Executar Development
```bash
npm run dev
# Acessa em http://localhost:5173
```

### 4. Testar Fluxo Completo

1. Abra http://localhost:5173
2. Você será redirecionado para `/login`
3. Faça login com credenciais do backend
4. Verifique redirecionamento baseado em papel
5. Abra DevTools (F12) → Network → veja requests com header Authorization
6. Verifique localStorage para tokens

---

## Checklist de Implementação Backend

### Autenticação
- [ ] Implementar JWT com `djangorestframework-simplejwt`
- [ ] POST `/api/auth/login/` retorna `{ access, refresh, user }`
- [ ] POST `/api/auth/token/refresh/` renova token
- [ ] GET `/api/auth/user/` retorna dados do usuário autenticado
- [ ] Validar grupos do usuário em `user.groups`

### Usuários
- [ ] POST `/api/users/` cria novo usuário
- [ ] GET `/api/users/` lista usuários com permissão
- [ ] PATCH `/api/users/{id}/` atualiza usuário
- [ ] DELETE `/api/users/{id}/` deleta usuário
- [ ] Validar RBAC em cada endpoint

### CORS
- [ ] Configurar CORS para aceitar requests do frontend (http://localhost:5173)
- [ ] Headers necessários: Content-Type, Authorization

### Permissões
- [ ] Apenas Admins/Staff podem criar usuários
- [ ] Admins podem criar qualquer tipo
- [ ] Staff pode criar apenas Trade
- [ ] Usuários Trade têm acesso limitado

---

## Testing: Criar Usuários de Teste

### Django Shell
```python
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

User = get_user_model()

# Criar Superuser
User.objects.create_superuser(
    username='admin_django',
    email='admin@django.com',
    password='senha123'
)

# Criar Admin OTO
admin_user = User.objects.create_user(
    username='admin_oto',
    email='admin@oto.com',
    password='senha123',
    first_name='João',
    last_name='Admin'
)
admin_user.groups.add(Group.objects.get(name='Secretaria_Admin'))

# Criar Staff OTO
staff_user = User.objects.create_user(
    username='staff_oto',
    email='staff@oto.com',
    password='senha123',
    first_name='Maria',
    last_name='Staff'
)
staff_user.groups.add(Group.objects.get(name='Secretaria_Staff'))

# Criar Trade User
trade_user = User.objects.create_user(
    username='trade_user',
    email='trade@user.com',
    password='senha123',
    first_name='Pedro',
    last_name='Trade'
)
# Trade users têm groups vazio por padrão
```

---

## Como o Frontend Funciona

### Fluxo de Autenticação
```
1. User acessa http://localhost:5173
   ↓
2. ProtectedRoute verifica localStorage.access_token
   ↓
3. Se não há token → redireciona para /login
   ↓
4. User submete email/password
   ↓
5. apiService.login() faz POST /api/auth/login/
   ↓
6. Backend valida e retorna { access, refresh, user }
   ↓
7. Frontend armazena tokens em localStorage
   ↓
8. SmartRedirectRoute lê user.groups:
   - Vazio ou Trade → redireciona para /portal-trade
   - Secretaria_Admin ou Secretaria_Staff → redireciona para /dashboard
   - is_superuser: true → redireciona para /dashboard
```

### Interceptor de Requisições
```
1. Todo request para API
   ↓
2. Interceptor adiciona: Authorization: Bearer <access_token>
   ↓
3. Backend valida token e processa request
   ↓
4. Se status 401 → Interceptor chama POST /api/auth/token/refresh/
   ↓
5. Nova access_token armazenada
   ↓
6. Request original retentada com novo token
```

### Modal de Usuários
```
1. Admin clica em "Novo Usuário"
   ↓
2. UserManagementModal abre
   ↓
3. Dropdown mostra apenas tipos que este usuário pode criar
   ↓
4. Se Trade: exibe campos extra (establishment_id, permission_level)
   ↓
5. Submit → apiService.createUser()
   ↓
6. POST /api/users/ com dados
   ↓
7. Backend cria usuário e adiciona ao grupo correto
   ↓
8. Toast de sucesso/erro
```

---

## Deployment

### Frontend
```bash
npm run build
# Gera dist/ com assets estáticos
# Deploy para: Vercel, Netlify, S3 + CloudFront, etc.
```

### Configuração de Produção
```env
VITE_API_URL=https://api.exemplo.com/api
```

---

## Suporte e Documentação

- **IMPLEMENTATION.md** - Documentação técnica completa
- **API_INTEGRATION_GUIDE.md** - Exemplos de integração
- **SUMMARY.md** - Resumo de tudo que foi implementado

---

## 📞 Contato

Para questões técnicas sobre a implementação, consulte os arquivos `.tsx` que possuem comentários explicativos.

**Status:** ✅ Frontend Pronto - Aguardando Backend
**Data:** Junho 2026
**Versão:** 1.0.0
