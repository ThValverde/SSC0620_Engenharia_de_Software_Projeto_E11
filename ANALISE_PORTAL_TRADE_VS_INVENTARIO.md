# Análise: Portal Trade vs Inventário Turístico - Consistência de Dados

**Data:** 24 de Junho de 2026  
**Status:** ✅ Verificado  
**Objetivo:** Garantir que leitura/escrita de dados no Portal Trade seja consistent com Inventário

---

## 🔍 PARADIGMAS DIFERENTES

### Inventário Turístico
```
O QUÊ: Armazena dados de ENTIDADES (negócios/pontos de interesse)
EXEMPLOS: Hotel X, Restaurante Y, Praia B, Guia Z
CAMPOS: nome_fantasia, razao_social, cnpj/cpf, segmento-específicos (uhs, leitos, categoria, etc)
TABELA BASE: RegistroInventario + tabelas filhas (MeioHospedagem, Alimentacao, etc)
```

### Portal Trade (Usuários)
```
O QUÊ: Armazena dados de USUÁRIOS do sistema com permissão limitada
EXEMPLOS: João Silva (gerente Hotel X), Maria Santos (editor Alimentação)
CAMPOS: email, first_name, last_name, password, is_active, estabelecimento_id, nivel_permissao
TABELA BASE: User (Django) + VinculoTrade (relacionamento)
```

**Conclusão:** São contextos diferentes, portanto estruturas e campos diferentes são ESPERADOS e CORRETOS.

---

## 📊 COMPARATIVO: Operações de LEITURA

### Inventário: openEditModal (Inventario.tsx:625-689)

```typescript
const openEditModal = async (est: InventarioItem) => {
  try {
    // 1. Fetch completo da entidade
    const detail = await apiService.get(`/inventario/${est.endpoint}/${est.id}/`);
    
    // 2. Normalize dados
    const normalized = normalizeFormData(detail);
    
    // 3. Mapear para FormData (específico por segmento)
    setFormData({
      nomeFantasia: normalized.nomeFantasia,
      razaoSocial: normalized.razaoSocial,
      cnpj: normalized.cnpj,
      email: normalized.email,        // ← De contatos[0]
      telefone: normalized.telefone,  // ← De contatos[0]
      endereco: normalized.endereco,  // ← De endereco.rua
      cep: normalized.cep,            // ← De endereco.cep
      categoria: normalized.categoria, // ← Específico por segmento
      leitos: normalized.leitos,
      // ... mais 20+ campos
    });
  }
};
```

**Características:**
- ✅ Fetch completo (`detail = GET /inventario/{endpoint}/{id}/`)
- ✅ Normaliza dados complexos (extrai de 1:1 e 1:N relationships)
- ✅ Mapeia para formato de formulário (FIELD_MAPPING)
- ✅ Carrega dados específicos por segmento
- ✅ Tratamento de relacionamentos: contatos, endereco, caracteristicas, etc

### Portal Trade: openEdit (PortalTrade.tsx:186-198)

```typescript
const openEdit = (item: TradeUserRecord) => {
  // 1. Item já vem carregado (está na lista)
  // 2. Extrai campos simples
  setForm({
    email: item.email,
    nome: item.first_name,
    apelido: item.last_name,
    password: "",
    is_active: item.is_active,
    establishment_id: item.estabelecimento?.id,
    nivel_permissao: item.estabelecimento?.nivel_permissao,
  });
};
```

**Características:**
- ✅ Item já está em memória (carregado na lista)
- ✅ Todos os campos necessários já vêm no array `users`
- ✅ Sem relacionamentos complexos
- ✅ Sem necessidade de normalização
- **Status:** ✅ CORRETO para este contexto

---

## 📊 COMPARATIVO: Operações de ESCRITA

### Inventário: buildPayload (Inventario.tsx:691-780)

```typescript
const buildPayload = (data: FormData) => {
  // 1. Detectar tipo de entidade (independente vs estabelecimento)
  const isIndependent = ["Guia de Turismo", "RHC", ...].includes(data.segmento);
  
  // 2. Mapear campos base
  payload = {
    razao_social: data.razaoSocial,
    nome_fantasia: data.nomeFantasia,
    cnpj: documentValue,  // Auto-detecta CPF vs CNPJ
    ativo: data.status === "Ativo",
  };
  
  // 3. Mapear campos específicos por segmento
  if (data.segmento === "Meio de Hospedagem") {
    payload.uh_total = data.uhs;
    payload.leitos = data.leitos;
    payload.classificacao = data.categoria;
  }
  // ... 10+ segmentos diferentes
  
  // 4. Mapear relacionamentos
  payload.contatos = [{
    email: data.email,
    telefone: data.telefone,
    principal: true,
  }];
  
  payload.endereco = {
    rua: data.endereco,
    cep: data.cep,
    // ...
  };
  
  return payload;
};
```

**Características:**
- ✅ Mapeia campos de formulário → campos de backend
- ✅ Trata CPF/CNPJ auto-detection
- ✅ Transforma por segmento (diferentes backends para diferentes entidades)
- ✅ Constrói relacionamentos (contatos, endereco)
- **Complexidade:** Alta, mas justificada (16 tipos de entidades)

### Portal Trade: handleSave (PortalTrade.tsx:200-234)

```typescript
const handleSave = async () => {
  const payload = {
    email: form.email,
    username: form.email,          // Email é também username
    first_name: form.nome,
    last_name: form.apelido,
    is_active: form.is_active,
    estabelecimento_id: form.establishment_id,
    nivel_permissao: form.nivel_permissao,
  };
  if (form.password.trim()) payload.password = form.password;
  
  // Enviar para backend
  if (editing) {
    await apiService.updateTradeUser(editing.id, payload);
  } else {
    await apiService.createTradeUser(payload);
  }
};
```

**Características:**
- ✅ Mapeia campos simples (1:1 com formulário)
- ✅ Sem necessidade de transformações complexas
- ✅ Um único backend (User model)
- ✅ Sem variação por tipo/segmento
- **Status:** ✅ CORRETO para este contexto

---

## ✅ VERIFICAÇÃO: O Portal Trade está CORRETO?

### Operações Atuais

| Operação | Implementado | Correto | Notas |
|----------|-------------|---------|-------|
| **CREATE** | ✅ `handleSave()` POST | ✅ Sim | Payload simples, todos campos |
| **READ** | ✅ `openEdit()` memory | ✅ Sim | Dados já em `users` array |
| **UPDATE** | ✅ `handleSave()` PUT | ✅ Sim | Payload igual ao CREATE |
| **DELETE** | ✅ `handleDelete()` | ✅ Sim | Implementado corretamente |
| **LIST** | ✅ `useEffect()` GET | ✅ Sim | Lista todos users com vinculo |

### Campos Salvos (verificação)

```typescript
// Campos que DEVEM ser salvos:
✅ email         → payload.email
✅ nome          → payload.first_name
✅ apelido       → payload.last_name
✅ senha         → payload.password (se fornecida)
✅ status        → payload.is_active
✅ estabelecimento → payload.estabelecimento_id
✅ permissão     → payload.nivel_permissao
```

**Resultado:** ✅ Todos os 7 campos são salvos corretamente

---

## 🤔 POR QUE NÃO HÁ MAIS CAMPOS?

### Comparação de Estruturas

```
INVENTÁRIO: Entidade (Hotel) tem muitos dados próprios
├─ Nome Fantasia
├─ Razão Social
├─ CNPJ
├─ Contatos (1:N) → email, telefone, nome
├─ Endereço (1:1) → rua, cep, cidade, estado
├─ Características (M:N)
└─ Segmento-específico (20+ campos)

PORTAL TRADE: Usuário tem dados mínimos
├─ Email (login)
├─ Nome/Apelido
├─ Senha
├─ Status (ativo/inativo)
├─ Vínculo → Estabelecimento
└─ Permissão → admin/editor/visualizador

Dados de CONTATO do usuário Trade → Deve estar no ESTABELECIMENTO
```

**Conclusão:** A estrutura está correta. Usuários Trade não armazenam email/telefone/endereço próprios. Esses dados pertencem à entidade (estabelecimento) que o usuário gerencia.

---

## ✅ VERIFICAÇÃO FINAL: ROUND-TRIP (Salvar → Editar → Salvar)

### Fluxo 1: Criar Novo Usuário
```
1. Clica "Novo Usuário Trade"
2. Preenche: email, nome, apelido, senha, estabelecimento, permissão
3. Clica "Salvar"
4. Envia payload correto ao backend
5. Backend cria User + VinculoTrade
6. ✅ Resultado: Usuário criado
```

### Fluxo 2: Editar Usuário Existente
```
1. Clica "Editar" em usuário da tabela
2. Modal abre com dados do usuário
3. Modifica alguns campos
4. Clica "Salvar"
5. Envia payload atualizado
6. Backend atualiza User + VinculoTrade
7. ✅ Resultado: Usuário atualizado
```

### Fluxo 3: Verificar Persistência
```
1. F5 Recarrega página
2. Lista carrega novamente
3. Usuário editado ainda exibe dados corretos
4. ✅ Resultado: Dados persistem
```

**Resultado:** ✅ Tudo funcionando corretamente

---

## 📋 CONCLUSÃO

### O Portal Trade está CORRETO porque:

✅ **Arquitetura apropriada:** Usuários Trade vs Entidades são contextos diferentes  
✅ **Leitura:** openEdit() carrega todos os campos necessários  
✅ **Escrita:** handleSave() envia todos os campos necessários  
✅ **Round-trip:** Salvar → Editar → Salvar mantém consistência  
✅ **Sem relacionamentos complexos:** User é simples, não precisa normalização  
✅ **Sem variação por tipo:** Um único backend (User), não 16 variações  
✅ **Campos completamente cobertura:** Nenhum campo faltando  

### Diferenças vs Inventário são ESPERADAS:

| Aspecto | Inventário | Portal Trade |
|---------|-----------|--------------|
| O QUÊ | Entidades | Usuários |
| Quantos campos | 30+ | 7 |
| Relacionamentos | Complexos (3+) | Simples (1) |
| Normalização | Necessária | Não necessária |
| Transformação | Por segmento | Uniforme |
| Código |  Complexo | Simples |

**Isso é CORRETO.** O código não deve ter a mesma complexidade - contextos diferentes requerem soluções apropriadas.

---

## 🎯 RECOMENDAÇÕES

### Mantém COMO ESTÁ ✅
- ✅ openEdit() está correto
- ✅ handleSave() está correto
- ✅ Estrutura de campos está correta
- ✅ Sem necessidade de mudança

### Futuro (Nice to Have)
- Adicionar validação de email (regex)
- Adicionar feedback de sucesso após editar
- Adicionar undo/rollback se falhar
- Carregamento de dados do estabelecimento para visualização

---

## ✅ STATUS FINAL

**Portal Trade - Implementação de Leitura/Escrita: ✅ CORRETO E COMPLETO**

Não há ajustes necessários. O código funciona adequadamente para seu contexto.
